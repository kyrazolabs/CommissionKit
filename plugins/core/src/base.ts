import type {
  CKitPlugin,
  ConnectionConfig,
  ConnectionTestResult,
  ConnectionStatus,
  FetchOptions,
  NormalizedRep,
  NormalizedDeal,
  IngresEvent,
  WebhookRequest,
  CommissionWriteBack,
  PayoutWriteBack,
  WriteBackResult,
  JsonSchema,
  PluginUIMetadata,
} from "./types";

export abstract class BasePlugin implements CKitPlugin {
  abstract readonly name: string;
  abstract readonly displayName: string;
  abstract readonly version: string;
  abstract readonly description: string;
  abstract readonly icon: string;

  protected workspaceConfigs = new Map<string, ConnectionConfig>();
  protected workspaceStatus = new Map<string, ConnectionStatus>();

  async init(workspaceId: string, config: ConnectionConfig): Promise<void> {
    this.workspaceConfigs.set(workspaceId, config);
    this.workspaceStatus.set(workspaceId, "connected");
  }

  async destroy(workspaceId: string): Promise<void> {
    this.workspaceConfigs.delete(workspaceId);
    this.workspaceStatus.delete(workspaceId);
  }

  getConfig(workspaceId: string): ConnectionConfig {
    const config = this.workspaceConfigs.get(workspaceId);
    if (!config) throw new Error(`No config for workspace ${workspaceId}`);
    return config;
  }

  async getStatus(workspaceId: string): Promise<ConnectionStatus> {
    return this.workspaceStatus.get(workspaceId) || "disconnected";
  }

  setStatus(workspaceId: string, status: ConnectionStatus): void {
    this.workspaceStatus.set(workspaceId, status);
  }

  abstract testConnection(config: ConnectionConfig): Promise<ConnectionTestResult>;
  abstract fetchReps(workspaceId: string, config: ConnectionConfig, options?: FetchOptions): Promise<NormalizedRep[]>;
  abstract fetchDeals(workspaceId: string, config: ConnectionConfig, options?: FetchOptions): Promise<NormalizedDeal[]>;
  abstract verifyWebhook(req: WebhookRequest, secret: string): Promise<void>;
  abstract parseWebhook(payload: unknown): IngresEvent[];
  abstract getSettingsSchema(): JsonSchema;
  abstract getUIMetadata(): PluginUIMetadata;

  async writeBackCommission?(_workspaceId: string, _config: ConnectionConfig, _results: CommissionWriteBack[]): Promise<WriteBackResult[]>;
  async writeBackPayoutStatus?(_workspaceId: string, _config: ConnectionConfig, _payouts: PayoutWriteBack[]): Promise<WriteBackResult[]>;
  async refreshTokens?(config: ConnectionConfig): Promise<ConnectionConfig> { return config; }
}
