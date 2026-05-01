import { color, FONT_MONO } from "@/design/tokens";

// Tokenises a unified-diff string into rows the renderer can colour.
// We intentionally do not try to be a full GNU diff parser; the analytics
// engine emits stable hunks via Python's difflib so the input shape is
// predictable.
type DiffRow =
  | { kind: "header"; text: string }
  | { kind: "hunk"; text: string }
  | { kind: "add"; text: string }
  | { kind: "del"; text: string }
  | { kind: "ctx"; text: string };

function parseDiff(patch: string): DiffRow[] {
  const lines = patch.split("\n");
  const rows: DiffRow[] = [];
  for (const raw of lines) {
    if (raw.startsWith("--- ") || raw.startsWith("+++ ")) {
      rows.push({ kind: "header", text: raw });
      continue;
    }
    if (raw.startsWith("@@")) {
      rows.push({ kind: "hunk", text: raw });
      continue;
    }
    if (raw.startsWith("+")) {
      rows.push({ kind: "add", text: raw });
      continue;
    }
    if (raw.startsWith("-")) {
      rows.push({ kind: "del", text: raw });
      continue;
    }
    rows.push({ kind: "ctx", text: raw });
  }
  // Strip a single trailing empty context row that the splitter inserts
  // when the patch ends with "\n" — otherwise the diff card has a blank
  // final line.
  if (rows.length && rows[rows.length - 1].kind === "ctx" && rows[rows.length - 1].text === "") {
    rows.pop();
  }
  return rows;
}

const ROW_BG: Record<DiffRow["kind"], string> = {
  header: "transparent",
  hunk: "rgba(167,139,250,0.08)",
  add: "rgba(63,185,80,0.12)",
  del: "rgba(248,81,73,0.12)",
  ctx: "transparent",
};

const ROW_FG: Record<DiffRow["kind"], string> = {
  header: color.textMuted,
  hunk: color.accentSoft,
  add: color.success,
  del: color.danger,
  ctx: color.textSecondary,
};

export function UnifiedDiffView({ patch }: { patch: string }) {
  const rows = parseDiff(patch);
  return (
    <pre
      role="region"
      aria-label="suggested patch"
      style={{
        fontFamily: FONT_MONO,
        fontSize: 12,
        lineHeight: 1.55,
        margin: 0,
        padding: 0,
        background: color.bgCanvas,
        border: `1px solid ${color.borderDefault}`,
        borderRadius: 8,
        overflow: "auto",
        maxHeight: 360,
      }}
    >
      <code style={{ display: "block" }}>
        {rows.map((row, i) => (
          <span
            key={i}
            data-diff-kind={row.kind}
            style={{
              display: "block",
              padding: "0 12px",
              background: ROW_BG[row.kind],
              color: ROW_FG[row.kind],
              whiteSpace: "pre",
            }}
          >
            {row.text || " "}
          </span>
        ))}
      </code>
    </pre>
  );
}
