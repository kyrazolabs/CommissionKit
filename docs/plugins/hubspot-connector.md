# HubSpot CRM Connector

## Overview

The HubSpot connector integrates CommissionKit with HubSpot CRM. HubSpot is a CRM (not an ERP), so it syncs **reps and deals** only. Projects, invoices, and payments are not applicable. The connector uses HubSpot's REST API v3 with OAuth 2.0 authentication.

---

## Connection

### Prerequisites

1. A HubSpot account with a Private App or OAuth app
2. The app must have these scopes:
   - `crm.objects.contacts.read` (reps)
   - `crm.objects.deals.read` (deals)
   - `crm.schemas.deals.read` (deal stages/pipelines)
   - `crm.objects.owners.read` (deal owners → reps)
   - `crm.schemas.custom.read` (custom property definitions)
   - For write-back: `crm.objects.deals.write`
3. For webhooks: HubSpot webhook subscription

### Authentication

HubSpot supports two modes:

**Private App Token** (simpler):
```json
{
  "authMode": "token",
  "accessToken": "pat-na1-xxxx"
}
```

**OAuth 2.0** (for multi-user / marketplace app):
```json
{
  "authMode": "oauth",
  "clientId": "...",
  "clientSecret": "...",
  "refreshToken": "..."
}
```

The connector handles token refresh automatically.

### Configuration Schema

```json
{
  "authMode": { "type": "string", "enum": ["token", "oauth"] },
  "accessToken": { "type": "string", "x-sensitive": true },
  "pipelineStages": {
    "closedWonStages": { "type": "array", "items": { "type": "string" } }
  },
  "autoAssignPlanId": { "type": "string" },
  "sendPortalEmails": { "type": "boolean", "default": true }
}
```

---

## Data Fetching

### Reps (HubSpot Contact Owners → CKit Rep)

In HubSpot, sales reps are typically **Contact Owners**. The connector maps owners to CKit Reps:

```typescript
// plugins/hubspot/connector.ts

async fetchReps(workspaceId: string, config: ConnectionConfig, options?: FetchOptions): Promise<NormalizedRep[]> {
  const client = new HubSpotClient(config.accessToken);

  // Fetch all owners (HubSpot pagination: limit 100)
  const owners: HubSpotOwner[] = [];
  let after: string | undefined;
  do {
    const page = await client.get("/crm/v3/owners", { limit: 100, after });
    owners.push(...page.results);
    after = page.paging?.next?.after;
  } while (after);

  return owners
    .filter((o) => !o.archived)
    .map((o) => ({
      externalId: o.id,              // HubSpot owner ID
      name: `${o.firstName} ${o.lastName}`.trim(),
      email: o.email,
      role: "Sales Rep",             // HubSpot doesn't have a role hierarchy
      metadata: { hubspotOwnerId: o.id, hubspotUserId: o.userId },
    }));
}
```

**Alternative**: Use `crm/v3/objects/contacts` filtered by a custom property like `is_sales_rep = true` if the CRM uses contact records for reps instead of owners.

### Deals (HubSpot Deals → CKit Deals)

