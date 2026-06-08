type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface HttpClientOptions {
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  maxConcurrent?: number;
}

const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

export class PluginHttpClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private options: Required<HttpClientOptions>;
  private pending = 0;

  constructor(
    baseUrl: string,
    defaultHeaders: Record<string, string>,
    options?: HttpClientOptions,
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.defaultHeaders = defaultHeaders;
    this.options = {
      timeout: options?.timeout ?? 30_000,
      maxRetries: options?.maxRetries ?? 3,
      retryDelay: options?.retryDelay ?? 1_000,
      maxConcurrent: options?.maxConcurrent ?? 5,
    };
  }

  private async waitForSlot(): Promise<void> {
    while (this.pending >= this.options.maxConcurrent) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    const url = `${this.baseUrl}${path}`;
    if (!params || Object.keys(params).length === 0) return url;
    const qs = new URLSearchParams(params).toString();
    return `${url}?${qs}`;
  }

  private async request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    params?: Record<string, string>,
  ): Promise<T> {
    await this.waitForSlot();
    this.pending++;

    try {
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
        try {
          const headers: Record<string, string> = {
            ...this.defaultHeaders,
            "Accept": "application/json",
          };

          if (body !== undefined && method !== "GET") {
            headers["Content-Type"] = "application/json";
          }

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

          const response = await fetch(this.buildUrl(path, params), {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text().catch(() => "");
            const isRetryable = RETRYABLE_STATUSES.has(response.status) ||
              response.status === 403; // Rate limits may return 403 in some APIs

            if (isRetryable && attempt < this.options.maxRetries) {
              const delay = this.options.retryDelay * Math.pow(2, attempt);
              console.warn(`[PluginHttpClient] ${method} ${path} → ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1})`);
              await new Promise((resolve) => setTimeout(resolve, delay));
              lastError = new Error(`HTTP ${response.status}: ${errorText}`);
              continue;
            }

            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          const text = await response.text();
          if (!text) return undefined as T;
          return JSON.parse(text) as T;
        } catch (err: any) {
          if (err.name === "AbortError") {
            throw new Error(`Request timeout after ${this.options.timeout}ms`);
          }
          if (attempt >= this.options.maxRetries) throw err;
          lastError = err;
          const delay = this.options.retryDelay * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      throw lastError || new Error("Request failed");
    } finally {
      this.pending--;
    }
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>("GET", path, undefined, params);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }
}
