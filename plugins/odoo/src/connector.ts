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
} from "@workspace/plugins-core";
import { OdooClient } from "./client";
import { normalizeOdooCurrency } from "./currency";

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
  readonly description = "Connect CKit to your Odoo instance. Syncs sales reps and confirmed sales orders from the Sales or CRM app.";
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
    options?: FetchOptions,
  ): Promise<NormalizedRep[]> {
    const c = this.parseConfig(config);
    const client = this.getOdooClient(config);
    await client.authenticate(c.username, c.apiKey);

    const domain: any[] = [
      ["share", "=", false],
      ["active", "=", true],
    ];

    if (options?.modifiedAfter) {
      domain.push(["write_date", ">=", options.modifiedAfter.toISOString()]);
    }

    const records = await client.searchRead("res.users", domain, ["name", "email", "login"]);

    return records.map((r: any) => ({
      externalId: String(r.id),
      name: r.name || r.login || "",
      email: r.email || r.login || "",
      role: undefined,
      metadata: { odooUserId: r.id, odooLogin: r.login },
    }));
  }

  async fetchDeals(
    workspaceId: string,
    config: ConnectionConfig,
    options?: FetchOptions,
  ): Promise<NormalizedDeal[]> {
    const c = this.parseConfig(config);
    const client = this.getOdooClient(config);
    await client.authenticate(c.username, c.apiKey);

    const closedWonStages = c.closedWonStages || ["sale", "done"];
    const syncClosedOnly = c.syncClosedOnly === true;
    const stageFilter = (config as any)._metadata?.stageFilter as string[] | undefined;

    const domain: any[] = [];
    if (syncClosedOnly) {
      domain.push(["state", "in", closedWonStages]);
    }

    if (options?.modifiedAfter) {
      domain.push(["write_date", ">=", options.modifiedAfter.toISOString()]);
    }

    const fields = [
      "name",
      "amount_total",
      "date_order",
      "state",
      "currency_id",
      "user_id",
      "invoice_ids",
      "write_date",
      "note",
    ];

    const records = await client.searchRead("sale.order", domain, fields);

    // Collect all invoice IDs to batch-query payment states
    const allInvoiceIds: number[] = [];
    for (const r of records) {
      if (r.invoice_ids && Array.isArray(r.invoice_ids)) {
        for (const invId of r.invoice_ids) {
          allInvoiceIds.push(invId);
        }
      }
    }

    // Batch fetch invoice payment states
    let invoicePayments = new Map<number, string>();
    if (allInvoiceIds.length > 0) {
      try {
        const invoices = await client.searchRead(
          "account.move",
          [["id", "in", allInvoiceIds]],
          ["payment_state"],
        );
        for (const inv of invoices) {
          invoicePayments.set(inv.id, inv.payment_state || "not_paid");
        }
      } catch {
        // Fallback: if invoice query fails, assume all unpaid
      }
    }

    return records.map((r: any) => {
      // Derive payment status from linked invoices, not invoice_status
      let paymentStatus: import("@workspace/plugins-core").PaymentStatus = "unpaid";
      if (r.invoice_ids && Array.isArray(r.invoice_ids) && r.invoice_ids.length > 0) {
        const states = r.invoice_ids
          .map((id: number) => invoicePayments.get(id) || "not_paid");

        const allPaid = states.every((s: string) => s === "paid" || s === "in_payment");
        const nonePaid = states.every((s: string) => s === "not_paid");
        const anyReversed = states.some((s: string) => s === "reversed" || s === "cancel");

        if (anyReversed) {
          paymentStatus = "on_hold";
        } else if (allPaid) {
          paymentStatus = "paid";
        } else if (!nonePaid) {
          paymentStatus = "partial";
        }
      }

      // Normalize Odoo state to CKit stage
      const stage = normalizeStage(r.state);

      return {
        externalId: String(r.id),
        repExternalId: r.user_id?.[0] ? String(r.user_id[0]) : "",
        name: r.name || "",
        amount: r.amount_total || 0,
        closeDate: r.date_order ? new Date(r.date_order) : new Date(),
        stage,
        currency: normalizeOdooCurrency(r.currency_id?.[1]),
        paymentStatus,
        notes: r.note || undefined,
        metadata: { odooOrderId: r.id, odooRawState: r.state },
      };
    }).filter((d: any) => !stageFilter || stageFilter.length === 0 || stageFilter.includes(d.metadata.odooRawState));
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
      features: ["sync_reps", "sync_deals"],
      setupGuideUrl: "https://docs.commissionkit.com/integrations/odoo",
    };
  }
}

// ─── Stage normalization ─────────────────────────────────────────────

const ODOO_STAGE_MAP: Record<string, string> = {
  draft: "pending",
  sent: "pending",
  sale: "closed_won",
  done: "closed_won",
  cancel: "closed_lost",
};

function normalizeStage(odooState: string, mapping?: Record<string, string>): string {
  if (mapping?.[odooState]) return mapping[odooState];
  return ODOO_STAGE_MAP[odooState] || "closed_won";
}

export { normalizeStage, ODOO_STAGE_MAP }; // exported for tests
