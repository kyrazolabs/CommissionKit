const HUBSPOT_API = "https://api.hubapi.com";

interface Paging {
  next?: { after?: string };
}

interface HubSpotOwner {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userId?: number;
  archived?: boolean;
}

interface HubSpotDeal {
  id: string;
  properties: Record<string, any>;
  archived?: boolean;
}

interface SearchResponse {
  total: number;
  results: HubSpotDeal[];
  paging?: Paging;
}

interface OwnersResponse {
  results: HubSpotOwner[];
  paging?: Paging;
}

interface PipelineStage {
  id: string;
  label: string;
  metadata?: { isClosed?: string };
}

interface Pipeline {
  id: string;
  label: string;
  stages: PipelineStage[];
}

interface PipelinesResponse {
  results: Pipeline[];
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export class HubSpotClient {
  private accessToken: string;
  private refreshToken: string | null;
  private clientId?: string;
  private clientSecret?: string;
  private tokenExpiresAt: number = 0;

  constructor(accessToken: string, refreshToken?: string, clientId?: string, clientSecret?: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken || null;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  private async ensureAccessToken(): Promise<void> {
    if (!this.refreshToken || !this.clientId || !this.clientSecret) return;
    if (Date.now() < this.tokenExpiresAt - 60000) return; // 1min buffer
    await this.refreshAccessToken();
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken || !this.clientId || !this.clientSecret) {
      throw new Error("Cannot refresh token: missing refresh token or client credentials");
    }
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: this.refreshToken,
    });
    const res = await fetch(`${HUBSPOT_API}/oauth/v1/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    if (!res.ok) throw new Error(`Token refresh failed: HTTP ${res.status}`);
    const data = (await res.json()) as TokenResponse;
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
  }

  static async exchangeCode(clientId: string, clientSecret: string, redirectUri: string, code: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    });
    const res = await fetch(`${HUBSPOT_API}/oauth/v1/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    if (!res.ok) throw new Error(`OAuth code exchange failed: HTTP ${res.status}`);
    const data = (await res.json()) as TokenResponse;
    return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in };
  }

  async getOwners(): Promise<HubSpotOwner[]> {
    await this.ensureAccessToken();
    const owners: HubSpotOwner[] = [];
    let after: string | undefined;
    do {
      const url = `${HUBSPOT_API}/crm/v3/owners?limit=100${after ? `&after=${after}` : ""}`;
      const res = await this.get<OwnersResponse>(url);
      if (!res.results) break;
      owners.push(...res.results);
      after = res.paging?.next?.after;
    } while (after);
    return owners.filter((o) => !o.archived);
  }

  async getDeals(
    closedWonStageIds?: string[],
    modifiedAfter?: Date,
  ): Promise<HubSpotDeal[]> {
    await this.ensureAccessToken();
    const filterGroups: any[] = [];
    const filters: any[] = [];

    if (closedWonStageIds && closedWonStageIds.length > 0) {
      filters.push({
        propertyName: "dealstage",
        operator: "IN",
        values: closedWonStageIds,
      });
    }

    if (modifiedAfter) {
      filters.push({
        propertyName: "hs_lastmodifieddate",
        operator: "GTE",
        values: [modifiedAfter.toISOString()],
      });
    }

    if (filters.length > 0) {
      filterGroups.push({ filters });
    }

    const properties = [
      "dealname", "amount", "closedate", "dealstage",
      "hubspot_owner_id", "description", "pipeline",
      "deal_currency_code", "hs_lastmodifieddate",
    ];

    const deals: HubSpotDeal[] = [];
    let after: string | undefined;

    do {
      const body: any = { properties, limit: 100 };
      if (filterGroups.length > 0) body.filterGroups = filterGroups;
      if (after) body.after = after;

      const res = await this.post<SearchResponse>(`${HUBSPOT_API}/crm/v3/objects/deals/search`, body);
      if (!res.results) break;
      deals.push(...res.results);
      after = res.paging?.next?.after;
    } while (after);

    return deals.filter((d) => !d.archived);
  }

  async getPipelines(): Promise<Pipeline[]> {
    await this.ensureAccessToken();
    const url = `${HUBSPOT_API}/crm/v3/pipelines/deals?limit=100`;
    const res = await this.get<PipelinesResponse>(url);
    return res?.results || [];
  }

  private async get<T>(url: string): Promise<T> {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (res.status === 401 && this.refreshToken) {
      await this.refreshAccessToken();
      return this.get<T>(url);
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HubSpot HTTP ${res.status}: ${text.slice(0, 500)}`);
    }

    return res.json() as Promise<T>;
  }

  private async post<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.status === 401 && this.refreshToken) {
      await this.refreshAccessToken();
      return this.post<T>(url, body);
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HubSpot HTTP ${res.status}: ${text.slice(0, 500)}`);
    }

    return res.json() as Promise<T>;
  }
}
