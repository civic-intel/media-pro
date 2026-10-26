import "server-only";

import { createHmac, randomInt } from "node:crypto";
import { z } from "zod";

import { pool } from "@/lib/db/pool";
import { sendAuthEmail } from "@/lib/email/resend";

const emailSchema = z.string().trim().email().max(254);
const CODE_LIFETIME_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_HOUR = 3;

function hashResetCode(userId: number, code: string): string {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured.");
  }

  return createHmac("sha256", secret)
    .update(`password-reset:${userId}:${code}`, "utf8")
    .digest("hex");
}

export async function requestPasswordReset(input: unknown): Promise<void> {
  const parsed = emailSchema.safeParse(input);
  if (!parsed.success) return;

  const email = parsed.data.toLowerCase();
  const client = await pool.connect();

  let user: { id: number; name: string | null; email: string } | undefined;
  let code: string | undefined;

  try {
    await client.query("BEGIN");

    const result = await client.query<{
      id: number;
      name: string | null;
      email: string;
    }>(
      `SELECT id, name, email
       FROM users
       WHERE LOWER(email) = $1
         AND password_hash IS NOT NULL
       FOR UPDATE`,
      [email],
    );

    user = result.rows[0];

    if (user) {
      const recentRequests = await client.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM password_reset_codes
         WHERE user_id = $1
           AND created_at > NOW() - INTERVAL '1 hour'`,
        [user.id],
      );

      if (
        Number(recentRequests.rows[0]?.count ?? "0") >= MAX_REQUESTS_PER_HOUR
      ) {
        user = undefined;
      } else {
        code = randomInt(0, 1_000_000).toString().padStart(6, "0");

        await client.query(
          `UPDATE password_reset_codes
           SET used_at = NOW()
           WHERE user_id = $1
             AND used_at IS NULL`,
          [user.id],
        );

        await client.query(
          `INSERT INTO password_reset_codes
             (user_id, code_hash, expires_at)
           VALUES ($1, $2, $3)`,
          [
            user.id,
            hashResetCode(user.id, code),
            new Date(Date.now() + CODE_LIFETIME_MS),
          ],
        );
      }
    }

    await client.query("COMMIT");
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

  // Keep account existence private.
  if (!user || !code) return;

  try {
    const name = user.name ?? "there";

    await sendAuthEmail({
      to: user.email,
      subject: "Your Adlas password-reset code",
      text:
        `Hello ${name},\n\n` +
        `Your Adlas password-reset code is: ${code}\n\n` +
        "This code expires in 10 minutes and can only be used once. " +
        "If you did not request a password reset, you can ignore this email.",
      html:
        `<p>Hello ${name
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\u0022/g, "&quot;")
          .replace(/\u0027/g, "&#39;")},</p>` +
        "<p>Your Adlas password-reset code is:</p>" +
        `<p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p>` +
        "<p>This code expires in 10 minutes and can only be used once. " +
        "If you did not request a password reset, you can ignore this email.</p>",
    });
  } catch {
    // Never log the code, recipient, or email contents.
    console.error("Adlas password-reset email could not be sent.");

    try {
      await pool.query(
        `UPDATE password_reset_codes
         SET used_at = NOW()
         WHERE user_id = $1
           AND code_hash = $2
           AND used_at IS NULL`,
        [user.id, hashResetCode(user.id, code)],
      );
    } catch {
      console.error("Adlas failed to invalidate an undelivered reset code.");
    }
  }
}
