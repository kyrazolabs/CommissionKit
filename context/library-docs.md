# Library Docs — CommissionKit

This document summarizes the shared libraries, their responsibilities, public APIs, and how to use them.

---

## `@workspace/db`

**Location**: `lib/db/`

**Responsibility**: Database connection, Mongoose schemas, types, Zod insert schemas, and plan limits.

### Connection

```ts
import { connectDB } from "@workspace/db";
const conn = await connectDB();
```

Uses `MONGO_URL` env (default `mongodb://localhost:27017/commissionkit`).

### Exported Schemas

Main barrel: `lib/db/src/schema/index.ts`

| Model | File | Purpose |
|-------|------|---------|
| `Rep` | `schema/reps.ts` | Sales reps |
| `Plan` | `schema/plans.ts` | Commission plans |
| `PlanTier` | `schema/plans.ts` | Tiered plan tiers |
| `Deal` | `schema/deals.ts` | Sales deals |
| `CommissionRun` | `schema/commissionRuns.ts` | Calculation runs |
| `CommissionResult` | `schema/commissionRuns.ts` | Per-deal calc results |
| `Workspace` | `schema/workspaces.ts` | Workspaces |
| `WorkspaceMember` | `schema/workspaces.ts` | Memberships |
| `WorkspaceSubscription` | `schema/subscriptions.ts` | Stripe subscriptions |
| `Payout` | `schema/payouts.ts` | Commission payouts |
| `Dispute` | `schema/disputes.ts` | Payout disputes |
| `Role` | `schema/roles.ts` | Custom RBAC roles |
| `Notification` | `schema/notifications.ts` | In-app notifications |
| `ExchangeRate` | `schema/exchangeRate.ts` | Cached FX rates |
| `IntegrationConnection` | `schema/integrationConnection.ts` | ERP/CRM connections |
| `IntegrationSync` | `schema/integrationSync.ts` | Sync job records |
| `IntegrationLog` | `schema/integrationLog.ts` | Sync logs |

### AISSOL Schemas

Barrel: `lib/db/src/schema/aissol/index.ts`

| Model | Purpose |
|-------|---------|
| `AissolCommissionMatrix` | Slab × GM bracket rates |
| `AissolProject` | Enterprise projects |
| `AissolInvoice` | Project invoices |

Import via `@workspace/db/schema/aissol`.

### Plan Limits

```ts
import { getPlanLimits, PLAN_LIMITS } from "@workspace/db";
const limits = getPlanLimits("growth"); // { maxMembers, maxReps, maxPlans }
```

---

## `@workspace/queue`

**Location**: `lib/queue/`

**Responsibility**: BullMQ queues, Redis connection, SMTP mailer, workers, and job enqueue helpers.

### Connection

```ts
import { getRedisClient } from "@workspace/queue";
const redis = getRedisClient();
```

Set `REDIS_URL=redis-mock://` in tests to use `ioredis-mock`.

### Enqueue Helpers

```ts
import {
  enqueueEmail,
  sendHighPriorityEmail,
  sendMediumPriorityEmail,
  sendLowPriorityEmail,
  enqueueCommissionCalc,
  enqueueExchangeRateSync,
  enqueueLogsFlush,
} from "@workspace/queue";

await sendHighPriorityEmail({ to, toName, subject, html, meta });
await enqueueCommissionCalc({ workspaceId, runId, period, paymentStatuses });
await enqueueExchangeRateSync({ force: true });
```

### Mailer

```ts
import { sendMail, verifySmtp } from "@workspace/queue/mailer";
await verifySmtp();
await sendMail({ to, subject, html });
```

SMTP configured via env: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.

### Workers

```ts
import { closeWorkers } from "@workspace/queue/worker";
await closeWorkers();
```

Workers:
- `highWorker` → routes high-priority emails to `mailSendQueue` (concurrency 20).
- `mediumWorker` → routes medium-priority emails (concurrency 10).
- `lowWorker` → routes low-priority emails (concurrency 5).
- `smtpWorker` → sends via SMTP (concurrency 2, 10/sec).
- `exchangeRateWorker` → fetches and saves FX rates.

### Queues

```ts
import {
  mailHighQueue,
  mailMediumQueue,
  mailLowQueue,
  mailSendQueue,
  commissionCalcQueue,
  exchangeRateQueue,
  logsFlushQueue,
  syncRepsQueue,
  syncDealsQueue,
  webhookIngressQueue,
  syncEgressQueue,
} from "@workspace/queue/queues";
```

All queues share `prefix: "ck"` and exponential backoff defaults.

---

## `@workspace/api-zod`

**Location**: `lib/api-zod/`

**Responsibility**: Shared Zod validators generated from `lib/api-spec/openapi.yaml`.

```ts
import { insertRepSchema, updateDealSchema } from "@workspace/api-zod";
const parsed = insertRepSchema.parse(req.body);
```

Regenerate with:

```bash
bun run --filter @workspace/api-spec codegen
```

Do not hand-edit `lib/api-zod/src/generated/api.ts`.

---

## `@workspace/api-client-react`

**Location**: `lib/api-client-react/`

**Responsibility**: Auto-generated React Query hooks + fetcher config.

