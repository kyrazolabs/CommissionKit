# Odoo ERP Connector

## Overview

The Odoo connector integrates CommissionKit with Odoo's REST API (via JSON-RPC). Odoo is the reference implementation — it exercises all connector features: reps, deals, projects, invoices, payments, webhooks, and write-back.

## How It Works — Deal Lifecycle Flow

### Where Deals Come From in Odoo

Odoo has two possible sources for sales deals:

| Source | Odoo App | Module | Typical Use |
|---|---|---|---|
| **Sales app** | `sale.order` | `sale` | Quotations → Sales Orders → Confirmed/Done. The primary path for most Odoo users. |
| **CRM app** | `crm.lead` → `sale.order` | `crm` + `sale` | Leads → Opportunities → Won → auto-creates a `sale.order`. The CRM pipelined path. |

In both cases, the final record CommissionKit reads is **`sale.order`** — the confirmed sales order. The CRM path just means the deal started as a `crm.lead` and was converted to a `sale.order` when marked "Won."

### The Full Lifecycle

```
   Odoo Sales / CRM                              CommissionKit
  ──────────────────                            ────────────────

  ┌──────────┐
  │  Draft   │  Quotation created                (not synced)
  │  (draft) │  (still negotiating)
  └────┬─────┘
       │
       ▼
  ┌──────────┐
  │   Sent   │  Quotation emailed to customer    (not synced)
  │  (sent)  │
  └────┬─────┘
       │
       ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │                                                                  │
  │  ┌──────────┐    ┌──────────┐                                   │
  │  │   Sale   │ or │   Done   │  Customer confirmed / delivered    │
  │  │  (sale)  │    │  (done)  │                                    │
  │  └────┬─────┘    └────┬─────┘                                    │
  │       │               │                                          │
  │       └───────┬───────┘                                          │
  │               │                                                  │
  │               ▼                                                  │
  │   ┌──────────────────────┐                                      │
  │   │  DEAL IS "CLOSED-WON" │  This is the trigger point          │
  │   │  (state = sale/done) │                                      │
  │   └──────────┬───────────┘                                      │
  │              │                                                  │
  └──────────────┼──────────────────────────────────────────────────┘
                 │
                 │  Webhook fires (real-time)
                 │  or scheduled poll detects change
                 │
                 ▼
  ┌───────────────────────────────────────────────────────────────────┐
  │                     CommissionKit                                   │
  │                                                                     │
  │   ┌─────────────────────────────────────────────────────────────┐  │
  │   │  Sync Engine receives the deal                               │  │
  │   │                                                              │  │
  │   │  1. Match by Odoo sale.order ID (externalId)                │  │
  │   │     - New? → Create CKit Deal                                │  │
  │   │     - Existing? → Update amount/stage/payment status         │  │
  │   │                                                              │  │
  │   │  2. Map fields:                                              │  │
  │   │     sale.order.name        → Deal.name                       │  │
  │   │     sale.order.amount_total → Deal.amount                    │  │
  │   │     sale.order.date_order  → Deal.closeDate                  │  │
  │   │     sale.order.user_id     → Deal.repId (matched by externalId)│
  │   │     sale.order.currency_id → Deal.currency                    │  │
  │   │     sale.order.state       → Deal.stage = "closed-won"       │  │
  │   │     date_order → derived   → Deal.period ("YYYY-MM")         │  │
  │   └─────────────────────────────────────────────────────────────┘  │
  │                              │                                      │
  │                              ▼                                      │
  │   ┌─────────────────────────────────────────────────────────────┐  │
  │   │  Deal is now live in CommissionKit                           │  │
  │   │                                                              │  │
  │   │  • Appears in the Deals table                                │  │
  │   │  • Linked to the correct Rep (by externalId match)           │  │
  │   │  • Ready for commission calculation in the next Run          │  │
  │   └─────────────────────────────────────────────────────────────┘  │
  └───────────────────────────────────────────────────────────────────┘
```

### What triggers the sync?

There are three ways a closed-won deal gets into CommissionKit:

| Method | Speed | Requires |
|---|---|---|
| **Webhook** | Near real-time (seconds) | Odoo Enterprise webhook module OR the `ckit_webhooks` Community module OR an Automation Rule |
| **Scheduled poll** | Every hour (configurable) | Nothing — works out of the box |
| **Manual sync** | On demand | User clicks "Sync Now" in the CKit dashboard |

### How payment updates work

After the deal is synced, Odoo continues to own the payment workflow:

