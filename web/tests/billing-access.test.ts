import { describe, expect, it, vi } from "vitest";
import type { EffectiveEntitlements } from "@/lib/billing/entitlements";

vi.mock("@/lib/db/pool", () => ({
  pool: { query: vi.fn() },
}));

import {
  AccessDeniedError,
  AuthenticationRequiredError,
  assertEntitlementSource,
  assertOrganisationRole,
  hasEntitlementSource,
  hasOrganisationRole,
  requireEntitlementSource,
  requireOrganisationRole,
} from "@/lib/billing/access";
import { resolveEntitlements } from "@/lib/billing/entitlements";

vi.mock("@/lib/billing/entitlements", () => ({
  resolveEntitlements: vi.fn(),
}));

const entitlements: EffectiveEntitlements = {
  userId: "42",
  planCode: "member" as const,
  adsEnabled: true,
  throttlingEnabled: true,
  supportLevel: "self_service",
  supportChannels: ["docs"],
  firstResponseTargetMinutes: null,
  supportSlaEnabled: false,
  sources: ["member", "business"],
  organisations: [
    {
      organisationId: "100",
      organisationName: "Example Business",
      role: "admin" as const,
      source: "business" as const,
      seatLimit: 3,
    },
  ],
};

describe("billing access control", () => {
  it("recognises an available entitlement source", () => {
    expect(hasEntitlementSource(entitlements, "member")).toBe(true);
    expect(hasEntitlementSource(entitlements, "business")).toBe(true);
    expect(hasEntitlementSource(entitlements, "enterprise")).toBe(false);
  });

  it("enforces the organisation role hierarchy", () => {
    expect(hasOrganisationRole(entitlements, "100", "viewer")).toBe(true);
    expect(hasOrganisationRole(entitlements, "100", "analyst")).toBe(true);
    expect(hasOrganisationRole(entitlements, "100", "admin")).toBe(true);
    expect(hasOrganisationRole(entitlements, "100", "owner")).toBe(false);
  });

  it("denies users who do not belong to the organisation", () => {
    expect(hasOrganisationRole(entitlements, "999", "viewer")).toBe(false);
  });

  it("throws when the required entitlement is missing", () => {
    expect(() => assertEntitlementSource(entitlements, "enterprise")).toThrow(
      AccessDeniedError,
    );
  });

  it("throws when the organisation role is insufficient", () => {
    expect(() => assertOrganisationRole(entitlements, "100", "owner")).toThrow(
      AccessDeniedError,
    );
  });

  it("requires authentication before resolving entitlements", async () => {
    await expect(requireEntitlementSource(null, "member")).rejects.toThrow(
      AuthenticationRequiredError,
    );
    await expect(
      requireOrganisationRole(undefined, "100", "viewer"),
    ).rejects.toThrow(AuthenticationRequiredError);

    expect(resolveEntitlements).not.toHaveBeenCalled();
  });

  it("resolves and returns entitlements when access is granted", async () => {
    vi.mocked(resolveEntitlements).mockResolvedValue(entitlements);

    await expect(requireEntitlementSource("42", "business")).resolves.toEqual(
      entitlements,
    );

    await expect(
      requireOrganisationRole("42", "100", "admin"),
    ).resolves.toEqual(entitlements);
  });

  it("rejects access when the resolved entitlement is insufficient", async () => {
    vi.mocked(resolveEntitlements).mockResolvedValue(entitlements);

    await expect(requireEntitlementSource("42", "enterprise")).rejects.toThrow(
      AccessDeniedError,
    );

    await expect(requireOrganisationRole("42", "100", "owner")).rejects.toThrow(
      AccessDeniedError,
    );
  });
});
