import { Link } from "react-router-dom";
import type { Recommendation } from "@/types";
import { color, FONT_MONO, severityColor } from "@/design/tokens";

// Compact list item for the cross-tenant /recommendations page. Each card
// links to the repo detail page anchored on the matching diff card so the
// reader lands directly on the offending code instead of scrolling.
export function RecommendationCard({ rec }: { rec: Recommendation }) {
  const anchor = `rec-${rec.id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const href = `/repos/${encodeURIComponent(rec.repo)}#${anchor}`;
  return (
    <Link
      to={href}
      style={{ textDecoration: "none", color: "inherit" }}
      aria-label={`Open ${rec.title} in ${rec.repo}`}
    >
      <article
        style={{
          border: `1px solid ${color.borderDefault}`,
          borderLeft: `4px solid ${severityColor(rec.severity)}`,
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 12,
          background: color.bgSurface,
          transition: "background 120ms ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = color.bgSurfaceRaised;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = color.bgSurface;
        }}
      >
        <header style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <strong style={{ color: color.textPrimary }}>{rec.title}</strong>
            {rec.kind === "diff" ? <DiffBadge /> : null}
          </div>
          <span
            aria-label="estimated lift"
            style={{ color: color.success, fontVariantNumeric: "tabular-nums" }}
          >
            +{rec.estimated_lift.toFixed(1)}
          </span>
        </header>
        <p style={{ margin: "6px 0", color: color.textSecondary, fontSize: 14 }}>
          {rec.rationale}
        </p>
        <footer style={{ fontSize: 12, color: color.textMuted, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <code>{rec.repo}</code>
          <span>· pillar: {rec.pillar.replace("_", " ")}</span>
          {rec.file ? (
            <span>
              ·{" "}
              <code style={{ fontFamily: FONT_MONO }}>
                {rec.file}
                {rec.line != null ? `:${rec.line}` : ""}
              </code>
            </span>
          ) : null}
        </footer>
      </article>
    </Link>
  );
}

function DiffBadge() {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        padding: "2px 6px",
        borderRadius: 4,
        color: color.accentPrimary,
        border: `1px solid ${color.accentPrimary}`,
      }}
    >
      diff
    </span>
  );
}
