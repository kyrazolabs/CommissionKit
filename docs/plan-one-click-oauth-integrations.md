# One-Click OAuth Integrations (HubSpot + Salesforce) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the multi-field credential forms for HubSpot and Salesforce with a single "Connect" button that runs OAuth 2.0 Authorization Code (Web Server) flow, and make a workspace able to hold both connections simultaneously.

**Architecture:** Add an OAuth start + callback route pair per provider, store the OAuth app's `client_id`/`client_secret` in server env vars (never in per-user config), persist the returned `access_token`/`refresh_token`/`expires_at` in the existing AES-encrypted `IntegrationConnection.config`, and lazily refresh tokens via a new optional `refreshTokens?()` plugin method before every sync. Fix the `IntegrationConnection` schema from single-connection (`workspaceId` unique) to multi-connection (`workspaceId + connectorName` unique), and make all connection routes connector-aware.

**Tech Stack:** Bun, Express 5, Mongoose, TypeScript, `@workspace/plugins-core`, `@workspace/plugins-hubspot`, `@workspace/plugins-salesforce`, BullMQ, React 19 + TanStack Query.

## Global Constraints

- **Bun only** — no npm/yarn/pnpm. Run tests with `bun test`, typecheck with `bun run typecheck`.
- **Mongoose, not raw MongoDB.** All DB access via `@workspace/db` models.
- **No `console.log`** in production code — use Pino (`logger`).
- **Sensitive values** (`accessToken`, `refreshToken`, `clientSecret`) must go through `encryptConfig`/`decryptConfig` and never be returned raw. `stripSensitiveFields` already masks them.
- **OAuth app secrets are server-only** (`process.env`), never written to the DB or exposed to the frontend.
- **Run `bun test` and `bun run typecheck`** before marking any task complete. Mock external HTTP (HubSpot/Salesforce token + API endpoints).
- **Update `context/progress-tracker.md`** after the feature lands.
- Existing code style: `.js` extensions only inside `@workspace/queue` sources; elsewhere bare imports. Route handlers use `try/catch`, `res.status(...).json({ error, ... })`.
- Route review gate: this change touches auth, a public callback contract, and a schema/migration — route through `@review` before shipping.

---

## File Structure Map

**Backend (plugins)**
- `plugins/core/src/types.ts` — add `refreshTokens?` to `CKitPlugin` interface.
- `plugins/core/src/base.ts` — add no-op default `refreshTokens`.
- `plugins/hubspot/src/client.ts` — add `buildAuthorizeUrl()`, `refreshAccessToken()`.
- `plugins/hubspot/src/connector.ts` — implement `refreshTokens`, add `oauth_support` feature.
- `plugins/salesforce/src/client.ts` — add `buildAuthorizeUrl()`, `exchangeCode()`, `refreshAccessToken()`.
- `plugins/salesforce/src/connector.ts` — implement `refreshTokens`, add `oauth_support` feature.

**Backend (API + DB)**
- `lib/db/src/schema/integrationConnection.ts` — compound unique index.
- `artifacts/api/src/lib/integrations/oauth.ts` — NEW: `signState`, `verifyState`, `buildOAuthStartUrl`, `handleOAuthCallback`, `ensureFreshConfig`.
- `artifacts/api/src/lib/integrations/sync.ts` — NEW: `startSyncs(workspaceId, connectorName, syncSchedule)` extracted from `/connect`.
- `artifacts/api/src/routes/integrations/routes.ts` — OAuth routes, connector-aware queries, wire `ensureFreshConfig`.
- `artifacts/api/src/workers/sync-reps-worker.ts` + `sync-deals-worker.ts` — call `ensureFreshConfig` before fetch.
- `artifacts/api/.env.example` — add 4 OAuth env vars.

**Frontend (web)**
- `artifacts/web/src/pages/integrations/types.ts` — `ConnectionStatus[]` list type.
- `artifacts/web/src/pages/integrations/oauth-connect-button.tsx` — NEW: one-button OAuth + "Advanced" fallback.
- `artifacts/web/src/pages/integrations/connector-card.tsx` — use the new button.
- `artifacts/web/src/pages/integrations/integrations.tsx` — render multiple connected cards; connector-aware calls.

---

## Decisions Made

