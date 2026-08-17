import type { WorkspaceContext } from "./context";

export function hasPermission(ctx: WorkspaceContext, required: string): boolean {
  if (ctx.permissions.includes("read:all")) return true;
  if (ctx.permissions.includes(required)) return true;
  return false;
}

export function requirePermission(ctx: WorkspaceContext, required: string, action: string): void {
  if (!hasPermission(ctx, required)) {
    throw new Error(
      `Permission denied: this API key does not have "${required}" permission. ` +
        `Current permissions: ${ctx.permissions.join(", ") || "none"}. ` +
        `Action: ${action}`,
    );
  }
}
