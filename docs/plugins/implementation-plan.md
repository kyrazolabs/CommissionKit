# Implementation Plan

## Overview

This plan converts the plugin architecture from design into code. The implementation is split into 6 phases, each delivering concrete, shippable value. The order is designed so that each phase builds on the previous one, and Phase 1 already delivers value (users can manually sync an ERP via the custom REST connector).

---

## Phase 1: Foundation (Weeks 1-2)

**Goal**: Plugin SDK, plugin registry, custom REST connector, basic sync infrastructure.

### Tasks

#### 1.1 Plugin Core (`plugins/core/`)
- [ ] Create `plugins/core/types.ts` — All shared TypeScript types and interfaces
- [ ] Create `plugins/core/base.ts` — `BasePlugin` abstract class
- [ ] Create `plugins/core/registry.ts` — `PluginRegistry` class
- [ ] Create `plugins/core/http.ts` — `PluginHttpClient` with retries, timeouts, rate limiting
- [ ] Create `plugins/core/transform.ts` — Shared transform utilities (`normalizeCurrency`, `derivePeriod`, etc.)
- [ ] Create `plugins/core/package.json` — `@workspace/plugins-core`

#### 1.2 Database Models
- [ ] Create `lib/db/src/schema/integrationConnection.ts` — `IntegrationConnection` model
- [ ] Create `lib/db/src/schema/integrationSync.ts` — `IntegrationSync` model
- [ ] Create `lib/db/src/schema/integrationLog.ts` — `IntegrationLog` model
- [ ] Add `externalId`, `sourceSystem`, `syncHash`, `lastSyncedAt` fields to:
  - `Rep` schema
  - `Deal` schema
  - `AissolProject` schema
  - `AissolInvoice` schema
- [ ] Create compound unique index: `{ workspaceId: 1, sourceSystem: 1, externalId: 1 }` on each model
- [ ] Create Zod schemas for all new models
- [ ] Export from `lib/db/src/schema/index.ts`
- [ ] Run `bun run --filter @workspace/api-spec codegen` to update generated types

#### 1.3 Custom REST Connector
- [ ] Create `plugins/custom/` directory
- [ ] Implement `CustomConnector` class
- [ ] Implement config parser and Zod validation for the configuration JSON
- [ ] Implement JSONPath extractor
- [ ] Implement pagination strategies (offset, cursor, page)
- [ ] Implement auth handlers (apiKey, bearer, basic, oauth2)
- [ ] Unit tests for custom connector

#### 1.4 Sync Engine (Ingress Only)
- [ ] Create `artifacts/api/src/lib/sync/` directory
- [ ] Implement `upsert-engine.ts` — Generic upsert logic for all entity types
- [ ] Implement entity-specific upsert functions (`upsertRep`, `upsertDeal`, etc.)
- [ ] Implement change detection (hash comparison)
- [ ] Implement workspace-level locking
- [ ] Unit tests for upsert engine

#### 1.5 BullMQ Sync Queues
- [ ] Add queue name constants: `SYNC_REPS_QUEUE`, `SYNC_DEALS_QUEUE`, `SYNC_PROJECTS_QUEUE`, `SYNC_INVOICES_QUEUE`, `SYNC_PAYMENTS_QUEUE`, `WEBHOOK_INGRESS_QUEUE`
- [ ] Create queue instances in `lib/queue/src/queues.ts`
- [ ] Create job schemas in `lib/queue/src/schemas.ts`
- [ ] Create sync workers in `artifacts/api/src/workers/`
  - `sync-reps-worker.ts`
  - `sync-deals-worker.ts`
  - `sync-projects-worker.ts`
  - `sync-invoices-worker.ts`
  - `sync-payments-worker.ts`
  - `webhook-ingress-worker.ts`

#### 1.6 Bootstrap & Registration
- [ ] In `artifacts/api/src/index.ts`, initialize PluginRegistry and register connectors
- [ ] On server startup, reinitialize active connections from MongoDB
- [ ] Schedule recurring sync jobs for all connected workspaces

