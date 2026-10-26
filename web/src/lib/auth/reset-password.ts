import "server-only";

import argon2 from "argon2";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

import { pool } from "@/lib/db/pool";

const resetSchema = z.object({
  email: z.string().trim().email().max(254),
  code: z.string().regex(/^\d{6}$/),
  password: z.string().min(12).max(128),
});

const MAX_CODE_ATTEMPTS = 5;

export type ResetPasswordResult =
  | { success: true }
  | {
      success: false;
      reason: "invalid_input" | "invalid_or_expired_code";
    };

function hashResetCode(userId: number, code: string): string {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured.");
  }

  return createHmac("sha256", secret)
    .update(`password-reset:${userId}:${code}`, "utf8")
    .digest("hex");
}

function hashesMatch(expected: string, actual: string): boolean {
  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(actual, "hex");

  return (
    expectedBuffer.length === actualBuffer.length &&
    expectedBuffer.length > 0 &&
    timingSafeEqual(expectedBuffer, actualBuffer)
  );
}

export async function resetPassword(
  input: unknown,
): Promise<ResetPasswordResult> {
  const parsed = resetSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, reason: "invalid_input" };
  }

  const email = parsed.data.email.toLowerCase();
  const code = parsed.data.code;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userResult = await client.query<{ id: number }>(
      `SELECT id
       FROM users
       WHERE LOWER(email) = $1
         AND password_hash IS NOT NULL
       FOR UPDATE`,
      [email],
    );

    const user = userResult.rows[0];

    if (!user) {
      await client.query("ROLLBACK");
      return { success: false, reason: "invalid_or_expired_code" };
    }

    const codeResult = await client.query<{
      id: string;
      code_hash: string;
      expires_at: Date;
      attempts: number;
      is_expired: boolean;
    }>(
      `SELECT id, code_hash, expires_at, attempts,
              (expires_at <= NOW()) AS is_expired
       FROM password_reset_codes
       WHERE user_id = $1
         AND used_at IS NULL
       ORDER BY created_at DESC, id DESC
       LIMIT 1
       FOR UPDATE`,
      [user.id],
    );

    const resetCode = codeResult.rows[0];

    if (
      !resetCode ||
      resetCode.is_expired ||
      resetCode.attempts >= MAX_CODE_ATTEMPTS
    ) {
      await client.query("ROLLBACK");
      return { success: false, reason: "invalid_or_expired_code" };
    }

    const submittedHash = hashResetCode(user.id, code);

    if (!hashesMatch(resetCode.code_hash, submittedHash)) {
      const nextAttempts = resetCode.attempts + 1;

      await client.query(
        `UPDATE password_reset_codes
         SET attempts = $1,
             used_at = CASE WHEN $1 >= $2 THEN NOW() ELSE used_at END
         WHERE id = $3`,
        [nextAttempts, MAX_CODE_ATTEMPTS, resetCode.id],
      );

      await client.query("COMMIT");
      return { success: false, reason: "invalid_or_expired_code" };
    }

    const passwordHash = await argon2.hash(parsed.data.password, {
      type: argon2.argon2id,
    });

    await client.query(
      `UPDATE password_reset_codes
       SET used_at = NOW()
       WHERE user_id = $1
         AND used_at IS NULL`,
      [user.id],
    );

    await client.query(
      `UPDATE users
       SET password_hash = $1,
           session_version = session_version + 1,
           updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, user.id],
    );

    await client.query(
      `UPDATE auth_action_tokens
       SET used_at = NOW()
       WHERE user_id = $1
         AND purpose = 'password_reset'
         AND used_at IS NULL`,
      [user.id],
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
