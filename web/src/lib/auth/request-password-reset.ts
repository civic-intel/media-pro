import "server-only";

import { z } from "zod";
import { pool } from "@/lib/db/pool";
import { createAuthActionToken } from "@/lib/auth/tokens";
import { sendAuthEmail } from "@/lib/email/resend";

const emailSchema = z.string().trim().email().max(254);

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return value.replace(/[&<>"']/g, (character) => entities[character]);
}

function getResetUrl(token: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    throw new Error("NEXT_PUBLIC_SITE_URL is not configured.");
  }

  const baseUrl = new URL(siteUrl);

  if (process.env.NODE_ENV === "production" && baseUrl.protocol !== "https:") {
    throw new Error("The production site URL must use HTTPS.");
  }

  const resetUrl = new URL("/reset-password", baseUrl);
  resetUrl.searchParams.set("token", token);

  return resetUrl.toString();
}

export async function requestPasswordReset(input: unknown): Promise<void> {
  const parsed = emailSchema.safeParse(input);
  if (!parsed.success) return;

  const email = parsed.data.toLowerCase();
  const client = await pool.connect();

  let user:
    | { id: number; name: string | null; email: string }
    | undefined;
  let token: string | undefined;

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
      token = await createAuthActionToken(client, {
        userId: user.id,
        purpose: "password_reset",
      });
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

  // Do not disclose whether an account exists.
  if (!user || !token) return;

  try {
    const url = getResetUrl(token);
    const name = user.name ?? "there";

    await sendAuthEmail({
      to: user.email,
      subject: "Reset your Adlas password",
      text:
        `Hello ${name},\n\n` +
        "We received a request to reset your Adlas password.\n\n" +
        `${url}\n\n` +
        "This link expires in one hour and can only be used once. " +
        "If you did not request a password reset, you can ignore this email.",
      html:
        `<p>Hello ${escapeHtml(name)},</p>` +
        "<p>We received a request to reset your Adlas password.</p>" +
        `<p><a href="${url}">Reset password</a></p>` +
        "<p>This link expires in one hour and can only be used once. " +
        "If you did not request a password reset, you can ignore this email.</p>",
    });
  } catch {
    // Never log the token, recipient, or reset URL.
    console.error("Adlas password-reset email could not be sent.");
  }
}
