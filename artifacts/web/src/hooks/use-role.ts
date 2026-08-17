import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { useWorkspace } from "./use-workspace";

export type OrgRole = "owner" | "admin" | "member";

const ROLE_RANK: Record<OrgRole, number> = { member: 0, admin: 1, owner: 2 };

/**
 * Derive the current user's role and granular permissions in the active workspace.
 * Provides helpers for both role-based (can/is) and resource-based (hasPermission) checks.
 */
export function useRole() {
  const { activeWorkspace } = useWorkspace();
  const role = (activeWorkspace?.role ?? "member") as OrgRole;

  const { data } = useQuery({
    queryKey: ["permissions", activeWorkspace?.id],
    queryFn: () => apiFetch(`/api/workspaces/${activeWorkspace?.id}/permissions`),
    enabled: !!activeWorkspace?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const permissions = Array.isArray(data?.permissions) ? data.permissions : [];

  /** Check if the user has a minimum legacy role */
  function can(minRole: OrgRole): boolean {
    return (ROLE_RANK[role] ?? 0) >= (ROLE_RANK[minRole] ?? 0);
  }

  /** Check if the user has an exact legacy role */
  function is(exactRole: OrgRole): boolean {
    return role === exactRole;
  }

  /**
   * Check if the user has a specific granular permission.
   * Format: resource:action (e.g. "payouts:approve")
   */
  function hasPermission(resource: string, action: string): boolean {
    if (role === "owner") return true; // Owner has all permissions
    if (permissions.includes("*")) return true; // Global wildcard
    if (permissions.includes(`${resource}:*`)) return true; // Resource wildcard
    return permissions.includes(`${resource}:${action}`);
  }

  return { role, can, is, hasPermission, permissions, isLoading: !data && !!activeWorkspace?.id };
}
