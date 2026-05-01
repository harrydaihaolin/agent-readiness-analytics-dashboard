// Canonical brand glyph + wordmark. See UX_STANDARDS.md §1.5.
// MUST render identically to agent-readiness-landing-page and
// agent-readiness-leaderboard. Do not parameterize the colors.
import { color } from "@/design/tokens";

interface Props {
  size?: "sm" | "md";
}

export function BrandMark({ size = "md" }: Props) {
  const dim = size === "md" ? 28 : 24;
  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
      aria-label="agent-readiness"
    >
      <span
        aria-hidden="true"
        style={{
          width: dim,
          height: dim,
          background: color.accentStrong,
          color: "#fff",
          borderRadius: 6,
          display: "grid",
          placeItems: "center",
          fontSize: size === "md" ? 13 : 11,
          fontWeight: 700,
          letterSpacing: "0.02em",
        }}
      >
        ar
      </span>
      <span
        style={{
          color: color.textPrimary,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          fontSize: size === "md" ? 14 : 13,
        }}
      >
        agent-readiness
      </span>
    </span>
  );
}
