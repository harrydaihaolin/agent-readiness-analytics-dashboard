import type { ReactNode } from "react";
import { color, radius, tabularNumeric } from "@/design/tokens";

interface Props {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
  trailing?: ReactNode;
}

export function KpiCard({ label, value, hint, accent, trailing }: Props) {
  return (
    <div
      style={{
        background: color.bgSurface,
        border: `1px solid ${color.borderDefault}`,
        borderRadius: radius.card,
        padding: "16px 20px",
        minWidth: 160,
      }}
    >
      <div
        style={{
          color: color.textMuted,
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 6,
          display: "flex",
          alignItems: "baseline",
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: accent ?? color.textPrimary,
            ...tabularNumeric,
          }}
        >
          {value}
        </div>
        {trailing}
      </div>
      {hint && (
        <div style={{ color: color.textMuted, fontSize: 12, marginTop: 4 }}>
          {hint}
        </div>
      )}
    </div>
  );
}
