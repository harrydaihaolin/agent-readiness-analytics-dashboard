import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { StateBoundary } from "@/components/StateBoundary";
import { useRepoList } from "@/hooks/useRepoList";
import { color, gradeColor, radius, tabularNumeric } from "@/design/tokens";

const PAGE_SIZE = 25;

export function RepoListPage() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page") ?? "1"));
  const q = params.get("q") ?? "";
  const [draft, setDraft] = useState(q);

  // Debounced URL sync.
  useEffect(() => {
    if (draft === q) return;
    const id = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (draft.trim().length >= 2) {
        next.set("q", draft);
      } else {
        next.delete("q");
      }
      next.set("page", "1");
      setParams(next, { replace: true });
    }, 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  const state = useRepoList(page, PAGE_SIZE, q);

  const setPage = (n: number) => {
    const next = new URLSearchParams(params);
    next.set("page", String(n));
    setParams(next);
  };

  return (
    <>
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22 }}>Repos</h1>
        <input
          aria-label="search repos"
          placeholder="Search owner/name…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          style={{
            padding: "8px 10px",
            border: `1px solid ${color.borderDefault}`,
            borderRadius: radius.button,
            fontSize: 14,
            minWidth: 280,
          }}
        />
      </header>
      <StateBoundary state={state}>
        {(data) => (
          <>
            {data.items.length === 0 ? (
              <p style={{ color: color.textMuted }}>
                {data.query
                  ? `No repos matching "${data.query}".`
                  : "This tenant has no scans yet — run one from the control panel."}
              </p>
            ) : (
              <RepoTable items={data.items} />
            )}
            <Pagination
              page={data.page}
              size={data.size}
              total={data.total}
              onPage={setPage}
            />
          </>
        )}
      </StateBoundary>
    </>
  );
}

function RepoTable({
  items,
}: {
  items: import("@/types").RepoSnapshot[];
}) {
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        background: color.bgSurface,
        border: `1px solid ${color.borderDefault}`,
        borderRadius: radius.card,
        overflow: "hidden",
        fontSize: 14,
      }}
    >
      <thead>
        <tr style={{ background: color.bgSurfaceRaised, textAlign: "left" }}>
          <th style={{ padding: "8px 12px" }}>Repo</th>
          <th style={{ padding: "8px 12px", textAlign: "right" }}>Score</th>
          <th style={{ padding: "8px 12px", textAlign: "right" }}>Grade</th>
          <th style={{ padding: "8px 12px", textAlign: "right" }}>Readiness</th>
          <th style={{ padding: "8px 12px", textAlign: "right" }}>DevEx</th>
          <th style={{ padding: "8px 12px" }}>Last scan</th>
        </tr>
      </thead>
      <tbody>
        {items.map((r) => (
          <tr
            key={r.repo}
            style={{ borderTop: `1px solid ${color.borderDefault}` }}
          >
            <td style={{ padding: "8px 12px" }}>
              <Link
                to={`/repos/${encodeURIComponent(r.repo)}`}
                style={{ color: color.textPrimary, textDecoration: "none" }}
              >
                <code>{r.repo}</code>
              </Link>
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "right",
                ...tabularNumeric,
              }}
            >
              {r.overall_score.toFixed(1)}
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "right",
                color: gradeColor(r.grade),
                fontWeight: 700,
              }}
            >
              {r.grade}
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "right",
                ...tabularNumeric,
                color: color.textSecondary,
              }}
            >
              {r.readiness_score?.toFixed(1) ?? "—"}
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "right",
                ...tabularNumeric,
                color: color.textSecondary,
              }}
            >
              {r.dora_score?.toFixed(1) ?? "—"}
            </td>
            <td
              style={{
                padding: "8px 12px",
                color: color.textMuted,
                fontSize: 12,
              }}
            >
              {new Date(r.scanned_at).toLocaleDateString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Pagination({
  page,
  size,
  total,
  onPage,
}: {
  page: number;
  size: number;
  total: number;
  onPage: (n: number) => void;
}) {
  const lastPage = useMemo(
    () => Math.max(1, Math.ceil(total / size)),
    [total, size],
  );
  const start = total === 0 ? 0 : (page - 1) * size + 1;
  const end = Math.min(page * size, total);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 12,
        fontSize: 13,
        color: color.textMuted,
      }}
    >
      <span aria-live="polite">
        {start}–{end} of {total}
      </span>
      <div style={{ display: "flex", gap: 4 }}>
        <PageBtn label="«" disabled={page <= 1} onClick={() => onPage(1)} />
        <PageBtn
          label="‹"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        />
        <span style={{ padding: "4px 8px", ...tabularNumeric }}>
          page {page} / {lastPage}
        </span>
        <PageBtn
          label="›"
          disabled={page >= lastPage}
          onClick={() => onPage(page + 1)}
        />
        <PageBtn
          label="»"
          disabled={page >= lastPage}
          onClick={() => onPage(lastPage)}
        />
      </div>
    </div>
  );
}

function PageBtn({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "4px 10px",
        border: `1px solid ${color.borderDefault}`,
        background: color.bgSurface,
        color: color.textSecondary,
        borderRadius: radius.button,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  );
}
