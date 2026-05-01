# Agent guide

Conventions for AI coding agents working in this repository.

## Canonical commands

- Install:        `npm install`
- Typecheck:      `npm run typecheck`
- Lint:           `npm run lint`
- Test:           `npm test`
- Dev server:     `npm run dev`
- Build:          `npm run build`
- Self-scan:      `agent-readiness scan . --fail-below 95`

## Source of truth

- `src/types/index.ts` — TypeScript mirror of
  `agent-readiness-analytics/src/agent_readiness_analytics/models.py`.
  Adding/renaming a field is a coordinated change with that file.
- `src/api/client.ts` — the only place HTTP is done. Pages and hooks
  go through `useAnalytics().client`; do not call `fetch` directly
  from components.
- `src/hooks/useAsync.ts` — every page renders through `StateBoundary`
  + a hook built on `useAsync` so loading/error/empty states are
  uniform.

## Do-not-touch

- The shape of `AnalyticsContextValue` — it is consumed by every hook;
  changes ripple across the whole app.
- `vite.config.ts` `server.proxy` — couples the dev server to the
  analytics API on `:8089`. Changing the prefix is a coordinated
  change with `client.ts`.

## Scope

This repo is the **visual layer**. All ranking, aggregation, and
trend math lives in `agent-readiness-analytics`. If you find yourself
computing scores or pillar averages on the client, push that logic
back to the analytics engine.