```
  Odoo                                                CommissionKit
  ────                                                ────────────────

  Invoice created (account.move)
       │
       ▼
  Payment received (account.payment)
       │
       │  payment_state changes: not_paid → in_payment → paid
       │
       │  Webhook or poll detects change
       │
       ▼
  ┌─────────────────────────────────────────┐
  │  CKit updates Deal.paymentStatus        │
  │                                         │
  │  "not_paid" → "unpaid"                  │
  │  "in_payment" / "paid" → "paid"        │
  │  "partial" → "partial"                 │
  │  "reversed" → "on_hold"                │
  │                                         │
  │  If changed paid→unpaid:                │
  │   → clawback enforcement triggered     │
  └─────────────────────────────────────────┘
```

### What does NOT sync from Odoo?

- **Draft and Sent quotations** — Only `sale` and `done` states sync by default (configurable via `dealStageMapping`)
- **Cancelled orders** — Excluded by default
- **CRM leads/opportunities** (before conversion) — Only the resulting `sale.order` matters
- **Products/line items** — CKit only cares about the total deal amount, not individual line items
- **Customer/partner data** — Not synced; CKit works with Reps, not customers

### State mapping table

| Odoo `sale.order` state | CKit behavior | Configurable? |
|---|---|---|
| `draft` | Not synced (still negotiating) | Yes — `dealStageMapping.excluded` |
| `sent` | Not synced (awaiting customer) | Yes |
| `sale` | **Synced** (confirmed by customer) | Default closed-won |
| `done` | **Synced** (delivered/completed) | Default closed-won |
| `cancel` | Not synced (lost/cancelled) | Yes |

---

## Connection

### Prerequisites

1. Odoo 15+ (tested up to 18)
2. A user account with API access (`Settings > Users > User > API Keys`)
3. The following Odoo modules installed:
   - `sale` (sales orders → deals)
   - `account` (invoices, payments)
   - `project` (projects, for enterprise/AISSOL engine)
4. For webhooks: Odoo's `webhook` module or a custom automation rule that POSTs to CKit

### Authentication

Odoo uses API keys. The connector authenticates via Odoo's JSON-RPC `authenticate` + `uid` pattern:

```typescript
// plugins/odoo/connector.ts

async function authenticate(config: ConnectionConfig): Promise<{ uid: number; session: string }> {
  const client = new OdooClient(config.baseUrl, config.database);
  const uid = await client.authenticate(config.username, config.apiKey);
  return { uid, session: client.sessionId };
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
  "autoAssignPlanId": null,
  "sendPortalEmails": true,
  "dealStageMapping": {
    "closedWon": ["sale", "done"],
    "excluded": ["draft", "cancel"]
  },
  "paymentStatusMapping": {
    "paid": ["paid", "in_payment"],
    "unpaid": ["not_paid"],
    "partial": ["partial"],
    "on_hold": ["reversed"]
  }
}
```

---

## Data Fetching

### Reps (Odoo → CKit Rep)

**Source**: `res.users` where the user has sales access rights.

```typescript
// plugins/odoo/connector.ts

async fetchReps(workspaceId: string, config: ConnectionConfig, options?: FetchOptions): Promise<NormalizedRep[]> {
  const client = new OdooClient(config.baseUrl, config.database);
  await client.authenticate(config.username, config.apiKey);

  const domain = [
    ["share", "=", false],                   // Internal users only
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
    role: r.job_id?.[1] || undefined,    // job_id is [id, name] tuple
    metadata: { odooUserId: r.id, odooLogin: r.login },
  }));
}
```

**Alternative source**: `hr.employee` for companies that structure sales reps as employees:
- Domain: `[["department_id.name", "ilike", "Sales"]]` or by job position
- The config field `repSource` controls whether to use `res.users` or `hr.employee`

### Deals (Odoo → CKit Deal)

