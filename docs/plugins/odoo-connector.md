# Odoo ERP Connector

## Overview

The Odoo connector integrates CommissionKit with Odoo's REST API (via JSON-RPC). It syncs **Reps** and **Deals** — the two things CommissionKit needs to calculate commissions. No invoices, no projects, no enterprise engine. Just reps and deals, plain and simple.

The connector reads from the **standard engine** data model: `Rep` and `Deal` collections. Once synced, CommissionKit calculates commissions using its **standard engine** (flat, tiered, accelerator plans) — exactly the same as manually-entered reps and deals.

---

## How It Works — Deal Lifecycle Flow

### Where Deals Come From in Odoo

Odoo has two apps that can create deals:

| Source | What Happens | The Record That Matters |
|---|---|---|
| **Sales app** (`sale` module) | User creates a **Quotation** → sends it → customer confirms → it becomes a **Sales Order** | `sale.order` |
| **CRM app** (`crm` module) | User creates a **Lead** → qualifies → it becomes an **Opportunity** → it's marked **Won** → Odoo auto-creates a `sale.order` behind the scenes | `sale.order` |

In both cases, the final record CommissionKit reads is **`sale.order`** — the confirmed sales order. The CRM path just means the deal started as an Opportunity; by the time it's "Won," Odoo has created a `sale.order` for it automatically.

### The Full Lifecycle

```
   Odoo Sales or CRM App                       CommissionKit
  ──────────────────────────                  ────────────────

  ┌──────────┐
  │  Draft   │  Quotation / Lead created       (not synced)
  │  (draft) │  (still negotiating)
  └────┬─────┘
       │
       ▼
  ┌──────────┐
  │   Sent   │  Quotation emailed /            (not synced)
  │  (sent)  │  Opportunity in pipeline
  └────┬─────┘
       │
       ▼
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │  ┌──────────┐    ┌──────────┐                   │
  │  │   Sale   │ or │   Done   │  Confirmed or      │
  │  │  (sale)  │    │  (done)  │  delivered         │
  │  └────┬─────┘    └────┬─────┘                   │
  │       │               │                          │
  │       └───────┬───────┘                          │
  │               │                                  │
  │               ▼                                  │
  │   ┌──────────────────────┐                      │
  │   │  DEAL IS "CLOSED-WON" │  Trigger point      │
  │   │  (state = sale/done) │                      │
  │   └──────────┬───────────┘                      │
  │              │                                  │
  └──────────────┼──────────────────────────────────┘
                 │
                 │  Webhook fires (real-time)
                 │  or scheduled poll detects change
                 │
                 ▼
  ┌───────────────────────────────────────────────────┐
  │                     CommissionKit                   │
  │                                                     │
  │   ┌─────────────────────────────────────────────┐  │
  │   │  Sync Engine receives the deal               │  │
  │   │                                              │  │
  │   │  1. Match by Odoo sale.order ID (externalId) │  │
  │   │     - New? → Create CKit Deal                 │  │
  │   │     - Existing? → Update amount/stage/etc.    │  │
  │   │                                              │  │
  │   │  2. Map fields:                              │  │
  │   │     sale.order.name           → Deal.name     │  │
  │   │     sale.order.amount_total   → Deal.amount   │  │
  │   │     sale.order.date_order     → Deal.closeDate│  │
  │   │     sale.order.user_id        → Deal.repId    │  │
  │   │     sale.order.currency_id    → Deal.currency │  │
  │   │     sale.order.state          → Deal.stage    │  │
  │   │     sale.order.invoice_status → paymentStatus │  │
  │   │     date_order → derived      → Deal.period   │  │
  │   └─────────────────────────────────────────────┘  │
  │                              │                      │
  │                              ▼                      │
  │   ┌─────────────────────────────────────────────┐  │
  │   │  Deal is now live in CommissionKit           │  │
  │   │                                              │  │
  │   │  • Appears in the Deals table                │  │
  │   │  • Linked to the correct Rep                 │  │
  │   │  • Ready for commission calculation          │  │
  │   │    via the Standard Engine                    │  │
  │   └─────────────────────────────────────────────┘  │
  └───────────────────────────────────────────────────┘
```

### What triggers the sync?

| Method | Speed | Requires |
|---|---|---|
| **Webhook** | Near real-time (seconds) | Odoo Enterprise webhook module OR the `ckit_webhooks` Community module OR an Automation Rule |
| **Scheduled poll** | Every hour (configurable) | Nothing — works out of the box on any Odoo installation |
| **Manual sync** | On demand | User clicks "Sync Now" in the CKit dashboard |

