import { ApiKey, connectDB } from "@workspace/db";
import { verifyKey } from "../../lib/api-keys";
import type { WorkspaceContext } from "./context";

export async function resolveWorkspaceFromApiKey(
  authHeader: string | undefined,
): Promise<WorkspaceContext> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header. Use: Bearer ck_xxx");
  }

  const rawKey = authHeader.slice(7);
  if (!rawKey.startsWith("ck_")) {
    throw new Error("Invalid API key format. Keys start with 'ck_'.");
  }

  const keys = await ApiKey.find({ isActive: true }).lean();

  let matchedKey: any = null;
  for (const key of keys) {
    if (verifyKey(rawKey, key.keyHash)) {
      matchedKey = key;
      break;
    }
  }

  if (!matchedKey) {
    throw new Error("Invalid or revoked API key.");
  }

  if (matchedKey.expiresAt && new Date(matchedKey.expiresAt) < new Date()) {
    throw new Error("API key has expired.");
  }

  await ApiKey.findByIdAndUpdate(matchedKey._id, { lastUsedAt: new Date() });

  // Resolve the API key's creator user for audit trail attribution.
  let creatorUserId = "";
  let creatorName = "";
  let creatorEmail = "";
  if (matchedKey.createdBy) {
    try {
      const conn = await connectDB();
      const db = (conn as any)?.connection?.db ?? (conn as any)?.db;
      if (db) {
        const creator = await db
          .collection("user")
          .findOne({ _id: matchedKey.createdBy }, { projection: { _id: 1, name: 1, email: 1 } });
        if (creator) {
          creatorUserId = creator._id?.toString() ?? creator.id ?? "";
          creatorName = creator.name ?? "";
          creatorEmail = creator.email ?? "";
        }
      }
    } catch {
      // Non-critical — proceed without creator info if lookup fails.
    }
  }

  return {
    workspaceId: matchedKey.workspaceId.toString(),
    permissions: matchedKey.permissions || ["read:all"],
    creatorUserId,
    creatorName,
    creatorEmail,
    apiKeyName: matchedKey.name ?? "Unnamed Key",
  };
}
