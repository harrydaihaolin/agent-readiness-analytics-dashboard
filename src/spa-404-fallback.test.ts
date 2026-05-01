import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Tests the GitHub Pages SPA 404 fallback that `vite.config.ts` writes into
 * `dist/404.html`. The fallback is a tiny inline script: take the deep path,
 * keep everything after the repo segment, and replace location with
 * `/<repo>/#<rest>`. If this regresses, deep links on Pages silently break
 * (the user lands on "Redirecting…" forever).
 *
 * We build with a representative `VITE_BASE_PATH` and then evaluate the
 * inline redirect script against a mock `location` for several inputs.
 */
describe("GitHub Pages SPA 404 fallback (dist/404.html)", () => {
  let buildDir: string;
  let html: string;
  let scriptBody: string;

  beforeAll(() => {
    buildDir = mkdtempSync(path.join(tmpdir(), "spa404-"));
    execSync(
      `npx vite build --outDir ${buildDir} --emptyOutDir`,
      {
        env: {
          ...process.env,
          VITE_STATIC_MODE: "true",
          VITE_BASE_PATH: "/agent-readiness-analytics-dashboard/",
          VITE_TENANT_ID: "agent-readiness-project",
        },
        stdio: "pipe",
      },
    );
    html = readFileSync(path.join(buildDir, "404.html"), "utf8");
    const m = html.match(/<script>([\s\S]*?)<\/script>/);
    if (!m) throw new Error("404.html has no <script> block");
    scriptBody = m[1];
  });

  afterAll(() => {
    rmSync(buildDir, { recursive: true, force: true });
  });

  function runRedirect(pathname: string, search = ""): string {
    let target = "";
    const fakeLocation = {
      origin: "https://example.test",
      pathname,
      search,
      replace(url: string) {
        target = url;
      },
    };
    const fn = new Function("location", scriptBody);
    fn(fakeLocation);
    return target;
  }

  it("ships a redirect script that calls location.replace", () => {
    expect(scriptBody).toContain("location.replace");
    expect(scriptBody).toContain("agent-readiness-analytics-dashboard");
  });

  it("redirects deep path under the repo to a hash route", () => {
    const target = runRedirect(
      "/agent-readiness-analytics-dashboard/repos/agent-readiness%2Fagent-readiness-analytics-dashboard",
    );
    expect(target).toBe(
      "https://example.test/agent-readiness-analytics-dashboard/#/repos/agent-readiness%2Fagent-readiness-analytics-dashboard",
    );
  });

  it("redirects bare repo path to hash root", () => {
    const target = runRedirect("/agent-readiness-analytics-dashboard/");
    expect(target).toBe("https://example.test/agent-readiness-analytics-dashboard/#/");
  });

  it("redirects unknown root paths to hash root", () => {
    const target = runRedirect("/totally-other-thing");
    expect(target).toBe("https://example.test/agent-readiness-analytics-dashboard/#/");
  });

  it("preserves query string on redirect", () => {
    const target = runRedirect(
      "/agent-readiness-analytics-dashboard/recommendations",
      "?tab=top",
    );
    expect(target).toBe(
      "https://example.test/agent-readiness-analytics-dashboard/#/recommendations?tab=top",
    );
  });
}, 60_000);
