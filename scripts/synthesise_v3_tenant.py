#!/usr/bin/env python3
"""
Synthesise the demo-mode `agent-readiness-v3-1000` tenant from the
leaderboard's frozen v3 scores envelope.

Stage 7d from the v3 close-the-loop plan: the demo dashboard ships a
second tenant pointing at the 1000-repo cohort so first-time visitors
land on the broadest dataset, not the tiny workspace-only tenant.

Inputs:
  - --source PATH-or-URL   Path to / URL of `scores_v3_*.json`. Defaults
                            to the public raw URL on the leaderboard repo.
  - --tenant ID            Tenant id under public/data/tenants/ (default
                            'agent-readiness-v3-1000').
  - --tier silver|gold|platinum   Default 'platinum' (the demo never
                            rate-limits).
  - --out-root DIR         Default 'public/data/tenants/'.

Writes:
  - <root>/<tenant>/overview.json
  - <root>/<tenant>/repos.json
  - <root>/<tenant>/recommendations.json
  - <root>/<tenant>/repos/<encoded>/recommendations.json
  - <root>/<tenant>/repos/<encoded>/trend.json

`<encoded>` = `quote(repo, safe='')` — i.e. `agent-readiness%2Frepo`.
The publish.yml smoke probe then double-encodes (`%252F`) when
fetching, matching the existing tenant convention.

The script is best-effort idempotent: re-running with the same input
produces byte-stable output (modulo `generated_at`, which we
deliberately fix to the envelope's `last_updated` so reruns produce
clean diffs).
"""

from __future__ import annotations

import argparse
import json
import statistics
import sys
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path
from typing import Any

DEFAULT_SOURCE = (
    "https://raw.githubusercontent.com/"
    "harrydaihaolin/agent-readiness-leaderboard/main/"
    "data/releases/scores_v3_1000_2026-05-01.json"
)
DEFAULT_TENANT = "agent-readiness-v3-1000"
DEFAULT_TIER = "platinum"
DEFAULT_OUT_ROOT = Path(__file__).resolve().parent.parent / "public" / "data" / "tenants"


# Slim envelope check (mirrors ML1 in the analytics ingest path).
def _validate(data: object) -> dict:
    if not isinstance(data, dict):
        raise SystemExit("scores envelope is not an object")
    if not isinstance(data.get("repos"), list):
        raise SystemExit("scores.repos missing or not a list")
    if not isinstance(data.get("last_updated"), str) or not data["last_updated"]:
        raise SystemExit("scores.last_updated missing")
    return data


