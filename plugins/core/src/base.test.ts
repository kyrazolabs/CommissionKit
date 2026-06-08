import { describe, test, expect, beforeAll, mock } from "bun:test";
import { BasePlugin } from "./base";
import type {
  CKitPlugin,
  ConnectionConfig,
  ConnectionTestResult,
  FetchOptions,
  NormalizedDeal,
  NormalizedRep,
  IngresEvent,
  WebhookRequest,
  JsonSchema,
  PluginUIMetadata,
} from "./types";

class TestConnector extends BasePlugin {
  readonly name = "test-connector";
  readonly displayName = "Test Connector";
  readonly version = "0.0.1";
  readonly description = "A test plugin";
  readonly icon = "plug";

  async testConnection(_config: ConnectionConfig): Promise<ConnectionTestResult> {
    return { success: true, message: "ok" };
  }

  async fetchReps(_ws: string, _cfg: ConnectionConfig, _opts?: FetchOptions): Promise<NormalizedRep[]> {
    return [];
  }

  async fetchDeals(_ws: string, _cfg: ConnectionConfig, _opts?: FetchOptions): Promise<NormalizedDeal[]> {
    return [];
  }

  async verifyWebhook(_req: WebhookRequest, _secret: string): Promise<void> {}

  parseWebhook(_payload: unknown): IngresEvent[] {
    return [];
  }

  getSettingsSchema(): JsonSchema {
    return { type: "object" };
  }

  getUIMetadata(): PluginUIMetadata {
    return {
      name: "Test Connector",
      description: "A test plugin",
      icon: "plug",
      category: "crm",
      features: ["sync_reps"],
    };
  }
}

describe("BasePlugin", () => {
  let plugin: TestConnector;

  beforeAll(() => {
    plugin = new TestConnector();
  });

  test("has correct metadata", () => {
    expect(plugin.name).toBe("test-connector");
    expect(plugin.displayName).toBe("Test Connector");
    expect(plugin.version).toBe("0.0.1");
  });

  test("init stores config and sets status to connected", async () => {
    await plugin.init("ws-1", { apiKey: "secret" });
    expect(await plugin.getStatus("ws-1")).toBe("connected");
    expect(plugin.getConfig("ws-1")).toEqual({ apiKey: "secret" });
  });

  test("destroy removes config and status", async () => {
    await plugin.init("ws-2", { token: "abc" });
    await plugin.destroy("ws-2");
    expect(await plugin.getStatus("ws-2")).toBe("disconnected");
    expect(() => plugin.getConfig("ws-2")).toThrow();
  });

  test("getConfig throws for unknown workspace", () => {
    expect(() => plugin.getConfig("nonexistent")).toThrow("No config for workspace nonexistent");
  });

  test("getStatus returns disconnected for unregistered workspace", async () => {
    expect(await plugin.getStatus("unknown")).toBe("disconnected");
  });

  test("setStatus updates workspace status", async () => {
    await plugin.init("ws-3", {});
    plugin.setStatus("ws-3", "error");
    expect(await plugin.getStatus("ws-3")).toBe("error");
  });

  test("workspace isolation — configs don't leak between workspaces", async () => {
    await plugin.init("ws-a", { key: "a" });
    await plugin.init("ws-b", { key: "b" });
    expect(plugin.getConfig("ws-a")).toEqual({ key: "a" });
    expect(plugin.getConfig("ws-b")).toEqual({ key: "b" });
  });
});
