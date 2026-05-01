import { useState } from "react";
import type { Recommendation } from "@/types";
import { color, FONT_MONO, severityColor } from "@/design/tokens";
import { UnifiedDiffView } from "./UnifiedDiffView";

// Code-review-style card. Two render modes:
//   kind === "diff"        — show a unified-diff card (collapsible, default open)
//   kind === "annotation"  — show the offending snippet with an inline suggestion
// Both modes share the same header (severity, title, lift, file:line) so the
// repo detail page reads like a list of GitHub PR review comments.

export function RecommendationDiffCard({ rec }: { rec: Recommendation }) {
  const [open, setOpen] = useState(true);
  const hasSnippet = rec.snippet !== null && rec.snippet.trim() !== "";
  const hasPatch = rec.kind === "diff" && rec.suggested_patch !== null;
  return (
    <article
      id={`rec-${cssId(rec.id)}`}
      style={{
        border: `1px solid ${color.borderDefault}`,
        borderLeft: `4px solid ${severityColor(rec.severity)}`,
        borderRadius: 12,
        marginBottom: 14,
        background: color.bgSurface,
        overflow: "hidden",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          padding: "12px 16px",
          background: color.bgSurfaceRaised,
          borderBottom: `1px solid ${color.borderDefault}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <SeverityBadge severity={rec.severity} />
          <strong style={{ color: color.textPrimary }}>{rec.title}</strong>
          {rec.file ? (
            <code
              style={{
                fontFamily: FONT_MONO,
                fontSize: 12,
                color: color.textMuted,
                background: color.bgCanvas,
                padding: "2px 6px",
                borderRadius: 4,
              }}
            >
              {rec.file}
              {rec.line != null ? `:${rec.line}` : ""}
            </code>
          ) : null}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span
            style={{
              fontSize: 12,
              color: color.textFaint,
              textTransform: "capitalize",
            }}
          >
            {rec.pillar.replace("_", " ")}
          </span>
          <span
            aria-label="estimated lift"
            style={{ color: color.success, fontVariantNumeric: "tabular-nums" }}
          >
            +{rec.estimated_lift.toFixed(1)}
          </span>
        </div>
      </header>

      <div style={{ padding: "12px 16px" }}>
        <p style={{ margin: 0, color: color.textSecondary, fontSize: 14 }}>
          {rec.rationale}
        </p>

        {hasSnippet && !hasPatch ? (
          <SnippetBlock snippet={rec.snippet!} />
        ) : null}

        {rec.fix_hint ? (
          <p
            style={{
              margin: "10px 0 0",
              padding: "8px 10px",
              background: color.bgSurfaceRaised,
              borderLeft: `3px solid ${color.accentPrimary}`,
              borderRadius: 4,
              color: color.textSecondary,
              fontSize: 13,
            }}
          >
            <strong style={{ color: color.accentSoft }}>Suggestion · </strong>
            {rec.fix_hint}
          </p>
        ) : null}

        {hasPatch ? (
          <details
            open={open}
            onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
            style={{ marginTop: 10 }}
          >
            <summary
              style={{
                cursor: "pointer",
                color: color.accentPrimary,
                fontSize: 13,
                marginBottom: 8,
                userSelect: "none",
              }}
            >
              {open ? "Hide" : "Show"} suggested patch
            </summary>
            <UnifiedDiffView patch={rec.suggested_patch!} />
          </details>
        ) : null}
      </div>
    </article>
  );
}

function SnippetBlock({ snippet }: { snippet: string }) {
  return (
    <pre
      style={{
        margin: "10px 0 0",
        padding: "8px 12px",
        background: color.bgCanvas,
        border: `1px solid ${color.borderDefault}`,
        borderRadius: 6,
        fontFamily: FONT_MONO,
        fontSize: 12,
        color: color.textSecondary,
        overflow: "auto",
        maxHeight: 180,
      }}
    >
      <code>{snippet}</code>
    </pre>
  );
}

function SeverityBadge({ severity }: { severity: Recommendation["severity"] }) {
  const fg = severityColor(severity);
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        padding: "2px 6px",
        borderRadius: 4,
        color: fg,
        border: `1px solid ${fg}`,
        background: "transparent",
      }}
    >
      {severity}
    </span>
  );
}

// Anchor IDs include the repo name and a colon; strip what CSS won't accept.
function cssId(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, "_");
}
