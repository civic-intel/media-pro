import "server-only";

import { z } from "zod";
import { pool } from "@/lib/db/pool";

const providerEventSchema = z.object({
  provider: z.string().trim().min(1).max(50),
  providerEventId: z.string().trim().min(1).max(255),
  eventType: z.enum(["payment_failed", "payment_recovered"]),
  subscriptionId: z.number().int().positive(),
  occurredAt: z.coerce.date(),
  gracePeriodDays: z.number().int().min(0).max(90).default(7),
  reason: z.string().trim().max(500).optional(),
});

export type TrustedBillingEvent = z.infer<typeof providerEventSchema>;

export type BillingEventResult =
  | {
      success: true;
      outcome: "grace_started" | "reinstated" | "no_change" | "duplicate";
    }
  | { success: false; reason: "invalid_event" | "subscription_not_found" };

type SubscriptionRow = {
  id: string;
  plan_code: string;
  billing_scope: "personal" | "organisation";
  user_id: number | null;
  organisation_id: string | null;
  status: string;
  current_period_end: Date | null;
  grace_period_days: number | null;
  payment_failed_at: Date | null;
  grace_period_ends_at: Date | null;
  suspended_at: Date | null;
};

export async function processTrustedBillingEvent(
  input: TrustedBillingEvent,
): Promise<BillingEventResult> {
  const parsed = providerEventSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, reason: "invalid_event" };
  }

  // This function must only be called after the provider's signature
  // and event authenticity have been verified by the webhook handler.
  const event = parsed.data;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const insertedEvent = await client.query<{ id: string }>(
      `INSERT INTO billing_provider_events
         (billing_provider, provider_event_id, event_type, processing_status,
          verified_at, attempt_count)
       VALUES ($1, $2, $3, 'pending', NOW(), 1)
       ON CONFLICT (billing_provider, provider_event_id) DO NOTHING
       RETURNING id`,
      [event.provider, event.providerEventId, event.eventType],
    );

    const providerEvent = insertedEvent.rows[0];

    if (!providerEvent) {
      await client.query("ROLLBACK");
      return { success: true, outcome: "duplicate" };
    }

    const result = await client.query<SubscriptionRow>(
      `SELECT id, plan_code, billing_scope, user_id, organisation_id,
              status, current_period_end, grace_period_days,
              payment_failed_at, grace_period_ends_at, suspended_at
       FROM subscriptions
       WHERE id = $1
       FOR UPDATE`,
      [event.subscriptionId],
    );

    const subscription = result.rows[0];

    if (!subscription) {
      await client.query(
        `UPDATE billing_provider_events
         SET processing_status = 'failed',
             failure_reason = 'Subscription not found',
             processed_at = NOW()
         WHERE id = $1`,
        [providerEvent.id],
      );
      await client.query("COMMIT");
      return { success: false, reason: "subscription_not_found" };
    }

    let outcome: "grace_started" | "reinstated" | "no_change" = "no_change";

    if (
      event.eventType === "payment_failed" &&
      ["active", "trialing", "past_due"].includes(subscription.status) &&
      subscription.status !== "past_due"
    ) {
      const graceDays = subscription.grace_period_days ?? event.gracePeriodDays;

      await client.query(
        `UPDATE subscriptions
         SET status = 'past_due',
             payment_failed_at = $2,
             grace_period_ends_at = $2::timestamptz + ($3 * INTERVAL '1 day'),
             suspension_reason = $4,
             updated_at = NOW()
         WHERE id = $1`,
        [
          subscription.id,
          event.occurredAt,
          graceDays,
          event.reason ?? "Payment failed",
        ],
      );

      await client.query(
        `INSERT INTO billing_access_events
           (subscription_id, organisation_id, user_id, event_type,
            reason, source, billing_provider_event_id)
         VALUES ($1, $2, $3, 'grace_started', $4, 'billing_provider', $5)`,
        [
          subscription.id,
          subscription.organisation_id,
          subscription.user_id,
          event.reason ?? "Payment failed",
          providerEvent.id,
        ],
      );

      outcome = "grace_started";
    } else if (
      event.eventType === "payment_recovered" &&
      ["past_due", "suspended"].includes(subscription.status)
    ) {
      const paidPeriodStillValid =
        subscription.current_period_end === null ||
        new Date(subscription.current_period_end).getTime() > Date.now();

      if (paidPeriodStillValid) {
        await client.query(
          `UPDATE subscriptions
           SET status = 'active',
               payment_failed_at = NULL,
               grace_period_ends_at = NULL,
               suspended_at = NULL,
               suspension_reason = NULL,
               updated_at = NOW()
           WHERE id = $1`,
          [subscription.id],
        );

        await client.query(
          `INSERT INTO billing_access_events
             (subscription_id, organisation_id, user_id, event_type,
              reason, source, billing_provider_event_id)
           VALUES ($1, $2, $3, 'access_reinstated',
                   'Payment recovered', 'billing_provider', $4)`,
          [
            subscription.id,
            subscription.organisation_id,
            subscription.user_id,
            providerEvent.id,
          ],
        );

        outcome = "reinstated";
      }
    }

    await client.query(
      `UPDATE billing_provider_events
       SET processing_status = 'processed',
           processed_at = NOW()
       WHERE id = $1`,
      [providerEvent.id],
    );

    await client.query("COMMIT");
    return { success: true, outcome };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