def _load(source: str) -> dict:
    if source.startswith(("http://", "https://")):
        print(f"GET {source}")
        with urllib.request.urlopen(source, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    p = Path(source).expanduser().resolve()
    print(f"LOCAL {p}")
    if not p.is_file():
        raise SystemExit(f"source not found: {p}")
    return json.loads(p.read_text())


def _grade(score: float) -> str:
    if score >= 95:
        return "S"
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    if score >= 60:
        return "D"
    return "F"


def _aggregate_pillars(rows: list[dict[str, Any]]) -> dict[str, float]:
    pillars: dict[str, list[float]] = {}
    for r in rows:
        for k, v in (r.get("pillars") or {}).items():
            if isinstance(v, (int, float)):
                pillars.setdefault(k, []).append(float(v))
    return {k: round(statistics.mean(vs), 2) for k, vs in pillars.items()}


def _build_overview(envelope: dict[str, Any], tenant: str, tier: str) -> dict[str, Any]:
    rows = envelope.get("repos") or []
    overall = [
        float(r.get("overall_score") or 0.0)
        for r in rows
        if r.get("overall_score") is not None
    ]
    pillars = _aggregate_pillars(rows)
    weakest = min(pillars, key=lambda k: pillars[k]) if pillars else "flow"
    strongest = max(pillars, key=lambda k: pillars[k]) if pillars else "safety"
    overall_avg = round(statistics.mean(overall), 2) if overall else 0.0
    return {
        "tenant_id": tenant,
        "tier": tier,
        "repo_count": len(rows),
        "overall_score": overall_avg,
        "grade": _grade(overall_avg),
        "pillars": pillars,
        "weakest_pillar": weakest,
        "strongest_pillar": strongest,
        # readiness/dora are reskinned aggregates in the dashboard; for
        # the demo just track overall as a placeholder so the panel
        # doesn't render '—'.
        "readiness_score": overall_avg,
        "dora_score": overall_avg,
        "repos": _flatten_repo_rows(rows),
        "generated_at": envelope["last_updated"],
    }


def _flatten_repo_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for r in rows:
        score = float(r.get("overall_score") or 0.0)
        out.append(
            {
                "repo": r.get("repo") or r.get("name") or "unknown",
                "overall_score": score,
                "grade": r.get("grade") or _grade(score),
                "pillars": {
                    k: float(v)
                    for k, v in (r.get("pillars") or {}).items()
                    if isinstance(v, (int, float))
                },
                "top_findings": r.get("top_findings") or [],
                "scanned_at": r.get("scanned_at"),
                "readiness_score": score,
                "dora_score": score,
            }
        )
    out.sort(key=lambda x: -x["overall_score"])
    return out


def _build_repos(overview: dict[str, Any], tenant: str) -> dict[str, Any]:
    repos = overview["repos"]
    return {
        "tenant_id": tenant,
        "page": 1,
        "size": len(repos),
        "total": len(repos),
        "items": repos,
        "query": None,
    }


def _build_recommendations_for_repo(
    repo: dict[str, Any], tenant: str
) -> dict[str, Any]:
    repo_name = repo["repo"]
    items: list[dict[str, Any]] = []
    findings = repo.get("top_findings") or []
    # Estimated lift: split the gap from 100 evenly across findings,
    # weighted by severity (warn > info). Keeps the demo tile honest:
    # 'these together would lift you to ~100'.
    severity_weight = {"error": 3.0, "warn": 2.0, "info": 1.0}
    weights = [severity_weight.get(f.get("severity"), 1.0) for f in findings]
    total_weight = sum(weights) or 1.0
    headroom = max(0.0, 100.0 - float(repo.get("overall_score") or 0.0))
    for f, w in zip(findings, weights):
        cid = f.get("check_id") or "unknown"
        title = (f.get("message") or cid)[:80]
        items.append(
            {
                "id": f"{repo_name}:{cid}",
                "repo": repo_name,
                "pillar": f.get("pillar") or "flow",
                "title": title,
                "rationale": f.get("message") or "",
                "estimated_lift": round(headroom * (w / total_weight), 2),
                "severity": f.get("severity") or "info",
                "fix_hint": f.get("fix_hint"),
                "affected_checks": [cid],
                "file": f.get("file"),
                "line": f.get("line"),
                "snippet": f.get("snippet"),
                "suggested_patch": f.get("suggested_patch"),
                "kind": "diff" if f.get("suggested_patch") else "annotation",
            }
        )
    return {
        "tenant_id": tenant,
        "items": items,
        "generated_at": repo.get("scanned_at"),
    }


def _build_tenant_recommendations(
    overview: dict[str, Any], tenant: str
) -> dict[str, Any]:
    """Tenant-rollup recommendations: top-10 by estimated lift across all repos."""
    all_items: list[dict[str, Any]] = []
    for repo in overview["repos"][:200]:  # bound for the demo file size
        per_repo = _build_recommendations_for_repo(repo, tenant)
        all_items.extend(per_repo["items"])
    # The dashboard's tenant card surfaces the top 10 — pre-rank here.
    all_items.sort(key=lambda x: -x.get("estimated_lift", 0.0))
    return {
        "tenant_id": tenant,
        "items": all_items[:10],
        "generated_at": overview["generated_at"],
    }


def _build_trend(repo: dict[str, Any]) -> dict[str, Any]:
    return {
        "repo": repo["repo"],
        "points": [
            {
                "timestamp": repo.get("scanned_at"),
                "overall_score": repo.get("overall_score"),
                "pillars": repo.get("pillars") or {},
            }
        ],
        "score_delta": 0.0,
        "delta_window_days": 30,
        "optimization_events": [],
    }


def _write(path: Path, doc: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(doc, indent=2 if path.name == "overview.json" else None))


def _summary_stats(envelope: dict[str, Any]) -> dict[str, Any]:
    rows = envelope.get("repos") or []
    fire_counter: Counter = Counter()
    for r in rows:
        for f in r.get("top_findings") or []:
            cid = f.get("check_id")
            if cid:
                fire_counter[cid] += 1
    return {
        "fire_rates": {
            cid: round(n / len(rows), 4) if rows else 0.0
            for cid, n in fire_counter.most_common(20)
        }
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--source", default=DEFAULT_SOURCE)
    ap.add_argument("--tenant", default=DEFAULT_TENANT)
    ap.add_argument("--tier", default=DEFAULT_TIER)
    ap.add_argument("--out-root", type=Path, default=DEFAULT_OUT_ROOT)
    args = ap.parse_args()

    envelope = _validate(_load(args.source))
    rows = envelope.get("repos") or []
    print(
        f"OK: {len(rows)} repos / "
        f"rules pack {envelope.get('rules_pack_version')} / "
        f"last_updated {envelope.get('last_updated')}"
    )

    out_root = (args.out_root / args.tenant).resolve()
    out_root.mkdir(parents=True, exist_ok=True)

    overview = _build_overview(envelope, args.tenant, args.tier)
    _write(out_root / "overview.json", overview)
    _write(out_root / "repos.json", _build_repos(overview, args.tenant))
    _write(
        out_root / "recommendations.json",
        _build_tenant_recommendations(overview, args.tenant),
    )

    repos_dir = out_root / "repos"
    for repo in overview["repos"]:
        encoded = urllib.parse.quote(repo["repo"], safe="")
        rdir = repos_dir / encoded
        _write(
            rdir / "recommendations.json",
            _build_recommendations_for_repo(repo, args.tenant),
        )
        _write(rdir / "trend.json", _build_trend(repo))

    # Side-channel summary file consumed by smoke probes (and useful
    # for the article when discussing the demo).
    summary = _summary_stats(envelope) | {
        "tenant_id": args.tenant,
        "repos": len(rows),
        "rules_pack_version": envelope.get("rules_pack_version"),
        "scanner_version": envelope.get("scanner_version"),
        "last_updated": envelope.get("last_updated"),
    }
    _write(out_root / "summary.json", summary)

    print(f"Wrote {len(rows)} per-repo files under {repos_dir}")
    print(f"Wrote tenant overview/repos/recommendations under {out_root}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
