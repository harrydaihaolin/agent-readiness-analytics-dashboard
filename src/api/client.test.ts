import { describe, expect, it, vi } from "vitest";
import { AnalyticsApiError, AnalyticsClient } from "./client";

function makeClient(handler: (url: string, init?: RequestInit) => Response) {
  const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) =>
    handler(String(input), init),
  );
  return {
    client: new AnalyticsClient({
      baseUrl: "http://api.test",
      token: "tok",
      fetcher: fetcher as unknown as typeof fetch,
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
});
