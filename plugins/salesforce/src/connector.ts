import { BasePlugin } from "@workspace/plugins-core";
import type {
  ConnectionConfig,
  ConnectionTestResult,
  FetchOptions,
  NormalizedRep,
  NormalizedDeal,
  IngresEvent,
  WebhookRequest,
  JsonSchema,
  PluginUIMetadata,
  PaymentStatus,
} from "@workspace/plugins-core";
import { SalesforceClient } from "./client";

interface SalesforceConfig {
  authType?: "token" | "oauth";
  accessToken?: string;
  instanceUrl: string;
  clientId?: string;
  clientSecret?: string;
  username?: string;
  password?: string;
  securityToken?: string;
  syncClosedOnly?: boolean;
}

const SF_STAGE_MAP: Record<string, string> = {
  "closed won": "closed_won",
  "closed lost": "closed_lost",
};

export class SalesforceConnector extends BasePlugin {
  readonly name = "salesforce";
  readonly displayName = "Salesforce CRM";
  readonly version = "1.0.0";
  readonly description = "Connect CommissionKit to your Salesforce Sales Cloud. Syncs users as reps and opportunities as deals automatically.";
  readonly icon = "cloud";

  private parseConfig(config: ConnectionConfig): SalesforceConfig {
    return config as unknown as SalesforceConfig;
  }

  private async getClient(config: ConnectionConfig): Promise<SalesforceClient> {
    const c = this.parseConfig(config);

    // If OAuth credentials provided, auto-authenticate
    if (c.authType === "oauth" && c.clientId && c.clientSecret) {
      const tokens = await SalesforceClient.authenticate(
        c.instanceUrl || "https://login.salesforce.com",
        c.clientId, c.clientSecret, c.username, c.password, c.securityToken,
      );
      // Use the instance URL from the OAuth response, fall back to config
      return new SalesforceClient(tokens.accessToken, tokens.instanceUrl || c.instanceUrl || "");
    }

    if (!c.instanceUrl) throw new Error("Salesforce config requires an instance URL");
    if (!c.accessToken) throw new Error("Salesforce config requires an access token");
    return new SalesforceClient(c.accessToken, c.instanceUrl);
  }

  async testConnection(config: ConnectionConfig): Promise<ConnectionTestResult> {
    try {
      const c = this.parseConfig(config);
      if (!c.instanceUrl) {
        return { success: false, message: "Missing instance URL" };
      }
      if (!c.accessToken && !(c.clientId && c.clientSecret)) {
        return { success: false, message: "Missing access token or OAuth credentials (clientId + clientSecret)" };
      }

      const start = Date.now();
      const client = await this.getClient(config);
      const users = await client.query("SELECT Id, Name FROM User WHERE IsActive = true LIMIT 1");
      const latency = Date.now() - start;

      return {
        success: true,
        message: `Connected — ${users.length} user(s) found`,
        details: {
          endpoint: c.instanceUrl,
          latency,
          authenticatedUser: users[0]?.Name,
        },
      };
    } catch (err: any) {
      return { success: false, message: err.message || "Connection failed" };
    }
  }

  async fetchReps(
    _workspaceId: string,
    config: ConnectionConfig,
    _options?: FetchOptions,
  ): Promise<NormalizedRep[]> {
    const client = await this.getClient(config);

    try {
      const users = await client.query(
        "SELECT Id, Name, Email, UserRole.Name FROM User WHERE IsActive = true AND UserType = 'Standard'",
      );

      return users.map((u) => ({
        externalId: u.Id,
        name: u.Name || "",
        email: u.Email || "",
        role: u.UserRole?.Name || "Sales Rep",
        metadata: { salesforceUserId: u.Id },
      }));
    } catch {
      return [];
    }
  }

