import { createCipheriv, createDecipheriv, randomBytes, createHash, timingSafeEqual } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

let _key: Buffer | null = null;

function deriveKey(): Buffer {
  if (_key) return _key;

  const envKey = process.env.INTEGRATION_ENCRYPTION_KEY;
  if (envKey) {
    _key = createHash("sha256").update(envKey).digest();
    return _key;
  }

  const fallback = process.env.SESSION_SECRET;
  if (fallback) {
    _key = createHash("sha256").update(`ck-integration-enc:${fallback}`).digest();
    return _key;
  }

  throw new Error(
    "INTEGRATION_ENCRYPTION_KEY or SESSION_SECRET is required for integration config encryption",
  );
}

export function encryptConfig(config: Record<string, unknown> | null | undefined): string | undefined {
  if (config == null) return undefined;

  const key = deriveKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const plaintext = JSON.stringify(config);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const result = Buffer.concat([iv, authTag, encrypted]);
  return result.toString("base64");
}

export function decryptConfig(encoded: string | null | undefined): Record<string, unknown> | null {
  if (encoded == null) return null;

  const key = deriveKey();
  const buf = Buffer.from(encoded, "base64");

  if (buf.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
    throw new Error("Invalid encrypted config: too short");
  }

  const iv = buf.subarray(0, IV_LENGTH);
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8"));
}

const SENSITIVE_FIELDS = new Set([
  "apiKey",
  "apiSecret",
  "password",
  "token",
  "secret",
  "accessToken",
  "refreshToken",
  "clientSecret",
  "privateKey",
  "consumerKey",
  "consumerSecret",
  "signingSecret",
  "webhookSecret",
  "appPassword",
  "certificateKey",
  "bearerToken",
]);

export function stripSensitiveFields(config: Record<string, unknown>): Record<string, unknown> {
  const stripped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (SENSITIVE_FIELDS.has(key) || key.toLowerCase().includes("secret") || key.toLowerCase().includes("password")) {
      stripped[key] = typeof value === "string" && value.length > 0 ? "••••••••" : null;
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      stripped[key] = stripSensitiveFields(value as Record<string, unknown>);
    } else {
      stripped[key] = value;
    }
  }
  return stripped;
}
