import { afterEach, describe, expect, it, vi } from "vitest";
import type { PoolClient } from "pg";
import { expireGracePeriods } from "../src/lib/billing/expire-grace-periods";

const overdueSubscription = {
  id: "901",
  plan_code: "pro",
  billing_scope: "personal" as const,
  user_id: 42,
  organisation_id: null,
  grace_period_ends_at: new Date("2020-01-01T00:00:00Z"),
};

function createMockDatabase(options?: {
  subscriptions?: (typeof overdueSubscription)[];
  updateRowCount?: number;
  auditFails?: boolean;
}) {
  const queries: string[] = [];
  const query = vi.fn(async (sql: string) => {
    queries.push(sql);

    if (sql.includes("SELECT id, plan_code")) {
      return {
        rows: options?.subscriptions ?? [overdueSubscription],
        rowCount: 1,
      };
    }

    if (sql.includes("UPDATE subscriptions")) {
      return { rows: [], rowCount: options?.updateRowCount ?? 1 };
    }

    if (sql.includes("INSERT INTO billing_access_events")) {
      if (options?.auditFails) throw new Error("Simulated audit failure");
      return { rows: [], rowCount: 1 };
    }

    return { rows: [], rowCount: 0 };
  });

  const client = {
    query,
    release: vi.fn(),
  };

  return {
    queries,
    query,
    client,
    database: {
      connect: vi.fn(async () => client),
    },
  };
}

describe("expireGracePeriods", () => {
  afterEach(() => vi.restoreAllMocks());

  it("defaults to dry-run and makes no suspension changes", async () => {
    const mock = createMockDatabase();

    const result = await expireGracePeriods({}, mock.database);

    expect(result).toEqual({
      dryRun: true,
      candidates: 1,
      suspended: 0,
      subscriptionIds: ["901"],
    });
    expect(
      mock.queries.some((sql) => sql.includes("UPDATE subscriptions")),
    ).toBe(false);
    expect(mock.queries).toContain("ROLLBACK");
    expect(mock.client.release).toHaveBeenCalledOnce();
  });

  it("suspends an overdue subscription and records an audit event", async () => {
    const mock = createMockDatabase();

    const result = await expireGracePeriods({ dryRun: false }, mock.database);

    expect(result.suspended).toBe(1);
    expect(
      mock.queries.some((sql) => sql.includes("UPDATE subscriptions")),
    ).toBe(true);
    expect(
      mock.queries.some((sql) =>
        sql.includes("INSERT INTO billing_access_events"),
      ),
    ).toBe(true);
    expect(mock.queries).toContain("COMMIT");
  });

  it("does not count a subscription if its update affects no rows", async () => {
    const mock = createMockDatabase({ updateRowCount: 0 });

    const result = await expireGracePeriods({ dryRun: false }, mock.database);

    expect(result.suspended).toBe(0);
    expect(
      mock.queries.some((sql) =>
        sql.includes("INSERT INTO billing_access_events"),
      ),
    ).toBe(false);
    expect(mock.queries).toContain("COMMIT");
  });

  it("rolls back when audit insertion fails", async () => {
    const mock = createMockDatabase({ auditFails: true });

    await expect(
      expireGracePeriods({ dryRun: false }, mock.database),
    ).rejects.toThrow("Simulated audit failure");

    expect(mock.queries).toContain("ROLLBACK");
    expect(mock.queries).not.toContain("COMMIT");
  });

  it("rejects an invalid batch size before connecting", async () => {
    const mock = createMockDatabase();

    await expect(
      expireGracePeriods({ batchSize: 501 }, mock.database),
    ).rejects.toThrow("batchSize must be an integer between 1 and 500.");

    expect(mock.database.connect).not.toHaveBeenCalled();
  });
});
