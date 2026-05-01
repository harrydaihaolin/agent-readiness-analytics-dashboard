import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { App } from "./App";
import { AnalyticsProvider } from "./api/context";
import { SessionProvider } from "./api/session";
import "./styles.css";

const staticMode = import.meta.env.VITE_STATIC_MODE === "true";

/** Hash routes only: server must only ever serve index.html (use …/repo/#/… on GitHub project Pages). */
if (
  staticMode &&
  (window.location.hash === "" || window.location.hash === "#")
) {
  window.location.hash = "/";
}
/** Absolute path for static JSON. Relative `./data` resolves to the wrong host when the location is `/repo` without a trailing slash (GitHub Pages). */
const defaultBaseUrl = staticMode
  ? `${import.meta.env.BASE_URL.replace(/\/?$/, "")}/data`
  : "/api";
const baseUrl = import.meta.env.VITE_ANALYTICS_BASE_URL ?? defaultBaseUrl;
const dev = import.meta.env.DEV;
const seedTenant = import.meta.env.VITE_TENANT_ID;
const seedToken = import.meta.env.VITE_ANALYTICS_TOKEN;
const initial = staticMode
  ? {
      /** Committed JSON lives under `public/data/tenants/agent-readiness-project/`. */
      tenantId: seedTenant || "agent-readiness-project",
      token: "static",
    }
  : dev && seedTenant && seedToken
    ? { tenantId: seedTenant, token: seedToken }
    : null;

const Router = staticMode ? HashRouter : BrowserRouter;
/**
 * BrowserRouter: basename is the URL prefix (e.g. /agent-readiness-analytics-dashboard).
 * HashRouter:    basename matches the *parsed hash*, which always starts at `/`,
 *                so it must be "/" — passing the deploy prefix here makes every
 *                route silently not match (header renders, body stays empty).
 */
const basename = staticMode
  ? "/"
  : (import.meta.env.VITE_BASE_PATH ?? "/").replace(/\/$/, "") || "/";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router basename={basename}>
      <SessionProvider baseUrl={baseUrl} initial={initial} staticMode={staticMode}>
        <AnalyticsProvider>
          <App />
        </AnalyticsProvider>
      </SessionProvider>
    </Router>
  </React.StrictMode>,
);