  async fetchDeals(
    _workspaceId: string,
    config: ConnectionConfig,
    options?: FetchOptions,
  ): Promise<NormalizedDeal[]> {
    const c = this.parseConfig(config);
    const client = await this.getClient(config);
    const savedMapping = (config as any)._metadata?.stageMapping as Record<string, string> | undefined;

    try {
      const soqlParts = [
        "SELECT Id, Name, Amount, CloseDate, StageName, OwnerId, CurrencyIsoCode, Description",
        "FROM Opportunity",
      ];

      if (c.syncClosedOnly !== false) {
        soqlParts.push("WHERE IsWon = true");
      }
      if (options?.modifiedAfter) {
        const date = options.modifiedAfter.toISOString().split("T")[0];
        soqlParts.push(c.syncClosedOnly !== false ? `AND LastModifiedDate >= ${date}` : `WHERE LastModifiedDate >= ${date}`);
      }

      const soql = soqlParts.join(" ");
      const records = await client.query(soql);

      return records
        .filter((r: any) => r.OwnerId)
        .map((r: any) => {
          const stage = savedMapping?.[r.StageName] || normalizeStage(r.StageName);

          return {
            externalId: r.Id,
            repExternalId: r.OwnerId || "",
            name: r.Name || "Untitled Opportunity",
            amount: r.Amount || 0,
            closeDate: r.CloseDate ? new Date(r.CloseDate) : new Date(),
            stage,
            currency: (r.CurrencyIsoCode || "USD").toUpperCase(),
            paymentStatus: stage === "closed_won" ? "paid" as PaymentStatus : "unpaid" as PaymentStatus,
            notes: r.Description || undefined,
            metadata: {
              salesforceOppId: r.Id,
              salesforceStage: r.StageName,
            },
          };
        });
    } catch {
      return [];
    }
  }

  async verifyWebhook(_req: WebhookRequest, _secret: string): Promise<void> {
    // Salesforce webhooks use Outbound Messages / Change Data Capture
  }

  parseWebhook(_payload: unknown): IngresEvent[] {
    return [];
  }

  getSettingsSchema(): JsonSchema {
    return {
      type: "object",
      required: ["instanceUrl"],
      properties: {
        instanceUrl: {
          type: "string",
          title: "Instance URL",
          description: "e.g. https://yourinstance.my.salesforce.com or https://login.salesforce.com",
          format: "uri",
        },
        accessToken: {
          type: "string",
          title: "Access Token (direct)",
          description: "Salesforce Session ID or access token from Connected App",
          format: "password",
          "x-sensitive": true,
        },
        clientId: {
          type: "string",
          title: "Client ID (OAuth2)",
          description: "Consumer Key from your Connected App",
        },
        clientSecret: {
          type: "string",
          title: "Client Secret (OAuth2)",
          description: "Consumer Secret from your Connected App",
          format: "password",
          "x-sensitive": true,
        },
        username: {
          type: "string",
          title: "Username (OAuth2)",
          description: "Salesforce user email",
        },
        password: {
          type: "string",
          title: "Password (OAuth2)",
          description: "Salesforce user password",
          format: "password",
          "x-sensitive": true,
        },
        securityToken: {
          type: "string",
          title: "Security Token (OAuth2, optional)",
          description: "Password + token concatenated for login",
          format: "password",
          "x-sensitive": true,
        },
        syncClosedOnly: {
          type: "boolean",
          title: "Sync only closed-won deals",
          description: "Only import opportunities marked as Closed Won",
          default: true,
        },
      },
    };
  }

  getUIMetadata(): PluginUIMetadata {
    return {
      name: this.displayName,
      description: this.description,
      icon: this.icon,
      category: "crm",
      features: ["sync_reps", "sync_deals"],
      setupGuideUrl: "https://docs.commissionkit.com/integrations/salesforce",
    };
  }
}

function normalizeStage(stageName: string): string {
  const lower = stageName?.toLowerCase() || "";
  return SF_STAGE_MAP[lower] || "pending";
}
