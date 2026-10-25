import { NextResponse } from "next/server";
import { z } from "zod";
import { requestPasswordReset } from "@/lib/auth/request-password-reset";

const requestSchema = z.object({
  email: z.string().trim().email().max(254),
});

const genericResponse = {
  success: true,
  message:
    "If an account with that email supports password reset, instructions will be sent.",
};

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
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }

  try {
    await requestPasswordReset(parsed.data.email);
    return NextResponse.json(genericResponse);
  } catch {
    console.error("Adlas password-reset request failed.");
    // Keep account existence private, including when the service fails.
    return NextResponse.json(genericResponse);
  }
}