### Deliverables
- Custom REST connector working end-to-end
- Manual sync of reps and deals from any REST API
- Sync history visible via API
- All new models persisted

---

## Phase 2: Odoo Connector (Weeks 3-4)

**Goal**: Full Odoo integration — the reference connector implementation.

### Tasks

#### 2.1 Odoo Client
- [ ] Create `plugins/odoo/` directory
- [ ] Implement `OdooClient` — Odoo JSON-RPC wrapper (authenticate, searchRead, searchCount, create, write, unlink)
- [ ] Handle Odoo session management
- [ ] Implement rate limiting (3 concurrent requests)
- [ ] Tests with mock Odoo JSON-RPC responses

#### 2.2 Odoo Connector
- [ ] Implement `OdooConnector` extending `BasePlugin`
- [ ] Implement `fetchReps()` — `res.users` → NormalizedRep
- [ ] Implement `fetchDeals()` — `sale.order` → NormalizedDeal
- [ ] Implement `fetchProjects()` — `project.project` → NormalizedProject (enterprise)
- [ ] Implement `fetchInvoices()` — `account.move` → NormalizedInvoice (enterprise)
- [ ] Implement `fetchPayments()` — `account.payment` → NormalizedPayment
- [ ] Implement currency name → ISO 4217 mapping
- [ ] Implement payment status derivation from invoice state
- [ ] Tests for all fetch methods

#### 2.3 Odoo Webhooks
- [ ] Implement `verifyWebhook()` — HMAC-SHA256 verification
- [ ] Implement `parseWebhook()` — Odoo event → IngresEvent
- [ ] Create `ckit_webhooks` Odoo module (Python) for users to install
  - [ ] `__manifest__.py`
  - [ ] `models/webhook.py` — Hook into `create`, `write`, `unlink`
  - [ ] `data/automation.xml` — Automated actions for key models
  - [ ] Documentation for installing the module

#### 2.4 Odoo Write-Back
- [ ] Implement `writeBackCommission()` — Creates/updates custom fields on `sale.order`
- [ ] Implement `writeBackPayoutStatus()` — Updates payout status fields
- [ ] Implement `ensureCustomFields()` — Idempotent custom field creation
- [ ] Define custom field specs in `fields.ts`

### Deliverables
- Full Odoo ERP integration
- Automated rep + deal + invoice + payment sync
- Webhook-based real-time updates
- Commission/payout write-back to Odoo

---

## Phase 3: HubSpot Connector (Weeks 5-6)

**Goal**: HubSpot CRM integration, OAuth support, pipeline auto-discovery.

### Tasks

#### 3.1 HubSpot Client
- [ ] Create `plugins/hubspot/` directory
- [ ] Implement `HubSpotClient` — REST API v3 wrapper
- [ ] Implement OAuth 2.0 flow (token refresh, scopes)
- [ ] Implement private app token auth
- [ ] Implement search API pagination
- [ ] Implement rate limit handling (adaptive from response headers)

#### 3.2 HubSpot Connector
- [ ] Implement `HubSpotConnector` extending `BasePlugin`
- [ ] Implement `fetchReps()` — HubSpot owners → NormalizedRep
- [ ] Implement `fetchDeals()` — HubSpot deals (search API) → NormalizedDeal
- [ ] Implement pipeline/stage auto-discovery on connection
- [ ] Tests for all fetch methods

#### 3.3 HubSpot Webhooks
- [ ] Implement webhook subscription registration (on connect)
- [ ] Implement webhook subscription deregistration (on disconnect)
- [ ] Implement `verifyWebhook()` — HubSpot v3 signature verification
- [ ] Implement `parseWebhook()` — HubSpot event → IngresEvent

#### 3.4 HubSpot Write-Back
- [ ] Implement `writeBackCommission()` — Batch update custom properties on deals
- [ ] Implement custom property definition creation (idempotent)
- [ ] Group properties under "CommissionKit" group in HubSpot

