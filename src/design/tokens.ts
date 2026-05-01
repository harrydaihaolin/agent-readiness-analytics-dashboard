// Design tokens — mirror of UX_STANDARDS.md §1 (in agent-readiness-research).
// The reference implementation is `agent-readiness-landing-page/tailwind.config.js`.
// If you change a token here, update the doc and align landing-page + leaderboard.

export const color = {
  // Surfaces
  bgCanvas: "#0b0d10",
  bgSurface: "#11141a",
  bgSurfaceRaised: "#171b23",
  borderDefault: "#1f242d",

  // Text — opacity ramp on white
  textPrimary: "#ffffff",
  textSecondary: "rgba(255,255,255,0.80)",
  textMuted: "rgba(255,255,255,0.60)",
  textFaint: "rgba(255,255,255,0.45)",

  // Accent (purple)
  accentPrimary: "#a78bfa",
  accentStrong: "#7c3aed",
  accentSoft: "#c4b5fd",

  // Semantic
  success: "#3fb950",
  warn: "#d29922",
  danger: "#f85149",
  info: "#58a6ff",
} as const;

// Back-compat aliases for any older callers that referenced
// `accentSuccess`/`accentDanger`/`accentInfo`/`accentWarn`. Prefer the
// shorter `success`/`danger`/`info`/`warn` going forward.
export const colorAlias = {
  accentSuccess: color.success,
  accentDanger: color.danger,
  accentInfo: color.info,
  accentWarn: color.warn,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 64,
} as const;

export const radius = {
  card: 12,
  button: 6,
  pill: 9999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
} as const;

export const FONT_SANS =
  'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
export const FONT_MONO =
  '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

export function gradeColor(grade: string): string {
  switch (grade) {
    case "S":
      return "#34d399";
    case "A":
      return color.success;
    case "B":
      return "#84cc16";
    case "C":
      return color.warn;
    case "D":
      return "#f97316";
    default:
      return color.danger;
  }
}

export function severityColor(s: "info" | "warn" | "error"): string {
  switch (s) {
    case "info":
      return color.info;
    case "warn":
      return color.warn;
    case "error":
      return color.danger;
  }
}

export function deltaColor(delta: number): string {
  if (delta > 0) return color.success;
  if (delta < 0) return color.danger;
  return color.textMuted;
}

export function formatDelta(delta: number): string {
  if (delta === 0) return "±0.0";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(2)}`;
}

export const tabularNumeric = {
  fontVariantNumeric: "tabular-nums" as const,
};
