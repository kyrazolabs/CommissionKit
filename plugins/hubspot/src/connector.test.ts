import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { HubSpotConnector } from "./connector";

describe("HubSpot — payment defaults", () => {
  let connector: HubSpotConnector;
  beforeEach(() => {
    connector = new HubSpotConnector();
  });
  afterEach(() => {
    mock.restore();
  });

  const accessToken = "pat-test";

  test("closed-won deals default to paid", async () => {
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          results: [
            {
              id: "d1",
              properties: {
                dealname: "Deal",
                amount: "100",
                closedate: "2024-01-01",
                dealstage: "closedwon",
                hubspot_owner_id: "owner-1",
                deal_currency_code: "USD",
              },
            },
          ],
          paging: undefined,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }) as any;

    const deals = await connector.fetchDeals("ws", {
      accessToken,
      _metadata: {},
    } as any);

    expect(deals[0].paymentStatus).toBe("paid");
  });

  test("closed-won deals use custom defaultPaymentStatus from metadata", async () => {
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          results: [
            {
              id: "d1",
              properties: {
                dealname: "Deal",
                amount: "100",
                closedate: "2024-01-01",
                dealstage: "closedwon",
                hubspot_owner_id: "owner-1",
              },
            },
          ],
          paging: undefined,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }) as any;

    const deals = await connector.fetchDeals("ws", {
      accessToken,
      _metadata: { defaultPaymentStatus: "unpaid" },
    } as any);

    expect(deals[0].paymentStatus).toBe("unpaid");
  });

  test("non-closed-won deals are always unpaid", async () => {
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          results: [
            {
              id: "d1",
              properties: {
                dealname: "Deal",
                amount: "100",
                closedate: "2024-01-01",
                dealstage: "presentationscheduled",
                hubspot_owner_id: "owner-1",
              },
            },
          ],
          paging: undefined,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }) as any;

    const deals = await connector.fetchDeals("ws", {
      accessToken,
      _metadata: { defaultPaymentStatus: "paid" },
    } as any);

    expect(deals[0].paymentStatus).toBe("unpaid");
  });

  test("defaultPaymentStatus partial works", async () => {
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          results: [
            {
              id: "d1",
              properties: {
                dealname: "Deal",
                amount: "100",
                closedate: "2024-01-01",
                dealstage: "closedwon",
                hubspot_owner_id: "owner-1",
              },
            },
          ],
          paging: undefined,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }) as any;

    const deals = await connector.fetchDeals("ws", {
      accessToken,
      _metadata: { defaultPaymentStatus: "partial" },
    } as any);

    expect(deals[0].paymentStatus).toBe("partial");
  });
});
