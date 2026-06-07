# Plugin API Design

New REST API endpoints required to support the plugin system. All endpoints are mounted under `/api/integrations`.

---

## Endpoints Overview

| Method | Path | Purpose | Permission |
|---|---|---|---|
| `GET` | `/api/integrations/connectors` | List available connectors | Authenticated |
| `GET` | `/api/integrations/connectors/:name` | Get connector metadata + settings schema | Authenticated |
| `GET` | `/api/integrations/:workspaceId/status` | Get connection status | `workspace:read` |
| `POST` | `/api/integrations/:workspaceId/connect` | Connect an ERP to a workspace | `workspace:edit` |
| `POST` | `/api/integrations/:workspaceId/test` | Test connection without saving | `workspace:edit` |
| `PATCH` | `/api/integrations/:workspaceId/config` | Update connector configuration | `workspace:edit` |
| `DELETE` | `/api/integrations/:workspaceId/disconnect` | Disconnect ERP from workspace | `workspace:edit` |
| `GET` | `/api/integrations/:workspaceId/sync-history` | List sync history | `workspace:read` |
| `GET` | `/api/integrations/:workspaceId/sync-history/:syncId` | Get sync detail with logs | `workspace:read` |
| `POST` | `/api/integrations/:workspaceId/sync/:entityType` | Trigger manual sync | `workspace:edit` |
| `GET` | `/api/integrations/:workspaceId/logs` | Get detailed sync logs | `workspace:read` |
| `POST` | `/api/integrations/webhooks/:connectorName` | Receive ERP webhook | Public (verified) |

---

## Detailed Endpoint Specs

### List Available Connectors

```
GET /api/integrations/connectors
```

**Response**:
```json
{
  "connectors": [
    {
      "name": "odoo",
      "displayName": "Odoo ERP",
      "description": "Connect CommissionKit to your Odoo instance for automatic rep, deal, invoice, and payment sync.",
      "icon": "store",
      "category": "erp",
      "features": ["sync_reps", "sync_deals", "sync_projects", "sync_invoices", "sync_payments", "write_back_commission", "write_back_payouts", "webhook_support"],
      "version": "1.0.0",
      "requiresGrowthPlan": false
    },
    {
      "name": "hubspot",
      "displayName": "HubSpot CRM",
      "description": "Sync sales reps and closed-won deals from HubSpot. Commission results can be written back as deal properties.",
      "icon": "sprout",
      "category": "crm",
      "features": ["sync_reps", "sync_deals", "write_back_commission", "webhook_support", "oauth_support"],
      "version": "1.0.0",
      "requiresGrowthPlan": false
    }
  ]
}
```

### Get Connector Settings Schema

```
GET /api/integrations/connectors/:name
```

**Response**: (example for Odoo)
```json
{
  "name": "odoo",
  "displayName": "Odoo ERP",
  "description": "...",
  "icon": "store",
  "category": "erp",
  "version": "1.0.0",
  "features": ["sync_reps", "sync_deals", "sync_projects", "sync_invoices", "sync_payments", "write_back_commission", "write_back_payouts"],
  "setupGuideUrl": "https://docs.commissionkit.com/integrations/odoo",
  "settingsSchema": {
    "type": "object",
    "required": ["baseUrl", "database", "username", "apiKey"],
    "properties": {
      "baseUrl": { "type": "string", "title": "Odoo Instance URL", "format": "uri" },
      "database": { "type": "string", "title": "Database Name" },
      "username": { "type": "string", "title": "Username", "format": "email" },
      "apiKey": { "type": "string", "title": "API Key", "format": "password", "x-sensitive": true },
      "syncClosedOnly": { "type": "boolean", "title": "Sync only closed deals", "default": true },
      "autoAssignPlanId": { "type": "string", "title": "Auto-assign plan to new reps", "enum": ["plan-id-1", "plan-id-2"] },
      "sendPortalEmails": { "type": "boolean", "title": "Send portal welcome emails", "default": true }
    }
  }
}
```

### Get Connection Status

```
GET /api/integrations/:workspaceId/status
```

**Response**:
```json
{
  "connected": true,
  "connectorName": "odoo",
  "connectorDisplayName": "Odoo ERP",
  "status": "connected",
  "lastSyncedAt": "2026-06-05T10:30:00Z",
  "syncSchedule": {
    "reps": "hourly",
    "deals": "hourly",
    "invoices": "daily",
    "projects": "daily",
    "payments": "daily"
  },
  "writeBackEnabled": true,
  "lastError": null,
  "recentSyncs": [
    {
      "id": "sync_abc123",
      "entityType": "deals",
      "status": "completed",
      "trigger": "scheduled",
      "stats": { "created": 5, "updated": 12, "skipped": 1430, "failed": 0 },
      "completedAt": "2026-06-05T10:30:00Z"
    }
  ]
}
```