### How payment status flows in

Odoo's `sale.order` has a computed field called `invoice_status` that reflect the invoicing/payment state. The connector reads this directly — no separate payment sync needed:

```
  Odoo sale.order                         CommissionKit Deal
  ─────────────────                       ───────────────────

  invoice_status: "to_invoice"     →   paymentStatus: "unpaid"
  invoice_status: "no"             →   paymentStatus: "unpaid"
  invoice_status: "invoiced"       →   paymentStatus: "partial"
  invoice_status: "fully_invoiced"  →  paymentStatus: "paid"
```

Whenever the deal is re-synced (via webhook or scheduled poll), the latest `invoice_status` is read from Odoo and the CKit Deal's `paymentStatus` is updated. If it changes from paid → unpaid, CKit's clawback enforcement triggers automatically.

### What does NOT sync from Odoo?

- **Draft quotations** — still negotiating, not a real deal
- **Sent quotations / pipeline opportunities** — not yet won, no commission to calculate
- **Cancelled orders** — dead deals
- **CRM leads before conversion** — only the resulting `sale.order` matters
- **Line items / products** — CKit only cares about total deal amount
- **Customer / partner data** — CKit works with Reps, not customers
- **Invoices / payments as standalone entities** — payment status is read from the `sale.order` record itself

### State mapping table

| Odoo `sale.order` state | CKit behavior | Configurable? |
|---|---|---|
| `draft` | Not synced | Yes — `dealStageMapping.excluded` |
| `sent` | Not synced | Yes |
| `sale` | **Synced** (closed-won) | Default closed-won |
| `done` | **Synced** (closed-won) | Default closed-won |
| `cancel` | Not synced | Yes |

---

## Connection

### Prerequisites

1. Odoo 15+ (Community or Enterprise, self-hosted or Odoo.sh)
2. A user account with API access — generate an API key under `Settings > Users > [User] > API Keys`
3. The **Sales** module (`sale`) must be installed
4. For webhooks: Odoo Enterprise webhook module, OR the `ckit_webhooks` Community module (provided by CommissionKit), OR a manually created Automation Rule

No other modules are required. Just `sale`.

### Authentication

Odoo uses API keys. The connector authenticates via Odoo's JSON-RPC `authenticate` + `uid` pattern:

```typescript
// plugins/odoo/connector.ts

async function authenticate(config: ConnectionConfig): Promise<{ uid: number }> {
  const client = new OdooClient(config.baseUrl, config.database);
  const uid = await client.authenticate(config.username, config.apiKey);
  return { uid };
}
```

### Configuration Schema

```json
{
  "baseUrl": "https://mycompany.odoo.com",
  "database": "mycompany-db",
  "username": "admin@mycompany.com",
  "apiKey": "sk-abc123...",
  "syncClosedOnly": true,
  "syncInterval": "hourly",
  "autoAssignPlanId": null,
  "sendPortalEmails": true,
  "dealStageMapping": {
    "closedWon": ["sale", "done"],
    "excluded": ["draft", "cancel"]
  }
}
```

| Field | Default | Description |
|---|---|---|
| `baseUrl` | — | Your Odoo instance URL |
| `database` | — | Odoo database name |
| `username` | — | User email with API access |
| `apiKey` | — | Generated API key (encrypted at rest) |
| `syncClosedOnly` | `true` | Only sync deals with `state` in the `closedWon` list |
| `syncInterval` | `"hourly"` | `"realtime"` (webhooks), `"hourly"`, `"daily"`, `"manual"` |
| `autoAssignPlanId` | `null` | If set, all newly synced reps get this commission plan assigned automatically |
| `sendPortalEmails` | `true` | Send portal access emails to newly synced reps |
| `dealStageMapping` | `{"closedWon":["sale","done"],"excluded":["draft","cancel"]}` | Which Odoo states are considered closed-won |

---

## Data Fetching

### Reps (Odoo → CKit Rep)

**Source**: `res.users` — internal users with sales access.

