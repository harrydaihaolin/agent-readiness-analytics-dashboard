import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { AnalyticsProvider } from "./api/context";
import { SessionProvider } from "./api/session";
import "./styles.css";

const staticMode = import.meta.env.VITE_STATIC_MODE === "true";
/** Absolute path for static JSON. Relative `./data` resolves to the wrong host when the location is `/repo` without a trailing slash (GitHub Pages). */
const defaultBaseUrl = staticMode
  ? `${import.meta.env.BASE_URL.replace(/\/?$/, "")}/data`
  : "/api";
const baseUrl = import.meta.env.VITE_ANALYTICS_BASE_URL ?? defaultBaseUrl;
const dev = import.meta.env.DEV;
const seedTenant = import.meta.env.VITE_TENANT_ID;
const seedToken = import.meta.env.VITE_ANALYTICS_TOKEN;
const initial = staticMode
  ? { tenantId: seedTenant ?? "demo", token: "static" }
  : dev && seedTenant && seedToken
    ? { tenantId: seedTenant, token: seedToken }
    : null;

const basename = import.meta.env.VITE_BASE_PATH ?? "/";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <SessionProvider baseUrl={baseUrl} initial={initial} staticMode={staticMode}>
        <AnalyticsProvider>
          <App />
        </AnalyticsProvider>
      </SessionProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
