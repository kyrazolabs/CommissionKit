import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import { HubSpotConnector } from "./connector";

describe("HubSpotConnector", () => {
  let connector: HubSpotConnector;
  beforeEach(() => { connector = new HubSpotConnector(); });
  afterEach(() => { mock.restore(); });

  describe("metadata", () => {
    test("name is 'hubspot'", () => {
      expect(connector.name).toBe("hubspot");
    });

    test("displayName is 'HubSpot CRM'", () => {
      expect(connector.displayName).toBe("HubSpot CRM");
    });

    test("description mentions HubSpot", () => {
      expect(connector.description).toContain("HubSpot");
    });
  });

  describe("getSettingsSchema", () => {
    test("requires accessToken", () => {
      const schema = connector.getSettingsSchema();
      expect(schema.required).toContain("accessToken");
    });
  });

  describe("getUIMetadata", () => {
    test("category is crm", () => {
      expect(connector.getUIMetadata().category).toBe("crm");
    });

    test("features include sync_reps and sync_deals", () => {
      const meta = connector.getUIMetadata();
      expect(meta.features).toContain("sync_reps");
      expect(meta.features).toContain("sync_deals");
      expect(meta.features).not.toContain("oauth_support");
    });
  });

  describe("testConnection", () => {
    test("fails with missing access token", async () => {
      const result = await connector.testConnection({});
      expect(result.success).toBe(false);
      expect(result.message).toBe("Missing access token");
    });

    test("fails when API returns error", async () => {
      globalThis.fetch = (async () => {
        return new Response("Unauthorized", { status: 401 });
      }) as any;
      const result = await connector.testConnection({ accessToken: "bad-token" });
      expect(result.success).toBe(false);
    });
  });

  describe("webhooks", () => {
    test("parseWebhook returns empty array", () => {
      expect(connector.parseWebhook({})).toEqual([]);
    });
  });
});