```typescript
// plugins/odoo/connector.ts

async fetchReps(workspaceId: string, config: ConnectionConfig, options?: FetchOptions): Promise<NormalizedRep[]> {
  const client = new OdooClient(config.baseUrl, config.database);
  await client.authenticate(config.username, config.apiKey);

  const domain = [
    ["share", "=", false],                   // Internal users only (not portal users)
    ["active", "=", true],
  ];
  if (options?.modifiedAfter) {
    domain.push(["write_date", ">=", options.modifiedAfter.toISOString()]);
  }

  const fields = ["name", "email", "job_id"];
  const records = await client.searchRead("res.users", domain, fields, options?.limit, options?.offset);

  return records.map((r: any) => ({
    externalId: String(r.id),
    name: r.name,
    email: r.email || r.login,
    role: r.job_id?.[1] || undefined,        // job_id is Odoo's [id, name] tuple
    metadata: { odooUserId: r.id, odooLogin: r.login },
  }));
}
```

When a new rep is synced, CommissionKit automatically:
1. Generates a unique `portalAccessCode` (12-char)
2. Creates a `portalUsername`
3. Creates a Better Auth user for portal login
4. Sends a portal welcome email (if `sendPortalEmails` is enabled)
5. Auto-assigns a default plan (if `autoAssignPlanId` is configured)

### Deals (Odoo → CKit Deal)

**Source**: `sale.order` — this is the model behind both the Sales and CRM apps.

```typescript
async fetchDeals(workspaceId: string, config: ConnectionConfig, options?: FetchOptions): Promise<NormalizedDeal[]> {
  const client = new OdooClient(config.baseUrl, config.database);
  await client.authenticate(config.username, config.apiKey);

  const domain: any[] = [];

  // Only closed-won deals
  if (config.syncClosedOnly) {
    domain.push(["state", "in", config.dealStageMapping?.closedWon || ["sale", "done"]]);
  }

  if (options?.modifiedAfter) {
    domain.push(["write_date", ">=", options.modifiedAfter.toISOString()]);
  }

  const fields = [
    "name", "amount_total", "date_order", "state",
    "currency_id", "user_id", "invoice_status", "note",
  ];
  const records = await client.searchRead("sale.order", domain, fields, options?.limit, options?.offset);

  return records.map((r: any) => ({
    externalId: String(r.id),
    repExternalId: String(r.user_id?.[0] || ""),
    name: r.name,
    amount: r.amount_total,
    closeDate: new Date(r.date_order),
    stage: r.state,
    currency: normalizeOdooCurrency(r.currency_id?.[1]),
    paymentStatus: derivePaymentStatus(r.invoice_status),
    notes: r.note,
    metadata: { odooOrderId: r.id, odooState: r.state },
  }));
}
```

**Field mapping summary**:

| Odoo `sale.order` field | CKit `Deal` field |
|---|---|
| `id` | `externalId` |
| `name` (e.g., "S00042") | `name` |
| `amount_total` | `amount` |
| `date_order` | `closeDate` |
| `date_order` → YYYY-MM | `period` |
| `state` | `stage` ("closed-won") |
| `currency_id[1]` | `currency` (mapped to ISO 4217) |
| `user_id[0]` | `repId` (matched by `Rep.externalId`) |
| `invoice_status` | `paymentStatus` (derived) |
| `note` | `notes` |

**Payment status derivation**:

```typescript
function derivePaymentStatus(invoiceStatus: string): PaymentStatus {
  switch (invoiceStatus) {
    case "fully_paid":        return "paid";
    case "paid":              return "paid";
    case "in_payment":        return "partial";
    case "partial":           return "partial";
    case "not_paid":          return "unpaid";
    case "to_invoice":
    case "no":
    default:                  return "unpaid";
  }
}
```

---

## Webhook Handling

### Setting Up Odoo Webhooks

Odoo Community Edition doesn't have native webhooks. Options:

1. **Odoo Enterprise (17+)**: Use the built-in `webhook` module
2. **Odoo Community**: Install the `ckit_webhooks` module provided by CommissionKit (a lightweight Odoo addon that hooks into `create`/`write`/`unlink` on `sale.order` and `res.users`)
3. **Automation Rules**: Create Odoo Automated Actions that POST to the CKit webhook URL on record changes

### Webhook Verification

```typescript
async verifyWebhook(req: WebhookRequest, secret: string): Promise<void> {
  const signature = req.headers["x-odoo-signature"];
  if (!signature) throw new Error("Missing signature header");

  const computed = crypto
    .createHmac("sha256", secret)
    .update(req.rawBody)
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed))) {
    throw new Error("Invalid signature");
  }
}
```

### Webhook Payload Parsing

