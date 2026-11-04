import type { MessageKey } from "@/i18n";
import type { Me, RoleKey } from "./types";

export const STAFF_ROLES: RoleKey[] = ["platform_admin", "verifier", "field_agent", "association_admin", "group_leader"];

export const ROLE_PRIORITY: RoleKey[] = ["platform_admin", "association_admin", "verifier", "field_agent", "group_leader", "owner", "rider"];

export type NavKey =
  | "home"
  | "register"
  | "riders"
  | "verification"
  | "duplicates"
  | "vehicles"
  | "organisation"
  | "reports"
  | "notices"
  | "support"
  | "privacy"
  | "me"
  | "admin"
  | "audit";

export interface NavItem {
  key: NavKey;
  href: string;
  label: MessageKey;
}

/** Role-aware navigation (PRD 4.1). Union of all the user's roles. */
const NAV_BY_ROLE: Record<RoleKey, NavKey[]> = {
  platform_admin: ["home", "riders", "register", "verification", "duplicates", "vehicles", "organisation", "reports", "notices", "support", "admin", "audit", "privacy"],
  verifier: ["home", "verification", "duplicates", "riders", "vehicles", "notices", "support"],
  field_agent: ["home", "register", "riders", "vehicles", "organisation", "notices", "support"],
  association_admin: ["home", "riders", "register", "vehicles", "organisation", "duplicates", "reports", "notices", "support", "admin"],
  group_leader: ["home", "riders", "organisation", "notices", "support"],
  rider: ["home", "me", "vehicles", "notices", "support", "privacy"],
  owner: ["home", "me", "vehicles", "notices", "support", "privacy"],
};

const ORDER: NavKey[] = ["home", "me", "riders", "register", "verification", "duplicates", "vehicles", "organisation", "reports", "notices", "support", "privacy", "admin", "audit"];

export function activeRoles(me?: Me | null): RoleKey[] {
  return (me?.roles ?? []).filter((r) => !("revokedAt" in r) || !r.revokedAt).map((r) => r.role);
}

export function hasRole(me: Me | null | undefined, ...roles: RoleKey[]) {
  const mine = activeRoles(me);
  return roles.some((r) => mine.includes(r));
}

export function isStaff(me?: Me | null) {
  return hasRole(me, ...STAFF_ROLES);
}

export function primaryRole(me?: Me | null): RoleKey | null {
  const mine = activeRoles(me);
  return ROLE_PRIORITY.find((r) => mine.includes(r)) ?? null;
}

/** The organisation the user is scoped to (first non-null). */
export function primaryOrganisation(me?: Me | null) {
  const r = (me?.roles ?? []).find((x) => x.organisationId);
  return r ? { id: r.organisationId!, name: r.organisationName ?? "" } : null;
}

export function navFor(me?: Me | null, organisationId?: string | number | null): NavItem[] {
  const keys = new Set<NavKey>();
  for (const role of activeRoles(me)) for (const k of NAV_BY_ROLE[role] ?? []) keys.add(k);
  if (!keys.size) keys.add("home");
  const orgHref = organisationId ? `/organisations/${organisationId}` : "/organisations";
  const map: Record<NavKey, NavItem> = {
    home: { key: "home", href: "/", label: "nav.home" },
    me: { key: "me", href: "/me", label: "nav.me" },
    register: { key: "register", href: "/riders/new", label: "nav.register" },
    riders: { key: "riders", href: "/riders", label: "nav.riders" },
    verification: { key: "verification", href: "/verification", label: "nav.verification" },
    duplicates: { key: "duplicates", href: "/duplicates", label: "nav.duplicates" },
    vehicles: { key: "vehicles", href: "/vehicles", label: "nav.vehicles" },
    organisation: { key: "organisation", href: orgHref, label: "nav.organisation" },
    reports: { key: "reports", href: "/reports", label: "nav.reports" },
    notices: { key: "notices", href: "/notices", label: "nav.notices" },
    support: { key: "support", href: "/support", label: "nav.support" },
    privacy: { key: "privacy", href: "/privacy", label: "nav.privacy" },
    admin: { key: "admin", href: "/admin", label: "nav.admin" },
    audit: { key: "audit", href: "/admin/audit", label: "nav.audit" },
  };
  return ORDER.filter((k) => keys.has(k)).map((k) => map[k]);
}

export function can(me: Me | null | undefined, permission: string, fallbackRoles: RoleKey[] = []): boolean {
  if (me?.permissions?.includes(permission)) return true;
  return hasRole(me, ...fallbackRoles);
}
