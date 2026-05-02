/* eslint-disable */
// Auto-generated from agent-readiness-insights-protocol. DO NOT EDIT.
// Source: https://raw.githubusercontent.com/harrydaihaolin/agent-readiness-insights-protocol/e9c8eeb6f05c084e9cc56c1e21be33a0ad465530/schemas/rule.schema.json
// Regenerate via `node scripts/regen_protocol_constants.mjs` and commit.

export type Pillar = "cognitive_load" | "feedback" | "flow" | "safety";
export type Severity = "info" | "warn" | "error";

export const PILLARS: readonly Pillar[] = ["cognitive_load", "feedback", "flow", "safety"] as const;
export const SEVERITIES: readonly Severity[] = ["info", "warn", "error"] as const;
export const OSS_MATCH_TYPES: readonly string[] = ["command_in_makefile", "composite", "file_size", "manifest_field", "path_glob", "regex_in_files"] as const;
