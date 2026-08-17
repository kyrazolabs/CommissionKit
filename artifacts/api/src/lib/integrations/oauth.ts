import { IntegrationConnection } from "@workspace/db";
import type { CKitPlugin, ConnectionConfig } from "@workspace/plugins-core";
import { pluginRegistry } from "@workspace/plugins-core";
import { HubSpotClient } from "@workspace/plugins-hubspot";
import { SalesforceClient } from "@workspace/plugins-salesforce";
import { createHash, createHmac, randomBytes } from "crypto";
import { logAudit } from "../../lib/audit";
import { decryptConfig, encryptConfig } from "../crypto";
import { logger } from "../logger";
import { startSyncs } from "./sync";

function hmac(payload: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is required for OAuth state signing");
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generateCodeVerifier(): string {
  return base64url(randomBytes(32));
}

export function computeCodeChallenge(verifier: string): string {
  return base64url(createHash("sha256").update(verifier).digest());
}

export function signState(workspaceId: string, connector: string, codeVerifier?: string): string {
  const body = codeVerifier
    ? `${workspaceId}:${connector}:${codeVerifier}`
    : `${workspaceId}:${connector}`;
  return `${body}.${hmac(body)}`;
}

export function verifyState(state: string): {
  workspaceId: string;
  connector: string;
  codeVerifier?: string;
} {
  const [body, sig] = String(state || "").split(".");
  if (!body || !sig || hmac(body) !== sig) throw new Error("Invalid OAuth state");
  const parts = body.split(":");
  const workspaceId = parts[0];
  const connector = parts[1];
  if (!workspaceId || !connector) throw new Error("Invalid OAuth state");
  return { workspaceId, connector, codeVerifier: parts[2] };
}

interface IntegrationConnectionLike {
  _id: unknown;
  workspaceId: unknown;
  connectorName: string;
  config: unknown;
  metadata?: unknown;
}

export async function ensureFreshConfig(
  conn: IntegrationConnectionLike,
  plugin: CKitPlugin,
): Promise<ConnectionConfig> {
  const config = decryptConfig(conn.config as string) ?? {};
  if (config.authType !== "oauth") return { ...config, _metadata: conn.metadata ?? {} };
  // Manual connections (clientId/clientSecret, no refresh token) authenticate per-request.
  // Only OAuth authorization-code connections carry a refresh token and should be refreshed here.
  if (!config.refreshToken) return { ...config, _metadata: conn.metadata ?? {} };
  const expiresAt = Number(config.expiresAt) || 0;
  if (expiresAt > Date.now() + 5 * 60 * 1000) return { ...config, _metadata: conn.metadata ?? {} };
  if (!plugin.refreshTokens) throw new Error("Connector does not support token refresh");
  logger.info(
    { workspaceId: conn.workspaceId, connector: conn.connectorName },
    "[OAuth] Refreshing access token",
  );
  const patch = await plugin.refreshTokens(config);
  const merged = { ...config, ...patch };
  await IntegrationConnection.updateOne({ _id: conn._id } as any, {
    config: encryptConfig(merged),
  });
  return { ...merged, _metadata: conn.metadata ?? {} };
}

export function buildOAuthStartUrl(
  connector: string,
  redirectUri: string,
  state: string,
  codeChallenge?: string,
): string {
  if (connector === "hubspot") {
    const clientId = process.env.HUBSPOT_CLIENT_ID;
    if (!clientId) throw new Error("HubSpot OAuth not configured (HUBSPOT_CLIENT_ID)");
    return HubSpotClient.buildAuthorizeUrl(clientId, redirectUri, state);
  }
  if (connector === "salesforce") {
    const clientId = process.env.SALESFORCE_CLIENT_ID;
    if (!clientId) throw new Error("Salesforce OAuth not configured (SALESFORCE_CLIENT_ID)");
    const instanceUrl = process.env.SALESFORCE_INSTANCE_URL || "https://login.salesforce.com";
    return SalesforceClient.buildAuthorizeUrl(
      instanceUrl,
      clientId,
      redirectUri,
      state,
      codeChallenge,
    );
  }
  throw new Error(`Unknown OAuth connector: ${connector}`);
}

type OAuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  instanceUrl?: string;
};

export async function handleOAuthCallback(
  connector: string,
  code: string,
  state: string,
  redirectUri?: string,
): Promise<void> {
  const { workspaceId, codeVerifier } = verifyState(state);
  const redirect = redirectUri || process.env[`${connector.toUpperCase()}_REDIRECT_URI`] || "";

  let tokens: OAuthTokens;

  if (connector === "hubspot") {
    const clientId = process.env.HUBSPOT_CLIENT_ID;
    const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
    if (!clientId || !clientSecret)
      throw new Error("HubSpot OAuth not configured (HUBSPOT_CLIENT_ID/SECRET)");
    if (!redirect) throw new Error("HubSpot redirect URI not configured");
    tokens = await HubSpotClient.exchangeCode(clientId, clientSecret, redirect, code);
  } else if (connector === "salesforce") {
    const clientId = process.env.SALESFORCE_CLIENT_ID;
    const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
    if (!clientId || !clientSecret)
      throw new Error("Salesforce OAuth not configured (SALESFORCE_CLIENT_ID/SECRET)");
    if (!redirect) throw new Error("Salesforce redirect URI not configured");
    const instanceUrl = process.env.SALESFORCE_INSTANCE_URL || "https://login.salesforce.com";
    tokens = await SalesforceClient.exchangeCode(
      instanceUrl,
      clientId,
      clientSecret,
      redirect,
      code,
      codeVerifier,
    );
  } else {
    throw new Error(`Unknown OAuth connector: ${connector}`);
  }

  const config: Record<string, unknown> = {
    authType: "oauth",
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: Date.now() + (tokens.expiresIn ?? 3600) * 1000,
  };
  if (tokens.instanceUrl) config.instanceUrl = tokens.instanceUrl;

  await IntegrationConnection.findOneAndUpdate(
    { workspaceId, connectorName: connector },
    {
      workspaceId,
      connectorName: connector,
      status: "connected",
      config: encryptConfig(config),
      syncSchedule: { reps: "hourly", deals: "hourly" },
      lastConnectedAt: new Date(),
      lastError: undefined,
    },
    { upsert: true, new: true },
  );

  const plugin = pluginRegistry.get(connector);
  if (plugin) await plugin.init(workspaceId, config);
  logAudit("integration_connected", "integration", {
    workspaceId,
    resourceName: connector,
    metadata: { connectorName: connector, viaOAuth: true },
  }).catch(() => {});

  logger.info({ workspaceId, connector }, "[OAuth] Connection persisted");
  await startSyncs(workspaceId, connector);
}
