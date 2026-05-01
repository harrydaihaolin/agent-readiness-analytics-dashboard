import type { ButtonHTMLAttributes } from "react";
import { color, radius } from "@/design/tokens";

type Variant = "primary" | "secondary" | "danger";

const styleFor = (variant: Variant, disabled: boolean): React.CSSProperties => {
  const base: React.CSSProperties = {
    borderRadius: radius.button,
    padding: "8px 14px",
    fontSize: 14,
    fontWeight: 600,
    border: "1px solid transparent",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
    transition: "background-color 100ms ease",
  };
  if (variant === "primary") {
    return {
      ...base,
      background: color.accentPrimary,
      color: "#fff",
    };
  }
  if (variant === "danger") {
    return {
      ...base,
      background: color.danger,
      color: "#fff",
    };
  }
  return {
    ...base,
    background: "transparent",
    color: color.textSecondary,
    borderColor: color.borderDefault,
  };
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "primary", disabled, style, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled}
      style={{ ...styleFor(variant, !!disabled), ...style }}
    />
  );
}
