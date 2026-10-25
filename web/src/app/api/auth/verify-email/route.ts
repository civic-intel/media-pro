import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyEmail } from "@/lib/auth/verify-email";


const requestSchema = z.object({
  token: z.string().min(40).max(100),
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
      { error: "Invalid or expired verification link." },
      { status: 400 },
    );
  }

  const result = await verifyEmail(parsed.data.token);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid or expired verification link." },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true });
}
