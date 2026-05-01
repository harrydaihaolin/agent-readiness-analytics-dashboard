import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/Button";
import { KpiCard } from "@/components/KpiCard";
import { RecommendationDiffCard } from "@/components/RecommendationDiffCard";
import { ScoreTrend } from "@/components/ScoreTrend";
import { StateBoundary } from "@/components/StateBoundary";
import { useRepoRecommendations } from "@/hooks/useRepoRecommendations";
import { useTrend } from "@/hooks/useTrend";
import { useAnalytics } from "@/api/context";
import { useSession } from "@/api/session";
import { PILLARS, type Pillar, type Severity } from "@/types";
import {
  color,
  deltaColor,
  formatDelta,
  gradeColor,
  radius,
  tabularNumeric,
} from "@/design/tokens";

export function RepoPage() {
  const { repo = "" } = useParams<{ repo: string }>();
  const decoded = decodeURIComponent(repo);
  const [refreshKey, setRefreshKey] = useState(0);
  const state = useTrend(decoded, 30, refreshKey);
  const { staticMode } = useSession();

  return (
    <>
      <nav style={{ marginBottom: 12, fontSize: 13 }}>
        <Link
          to="/repos"
          style={{ color: color.textMuted, textDecoration: "none" }}
        >
          ← All repos
        </Link>
      </nav>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 20,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24 }}>
          <code>{decoded}</code>
        </h1>
        {!staticMode && (
          <RescanButton repo={decoded} onDone={() => setRefreshKey((k) => k + 1)} />
        )}
      </header>

      <StateBoundary state={state}>
        {(trend) => {
          const latest = trend.points[trend.points.length - 1];
          return (
            <>
              <section
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                <KpiCard
                  label="Score"
                  value={latest ? latest.overall_score.toFixed(1) : "—"}
                  accent={
                    latest
                      ? gradeColor(
                          gradeFromScore(latest.overall_score),
                        )
                      : undefined
                  }
                  hint={
                    latest
                      ? `grade ${gradeFromScore(latest.overall_score)}`
                      : undefined
                  }
                />
                <KpiCard
                  label={`Δ over ${trend.delta_window_days} days`}
                  value={formatDelta(trend.score_delta)}
                  accent={deltaColor(trend.score_delta)}
                  hint="vs. baseline at window start"
                />
                <KpiCard
                  label="Snapshots"
                  value={String(trend.points.length)}
                  hint="scan history depth"
                />
                <KpiCard
                  label="Optimization events"
                  value={String(trend.optimization_events.length)}
                  hint="user-claimed fix moments"
                />
              </section>

              <section
                style={{
                  background: color.bgSurface,
                  border: `1px solid ${color.borderDefault}`,
                  borderRadius: radius.card,
                  padding: 16,
                  marginBottom: 24,
                }}
              >
                <h2 style={{ marginTop: 0, fontSize: 16 }}>Score trend</h2>
                <ScoreTrend
                  points={trend.points}
                  events={trend.optimization_events}
                />
              </section>

              {trend.optimization_events.length > 0 && (
                <section
                  style={{
                    background: color.bgSurface,
                    border: `1px solid ${color.borderDefault}`,
                    borderRadius: radius.card,
                    padding: 16,
                    marginBottom: 24,
                  }}
                >
                  <h2 style={{ marginTop: 0, fontSize: 16 }}>
                    Optimization events
                  </h2>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: 13,
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          color: color.textMuted,
                          textAlign: "left",
                          borderBottom: `1px solid ${color.borderDefault}`,
                        }}
                      >
                        <th style={{ padding: "6px 8px" }}>Date</th>
                        <th style={{ padding: "6px 8px" }}>Label</th>
                        <th
                          style={{ padding: "6px 8px", textAlign: "right" }}
                        >
                          Before
                        </th>
                        <th
                          style={{ padding: "6px 8px", textAlign: "right" }}
                        >
                          After
                        </th>
                        <th
                          style={{ padding: "6px 8px", textAlign: "right" }}
                        >
                          Δ
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {trend.optimization_events.map((ev, i) => {
                        const delta =
                          ev.score_before !== null && ev.score_after !== null
                            ? ev.score_after - ev.score_before
                            : null;
                        return (
                          <tr key={`${ev.timestamp}-${i}`}>
                            <td style={{ padding: "6px 8px" }}>
                              {new Date(ev.timestamp).toLocaleDateString()}
                            </td>
                            <td style={{ padding: "6px 8px" }}>{ev.label}</td>
                            <td
                              style={{
                                padding: "6px 8px",
                                textAlign: "right",
                                ...tabularNumeric,
                              }}
                            >
                              {ev.score_before?.toFixed(1) ?? "—"}
                            </td>
                            <td
                              style={{
                                padding: "6px 8px",
                                textAlign: "right",
                                ...tabularNumeric,
                              }}
                            >
                              {ev.score_after?.toFixed(1) ?? "—"}
                            </td>
                            <td
                              style={{
                                padding: "6px 8px",
                                textAlign: "right",
                                color:
                                  delta === null
                                    ? color.textMuted
                                    : deltaColor(delta),
                                ...tabularNumeric,
                              }}
                            >
                              {delta === null ? "—" : formatDelta(delta)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </section>
              )}
            </>
          );
        }}
      </StateBoundary>

      <section
        style={{
          background: color.bgSurface,
          border: `1px solid ${color.borderDefault}`,
          borderRadius: radius.card,
          padding: 16,
        }}
      >
        <RepoCodeReview repo={decoded} refreshKey={refreshKey} />
      </section>
    </>
  );
}

function gradeFromScore(score: number): string {
  if (score >= 95) return "S";
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function RescanButton({
  repo,
  onDone,
}: {
  repo: string;
  onDone: () => void;
}) {
  const { client, tenantId } = useAnalytics();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <Button
        variant="secondary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setErr(null);
          try {
            await client.scanRepo(tenantId, repo);
            onDone();
          } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : String(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Rescanning…" : "Rescan"}
      </Button>
      {err && (
        <span role="alert" style={{ color: color.danger, fontSize: 12 }}>
          {err}
        </span>
      )}
    </div>
  );
}

type SeverityFilter = Severity | "all";
type PillarFilter = Pillar | "all";

function RepoCodeReview({ repo, refreshKey }: { repo: string; refreshKey: number }) {
  const state = useRepoRecommendations(repo, 50, refreshKey);
  const [pillarFilter, setPillarFilter] = useState<PillarFilter>("all");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");

  return (
    <>
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 16 }}>Code review</h2>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 13,
              color: color.textMuted,
            }}
          >
            Each finding from the latest scan, with file context and a
            suggested patch where the rule provides one.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <FilterSelect<PillarFilter>
            label="pillar"
            value={pillarFilter}
            onChange={setPillarFilter}
            options={[
              { value: "all", label: "all pillars" },
              ...PILLARS.map((p) => ({ value: p, label: p.replace("_", " ") })),
            ]}
          />
          <FilterSelect<SeverityFilter>
            label="severity"
            value={severityFilter}
            onChange={setSeverityFilter}
            options={[
              { value: "all", label: "all severities" },
              { value: "error", label: "error" },
              { value: "warn", label: "warn" },
              { value: "info", label: "info" },
            ]}
          />
        </div>
      </header>

      <StateBoundary state={state}>
        {(payload) => {
          const items = payload.items.filter(
            (r) =>
              (pillarFilter === "all" || r.pillar === pillarFilter) &&
              (severityFilter === "all" || r.severity === severityFilter),
          );
          if (payload.items.length === 0) {
            return (
              <p style={{ color: color.textMuted, marginTop: 8 }}>
                No findings on the most recent scan — clean repo.
              </p>
            );
          }
          if (items.length === 0) {
            return (
              <p style={{ color: color.textMuted, marginTop: 8 }}>
                No recommendations match the current filters.
              </p>
            );
          }
          return (
            <div>
              {items.map((rec) => (
                <RecommendationDiffCard key={rec.id} rec={rec} />
              ))}
            </div>
          );
        }}
      </StateBoundary>
    </>
  );
}

function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <label style={{ fontSize: 12, color: color.textMuted }}>
      <span style={{ marginRight: 6 }}>{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        style={{
          background: color.bgSurfaceRaised,
          color: color.textPrimary,
          border: `1px solid ${color.borderDefault}`,
          borderRadius: 6,
          padding: "4px 8px",
          fontSize: 12,
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