1. **OAuth flow = Authorization Code (Web Server).** HubSpot and Salesforce both support it. The user clicks once, approves in a provider popup/tab, and returns connected. No pasted credentials.
2. **OAuth app credentials live in env vars** — `HUBSPOT_CLIENT_ID`, `HUBSPOT_CLIENT_SECRET`, `SALESFORCE_CLIENT_ID`, `SALESFORCE_CLIENT_SECRET`. One registered app per provider, shared across all workspaces. This is the single change that makes the flow "one button."
3. **Multi-connector schema fix is in scope and required.** `workspaceId` is currently `unique: true`; without a compound unique on `(workspaceId, connectorName)`, connecting Salesforce would silently overwrite HubSpot. This ripples through every connection route.
4. **Lazy token refresh** via an optional `refreshTokens?(config)` plugin method + an API-side `ensureFreshConfig(conn, plugin)` helper. Workers and stage-mapping routes call it before using the config.
5. **Keep the manual-token form** as an "Advanced" accordion behind the one-click button (self-hosted / enterprise / OAuth app not yet registered).

## Assumptions

- The existing `GET /hubspot/callback` route (lines 590–642 of `routes.ts`) is dead code — never wired to the frontend, and its `clientId`/`clientSecret` were erroneously read from per-user config. We replace it with a generic `/oauth/:connector/callback` route and derive creds from env. No real users depend on the old path.
- Redirect URI registered with the providers will be `<API origin>/api/integrations/oauth/<connector>/callback`. A `*_REDIRECT_URI` env override is supported; otherwise it is derived from the request host (same approach the old code used).
- OAuth scopes: HubSpot `crm.objects.owners.read crm.objects.deals.read`; Salesforce `api refresh_token`. (Adjust only if provider apps need different scopes — see Task 12 note.)
- Both providers return a `refresh_token` (HubSpot always; Salesforce web-server flow always) and an `expires_in`.

---

## Phase 1 — Schema + Multi-Connector Backend Refactor

### Task 1: Compound unique index on `IntegrationConnection`

**Files:**
- Modify: `lib/db/src/schema/integrationConnection.ts:11,28`

**Interfaces:**
- Produces: a DB where `{ workspaceId, connectorName }` is unique and `findOne({ workspaceId, connectorName })` returns the correct single connection.

- [ ] **Step 1: Edit the schema** — remove `unique: true` from the field and make the compound index unique.

```ts
// line 11 — change
workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, unique: true },
// to
workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
```

```ts
// line 28 — change
IntegrationConnectionSchema.index({ workspaceId: 1, connectorName: 1 });
// to
IntegrationConnectionSchema.index({ workspaceId: 1, connectorName: 1 }, { unique: true });
```

- [ ] **Step 2: Verify no duplicate rows block index creation.** Run a quick check via a temporary script or assume safe (the old unique constraint already prevented duplicate `workspaceId`s, so there are at most one row per workspace today — the compound unique is a relaxation, not a tightening). Note: this is a **schema change**, so flag for `@review`.

- [ ] **Step 3: Commit.**

```bash
git add lib/db/src/schema/integrationConnection.ts
git commit -m "feat(db): allow multiple integration connections per workspace"
```

### Task 2: Extract sync kickoff into a shared helper

**Files:**
- Create: `artifacts/api/src/lib/integrations/sync.ts`
- Modify: `artifacts/api/src/routes/integrations/routes.ts:192-222` (replace inline logic with the helper)

**Interfaces:**
- Produces: `export async function startSyncs(workspaceId: string, connectorName: string, syncSchedule?: { reps: string; deals: string }): Promise<void>` — enqueues initial reps+deals syncs and schedules repeatable jobs. Consumed by Task 7 (callback) and the `/connect` route.

- [ ] **Step 1: Write the helper** — move the exact enqueue/schedule logic from `/connect` verbatim into `startSyncs`, importing `syncRepsQueue`, `syncDealsQueue` from `@workspace/queue`.

