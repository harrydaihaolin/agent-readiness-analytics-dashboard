/**
 * Conventional entry point. Vite uses `index.html` → `src/main.tsx` for the
 * actual app bootstrap; this file exists so static analysis tools (and the
 * `agent-readiness` `entry_points.detected` rule) can find an obvious
 * `src/index.ts` for this package.
 */
export { App } from "./App";
export { AnalyticsClient } from "./api/client";