### Deliverables
- Full HubSpot CRM integration
- OAuth + private app token support
- Pipeline auto-discovery
- Webhook-based real-time deal sync
- Commission write-back as deal properties

---

## Phase 4: API Endpoints & UI (Weeks 7-8)

**Goal**: Wire up the REST API and build the integration settings UI.

### Tasks

#### 4.1 API Routes
- [ ] Create `artifacts/api/src/routes/integrations/` directory
- [ ] `GET /api/integrations/connectors` — List connectors from registry
- [ ] `GET /api/integrations/connectors/:name` — Connector metadata + settings schema
- [ ] `GET /api/integrations/:workspaceId/status` — Connection status
- [ ] `POST /api/integrations/:workspaceId/connect` — Connect + start initial sync
- [ ] `POST /api/integrations/:workspaceId/test` — Test connection via connector
- [ ] `PATCH /api/integrations/:workspaceId/config` — Update config
- [ ] `DELETE /api/integrations/:workspaceId/disconnect` — Disconnect
- [ ] `GET /api/integrations/:workspaceId/sync-history` — List sync history
- [ ] `GET /api/integrations/:workspaceId/sync-history/:id` — Sync detail
- [ ] `POST /api/integrations/:workspaceId/sync/:entityType` — Manual sync
- [ ] `GET /api/integrations/:workspaceId/logs` — Detailed logs
- [ ] `POST /api/integrations/webhooks/:connectorName` — Webhook receiver
- [ ] Register routes in `artifacts/api/src/routes/index.ts`

#### 4.2 Middleware
- [ ] Add `requireWorkspaceMember` and `requirePermission` checks to all management endpoints
- [ ] Implement webhook verification middleware (connector-specific)

#### 4.3 API Tests
- [ ] Integration tests for all new endpoints
- [ ] Test connection flow (success + failure cases)
- [ ] Test sync trigger and history retrieval
- [ ] Test webhook verification

#### 4.4 Web UI — Integration Settings Page
- [ ] Create `artifacts/web/src/pages/integrations/` page
- [ ] Connector marketplace / selection screen
- [ ] Dynamic settings form (rendered from `getSettingsSchema()` JSON Schema)
- [ ] Connection status indicator
- [ ] Sync schedule configuration
- [ ] Sync history table with status badges
- [ ] Manual sync buttons
- [ ] Write-back toggle
- [ ] Test connection button with result display

#### 4.5 Web UI — Dashboard Indicators
- [ ] Add sync status badge to entity lists (reps, deals)
- [ ] Show "Synced via Odoo — 5m ago" or "Stale" indicators
- [ ] Add stale data warning banner when sync is behind

#### 4.6 API Client Generation
- [ ] Add new endpoints to OpenAPI spec
- [ ] Run codegen: `bun run --filter @workspace/api-spec codegen`
- [ ] Auto-generate React Query hooks for integration endpoints

### Deliverables
- Full REST API for plugin management
- Integration settings page in the web UI
- Real-time sync status in dashboard

---

## Phase 5: Egress & Advanced Features (Weeks 9-10)

**Goal**: Write-back engine, embedding support, enterprise connector completion.

### Tasks

#### 5.1 Write-Back Engine
- [ ] Implement egress worker — `artifacts/api/src/workers/sync-egress-worker.ts`
- [ ] Trigger write-back on commission run completion
- [ ] Trigger write-back on payout status change
- [ ] Log write-back results to IntegrationLog
- [ ] Tests for write-back flow

#### 5.2 Salesforce Connector
- [ ] Create `plugins/salesforce/` directory
- [ ] Implement OAuth 2.0 + JWT bearer flow
- [ ] Implement SOQL queries for Opportunities, Users
- [ ] Implement webhook handling (Streaming API or Change Data Capture)
- [ ] Implement write-back to custom fields on Opportunity
- [ ] Tests

