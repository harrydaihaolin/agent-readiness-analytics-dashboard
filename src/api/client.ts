// HTTP client for the agent-readiness-analytics API.
// All non-/healthz routes require Authorization: Bearer <token>.
//
// Static mode: when configured with `static: true`, the client reads from
// pre-exported JSON files (rooted at `baseUrl`) instead of the live API.
// Used by the GitHub Pages demo build — see `bin/export-static.py` in the
// analytics repo.

import type {
  RepoListPage,
  RepoTrend,
  ScanJob,
  TenantOverview,
  TenantRecommendations,
} from "@/types";

export class AnalyticsApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "AnalyticsApiError";
  }
}

/**
 * Static-mode: the on-disk export tool encodes `/` in repo names as `%2F`
 * in the directory NAME (e.g. `agent-readiness%2Fagent-readiness-analytics`).
 * GitHub Pages URL-decodes the request once, so we must double-encode the
 * segment in our request URL — otherwise the server looks for a nested
 * directory that doesn't exist, returns 404 + the SPA fallback HTML, and
 * the dashboard renders that HTML as an error message.
 */
function encodeStaticSegment(value: string): string {
  return encodeURIComponent(encodeURIComponent(value));
}

/**
 * Strip / shorten error response bodies before they reach the UI. HTTP servers
 * often respond with HTML (e.g. an SPA 404 fallback) on errors; surfacing the
 * raw body in the page is both ugly and a small XSS risk if a renderer ever
 * forgets to escape. Detect HTML / overly-long / non-text bodies and replace
 * with a concise summary that includes the status.
 */
function summarizeErrorBody(status: number, statusText: string, body: string): string {
  const trimmed = body.trim();
  const looksLikeHtml = /^<!doctype\b|^<html\b/i.test(trimmed) || /<\/?[a-z][^>]*>/i.test(trimmed);
  if (!trimmed || looksLikeHtml || trimmed.length > 200) {
    return statusText ? `HTTP ${status} ${statusText}` : `HTTP ${status}`;
  }
  return trimmed;
}

export interface AnalyticsClientConfig {
  baseUrl?: string;
  token: string;
  fetcher?: typeof fetch;
  /** When true, treat baseUrl as a static-JSON root and skip auth headers. */
  static?: boolean;
}

export class AnalyticsClient {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly fetcher: typeof fetch;
  private readonly staticMode: boolean;

  constructor(cfg: AnalyticsClientConfig) {
    this.baseUrl = (cfg.baseUrl ?? "/api").replace(/\/$/, "");
    this.token = cfg.token;
    this.fetcher = cfg.fetcher ?? fetch.bind(globalThis);
    this.staticMode = cfg.static ?? false;
  }

  private async req<T>(path: string, init: RequestInit = {}): Promise<T> {
    if (this.staticMode && init.method && init.method.toUpperCase() !== "GET") {
      throw new AnalyticsApiError(
        405,
        "static-mode demo cannot mutate state — sign in with a live API for scans.",
      );
    }
    const url = this.staticMode
      ? `${this.baseUrl}${path.split("?")[0].replace(/\/$/, "")}.json`
      : `${this.baseUrl}${path}`;
    const headers = this.staticMode
      ? { "Content-Type": "application/json", ...(init.headers ?? {}) }
      : {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
          ...(init.headers ?? {}),
        };
    const res = await this.fetcher(url, {
      ...(this.staticMode ? { method: "GET" } : init),
      headers,
    });
    if (!res.ok) {
      const body = await res.text();
      throw new AnalyticsApiError(
        res.status,
        summarizeErrorBody(res.status, res.statusText, body),
      );
    }
    // Defensive: if a server returns HTML on a 200 (e.g. an SPA 404 fallback
    // misconfigured to also intercept .json), refuse to parse it as JSON.
    const contentType = res.headers.get("content-type") ?? "";
    const text = await res.text();
    if (contentType && !/\bjson\b/i.test(contentType) && /^\s*<!doctype\b|^\s*<html\b/i.test(text)) {
      throw new AnalyticsApiError(
        502,
        `Expected JSON from ${url} but got ${contentType.split(";")[0] || "HTML"}`,
      );
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new AnalyticsApiError(502, `Invalid JSON from ${url}`);
    }
  }

