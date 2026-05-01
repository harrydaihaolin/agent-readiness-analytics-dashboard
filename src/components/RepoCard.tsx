import { Link } from "react-router-dom";
import type { RepoSnapshot } from "@/types";
import { color, gradeColor, radius, tabularNumeric } from "@/design/tokens";

export function RepoCard({ snap }: { snap: RepoSnapshot }) {
  const accent = gradeColor(snap.grade);
  return (
    <Link
      to={`/repos/${encodeURIComponent(snap.repo)}`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        border: `1px solid ${color.borderDefault}`,
        borderRadius: radius.card,
        marginBottom: 8,
        background: color.bgSurface,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div>
        <div style={{ fontWeight: 600, color: color.textPrimary }}>
          <code>{snap.repo}</code>
        </div>
        <div style={{ fontSize: 12, color: color.textMuted }}>
          last scanned {new Date(snap.scanned_at).toLocaleDateString()}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 18, ...tabularNumeric, color: color.textPrimary }}>
          {snap.overall_score.toFixed(1)}
        </div>
        <div style={{ color: accent, fontWeight: 700 }}>{snap.grade}</div>
      </div>
    </Link>
  );
}