#### 5.3 Zoho CRM Connector
- [ ] Create `plugins/zoho/` directory
- [ ] Implement OAuth 2.0 flow
- [ ] Implement deal and salesperson sync
- [ ] Tests

#### 5.4 Embedding Support
- [ ] Add `?embed=true` query parameter to the web app
- [ ] When embedded: hide global nav, compact header, no footer
- [ ] JWT-based embedding auth (token in URL, no cookie required)
- [ ] Configure `X-Frame-Options` dynamically per workspace connector
- [ ] Document embedding setup for each ERP

#### 5.5 Notification Preferences
- [ ] Add integration-specific notification types:
  - `sync.completed`, `sync.failed`, `sync.stale`
  - `connection.error`, `connection.auth_expired`
- [ ] Add to `UserNotificationPrefs` the new event types
- [ ] Auto-send email notifications on connection failure

### Deliverables
- Commission write-back to ERPs
- Salesforce and Zoho connectors
- Embedding support for in-ERP UI
- Integration health notifications

---

## Phase 6: Polish & Production (Weeks 11-12)

**Goal**: Production hardening, monitoring, documentation, migration tools.

### Tasks

#### 6.1 Encryption
- [ ] Implement AES-256-GCM encryption for connector configs
- [ ] Implement `ENCRYPTION_SECRET` environment variable
- [ ] Implement key rotation support
- [ ] Ensure encrypted data is never logged or exposed in API responses

#### 6.2 Monitoring & Observability
- [ ] Prometheus metrics for sync operations:
  - `ckit_sync_total{entity, status}`
  - `ckit_sync_duration_seconds{entity}`
  - `ckit_sync_stale{workspace}`
  - `ckit_webhook_total{connector, status}`
- [ ] Bull Board integration for all sync queues
- [ ] Log ship: structured JSON logs for sync events

#### 6.3 Error Recovery
- [ ] Stale data detection: mark data as stale after N failed syncs
- [ ] Admin notification: email workspace admins on connection failure
- [ ] Automatic reconnect: retry on transient failures with backoff
- [ ] Dead letter queue for permanently failed sync events

#### 6.4 Migration Tools
- [ ] Manual mapping UI: map old ERP rep IDs → new ERP rep IDs
- [ ] Reconnect wizard: switch connectors without data loss
- [ ] Data export: export all CKit data with external IDs preserved

#### 6.5 Documentation
- [ ] User-facing setup guides for each connector
- [ ] API reference for the integration endpoints
- [ ] Connector development guide (how to build a custom connector)
- [ ] Troubleshooting guide (common errors, solutions)

#### 6.6 Acceptance Testing
- [ ] End-to-end test: connect Odoo → sync all → run calculation → verify results
- [ ] End-to-end test: connect HubSpot → sync deals → write-back commissions
- [ ] End-to-end test: custom connector → sync custom ERP → run calculation
- [ ] Performance test: 100K deal sync in under 15 minutes
- [ ] Chaos test: network failures, API downtime, auth expiry → graceful degradation

### Deliverables
- Production-ready plugin system
- Full observability
- Migration tools
- Complete documentation
- Acceptance tests passing

---

## File Structure After Implementation

