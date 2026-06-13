export class SalesforceClient {
  private accessToken: string;
  private instanceUrl: string;

  constructor(accessToken: string, instanceUrl: string) {
    this.accessToken = accessToken;
    this.instanceUrl = instanceUrl.replace(/\/+$/, "");
  }

  /** OAuth 2.0 — supports Client Credentials (M2M) and Username-Password flows */
  static async authenticate(
    instanceUrl: string,
    clientId: string,
    clientSecret: string,
    username?: string,
    password?: string,
    securityToken?: string,
  ): Promise<{ accessToken: string; instanceUrl: string }> {
    const baseUrl = instanceUrl.replace(/\/+$/, "");
    const isSandbox = instanceUrl.includes("test.salesforce.com")
      || instanceUrl.includes("salesforce-setup.com")
      || instanceUrl.includes("lightning.force.com")
      || instanceUrl.includes("sandbox");

    // Try org domain first, then login/test.salesforce.com
    const tokenUrls = [
      `${baseUrl}/services/oauth2/token`,
      ...(isSandbox
        ? [`https://test.salesforce.com/services/oauth2/token`]
        : [`https://login.salesforce.com/services/oauth2/token`]),
    ];

    // Client Credentials flow (External Client App / M2M)
    if (!username || !password) {
      const body = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      });
      let lastError: any;
      for (const tokenUrl of tokenUrls) {
        try {
          const res = await fetch(tokenUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: body.toString(),
          });
          if (res.ok) {
            const data = (await res.json()) as any;
            return { accessToken: data.access_token, instanceUrl: data.instance_url || instanceUrl };
          }
          const text = await res.text().catch(() => "");
          lastError = new Error(`Salesforce OAuth failed: HTTP ${res.status} — ${text.slice(0, 200)}`);
        } catch (err: any) {
          lastError = err;
        }
      }
      throw lastError || new Error("Salesforce OAuth failed on all endpoints");
    }

    // Username-Password flow
    const pass = securityToken ? `${password}${securityToken}` : password;
    const body = new URLSearchParams({
      grant_type: "password",
      client_id: clientId,
      client_secret: clientSecret,
      username,
      password: pass,
    });
    let lastError: any;
    for (const tokenUrl of tokenUrls) {
      try {
        const res = await fetch(tokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString(),
        });
        if (res.ok) {
          const data = (await res.json()) as any;
          return { accessToken: data.access_token, instanceUrl: data.instance_url || instanceUrl };
        }
        const text = await res.text().catch(() => "");
        lastError = new Error(`Salesforce OAuth failed: HTTP ${res.status} — ${text.slice(0, 200)}`);
      } catch (err: any) {
        lastError = err;
      }
    }
    throw lastError || new Error("Salesforce OAuth failed on all endpoints");
  }

  /** Execute a SOQL query with automatic cursor pagination */
  async query(soql: string): Promise<any[]> {
    const records: any[] = [];
    let url: string | null = `${this.instanceUrl}/services/data/v58.0/query/?q=${encodeURIComponent(soql)}`;

    while (url) {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Salesforce HTTP ${res.status}: ${text.slice(0, 500)}`);
      }

      const data = (await res.json()) as { records?: any[]; done: boolean; nextRecordsUrl?: string };
      if (!data.records) break;
      records.push(...data.records);

      if (data.done) break;
      url = data.nextRecordsUrl
        ? `${this.instanceUrl}${data.nextRecordsUrl}`
        : null;
    }

    return records;
  }
}
