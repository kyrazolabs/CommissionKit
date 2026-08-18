import { mock } from "bun:test";

export const originalFetch = globalThis.fetch;

// ─── Mock helpers ────────────────────────────────────────────────────

// NOTE: Do NOT use mock() from bun:test for globalThis.fetch — it hangs the test runner.
// Use plain functions instead.

export function mockFetchSingle(body: any, status = 200) {
  globalThis.fetch = (async (_url: string | URL | Request, _init?: RequestInit) => {
    const responseBody = typeof body === "string" ? body : JSON.stringify(body);
    return new Response(responseBody, { status, headers: { "Content-Type": "application/json" } });
  }) as any;
}

export function mockFetchSequence(...responses: Array<{ status?: number; body: any }>) {
  let call = 0;
  globalThis.fetch = (async (_url: string | URL | Request, _init?: RequestInit) => {
    const r = responses[call] || responses[responses.length - 1];
    call++;
    const responseBody = typeof r.body === "string" ? r.body : JSON.stringify(r.body);
    return new Response(responseBody, {
      status: r.status ?? 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as any;
  return {
    getCallCount: () => call,
  };
}

export function mockFetchInspect() {
  let capturedUrl = "";
  let capturedMethod = "";
  let capturedHeaders: Record<string, string> = {};
  let capturedBody: string | null = null;
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    capturedUrl = String(url);
    capturedMethod = init?.method || "GET";
    capturedHeaders = (init?.headers as Record<string, string>) || {};
    capturedBody = init?.body ? String(init.body) : null;
    return new Response("{}", { headers: { "Content-Type": "application/json" } });
  }) as any;
  return {
    get url() {
      return capturedUrl;
    },
    get method() {
      return capturedMethod;
    },
    get headers() {
      return capturedHeaders;
    },
    get body() {
      return capturedBody;
    },
  };
}

// ─── Shared sample data ──────────────────────────────────────────────

// Twenty-style nested GraphQL response for reps
export const SAMPLE_MEMBERS = {
  data: {
    workspaceMembers: {
      edges: [
        {
          node: {
            id: "member-1",
            name: { firstName: "Abdullah", lastName: "Alotaibi" },
            userEmail: "abdullah@example.com",
          },
        },
        {
          node: {
            id: "member-2",
            name: { firstName: "Sarah", lastName: "Jones" },
            userEmail: "sarah@example.com",
          },
        },
        {
          node: {
            id: "member-3",
            name: { firstName: "Mike", lastName: "Chen" },
            userEmail: "mike@example.com",
          },
        },
      ],
      pageInfo: { hasNextPage: false, endCursor: null },
    },
  },
};

// Twenty-style nested GraphQL response for deals
export const SAMPLE_OPPORTUNITIES = {
  data: {
    opportunities: {
      edges: [
        {
          node: {
            id: "deal-1",
            name: "Enterprise Plan — Acme Corp",
            amount: { amountMicros: 999000000 },
            closeDate: "2024-03-15T00:00:00.000Z",
            stage: "closed_won",
            createdBy: { workspaceMemberId: "member-1" },
            currencyCode: "USD",
          },
        },
        {
          node: {
            id: "deal-2",
            name: "Starter Plan — Beta Inc",
            amount: { amountMicros: 49000000 },
            closeDate: "2024-05-20T00:00:00.000Z",
            stage: "pending",
            createdBy: { workspaceMemberId: "member-2" },
            currencyCode: "EUR",
          },
        },
        {
          node: {
            id: "deal-3",
            name: "Pro Plan — Gamma LLC",
            amount: { amountMicros: 149000000 },
            closeDate: "2024-02-01T00:00:00.000Z",
            stage: "closed_lost",
            createdBy: { workspaceMemberId: "member-3" },
            currencyCode: "USD",
          },
        },
      ],
      pageInfo: { hasNextPage: false, endCursor: null },
    },
  },
};

// Flat array responses
export const FLAT_DEALS = [
  {
    id: "flat-1",
    dealName: "Widget Sale",
    totalAmount: 5000,
    closedAt: "2024-06-01T00:00:00.000Z",
    dealStage: "closed_won",
    salesRepId: "rep-1",
    currencyCode: "USD",
    paymentState: "paid",
  },
  {
    id: "flat-2",
    dealName: "Widget Sale 2",
    totalAmount: 7500,
    closedAt: "2024-06-10T00:00:00.000Z",
    dealStage: "pending",
    salesRepId: "rep-2",
    currencyCode: "EUR",
    paymentState: "outstanding",
  },
];

export const FLAT_REPS = [
  { id: "r1", fullName: "Alice Johnson", emailAddr: "alice@example.com", role: "manager" },
  { id: "r2", fullName: "Bob Smith", emailAddr: "bob@example.com", role: "rep" },
];

// Pagination helpers
export function generateDataset(count: number, prefix = "item") {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${i}`,
    name: `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} ${i}`,
    amount: i * 100,
  }));
}

export function makePaginatedPages<T>(data: T[], pageSize: number): Array<{ body: any }> {
  const pages: Array<{ body: any }> = [];
  const totalPages = Math.ceil(data.length / pageSize);
  for (let i = 0; i < totalPages; i++) {
    const chunk = data.slice(i * pageSize, (i + 1) * pageSize);
    pages.push({
      body: {
        data: chunk,
        pageInfo: {
          hasNextPage: i < totalPages - 1,
          nextCursor: i < totalPages - 1 ? `cursor-${i + 1}` : null,
        },
        totalCount: data.length,
      },
    });
  }
  return pages;
}

// Base configs for tests
export function bearerConfig(entities?: any): any {
  return {
    baseUrl: "https://api.example.com",
    auth: { type: "bearer", token: "test-token" },
    ...entities,
  };
}

export function apiKeyConfig(headerName: string, apiKey: string, entities?: any): any {
  return {
    baseUrl: "https://api.example.com",
    auth: { type: "apiKey", headerName, apiKey },
    ...entities,
  };
}