```
CommissionKit/
├── plugins/
│   ├── core/                          # Plugin SDK
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts               # Barrel exports
│   │       ├── types.ts               # CKitPlugin interface + all types
│   │       ├── base.ts                # BasePlugin abstract class
│   │       ├── registry.ts            # PluginRegistry
│   │       ├── http.ts                # PluginHttpClient
│   │       └── transform.ts           # Shared transform utilities
│   │
│   ├── odoo/                          # Odoo ERP connector
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── connector.ts
│   │       ├── client.ts
│   │       ├── transform.ts
│   │       ├── webhooks.ts
│   │       ├── writeback.ts
│   │       ├── fields.ts
│   │       ├── currency.ts
│   │       └── types.ts
│   │
│   ├── hubspot/                       # HubSpot CRM connector
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── connector.ts
│   │       ├── client.ts
│   │       ├── transform.ts
│   │       ├── webhooks.ts
│   │       ├── writeback.ts
│   │       ├── properties.ts
│   │       └── pipelines.ts
│   │
│   ├── salesforce/                    # Salesforce connector
│   │   └── src/...
│   │
│   ├── zoho/                          # Zoho CRM connector
│   │   └── src/...
│   │
│   └── custom/                        # Generic REST connector
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── connector.ts
│           ├── config-parser.ts
│           ├── jsonpath.ts
│           ├── pagination.ts
│           ├── auth.ts
│           └── types.ts
│
├── lib/
│   ├── db/src/schema/
│   │   ├── integrationConnection.ts       # NEW
│   │   ├── integrationSync.ts             # NEW
│   │   └── integrationLog.ts              # NEW
│   │
│   └── queue/src/
│       ├── constants.ts                   # +6 new queue names
│       ├── queues.ts                      # +6 new queue instances
│       └── schemas.ts                     # +new job schemas
│
├── artifacts/api/src/
│   ├── lib/
│   │   ├── sync/
│   │   │   ├── upsert-engine.ts           # NEW
│   │   │   ├── upsert-rep.ts              # NEW
│   │   │   ├── upsert-deal.ts             # NEW
│   │   │   ├── upsert-project.ts          # NEW
│   │   │   ├── upsert-invoice.ts          # NEW
│   │   │   ├── lock.ts                    # NEW (workspace lock)
│   │   │   ├── scheduler.ts               # NEW (schedule syncs)
│   │   │   └── egress.ts                  # NEW (write-back)
│   │   └── encryption.ts                  # NEW
│   │
│   ├── middleware/
│   │   └── webhook.ts                     # NEW (webhook verification)
│   │
│   ├── routes/integrations/               # NEW
│   │   ├── index.ts
│   │   ├── connectors.ts
│   │   ├── connect.ts
│   │   ├── disconnect.ts
│   │   ├── status.ts
│   │   ├── sync.ts
│   │   ├── sync-history.ts
│   │   └── webhooks.ts
│   │
│   └── workers/                           # NEW workers
│       ├── sync-reps-worker.ts
│       ├── sync-deals-worker.ts
│       ├── sync-projects-worker.ts
│       ├── sync-invoices-worker.ts
│       ├── sync-payments-worker.ts
│       ├── sync-egress-worker.ts
│       └── webhook-ingress-worker.ts
│
├── artifacts/web/src/
│   └── pages/
│       └── integrations/                  # NEW
│           ├── index.tsx                  # Connector marketplace
│           ├── settings.tsx               # Connection settings
│           ├── sync-history.tsx           # Sync history table
│           └── components/
│               ├── connector-card.tsx
│               ├── settings-form.tsx      # Dynamic JSON Schema form
│               ├── status-badge.tsx
│               └── sync-progress.tsx
│
└── docs/plugins/                          # This documentation
    ├── README.md
    ├── architecture.md
    ├── data-mapping.md
    ├── connector-sdk.md
    ├── sync-engine.md
    ├── api-design.md
    ├── odoo-connector.md
    ├── hubspot-connector.md
    ├── custom-connector.md
    └── implementation-plan.md
```

---

## Risk Mitigation

| Risk | Mitigation |
|---|---|
| ERP APIs are inconsistent/change | Versioned connectors; semver indicates API compatibility. Connector version pinned per workspace. |
| Large dataset sync times out | Chunked syncs by date range; resumable via cursor. BullMQ job progress reporting. |
| ERP rate limiting blocks syncs | Adaptive rate limiting in PluginHttpClient; configurable concurrency per connector. |
| Encryption key lost → configs unrecoverable | Key stored in env; backup keys in secure vault. Key rotation without data loss. |
| OAuth token refresh failures | Graceful degradation: status → "error", admin notification. Token refresh retried with backoff. |
| Workspace switches connector mid-stream | Old data preserved with old sourceSystem; new connector starts fresh. Migration wizard maps IDs. |
