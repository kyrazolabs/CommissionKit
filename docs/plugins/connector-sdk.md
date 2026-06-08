# Connector SDK Specification

Every ERP/CRM connector must implement the `CKitPlugin` interface. This document defines the TypeScript contract, base classes, and utility types.

---

## Core Interface

```typescript
// plugins/core/types.ts

/**
 * A CommissionKit connector for an external ERP or CRM system.
 */
interface CKitPlugin {
  /** Machine name — used in URLs, queue names, and config keys */
  readonly name: string;

  /** Human-readable display name */
  readonly displayName: string;

  /** Semantic version of the connector */
  readonly version: string;

  /** Description shown in the integration marketplace */
  readonly description: string;

  /** SVG icon or Lucide icon name */
  readonly icon: string;

  // ── Lifecycle ────────────────────────────────────────────

  /**
   * Initialize the connector with a workspace-specific configuration.
   * Called once per workspace when the connection is established or
   * config is updated.
   */
  init(workspaceId: string, config: ConnectionConfig): Promise<void>;

  /**
   * Tear down the connector for a workspace.
   * Closes HTTP connections, unregisters webhooks, etc.
   */
  destroy(workspaceId: string): Promise<void>;

  // ── Connection ───────────────────────────────────────────

  /** Test whether the provided credentials are valid and the ERP is reachable. */
  testConnection(config: ConnectionConfig): Promise<ConnectionTestResult>;

  /** Get current connection status for a workspace. */
  getStatus(workspaceId: string): Promise<ConnectionStatus>;

  // ── Data Ingress (ERP → CKit) ────────────────────────────

  /** Fetch and return normalized Rep records from the ERP. */
  fetchReps(workspaceId: string, config: ConnectionConfig, options?: FetchOptions): Promise<NormalizedRep[]>;

  /** Fetch and return normalized Deal records from the ERP. */
  fetchDeals(workspaceId: string, config: ConnectionConfig, options?: FetchOptions): Promise<NormalizedDeal[]>;

  /** Fetch and return normalized Project records (enterprise engines only). */
  fetchProjects?(workspaceId: string, config: ConnectionConfig, options?: FetchOptions): Promise<NormalizedProject[]>;

  /** Fetch and return normalized Invoice records (enterprise engines only). */
  fetchInvoices?(workspaceId: string, config: ConnectionConfig, options?: FetchOptions): Promise<NormalizedInvoice[]>;

  /** Fetch and return payment status updates. */
  fetchPayments?(workspaceId: string, config: ConnectionConfig, options?: FetchOptions): Promise<NormalizedPayment[]>;

  // ── Webhook Handling ─────────────────────────────────────

  /**
   * Verify that an incoming webhook request is authentic.
   * Throws if verification fails.
   */
  verifyWebhook(req: WebhookRequest, secret: string): Promise<void>;

  /**
   * Parse a verified webhook payload into one or more IngresEvents.
   * The sync engine will route each event to the appropriate sync queue.
   */
  parseWebhook(payload: unknown): IngresEvent[];

  // ── Data Egress (CKit → ERP, optional) ───────────────────

  /** Write commission results back to the ERP. */
  writeBackCommission?(workspaceId: string, config: ConnectionConfig, results: CommissionWriteBack[]): Promise<WriteBackResult[]>;

  /** Write payout status back to the ERP. */
  writeBackPayoutStatus?(workspaceId: string, config: ConnectionConfig, payouts: PayoutWriteBack[]): Promise<WriteBackResult[]>;

  // ── UI Configuration ─────────────────────────────────────

  /**
   * JSON Schema describing the configuration form fields for this connector.
   * Rendered as a dynamic form in the CommissionKit UI.
   */
  getSettingsSchema(): JsonSchema;

  /**
   * UI metadata: display name, description, feature badges, help text.
   */
  getUIMetadata(): PluginUIMetadata;
}
```

---

## Normalized Types (Ingress)

These are the shapes that connectors must return. The sync engine's transform layer maps them to CKit entities.

```typescript
// plugins/core/types.ts

interface NormalizedRep {
  externalId: string;
  name: string;
  email: string;
  role?: string;
  metadata?: Record<string, unknown>;  // Arbitrary ERP-specific data stored in CKit for reference
}

interface NormalizedDeal {
  externalId: string;
  repExternalId: string;   // Maps to Rep.externalId
  name: string;
  amount: number;
  closeDate: Date;
  stage: string;           // Raw stage name from ERP
  currency?: string;        // ISO 4217 code
  paymentStatus?: PaymentStatus;
  notes?: string;
  metadata?: Record<string, unknown>;
}

interface NormalizedProject {
  externalId: string;
  repExternalId: string;
  name: string;
  totalValue: number;
  totalCost: number;
  currency?: string;
  period: string;           // "YYYY-MM"
  status: string;
  metadata?: Record<string, unknown>;
}

interface NormalizedInvoice {
  externalId: string;
  projectExternalId: string;
  repExternalId: string;
  invoiceNumber: string;
  amount: number;
  currency?: string;
  period: string;
  paymentStatus?: PaymentStatus;
  dueDate?: Date;
  notes?: string;
  metadata?: Record<string, unknown>;
}

interface NormalizedPayment {
  externalId: string;
  dealExternalId?: string;
  invoiceExternalId?: string;
  status: PaymentStatus;
  amount: number;
  date: Date;
  metadata?: Record<string, unknown>;
}

type PaymentStatus = "unpaid" | "paid" | "partial" | "on_hold";
```

