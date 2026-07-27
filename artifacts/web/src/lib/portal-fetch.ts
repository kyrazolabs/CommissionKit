/**
 * Isolated JWT auth helpers for the rep portal.
 * NOT Better Auth — completely separate token stored per accessCode in localStorage.
 */

// ─── Token storage ────────────────────────────────────────────────────────────

function getPortalToken(accessCode: string): string | null {
  return localStorage.getItem(`portal_token_${accessCode}`);
}

function setPortalToken(accessCode: string, token: string): void {
  localStorage.setItem(`portal_token_${accessCode}`, token);
}

function clearPortalToken(accessCode: string): void {
  localStorage.removeItem(`portal_token_${accessCode}`);
}

// ─── Authenticated fetch ──────────────────────────────────────────────────────

function portalFetch(
  url: string,
  accessCode: string,
  init: RequestInit = {}
): Promise<Response> {
  const token = getPortalToken(accessCode);
  return fetch(url, {
    ...init,
    headers: {
      ...init.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

export { getPortalToken, setPortalToken, clearPortalToken, portalFetch };

// Alias for external consumers
export const savePortalToken = setPortalToken;
