/**
 * End-to-end-ish test for the static GitHub Pages build:
 * mounts the same provider tree as `main.tsx`, fakes the JSON tree
 * with a global fetch stub, and asserts that the control panel actually
 * renders content (not just the header).
 *
 * This catches regressions like passing the deploy prefix as
 * `HashRouter`'s basename — the header still renders, but no route
 * matches and the body silently goes blank.
 */
import { render, screen, waitFor } from "@testing-library/react";
import { HashRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { AnalyticsProvider } from "./api/context";
import { SessionProvider } from "./api/session";

const OVERVIEW = {
  tenant_id: "agent-readiness-project",
  tier: "platinum",
  repo_count: 1,
  overall_score: 97.5,
  grade: "S",
  pillars: { cognitive_load: 98, feedback: 97, flow: 96, safety: 100 },
  weakest_pillar: "flow",
  strongest_pillar: "safety",
  readiness_score: 98,
  dora_score: 97,
  repos: [
    {
      repo: "owner/repo",
      overall_score: 97,
      grade: "S",
      pillars: { cognitive_load: 98, feedback: 97, flow: 96, safety: 100 },
      top_findings: [],
    },
  ],
  generated_at: "2026-05-01T17:00:00Z",
};

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/data/healthz.json")) {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      if (url.endsWith("/data/tenants/agent-readiness-project/overview.json")) {
        return new Response(JSON.stringify(OVERVIEW), { status: 200 });
      }
      return new Response("not found", { status: 404 });
    }),
  );
  window.location.hash = "/";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("static-mode bootstrap (HashRouter)", () => {
  it("renders the control panel for the seeded tenant on hash root", async () => {
    render(
      <HashRouter>
        <SessionProvider
          baseUrl="/agent-readiness-analytics-dashboard/data"
          initial={{ tenantId: "agent-readiness-project", token: "static" }}
          staticMode
        >
          <AnalyticsProvider>
            <App />
          </AnalyticsProvider>
        </SessionProvider>
      </HashRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Overall score")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("heading", { level: 1, name: "agent-readiness-project" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Pillar mix")).toBeInTheDocument();
  });
});