Odoo webhooks send events like:
```json
{
  "event": "record.created",
  "model": "sale.order",
  "record_id": 42,
  "database": "mycompany-db",
  "timestamp": "2026-06-05T10:30:00Z"
}
```

```typescript
parseWebhook(payload: any): IngresEvent[] {
  const modelMap: Record<string, string> = {
    "sale.order": "deal",
    "res.users": "rep",
  };

  const entityType = modelMap[payload.model];
  if (!entityType) return [];   // Ignore non-relevant models

  const eventTypeMap: Record<string, string> = {
    "record.created": "created",
    "record.updated": "updated",
    "record.deleted": "deleted",
  };

  return [{
    type: `${entityType}.${eventTypeMap[payload.event]}`,
    externalId: String(payload.record_id),
    workspaceId: this.resolveWorkspaceByDatabase(payload.database),
    timestamp: new Date(payload.timestamp),
    payload,
  }];
}
```

Only two models trigger a sync: `sale.order` (deals) and `res.users` (reps). Everything else is silently ignored.

---

## Write-Back (CommissionKit → Odoo)

When write-back is enabled, CommissionKit writes commission results back to Odoo as custom fields on `sale.order`:

```typescript
async writeBackCommission(
  workspaceId: string,
  config: ConnectionConfig,
  results: CommissionWriteBack[]
): Promise<WriteBackResult[]> {
  const client = new OdooClient(config.baseUrl, config.database);
  await client.authenticate(config.username, config.apiKey);

  // Ensure custom fields exist (idempotent — creates if missing, skips if present)
  await ensureCustomFields(client);

  const outcomes: WriteBackResult[] = [];

  for (const result of results) {
    try {
      await client.update("sale.order", Number(result.dealExternalId), {
        x_ckit_commission_amount: result.commissionAmount,
        x_ckit_commission_rate: result.commissionRate,
        x_ckit_commission_currency: result.currency,
      });
      outcomes.push({ externalId: result.dealExternalId, success: true });
    } catch (err) {
      outcomes.push({
        externalId: result.dealExternalId,
        success: false,
        error: (err as Error).message,
      });
    }
  }

  return outcomes;
}
```

### Custom Fields Created in Odoo

These fields appear on each `sale.order` in Odoo:

| Technical Name | Field Label | Type |
|---|---|---|
| `x_ckit_commission_amount` | Commission Amount | Float |
| `x_ckit_commission_rate` | Commission Rate (%) | Float |
| `x_ckit_commission_currency` | Commission Currency | Char |
| `x_ckit_payout_status` | Payout Status | Selection |
| `x_ckit_payout_amount` | Payout Amount | Float |

All fields are read-only in Odoo — they display CommissionKit data, not edit it.

---

## Rate Limiting

Odoo's JSON-RPC API can be slow. The connector implements:

- **Concurrency**: Max 3 concurrent Odoo API calls per workspace
- **Batch size**: 200 records per `search_read` call (Odoo default)
- **Pagination**: Auto-paginates through large result sets
- **Incremental sync**: Uses `write_date >= lastSyncDate` to pull only changed records
- **Connection reuse**: Single HTTP connection, keep-alive enabled

---

## Setup Guide (for Users)

1. In Odoo, go to **Settings > Users & Companies > Users**
2. Select the user that will be used for API access (needs Sales access rights)
3. Under **API Keys**, click **Generate** and copy the key
4. In CommissionKit, go to **Workspace Settings > Integrations**
5. Select **Odoo ERP** and enter:
   - Your Odoo instance URL (`https://yourcompany.odoo.com`)
   - Database name
   - Username (email of the user)
   - The API key
6. Click **Test Connection** → verify it succeeds
7. Click **Connect**
8. (Optional) Install the `ckit_webhooks` Odoo module for real-time sync
9. The initial sync begins automatically — reps and deals start flowing in

---

## Files

```
plugins/odoo/
├── index.ts                  # Default export: OdooConnector
├── connector.ts              # Main connector class (implements CKitPlugin)
├── client.ts                 # Odoo JSON-RPC HTTP client wrapper
├── transform.ts              # Data transformation helpers (currency mapping, state mapping)
├── webhooks.ts               # Webhook verification + event parsing
├── writeback.ts              # Commission write-back to sale.order custom fields
├── currency.ts               # Odoo currency name → ISO 4217 mapping
└── types.ts                  # Odoo-specific types
```
