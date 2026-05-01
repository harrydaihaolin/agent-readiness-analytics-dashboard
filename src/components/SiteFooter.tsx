// Canonical footer — link order MUST match UX_STANDARDS.md §9.5.
// Same wording on landing-page, leaderboard, and dashboard.
import { BrandMark } from "./BrandMark";
import { color } from "@/design/tokens";

const linkStyle: React.CSSProperties = {
  color: color.textMuted,
  textDecoration: "none",
  fontSize: 13,
};

const FOOTER_LINKS = [
  { label: "Leaderboard", href: "https://harrydaihaolin.github.io/agent-readiness-leaderboard" },
  { label: "Dashboard", href: "/" },
  { label: "Docs", href: "https://github.com/harrydaihaolin/agent-readiness#readme" },
  { label: "GitHub", href: "https://github.com/harrydaihaolin/agent-readiness" },
  { label: "Security", href: "https://github.com/harrydaihaolin/agent-readiness/security" },
] as const;

export function SiteFooter() {
  return (
    <footer
      style={{
        borderTop: `1px solid ${color.borderDefault}`,
        marginTop: 64,
        paddingTop: 24,
        paddingBottom: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <BrandMark size="sm" />
        <nav
          aria-label="footer"
          style={{ display: "flex", flexWrap: "wrap", gap: 24 }}
        >
          {FOOTER_LINKS.map((l) => (
            <a key={l.label} href={l.href} style={linkStyle}>
              {l.label}
            </a>
          ))}
        </nav>
      </div>
      <div style={{ color: color.textFaint, fontSize: 12 }}>
        © {new Date().getFullYear()} agent-readiness contributors.
      </div>
    </footer>
  );
}