```ts
import { syncRepsQueue, syncDealsQueue } from "@workspace/queue";

export async function startSyncs(
  workspaceId: string,
  connectorName: string,
  syncSchedule?: { reps: string; deals: string },
): Promise<void> {
  await syncRepsQueue.add(`initial-reps-${workspaceId}-${connectorName}`, {
    workspaceId, connectorName, trigger: "initial",
  });
  await syncDealsQueue.add(`initial-deals-${workspaceId}-${connectorName}`, {
    workspaceId, connectorName, trigger: "initial",
  });

  const sched = syncSchedule || { reps: "hourly", deals: "hourly" };
  const intervalFor = (v: string) => (v === "realtime" ? 600_000 : v === "daily" ? 86_400_000 : 3_600_000);

  if (sched.reps !== "manual") {
    await syncRepsQueue.add(
      `scheduled-reps-${workspaceId}-${connectorName}`,
      { workspaceId, connectorName, trigger: "scheduled" },
      { repeat: { every: intervalFor(sched.reps) }, jobId: `scheduled-reps-${workspaceId}-${connectorName}`, removeOnComplete: { age: 300 }, removeOnFail: { age: 300 } },
    );
  }
  if (sched.deals !== "manual") {
    await syncDealsQueue.add(
      `scheduled-deals-${workspaceId}-${connectorName}`,
      { workspaceId, connectorName, trigger: "scheduled" },
      { repeat: { every: intervalFor(sched.deals) }, jobId: `scheduled-deals-${workspaceId}-${connectorName}`, removeOnComplete: { age: 300 }, removeOnFail: { age: 300 } },
    );
  }
}
```

- [ ] **Step 2: Replace inline logic** in `/connect` (lines 192–222) with `await startSyncs(workspaceId, connectorName, syncSchedule);` and remove the now-unused local enqueue/schedule code.

- [ ] **Step 3: Commit.**

```bash
git add artifacts/api/src/lib/integrations/sync.ts artifacts/api/src/routes/integrations/routes.ts
git commit -m "refactor(integrations): extract sync kickoff helper"
```

### Task 3: Make `/connect` connector-aware

**Files:**
- Modify: `artifacts/api/src/routes/integrations/routes.ts:175` (upsert filter)

**Interfaces:**
- Consumes: `startSyncs` from Task 2.
- Produces: `/connect` upserts by `{ workspaceId, connectorName }` so a second connector no longer overwrites the first.

- [ ] **Step 1: Add `connectorName` to the upsert filter.**

```ts
const conn = await IntegrationConnection.findOneAndUpdate(
  { workspaceId, connectorName },   // was: { workspaceId }
  { ... },
  { upsert: true, new: true },
);
```

- [ ] **Step 2: Run existing integration route tests** (`bun test --filter @workspace/api`), fix any that assumed single-connection. Add one test asserting two connectors coexist (connect hubspot then salesforce, assert two rows).

- [ ] **Step 3: Commit.**

### Task 4: Connector-aware `/status`, `/config`, `/disconnect`, `/sync`, `/connector/settings`

**Files:**
- Modify: `artifacts/api/src/routes/integrations/routes.ts` — status (70–115), config GET (252–267) + PATCH (271–335), disconnect (339–376), sync (397–435), connector settings (646–667).

**Interfaces:**
- Produces:
  - `GET /:workspaceId/status` → returns `{ connections: Array<{...}> }` (one entry per connected connector; empty array when none).
  - `GET /:workspaceId/config?connector=<name>` → single connection config.
  - `PATCH /:workspaceId/config?connector=<name>` → updates that connection.
  - `DELETE /:workspaceId/disconnect?connector=<name>` → disconnects that connection (and removes its scheduled jobs keyed by `-<connectorName>`).
  - `POST /:workspaceId/sync/:entityType?connector=<name>` → syncs that connection.
  - `PATCH /:workspaceId/connector/settings?connector=<name>` → scopes metadata update to that connection.

- [ ] **Step 1: Rewrite `/status`** to return a list. Query `IntegrationConnection.find({ workspaceId, status: "connected" })`, map each through the existing status logic, and respond `{ connections }`. Keep the per-connection shape identical to today's response so frontend `ConnectionStatus` mostly works.

- [ ] **Step 2: Add `connector` query param** to the other four routes. For each, `const connectorName = req.query.connector as string;` and include `connectorName` in the `findOne` / `findOneAndUpdate` filter. For `/disconnect`, also remove repeatable jobs keyed `scheduled-reps-${workspaceId}-${connectorName}` / `...deals...` (matching the `-${connectorName}` suffix added in Task 2). Return `400 { error: "connector query param required" }` if missing.

