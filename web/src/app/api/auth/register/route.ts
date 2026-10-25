import { NextResponse } from "next/server";
import { z } from "zod";
import { registerUser } from "@/lib/auth/register";

const requestSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128),
});

const GENERIC_RESPONSE = {
  success: true,
  message:
    "If registration can proceed for this address, instructions will be sent by email.",
};

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Please submit a valid registration form." },
      { status: 400 },
    );
  }

  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Enter a valid name and email, and a password of at least 12 characters.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await registerUser(parsed.data);

    if (!result.success && result.reason === "invalid_input") {
      return NextResponse.json(
        { error: "Please check your registration details." },
        { status: 400 },
      );
    }

    return NextResponse.json(GENERIC_RESPONSE);
  } catch {
    console.error("Adlas registration request failed.");

    return NextResponse.json(
      { error: "Registration is temporarily unavailable. Please try again." },
      { status: 500 },
    );
  }
}
