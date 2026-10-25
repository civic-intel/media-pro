import "server-only";

import { z } from "zod";
import { pool } from "@/lib/db/pool";

const userIdSchema = z.union([
  z.string().regex(/^[1-9]\d*$/),
  z.number().int().positive(),
]);

export type EntitlementSource =
  | "member"
  | "personal_pro"
  | "business"
  | "enterprise";

export type OrganisationEntitlement = {
  organisationId: string;
  organisationName: string;
  role: "owner" | "admin" | "analyst" | "viewer";
  source: "business" | "enterprise";
  seatLimit: number;
};

export type EffectiveEntitlements = {
  userId: string;
  planCode: "member" | "pro";
  adsEnabled: boolean;
  throttlingEnabled: boolean;
  supportLevel: string;
  supportChannels: string[];
  firstResponseTargetMinutes: number | null;
  supportSlaEnabled: boolean;
  organisations: OrganisationEntitlement[];
  sources: EntitlementSource[];
};

type PersonalPlanRow = {
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

const PERSONAL_PLAN_QUERY = `
  SELECT
    p.plan_code,
    p.ads_enabled,
    p.throttling_enabled,
    p.support_level,
    p.support_channels,
    p.first_response_target_minutes,
    p.support_sla_enabled
  FROM user_plan_assignments AS a
  JOIN account_plans AS p
    ON p.plan_code = a.plan_code
  WHERE a.user_id = $1
    AND a.status = 'active'
    AND a.valid_from <= NOW()
    AND (a.valid_until IS NULL OR a.valid_until > NOW())
    AND p.is_active = TRUE
    AND (
      a.plan_code = 'member'
      OR (
        a.plan_code = 'pro'
        AND EXISTS (
          SELECT 1
          FROM subscriptions AS s
          WHERE s.user_id = a.user_id
            AND s.billing_scope = 'personal'
            AND s.plan_code = 'pro'
            AND (
              s.status IN ('active', 'trialing')
              OR (
                s.status = 'past_due'
                AND s.grace_period_ends_at IS NOT NULL
                AND s.grace_period_ends_at > NOW()
              )
            )
            AND s.current_period_end IS NOT NULL
            AND s.current_period_end > NOW()
        )
      )
    )
  ORDER BY a.valid_from DESC, a.id DESC
  LIMIT 1
`;

const MEMBER_PLAN_QUERY = `
  SELECT
    plan_code,
    ads_enabled,
    throttling_enabled,
    support_level,
    support_channels,
    first_response_target_minutes,
    support_sla_enabled
  FROM account_plans
  WHERE plan_code = 'member'
    AND is_active = TRUE
`;

const ORGANISATION_ENTITLEMENTS_QUERY = `
  SELECT
    o.id::text AS organisation_id,
    o.name AS organisation_name,
    om.role,
    s.plan_code,
    CASE
      WHEN s.plan_code = 'enterprise' THEN ec.seat_limit
      ELSE COALESCE(p.included_seats, 1) + s.additional_seats
    END AS seat_limit
  FROM organisation_members AS om
  JOIN organisations AS o
    ON o.id = om.organisation_id
  JOIN subscriptions AS s
    ON s.organisation_id = o.id
    AND s.billing_scope = 'organisation'
  JOIN account_plans AS p
    ON p.plan_code = s.plan_code
    AND p.is_active = TRUE
  LEFT JOIN enterprise_contracts AS ec
    ON ec.organisation_id = o.id
    AND ec.status = 'active'
    AND (ec.starts_at IS NULL OR ec.starts_at <= NOW())
    AND (ec.ends_at IS NULL OR ec.ends_at > NOW())
  WHERE om.user_id = $1
    AND om.status = 'active'
    AND o.status = 'active'
    AND s.status IN ('active', 'trialing', 'past_due')
    AND (
      (
        s.plan_code = 'business'
        AND s.current_period_end IS NOT NULL
        AND s.current_period_end > NOW()
      )
      OR (
        s.plan_code = 'enterprise'
        AND ec.id IS NOT NULL
      )
    )
    AND (
      s.status <> 'past_due'
      OR s.grace_period_ends_at IS NULL
      OR s.grace_period_ends_at > NOW()
    )
    AND (
      (
        s.plan_code = 'business'
      )
      OR (
        s.plan_code = 'enterprise'
        AND ec.id IS NOT NULL
        AND ec.seat_limit >= 1
      )
    )
  ORDER BY
    CASE WHEN s.plan_code = 'enterprise' THEN 0 ELSE 1 END,
    o.name ASC
`;

export async function resolveEntitlements(
  rawUserId: string | number,
): Promise<EffectiveEntitlements> {
  const parsed = userIdSchema.safeParse(rawUserId);

  if (!parsed.success) {
    throw new Error("Invalid user ID.");
  }

  const userId = String(parsed.data);

  const personalResult = await pool.query<PersonalPlanRow>(
    PERSONAL_PLAN_QUERY,
    [userId],
  );
  const personal = personalResult.rows[0];

  const memberResult = await pool.query<PersonalPlanRow>(MEMBER_PLAN_QUERY);
  const member = memberResult.rows[0];

  if (!personal && !member) {
    throw new Error("The Member plan is not configured or is inactive.");
  }

  const plan = personal ?? member!;
  const planCode = plan.plan_code;

  const sources: EntitlementSource[] = [
    planCode === "pro" ? "personal_pro" : "member",
  ];

  const organisationResult = await pool.query<OrganisationRow>(
    ORGANISATION_ENTITLEMENTS_QUERY,
    [userId],
  );

  const organisations: OrganisationEntitlement[] = organisationResult.rows.map(
    (row) => ({
      organisationId: row.organisation_id,
      organisationName: row.organisation_name,
      role: row.role,
      source: row.plan_code,
      seatLimit: row.seat_limit,
    }),
  );

  if (organisations.some((org) => org.source === "business")) {
    sources.push("business");
  }

  if (organisations.some((org) => org.source === "enterprise")) {
    sources.push("enterprise");
  }

  return {
    userId,
    planCode,
    adsEnabled: plan.ads_enabled,
    throttlingEnabled: plan.throttling_enabled,
    supportLevel: plan.support_level,
    supportChannels: plan.support_channels,
    firstResponseTargetMinutes: plan.first_response_target_minutes,
    supportSlaEnabled: plan.support_sla_enabled,
    organisations,
    sources,
  };
}
