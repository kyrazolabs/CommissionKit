# Plugin Architecture

## Overview

The plugin system adds an abstraction layer between CommissionKit's internal data models and external ERP/CRM systems. It consists of four main components:

1. **Connector SDK** — The TypeScript interface every plugin implements
2. **Sync Engine** — Handles data ingress (ERP → CKit) and egress (CKit → ERP)
3. **Plugin Registry** — Manages installed plugins, their status, and lifecycle
4. **Integration API** — REST endpoints for connecting, configuring, and monitoring plugins

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        External ERP/CRM                                   │
│                                                                           │
│  ┌──────────────────┐                  ┌──────────────────┐              │
│  │   ERP REST API   │                  │  ERP Webhooks    │              │
│  │  (pull source)   │                  │  (push source)   │              │
│  └────────┬─────────┘                  └────────┬─────────┘              │
│           │                                      │                        │
└───────────┼──────────────────────────────────────┼────────────────────────┘
            │                                      │
            ▼                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                        CommissionKit Plugin Layer                          │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                        Connector SDK                                 │  │
│  │                                                                      │  │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────┐    │  │
│  │  │   Odoo    │  │ HubSpot   │  │Salesforce │  │  Custom REST  │    │  │
│  │  │ Connector │  │ Connector │  │ Connector │  │  Connector    │    │  │
│  │  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └───────┬───────┘    │  │
│  │        │              │              │                 │             │  │
│  │        └──────────────┴──────────────┴─────────────────┘             │  │
│  │                              │                                        │  │
│  │                    CKitPlugin interface                               │  │
│  └──────────────────────────────┼────────────────────────────────────────┘  │
│                                 │                                           │
│  ┌──────────────────────────────┼────────────────────────────────────────┐  │
│  │                    Plugin Registry                                     │  │
│  │   - Discover installed plugins                                         │  │
│  │   - Instantiate connector for each workspace                           │  │
│  │   - Manage lifecycle (init → connected → disconnected → error)         │  │
│  │   - Hot-reload connectors on config change                             │  │
│  └──────────────────────────────┼────────────────────────────────────────┘  │
│                                 │                                           │
└─────────────────────────────────┼───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Sync Engine                                          │
│                                                                               │
│  ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐     │
│  │  Ingress Engine   │     │  Transform Layer │     │  Egress Engine   │     │
│  │                   │     │                   │     │                   │    │
│  │  Pull (scheduled) │────▶│  ERP data →       │     │  CKit results →   │    │
│  │  Push (webhooks)  │     │  CKit entities    │     │  ERP write-back   │    │
│  │                   │     │                   │     │  (optional)       │    │
│  └──────────────────┘     └──────────────────┘     └──────────────────┘     │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                      BullMQ Sync Queues                                  │  │
│  │  {ck-sync-reps}         {ck-sync-deals}         {ck-sync-projects}       │  │
│  │  {ck-sync-invoices}    {ck-sync-payments}      {ck-webhook-ingress}      │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                     CommissionKit Core (unchanged)                             │
│                                                                                │
│  Models: Rep, Deal, Project, Invoice, Plan, CommissionRun, Payout, Dispute    │
│  Engines: Standard, AISSOL                                                     │
│  API: REST endpoints for CRUD, calculations, payouts, reports                  │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## Plugin Lifecycle

```
   Register
      │
      ▼
  ┌─────────┐    connect()     ┌─────────────┐
  │  IDLE   │ ────────────────▶│  CONNECTED   │
  └─────────┘                  └──────┬───────┘
      ▲                               │
      │                               │ error / disconnect()
      │    ┌──────────┐               │
      └────│  ERROR   │◀──────────────┘
           └──────────┘
```

1. **Register**: Plugin is loaded at boot from the `plugins/` directory
2. **Idle**: Plugin is registered but no workspace has connected to it yet
3. **Connected**: A workspace has provided credentials and the plugin has authenticated with the ERP. Sync jobs can be scheduled.
4. **Error**: Connection lost, credentials expired, or API rate-limited. Exponential backoff retry.

---

## Data Flow: Ingress (ERP → CommissionKit)

```
ERP Webhook / Scheduled Poll
        │
        ▼
┌──────────────────┐
│  Connector.fetch  │  Pull raw data from ERP API
│  (Reps, Deals,   │
│   Invoices, etc.) │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Transform Layer  │  Normalize ERP-specific data into CKit shapes
│  (connector-      │
│   specific)       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Upsert Engine    │  Insert or update CKit entities
│                   │  - Match by externalId (ERP reference)
│                   │  - Detect changes (hash comparison)
│                   │  - Log sync history
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Trigger Events   │  On new/modified data:
│                   │  - Notifications
│                   │  - Auto-calculate commissions (if configured)
│                   │  - Webhook to dashboard (real-time updates)
└──────────────────┘
```

