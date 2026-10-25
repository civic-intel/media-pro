import "server-only";

import { pool } from "@/lib/db/pool";
import { hashAuthToken } from "@/lib/auth/tokens";

export type VerifyEmailResult =
  | { success: true }
  | { success: false; reason: "invalid_or_expired_token" };

export async function verifyEmail(
  rawToken: string,
): Promise<VerifyEmailResult> {
  if (
    rawToken.length < 40 ||
    rawToken.length > 100 ||
    !/^[A-Za-z0-9_-]+$/.test(rawToken)
  ) {
    return { success: false, reason: "invalid_or_expired_token" };
  }

  const tokenHash = hashAuthToken(rawToken);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const consumed = await client.query<{ user_id: number }>(
      `UPDATE auth_action_tokens
       SET used_at = NOW()
       WHERE token_hash = $1
         AND purpose = 'email_verification'
         AND used_at IS NULL
         AND expires_at > NOW()
       RETURNING user_id`,
      [tokenHash],
    );

    const token = consumed.rows[0];

    if (!token) {
      await client.query("ROLLBACK");
      return { success: false, reason: "invalid_or_expired_token" };
    }

    const updated = await client.query(
      `UPDATE users
       SET "emailVerified" = COALESCE("emailVerified", NOW()),
           updated_at = NOW()
       WHERE id = $1`,
      [token.user_id],
    );

    if (updated.rowCount !== 1) {
      throw new Error("Email verification user was not found.");
    }

    await client.query("COMMIT");
    return { success: true };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Preserve the original error.
    }

    throw error;
  } finally {
    client.release();
  }
}
