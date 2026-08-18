import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { CustomConnector } from "../connector";
import { mockFetchSingle } from "./setup";

describe("CustomConnector — metadata", () => {
  const connector = new CustomConnector();

  test("name is 'custom'", () => {
    expect(connector.name).toBe("custom");
  });

  test("displayName is 'Custom REST API'", () => {
    expect(connector.displayName).toBe("Custom REST API");
  });

  test("description matches tagline", () => {
    expect(connector.description).toContain("Connect CKit to any ERP or CRM");
    expect(connector.description).toContain("no code needed");
  });

  test("version is 1.0.0", () => {
    expect(connector.version).toBe("1.0.0");
  });

  test("icon is 'plug'", () => {
    expect(connector.icon).toBe("plug");
  });

  test("getSettingsSchema requires baseUrl", () => {
    const schema = connector.getSettingsSchema();
    expect(schema.type).toBe("object");
    expect(schema.required).toContain("baseUrl");
    expect(schema.properties).toHaveProperty("baseUrl");
  });

  test("getSettingsSchema baseUrl property has correct metadata", () => {
    const schema = connector.getSettingsSchema();
    const baseUrlProp = schema.properties!.baseUrl;
    expect(baseUrlProp).toBeDefined();
    expect(baseUrlProp.type).toBe("string");
    expect(baseUrlProp.format).toBe("uri");
  });

  test("getUIMetadata has correct category and features", () => {
    const meta = connector.getUIMetadata();
    expect(meta.name).toBe("Custom REST API");
    expect(meta.category).toBe("erp");
    expect(meta.features).toContain("sync_reps");
    expect(meta.features).toContain("sync_deals");
  });
});

describe("CustomConnector — lifecycle", () => {
  let connector: CustomConnector;

  beforeEach(() => {
    connector = new CustomConnector();
  });

  test("init sets status to connected", async () => {
    await connector.init("ws-1", {});
    expect(await connector.getStatus("ws-1")).toBe("connected");
  });

  test("destroy removes workspace", async () => {
    await connector.init("ws-2", {});
    await connector.destroy("ws-2");
    expect(await connector.getStatus("ws-2")).toBe("disconnected");
  });

  test("getStatus returns disconnected for unknown workspace", async () => {
    expect(await connector.getStatus("nonexistent")).toBe("disconnected");
  });

  test("multiple workspaces don't interfere", async () => {
    await connector.init("ws-a", { key: "a" });
    await connector.init("ws-b", { key: "b" });
    expect(await connector.getStatus("ws-a")).toBe("connected");
    expect(await connector.getStatus("ws-b")).toBe("connected");
    await connector.destroy("ws-a");
    expect(await connector.getStatus("ws-a")).toBe("disconnected");
    expect(await connector.getStatus("ws-b")).toBe("connected");
  });
});