```typescript
async fetchDeals(workspaceId: string, config: ConnectionConfig, options?: FetchOptions): Promise<NormalizedDeal[]> {
  const client = new HubSpotClient(config.accessToken);

  // Build search filters
  const filters: any[] = [];

  // Only closed-won deals
  if (config.pipelineStages?.closedWonStages?.length) {
    filters.push({
      propertyName: "dealstage",
      operator: "IN",
      values: config.pipelineStages.closedWonStages,
    });
  }

  if (options?.modifiedAfter) {
    filters.push({
      propertyName: "hs_lastmodifieddate",
      operator: "GTE",
      values: [options.modifiedAfter.toISOString()],
    });
  }

  // Use search API (v3) for efficient filtering
  const deals: HubSpotDeal[] = [];
  let after: string | undefined;
  do {
    const page = await client.post("/crm/v3/objects/deals/search", {
      filterGroups: [{ filters }],
      properties: [
        "dealname", "amount", "closedate", "dealstage",
        "deal_currency_code", "hubspot_owner_id",
        "description", "pipeline",
      ],
      limit: 100,
      after,
    });
    deals.push(...page.results);
    after = page.paging?.next?.after;
  } while (after);

  return deals.map((d) => {
    const amount = d.properties.amount ? parseFloat(d.properties.amount) : 0;

    return {
      externalId: d.id,
      repExternalId: d.properties.hubspot_owner_id || "",
      name: d.properties.dealname || "Untitled Deal",
      amount,
      closeDate: d.properties.closedate ? new Date(d.properties.closedate) : new Date(),
      stage: d.properties.dealstage || "",
      currency: d.properties.deal_currency_code || "USD",
      paymentStatus: "paid",          // Closed-won deals in CRM are implicitly "paid"
      notes: d.properties.description,
      metadata: {
        hubspotDealId: d.id,
        hubspotPipeline: d.properties.pipeline,
        hubspotStage: d.properties.dealstage,
        hubspotLastModified: d.properties.hs_lastmodifieddate,
      },
    };
  });
}
```

**Payment status for CRM deals**: CRMs don't track payments. By default:
- Closed-won deals → `paymentStatus: "paid"` (assumed)
- Option to set all synced deals as `"unpaid"` for manual payment tracking in CKit

---

## Webhook Handling

### HubSpot Webhook Setup

HubSpot requires webhook subscriptions registered via API:

```typescript
// The connector registers webhook subscriptions on connection
async registerWebhooks(appId: string, webhookUrl: string): Promise<void> {
  const client = new HubSpotClient(config.accessToken);

  // Subscribe to deal creation + property changes
  await client.post(`/webhooks/v3/${appId}/settings`, {
    targetUrl: webhookUrl,
    throttling: { maxConcurrentRequests: 10, period: "SECONDLY" },
  });

  // Subscribe to specific events
  await client.post(`/webhooks/v3/${appId}/subscriptions`, {
    eventType: "deal.creation",
    propertyName: null,
    active: true,
  });
  await client.post(`/webhooks/v3/${appId}/subscriptions`, {
    eventType: "deal.propertyChange",
    propertyName: "amount",
    active: true,
  });
  await client.post(`/webhooks/v3/${appId}/subscriptions`, {
    eventType: "deal.propertyChange",
    propertyName: "dealstage",
    active: true,
  });
  await client.post(`/webhooks/v3/${appId}/subscriptions`, {
    eventType: "contact.creation",
    propertyName: null,
    active: true,
  });
}
```

### Webhook Verification

HubSpot uses request signature verification (HMAC-SHA256 with the app secret):

```typescript
// plugins/hubspot/connector.ts

async verifyWebhook(req: WebhookRequest, secret: string): Promise<void> {
  const signature = req.headers["x-hubspot-signature-v3"];
  if (!signature) throw new Error("Missing signature");

  const timestamp = req.headers["x-hubspot-request-timestamp"];
  // Verify timestamp is within 5 minutes (replay protection)
  if (Math.abs(Date.now() - Number(timestamp)) > 300000) {
    throw new Error("Request timestamp too old");
  }

  // Compute signature
  const sourceString = `${req.method}${req.url}${req.rawBody.toString("utf8")}${timestamp}`;
  const computed = crypto
    .createHmac("sha256", secret)
    .update(sourceString)
    .digest("base64");

  if (signature !== computed) {
    throw new Error("Invalid signature");
  }
}
```

### Webhook Parsing

HubSpot sends events flattened by the v3 webhooks API:

```typescript
parseWebhook(payload: HubSpotWebhookPayload[]): IngresEvent[] {
  return payload.map((event) => {
    const eventTypeMap: Record<string, string> = {
      "deal.creation": "deal.created",
      "deal.propertyChange": "deal.updated",
      "deal.deletion": "deal.deleted",
      "contact.creation": "rep.created",
      "contact.propertyChange": "rep.updated",
      "contact.deletion": "rep.deleted",
    };

    return {
      type: eventTypeMap[event.eventType] || "deal.updated",
      externalId: String(event.objectId),
      workspaceId: this.resolveWorkspaceByAppId(event.appId),
      timestamp: new Date(event.occurredAt),
      payload: event,
    };
  });
}
```

