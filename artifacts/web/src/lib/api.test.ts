import { describe, test, expect, mock, beforeEach } from "bun:test";

// Mock localStorage
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
};
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

const mockFetch = mock(() => Promise.resolve(new Response('{"data":"ok"}', { status: 200, headers: { "Content-Type": "application/json" } })));
globalThis.fetch = mockFetch as any;

describe("apiFetch", () => {
  beforeEach(() => {
    store["ck_active_workspace"] = "ws1";
    mockFetch.mockReset();
    mockFetch.mockResolvedValue(new Response('{"data":"ok"}', { status: 200, headers: { "Content-Type": "application/json" } }));
  });

  test("adds Content-Type and X-Workspace-ID headers", async () => {
    const { apiFetch } = await import("./api");
    await apiFetch("/api/test");

    const call = mockFetch.mock.calls[0];
    const headers = call[1].headers;
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers["x-workspace-id"]).toBe("ws1");
  });

  test("includes credentials", async () => {
    const { apiFetch } = await import("./api");
    await apiFetch("/api/test");

    const call = mockFetch.mock.calls[0];
    expect(call[1].credentials).toBe("include");
  });

  test("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } }));
    const { apiFetch } = await import("./api");
    await expect(apiFetch("/api/notfound")).rejects.toThrow("Not found");
  });

  test("returns null on 204", async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const { apiFetch } = await import("./api");
    const result = await apiFetch("/api/nocontent");
    expect(result).toBeNull();
  });
});

describe("paginatedFetch", () => {
  beforeEach(() => {
    store["ck_active_workspace"] = "ws1";
    mockFetch.mockReset();
    mockFetch.mockResolvedValue(new Response('[]', { status: 200, headers: { "Content-Type": "application/json", "X-Total-Count": "10" } }));
  });

  test("returns data array and totalCount", async () => {
    const { paginatedFetch } = await import("./api");
    const result = await paginatedFetch("/api/items");
    expect(result.data).toEqual([]);
    expect(result.totalCount).toBe(10);
  });

  test("throws on error", async () => {
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ error: "Bad request" }), { status: 400, headers: { "Content-Type": "application/json" } }));
    const { paginatedFetch } = await import("./api");
    await expect(paginatedFetch("/api/error")).rejects.toThrow("Bad request");
  });
});
