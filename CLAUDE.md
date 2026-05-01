# CLAUDE.md — agent-readiness-analytics-dashboard

This file is the Claude / Claude Code companion to AGENTS.md.
**Read AGENTS.md first** — it is the canonical source of conventions
and do-not-touch paths.

## Default loop

1. Read AGENTS.md before any non-trivial change.
2. Run `npm run typecheck && npm run lint && npm test` before opening
   a PR.
3. Cross-repo type changes (here ↔ analytics models) ship as paired
   PRs that reference each other.

## What Claude should never do here

- Compute aggregates, deltas, or rankings on the client. That logic
  belongs in `agent-readiness-analytics`.
- Reach around `src/api/client.ts`. All HTTP must go through it so
  auth/error handling stay uniform.
- Skip pre-commit hooks with `--no-verify`.

## Headless contract

`npm run typecheck && npm run lint && npm test` is non-interactive.
No prompts, no human input. If you add a step that requires
interaction, gate it behind an explicit flag.