- [ ] **Step 3: Update the PATCH `/config` repeatable-job removal** to use the `-${connectorName}` job ids.

- [ ] **Step 4: Add tests** covering: list status for two connections; `config?connector=` returns the right one; disconnect removes only the target. Run `bun test --filter @workspace/api`.

- [ ] **Step 5: Commit.**

---

## Phase 2 — OAuth Backend (HubSpot + Salesforce)

### Task 5: `refreshTokens?` on the plugin interface

**Files:**
- Modify: `plugins/core/src/types.ts:154-178` (interface), `plugins/core/src/base.ts:18-62` (default)

**Interfaces:**
- Produces: `refreshTokens?(config: ConnectionConfig): Promise<ConnectionConfig>` — returns the token fields to merge (e.g. `{ accessToken, refreshToken, expiresAt }`). Default no-op returns `config`.

- [ ] **Step 1: Add the optional method** to `CKitPlugin` after `writeBackPayoutStatus?`.

```ts
refreshTokens?(config: ConnectionConfig): Promise<ConnectionConfig>;
```

- [ ] **Step 2: Add default impl** to `BasePlugin`.

```ts
async refreshTokens?(config: ConnectionConfig): Promise<ConnectionConfig> { return config; }
```

- [ ] **Step 3: Commit.**

### Task 6: HubSpot client — `buildAuthorizeUrl` + `refreshAccessToken`

**Files:**
- Modify: `plugins/hubspot/src/client.ts`

**Interfaces:**
- Produces:
  - `static buildAuthorizeUrl(clientId: string, redirectUri: string, state: string): string`
  - `static refreshAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }>`

- [ ] **Step 1: Write the failing test** in `plugins/hubspot/src/client.test.ts`.

```ts
test("refreshAccessToken posts a refresh_token grant", async () => {
  const fetchMock = mockFetch({ access_token: "new-at", refresh_token: "new-rt", expires_in: 1800 });
  const res = await HubSpotClient.refreshAccessToken("cid", "csec", "rt-old");
  expect(fetchMock.url).toBe("https://api.hubapi.com/oauth/v1/token");
  expect(fetchMock.body).toContain("grant_type=refresh_token");
  expect(res.accessToken).toBe("new-at");
});

test("buildAuthorizeUrl encodes the OAuth params", () => {
  const url = HubSpotClient.buildAuthorizeUrl("cid", "https://x/cb", "st");
  expect(url).toContain("https://app.hubspot.com/oauth/authorize?");
  expect(url).toContain("response_type=code");
  expect(url).toContain("scope=crm.objects.owners.read%20crm.objects.deals.read");
});
```

- [ ] **Step 2: Run to confirm failure** (`bun test --filter @workspace/plugins-hubspot`).

- [ ] **Step 3: Implement.** (Use `mock.module("global", ...)` or the repo's existing fetch-mock pattern in `client.test.ts`.)

```ts
static buildAuthorizeUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "crm.objects.owners.read crm.objects.deals.read",
    response_type: "code",
    state,
  });
  return `https://app.hubspot.com/oauth/authorize?${params.toString()}`;
}

