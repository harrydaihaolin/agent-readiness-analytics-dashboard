// Types mirror agent-readiness-analytics/src/agent_readiness_analytics/models.py.
// Keep in lockstep — see AGENTS.md.

export type Pillar = "cognitive_load" | "feedback" | "flow" | "safety";
export type Severity = "info" | "warn" | "error";
export type Tier = "silver" | "gold" | "platinum";

export const PILLARS: readonly Pillar[] = [
  "cognitive_load",
  "feedback",
  "flow",
  "safety",
] as const;

export interface Finding {
  pillar: Pillar;
  check_id: string;
  message: string;
  severity: Severity;
  fix_hint: string | null;
  count: number;
  file: string | null;
  line: number | null;
  snippet: string | null;
  suggested_patch: string | null;
}

export type RecommendationKind = "diff" | "annotation";

export interface RepoSnapshot {
  repo: string;
  overall_score: number;
  grade: string;
  pillars: Record<Pillar, number>;
  top_findings: Finding[];
  scanned_at: string;
  readiness_score: number | null;
  dora_score: number | null;
}

export interface RepoListPage {
  tenant_id: string;
  page: number;
  size: number;
  total: number;
  items: RepoSnapshot[];
  query: string | null;
}

export interface ScanJob {
  job_id: string;
  tenant_id: string;
  repos: string[];
  status: "queued" | "running" | "succeeded" | "failed";
  enqueued_at: string;
  finished_at: string | null;
  error: string | null;
}

export interface TenantOverview {
  tenant_id: string;
  tier: Tier;
  repo_count: number;
  overall_score: number;
  grade: string;
  pillars: Record<Pillar, number>;
  weakest_pillar: Pillar;
  strongest_pillar: Pillar;
  readiness_score: number;
  dora_score: number;
  repos: RepoSnapshot[];
  generated_at: string;
}

export interface TrendPoint {
  timestamp: string;
  overall_score: number;
  pillars: Record<Pillar, number>;
}

export interface OptimizationEvent {
  repo: string;
  timestamp: string;
  label: string;
  score_before: number | null;
  score_after: number | null;
}

export interface RepoTrend {
  repo: string;
  points: TrendPoint[];
  score_delta: number;
  delta_window_days: number;
  optimization_events: OptimizationEvent[];
}

export interface Recommendation {
  id: string;
  repo: string;
  pillar: Pillar;
  title: string;
  rationale: string;
  estimated_lift: number;
  severity: Severity;
  fix_hint: string | null;
  affected_checks: string[];
  file: string | null;
  line: number | null;
  snippet: string | null;
  suggested_patch: string | null;
  kind: RecommendationKind;
}

export interface TenantRecommendations {
  tenant_id: string;
  items: Recommendation[];
  generated_at: string;
}