---

## Types (Egress / Write-Back)

```typescript
// plugins/core/types.ts

interface CommissionWriteBack {
  dealExternalId: string;
  repExternalId: string;
  commissionAmount: number;
  commissionRate: number;
  currency: string;
  runId: string;
}

interface PayoutWriteBack {
  dealExternalId?: string;
  repExternalId: string;
  payoutStatus: string;       // "pending" | "approved" | "paid" | "disputed" | "on_hold"
  payoutAmount: number;
  currency: string;
  payoutId: string;
}

interface WriteBackResult {
  externalId: string;
  success: boolean;
  error?: string;
}
```

---

## Connection Types

```typescript
// plugins/core/types.ts

interface ConnectionConfig {
  /** Connector-specific configuration (API keys, URLs, OAuth tokens) */
  [key: string]: unknown;
}

interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: {
    endpoint?: string;
    latency?: number;
    version?: string;
    authenticatedUser?: string;
  };
}

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";
```

---

## Fetch Options

```typescript
// plugins/core/types.ts

interface FetchOptions {
  /** Limit results. Undefined = all. */
  limit?: number;

  /** Offset for pagination. */
  offset?: number;

  /** Only fetch entities modified after this date. */
  modifiedAfter?: Date;

  /** Only fetch entities modified before this date. */
  modifiedBefore?: Date;

  /** Additional connector-specific filters. */
  filters?: Record<string, unknown>;
}
```

---

## Webhook Types

```typescript
// plugins/core/types.ts

interface WebhookRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body: unknown;
  rawBody: Buffer;            // For signature verification
}

interface IngresEvent {
  type: "rep.created" | "rep.updated" | "rep.deleted"
      | "deal.created" | "deal.updated" | "deal.deleted"
      | "project.created" | "project.updated" | "project.deleted"
      | "invoice.created" | "invoice.updated" | "invoice.deleted"
      | "payment.created" | "payment.updated";
  externalId: string;
  workspaceId: string;
  timestamp: Date;
  payload: unknown;           // Raw ERP event data
}
```

---

## JSON Schema (for Dynamic Settings Forms)

The `getSettingsSchema()` method returns a JSON Schema object that the CommissionKit frontend renders as a dynamic form. Example:

```typescript
// plugins/odoo/connector.ts

getSettingsSchema(): JsonSchema {
  return {
    type: "object",
    required: ["baseUrl", "database", "username", "apiKey"],
    properties: {
      baseUrl: {
        type: "string",
        title: "Odoo Instance URL",
        description: "e.g., https://mycompany.odoo.com",
        format: "uri",
      },
      database: {
        type: "string",
        title: "Database Name",
        description: "The Odoo database name",
      },
      username: {
        type: "string",
        title: "Username",
        description: "Email of the Odoo user with API access",
        format: "email",
      },
      apiKey: {
        type: "string",
        title: "API Key",
        description: "Generated from Odoo user preferences",
        format: "password",
        "x-sensitive": true,
      },
      syncClosedOnly: {
        type: "boolean",
        title: "Sync only closed deals",
        description: "Only import confirmed/done sale orders",
        default: true,
      },
    },
  };
}
```

The frontend renders this using a JSON Schema form library (e.g., `@rjsf/core`).

> **Sensitive fields**: Properties marked with `"x-sensitive": true` are encrypted at rest using AES-256-GCM with a workspace-scoped key derived from the workspace ID and a server secret.

---

## Plugin UI Metadata

```typescript
// plugins/core/types.ts

interface PluginUIMetadata {
  name: string;
  description: string;
  icon: string;              // Lucide icon name or URL
  category: "erp" | "crm";
  features: PluginFeature[];
  docsUrl?: string;
  setupGuideUrl?: string;
  requiresGrowthPlan?: boolean;
}

type PluginFeature =
  | "sync_reps"
  | "sync_deals"
  | "sync_projects"
  | "sync_invoices"
  | "sync_payments"
  | "write_back_commission"
  | "write_back_payouts"
  | "webhook_support"
  | "real_time_sync"
  | "oauth_support";
```

---

## Base Classes

Connector developers extend `BasePlugin` to reduce boilerplate:

