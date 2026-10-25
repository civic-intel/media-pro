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

function getVerificationUrl(token: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    throw new Error("NEXT_PUBLIC_SITE_URL is not configured.");
  }

  const baseUrl = new URL(siteUrl);

  if (process.env.NODE_ENV === "production" && baseUrl.protocol !== "https:") {
    throw new Error("The production site URL must use HTTPS.");
  }

  const url = new URL("/verify-email", baseUrl);
  url.searchParams.set("token", token);
  return url.toString();
}

export async function resendVerificationEmail(
  input: unknown,
): Promise<void> {
  const parsed = emailSchema.safeParse(input);
  if (!parsed.success) return;

  const email = parsed.data.toLowerCase();
  const client = await pool.connect();
  let user: { id: number; name: string | null } | undefined;
  let token: string | undefined;

  try {
    await client.query("BEGIN");

    const result = await client.query<{ id: number; name: string | null }>(
      `SELECT id, name
       FROM users
       WHERE lower(email) = $1
         AND "emailVerified" IS NULL
       FOR UPDATE`,
      [email],
    );

    user = result.rows[0];

    if (user) {
      token = await createAuthActionToken(client, {
        userId: user.id,
        purpose: "email_verification",
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

  // Unknown and already-verified addresses intentionally receive no email.
  if (!user || !token) return;

  try {
    const url = getVerificationUrl(token);
    const name = user.name ?? "there";

    await sendAuthEmail({
      to: email,
      subject: "Verify your Adlas email address",
      text:
        `Hello ${name},\n\n` +
        "Please verify your email address to finish setting up your Adlas account.\n\n" +
        `${url}\n\n` +
        "This link expires in 24 hours. If you did not request this email, you can ignore it.",
      html:
        `<p>Hello ${escapeHtml(name)},</p>` +
        "<p>Please verify your email address to finish setting up your Adlas account.</p>" +
        `<p><a href="${url}">Verify email address</a></p>` +
        "<p>This link expires in 24 hours. If you did not request this email, you can ignore it.</p>",
    });
  } catch {
    // Never log the recipient, token, or verification URL.
    console.error("Adlas verification email could not be sent.");
  }
}
