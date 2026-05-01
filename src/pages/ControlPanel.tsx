import { useState } from "react";
import { Link } from "react-router-dom";
import { KpiCard } from "@/components/KpiCard";
import { PillarRadar } from "@/components/PillarRadar";
import { ScanControls } from "@/components/ScanControls";
import { StateBoundary } from "@/components/StateBoundary";
import { useTenantOverview } from "@/hooks/useTenantOverview";
import { useSession } from "@/api/session";
import { color, gradeColor } from "@/design/tokens";

export function ControlPanelPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const state = useTenantOverview(refreshKey);
  const { staticMode } = useSession();

  return (
    <StateBoundary state={state}>
      {(overview) => (
        <>
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 20,
            }}
          >
            <div>
              <h1 style={{ margin: 0, fontSize: 24 }}>{overview.tenant_id}</h1>
              <div style={{ color: color.textMuted, fontSize: 13 }}>
                Control panel · tier{" "}
                <span
                  style={{
                    background: "rgba(124,58,237,0.15)",
                    border: "1px solid rgba(167,139,250,0.35)",
                    borderRadius: 9999,
                    padding: "2px 10px",
                    fontSize: 12,
                    color: color.accentSoft,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontWeight: 600,
                  }}
                >
                  {overview.tier}
                </span>{" "}
                · weakest pillar:{" "}
                {overview.weakest_pillar.replace("_", " ")}
              </div>
            </div>
            <div
              style={{
                color: color.textMuted,
                fontSize: 12,
                textAlign: "right",
              }}
            >
              generated{" "}
              {new Date(overview.generated_at).toLocaleString()}
            </div>
          </header>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <KpiCard
              label="Overall score"
              value={overview.overall_score.toFixed(1)}
              accent={gradeColor(overview.grade)}
              hint={`${overview.repo_count} repos · grade ${overview.grade}`}
            />
            <KpiCard
              label="Readiness"
              value={overview.readiness_score.toFixed(1)}
              hint="safety-weighted blend"
            />
            <KpiCard
              label="Agent DevEx"
              value={overview.dora_score.toFixed(1)}
              hint="orientation · iteration · containment · autonomy"
            />
            <KpiCard
              label="Weakest pillar"
              value={overview.weakest_pillar.replace("_", " ")}
              hint={`${overview.pillars[
                overview.weakest_pillar
              ].toFixed(1)} / 100`}
              accent={color.warn}
            />
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 24,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                background: color.bgSurface,
                border: `1px solid ${color.borderDefault}`,
                borderRadius: 6,
                padding: 16,
              }}
            >
              <h2 style={{ marginTop: 0, fontSize: 16 }}>Pillar mix</h2>
              <PillarRadar
                pillars={overview.pillars}
                weakest={overview.weakest_pillar}
              />
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {!staticMode && (
                <ScanControls
                  onScanFinished={() => setRefreshKey((k) => k + 1)}
                />
              )}
              {staticMode && (
                <section
                  style={{
                    background: color.bgSurface,
                    border: `1px solid ${color.borderDefault}`,
                    borderRadius: 6,
                    padding: 16,
                    color: color.textMuted,
                    fontSize: 13,
                  }}
                >
                  <strong style={{ color: color.textPrimary }}>
                    Static demo
                  </strong>
                  <p style={{ margin: "6px 0 0" }}>
                    This is a snapshot of the analytics engine running against
                    the agent-readiness project itself. Scan controls are
                    disabled — sign in to your own tenant for live scans.
                  </p>
                </section>
              )}
              <section
                style={{
                  background: color.bgSurface,
                  border: `1px solid ${color.borderDefault}`,
                  borderRadius: 6,
                  padding: 16,
                }}
              >
                <h2 style={{ marginTop: 0, fontSize: 16 }}>
                  Top-3 weakest repos
                </h2>
                <ol
                  style={{
                    paddingLeft: 18,
                    margin: "8px 0 0",
                    color: color.textPrimary,
                  }}
                >
                  {overview.repos.slice(0, 3).map((r) => (
                    <li key={r.repo} style={{ margin: "4px 0" }}>
                      <Link
                        to={`/repos/${encodeURIComponent(r.repo)}`}
                        style={{
                          color: color.textPrimary,
                          textDecoration: "none",
                        }}
                      >
                        <code>{r.repo}</code>
                      </Link>{" "}
                      <span style={{ color: color.textMuted, fontSize: 13 }}>
                        — {r.overall_score.toFixed(1)} · grade {r.grade}
                      </span>
                    </li>
                  ))}
                </ol>
                <Link
                  to="/repos"
                  style={{
                    color: color.accentPrimary,
                    fontSize: 13,
                    textDecoration: "none",
                  }}
                >
                  View all repos →
                </Link>
              </section>
            </div>
          </section>
        </>
      )}
    </StateBoundary>
  );
}