---

## Write-Back (CommissionKit → HubSpot)

Creates or updates custom properties on HubSpot Deals:

```typescript
async writeBackCommission(
  workspaceId: string,
  config: ConnectionConfig,
  results: CommissionWriteBack[]
): Promise<WriteBackResult[]> {
  const client = new HubSpotClient(config.accessToken);

  // Ensure custom property group and properties exist (idempotent)
  await ensureCustomProperties(client);

  const outcomes: WriteBackResult[] = [];

  // Batch update HubSpot deals (100 per batch)
  const batchSize = 100;
  for (let i = 0; i < results.length; i += batchSize) {
    const batch = results.slice(i, i + batchSize);

    try {
      await client.patch("/crm/v3/objects/deals/batch/update", {
        inputs: batch.map((r) => ({
          id: r.dealExternalId,
          properties: {
            ckit_commission_amount: r.commissionAmount.toString(),
            ckit_commission_rate: r.commissionRate.toString(),
            ckit_commission_currency: r.currency,
            ckit_last_calc_run: r.runId,
          },
        })),
      });

      batch.forEach((r) => outcomes.push({ externalId: r.dealExternalId, success: true }));
    } catch (err) {
      batch.forEach((r) => outcomes.push({
        externalId: r.dealExternalId,
        success: false,
        error: (err as Error).message,
      }));
    }
  }

  return outcomes;
}
```

### HubSpot Custom Properties Created

| Internal Name | Label | Type | Field Type |
|---|---|---|---|
| `ckit_commission_amount` | Commission Amount | number | number |
| `ckit_commission_rate` | Commission Rate (%) | number | number |
| `ckit_commission_currency` | Commission Currency | string | single-line text |
| `ckit_last_calc_run` | Last Commission Run | string | single-line text |
| `ckit_payout_status` | Payout Status | string | single-line text |
| `ckit_payout_amount` | Payout Amount | string | single-line text |
| `ckit_dispute_url` | Dispute | string | single-line text |

Properties are grouped under "CommissionKit" in the HubSpot property sidebar.

---

## Rate Limiting

HubSpot API rate limits (by account tier):
- Free: 10 requests/second
- Starter: 24 requests/second
- Pro: 35 requests/second
- Enterprise: 50 requests/second

The connector implements adaptive rate limiting: read `X-HubSpot-RateLimit-*` response headers and throttle accordingly.

Search API limits:
- Max 100 records per page
- Max 10,000 records per search
- Polling for large datasets uses date-range splitting

---

## Deal Stage Discovery

On connection, the connector fetches all pipelines and their stages:

```typescript
async discoverPipelines(client: HubSpotClient): Promise<PipelineDiscovery> {
  const pipelines = await client.get("/crm/v3/pipelines/deals");

  return pipelines.results.map((p: any) => ({
    pipelineId: p.id,
    pipelineLabel: p.label,
    stages: p.stages.map((s: any) => ({
      stageId: s.id,
      label: s.label,
      isClosedWon: s.metadata?.isClosed === "true",
      isClosedLost: s.metadata?.isClosed === "true" && !s.metadata?.isClosedWon,
    })),
  }));
}
```

The user selects which stages count as "closed-won" in the connector settings. Default: any stage with `metadata.isClosed = true` and not marked as lost.

---

## Files

```
plugins/hubspot/
├── index.ts                  # Default export: HubSpotConnector
├── connector.ts              # Main connector class
├── client.ts                 # HubSpot REST API v3 client wrapper
├── transform.ts              # Data transformation helpers
├── webhooks.ts               # Webhook registration, verification, parsing
├── writeback.ts              # Commission/payout write-back
├── properties.ts             # Custom property definitions
└── pipelines.ts              # Pipeline/stage discovery
```
