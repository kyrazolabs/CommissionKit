import { describe, test, expect, mock, beforeAll } from "bun:test";
import { normalizeStage, ODOO_STAGE_MAP, OdooConnector } from "./connector";

describe("normalizeStage", () => {
  test("maps Odoo states to CKit stages", () => {
    expect(normalizeStage("draft")).toBe("pending");
    expect(normalizeStage("sent")).toBe("pending");
    expect(normalizeStage("sale")).toBe("closed_won");
    expect(normalizeStage("done")).toBe("closed_won");
    expect(normalizeStage("cancel")).toBe("closed_lost");
  });

  test("unknown states default to closed_won", () => {
    expect(normalizeStage("banana")).toBe("closed_won");
    expect(normalizeStage("")).toBe("closed_won");
  });
});

describe("ODOO_STAGE_MAP", () => {
  test("contains all expected Odoo states", () => {
    expect(Object.keys(ODOO_STAGE_MAP)).toEqual(expect.arrayContaining([
      "draft", "sent", "sale", "done", "cancel",
    ]));
  });

  test("only maps to valid CKit stages", () => {
    const validStages = new Set(["pending", "closed_won", "closed_lost"]);
    for (const stage of Object.values(ODOO_STAGE_MAP)) {
      expect(validStages.has(stage)).toBe(true);
    }
  });
});

describe("OdooConnector", () => {
  let connector: OdooConnector;

  beforeAll(() => {
    connector = new OdooConnector();
  });

  describe("parseWebhook", () => {
    test("parses sale.order record.created", () => {
      const events = connector.parseWebhook({
        model: "sale.order",
        event: "record.created",
        record_id: 42,
        timestamp: "2024-01-15T10:00:00Z",
      });
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("deal.created");
      expect(events[0].externalId).toBe("42");
    });

    test("parses res.users record.updated", () => {
      const events = connector.parseWebhook({
        model: "res.users",
        event: "record.updated",
        record_id: 7,
      });
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("rep.updated");
      expect(events[0].externalId).toBe("7");
    });

    test("parses sale.order record.deleted", () => {
      const events = connector.parseWebhook({
        model: "sale.order",
        event: "record.deleted",
        record_id: 99,
      });
      expect(events[0].type).toBe("deal.deleted");
    });

    test("returns empty array for unknown model", () => {
      const events = connector.parseWebhook({
        model: "account.move",
        event: "record.created",
        record_id: 1,
      });
      expect(events).toEqual([]);
    });

    test("returns empty array for null/undefined payload", () => {
      expect(connector.parseWebhook(null)).toEqual([]);
      expect(connector.parseWebhook(undefined)).toEqual([]);
    });

    test("returns empty array for payload without model or event", () => {
      expect(connector.parseWebhook({})).toEqual([]);
      expect(connector.parseWebhook({ model: "sale.order" })).toEqual([]);
    });

    test("unknown event maps to updated", () => {
      const events = connector.parseWebhook({
        model: "sale.order",
        event: "unknown_event",
        record_id: 1,
      });
      expect(events[0].type).toBe("deal.updated");
    });
  });

  describe("verifyWebhook", () => {
    // verifyWebhook throws if signature is missing — cannot test HMAC without mock
    test("throws on missing signature header", async () => {
      await expect(
        connector.verifyWebhook(
          { method: "POST", path: "/webhook", headers: {}, body: {}, rawBody: Buffer.from("test") },
          "secret",
        ),
      ).rejects.toThrow("Missing X-Odoo-Signature header");
    });
  });

  describe("testConnection", () => {
    test("fails when required fields are missing", async () => {
      const result = await connector.testConnection({});
      expect(result.success).toBe(false);
      expect(result.message).toContain("Missing required fields");
    });
  });
});