**Source**: `sale.order` — which is the model behind both the **Sales app** (quotations → sales orders) and the **CRM app** (opportunities → won → converted to sale.order). See the [Deal Lifecycle Flow](#how-it-works--deal-lifecycle-flow) above for the full journey.

The connector fetches only confirmed orders (`state = "sale"` or `"done"`) by default.

```typescript
async fetchDeals(workspaceId: string, config: ConnectionConfig, options?: FetchOptions): Promise<NormalizedDeal[]> {
  const client = new OdooClient(config.baseUrl, config.database);
  await client.authenticate(config.username, config.apiKey);

  const domain: any[] = [];
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
    repExternalId: String(r.user_id?.[0] || ""),   // user_id is [id, name] tuple
    name: r.name,
    amount: r.amount_total,
    closeDate: new Date(r.date_order),
    stage: r.state,                                  // "draft", "sent", "sale", "done", "cancel"
    currency: normalizeOdooCurrency(r.currency_id?.[1]),  // e.g., "USD"
    paymentStatus: derivePaymentStatusFromInvoice(r.invoice_status),  // "paid", "unpaid", etc.
    notes: r.note,
    metadata: { odooOrderId: r.id, odooState: r.state },
  }));
}
```

**Period derivation**: `closeDate` → `YYYY-MM`.

**Payment status from invoice**: `invoice_status` is an Odoo computed field:
- `invoiced` + invoice `payment_state = paid` → `paid`
- `invoiced` + invoice `payment_state != paid` → `partial`
- `to_invoice` or `no` → `unpaid`

For more precise payment tracking, the `fetchPayments` method queries `account.payment` directly.

### Projects (Odoo → CKit Enterprise Project)

**Source**: `project.project` (enterprise/AISSOL only).

```typescript
async fetchProjects(workspaceId: string, config: ConnectionConfig, options?: FetchOptions): Promise<NormalizedProject[]> {
  const client = new OdooClient(config.baseUrl, config.database);
  await client.authenticate(config.username, config.apiKey);

  const domain: any[] = [["active", "=", true]];
  if (options?.modifiedAfter) {
    domain.push(["write_date", ">=", options.modifiedAfter.toISOString()]);
  }

  const records = await client.searchRead("project.project", domain, [
    "name", "user_id", "date_start", "date", "stage_id",
  ], options?.limit, options?.offset);

  // totalValue and totalCost require additional queries:
  // totalValue = sum of linked sale.order amounts
  // totalCost = sum of linked account.analytic.line amounts

  return await Promise.all(records.map(async (r: any) => {
    const totalValue = await getProjectTotalValue(client, r.id);
    const totalCost = await getProjectTotalCost(client, r.id);

    return {
      externalId: String(r.id),
      repExternalId: String(r.user_id?.[0] || ""),
      name: r.name,
      totalValue,
      totalCost,
      currency: config.currency || "USD",  // From workspace config or ERP
      period: derivePeriod(new Date(r.date_start || r.date)),
      status: mapOdooProjectStage(r.stage_id?.[1] || "active"),
      metadata: { odooState: r.stage_id?.[1] },
    };
  }));
}
```

### Invoices (Odoo → CKit Enterprise Invoice)

**Source**: `account.move` where `move_type = 'out_invoice'` and `state = 'posted'`.

```typescript
async fetchInvoices(workspaceId: string, config: ConnectionConfig, options?: FetchOptions): Promise<NormalizedInvoice[]> {
  const client = new OdooClient(config.baseUrl, config.database);
  await client.authenticate(config.username, config.apiKey);

  const domain: any[] = [
    ["move_type", "=", "out_invoice"],
    ["state", "=", "posted"],
  ];
  if (options?.modifiedAfter) {
    domain.push(["write_date", ">=", options.modifiedAfter.toISOString()]);
  }

  const fields = [
    "name", "amount_total", "currency_id", "invoice_date",
    "invoice_date_due", "payment_state", "invoice_user_id",
    "narration", "invoice_line_ids",
  ];
  const records = await client.searchRead("account.move", domain, fields, options?.limit, options?.offset);

  return records.map((r: any) => {
    // Resolve project from invoice lines' analytic distribution
    const projectId = extractProjectFromAnalyticLines(r.invoice_line_ids);

    return {
      externalId: String(r.id),
      projectExternalId: projectId ? String(projectId) : "",
      repExternalId: String(r.invoice_user_id?.[0] || ""),
      invoiceNumber: r.name,
      amount: r.amount_total,
      currency: normalizeOdooCurrency(r.currency_id?.[1]),
      period: derivePeriod(new Date(r.invoice_date)),
      paymentStatus: r.payment_state as PaymentStatus,
      dueDate: r.invoice_date_due ? new Date(r.invoice_date_due) : undefined,
      notes: r.narration,
      metadata: { odooInvoiceId: r.id, odooPaymentState: r.payment_state },
    };
  });
}
```

### Payments (Odoo → CKit Payment Status Update)

**Source**: `account.payment` where `state = 'posted'`.

Updates `paymentStatus` on CKit Deals (matched via `account.move` → `sale.order` links):

```typescript
async fetchPayments(workspaceId: string, config: ConnectionConfig, options?: FetchOptions): Promise<NormalizedPayment[]> {
  const client = new OdooClient(config.baseUrl, config.database);
  await client.authenticate(config.username, config.apiKey);

  const domain: any[] = [["state", "=", "posted"]];
  if (options?.modifiedAfter) {
    domain.push(["write_date", ">=", options.modifiedAfter.toISOString()]);
  }

  const records = await client.searchRead("account.payment", domain, [
    "name", "amount", "date", "reconciled_invoice_ids",
  ], options?.limit, options?.offset);

  return records.map((r: any) => ({
    externalId: String(r.id),
    invoiceExternalIds: (r.reconciled_invoice_ids || []).map(String),
    status: "paid" as PaymentStatus,
    amount: r.amount,
    date: new Date(r.date),
    metadata: { odooPaymentId: r.id },
  }));
}
```

---

## Webhook Handling

### Setting Up Odoo Webhooks

Odoo doesn't have native webhooks in Community Edition. Options:

1. **Odoo Enterprise**: Use the `webhook` module (Odoo 17+)
2. **Automation rules**: Create automated actions that call `requests.post()` in Python
3. **Custom module**: Install a lightweight `ckit_webhooks` Odoo module (provided by CommissionKit)

**Recommended**: Provide a small Odoo module that the user installs, which registers webhook triggers on `create`, `write`, and `unlink` for `sale.order`, `account.move`, and `res.users`.

### Webhook Verification

```typescript
// plugins/odoo/connector.ts

async verifyWebhook(req: WebhookRequest, secret: string): Promise<void> {
  // Odoo webhooks use HMAC-SHA256 of the raw body with the shared secret
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
    "account.move": "invoice",
    "project.project": "project",
    "account.payment": "payment",
  };

  const entityType = modelMap[payload.model];
  if (!entityType) return [];

  const eventTypeMap: Record<string, string> = {
    "record.created": "created",
    "record.updated": "updated",
    "record.deleted": "deleted",
  };

  return [{
    type: `${entityType}.${eventTypeMap[payload.event]}` as any,
    externalId: String(payload.record_id),
    workspaceId: this.resolveWorkspaceByDatabase(payload.database),
    timestamp: new Date(payload.timestamp),
    payload,
  }];
}
```

---

## Write-Back (CommissionKit → Odoo)

When write-back is enabled, CKit creates custom fields on `sale.order`:

```typescript
// plugins/odoo/connector.ts

async writeBackCommission(
  workspaceId: string,
  config: ConnectionConfig,
  results: CommissionWriteBack[]
): Promise<WriteBackResult[]> {
  const client = new OdooClient(config.baseUrl, config.database);
  await client.authenticate(config.username, config.apiKey);

  // Ensure custom fields exist (idempotent)
  await ensureCustomFields(client);

  const outcomes: WriteBackResult[] = [];

  for (const result of results) {
    try {
      await client.update("sale.order", Number(result.dealExternalId), {
        x_ckit_commission_amount: result.commissionAmount,
        x_ckit_commission_rate: result.commissionRate,
        x_ckit_commission_currency: result.currency,
        x_ckit_last_calc_run: result.runId,
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

| Technical Name | Field Label | Type | Applies To |
|---|---|---|---|
| `x_ckit_commission_amount` | Commission Amount | Float | `sale.order` |
| `x_ckit_commission_rate` | Commission Rate (%) | Float | `sale.order` |
| `x_ckit_commission_currency` | Commission Currency | Char | `sale.order` |
| `x_ckit_last_calc_run` | Last Commission Run | Char | `sale.order` |
| `x_ckit_payout_status` | Payout Status | Selection | `sale.order` |
| `x_ckit_payout_amount` | Payout Amount | Float | `sale.order` |
| `x_ckit_has_dispute` | Has Dispute | Boolean | `sale.order` |

---

## Rate Limiting

Odoo's JSON-RPC API can be slow. The connector implements:

- **Request concurrency**: Max 3 concurrent Odoo API calls per workspace
- **Batch size**: 200 records per `search_read` call (Odoo default)
- **Pagination**: Automatically paginates through large result sets
- **Incremental sync**: Uses `write_date >= lastSyncDate` to minimize data transfer

---

## Setup Guide (for Users)

1. In Odoo, go to Settings > Users & Companies > Users
2. Select the user that will be used for API access
3. Under "API Keys", click "Generate" and copy the key
4. In CommissionKit, go to Workspace Settings > Integrations
5. Select "Odoo ERP" and enter:
   - Your Odoo instance URL
   - Database name
   - Username (email)
   - API Key
6. Click "Test Connection" then "Connect"
7. Install the CommissionKit webhook module (optional, for real-time sync)
8. Initial sync begins automatically

---

## Files

```
plugins/odoo/
├── index.ts                  # Default export: OdooConnector
├── connector.ts              # Main connector class
├── client.ts                 # Odoo JSON-RPC HTTP client wrapper
├── transform.ts              # Data transformation helpers
├── webhooks.ts               # Webhook verification + parsing
├── writeback.ts              # Commission/payout write-back logic
├── fields.ts                 # Custom field definitions
├── currency.ts               # Odoo currency name → ISO 4217 mapping
└── types.ts                  # Odoo-specific types
```
