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
  private id = 0;

  constructor(baseUrl: string, database: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.database = database;
  }

  async authenticate(username: string, apiKey: string): Promise<number> {
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
    if (this.uid === null) throw new Error("Not authenticated");

    const params: any = {
      model,
      domain,
      fields,
      context: {},
    };

    if (limit !== undefined) params.limit = limit;
    if (offset !== undefined) params.offset = offset;

    const result = await this.jsonRpc<any[]>(
      `${this.baseUrl}/jsonrpc`,
      "object",
      "execute_kw",
      [this.database, this.uid, apiKeyPlaceholder, model, "search_read", [domain], params],
    );

    return result;
  }

  async searchCount(model: string, domain: any[]): Promise<number> {
    if (this.uid === null) throw new Error("Not authenticated");

    const result = await this.jsonRpc<number>(
      `${this.baseUrl}/jsonrpc`,
      "object",
      "execute_kw",
      [this.database, this.uid, apiKeyPlaceholder, model, "search_count", [domain]],
    );

    return result;
  }

  async write(model: string, ids: number[], values: Record<string, unknown>): Promise<boolean> {
    if (this.uid === null) throw new Error("Not authenticated");

    const result = await this.jsonRpc<boolean>(
      `${this.baseUrl}/jsonrpc`,
      "object",
      "execute_kw",
      [this.database, this.uid, apiKeyPlaceholder, model, "write", [ids, values]],
    );

    return result;
  }

  async create(model: string, values: Record<string, unknown>): Promise<number> {
    if (this.uid === null) throw new Error("Not authenticated");

    const result = await this.jsonRpc<number>(
      `${this.baseUrl}/jsonrpc`,
      "object",
      "execute_kw",
      [this.database, this.uid, apiKeyPlaceholder, model, "create", [values]],
    );

    return result;
  }

  private async jsonRpc<T>(url: string, service: string, method: string, args: any[]): Promise<T> {
    const body = {
      jsonrpc: "2.0",
      method: "call",
      params: { service, method, args },
      id: ++this.id,
    };

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
      throw new Error(`Odoo HTTP ${response.status}: ${text}`);
    }

    const data = (await response.json()) as JsonRpcResponse;

    if (data.error) {
      throw new Error(`Odoo RPC error: ${data.error.message} (${data.error.code})`);
    }

    return data.result as T;
  }
}

// Odoo's execute_kw uses the API key here
const apiKeyPlaceholder = "";
