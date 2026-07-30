import { ApiKey } from "@workspace/db";
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

  return { workspaceId: matchedKey.workspaceId.toString() };
}
