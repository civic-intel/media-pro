import { NextResponse } from "next/server";
import { z } from "zod";
import { resendVerificationEmail } from "@/lib/auth/resend-verification";


const requestSchema = z.object({
  email: z.string().trim().email().max(254),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Please submit a valid email address." },
      { status: 400 },
    );
  }

  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  try {
    await resendVerificationEmail(parsed.data.email);

    return NextResponse.json({
      success: true,
      message:
        "If an unverified account exists for this address, a verification email will be sent.",
    });
  } catch {
    console.error("Adlas resend-verification request failed.");

    return NextResponse.json(
      { error: "Unable to process your request right now. Please try again." },
      { status: 500 },
    );
  }
}
