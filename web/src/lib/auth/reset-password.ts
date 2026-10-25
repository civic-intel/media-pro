import "server-only";

import argon2 from "argon2";
import { z } from "zod";
import { pool } from "@/lib/db/pool";
import { hashAuthToken } from "@/lib/auth/tokens";

const resetSchema = z.object({
  token: z.string().min(40).max(100).regex(/^[A-Za-z0-9_-]+$/),
  password: z.string().min(12).max(128),
});

export type ResetPasswordResult =
  | { success: true }
  | { success: false; reason: "invalid_input" | "invalid_or_expired_token" };

export async function resetPassword(
  input: unknown,
): Promise<ResetPasswordResult> {
  const parsed = resetSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, reason: "invalid_input" };
  }

  const tokenHash = hashAuthToken(parsed.data.token);
  const passwordHash = await argon2.hash(parsed.data.password, {
    type: argon2.argon2id,
  });

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const consumed = await client.query<{ user_id: number }>(
      `UPDATE auth_action_tokens
       SET used_at = NOW()
       WHERE token_hash = $1
         AND purpose = 'password_reset'
         AND used_at IS NULL
         AND expires_at > NOW()
       RETURNING user_id`,
      [tokenHash],
    );

    const token = consumed.rows[0];

    if (!token) {
      await client.query("ROLLBACK");
      return {
        success: false,
        reason: "invalid_or_expired_token",
      };
    }

    const updated = await client.query(
      `UPDATE users
       SET password_hash = $1,
           session_version = session_version + 1,
           updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, token.user_id],
    );

    if (updated.rowCount !== 1) {
      throw new Error("Password-reset user was not found.");
    }

    await client.query(
      `UPDATE auth_action_tokens
       SET used_at = NOW()
       WHERE user_id = $1
         AND purpose = 'password_reset'
         AND used_at IS NULL`,
      [token.user_id],
    );

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
