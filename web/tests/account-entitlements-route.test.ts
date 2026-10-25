import { afterEach, describe, expect, it, vi } from "vitest";

const { requireSessionEntitlements } = vi.hoisted(() => ({
  requireSessionEntitlements: vi.fn(),
}));

vi.mock("@/lib/billing/session-access", () => ({
  requireSessionEntitlements,
}));

vi.mock("next/server", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("next/server")>();

  return {
    ...actual,
    connection: vi.fn().mockResolvedValue(undefined),
  };
});

import { GET } from "@/app/api/account/entitlements/route";

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/account/entitlements", () => {
  it("returns 200 with entitlements for an authenticated user", async () => {
    const entitlements = {
      userId: "42",
      planCode: "member",
      adsEnabled: true,
      throttlingEnabled: true,
      supportLevel: "self_service",
      supportChannels: ["docs"],
      firstResponseTargetMinutes: null,
      supportSlaEnabled: false,
      organisations: [],
      sources: ["member"],
    };

    requireSessionEntitlements.mockResolvedValue(entitlements);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ entitlements });
  });

  it("returns 401 when authentication is required", async () => {
    const { AuthenticationRequiredError } =
      await import("@/lib/billing/access");

    requireSessionEntitlements.mockRejectedValue(
      new AuthenticationRequiredError(),
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Authentication required." });
  });

  it("returns a generic 500 when entitlement resolution fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    requireSessionEntitlements.mockRejectedValue(
      new Error("Sensitive database details"),
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: "Unable to retrieve account entitlements.",
    });
    expect(JSON.stringify(body)).not.toContain("Sensitive database details");

    consoleError.mockRestore();
  });
});
