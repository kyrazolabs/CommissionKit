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
    test("requires authType", () => {
      const schema = connector.getSettingsSchema();
      expect(schema.required).toContain("authType");
    });

    test("has authType enum", () => {
      const schema = connector.getSettingsSchema();
      const authType = schema.properties?.authType;
      expect(authType?.enum).toEqual(["private_app", "oauth2"]);
    });
  });

  describe("getUIMetadata", () => {
    test("category is crm", () => {
      expect(connector.getUIMetadata().category).toBe("crm");
    });

    test("features include sync_reps, sync_deals, oauth_support", () => {
      const meta = connector.getUIMetadata();
      expect(meta.features).toContain("sync_reps");
      expect(meta.features).toContain("sync_deals");
      expect(meta.features).toContain("oauth_support");
    });
  });

  describe("testConnection", () => {
    test("fails with missing access token (private_app)", async () => {
      const result = await connector.testConnection({ authType: "private_app" });
      expect(result.success).toBe(false);
      expect(result.message).toBe("Missing access token");
    });

    test("returns success for oauth2 with client credentials (pre-authorization)", async () => {
      const result = await connector.testConnection({
        authType: "oauth2",
        clientId: "my-client-id",
        clientSecret: "my-client-secret",
      });
      expect(result.success).toBe(true);
      expect(result.message).toContain("authorize to complete");
    });

    test("fails when API returns error (private_app)", async () => {
      globalThis.fetch = (async () => {
        return new Response("Unauthorized", { status: 401 });
      }) as any;
      const result = await connector.testConnection({
        accessToken: "bad-token",
        authType: "private_app",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("webhooks", () => {
    test("parseWebhook returns empty array", () => {
      expect(connector.parseWebhook({})).toEqual([]);
    });
  });
});