```typescript
// plugins/core/base.ts

abstract class BasePlugin implements CKitPlugin {
  abstract readonly name: string;
  abstract readonly displayName: string;
  abstract readonly version: string;
  abstract readonly description: string;
  abstract readonly icon: string;

  // Maps workspaceId → ConnectionConfig (in-memory, backed by MongoDB)
  private workspaceConfigs = new Map<string, ConnectionConfig>();

  async init(workspaceId: string, config: ConnectionConfig): Promise<void> {
    this.workspaceConfigs.set(workspaceId, config);
  }

  async destroy(workspaceId: string): Promise<void> {
    this.workspaceConfigs.delete(workspaceId);
  }

  getConfig(workspaceId: string): ConnectionConfig {
    const config = this.workspaceConfigs.get(workspaceId);
    if (!config) throw new Error(`No config for workspace ${workspaceId}`);
    return config;
  }

  // Abstract — must be implemented
  abstract testConnection(config: ConnectionConfig): Promise<ConnectionTestResult>;
  abstract getStatus(workspaceId: string): Promise<ConnectionStatus>;
  abstract fetchReps(workspaceId: string, config: ConnectionConfig, options?: FetchOptions): Promise<NormalizedRep[]>;
  abstract fetchDeals(workspaceId: string, config: ConnectionConfig, options?: FetchOptions): Promise<NormalizedDeal[]>;
  abstract verifyWebhook(req: WebhookRequest, secret: string): Promise<void>;
  abstract parseWebhook(payload: unknown): IngresEvent[];
  abstract getSettingsSchema(): JsonSchema;
  abstract getUIMetadata(): PluginUIMetadata;

  // Optional — override if needed
  async fetchProjects?(workspaceId: string, config: ConnectionConfig, options?: FetchOptions): Promise<NormalizedProject[]>;
  async fetchInvoices?(workspaceId: string, config: ConnectionConfig, options?: FetchOptions): Promise<NormalizedInvoice[]>;
  async fetchPayments?(workspaceId: string, config: ConnectionConfig, options?: FetchOptions): Promise<NormalizedPayment[]>;
  async writeBackCommission?(workspaceId: string, config: ConnectionConfig, results: CommissionWriteBack[]): Promise<WriteBackResult[]>;
  async writeBackPayoutStatus?(workspaceId: string, config: ConnectionConfig, payouts: PayoutWriteBack[]): Promise<WriteBackResult[]>;
}
```

---

## HTTP Client Utility

A shared HTTP client with error handling, retries, and rate limiting:

```typescript
// plugins/core/http.ts

class PluginHttpClient {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string>,
    private options?: {
      timeout?: number;        // Default: 30s
      maxRetries?: number;     // Default: 3
      retryDelay?: number;     // Default: 1000ms
      rateLimit?: number;      // Max requests per second
    }
  ) {}

  async get<T>(path: string, params?: Record<string, string>): Promise<T>;
  async post<T>(path: string, body: unknown): Promise<T>;
  async put<T>(path: string, body: unknown): Promise<T>;
  async patch<T>(path: string, body: unknown): Promise<T>;
  async delete<T>(path: string): Promise<T>;
}
```

Connectors use this to call the ERP's REST API without reimplementing retry logic, timeout handling, and rate limiting.

---

## Transform Utility

Normalized entity → CKit entity mapping helpers:

```typescript
// plugins/core/transform.ts

function normalizeCurrency(code: string): string;
  // Maps ERP-specific currency codes to ISO 4217 (e.g., "US Dollar" → "USD")

function derivePeriod(date: Date): string;
  // Returns "YYYY-MM" from a Date

function derivePaymentStatus(rawStatus: string, mappings: Record<string, PaymentStatus>): PaymentStatus;
  // Maps ERP-specific payment status strings to CKit PaymentStatus

function mapStageToCKit(rawStage: string, closedWonStages: string[]): string;
  // Returns "closed-won" or the raw stage value
```

---

## Connector Registration

Connectors are auto-discovered at boot:

```typescript
// plugins/core/registry.ts

class PluginRegistry {
  private plugins = new Map<string, CKitPlugin>();

  async discover(): Promise<void> {
    // Scans plugins/*/index.ts for default exports implementing CKitPlugin
    // Imports them dynamically and registers by name
  }

  register(plugin: CKitPlugin): void {
    this.plugins.set(plugin.name, plugin);
  }

  get(name: string): CKitPlugin | undefined {
    return this.plugins.get(name);
  }

  list(): CKitPlugin[] {
    return Array.from(this.plugins.values());
  }
}
```

Registration at boot time (`artifacts/api/src/index.ts`):

```typescript
import { PluginRegistry } from "@/plugins/core/registry";
import { OdooConnector } from "@/plugins/odoo";
import { HubSpotConnector } from "@/plugins/hubspot";
// ... etc

const registry = new PluginRegistry();
registry.register(new OdooConnector());
registry.register(new HubSpotConnector());
// Dynamic discovery also works:
await registry.discover(); // Scans plugins/ directory
```
