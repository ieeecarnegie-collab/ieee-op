import type { UserPermission } from "@/lib/db/schema";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  canViewAll: boolean;
  canEditAll: boolean;
  canManageUsers: boolean;
  committeeEditScopes: string[];
};

export function parseCommitteeScopes(scopesJson: string): string[] {
  try {
    const parsed = JSON.parse(scopesJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toSessionUser(
  user: { id: string; email: string; name: string },
  permissions: UserPermission | null,
): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    canViewAll: permissions?.canViewAll ?? true,
    canEditAll: permissions?.canEditAll ?? false,
    canManageUsers: permissions?.canManageUsers ?? false,
    committeeEditScopes: parseCommitteeScopes(
      permissions?.committeeEditScopes ?? "[]",
    ),
  };
}

export function canEdit(user: SessionUser, committeeSlug: string): boolean {
  if (user.canEditAll) return true;
  return user.committeeEditScopes.includes(committeeSlug);
}

export function canManageUsers(user: SessionUser): boolean {
  return user.canManageUsers;
}

export function isAllowedEmailDomain(email: string): boolean {
  const domains =
    process.env.ALLOWED_EMAIL_DOMAINS?.split(",").map((d) => d.trim()) ?? [
      "andrew.cmu.edu",
      "cmu.edu",
    ];
  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? domains.includes(domain) : false;
}
