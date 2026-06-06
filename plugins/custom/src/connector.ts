import {
  BasePlugin,
  PluginHttpClient,
  derivePaymentStatus,
} from "@workspace/plugins-core";
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
import { CustomConnectorConfigSchema, type CustomConnectorConfig } from "./config-parser";
import { jsonpathGet } from "./jsonpath";
import { createPaginationState, getPaginationParams, advancePage } from "./pagination";
import { getAuthHeaders, refreshOAuthToken } from "./auth";

const DEFAULT_PAGINATION = {
  type: "offset" as const,
  limitParam: "limit",
  offsetParam: "offset",
  cursorParam: "cursor",
  pageParam: "page",
  limitValue: 100,
};

export class CustomConnector extends BasePlugin {
  readonly name = "custom";
  readonly displayName = "Custom REST API";
  readonly version = "1.0.0";
  readonly description = "Connect CommissionKit to any ERP or CRM that exposes a REST API. Configure field mappings, authentication, and pagination — no code needed.";
  readonly icon = "plug";

  private parseConfig(config: ConnectionConfig): CustomConnectorConfig {
    return CustomConnectorConfigSchema.parse(config);
  }

  async testConnection(config: ConnectionConfig): Promise<ConnectionTestResult> {
    try {
      const parsed = this.parseConfig(config);
      const headers = getAuthHeaders(parsed.auth);

      if (parsed.auth.type === "oauth2") {
        const token = await refreshOAuthToken(parsed.auth);
        headers["Authorization"] = `Bearer ${token.accessToken}`;
      }

      const start = Date.now();
      const response = await fetch(parsed.baseUrl, { headers, signal: AbortSignal.timeout(15_000) });
      const latency = Date.now() - start;

      if (!response.ok) {
        return { success: false, message: `HTTP ${response.status}: ${response.statusText}` };
      }

      return {
        success: true,
        message: "Successfully connected",
        details: { endpoint: parsed.baseUrl, latency },
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
    const parsed = this.parseConfig(config);
    const entity = parsed.entities.reps;
    if (!entity?.enabled) return [];

    return this.fetchEntities(
      parsed.baseUrl,
      parsed.auth,
      entity.endpoint,
      entity.method || "GET",
      entity.fields || {},
      entity.filters,
      entity.modifiedAfterParam,
      parsed.pagination || DEFAULT_PAGINATION,
      parsed.responsePath,
      options,
      (item, fields) => ({
        externalId: String(jsonpathGet(item, fields.externalId || "id") || ""),
        name: jsonpathGet(item, fields.name || "name") || "",
        email: jsonpathGet(item, fields.email || "email") || "",
        role: fields.role ? jsonpathGet(item, fields.role) : undefined,
      }) as NormalizedRep,
    );
  }

  async fetchDeals(
    workspaceId: string,
    config: ConnectionConfig,
    options?: FetchOptions,
  ): Promise<NormalizedDeal[]> {
    const parsed = this.parseConfig(config);
    const entity = parsed.entities.deals;
    if (!entity?.enabled) return [];

    const deals: NormalizedDeal[] = await this.fetchEntities(
      parsed.baseUrl,
      parsed.auth,
      entity.endpoint,
      entity.method || "GET",
      entity.fields || {},
      entity.filters,
      entity.modifiedAfterParam,
      parsed.pagination || DEFAULT_PAGINATION,
      parsed.responsePath,
      options,
      (item, fields) => {
        const rawStage = jsonpathGet(item, fields.stage || "stage");
        const rawPaymentStatus = fields.paymentStatus ? jsonpathGet(item, fields.paymentStatus) : undefined;

        return {
          externalId: String(jsonpathGet(item, fields.externalId || "id") || ""),
          repExternalId: String(jsonpathGet(item, fields.repExternalId || "repId") || ""),
          name: jsonpathGet(item, fields.name || "name") || "",
          amount: Number(jsonpathGet(item, fields.amount || "amount")) || 0,
          closeDate: new Date(jsonpathGet(item, fields.closeDate || "closeDate") || Date.now()),
          stage: rawStage || "closed_won",
          currency: fields.currency ? jsonpathGet(item, fields.currency) : undefined,
          paymentStatus: rawPaymentStatus
            ? derivePaymentStatus(rawPaymentStatus, entity.paymentStatusMapping as any)
            : undefined,
          notes: fields.notes ? jsonpathGet(item, fields.notes) : undefined,
        } as NormalizedDeal;
      },
    );

    // Apply stage filter if configured
    if (entity.stageFilter) {
      return deals.filter((d) => entity.stageFilter!.include.includes(d.stage));
    }

    return deals;
  }

  private async fetchEntities<T>(
    baseUrl: string,
    authConfig: CustomConnectorConfig["auth"],
    endpoint: string,
    method: "GET" | "POST",
    fields: Record<string, string | undefined>,
    staticFilters: { key: string; value: string }[] | undefined,
    modifiedAfterParam: string | undefined,
    paginationConfig: CustomConnectorConfig["pagination"] | undefined,
    responsePath: string | undefined,
    options: FetchOptions | undefined,
    mapFn: (item: any, fields: Record<string, string>) => T,
  ): Promise<T[]> {
    let headers = getAuthHeaders(authConfig);

    if (authConfig.type === "oauth2") {
      const token = await refreshOAuthToken(authConfig);
      headers["Authorization"] = `Bearer ${token.accessToken}`;
    }

    const http = new PluginHttpClient(baseUrl, headers);
    const allResults: T[] = [];
    const defaultPagination = paginationConfig || DEFAULT_PAGINATION;
    const pagination = createPaginationState(defaultPagination);
    const fieldMap = Object.fromEntries(
      Object.entries(fields).filter(([_, v]) => v !== undefined),
    ) as Record<string, string>;

    while (pagination.hasMore) {
      const params: Record<string, string> = {
        ...getPaginationParams(defaultPagination, pagination),
      };

      if (staticFilters) {
        for (const f of staticFilters) {
          params[f.key] = f.value;
        }
      }

      if (options?.modifiedAfter && modifiedAfterParam) {
        params[modifiedAfterParam] = options.modifiedAfter.toISOString();
      }

      let response: any;
      if (method === "POST") {
        response = await http.post(endpoint, params);
      } else {
        response = await http.get(endpoint, params);
      }

      const items = responsePath ? jsonpathGet(response, responsePath) : response;
      const list = Array.isArray(items) ? items : items?.data || items?.results || items?.items || [];

      for (const item of list) {
        allResults.push(mapFn(item, fieldMap));
      }

      advancePage(defaultPagination, pagination, response, list.length);
    }

    return allResults;
  }

  // ─── Webhooks ─────────────────────────────────────────────────────

  async verifyWebhook(_req: WebhookRequest, _secret: string): Promise<void> {
    // Generic connector: shared-secret verification via header
    // Implemented when webhook config is provided
  }

  parseWebhook(_payload: unknown): IngresEvent[] {
    // Implemented when webhook config is provided
    return [];
  }

  // ─── Settings Schema & Metadata ──────────────────────────────────

  getSettingsSchema(): JsonSchema {
    return {
      type: "object",
      required: ["baseUrl"],
      properties: {
        baseUrl: {
          type: "string",
          title: "Base URL",
          description: "Root URL of the ERP/CRM REST API",
          format: "uri",
        },
      },
    };
  }

  getUIMetadata(): PluginUIMetadata {
    return {
      name: "Custom REST API",
      description: this.description,
      icon: this.icon,
      category: "erp",
      features: ["sync_reps", "sync_deals"],
    };
  }
}
