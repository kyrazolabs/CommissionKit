import type { PaginationConfig } from "./config-parser";
import { jsonpathGet } from "./jsonpath";

interface PaginationState {
  offset: number;
  limit: number;
  cursor: string | null;
  page: number;
  hasMore: boolean;
}

export function createPaginationState(config: PaginationConfig): PaginationState {
  return {
    offset: 0,
    limit: config.limitValue,
    cursor: null,
    page: 1,
    hasMore: true,
  };
}

export function getPaginationParams(
  config: PaginationConfig,
  state: PaginationState,
): Record<string, string> {
  const params: Record<string, string> = {};

  switch (config.type) {
    case "offset":
      params[config.limitParam] = String(state.limit);
      params[config.offsetParam] = String(state.offset);
      break;
    case "cursor":
      params[config.limitParam] = String(state.limit);
      if (state.cursor && config.cursorParam) {
        params[config.cursorParam] = state.cursor;
      }
      break;
    case "page":
      params[config.limitParam] = String(state.limit);
      params[config.pageParam] = String(state.page);
      break;
  }

  return params;
}

export function advancePage(
  config: PaginationConfig,
  state: PaginationState,
  response: any,
  resultCount: number,
): void {
  switch (config.type) {
    case "offset":
      state.offset += state.limit;
      state.hasMore = resultCount >= state.limit;
      break;
    case "cursor":
      if (config.cursorPath) {
        state.cursor = jsonpathGet(response, config.cursorPath) || null;
        // Check hasNextPage in response if available, otherwise use result count
        const hasNextPage = jsonpathGet(response, "pageInfo.hasNextPage");
        state.hasMore = typeof hasNextPage === "boolean"
          ? hasNextPage
          : (resultCount > 0 && state.cursor !== null);
      } else {
        state.hasMore = resultCount >= state.limit;
      }
      break;
    case "page":
      state.page++;
      state.hasMore = resultCount >= state.limit;
      break;
  }
}
