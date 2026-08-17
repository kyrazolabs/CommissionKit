import type { AuthConfig } from "./config-parser";

function basicAuth(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

export function getAuthHeaders(config: AuthConfig): Record<string, string> {
  switch (config.type) {
    case "apiKey":
      return { [config.headerName]: config.apiKey };
    case "bearer":
      return { Authorization: `Bearer ${config.token}` };
    case "basic":
      return { Authorization: basicAuth(config.username, config.password) };
    case "oauth2":
      // Client credentials token is fetched on each connector init
      return {};
    default:
      return {};
  }
}

export async function refreshOAuthToken(config: AuthConfig): Promise<{ accessToken: string }> {
  if (config.type !== "oauth2") {
    throw new Error("refreshOAuthToken requires oauth2 auth type");
  }

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      ...(config.scopes ? { scope: config.scopes } : {}),
    }).toString(),
  });

  if (!response.ok) {
    throw new Error(`OAuth token refresh failed: ${response.status}`);
  }

  const data = (await response.json()) as { access_token: string };
  return { accessToken: data.access_token };
}
