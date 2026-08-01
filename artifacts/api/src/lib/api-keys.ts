import { randomBytes, createHash, timingSafeEqual } from "crypto";

const KEY_PREFIX = "ck_";
const KEY_LENGTH = 32;
const KEY_DISPLAY_CHARS = 8;

export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const raw = randomBytes(KEY_LENGTH);
  const rawBase64 = raw.toString("base64url");
  const fullKey = `${KEY_PREFIX}${rawBase64}`;
  const hash = hashKey(fullKey);
  const prefix = fullKey.slice(0, KEY_PREFIX.length + KEY_DISPLAY_CHARS);
  return { raw: fullKey, hash, prefix };
}

export function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function verifyKey(rawKey: string, storedHash: string): boolean {
  const computed = Buffer.from(hashKey(rawKey), "hex");
  const stored = Buffer.from(storedHash, "hex");

  if (computed.length !== stored.length) return false;
  return timingSafeEqual(computed, stored);
}
