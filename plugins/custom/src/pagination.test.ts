import { describe, test, expect } from "bun:test";
import { createPaginationState, getPaginationParams, advancePage } from "./pagination";
import type { PaginationConfig } from "./config-parser";

describe("pagination", () => {
  const baseConfig: PaginationConfig = {
    type: "offset",
    limitParam: "limit",
    offsetParam: "offset",
    cursorParam: "cursor",
    pageParam: "page",
    limitValue: 20,
  };

  test("createPaginationState initializes with offset 0, page 1, hasMore true", () => {
    const state = createPaginationState(baseConfig);
    expect(state.offset).toBe(0);
    expect(state.page).toBe(1);
    expect(state.cursor).toBeNull();
    expect(state.hasMore).toBe(true);
  });

  describe("offset pagination", () => {
    test("generates limit and offset params", () => {
      const state = createPaginationState(baseConfig);
      const params = getPaginationParams(baseConfig, state);
      expect(params).toEqual({ limit: "20", offset: "0" });
    });

    test("advancePage increments offset and sets hasMore based on count", () => {
      const state = createPaginationState(baseConfig);
      advancePage(baseConfig, state, {}, 20);
      expect(state.offset).toBe(20);
      expect(state.hasMore).toBe(true);

      advancePage(baseConfig, state, {}, 5);
      expect(state.offset).toBe(40);
      expect(state.hasMore).toBe(false);
    });
  });

  describe("cursor pagination", () => {
    const cursorConfig: PaginationConfig = {
      type: "cursor",
      limitParam: "limit",
      offsetParam: "offset",
      cursorParam: "cursor",
      pageParam: "page",
      limitValue: 10,
      cursorPath: "nextCursor",
    };

    test("generates cursor params when cursor is present", () => {
      const state = createPaginationState(cursorConfig);
      state.cursor = "abc123";
      const params = getPaginationParams(cursorConfig, state);
      expect(params).toEqual({ limit: "10", cursor: "abc123" });
    });

    test("skips cursor param when cursor is null", () => {
      const state = createPaginationState(cursorConfig);
      const params = getPaginationParams(cursorConfig, state);
      expect(params).toEqual({ limit: "10" });
    });

    test("advancePage reads cursor from cursorPath", () => {
      const state = createPaginationState(cursorConfig);
      advancePage(cursorConfig, state, { nextCursor: "def456" }, 10);
      expect(state.cursor).toBe("def456");
      expect(state.hasMore).toBe(true);
    });

    test("advancePage uses pageInfo.hasNextPage when available", () => {
      const state = createPaginationState(cursorConfig);
      advancePage(cursorConfig, state, { nextCursor: "xyz", pageInfo: { hasNextPage: false } }, 10);
      expect(state.hasMore).toBe(false);
    });

    test("advancePage pageInfo.hasNextPage=true overrides result count", () => {
      const state = createPaginationState(cursorConfig);
      advancePage(cursorConfig, state, { nextCursor: "xyz", pageInfo: { hasNextPage: true } }, 0);
      expect(state.hasMore).toBe(true);
    });
  });

  describe("page pagination", () => {
    test("generates page params", () => {
      const config: PaginationConfig = {
        type: "page",
        limitParam: "limit",
        offsetParam: "offset",
        cursorParam: "cursor",
        pageParam: "page",
        limitValue: 50,
      };
      const state = createPaginationState(config);
      const params = getPaginationParams(config, state);
      expect(params).toEqual({ limit: "50", page: "1" });
    });

    test("advancePage increments page number", () => {
      const config: PaginationConfig = {
        type: "page",
        limitParam: "limit",
        offsetParam: "offset",
        cursorParam: "cursor",
        pageParam: "page",
        limitValue: 50,
      };
      const state = createPaginationState(config);
      advancePage(config, state, {}, 50);
      expect(state.page).toBe(2);
      expect(state.hasMore).toBe(true);

      advancePage(config, state, {}, 10);
      expect(state.page).toBe(3);
      expect(state.hasMore).toBe(false);
    });
  });
});