### Connect ERP

```
POST /api/integrations/:workspaceId/connect
```

**Request**:
```json
{
  "connectorName": "odoo",
  "config": {
    "baseUrl": "https://mycompany.odoo.com",
    "database": "mycompany",
    "username": "admin@mycompany.com",
    "apiKey": "sk-abc123..."
  },
  "syncSchedule": {
    "reps": "hourly",
    "deals": "hourly",
    "invoices": "daily",
    "projects": "daily",
    "payments": "daily"
  },
  "writeBackEnabled": true
}
```

**Response**:
```json
{
  "success": true,
  "connection": {
    "workspaceId": "ws_xyz",
    "connectorName": "odoo",
    "status": "connecting",
    "webhookUrl": "https://api.commissionkit.com/api/integrations/webhooks/odoo"
  },
  "initialSync": {
    "syncId": "sync_def456",
    "status": "running"
  }
}
```

After connecting, the system:
1. Tests the connection
2. Generates a webhook secret
3. Starts initial bulk sync
4. Schedules recurring sync jobs
5. Returns the webhook URL for the user to configure in their ERP

### Test Connection

```
POST /api/integrations/:workspaceId/test
```

**Request**:
```json
{
  "connectorName": "odoo",
  "config": {
    "baseUrl": "https://mycompany.odoo.com",
    "database": "mycompany",
    "username": "admin@mycompany.com",
    "apiKey": "sk-abc123..."
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully connected to Odoo 17.0",
  "details": {
    "endpoint": "https://mycompany.odoo.com",
    "latency": 145,
    "version": "17.0",
    "authenticatedUser": "Admin User",
    "companyName": "My Company"
  }
}
```

### Update Config

```
PATCH /api/integrations/:workspaceId/config
```

**Request**: Partial config update. Only provided fields change.
```json
{
  "syncSchedule": {
    "deals": "daily"
  },
  "writeBackEnabled": false
}
```

### Disconnect

```
DELETE /api/integrations/:workspaceId/disconnect
```

- Removes all sync schedules for the workspace
- Deletes webhook registration from the ERP (if supported)
- Sets connection status to "disconnected"
- Does NOT delete any synced data (reps, deals, etc. remain in CKit)

### Manual Sync Trigger

```
POST /api/integrations/:workspaceId/sync/:entityType
```

`:entityType` = `reps`, `deals`, `projects`, `invoices`, `payments`

**Request** (optional):
```json
{
  "fullSync": false,
  "externalIds": ["odoo_deal_123", "odoo_deal_456"]
}
```

**Response**:
```json
{
  "syncId": "sync_ghi789",
  "status": "running"
}
```

### Sync History

```
GET /api/integrations/:workspaceId/sync-history
```

Query params: `entityType`, `status`, `limit`, `offset`

**Response**:
```json
{
  "syncs": [
    {
      "id": "sync_abc123",
      "entityType": "deals",
      "direction": "ingress",
      "trigger": "scheduled",
      "status": "completed",
      "stats": {
        "total": 1447,
        "created": 5,
        "updated": 12,
        "skipped": 1430,
        "failed": 0
      },
      "startedAt": "2026-06-05T10:00:00Z",
      "completedAt": "2026-06-05T10:02:15Z"
    }
  ],
  "total": 42
}
```

### Sync Detail

```
GET /api/integrations/:workspaceId/sync-history/:syncId
```

Same as above, plus paginated `logs` array of `IntegrationLog` records.

### Sync Logs

```
GET /api/integrations/:workspaceId/logs
```

Query params: `entityType`, `action`, `externalId`, `limit`, `offset`, `since`

Returns detailed per-entity sync logs for troubleshooting.

### Webhook Receiver

```
POST /api/integrations/webhooks/:connectorName
```

Public endpoint. No auth required, but verified via connector-specific signature.

**Response**: `200 OK` (the actual processing is async)

---

## New Data Models

### IntegrationConnection

```typescript
// lib/db/src/schema/integrationConnection.ts

const IntegrationConnectionSchema = new Schema({
  workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, unique: true },
  connectorName: { type: String, required: true },
  status: {
    type: String,
    enum: ["disconnected", "connecting", "connected", "error"],
    default: "disconnected",
  },
  config: { type: Schema.Types.Mixed, default: {} },       // Encrypted
  credentials: { type: Schema.Types.Mixed, default: {} },  // Encrypted
  webhookSecret: { type: String },
  syncSchedule: {
    reps: { type: String, enum: ["realtime", "hourly", "daily", "manual"], default: "hourly" },
    deals: { type: String, enum: ["realtime", "hourly", "daily", "manual"], default: "hourly" },
    invoices: { type: String, enum: ["realtime", "hourly", "daily", "manual"], default: "daily" },
    projects: { type: String, enum: ["realtime", "hourly", "daily", "manual"], default: "daily" },
    payments: { type: String, enum: ["realtime", "hourly", "daily", "manual"], default: "daily" },
  },
  writeBackEnabled: { type: Boolean, default: false },
  lastConnectedAt: { type: Date },
  lastSyncedAt: { type: Date },
  lastError: { type: String },
}, { timestamps: true });
```

