import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { connect, query, release, sendAuthEmail, randomInt } = vi.hoisted(
  () => ({
    connect: vi.fn(),
    query: vi.fn(),
    release: vi.fn(),
    sendAuthEmail: vi.fn(),
    randomInt: vi.fn(),
  }),
);

vi.mock("@/lib/db/pool", () => ({
  pool: { connect, query },
}));

vi.mock("@/lib/email/resend", () => ({
  sendAuthEmail,
}));

vi.mock("node:crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:crypto")>();
  return {
    ...actual,
    randomInt,
  };
});

import { requestPasswordReset } from "@/lib/auth/request-password-reset";

const user = {
  id: 42,
  name: "Test User",
  email: "test@example.com",
};

function setup(options?: { userExists?: boolean; requestCount?: string }) {
  const client = { query, release };
  connect.mockResolvedValue(client);
  query.mockImplementation(async (sql: string) => {
    if (sql.includes("SELECT id, name, email")) {
      return { rows: options?.userExists === false ? [] : [user] };
    }

    if (sql.includes("COUNT(*)")) {
      return { rows: [{ count: options?.requestCount ?? "0" }] };
    }

    return { rows: [] };
  });
}

beforeEach(() => {
  process.env.AUTH_SECRET = "test-auth-secret";
  connect.mockReset();
  query.mockReset();
  release.mockReset();
  sendAuthEmail.mockReset();
  randomInt.mockReset();
  randomInt.mockReturnValue(12345);
  sendAuthEmail.mockResolvedValue(undefined);
});

afterEach(() => vi.clearAllMocks());

describe("requestPasswordReset", () => {
  it("ignores invalid email input without connecting to the database", async () => {
    await requestPasswordReset("not-an-email");

    expect(connect).not.toHaveBeenCalled();
    expect(sendAuthEmail).not.toHaveBeenCalled();
  });

  it("creates a hashed six-digit code and emails it", async () => {
    setup();

    await requestPasswordReset(" TEST@example.com ");

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO password_reset_codes"),
      [user.id, expect.any(String), expect.any(Date)],
    );

    const insert = query.mock.calls.find(([sql]) =>
      String(sql).includes("INSERT INTO password_reset_codes"),
    );

    expect(insert?.[1]?.[1]).not.toBe("012345");
    expect(sendAuthEmail).toHaveBeenCalledOnce();

    const email = sendAuthEmail.mock.calls[0][0];
    expect(email.to).toBe(user.email);
    expect(email.text).toContain("012345");
    expect(email.text).toContain("expires in 10 minutes");
    expect(email.html).toContain("012345");

    expect(query).toHaveBeenCalledWith("COMMIT");
    expect(release).toHaveBeenCalledOnce();
  });

  it("does not send email when the account does not exist", async () => {
    setup({ userExists: false });

    await requestPasswordReset("unknown@example.com");

    expect(sendAuthEmail).not.toHaveBeenCalled();
    expect(query).toHaveBeenCalledWith("COMMIT");
    expect(release).toHaveBeenCalledOnce();
  });

  it("does not send a fourth reset email within an hour", async () => {
    setup({ requestCount: "3" });

    await requestPasswordReset(user.email);

    expect(
      query.mock.calls.some(([sql]) =>
        String(sql).includes("INSERT INTO password_reset_codes"),
      ),
    ).toBe(false);
    expect(sendAuthEmail).not.toHaveBeenCalled();
    expect(query).toHaveBeenCalledWith("COMMIT");
  });

  it("invalidates the new code if email delivery fails", async () => {
    setup();
    sendAuthEmail.mockRejectedValue(new Error("provider unavailable"));

    await requestPasswordReset(user.email);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO password_reset_codes"),
      expect.any(Array),
    );

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("SET used_at = NOW()"),
      [user.id, expect.any(String)],
    );
    expect(release).toHaveBeenCalledOnce();
  });

  it("rolls back and releases the client when a database query fails", async () => {
    connect.mockResolvedValue({ query, release });
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce(new Error("database unavailable"));

    await expect(requestPasswordReset(user.email)).rejects.toThrow(
      "database unavailable",
    );

    expect(query).toHaveBeenCalledWith("ROLLBACK");
    expect(release).toHaveBeenCalledOnce();
    expect(sendAuthEmail).not.toHaveBeenCalled();
  });
});
