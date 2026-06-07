interface JsonRpcResponse {
  jsonrpc: string;
  id: number;
  result?: any;
  error?: { code: number; message: string; data?: any };
}

export class OdooClient {
  private baseUrl: string;
  private database: string;
  private uid: number | null = null;
  private apiKey: string = "";
  private id = 0;

  constructor(baseUrl: string, database: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.database = database;
  }

  async authenticate(username: string, apiKey: string): Promise<number> {
    this.apiKey = apiKey;

    const result = await this.jsonRpc<number>(
      `${this.baseUrl}/jsonrpc`,
      "common",
      "authenticate",
      [this.database, username, apiKey, {}],
    );
    this.uid = result;
    return result;
  }

  async searchRead(
    model: string,
    domain: any[],
    fields: string[],
    limit?: number,
    offset?: number,
  ): Promise<any[]> {
    this.ensureAuth();

    const kwargs: any = {
      fields,
      context: {},
    };

    if (limit !== undefined) kwargs.limit = limit;
    if (offset !== undefined) kwargs.offset = offset;

    const result = await this.jsonRpc<any[]>(
      `${this.baseUrl}/jsonrpc`,
      "object",
      "execute_kw",
      [this.database, this.uid, this.apiKey, model, "search_read", [domain], kwargs],
    );

    return result;
  }

  async searchCount(model: string, domain: any[]): Promise<number> {
    this.ensureAuth();

    const result = await this.jsonRpc<number>(
      `${this.baseUrl}/jsonrpc`,
      "object",
      "execute_kw",
      [this.database, this.uid, this.apiKey, model, "search_count", [domain]],
    );

    return result;
  }

  async write(model: string, ids: number[], values: Record<string, unknown>): Promise<boolean> {
    this.ensureAuth();

    const result = await this.jsonRpc<boolean>(
      `${this.baseUrl}/jsonrpc`,
      "object",
      "execute_kw",
      [this.database, this.uid, this.apiKey, model, "write", [ids, values]],
    );

    return result;
  }

  async create(model: string, values: Record<string, unknown>): Promise<number> {
    this.ensureAuth();

    const result = await this.jsonRpc<number>(
      `${this.baseUrl}/jsonrpc`,
      "object",
      "execute_kw",
      [this.database, this.uid, this.apiKey, model, "create", [values]],
    );

    return result;
  }

  private ensureAuth(): void {
    if (this.uid === null || !this.apiKey) {
      throw new Error("Not authenticated — call authenticate() first");
    }
  }

  private async jsonRpc<T>(url: string, service: string, method: string, args: any[]): Promise<T> {
    const body = {
      jsonrpc: "2.0",
      method: "call",
      params: { service, method, args },
      id: ++this.id,
    };

    // Extract model name for error context
    const model = args[3] || "unknown";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Odoo HTTP ${response.status} on ${service}.${method}/${model}: ${text.slice(0, 500)}`);
    }

    const data = (await response.json()) as JsonRpcResponse;

    if (data.error) {
      const detail = data.error.data
        ? (typeof data.error.data === "string" ? data.error.data : JSON.stringify(data.error.data).slice(0, 300))
        : "(no detail)";
      throw new Error(`Odoo ${service}.${method}/${model}: ${data.error.message} (code ${data.error.code}) — ${detail}`);
    }

    return data.result as T;
  }
}
