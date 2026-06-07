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

  private parseConfig(config: ConnectionConfig): CustomConnectorConfig | null {
    try {
      return CustomConnectorConfigSchema.parse(config);
    } catch (e: any) {
      if (process.env.NODE_ENV !== "production") {
        console.log("[CustomConnector] Config parse failed:", e instanceof Error ? e.message : String(e));
        console.log("[CustomConnector] Config keys:", Object.keys(config));
      }
      return null;
    }
  }

  async testConnection(config: ConnectionConfig): Promise<ConnectionTestResult> {
    try {
      const parsed = this.parseConfig(config);
      if (!parsed) return { success: false, message: "Invalid config — missing baseUrl or auth" };
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
    if (!parsed) {
      console.log("[CustomConnector] fetchReps: parseConfig returned null (invalid config)");
      console.log("[CustomConnector] config keys:", Object.keys(config));
      return [];
    }
    if (!parsed.entities?.reps?.enabled) {
      console.log("[CustomConnector] fetchReps: reps not enabled or entities missing");
      console.log("[CustomConnector] parsed.entities:", JSON.stringify(parsed.entities));
      return [];
    }

    const entity = parsed.entities.reps;

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
    if (!parsed) {
      console.log("[CustomConnector] fetchDeals: parseConfig returned null (invalid config)");
      return [];
    }
    if (!parsed.entities?.deals?.enabled) {
      console.log("[CustomConnector] fetchDeals: deals not enabled or entities missing");
      return [];
    }

    const entity = parsed.entities.deals;

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
    console.log(`[CustomConnector] fetchEntities called: ${endpoint}`);
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

    let pageNum = 0;
    while (pagination.hasMore) {
      pageNum++;
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
      let list: any[] = [];
      if (Array.isArray(items)) {
        list = items;
      } else if (items && typeof items === "object") {
        // Try common wrapper keys (may contain arrays or nested objects)
        const wrappers = [items.data, items.results, items.items, items.records, items];
        for (const wrapper of wrappers) {
          if (Array.isArray(wrapper)) { list = wrapper; break; }
          if (wrapper && typeof wrapper === "object") {
            // Check if any key inside the wrapper is an array
            for (const key of Object.keys(wrapper)) {
              if (Array.isArray(wrapper[key])) { list = wrapper[key]; break; }
            }
            if (list.length > 0) break;
          }
        }
      }
      if (!Array.isArray(list)) list = [];

      // Diagnostic
      if (process.env.NODE_ENV !== "production" && pageNum === 1) {
        const topKeys = items && typeof items === "object" ? Object.keys(items).join(", ") : "not an object";
        console.log(`[CustomConnector] ${endpoint} response has keys: ${topKeys}`);
        console.log(`[CustomConnector] ${endpoint} extracted ${list.length} items, responsePath="${responsePath || "none"}"`);
      }

      // Diagnostic logging
      if (process.env.NODE_ENV !== "production") {
        const statusMsg = list.length > 0
          ? `${list.length} records, sample keys: ${Object.keys(list[0]).slice(0, 8).join(", ")}`
          : "0 records (empty or auto-detection failed)";
        console.log(`[CustomConnector] ${endpoint} page ${pageNum} → ${statusMsg}`);
      }

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
