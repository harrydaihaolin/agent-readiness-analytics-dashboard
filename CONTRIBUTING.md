# Contributing

Private repo. External contributions are not accepted.

## Local dev loop

```bash
npm install
npm run typecheck
npm run lint
npm test
npm run dev    # against ../agent-readiness-analytics on :8089
```

## PR checklist

- [ ] `npm run typecheck && npm run lint && npm test` passes locally.
- [ ] If you changed `src/types/index.ts`, the matching change has
      been made in `agent-readiness-analytics/src/.../models.py` and
      the two PRs reference each other.
- [ ] No business logic on the client — aggregates and rankings stay
      in the analytics engine.
- [ ] No secrets committed; `.env` files remain gitignored.