static async refreshAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });
  const res = await fetch(`${HUBSPOT_API}/oauth/v1/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!res.ok) throw new Error(`HubSpot token refresh failed: HTTP ${res.status}`);
  const data = (await res.json()) as TokenResponse;
  return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in };
}
```

- [ ] **Step 4: Run to confirm pass.** **Step 5: Commit.**

### Task 7: HubSpot connector — `refreshTokens` + `oauth_support`

**Files:**
- Modify: `plugins/hubspot/src/connector.ts`

**Interfaces:**
- Produces: `refreshTokens(config)` reading env creds; `getUIMetadata().features` includes `"oauth_support"`.

- [ ] **Step 1: Implement `refreshTokens`** on `HubSpotConnector`.

```ts
async refreshTokens(config: ConnectionConfig): Promise<ConnectionConfig> {
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("HubSpot OAuth not configured (HUBSPOT_CLIENT_ID/SECRET)");
  if (!config.refreshToken) throw new Error("HubSpot refresh token missing");
  const t = await HubSpotClient.refreshAccessToken(clientId, clientSecret, config.refreshToken as string);
  return { accessToken: t.accessToken, refreshToken: t.refreshToken, expiresAt: Date.now() + t.expiresIn * 1000 };
}
```

- [ ] **Step 2: Add feature** to `getUIMetadata().features` → `["sync_reps", "sync_deals", "oauth_support"]`.

- [ ] **Step 3: Commit.**

### Task 8: Salesforce client — `buildAuthorizeUrl` + `exchangeCode` + `refreshAccessToken`

**Files:**
- Modify: `plugins/salesforce/src/client.ts`

**Interfaces:**
- Produces:
  - `static buildAuthorizeUrl(instanceUrl: string, clientId: string, redirectUri: string, state: string): string`
  - `static exchangeCode(instanceUrl: string, clientId: string, clientSecret: string, redirectUri: string, code: string): Promise<{ accessToken: string; refreshToken: string; instanceUrl: string }>`
  - `static refreshAccessToken(instanceUrl: string, clientId: string, clientSecret: string, refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }>`

- [ ] **Step 1: Write failing tests** in `plugins/salesforce/src/connector.test.ts` (or a new `client.test.ts`) mocking `fetch`: one for `exchangeCode` (asserts `grant_type=authorization_code` + returns instance_url), one for `refreshAccessToken` (asserts `grant_type=refresh_token`), one for `buildAuthorizeUrl` (asserts `response_type=code` + `scope=api%20refresh_token`).

- [ ] **Step 2: Run to confirm failure.** **Step 3: Implement.** Use the token endpoint at `${baseUrl}/services/oauth2/token` (the existing `authenticate` already resolves sandbox vs prod login hosts; reuse that host resolution by calling the same `tokenUrls` logic or refactor it into a private helper).

```ts
static buildAuthorizeUrl(instanceUrl: string, clientId: string, redirectUri: string, state: string): string {
  const isSandbox = instanceUrl.includes("test.salesforce.com") || instanceUrl.includes("sandbox");
  const base = isSandbox ? "https://test.salesforce.com" : "https://login.salesforce.com";
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "api refresh_token",
    state,
  });
  return `${base}/services/oauth2/authorize?${params.toString()}`;
}

static async exchangeCode(instanceUrl: string, clientId: string, clientSecret: string, redirectUri: string, code: string) {
  const body = new URLSearchParams({ grant_type: "authorization_code", client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, code });
  const res = await fetch(`${instanceUrl.replace(/\/+$/, "")}/services/oauth2/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() });
  if (!res.ok) { const t = await res.text().catch(() => ""); throw new Error(`Salesforce OAuth failed: HTTP ${res.status} — ${t.slice(0, 200)}`); }
  const data = (await res.json()) as any;
  return { accessToken: data.access_token, refreshToken: data.refresh_token, instanceUrl: data.instance_url };
}

