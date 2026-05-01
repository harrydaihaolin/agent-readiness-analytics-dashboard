import { useState } from "react";
import { useAnalytics } from "@/api/context";
import { Button } from "./Button";
import { color } from "@/design/tokens";

interface Props {
  onScanFinished?: () => void;
}

type Status =
  | { kind: "idle" }
  | { kind: "running"; label: string }
  | { kind: "success"; label: string }
  | { kind: "error"; message: string };

export function ScanControls({ onScanFinished }: Props) {
  const { client, tenantId } = useAnalytics();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [singleRepo, setSingleRepo] = useState("");

  async function runOne() {
    if (!singleRepo.trim()) return;
    setStatus({ kind: "running", label: `Scanning ${singleRepo}` });
    try {
      const job = await client.scanRepo(tenantId, singleRepo.trim());
      if (job.status === "succeeded") {
        setStatus({ kind: "success", label: `Scanned ${singleRepo}` });
        onScanFinished?.();
      } else {
        setStatus({
          kind: "error",
          message: job.error ?? "Scan failed.",
        });
      }
    } catch (err: unknown) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async function runBatch() {
    setStatus({ kind: "running", label: "Rescanning every repo" });
    try {
      const job = await client.scanBatch(tenantId);
      setStatus({
        kind: "success",
        label: `Rescanned ${job.repos.length} repos`,
      });
      onScanFinished?.();
    } catch (err: unknown) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return (
    <section
      style={{
        background: color.bgSurface,
        border: `1px solid ${color.borderDefault}`,
        borderRadius: 6,
        padding: 16,
      }}
    >
      <h2 style={{ marginTop: 0, fontSize: 16 }}>Scan controls</h2>
      <p style={{ color: color.textMuted, fontSize: 13, marginTop: 4 }}>
        Run a fresh scan for one repo, or rescan every repo this tenant owns.
      </p>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          aria-label="repo to scan"
          placeholder="owner/repo"
          value={singleRepo}
          onChange={(e) => setSingleRepo(e.target.value)}
          style={{
            flex: 1,
            padding: "8px 10px",
            border: `1px solid ${color.borderDefault}`,
            borderRadius: 4,
            fontSize: 14,
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
          }}
        />
        <Button
          onClick={runOne}
          disabled={!singleRepo.trim() || status.kind === "running"}
        >
          Scan
        </Button>
        <Button
          variant="secondary"
          onClick={runBatch}
          disabled={status.kind === "running"}
        >
          Batch rescan all
        </Button>
      </div>
      <div style={{ marginTop: 10, fontSize: 13, minHeight: 18 }}>
        {status.kind === "running" && (
          <span role="status" style={{ color: color.textMuted }}>
            {status.label}…
          </span>
        )}
        {status.kind === "success" && (
          <span style={{ color: color.success }}>{status.label}</span>
        )}
        {status.kind === "error" && (
          <span role="alert" style={{ color: color.danger }}>
            {status.message}
          </span>
        )}
      </div>
    </section>
  );
}
