import { describe, expect, it, vi } from "vitest";
import { AnalyticsApiError, AnalyticsClient } from "./client";

function makeClient(
  handler: (url: string, init?: RequestInit) => Response,
  opts: { static?: boolean; baseUrl?: string } = {},
) {
  const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) =>
    handler(String(input), init),
  );
  return {
    client: new AnalyticsClient({
      baseUrl: opts.baseUrl ?? "http://api.test",
      token: "tok",
      fetcher: fetcher as unknown as typeof fetch,
      static: opts.static ?? false,
    }),
    fetcher,
  };
}

describe("AnalyticsClient", () => {
  it("sends bearer token on every request", async () => {
    const { client, fetcher } = makeClient(() =>
      new Response(JSON.stringify({ items: [], tenant_id: "x", generated_at: "" })),
    );
    await client.recommendations("acme");
    const init = fetcher.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
  });

  it("url-encodes tenant and repo", async () => {
    const { client, fetcher } = makeClient(() =>
      new Response(
        JSON.stringify({
          repo: "x",
          points: [],
          score_delta: 0,
          delta_window_days: 30,
          optimization_events: [],
        }),
      ),
    );
    await client.trend("acme co", "owner/repo name");
    expect(fetcher.mock.calls[0][0]).toBe(
      "http://api.test/tenants/acme%20co/repos/owner%2Frepo%20name/trend?window_days=30",
    );
  });

  it("throws AnalyticsApiError on non-ok responses", async () => {
    const { client } = makeClient(() => new Response("nope", { status: 401 }));
    await expect(client.overview("acme")).rejects.toBeInstanceOf(AnalyticsApiError);
    await expect(client.overview("acme")).rejects.toMatchObject({ status: 401 });
  });

  it("static-mode: double-encodes the repo segment so on-disk %2F survives the HTTP decode", async () => {
    const seen: string[] = [];
    const { client } = makeClient(
      (url) => {
        seen.push(url);
        return new Response(
          JSON.stringify({
            repo: "x",
            points: [],
            score_delta: 0,
            delta_window_days: 30,
            optimization_events: [],
          }),
        );
      },
      { static: true, baseUrl: "/data" },
    );
    await client.trend(
      "agent-readiness-project",
      "agent-readiness/agent-readiness-analytics",
    );
    await client.repoRecommendations(
      "agent-readiness-project",
      "agent-readiness/agent-readiness-analytics",
    );
    // Tenant only contains URL-safe characters, so single-encoded.
    // Repo contains `/`, must appear as `%252F` in URL so HTTP decode -> `%2F`
    // which matches the literal directory name on disk.
    expect(seen[0]).toBe(
      "/data/tenants/agent-readiness-project/repos/agent-readiness%252Fagent-readiness-analytics/trend.json",
    );
    expect(seen[1]).toBe(
      "/data/tenants/agent-readiness-project/repos/agent-readiness%252Fagent-readiness-analytics/recommendations.json",
    );
  });

  it("never surfaces a raw HTML body as an error message (sanitises 404 SPA fallbacks)", async () => {
    const fallbackHtml = `<!DOCTYPE html><html><head><script>location.replace('/x/#/y');</script></head><body><p>Redirecting…</p></body></html>`;
    const { client } = makeClient(() =>
      new Response(fallbackHtml, {
        status: 404,
        headers: { "content-type": "text/html" },
      }),
    );
    let err: AnalyticsApiError | null = null;
    try {
      await client.overview("acme");
    } catch (e) {
      err = e as AnalyticsApiError;
    }
    expect(err).toBeInstanceOf(AnalyticsApiError);
    expect(err!.status).toBe(404);
    expect(err!.message).not.toContain("<");
    expect(err!.message).not.toContain("DOCTYPE");
    expect(err!.message).not.toContain("script");
    expect(err!.message).toMatch(/^HTTP 404\b/);
  });

  it("rejects 200 responses that smuggle HTML in place of JSON", async () => {
    const html = `<!DOCTYPE html><html><body>oops</body></html>`;
    const { client } = makeClient(
      () =>
        new Response(html, {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
    );
    let err: AnalyticsApiError | null = null;
    try {
      await client.overview("acme");
    } catch (e) {
      err = e as AnalyticsApiError;
    }
    expect(err).toBeInstanceOf(AnalyticsApiError);
    expect(err!.status).toBe(502);
    expect(err!.message).toMatch(/Expected JSON/);
    expect(err!.message).not.toContain("<");
  });
});
