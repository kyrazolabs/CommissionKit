# Salesforce Integration — App Setup Reference

This doc records how the Salesforce OAuth app is configured, so the setup is reproducible and the team knows what each setting maps to in CommissionKit.

## What kind of app

- **Type:** External Client App (Salesforce's "Connected App v2" — the classic "New Connected App" button is deprecated in newer orgs).
- **Distribution State:** `Local` (single-org). Note: `Packageable` is the multi-tenant path via 2GP managed packages and is only needed when we start onboarding customer orgs — see "Multi-tenant note" below.

## OAuth configuration

- **Enable OAuth:** on
- **Callback URL:**
  - `https://app.commissionkit.co/api/integrations/oauth/salesforce/callback`
  - `https://staging.commissionkit.co/api/integrations/oauth/salesforce/callback`
  - `https://dev.commissionkit.co/api/integrations/oauth/salesforce/callback`
  - `https://ckdev.commissionk.it/api/integrations/oauth/salesforce/callback`
  - `https://staging.commissionk.it/api/integrations/oauth/salesforce/callback`
  - `https://ckdev.commissionkit.co/api/integrations/oauth/salesforce/callback`
  - `http://localhost:8088/api/integrations/oauth/salesforce/callback`
- **OAuth Scopes (selected):**
  - `api` — "Manage user data via APIs (api)"
  - `refresh_token` — "Perform requests at any time (refresh_token, offline_access)"

## Flow enablement

- **Enabled:** `Enable Authorization Code and Credentials Flow` (our web-server flow).
- **Disabled:** Client Credentials Flow, Device Flow, JWT Bearer Flow, Token Exchange Flow.

## Security

- **Enabled:** `Require secret for Web Server Flow`, `Require secret for Refresh Token Flow`.
- **Enforced by Salesforce (cannot change, applies automatically):**
  - `Require Proof Key for Code Exchange (PKCE)` — this is why our client sends `code_challenge`/`code_verifier`.
  - `Enable Refresh Token Rotation` — the refresh response returns a new refresh token; our `ensureFreshConfig` persists it.
  - `Limit Idle Refresh Token Time-to-Live (TTL) to 30 Days` — idle connections must reconnect after 30 days without a sync.
- **Left disabled:** `Enforce Refresh Token IP Allowlist` (would block our server IP), `Issue JWT for named users`.

## Credentials → env vars

| Salesforce | CommissionKit env var |
|---|---|
| Consumer Key | `SALESFORCE_CLIENT_ID` |
| Consumer Secret | `SALESFORCE_CLIENT_SECRET` |

Set both on the API service in Coolify, then redeploy.

## Code requirements (already implemented)

- **PKCE** (`plugins/salesforce/src/client.ts` + `lib/integrations/oauth.ts`) — `buildAuthorizeUrl` sends `code_challenge` + `code_challenge_method=S256`; `exchangeCode` sends `code_verifier`; the verifier is carried through the HMAC-signed `state`.
- **`trust proxy`** (`artifacts/api/src/app.ts`) — so `req.protocol` returns `https` behind the Coolify/nginx proxy and the redirect URL matches what's registered here.
- **Sandbox testing:** set `SALESFORCE_INSTANCE_URL=https://test.salesforce.com` to route authorize to `test.salesforce.com`; production defaults to `login.salesforce.com`.

## Multi-tenant note

A `Local` External Client App only works for the developer's own org. To let customer orgs connect (any user self-authorizing), we'll need to switch the app to **Distribution State `Packageable`** and distribute a 2GP managed package — a separate project, likely including AppExchange listing. Scope that when the first real customer needs to connect. Until then, `Local` is enough to validate the full OAuth flow against our own org.
