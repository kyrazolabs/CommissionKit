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
  CommissionWriteBack,
  WriteBackResult,
} from "@workspace/plugins-core";
import { OdooClient } from "./client";
import { normalizeOdooCurrency } from "./currency";
import { deriveOdooPaymentStatus, isClosedWon, derivePeriod } from "./transform";

interface OdooConfig {
  baseUrl: string;
  database: string;
  username: string;
  apiKey: string;
  syncClosedOnly?: boolean;
  closedWonStages?: string[];
  excludedStages?: string[];
}

export class OdooConnector extends BasePlugin {
  readonly name = "odoo";
  readonly displayName = "Odoo ERP";
  readonly version = "1.0.0";
  readonly description = "Connect CommissionKit to your Odoo instance. Syncs sales reps and confirmed sales orders from the Sales or CRM app.";
  readonly icon = "store";

  private getOdooClient(config: ConnectionConfig): OdooClient {
    const c = config as unknown as OdooConfig;
    if (!c.baseUrl || !c.database) {
      throw new Error("Odoo config requires baseUrl and database");
    }
    return new OdooClient(c.baseUrl, c.database);
  }

  private parseConfig(config: ConnectionConfig): OdooConfig {
    return config as unknown as OdooConfig;
  }

  async testConnection(config: ConnectionConfig): Promise<ConnectionTestResult> {
    try {
      const c = this.parseConfig(config);
      if (!c.baseUrl || !c.database || !c.username || !c.apiKey) {
        return { success: false, message: "Missing required fields: baseUrl, database, username, apiKey" };
      }

      const start = Date.now();
      const client = new OdooClient(c.baseUrl, c.database);
      const uid = await client.authenticate(c.username, c.apiKey);
      const latency = Date.now() - start;

      if (!uid) {
        return { success: false, message: "Authentication failed — check credentials" };
      }

      return {
        success: true,
        message: `Connected to Odoo — user ID ${uid}`,
        details: {
          endpoint: c.baseUrl,
          latency,
          authenticatedUser: c.username,
        },
      };
    } catch (err: any) {
      return { success: false, message: err.message || "Connection failed" };
    }
  }

  async fetchReps(
    workspaceId: string,
    config: ConnectionConfig,
    _options?: FetchOptions,
  ): Promise<NormalizedRep[]> {
    const c = this.parseConfig(config);
    const client = this.getOdooClient(config);
    await client.authenticate(c.username, c.apiKey);

    const domain: any[] = [
      ["share", "=", false],
      ["active", "=", true],
    ];

    const records = await client.searchRead("res.users", domain, ["name", "email", "login", "job_id"]);

    return records.map((r: any) => ({
      externalId: String(r.id),
      name: r.name || r.login || "",
      email: r.email || r.login || "",
      role: r.job_id?.[1] || undefined,
      metadata: { odooUserId: r.id, odooLogin: r.login },
    }));
  }

  async fetchDeals(
    workspaceId: string,
    config: ConnectionConfig,
    _options?: FetchOptions,
  ): Promise<NormalizedDeal[]> {
    const c = this.parseConfig(config);
    const client = this.getOdooClient(config);
    await client.authenticate(c.username, c.apiKey);

    const closedWonStages = c.closedWonStages || ["sale", "done"];
    const syncClosedOnly = c.syncClosedOnly !== false;

    const domain: any[] = [];
    if (syncClosedOnly) {
      domain.push(["state", "in", closedWonStages]);
    }

    const fields = [
      "name",
      "amount_total",
      "date_order",
      "state",
      "currency_id",
      "user_id",
      "invoice_status",
      "note",
    ];

    const records = await client.searchRead("sale.order", domain, fields);

    return records.map((r: any) => ({
      externalId: String(r.id),
      repExternalId: r.user_id?.[0] ? String(r.user_id[0]) : "",
      name: r.name || "",
      amount: r.amount_total || 0,
      closeDate: r.date_order ? new Date(r.date_order) : new Date(),
      stage: r.state || "",
      currency: normalizeOdooCurrency(r.currency_id?.[1]),
      paymentStatus: deriveOdooPaymentStatus(r.invoice_status),
      notes: r.note || undefined,
      metadata: { odooOrderId: r.id, odooState: r.state },
    }));
  }

  async writeBackCommission(
    workspaceId: string,
    config: ConnectionConfig,
    results: CommissionWriteBack[],
  ): Promise<WriteBackResult[]> {
    const c = this.parseConfig(config);
    const client = this.getOdooClient(config);
    await client.authenticate(c.username, c.apiKey);

    const outcomes: WriteBackResult[] = [];

    for (const result of results) {
      try {
        // Write to sale.order custom fields
        await client.write("sale.order", [Number(result.dealExternalId)], {
          x_ckit_commission_amount: result.commissionAmount,
          x_ckit_commission_rate: result.commissionRate,
          x_ckit_commission_currency: result.currency,
          x_ckit_last_calc_run: result.runId,
        });
        outcomes.push({ externalId: result.dealExternalId, success: true });
      } catch (err: any) {
        outcomes.push({
          externalId: result.dealExternalId,
          success: false,
          error: err.message || "Write-back failed",
        });
      }
    }

    return outcomes;
  }

  async verifyWebhook(req: WebhookRequest, secret: string): Promise<void> {
    const signature = req.headers["x-odoo-signature"];
    if (!signature) throw new Error("Missing X-Odoo-Signature header");

    const crypto = await import("crypto");
    const computed = crypto
      .createHmac("sha256", secret)
      .update(req.rawBody)
      .digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(computed, "hex"))) {
      throw new Error("Invalid webhook signature");
    }
  }

  parseWebhook(payload: any): IngresEvent[] {
    if (!payload || !payload.model || !payload.event) return [];

    const entityMap: Record<string, string> = {
      "sale.order": "deal",
      "res.users": "rep",
    };

    const entityType = entityMap[payload.model];
    if (!entityType) return [];

    const eventMap: Record<string, string> = {
      "record.created": "created",
      "record.updated": "updated",
      "record.deleted": "deleted",
    };

    const eventType = eventMap[payload.event] || "updated";

    return [{
      type: `${entityType}.${eventType}` as IngresEvent["type"],
      externalId: String(payload.record_id || ""),
      workspaceId: "", // Will be resolved by webhook handler
      timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      payload,
    }];
  }

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
          description: "Your Odoo database name",
        },
        username: {
          type: "string",
          title: "Username (Email)",
          description: "Email of the Odoo user with API access",
          format: "email",
        },
        apiKey: {
          type: "string",
          title: "API Key",
          description: "Generate from Odoo: Settings > Users > API Keys",
          format: "password",
          "x-sensitive": true,
        },
        syncClosedOnly: {
          type: "boolean",
          title: "Sync only closed-won deals",
          description: "Only import confirmed/done sales orders",
          default: true,
        },
        closedWonStages: {
          type: "array",
          title: "Closed-won states",
          description: "Odoo states that count as closed-won",
          items: { type: "string" },
          default: ["sale", "done"],
        },
        excludedStages: {
          type: "array",
          title: "Excluded states",
          description: "Odoo states to exclude from sync",
          items: { type: "string" },
          default: ["draft", "cancel"],
        },
      },
    };
  }

  getUIMetadata(): PluginUIMetadata {
    return {
      name: this.displayName,
      description: this.description,
      icon: this.icon,
      category: "erp",
      features: ["sync_reps", "sync_deals", "write_back_commission", "webhook_support"],
      setupGuideUrl: "https://docs.commissionkit.com/integrations/odoo",
    };
  }
}
