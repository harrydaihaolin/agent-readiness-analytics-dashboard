#!/usr/bin/env node
/**
 * Regenerate src/types/protocol.generated.ts from the protocol JSON schema.
 *
 * The dashboard's hand-rolled `Pillar`/`Severity` literals in
 * `src/types/index.ts` have historically drifted whenever the protocol
 * adds a value. This script reads the canonical enums out of the
 * pinned protocol commit's `rule.schema.json` and writes a single
 * generated module the dashboard imports. CI runs this script and
 * asserts `git diff --exit-code` so a protocol change without a
 * coordinated dashboard bump fails loud.
 *
 * The schema is fetched from a SHA-pinned protocol commit so build
 * results are reproducible. To bump the pin, edit `PROTOCOL_REF` below.
 *
 * Usage:
 *
 *   node scripts/regen_protocol_constants.mjs
 *
 * For local development without network, drop a copy of the schema at
 * `scripts/.protocol.schema.cache.json` and the script will use that.
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const OUT_PATH = resolve(ROOT, 'src/types/protocol.generated.ts');
const CACHE_PATH = resolve(HERE, '.protocol.schema.cache.json');

// Pinned protocol commit. Bump deliberately — every bump is an
// explicit decision to absorb whatever enum changes have landed
// upstream since the last pin.
//
// e9c8eeb6 = the same SHA pinned by agent-readiness-rules CI; this
// is the first protocol commit that ships fix_template and is the
// canonical reference for the rules pack v1.4.0 wave.
const PROTOCOL_REF =
  process.env.AR_PROTOCOL_REF || 'e9c8eeb6f05c084e9cc56c1e21be33a0ad465530';

const SCHEMA_URL =
  process.env.AR_PROTOCOL_SCHEMA_URL ||
  `https://raw.githubusercontent.com/harrydaihaolin/agent-readiness-insights-protocol/${PROTOCOL_REF}/schemas/rule.schema.json`;

const TIMEOUT_MS = Number(process.env.AR_FETCH_TIMEOUT_MS || 8000);

async function fetchSchema() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(SCHEMA_URL, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function loadCache() {
  if (!existsSync(CACHE_PATH)) {
    throw new Error(
      `No cache at ${CACHE_PATH}. Either run with network, or save the schema there.`,
    );
  }
  return JSON.parse(readFileSync(CACHE_PATH, 'utf8'));
}

function extract(schema) {
  const defs = schema?.['$defs'] ?? {};
  const pillars = defs.Pillar?.enum ?? [];
  const severities = defs.Severity?.enum ?? [];
  const matchTypes = new Set();
  for (const body of Object.values(defs)) {
    const title = body?.title ?? '';
    const constVal = body?.properties?.type?.const;
    if (constVal && /Match$/.test(title) && !/Private/.test(title)) {
      matchTypes.add(constVal);
    }
  }
  return {
    pillars,
    severities,
    ossMatchTypes: [...matchTypes].sort(),
  };
}

function render({ pillars, severities, ossMatchTypes }, source) {
  const fmt = (xs) => xs.map((x) => `"${x}"`).join(', ');
  return [
    '/* eslint-disable */',
    '// Auto-generated from agent-readiness-insights-protocol. DO NOT EDIT.',
    `// Source: ${source}`,
    '// Regenerate via `node scripts/regen_protocol_constants.mjs` and commit.',
    '',
    `export type Pillar = ${pillars.map((p) => `"${p}"`).join(' | ')};`,
    `export type Severity = ${severities.map((s) => `"${s}"`).join(' | ')};`,
    '',
    `export const PILLARS: readonly Pillar[] = [${fmt(pillars)}] as const;`,
    `export const SEVERITIES: readonly Severity[] = [${fmt(severities)}] as const;`,
    `export const OSS_MATCH_TYPES: readonly string[] = [${fmt(ossMatchTypes)}] as const;`,
    '',
  ].join('\n');
}

async function main() {
  let schema;
  let source;
  try {
    schema = await fetchSchema();
    source = SCHEMA_URL;
  } catch (err) {
    console.warn(`[regen] live fetch failed (${err.message}); falling back to cache`);
    schema = loadCache();
    source = `${CACHE_PATH} (offline cache)`;
  }
  const constants = extract(schema);
  console.log(`[regen] derived:`, constants);
  writeFileSync(OUT_PATH, render(constants, source));
  console.log(`[regen] wrote ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(`[regen] fatal:`, err);
  process.exit(1);
});
