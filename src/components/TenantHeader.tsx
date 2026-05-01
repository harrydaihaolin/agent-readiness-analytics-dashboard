import type { TenantOverview } from "@/types";

export function TenantHeader({ overview }: { overview: TenantOverview }) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        padding: "16px 0",
        borderBottom: "1px solid #e5e7eb",
        marginBottom: 24,
      }}
    >
      <div>
        <h1 style={{ margin: 0 }}>{overview.tenant_id}</h1>
        <div style={{ color: "#6b7280", fontSize: 13 }}>
          {overview.tier} tier · {overview.repo_count} repos · weakest pillar:{" "}
          {overview.weakest_pillar.replace("_", " ")}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 32, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
          {overview.overall_score.toFixed(1)}
        </div>
        <div style={{ color: "#374151" }}>grade {overview.grade}</div>
      </div>
    </header>
  );
}