### IntegrationSync

```typescript
// lib/db/src/schema/integrationSync.ts

const IntegrationSyncSchema = new Schema({
  workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
  connectorName: { type: String, required: true },
  entityType: {
    type: String,
    enum: ["reps", "deals", "projects", "invoices", "payments", "commission", "payouts"],
    required: true,
  },
  direction: { type: String, enum: ["ingress", "egress"], required: true },
  trigger: { type: String, enum: ["scheduled", "webhook", "manual", "initial"], required: true },
  status: { type: String, enum: ["running", "completed", "failed", "partial"], required: true },
  stats: {
    total: { type: Number, default: 0 },
    created: { type: Number, default: 0 },
    updated: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
  },
  error: { type: String },
  startedAt: { type: Date },
  completedAt: { type: Date },
}, { timestamps: true });
```

### IntegrationLog

```typescript
// lib/db/src/schema/integrationLog.ts

const IntegrationLogSchema = new Schema({
  workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
  syncId: { type: Schema.Types.ObjectId, ref: "IntegrationSync", index: true },
  connectorName: { type: String, required: true },
  entityType: { type: String, required: true },
  externalId: { type: String, index: true },
  action: {
    type: String,
    enum: ["created", "updated", "skipped", "failed", "writeback_success", "writeback_failed"],
    required: true,
  },
  message: { type: String },
  details: { type: Schema.Types.Mixed },
}, { timestamps: true });
```

---

## Encryption for Sensitive Config

Connector configs containing API keys, OAuth tokens, etc. are encrypted at rest:

```typescript
// artifacts/api/src/lib/encryption.ts

import crypto from "crypto";

const ENCRYPTION_KEY = crypto.scryptSync(process.env.ENCRYPTION_SECRET!, "salt", 32);
const ALGORITHM = "aes-256-gcm";

function encrypt(data: Record<string, unknown>): { encrypted: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(data), "utf8"), cipher.final()]);
  return { encrypted: encrypted.toString("base64"), iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64") };
}

function decrypt(encrypted: string, iv: string, tag: string): Record<string, unknown> {
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encrypted, "base64")), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8"));
}
```

Config is encrypted before storing in MongoDB and decrypted before passing to the connector.

---

## Webhook URL Structure

Each connector gets a dedicated webhook URL:

```
POST https://api.commissionkit.com/api/integrations/webhooks/odoo
POST https://api.commissionkit.com/api/integrations/webhooks/hubspot
POST https://api.commissionkit.com/api/integrations/webhooks/salesforce
POST https://api.commissionkit.com/api/integrations/webhooks/custom
```

The connector name in the URL determines which connector handles the verification and parsing.

Workspace identification: The webhook payload must include a way to identify the workspace. Each connector handles this differently:
- **Odoo**: The webhook body includes the Odoo database name, which is matched to a connection config
- **HubSpot**: The app ID in the payload maps to the OAuth config
- **Salesforce**: The org ID in the payload maps to the connection config
- **Generic REST**: The `X-Workspace-Webhook-Secret` header is used to look up the workspace

---

## API Middleware

New middleware for webhook verification:

```typescript
// artifacts/api/src/middleware/webhook.ts

function requireWebhookVerification(req: Request, res: Response, next: NextFunction) {
  const connectorName = req.params.connectorName;
  const plugin = pluginRegistry.get(connectorName);
  if (!plugin) {
    return res.status(404).json({ error: "Unknown connector" });
  }

  // The connector identifies the workspace from the payload
  // and verifies the signature
  plugin.verifyWebhook(req, /* secret resolved later */)
    .then(() => next())
    .catch(() => res.status(401).json({ error: "Webhook verification failed" }));
}
```

---

## File Structure for Plugin Routes

```
artifacts/api/src/routes/integrations/
├── index.ts                  # Mounts /api/integrations router
├── connectors.ts             # GET /connectors, GET /connectors/:name
├── connect.ts                # POST /:workspaceId/connect
├── disconnect.ts             # DELETE /:workspaceId/disconnect
├── status.ts                 # GET /:workspaceId/status
├── sync.ts                   # POST /:workspaceId/sync/:entityType
├── sync-history.ts           # GET /:workspaceId/sync-history
├── webhooks.ts               # POST /webhooks/:connectorName
└── test.ts                   # POST /:workspaceId/test
```
