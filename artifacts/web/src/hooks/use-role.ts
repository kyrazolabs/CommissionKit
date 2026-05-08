import { useWorkspace } from "./use-workspace";

export type OrgRole = "owner" | "admin" | "member";

const ROLE_RANK: Record<OrgRole, number> = { member: 0, admin: 1, owner: 2 };

/**
 * Derive the current user's role in the active workspace and expose
 * a simple `can()` permission helper for role-gated UI rendering.
 *
 * Usage:
 *   const { role, can } = useRole();
 *   if (can("admin")) { ... }   // true for admin AND owner
 */
export function useRole() {
  const { activeWorkspace } = useWorkspace();
  const role = (activeWorkspace?.role ?? "member") as OrgRole;

  function can(minRole: OrgRole): boolean {
    return (ROLE_RANK[role] ?? 0) >= (ROLE_RANK[minRole] ?? 0);
  }

  function is(exactRole: OrgRole): boolean {
    return role === exactRole;
  }

  return { role, can, is };
}
