import "server-only";

import {
  resolveEntitlements,
  type EffectiveEntitlements,
  type EntitlementSource,
} from "@/lib/billing/entitlements";

export type OrganisationRole = "owner" | "admin" | "analyst" | "viewer";

const ROLE_LEVEL: Record<OrganisationRole, number> = {
  viewer: 1,
  analyst: 2,
  admin: 3,
  owner: 4,
};

export class AccessDeniedError extends Error {
  readonly statusCode = 403;

  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "AccessDeniedError";
  }
}

export class AuthenticationRequiredError extends Error {
  readonly statusCode = 401;

  constructor() {
    super("Authentication is required.");
    this.name = "AuthenticationRequiredError";
  }
}

export function hasEntitlementSource(
  entitlements: EffectiveEntitlements,
  source: EntitlementSource,
): boolean {
  return entitlements.sources.includes(source);
}

export function hasOrganisationRole(
  entitlements: EffectiveEntitlements,
  organisationId: string,
  minimumRole: OrganisationRole = "viewer",
): boolean {
  const organisation = entitlements.organisations.find(
    (item) => item.organisationId === organisationId,
  );

  if (!organisation) {
    return false;
  }

  return ROLE_LEVEL[organisation.role] >= ROLE_LEVEL[minimumRole];
}

export function assertEntitlementSource(
  entitlements: EffectiveEntitlements,
  source: EntitlementSource,
): void {
  if (!hasEntitlementSource(entitlements, source)) {
    throw new AccessDeniedError(
      `This feature requires the ${source} entitlement.`,
    );
  }
}

export function assertOrganisationRole(
  entitlements: EffectiveEntitlements,
  organisationId: string,
  minimumRole: OrganisationRole = "viewer",
): void {
  if (!hasOrganisationRole(entitlements, organisationId, minimumRole)) {
    throw new AccessDeniedError(
      `This action requires ${minimumRole} access to the organisation.`,
    );
  }
}

export async function requireEntitlementSource(
  userId: string | number | null | undefined,
  source: EntitlementSource,
): Promise<EffectiveEntitlements> {
  if (userId === null || userId === undefined || userId === "") {
    throw new AuthenticationRequiredError();
  }

  const entitlements = await resolveEntitlements(userId);
  assertEntitlementSource(entitlements, source);

  return entitlements;
}

export async function requireOrganisationRole(
  userId: string | number | null | undefined,
  organisationId: string,
  minimumRole: OrganisationRole = "viewer",
): Promise<EffectiveEntitlements> {
  if (userId === null || userId === undefined || userId === "") {
    throw new AuthenticationRequiredError();
  }

  if (!organisationId.trim()) {
    throw new Error("Organisation ID is required.");
  }

  const entitlements = await resolveEntitlements(userId);
  assertOrganisationRole(entitlements, organisationId, minimumRole);

  return entitlements;
}