### Upsert Strategy

Each CKit entity gains an `externalId` and `sourceSystem` field:

```typescript
// Added to Rep, Deal, Project, Invoice schemas
{
  externalId: string,       // ERP's internal ID (e.g., Odoo database ID, HubSpot record ID)
  sourceSystem: string,     // "odoo", "hubspot", "salesforce", "custom"
  lastSyncedAt: Date,       // Timestamp of last successful sync
  syncHash: string,         // SHA-256 hash of source data (for change detection)
}
```

**Upsert logic**:
1. Look up by `{ workspaceId, sourceSystem, externalId }`
2. If found: compute hash of incoming data, compare to `syncHash` — skip if unchanged
3. If changed or not found: upsert the CKit entity
4. Update `lastSyncedAt` and `syncHash`

---

## Data Flow: Egress (CommissionKit → ERP)

Some ERPs benefit from having commission data written back. This is optional and configurable.

```
Commission Run completes
        │
        ▼
┌──────────────────┐
│  Egress Trigger   │  Check workspace settings: writeBackEnabled?
│                   │  If yes → enqueue egress job
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Transform Layer  │  Convert CommissionResult → ERP-specific format
│  (connector-      │  (e.g., Odoo custom field on sale.order,
│   specific)       │   HubSpot custom property on deal)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  ERP API Write    │  PATCH / PUT to ERP
│                   │  - Commission amount
│                   │  - Payout status
│                   │  - Dispute flag
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  WriteBack Log    │  Record success/failure per entity
└──────────────────┘
```

---

## Webhook Ingress

Each connector can register webhook endpoints in CommissionKit:

```
POST /api/integrations/webhooks/:connectorName
```

The webhook payload is connector-specific. The connector's `handleWebhook()` method parses it and routes to the appropriate sync job.

**Security**: Webhooks are verified via connector-specific mechanisms:
- Odoo: HMAC signature with shared secret
- HubSpot: Request signature verification (`X-HubSpot-Signature-v3`)
- Salesforce: Signed payload
- Custom REST: Shared secret header

---

## Real-time Sync vs. Scheduled Sync

| Mechanism | Trigger | Use Case |
|---|---|---|
| Webhook push | ERP sends event on data change | Near-real-time deal updates, new rep onboarding |
| Scheduled poll | Cron job (hourly/daily) | Full reconciliation, catch missed webhooks |
| Manual sync | User clicks "Sync Now" in UI | Ad-hoc refresh, troubleshooting |
| Initial bulk sync | On first connection | Full data import when connecting a new ERP |

### Schedule Configuration (per-workspace)

```typescript
interface SyncSchedule {
  reps: SyncFrequency;        // "realtime" | "hourly" | "daily" | "manual"
  deals: SyncFrequency;
  invoices: SyncFrequency;
  projects: SyncFrequency;
  payments: SyncFrequency;
}
```

---

## Conflict Resolution

When the same entity is modified in both CKit and the ERP:

1. **ERP is always the source of truth for source data** (deal amount, rep name, invoice total, payment status)
2. **CKit is the source of truth for commission data** (plan assignment, calculation results, payout status, dispute state)
3. **Non-overlapping fields** — CKit never writes back to ERP fields that the ERP owns
4. **Merge strategy** on sync: ERP data overwrites CKit fields for `amount`, `closeDate`, `paymentStatus`, `stage`; CKit preserves `planId`, `notes`, and all commission/payout/dispute data

---

## Core Sync Logic (upstream)

The actual sync is driven by BullMQ jobs. Here's the precise logic for each entity:

### Rep Sync

```
For each rep from ERP:
  1. Match by externalId + sourceSystem
  2. If not found → create CKit Rep
     - name = ERP rep name
     - email = ERP rep email
     - externalId, sourceSystem set
     - Generate portalAccessCode + portalUsername
  3. If found → update name/email if changed (hash comparison)
  4. Optionally: auto-assign default plan
  5. Log sync result
```

### Deal Sync

```
For each deal/opportunity from ERP:
  1. Match by externalId + sourceSystem
  2. If not found → create CKit Deal
     - amount, closeDate, stage, currency from ERP
     - repId resolved from rep externalId mapping
     - period derived from closeDate
     - externalId, sourceSystem set
  3. If found → update mutable fields if hash changed
     - amount, stage, paymentStatus, closeDate
     - Never overwrite: clawback data, commission run results
  4. Trigger clawback check if paymentStatus changed to "unpaid" or "refunded"
  5. Log sync result
```

