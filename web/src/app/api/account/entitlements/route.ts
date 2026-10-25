import { NextResponse } from "next/server";
import { AuthenticationRequiredError } from "@/lib/billing/access";
import { requireSessionEntitlements } from "@/lib/billing/session-access";
import { connection } from "next/server";

export async function GET() {

  await connection();

  try {
    const entitlements = await requireSessionEntitlements();

    return NextResponse.json({
      entitlements,
    });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    // Keep database errors and internal details out of the public response.
    console.error("Failed to resolve account entitlements:", error);

    return NextResponse.json(
      { error: "Unable to retrieve account entitlements." },
      { status: 500 },
    );
  }
}
