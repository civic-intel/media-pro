import "server-only";

import { auth } from "@/auth";
import { AuthenticationRequiredError } from "@/lib/billing/access";
import { resolveEntitlements } from "@/lib/billing/entitlements";

export async function requireSessionEntitlements() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new AuthenticationRequiredError();
  }

  return resolveEntitlements(userId);
}
