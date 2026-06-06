// ─── Connection ──────────────────────────────────────────────────────

export interface ConnectionConfig {
  [key: string]: unknown;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: {
    endpoint?: string;
    latency?: number;
    version?: string;
    authenticatedUser?: string;
    companyName?: string;
  };
}

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

// ─── Sync Frequency ─────────────────────────────────────────────────

export type SyncFrequency = "realtime" | "hourly" | "daily" | "manual";

export interface SyncSchedule {
  reps: SyncFrequency;
  deals: SyncFrequency;
}

// ─── Fetch Options ──────────────────────────────────────────────────

export interface FetchOptions {
  limit?: number;
  offset?: number;
  modifiedAfter?: Date;
  filters?: Record<string, unknown>;
}

// ─── Normalized Entity Types (ERP → CKit ingress) ───────────────────

export type PaymentStatus = "unpaid" | "paid" | "partial" | "on_hold";

export interface NormalizedRep {
  externalId: string;
  name: string;
  email: string;
  role?: string;
  metadata?: Record<string, unknown>;
}

export interface NormalizedDeal {
  externalId: string;
  repExternalId: string;
  name: string;
  amount: number;
  closeDate: Date;
  stage: string;
  currency?: string;
  paymentStatus?: PaymentStatus;
  notes?: string;
  metadata?: Record<string, unknown>;
}

// ─── Webhook Types ──────────────────────────────────────────────────

export interface WebhookRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body: unknown;
  rawBody: Buffer;
}

export interface IngresEvent {
  type: "rep.created" | "rep.updated" | "rep.deleted" | "deal.created" | "deal.updated" | "deal.deleted";
  externalId: string;
  workspaceId: string;
  timestamp: Date;
  payload: unknown;
}

// ─── Write-Back Types (egress) ──────────────────────────────────────

export interface CommissionWriteBack {
  dealExternalId: string;
  repExternalId: string;
  commissionAmount: number;
  commissionRate: number;
  currency: string;
  runId: string;
}

export interface PayoutWriteBack {
  dealExternalId?: string;
  repExternalId: string;
  payoutStatus: string;
  payoutAmount: number;
  currency: string;
  payoutId: string;
}

export interface WriteBackResult {
  externalId: string;
  success: boolean;
  error?: string;
}

// ─── Plugin Metadata ────────────────────────────────────────────────

export type PluginCategory = "erp" | "crm";

export type PluginFeature =
  | "sync_reps"
  | "sync_deals"
  | "write_back_commission"
  | "write_back_payouts"
  | "webhook_support"
  | "real_time_sync"
  | "oauth_support";

export interface PluginUIMetadata {
  name: string;
  description: string;
  icon: string;
  category: PluginCategory;
  features: PluginFeature[];
  docsUrl?: string;
  setupGuideUrl?: string;
}

// ─── JSON Schema (for dynamic settings forms) ───────────────────────

export interface JsonSchema {
  type: string;
  title?: string;
  description?: string;
  required?: string[];
  properties?: Record<string, JsonSchemaProperty>;
}

export interface JsonSchemaProperty {
  type: string;
  title?: string;
  description?: string;
  default?: unknown;
  format?: string;
  enum?: string[];
  items?: JsonSchemaProperty;
  "x-sensitive"?: boolean;
}

// ─── Plugin Interface ───────────────────────────────────────────────

export interface CKitPlugin {
  readonly name: string;
  readonly displayName: string;
  readonly version: string;
  readonly description: string;
  readonly icon: string;

  init(workspaceId: string, config: ConnectionConfig): Promise<void>;
  destroy(workspaceId: string): Promise<void>;

  testConnection(config: ConnectionConfig): Promise<ConnectionTestResult>;
  getStatus(workspaceId: string): Promise<ConnectionStatus>;

  fetchReps(workspaceId: string, config: ConnectionConfig, options?: FetchOptions): Promise<NormalizedRep[]>;
  fetchDeals(workspaceId: string, config: ConnectionConfig, options?: FetchOptions): Promise<NormalizedDeal[]>;

  verifyWebhook(req: WebhookRequest, secret: string): Promise<void>;
  parseWebhook(payload: unknown): IngresEvent[];

  writeBackCommission?(workspaceId: string, config: ConnectionConfig, results: CommissionWriteBack[]): Promise<WriteBackResult[]>;
  writeBackPayoutStatus?(workspaceId: string, config: ConnectionConfig, payouts: PayoutWriteBack[]): Promise<WriteBackResult[]>;

  getSettingsSchema(): JsonSchema;
  getUIMetadata(): PluginUIMetadata;
}
