import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/pool", () => ({
  pool: {
    query: vi.fn(),
  },
}));

import { pool } from "@/lib/db/pool";
import { resolveEntitlements } from "@/lib/billing/entitlements";

type PlanRow = {
  plan_code: "member" | "pro";
  ads_enabled: boolean;
  throttling_enabled: boolean;
  support_level: string;
  support_channels: string[];
  first_response_target_minutes: number | null;
  support_sla_enabled: boolean;
};

type OrganisationRow = {
  organisation_id: string;
  organisation_name: string;
  role: "owner" | "admin" | "analyst" | "viewer";
  plan_code: "business" | "enterprise";
  seat_limit: number;
};

const memberPlan: PlanRow = {
  plan_code: "member",
  ads_enabled: true,
  throttling_enabled: true,
  support_level: "self_service",
  support_channels: ["docs"],
  first_response_target_minutes: null,
  support_sla_enabled: false,
};

const proPlan: PlanRow = {
  plan_code: "pro",
  ads_enabled: false,
  throttling_enabled: true,
  support_level: "standard",
  support_channels: ["email"],
  first_response_target_minutes: 960,
  support_sla_enabled: false,
};

const queryMock = vi.mocked(pool.query);

function queueQueries(
  personalRows: PlanRow[],
  memberRows: PlanRow[],
  organisationRows: OrganisationRow[],
) {
  queryMock
    .mockResolvedValueOnce({ rows: personalRows } as never)
    .mockResolvedValueOnce({ rows: memberRows } as never)
    .mockResolvedValueOnce({ rows: organisationRows } as never);
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("resolveEntitlements", () => {
  it("falls back to Member when the user has no active personal assignment", async () => {
    queueQueries([], [memberPlan], []);

    const result = await resolveEntitlements("42");

    expect(result.planCode).toBe("member");
    expect(result.adsEnabled).toBe(true);
    expect(result.throttlingEnabled).toBe(true);
    expect(result.sources).toEqual(["member"]);
    expect(result.organisations).toEqual([]);
  });

  it("returns Pro entitlements when the eligible personal plan is returned", async () => {
    queueQueries([proPlan], [memberPlan], []);

    const result = await resolveEntitlements(42);

    expect(result.planCode).toBe("pro");
    expect(result.adsEnabled).toBe(false);
    expect(result.supportLevel).toBe("standard");
    expect(result.firstResponseTargetMinutes).toBe(960);
    expect(result.sources).toEqual(["personal_pro"]);
  });

  it("requires a valid personal subscription for a Pro assignment", async () => {
    queueQueries([], [memberPlan], []);

    const result = await resolveEntitlements(42);

    expect(result.planCode).toBe("member");

    const personalSql = String(queryMock.mock.calls[0]?.[0]);

    expect(personalSql).toContain("FROM subscriptions AS s");
    expect(personalSql).toContain("s.billing_scope = 'personal'");
    expect(personalSql).toContain("s.plan_code = 'pro'");
    expect(personalSql).toContain("s.status IN ('active', 'trialing')");
    expect(personalSql).toContain("s.status = 'past_due'");
    expect(personalSql).toContain("s.grace_period_ends_at > NOW()");
  });

  it("excludes Business organisations when the subscription is no longer eligible", async () => {
    queueQueries([], [memberPlan], []);

    const result = await resolveEntitlements(42);

    expect(result.organisations).toEqual([]);

    const organisationSql = String(queryMock.mock.calls[2]?.[0]);

    expect(organisationSql).toContain(
      "s.status IN ('active', 'trialing', 'past_due')",
    );
    expect(organisationSql).toContain("s.grace_period_ends_at > NOW()");
    expect(organisationSql).toContain("o.status = 'active'");
    expect(organisationSql).toContain("om.status = 'active'");
  });

  it("includes an eligible Business organisation during its payment grace period", async () => {
    const business: OrganisationRow = {
      organisation_id: "100",
      organisation_name: "Example Business",
      role: "analyst",
      plan_code: "business",
      seat_limit: 3,
    };

    queueQueries([], [memberPlan], [business]);

    const result = await resolveEntitlements(42);

    expect(result.organisations).toEqual([
      {
        organisationId: "100",
        organisationName: "Example Business",
        role: "analyst",
        source: "business",
        seatLimit: 3,
      },
    ]);
    expect(result.sources).toEqual(["member", "business"]);
  });

  it("excludes Enterprise access when there is no valid active contract", async () => {
    queueQueries([], [memberPlan], []);

    const result = await resolveEntitlements(42);

    expect(result.organisations).toEqual([]);

    const organisationSql = String(queryMock.mock.calls[2]?.[0]);

    expect(organisationSql).toContain("ec.status = 'active'");
    expect(organisationSql).toContain("ec.starts_at <= NOW()");
    expect(organisationSql).toContain("ec.ends_at > NOW()");
    expect(organisationSql).toContain("ec.id IS NOT NULL");
  });

  it("includes Enterprise access when a valid contract and seat limit are returned", async () => {
    const enterprise: OrganisationRow = {
      organisation_id: "200",
      organisation_name: "Example Enterprise",
      role: "owner",
      plan_code: "enterprise",
      seat_limit: 25,
    };

    queueQueries([], [memberPlan], [enterprise]);

    const result = await resolveEntitlements(42);

    expect(result.organisations).toEqual([
      {
        organisationId: "200",
        organisationName: "Example Enterprise",
        role: "owner",
        source: "enterprise",
        seatLimit: 25,
      },
    ]);
    expect(result.sources).toEqual(["member", "enterprise"]);
  });

  it("rejects invalid user IDs before querying the database", async () => {
    await expect(resolveEntitlements("0")).rejects.toThrow("Invalid user ID.");
    await expect(resolveEntitlements("-1")).rejects.toThrow("Invalid user ID.");
    await expect(resolveEntitlements("not-a-user")).rejects.toThrow(
      "Invalid user ID.",
    );

    expect(queryMock).not.toHaveBeenCalled();
  });
});
