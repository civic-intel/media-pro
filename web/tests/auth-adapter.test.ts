import { afterEach, describe, expect, it, vi } from "vitest";
import type { Pool } from "pg";
import { createAppAdapter } from "@/lib/auth/adapter";
import type { AdapterUser } from "@auth/core/adapters";

const { connect, query, release } = vi.hoisted(() => ({
  connect: vi.fn(),
  query: vi.fn(),
  release: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@auth/pg-adapter", () => ({
  default: vi.fn(() => ({})),
}));

vi.mock("@/lib/db/pool", () => ({
  pool: {},
}));

function makePool() {
  const client = {
    query,
    release,
  };

  connect.mockResolvedValue(client);

  return { connect } as unknown as Pool;
}

const oauthProfile = {
  name: "Test User",
  email: "oauth@example.com",
  emailVerified: new Date("2026-01-01T00:00:00Z"),
  image: null,
} as AdapterUser;

afterEach(() => {
  vi.clearAllMocks();
});

describe("Auth.js adapter user creation", () => {
  it("creates the user and Member assignment in one transaction", async () => {
    query
      .mockResolvedValueOnce({ rows: [], rowCount: null }) // BEGIN
      .mockResolvedValueOnce({
        rows: [
          {
            id: 42,
            name: oauthProfile.name,
            email: oauthProfile.email,
            emailVerified: oauthProfile.emailVerified,
            image: null,
          },
        ],
        rowCount: 1,
      }) // INSERT user
      .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // INSERT plan
      .mockResolvedValueOnce({ rows: [], rowCount: null }); // COMMIT

    const adapter = createAppAdapter(makePool());
    const user = await adapter.createUser!(oauthProfile);

    expect(user).toMatchObject({
      id: "42",
      name: oauthProfile.name,
      email: oauthProfile.email,
    });

    expect(
      query.mock.calls.map(([sql]) => String(sql).trim().split(/\s+/)[0]),
    ).toEqual(["BEGIN", "INSERT", "INSERT", "COMMIT"]);

    expect(String(query.mock.calls[2][0])).toContain(
      "(user_id, plan_code, status, assignment_source, valid_from, valid_until)",
    );
    expect(String(query.mock.calls[2][0])).toContain(
      "VALUES ($1, 'member', 'active', 'registration', NOW(), NULL)",
    );
    expect(query.mock.calls[2][1]).toEqual([42]);
    expect(release).toHaveBeenCalledOnce();
  });

  it("rolls back user creation if the plan assignment fails", async () => {
    query
      .mockResolvedValueOnce({ rows: [], rowCount: null }) // BEGIN
      .mockResolvedValueOnce({
        rows: [
          {
            id: 42,
            name: oauthProfile.name,
            email: oauthProfile.email,
            emailVerified: oauthProfile.emailVerified,
            image: null,
          },
        ],
        rowCount: 1,
      }) // INSERT user
      .mockRejectedValueOnce(new Error("Plan assignment failed"))
      .mockResolvedValueOnce({ rows: [], rowCount: null }); // ROLLBACK

    const adapter = createAppAdapter(makePool());

    await expect(adapter.createUser!(oauthProfile)).rejects.toThrow(
      "Plan assignment failed",
    );

    expect(
      query.mock.calls.map(([sql]) => String(sql).trim().split(/\s+/)[0]),
    ).toEqual(["BEGIN", "INSERT", "INSERT", "ROLLBACK"]);

    expect(release).toHaveBeenCalledOnce();
  });
});