```ts
import { useGetReps, useCreateDeal, setBaseUrl, setWorkspaceId } from "@workspace/api-client-react";

const { data, isLoading } = useGetReps();
const { mutate } = useCreateDeal();
```

### Custom Fetch

`custom-fetch.ts` exposes:

```ts
setBaseUrl(url: string)
setAuthTokenGetter(() => Promise<string | null>)
setWorkspaceId(id: string | null)
```

Used by `useAuth` to configure cookie-based auth and workspace header.

---

## `@workspace/email-templates`

**Location**: `lib/email-templates/`

**Responsibility**: HTML string templates for transactional emails.

### Templates

```ts
import {
  welcomeTemplate,
  invitationTemplate,
  passwordResetTemplate,
  emailVerificationTemplate,
  verificationCodeTemplate,
  commissionRunTemplate,
  clawbackAlertTemplate,
  repPortalTemplate,
  payoutUpdateTemplate,
  disputeUpdateTemplate,
} from "@workspace/email-templates";

const html = welcomeTemplate({ name, workspaceName, loginUrl });
```

### Base Helpers

```ts
import { baseTemplate, btn, h1, h2, p, muted, divider, infoBox, warningBox, statRow, cardSection } from "@workspace/email-templates";
```

All templates return plain HTML strings; no React dependency.

---

## `@workspace/plugins-core`

**Location**: `plugins/core/`

**Responsibility**: Base plugin interface, registry, HTTP client, and normalization utilities.

### Registry

```ts
import { pluginRegistry } from "@workspace/plugins-core";
pluginRegistry.register(new OdooConnector());
```

### Base Types

```ts
import type { CKitPlugin, NormalizedRep, NormalizedDeal, ConnectionConfig } from "@workspace/plugins-core";
```

### Helpers

```ts
import { normalizeCurrency, derivePeriod, derivePaymentStatus, generateAccessCode } from "@workspace/plugins-core";
```

---

## Integration Plugins

### `@workspace/plugins-odoo`

- Syncs reps from `res.users`.
- Syncs deals from `sale.order`.
- Resolves payment status from actual invoice data.
- Supports Odoo 15+ Community and Enterprise.

### `@workspace/plugins-salesforce`

- OAuth 2.0 Client Credentials flow.
- Syncs users as reps, opportunities as deals.
- Auto-discovers pipeline stages; supports stage mapping/filtering.

### `@workspace/plugins-hubspot`

- Service Key or Legacy App token auth.
- Syncs owners as reps, deals by pipeline stage.
- Auto-discovers pipeline stages.

### `@workspace/plugins-custom`

- Generic REST API connector.
- Configurable auth: Bearer, API Key, Basic Auth.
- JSONPath field mappings.
- Pagination: offset, cursor, page.
- `$div` compute fields for micros → dollars.

---

## Commission Engine Interface

**Location**: `artifacts/api/src/workers/engines/CalcEngine.ts`

```ts
export interface CalcEngine {
  readonly name: string;
  readonly label: string;
  calculate(input: CalcEngineInput): Promise<CalcEngineOutput>;
  features(): EngineFeature;
}
```

Engines are registered in `artifacts/api/src/workers/engines/registry.ts` and selected per workspace via `workspace.commissionEngine`.

### Standard Engine

`artifacts/api/src/workers/engines/standard.engine.ts`

Supports:
- `flat`: single percentage on deal amount.
- `tiered`: progressive rates over amount brackets.
- `accelerator`: higher rate once threshold exceeded.

Multi-currency conversion via `convertCurrencyAt` using exchange-rate snapshots.

### AISSOL Engine

`artifacts/api/src/workers/engines/aissol.engine.ts`

- Project-based slab lookup.
- Gross margin bracket calculation.
- Commission matrix lookup.
- Invoice-level commission calculation.

---

## Auth Helpers

### API

`artifacts/api/src/lib/auth.ts` exports the configured Better Auth instance:

```ts
import { auth } from "@/lib/auth";
```

`artifacts/api/src/middleware/auth.ts` exports:

```ts
requireAuth
requireWorkspaceMember(minRole)
requirePermission(resource, action)
requireGrowthPlan
```

### Web

`artifacts/web/src/lib/auth-client.ts` exports the Better Auth client.

`artifacts/web/src/hooks/use-auth.tsx` provides session + signOut context.

---

## Utility Libraries

### API Fetch (Web)

`artifacts/web/src/lib/api.ts`

```ts
import { apiFetch, paginatedFetch } from "@/lib/api";
const data = await apiFetch("/api/deals");
const { data, totalCount } = await paginatedFetch<Deal>("/api/deals");
```

### Formatting

`artifacts/web/src/lib/format.ts`

Helpers for currency, dates, percentages.

### Currencies

`artifacts/web/src/lib/currencies.ts`

List of 170+ currencies with metadata.

### Analytics

`artifacts/web/src/lib/analytics.ts`

Event tracking wrapper.

---

## Where to Find More

- API route docs: see `context/architecture.md` route table.
- UI component docs: see `context/ui-registry.md`.
- Design tokens: see `context/ui-tokens.md`.
- Code standards: see `context/code-standards.md`.
