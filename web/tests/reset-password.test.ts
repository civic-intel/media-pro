import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { connect, query, release, hash } = vi.hoisted(() => ({
  connect: vi.fn(),
  query: vi.fn(),
  release: vi.fn(),
  hash: vi.fn(),
}));

vi.mock("@/lib/db/pool", () => ({
  pool: { connect },
}));

vi.mock("argon2", () => ({
  default: {
    hash,
    argon2id: 2,
  },
}));

import { resetPassword } from "@/lib/auth/reset-password";

const secret = "test-auth-secret";
const userId = 42;
const code = "012345";
const password = "a-long-secure-password";
const passwordHash = "new-argon2-password-hash";

type MockResetCode = {
  id: string;
  code_hash: string;
  expires_at: Date;
  attempts: number;
  is_expired: boolean;
};

function codeHash(value: string): string {
  return createHmac("sha256", secret)
    .update(`password-reset:${userId}:${value}`, "utf8")
    .digest("hex");
}

function createResetCode(
  overrides: Partial<MockResetCode> = {},
): MockResetCode {
  return {
    id: "9",
    code_hash: codeHash(code),
    expires_at: new Date(Date.now() + 60_000),
    attempts: 0,
    is_expired: false,
    ...overrides,
  };
}

function setup(resetCode: MockResetCode | null): void {
  const client = { query, release };

  connect.mockResolvedValue(client);
  hash.mockResolvedValue(passwordHash);

  query.mockImplementation(async (sql: string) => {
    if (sql.includes("SELECT id") && sql.includes("FROM users")) {
      return { rows: [{ id: userId }] };
    }

    if (sql.includes("FROM password_reset_codes")) {
      return { rows: resetCode ? [resetCode] : [] };
    }

    return { rows: [] };
  });
}

beforeEach(() => {
  process.env.AUTH_SECRET = secret;

  query.mockReset();
  connect.mockReset();
  release.mockReset();
  hash.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("resetPassword", () => {
  it("rejects invalid input without opening a transaction", async () => {
    const result = await resetPassword({
      email: "not-an-email",
      code: "123",
      password: "short",
    });

    expect(result).toEqual({
      success: false,
      reason: "invalid_input",
    });
    expect(connect).not.toHaveBeenCalled();
  });

  it("updates the password and invalidates existing sessions on success", async () => {
    setup(createResetCode());

    const result = await resetPassword({
      email: "TEST@example.com",
      code,
      password,
    });

    expect(result).toEqual({ success: true });
    expect(hash).toHaveBeenCalledWith(password, { type: 2 });

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("session_version = session_version + 1"),
      [passwordHash, userId],
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE password_reset_codes"),
      [userId],
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE auth_action_tokens"),
      [userId],
    );
    expect(query).toHaveBeenCalledWith("COMMIT");
    expect(release).toHaveBeenCalledOnce();
  });

  it("increments attempts and does not change the password for a wrong code", async () => {
    setup(
      createResetCode({
        code_hash: codeHash("999999"),
      }),
    );

    const result = await resetPassword({
      email: "test@example.com",
      code,
      password,
    });

    expect(result).toEqual({
      success: false,
      reason: "invalid_or_expired_code",
    });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("SET attempts = $1"),
      [1, 5, "9"],
    );
    expect(hash).not.toHaveBeenCalled();
    expect(query).toHaveBeenCalledWith("COMMIT");
    expect(release).toHaveBeenCalledOnce();
  });

  it("rejects an expired code without hashing a password", async () => {
    setup(
      createResetCode({
        expires_at: new Date(Date.now() - 60_000),
        is_expired: true,
      }),
    );

    const result = await resetPassword({
      email: "test@example.com",
      code,
      password,
    });

    expect(result).toEqual({
      success: false,
      reason: "invalid_or_expired_code",
    });
    expect(hash).not.toHaveBeenCalled();
    expect(query).toHaveBeenCalledWith("ROLLBACK");
    expect(release).toHaveBeenCalledOnce();
  });

  it("rejects a code that has already reached the attempt limit", async () => {
    setup(
      createResetCode({
        attempts: 5,
      }),
    );

    const result = await resetPassword({
      email: "test@example.com",
      code,
      password,
    });

    expect(result).toEqual({
      success: false,
      reason: "invalid_or_expired_code",
    });
    expect(hash).not.toHaveBeenCalled();
    expect(query).toHaveBeenCalledWith("ROLLBACK");
    expect(release).toHaveBeenCalledOnce();
  });

  it("rolls back and releases the client if a database operation fails", async () => {
    connect.mockResolvedValue({ query, release });

    query
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce(new Error("database failure"));

    await expect(
      resetPassword({
        email: "test@example.com",
        code,
        password,
      }),
    ).rejects.toThrow("database failure");

    expect(query).toHaveBeenCalledWith("ROLLBACK");
    expect(release).toHaveBeenCalledOnce();
  });
});
