# agent-readiness-analytics-dashboard

The visualization layer over
[`agent-readiness-analytics`](../agent-readiness-analytics). React +
TypeScript + Vite. Silver+ tier.

## What it shows

- **Overview** — tenant grade, pillar radar, repos sorted weakest-first.
- **Recommendations** — actionable items ranked by estimated lift.
- **Repo trend** — score over time with optimization events overlaid,
  so a tenant can answer "did my fixes actually move the number?"

## Run it

```bash
npm install
ANALYTICS_API_KEY=dev (cd ../agent-readiness-analytics && make serve) &
VITE_TENANT_ID=demo VITE_ANALYTICS_TOKEN=dev npm run dev
```

The Vite dev server proxies `/api/*` to the analytics service on
`:8089` (configurable via `VITE_ANALYTICS_API`).

## Build

```bash
npm run build      # → dist/
npm run preview    # serve dist/ locally
```

## Static demo (GitHub Pages)

The dashboard supports a "static mode" build that reads from a tree of
pre-exported JSON files under `public/data/` instead of hitting the live API.

This repo is intended to be **public** while
[`agent-readiness-analytics`](../agent-readiness-analytics) can stay **private**.
CI (`.github/workflows/publish.yml`) only checks out this repository and runs
`npm ci` + `npm run build` — it never clones the analytics package. Refresh the
snapshot on your machine (or in private automation), commit `public/data/`, and
push; Pages will rebuild on every push to `main`.

Site URL when using GitHub **project** Pages:
`https://<owner>.github.io/<repo>/` — the workflow sets `VITE_BASE_PATH` to
`/<repo>/` automatically.

Reproduce locally:

```bash
# 1. Scan every sibling repo into a fresh analytics DB (private analytics repo).
cd ../agent-readiness-analytics
python bin/scan-project.py \
  --tenant agent-readiness-project \
  --db /tmp/analytics.sqlite \
  --root "$(realpath ..)"

# 2. Export the analytics responses as a static JSON tree into this repo.
ANALYTICS_DB=/tmp/analytics.sqlite \
  agent-readiness-analytics export-static \
    --tenant agent-readiness-project \
    --out-dir ../agent-readiness-analytics-dashboard/public/data

# 3. Build the dashboard in static mode.
cd ../agent-readiness-analytics-dashboard
VITE_STATIC_MODE=true \
VITE_TENANT_ID=agent-readiness-project \
  npm run build

# 4. Serve dist/ at http://127.0.0.1:8770.
python3 -m http.server 8770 --bind 127.0.0.1 --directory dist
```

In static mode, scan + rescan controls are hidden — the demo is read-only.

## Environment

| Variable                   | Purpose                                      |
|----------------------------|----------------------------------------------|
| `VITE_TENANT_ID`           | tenant id to show (default `demo`)           |
| `VITE_ANALYTICS_TOKEN`     | bearer for the analytics API                 |
| `VITE_ANALYTICS_BASE_URL`  | API base URL (default `/api`)                |
| `VITE_ANALYTICS_API`       | dev-server proxy target (default `:8089`)    |

## Layout

```
src/
  api/
    client.ts       fetch-based analytics client
    context.tsx     <AnalyticsProvider> + useAnalytics()
  hooks/
    useAsync.ts     generic loading/error/data state
    useTenantOverview.ts
    useRecommendations.ts
    useTrend.ts
  components/
    PillarRadar.tsx ScoreTrend.tsx RecommendationCard.tsx
    RepoCard.tsx    TenantHeader.tsx StateBoundary.tsx
  pages/
    Overview.tsx Recommendations.tsx Repo.tsx
  types/index.ts    1:1 mirror of analytics models.py
```

## License

Proprietary. See `LICENSE`.
