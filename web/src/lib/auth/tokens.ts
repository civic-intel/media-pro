import "server-only";

import { createHash, randomBytes } from "node:crypto";
import type { PoolClient } from "pg";

export type AuthActionPurpose = "email_verification" | "password_reset";

const TOKEN_BYTES = 32;

const TOKEN_LIFETIME_MS: Record<AuthActionPurpose, number> = {
  email_verification: 24 * 60 * 60 * 1000,
  password_reset: 60 * 60 * 1000,
};

export function createRawAuthToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashAuthToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export async function createAuthActionToken(
  client: PoolClient,
  input: {
    userId: number;
    purpose: AuthActionPurpose;
  },
): Promise<string> {
  const rawToken = createRawAuthToken();
  const tokenHash = hashAuthToken(rawToken);
  const lifetimeMs = TOKEN_LIFETIME_MS[input.purpose];
  const expiresAt = new Date(Date.now() + lifetimeMs);

  // Only one unused token per user and purpose remains valid.
  await client.query(
    `UPDATE auth_action_tokens
     SET used_at = NOW()
     WHERE user_id = $1
       AND purpose = $2
       AND used_at IS NULL`,
    [input.userId, input.purpose],
  );

  await client.query(
    `INSERT INTO auth_action_tokens
       (user_id, purpose, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [input.userId, input.purpose, tokenHash, expiresAt],
  );

  // The raw token is returned only to the caller for the email link.
  // It must never be written to the database or application logs.
  return rawToken;
}