static async refreshAccessToken(instanceUrl: string, clientId: string, clientSecret: string, refreshToken: string) {
  const body = new URLSearchParams({ grant_type: "refresh_token", client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken });
  const res = await fetch(`${instanceUrl.replace(/\/+$/, "")}/services/oauth2/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() });
  if (!res.ok) { const t = await res.text().catch(() => ""); throw new Error(`Salesforce token refresh failed: HTTP ${res.status} — ${t.slice(0, 200)}`); }
  const data = (await res.json()) as any;
  return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in || 7200 };
}
```

- [ ] **Step 4: Run to confirm pass.** **Step 5: Commit.**

### Task 9: Salesforce connector — `refreshTokens` + `oauth_support`

**Files:**
- Modify: `plugins/salesforce/src/connector.ts`

**Interfaces:**
- Produces: `refreshTokens(config)` returning `{ accessToken, refreshToken, expiresAt, instanceUrl }`; `getUIMetadata().features` includes `"oauth_support"`.

- [ ] **Step 1: Implement `refreshTokens`.**

```ts
async refreshTokens(config: ConnectionConfig): Promise<ConnectionConfig> {
  const clientId = process.env.SALESFORCE_CLIENT_ID;
  const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Salesforce OAuth not configured (SALESFORCE_CLIENT_ID/SECRET)");
  if (!config.refreshToken) throw new Error("Salesforce refresh token missing");
  const instanceUrl = (config.instanceUrl as string) || "https://login.salesforce.com";
  const t = await SalesforceClient.refreshAccessToken(instanceUrl, clientId, clientSecret, config.refreshToken as string);
  return { accessToken: t.accessToken, refreshToken: t.refreshToken, instanceUrl, expiresAt: Date.now() + t.expiresIn * 1000 };
}
```

- [ ] **Step 2: Update `getSettingsSchema`** so `instanceUrl` is no longer `required` (OAuth path supplies it), and mark the manual `accessToken`/`clientId`/`clientSecret` fields as the "advanced" path. Keep them for the manual fallback.

- [ ] **Step 3: Add `oauth_support`** to `getUIMetadata().features`. **Step 4: Commit.**

### Task 10: Shared OAuth lib (state signing, start URL, callback, refresh)

**Files:**
- Create: `artifacts/api/src/lib/integrations/oauth.ts`

**Interfaces:**
- Produces:
  - `signState(workspaceId: string, connector: string): string`
  - `verifyState(state: string): { workspaceId: string; connector: string }` (throws on bad HMAC)
  - `buildOAuthStartUrl(connector: string, redirectUri: string, state: string): string` (returns provider authorize URL)
  - `handleOAuthCallback(connector: string, code: string, state: string): Promise<void>` (exchange, persist, kick off syncs)
  - `ensureFreshConfig(conn, plugin): Promise<ConnectionConfig>`

- [ ] **Step 1: Write failing tests** (`artifacts/api/src/lib/integrations/oauth.test.ts`) covering: `signState`/`verifyState` round-trip + tamper rejection; `ensureFreshConfig` returns config untouched when not `authType: "oauth"`, refreshes when expired, and persists the new encrypted config (mock `IntegrationConnection.updateOne` and a fake plugin).

- [ ] **Step 2: Implement.** HMAC state uses `SESSION_SECRET`.

```ts
import { createHmac } from "crypto";
import { IntegrationConnection } from "@workspace/db";
import { pluginRegistry, type CKitPlugin, type ConnectionConfig } from "@workspace/plugins-core";
import { decryptConfig, encryptConfig } from "../crypto";
import { logger } from "../logger";

function hmac(payload: string): string {
  const secret = process.env.SESSION_SECRET || "dev-secret";
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function signState(workspaceId: string, connector: string): string {
  const body = `${workspaceId}:${connector}`;
  return `${body}.${hmac(body)}`;
}

export function verifyState(state: string): { workspaceId: string; connector: string } {
  const [body, sig] = String(state || "").split(".");
  if (!body || !sig || hmac(body) !== sig) throw new Error("Invalid OAuth state");
  const [workspaceId, connector] = body.split(":");
  if (!workspaceId || !connector) throw new Error("Invalid OAuth state");
  return { workspaceId, connector };
}

export async function ensureFreshConfig(conn: IntegrationConnection, plugin: CKitPlugin): Promise<ConnectionConfig> {
  const config = decryptConfig(conn.config as string) ?? {};
  if (config.authType !== "oauth") return { ...config, _metadata: conn.metadata ?? {} };
  const expiresAt = Number(config.expiresAt) || 0;
  if (expiresAt > Date.now() + 5 * 60 * 1000) return { ...config, _metadata: conn.metadata ?? {} };
  if (!plugin.refreshTokens) throw new Error("Connector does not support token refresh");
  logger.info({ workspaceId: conn.workspaceId, connector: conn.connectorName }, "[OAuth] Refreshing access token");
  const patch = await plugin.refreshTokens(config);
  const merged = { ...config, ...patch };
  await IntegrationConnection.updateOne({ _id: conn._id }, { config: encryptConfig(merged) });
  return { ...merged, _metadata: conn.metadata ?? {} };
}
```

- [ ] **Step 3: Implement `buildOAuthStartUrl` + `handleOAuthCallback`** in the same file (the callback handler is the provider-agnostic part of Task 11; the start URL is provider-specific via each plugin's client `buildAuthorizeUrl` — to avoid coupling, `handleOAuthCallback` reads `connector` and dispatches to `HubSpotClient.exchangeCode` or `SalesforceClient.exchangeCode` via dynamic `import`). Keep the redirect target constant: `${process.env.APP_URL || "http://localhost:3000"}/dash/integrations?connected=${connector}`.

- [ ] **Step 4: Run to confirm pass.** **Step 5: Commit.**

### Task 11: OAuth start + callback routes

**Files:**
- Modify: `artifacts/api/src/routes/integrations/routes.ts` (add routes; delete the old `/hubspot/callback`)

**Interfaces:**
- Consumes: `signState`, `verifyState`, `buildOAuthStartUrl`, `handleOAuthCallback`, `startSyncs`.
- Produces:
  - `GET /:workspaceId/oauth/start/:connector` (requirePermission `workspace:edit`) → 302 to provider.
  - `GET /oauth/:connector/callback` (public) → exchange + persist + 302 to app.

- [ ] **Step 1: Add the start route.**

```ts
router.get("/:workspaceId/oauth/start/:connector", ...requirePermission("workspace", "edit"), async (req, res) => {
  const { workspaceId, connector } = req.params as { workspaceId: string; connector: string };
  const plugin = pluginRegistry.get(connector);
  if (!plugin) { res.status(404).json({ error: "Connector not found" }); return; }
  const redirectUri = process.env[`${connector.toUpperCase()}_REDIRECT_URI`] || `${req.protocol}://${req.get("host")}/api/integrations/oauth/${connector}/callback`;
  const state = signState(workspaceId, connector);
  const url = buildOAuthStartUrl(connector, redirectUri, state);
  res.redirect(url);
});
```

- [ ] **Step 2: Add the callback route** (and remove the old `/hubspot/callback` block).

```ts
router.get("/oauth/:connector/callback", async (req, res) => {
  const { connector } = req.params as { connector: string };
  const code = req.query.code as string;
  const state = req.query.state as string;
  try {
    const { workspaceId } = verifyState(state || "");
    if (!code) { res.status(400).send("Missing code"); return; }
    await handleOAuthCallback(connector, code, state);
    res.redirect(`${process.env.APP_URL || "http://localhost:3000"}/dash/integrations?connected=${connector}`);
  } catch (err: any) {
    logger.error({ err, connector }, "[OAuth] Callback failed");
    res.status(500).send(`OAuth failed: ${err.message}`);
  }
});
```

- [ ] **Step 3: Implement `handleOAuthCallback`** (in `oauth.ts`) — exchange the code, upsert the connection with `authType: "oauth"` + tokens + `expiresAt`, then `startSyncs`. Uses dynamic `import("@workspace/plugins-hubspot")` / `import("@workspace/plugins-salesforce")` and their `exchangeCode`. Env creds come from `process.env`.

- [ ] **Step 4: Add tests** — mock the provider token endpoint; assert the start route 302s to the provider and the callback persists `accessToken` + `authType:"oauth"` and redirects to `/dash/integrations?connected=...`. Run `bun test --filter @workspace/api`.

- [ ] **Step 5: Commit.**

### Task 12: Wire `ensureFreshConfig` into sync workers + stage routes

**Files:**
- Modify: `artifacts/api/src/workers/sync-reps-worker.ts:53-62`, `sync-deals-worker.ts:53-62`
- Modify: `artifacts/api/src/routes/integrations/routes.ts` (salesforce/hubspot stage GET handlers at ~690-712 and ~773-780)

**Interfaces:**
- Consumes: `ensureFreshConfig`.

- [ ] **Step 1: Replace the config build** in both workers:

```ts
// was:
const pluginConfig = { ...(decryptConfig(conn.config as string) || {}), _metadata: conn.metadata || {} };
// now:
const pluginConfig = await ensureFreshConfig(conn, plugin);
```

- [ ] **Step 2: In the stage-mapping GET handlers**, before building the provider client, run `const config = await ensureFreshConfig(conn, plugin)` and read `accessToken`/`instanceUrl` from it (instead of raw `decryptConfig`).

- [ ] **Step 3: Add a test** that a worker with an expired `expiresAt` triggers `refreshTokens` and uses the new token (mock the plugin + `IntegrationConnection.updateOne`). Run `bun test --filter @workspace/api`.

- [ ] **Step 4: Commit.**

### Task 13: Env example + docs

**Files:**
- Modify: `artifacts/api/.env.example`

- [ ] **Step 1: Add** under a new `─── Integrations (OAuth) ───` section:

```
HUBSPOT_CLIENT_ID=""
HUBSPOT_CLIENT_SECRET=""
SALESFORCE_CLIENT_ID=""
SALESFORCE_CLIENT_SECRET=""
# Optional overrides; default is derived from request host:
# HUBSPOT_REDIRECT_URI=https://app.commissionkit.co/api/integrations/oauth/hubspot/callback
# SALESFORCE_REDIRECT_URI=https://app.commissionkit.co/api/integrations/oauth/salesforce/callback
```

- [ ] **Step 2: Commit.**

---

## Phase 3 — Frontend One-Button UX

### Task 14: Types — status list

**Files:**
- Modify: `artifacts/web/src/pages/integrations/types.ts`

- [ ] **Step 1: Add** `export type ConnectionStatusList = { connections: ConnectionStatus[] };`

- [ ] **Step 2: Commit.**

### Task 15: `OAuthConnectButton` component

**Files:**
- Create: `artifacts/web/src/pages/integrations/oauth-connect-button.tsx`
- Modify: `artifacts/web/src/pages/integrations/connector-card.tsx`

**Interfaces:**
- Consumes: `Connector`, `isConnected`, `activeWorkspace.id`.
- Produces: a primary "Connect <Provider>" button that triggers OAuth; an "Advanced" disclosure revealing the existing `ConnectDialog` form.

- [ ] **Step 1: Build the component.** When `connector.features` includes `oauth_support` and not connected, render a primary button that sets `window.location.href = `${import.meta.env.VITE_API_URL || ""}/api/integrations/${workspaceId}/oauth/start/${connector.name}``. Below it, a `<details>`/`<summary>` "Advanced — enter credentials manually" that renders the existing `ConnectDialog`.

- [ ] **Step 2: Wire into `connector-card.tsx`** — use `OAuthConnectButton` when the feature is present, else the existing `ConnectDialog`.

- [ ] **Step 3: Add a component test** (happy-dom) asserting the button renders and the advanced fallback toggles. Run `bun test --filter @workspace/web`.

- [ ] **Step 4: Commit.**

### Task 16: Multi-connected cards on the integrations page

**Files:**
- Modify: `artifacts/web/src/pages/integrations/integrations.tsx` (status query + rendering)

**Interfaces:**
- Consumes: `ConnectionStatusList` from Task 14.

- [ ] **Step 1: Update the `status` query** to read `data.connections` (array). Derive `connectedNames = new Set(connections.map(c => c.connectorName))`.

- [ ] **Step 2: Render one `ConnectedCard` per connection** in `status.connections`, and pass `isConnected = connectedNames.has(connector.name)` to each `ConnectorCard`.

- [ ] **Step 3: Update `ConnectedCard` calls** (disconnect / sync / settings) to pass the connector name from each connection object, and add `?connector=` to the underlying `apiFetch` calls in `connected-card.tsx` + dialogs.

- [ ] **Step 4: Read `?connected=` from `window.location.search`** on mount and surface a success toast (`sonner`) for the returned connector.

- [ ] **Step 5: Run `bun test --filter @workspace/web` + `bun run typecheck`.** **Step 6: Commit.**

---

## Self-Review

- **Spec coverage:** One-button OAuth (Tasks 10–11, 15) ✓; env-based creds (Tasks 7, 9, 13) ✓; multi-connector schema + routes (Tasks 1, 3–4, 16) ✓; token refresh (Tasks 5–6, 8–10, 12) ✓; advanced fallback (Task 15) ✓.
- **Placeholder scan:** All code steps include concrete snippets; no TBD/TODO.
- **Type consistency:** `refreshTokens?(config): Promise<ConnectionConfig>` is defined in Task 5 and consumed identically in Tasks 7, 9, 10, 12. `signState`/`verifyState`/`buildOAuthStartUrl`/`handleOAuthCallback`/`ensureFreshConfig`/`startSyncs` signatures are consistent across Tasks 2, 10, 11. Job ids consistently carry the `-${connectorName}` suffix (Tasks 2, 4).
- **Open item for deployment (@vault):** register the OAuth apps with HubSpot + Salesforce, set the 4 env vars + redirect URIs on staging/prod, and confirm `APP_URL`/API origin routing through the nginx proxy.

## Execution Handoff

Plan complete and saved to `docs/plan-one-click-oauth-integrations.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — execute tasks in this session with checkpoints.

Recommended sequencing: run Phases 1–2 via @forge (backend) with a @review gate after Phase 2 (schema + public callback + auth touched), then Phase 3 via @pixel. Which approach do you want?