### Enterprise Sync (AISSOL projects + invoices)

```
For each project from ERP:
  1. Match by externalId + sourceSystem
  2. Upsert AissolProject
  3. For each invoice under project:
     a. Match by externalId
     b. Upsert AissolInvoice
  4. Log sync result
```

The AISSOL commission matrix is configured manually in CKit — it doesn't sync from the ERP.

### Payment Sync

```
For each payment from ERP:
  Option A: Update paymentStatus on the corresponding CKit Deal
    - Match deal by externalId
    - Update paymentStatus (unpaid → paid, etc.)
    - Trigger clawback enforcement if needed

  Option B: Track as standalone Payment entity (future model)
    - For ERPs with rich payment objects (Odoo, SAP)
    - Map to CKit Payout entities where applicable
```

---

## Adding a New Integration Model

Required new Mongoose schemas in `lib/db/src/schema/`:

### IntegrationConnection

```typescript
{
  workspaceId: ObjectId,            // FK to Workspace
  connectorName: string,            // "odoo", "hubspot", "salesforce", "custom"
  status: "disconnected" | "connected" | "error",
  config: Mixed,                    // Connector-specific config (encrypted)
  credentials: Mixed,               // OAuth tokens, API keys (encrypted)
  webhookSecret: string,            // Shared secret for webhook verification
  syncSchedule: SyncSchedule,
  writeBackEnabled: boolean,
  lastConnectedAt: Date,
  lastError: string,
  createdAt: Date,
  updatedAt: Date,
}
```

### IntegrationSync

```typescript
{
  workspaceId: ObjectId,
  connectorName: string,
  entityType: "reps" | "deals" | "invoices" | "projects" | "payments",
  direction: "ingress" | "egress",
  trigger: "webhook" | "scheduled" | "manual" | "initial",
  status: "running" | "completed" | "failed" | "partial",
  stats: {
    total: number,
    created: number,
    updated: number,
    skipped: number,
    failed: number,
  },
  error: string,
  startedAt: Date,
  completedAt: Date,
}
```

### IntegrationLog

```typescript
{
  workspaceId: ObjectId,
  syncId: ObjectId,
  connectorName: string,
  entityType: string,
  externalId: string,
  action: "created" | "updated" | "skipped" | "failed",
  message: string,
  details: Mixed,
  createdAt: Date,
}
```

### Field Mappings (on Rep, Deal, Project, Invoice)

Each entity gains these fields:
```typescript
{
  externalId: { type: String, index: true },
  sourceSystem: { type: String },          // connector name
  syncHash: { type: String },
  lastSyncedAt: { type: Date },
}
```

Plus a compound index: `{ workspaceId: 1, sourceSystem: 1, externalId: 1 }` (unique).

---

## Queue Architecture (New Queues)

```
{ck-sync-reps}          — Rep sync jobs
{ck-sync-deals}         — Deal sync jobs
{ck-sync-projects}      — Enterprise project sync jobs
{ck-sync-invoices}      — Invoice sync jobs
{ck-sync-payments}      — Payment status sync jobs
{ck-webhook-ingress}    — Incoming webhook dispatch
{ck-sync-egress}        — Commission write-back to ERP
{ck-sync-reconcile}     — Full reconciliation jobs (catch-all)
```

All use exponential backoff, concurrency 3, rate-limited to avoid overwhelming the ERP API.

---

## UI Architecture

### Connection Settings Page

```
/workspace/:id/integrations
  ├── Connect / Disconnect button
  ├── Connector-specific configuration form (dynamic, from plugin.getSettingsSchema())
  ├── Connection status indicator (green/yellow/red)
  ├── Sync schedule configuration
  ├── Sync history table (last N syncs with status)
  ├── Manual sync buttons per entity type
  └── Write-back toggle
```

### Dashboard Indicators

- Small badge near each entity count: "Synced via Odoo - 5m ago" or "Stale - last synced 2h ago"
- Color coding: green (fresh), yellow (stale > 1h), red (error)

### Embedding Support

CommissionKit UI can be embedded in the ERP via iframe:
- Pass JWT as URL parameter (`?token=...`)
- Workspace context derived from the JWT
- Minimal header (no global nav) when embedded
- `X-Frame-Options: ALLOW-FROM <erp-origin>` configured dynamically
