import "server-only";

import { pool as defaultPool } from "@/lib/db/pool";

type ExpiredSubscription = {
  id: string;
  plan_code: string;
  billing_scope: "personal" | "organisation";
  user_id: number | null;
  organisation_id: string | null;
  grace_period_ends_at: Date;
};

export type ExpireGracePeriodsOptions = {
  dryRun?: boolean;
  batchSize?: number;
};

export type ExpireGracePeriodsResult = {
  dryRun: boolean;
  candidates: number;
  suspended: number;
  subscriptionIds: string[];
};

type QueryResult = {
  rows: unknown[];
  rowCount: number | null;
};

type DatabaseClient = {
  query(sql: string, values?: unknown[]): Promise<QueryResult>;
  release(): void;
};

type DatabasePool = {
  connect(): Promise<DatabaseClient>;
};

export async function expireGracePeriods(
  options: ExpireGracePeriodsOptions = {},
  database: DatabasePool = defaultPool,
): Promise<ExpireGracePeriodsResult> {
  const dryRun = options.dryRun ?? true;
  const batchSize = options.batchSize ?? 100;

  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 500) {
    throw new Error("batchSize must be an integer between 1 and 500.");
  }

  const client = await database.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `SELECT id, plan_code, billing_scope, user_id,
              organisation_id, grace_period_ends_at
       FROM subscriptions
       WHERE status = 'past_due'
         AND grace_period_ends_at IS NOT NULL
         AND grace_period_ends_at <= NOW()
       ORDER BY grace_period_ends_at ASC, id ASC
       LIMIT $1
       FOR UPDATE SKIP LOCKED`,
      [batchSize],
    );

    const subscriptions = result.rows as ExpiredSubscription[];
    const subscriptionIds = subscriptions.map(
      (subscription) => subscription.id,
    );

    if (dryRun || subscriptions.length === 0) {
      await client.query("ROLLBACK");

      return {
        dryRun,
        candidates: subscriptions.length,
        suspended: 0,
        subscriptionIds,
      };
    }

    let suspended = 0;

    for (const subscription of subscriptions) {
      const updated = await client.query(
        `UPDATE subscriptions
         SET status = 'suspended',
             suspended_at = NOW(),
             suspension_reason = COALESCE(
               suspension_reason,
               'Payment grace period expired'
             ),
             updated_at = NOW()
         WHERE id = $1
           AND status = 'past_due'
           AND grace_period_ends_at <= NOW()`,
        [subscription.id],
      );

      if (updated.rowCount !== 1) {
        continue;
      }

      await client.query(
        `INSERT INTO billing_access_events
           (subscription_id, organisation_id, user_id,
            event_type, reason, source, metadata)
         VALUES (
           $1, $2, $3, 'access_suspended',
           'Payment grace period expired',
           'grace_period_worker',
           jsonb_build_object(
             'plan_code', $4,
             'billing_scope', $5,
             'grace_period_ends_at', $6
           )
         )`,
        [
          subscription.id,
          subscription.organisation_id,
          subscription.user_id,
          subscription.plan_code,
          subscription.billing_scope,
          subscription.grace_period_ends_at,
        ],
      );

      suspended += 1;
    }

    await client.query("COMMIT");

    return {
      dryRun: false,
      candidates: subscriptions.length,
      suspended,
      subscriptionIds,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
