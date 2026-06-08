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
import { HubSpotClient } from "./client";

interface HubSpotConfig {
  accessToken: string;
  syncClosedOnly?: boolean;
  closedWonStageIds?: string[];
}

const HUBSPOT_STAGE_MAP: Record<string, string> = {
  appointmentscheduled: "pending",
  qualifiedtobuy: "pending",
  presentationscheduled: "pending",
  decisionmakerboughtin: "pending",
  contractsent: "pending",
  closedwon: "closed_won",
  closedlost: "closed_lost",
};

export class HubSpotConnector extends BasePlugin {
  readonly name = "hubspot";
  readonly displayName = "HubSpot CRM";
  readonly version = "1.0.0";
  readonly description = "Connect CKit to your HubSpot CRM. Syncs sales reps (owners) and deals automatically.";
  readonly icon = "sprout";

  private parseConfig(config: ConnectionConfig): HubSpotConfig {
    return config as unknown as HubSpotConfig;
  }

  private getClient(config: ConnectionConfig): HubSpotClient {
    const c = this.parseConfig(config);
    if (!c.accessToken) throw new Error("HubSpot config requires an access token");
    return new HubSpotClient(c.accessToken);
  }

  async testConnection(config: ConnectionConfig): Promise<ConnectionTestResult> {
    try {
      const c = this.parseConfig(config);
      if (!c.accessToken) {
        return { success: false, message: "Missing access token" };
      }

      const start = Date.now();
      const client = this.getClient(config);
      const owners = await client.getOwners();
      const latency = Date.now() - start;

      return {
        success: true,
        message: `Connected — ${owners.length} owners found`,
        details: {
          endpoint: "https://api.hubapi.com",
          latency,
          authenticatedUser: owners[0]?.email,
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
    const client = this.getClient(config);

    try {
      const owners = await client.getOwners();

      return owners.map((o) => ({
        externalId: o.id,
        name: `${o.firstName || ""} ${o.lastName || ""}`.trim() || o.email || o.id,
        email: o.email || "",
        role: "Sales Rep",
        metadata: { hubspotOwnerId: o.id, hubspotUserId: o.userId },
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
    const client = this.getClient(config);

    try {
      let closedWonStageIds = c.closedWonStageIds;

      if (!closedWonStageIds || closedWonStageIds.length === 0) {
        try {
          const pipelines = await client.getPipelines();
          closedWonStageIds = [];
          for (const pipeline of pipelines) {
            for (const stage of pipeline.stages) {
              if (stage.metadata?.isClosed === "true") {
                closedWonStageIds.push(stage.id);
              }
            }
          }
        } catch {
          // Fall back to default stage mapping
        }
      }

      const deals = await client.getDeals(
        c.syncClosedOnly !== false ? closedWonStageIds : undefined,
        options?.modifiedAfter,
      );

      return deals
        .filter((d) => d.properties.hubspot_owner_id)
        .map((d) => {
        const p = d.properties;
        const amount = parseFloat(p.amount) || 0;
        const stage = normalizeHubSpotStage(p.dealstage);

        return {
          externalId: d.id,
          repExternalId: p.hubspot_owner_id || "",
          name: p.dealname || "Untitled Deal",
          amount,
          closeDate: p.closedate ? new Date(p.closedate) : new Date(),
          stage,
          currency: (p.deal_currency_code || "USD").toUpperCase(),
          paymentStatus: stage === "closed_won" ? "paid" as PaymentStatus : "unpaid" as PaymentStatus,
          notes: p.description || undefined,
          metadata: {
            hubspotDealId: d.id,
            hubspotPipeline: p.pipeline,
            hubspotStage: p.dealstage,
            hubspotLastModified: p.hs_lastmodifieddate,
          },
        };
      });
    } catch {
      return [];
    }
  }

  async verifyWebhook(_req: WebhookRequest, _secret: string): Promise<void> {
    // HubSpot webhooks use request signature verification (v3)
  }

  parseWebhook(_payload: unknown): IngresEvent[] {
    return [];
  }

  getSettingsSchema(): JsonSchema {
    return {
      type: "object",
      required: ["accessToken"],
      properties: {
        accessToken: {
          type: "string",
          title: "Access Token",
          description: "Service Key or Legacy App access token from HubSpot",
          format: "password",
          "x-sensitive": true,
        },
        syncClosedOnly: {
          type: "boolean",
          title: "Sync only closed-won deals",
          description: "Only import deals in closed-won stages",
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
      setupGuideUrl: "https://docs.commissionkit.com/integrations/hubspot",
    };
  }
}

function normalizeHubSpotStage(stageId: string): string {
  const lower = stageId?.toLowerCase() || "";
  return HUBSPOT_STAGE_MAP[lower] || "closed_won";
}
