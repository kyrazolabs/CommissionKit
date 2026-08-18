import { beforeAll, describe, expect, test } from "bun:test";
import { pluginRegistry } from "./registry";
import type { CKitPlugin } from "./types";

function makeMockPlugin(name: string): CKitPlugin {
  return {
    name,
    displayName: `Mock ${name}`,
    version: "1.0.0",
    description: "desc",
    icon: "plug",
    init: async () => {},
    destroy: async () => {},
    testConnection: async () => ({ success: true, message: "ok" }),
    fetchReps: async () => [],
    fetchDeals: async () => [],
    verifyWebhook: async () => {},
    parseWebhook: () => [],
    getSettingsSchema: () => ({ type: "object" }),
    getUIMetadata: () => ({
      name: "mock",
      description: "mock",
      icon: "plug",
      category: "crm",
      features: [],
    }),
    getStatus: async () => "connected",
  };
}

describe("PluginRegistry", () => {
  beforeAll(() => {
    pluginRegistry.register(makeMockPlugin("clean-test"));
  });

  test("register adds plugin", () => {
    const p = makeMockPlugin("test-a");
    pluginRegistry.register(p);
    expect(pluginRegistry.get("test-a")).toBe(p);
  });

  test("get returns undefined for unknown plugin", () => {
    expect(pluginRegistry.get("nonexistent")).toBeUndefined();
  });

  test("list returns all registered plugins", () => {
    pluginRegistry.register(makeMockPlugin("test-b"));
    const names = pluginRegistry.getNames();
    expect(names).toContain("test-b");
  });

  test("registering duplicate name overwrites", () => {
    const p1 = makeMockPlugin("test-dup");
    const p2 = makeMockPlugin("test-dup");
    pluginRegistry.register(p1);
    pluginRegistry.register(p2);
    expect(pluginRegistry.get("test-dup")).toBe(p2);
  });
});
