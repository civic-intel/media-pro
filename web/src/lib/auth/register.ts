import "server-only";

import argon2 from "argon2";
import { z } from "zod";
import { pool } from "@/lib/db/pool";
import { createAuthActionToken } from "@/lib/auth/tokens";
import { sendAuthEmail } from "@/lib/email/resend";

const registrationSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export type RegistrationResult =
  | { success: true; verificationEmailSent: boolean }
  | {
      success: false;
      reason: "invalid_input" | "email_unavailable";
    };

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
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

  const verificationUrl = new URL("/verify-email", baseUrl);
  verificationUrl.searchParams.set("token", token);

  return verificationUrl.toString();
}

export async function registerUser(
  input: RegistrationInput,
): Promise<RegistrationResult> {
  const parsed = registrationSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, reason: "invalid_input" };
  }

  const name = parsed.data.name;
  const email = parsed.data.email.toLowerCase();

  const passwordHash = await argon2.hash(parsed.data.password, {
    type: argon2.argon2id,
  });

  const client = await pool.connect();
  let userId: number;
  let verificationToken: string;

  try {
    await client.query("BEGIN");

    const inserted = await client.query<{ id: number }>(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [name, email, passwordHash],
    );

    const user = inserted.rows[0];

    if (!user) {
      await client.query("ROLLBACK");
      return { success: false, reason: "email_unavailable" };
    }

    userId = user.id;

    await client.query(
      `INSERT INTO user_plan_assignments
         (user_id, plan_code, status, assignment_source, valid_from, valid_until)
       VALUES ($1, 'member', 'active', 'registration', NOW(), NULL)`,
      [userId],
    );

    verificationToken = await createAuthActionToken(client, {
      userId,
      purpose: "email_verification",
    });

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

  // Email delivery happens after commit. A delivery failure must not
  // roll back the account or its member-plan assignment.
  try {
    const verificationUrl = getVerificationUrl(verificationToken);
    const safeName = escapeHtml(name);

    await sendAuthEmail({
      to: email,
      subject: "Verify your Adlas email address",
      text:
        `Hello ${name},\n\n` +
        "Please verify your email address to finish setting up your Adlas account.\n\n" +
        `${verificationUrl}\n\n` +
        "This link expires in 24 hours. If you did not create an account, you can ignore this email.",
      html:
        `<p>Hello ${safeName},</p>` +
        "<p>Please verify your email address to finish setting up your Adlas account.</p>" +
        `<p><a href="${verificationUrl}">Verify email address</a></p>` +
        "<p>This link expires in 24 hours. If you did not create an account, you can ignore this email.</p>",
    });

    return { success: true, verificationEmailSent: true };
  } catch {
    // Do not log the token, verification URL, or recipient address.
    console.error("Adlas verification email could not be sent.");
    return { success: true, verificationEmailSent: false };
  }
}