  overview(tenantId: string): Promise<TenantOverview> {
    return this.req(`/tenants/${encodeURIComponent(tenantId)}/overview`);
  }

  recommendations(tenantId: string, limit = 10): Promise<TenantRecommendations> {
    return this.req(
      `/tenants/${encodeURIComponent(tenantId)}/recommendations?limit=${limit}`,
    );
  }

  repoRecommendations(
    tenantId: string,
    repo: string,
    limit = 50,
  ): Promise<TenantRecommendations> {
    if (this.staticMode) {
      // Static-mode demo: per-repo files live under
      // /tenants/<id>/repos/<encoded-repo>/recommendations.json — the export
      // tool encodes `/` as `%2F` in the directory name on disk, so we must
      // double-encode here to survive the HTTP decode.
      return this.req(
        `/tenants/${encodeURIComponent(tenantId)}/repos/${encodeStaticSegment(repo)}/recommendations`,
      );
    }
    const params = new URLSearchParams({
      repo,
      limit: String(limit),
    });
    return this.req(
      `/tenants/${encodeURIComponent(tenantId)}/repo-recommendations?${params.toString()}`,
    );
  }

  trend(tenantId: string, repo: string, windowDays = 30): Promise<RepoTrend> {
    const encodedRepo = this.staticMode
      ? encodeStaticSegment(repo)
      : encodeURIComponent(repo);
    const path = `/tenants/${encodeURIComponent(tenantId)}/repos/${encodedRepo}/trend`;
    return this.req(this.staticMode ? path : `${path}?window_days=${windowDays}`);
  }

  recordOptimization(
    tenantId: string,
    repo: string,
    label: string,
  ): Promise<{ accepted: boolean; event_id: number }> {
    return this.req(
      `/tenants/${encodeURIComponent(tenantId)}/repos/${encodeURIComponent(
        repo,
      )}/optimizations`,
      { method: "POST", body: JSON.stringify({ label }) },
    );
  }

  async listRepos(
    tenantId: string,
    opts: { page?: number; size?: number; q?: string } = {},
  ): Promise<RepoListPage> {
    const page = opts.page ?? 1;
    const size = opts.size ?? 25;
    const q = opts.q;
    if (this.staticMode) {
      const full = await this.req<RepoListPage>(
        `/tenants/${encodeURIComponent(tenantId)}/repos`,
      );
      const filtered = q
        ? full.items.filter((r) =>
            r.repo.toLowerCase().includes(q.toLowerCase()),
          )
        : full.items;
      const start = (page - 1) * size;
      return {
        ...full,
        page,
        size,
        total: filtered.length,
        items: filtered.slice(start, start + size),
        query: q ?? null,
      };
    }
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("size", String(size));
    if (q) p.set("q", q);
    return this.req(
      `/tenants/${encodeURIComponent(tenantId)}/repos?${p.toString()}`,
    );
  }

  scanRepo(tenantId: string, repo: string): Promise<ScanJob> {
    return this.req(
      `/tenants/${encodeURIComponent(tenantId)}/repos/${encodeURIComponent(
        repo,
      )}/scan`,
      { method: "POST", body: JSON.stringify({}) },
    );
  }

  scanBatch(tenantId: string, repos?: string[]): Promise<ScanJob> {
    return this.req(`/tenants/${encodeURIComponent(tenantId)}/scans/batch`, {
      method: "POST",
      body: JSON.stringify({ repos: repos ?? null }),
    });
  }

  async ping(): Promise<boolean> {
    try {
      const path = this.staticMode
        ? `${this.baseUrl}/healthz.json`
        : `${this.baseUrl}/healthz`;
      const r = await this.fetcher(path);
      return r.ok;
    } catch {
      return false;
    }
  }
}
