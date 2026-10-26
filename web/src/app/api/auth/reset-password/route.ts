import { NextResponse } from "next/server";
import { z } from "zod";

import { resetPassword } from "@/lib/auth/reset-password";

const requestSchema = z.object({
  email: z.string().trim().email().max(254),
  code: z.string().regex(/^\d{6}$/),
  password: z.string().min(12).max(128),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Enter a valid email, six-digit reset code and password between 12 and 128 characters.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await resetPassword(parsed.data);

    if (!result.success) {
      return NextResponse.json(
        {
          error:
            result.reason === "invalid_input"
              ? "Enter valid reset details."
              : "That reset code is invalid, expired or no longer usable. Request a new code.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your password has been reset. You can now sign in.",
    });
  } catch {
    console.error("Adlas password reset failed.");

    return NextResponse.json(
      { error: "Password reset is temporarily unavailable. Please try again." },
      { status: 500 },
    );
  }
}
