import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { CustomConnector } from "../connector";
import { mockFetchSequence, generateDataset, makePaginatedPages } from "./setup";

const originalFetch = globalThis.fetch;

describe("CustomConnector — pagination", () => {
  let connector: CustomConnector;
  beforeEach(() => { connector = new CustomConnector(); });
  afterEach(() => { globalThis.fetch = originalFetch; });

  const baseEntities = {
    entities: { reps: { enabled: true, endpoint: "/users", fields: { externalId: "id", name: "name", email: "id" } } },
  };

  describe("offset pagination", () => {
    const pagination = { type: "offset" as const, limitParam: "limit", offsetParam: "offset", limitValue: 100, cursorParam: "cursor", pageParam: "page" };

    test("first page (full page)", async () => {
      const data = generateDataset(50, "user");
      mockFetchSequence({ body: data });
      const reps = await connector.fetchReps("ws", {
        baseUrl: "https://api.example.com", auth: { type: "bearer", token: "t" }, pagination, ...baseEntities,
      });
      expect(reps).toHaveLength(50);
      expect(reps[0].externalId).toBe("user-0");
    });

    test("middle page (second of three)", async () => {
      const all = generateDataset(250, "user");
      const pages = makePaginatedPages(all, 100);
      mockFetchSequence(...pages);
      const reps = await connector.fetchReps("ws", {
        baseUrl: "https://api.example.com", auth: { type: "bearer", token: "t" }, pagination, responsePath: "data", ...baseEntities,
      });
      expect(reps).toHaveLength(250);
      expect(reps[0].externalId).toBe("user-0");
      expect(reps[100].externalId).toBe("user-100");
      expect(reps[249].externalId).toBe("user-249");
    });

    test("last page (partial)", async () => {
      const all = generateDataset(25, "user");
      mockFetchSequence({ body: all });
      const reps = await connector.fetchReps("ws", {
        baseUrl: "https://api.example.com", auth: { type: "bearer", token: "t" }, pagination, ...baseEntities,
      });
      expect(reps).toHaveLength(25);
    });

    test("empty page (stops)", async () => {
      mockFetchSequence({ body: [] });
      const reps = await connector.fetchReps("ws", {
        baseUrl: "https://api.example.com", auth: { type: "bearer", token: "t" }, pagination, ...baseEntities,
      });
      expect(reps).toHaveLength(0);
    });

    test("page overflow — hasMore stays true only when len >= limit", async () => {
      mockFetchSequence(
        { body: generateDataset(100, "u") },
        { body: [] },
      );
      const reps = await connector.fetchReps("ws", {
        baseUrl: "https://api.example.com", auth: { type: "bearer", token: "t" }, pagination: { ...pagination, limitValue: 100 }, ...baseEntities,
      });
      expect(reps).toHaveLength(100); // 100 on page 1, then empty page stops loop
    });

    test("page size variation — limit=10", async () => {
      const all = generateDataset(35, "u");
      const pages = makePaginatedPages(all, 10);
      mockFetchSequence(...pages);
      const reps = await connector.fetchReps("ws", {
        baseUrl: "https://api.example.com", auth: { type: "bearer", token: "t" }, pagination: { ...pagination, limitValue: 10 }, responsePath: "data", ...baseEntities,
      });
      expect(reps).toHaveLength(35);
    });

    test("page size variation — limit=1 (multi-page with offset)", async () => {
      const all = generateDataset(3, "u");
      mockFetchSequence(
        { body: [all[0]] },
        { body: [all[1]] },
        { body: [all[2]] },
        { body: [] },
      );
      const reps = await connector.fetchReps("ws", {
        baseUrl: "https://api.example.com", auth: { type: "bearer", token: "t" }, pagination: { ...pagination, limitValue: 1 }, ...baseEntities,
      });
      expect(reps).toHaveLength(3);
    });
  });

  describe("cursor pagination", () => {
    const cursorPagination = { type: "cursor" as const, limitParam: "limit", offsetParam: "offset", cursorParam: "cursor", pageParam: "page", limitValue: 50, cursorPath: "nextCursor" };

    test("single page", async () => {
      mockFetchSequence({
        body: { data: generateDataset(3, "u"), pageInfo: { hasNextPage: false }, nextCursor: null },
      });
      const reps = await connector.fetchReps("ws", {
        baseUrl: "https://api.example.com", auth: { type: "bearer", token: "t" }, pagination: cursorPagination, responsePath: "data", ...baseEntities,
      });
      expect(reps).toHaveLength(3);
    });

    test("two pages with hasNextPage", async () => {
      mockFetchSequence(
        { body: { data: generateDataset(3, "u"), pageInfo: { hasNextPage: true }, nextCursor: "next-1" } },
        { body: { data: generateDataset(2, "u2"), pageInfo: { hasNextPage: false }, nextCursor: null } },
      );
      const reps = await connector.fetchReps("ws", {
        baseUrl: "https://api.example.com", auth: { type: "bearer", token: "t" }, pagination: cursorPagination, responsePath: "data", ...baseEntities,
      });
      expect(reps).toHaveLength(5);
    });

    test("ignores cursorPath when response has no nextCursor", async () => {
      const cp = { ...cursorPagination, cursorPath: "pagination.next" };
      mockFetchSequence({
        body: { data: generateDataset(1, "u"), pageInfo: { hasNextPage: false } },
      });
      const reps = await connector.fetchReps("ws", {
        baseUrl: "https://api.example.com", auth: { type: "bearer", token: "t" }, pagination: cp, responsePath: "data", ...baseEntities,
      });
      expect(reps).toHaveLength(1);
    });
  });

  describe("page pagination", () => {
    const pagePagination = { type: "page" as const, limitParam: "perPage", offsetParam: "offset", cursorParam: "cursor", pageParam: "page", limitValue: 50 };

    test("single page", async () => {
      mockFetchSequence({ body: generateDataset(30, "u") });
      const reps = await connector.fetchReps("ws", {
        baseUrl: "https://api.example.com", auth: { type: "bearer", token: "t" }, pagination: pagePagination, ...baseEntities,
      });
      expect(reps).toHaveLength(30);
    });

    test("multiple pages", async () => {
      mockFetchSequence(
        { body: generateDataset(50, "u") },
        { body: generateDataset(50, "u2") },
        { body: generateDataset(10, "u3") },
      );
      const reps = await connector.fetchReps("ws", {
        baseUrl: "https://api.example.com", auth: { type: "bearer", token: "t" }, pagination: pagePagination, ...baseEntities,
      });
      expect(reps).toHaveLength(110);
    });
  });

  describe("pagination edge cases", () => {
    test("offset pagination with exactly 1 record", async () => {
      const d = generateDataset(1, "u");
      mockFetchSequence({ body: d });
      const reps = await connector.fetchReps("ws", {
        baseUrl: "https://api.example.com", auth: { type: "bearer", token: "t" },
        pagination: { type: "offset", limitParam: "l", offsetParam: "o", limitValue: 50, cursorParam: "c", pageParam: "p" }, ...baseEntities,
      });
      expect(reps).toHaveLength(1);
    });

    test("offset pagination with 0 records", async () => {
      mockFetchSequence({ body: [] });
      const reps = await connector.fetchReps("ws", {
        baseUrl: "https://api.example.com", auth: { type: "bearer", token: "t" },
        pagination: { type: "offset", limitParam: "l", offsetParam: "o", limitValue: 50, cursorParam: "c", pageParam: "p" }, ...baseEntities,
      });
      expect(reps).toHaveLength(0);
    });

    test("cursor pagination — pageInfo.hasNextPage=false with results still stops", async () => {
      mockFetchSequence({
        body: { data: generateDataset(5, "u"), pageInfo: { hasNextPage: false }, nextCursor: "still-exists" },
      });
      const reps = await connector.fetchReps("ws", {
        baseUrl: "https://api.example.com", auth: { type: "bearer", token: "t" },
        pagination: { type: "cursor", limitParam: "l", offsetParam: "o", cursorParam: "c", pageParam: "p", limitValue: 10, cursorPath: "nextCursor" },
        responsePath: "data", ...baseEntities,
      });
      expect(reps).toHaveLength(5);
    });
  });
});
