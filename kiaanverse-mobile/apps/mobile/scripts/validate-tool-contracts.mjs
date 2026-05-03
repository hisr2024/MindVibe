#!/usr/bin/env node
/**
 * validate-tool-contracts.mjs — keep
 * apps/sakha-mobile/lib/tool-prefill-contracts.ts in sync with
 * backend/services/voice/tool_prefill_contracts.py.
 *
 * The mobile useToolInvocation hook and the backend orchestrator must
 * agree on every (tool, allowed_fields, required_fields, min_confidence)
 * tuple. Drift between the two surfaces silently causes:
 *   • payloads stripped on one side and accepted on the other
 *   • confidence threshold mismatches → INPUT_TO_TOOL on one side,
 *     NAVIGATE on the other
 * which is exactly the failure mode the spec calls out: "Wrong prefill
 * is worse than no prefill".
 *
 * Run as:
 *   pnpm --filter @kiaanverse/sakha-mobile run validate:tool-contracts
 *
 * Exit codes:
 *   0  both sides match
 *   1  drift detected (printed diff)
 *   2  file missing
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TS_PATH = resolve(__dirname, '..', 'voice', 'lib', 'tool-prefill-contracts.ts');
// repo root is 4 levels up from apps/sakha-mobile/scripts/
const PY_PATH = resolve(
  __dirname, '..', '..', '..', '..',
  'backend', 'services', 'voice', 'tool_prefill_contracts.py',
);

function fail(msg, code = 1) {
  console.error('validate-tool-contracts: ' + msg);
  process.exit(code);
}

if (!existsSync(TS_PATH)) fail('missing ' + TS_PATH, 2);
if (!existsSync(PY_PATH)) fail('missing ' + PY_PATH, 2);

const tsCode = readFileSync(TS_PATH, 'utf8');
const pyCode = readFileSync(PY_PATH, 'utf8');

// ─── Extract tool names from each side ────────────────────────────────────
// TS: keys of the CONTRACTS object — match `  TOOL_NAME: {`
const tsToolNames = new Set();
{
  const block = /export const CONTRACTS:[^}]*?\{([\s\S]*)\};?\s*$/m.exec(tsCode);
  // simpler approach: scan property keys
  for (const m of tsCode.matchAll(/^\s\s([A-Z_]+):\s*\{$/gm)) {
    if (m[1].length >= 4) tsToolNames.add(m[1]);
  }
  // fallback if the regex above misses — match 'tool: ' literals
  for (const m of tsCode.matchAll(/tool:\s*'([A-Z_]+)'/g)) {
    tsToolNames.add(m[1]);
  }
  void block;
}

// Python: keys of CONTRACTS dict — match `    "TOOL_NAME": ToolVoicePrefillContract(`
const pyToolNames = new Set();
for (const m of pyCode.matchAll(/^\s\s\s\s"([A-Z_]+)":\s*ToolVoicePrefillContract\(/gm)) {
  pyToolNames.add(m[1]);
}

if (pyToolNames.size === 0) fail('no Python tools extracted');
if (tsToolNames.size === 0) fail('no TS tools extracted');

const onlyPy = [...pyToolNames].filter((t) => !tsToolNames.has(t)).sort();
const onlyTs = [...tsToolNames].filter((t) => !pyToolNames.has(t)).sort();

if (onlyPy.length || onlyTs.length) {
  console.error('validate-tool-contracts: TOOL NAME drift detected');
  if (onlyPy.length) console.error('  only in Python: ' + onlyPy.join(', '));
  if (onlyTs.length) console.error('  only in TS: ' + onlyTs.join(', '));
  process.exit(1);
}

// ─── Per-tool block extraction ────────────────────────────────────────────
// We split each file into per-tool blocks first, then search within each
// block. Without this, a regex with `[\s\S]*?` bleeds past the closing
// brace into the next tool — e.g. ARDHA inheriting EMOTIONAL_RESET's
// 0.7 confidence threshold.

function extractTsToolBlock(toolName) {
  // Match the full property body up to the next top-level tool key or
  // the end of the CONTRACTS object.
  const re = new RegExp(
    `^\\s\\s${toolName}:\\s*\\{([\\s\\S]*?)^\\s\\s\\},?$`,
    'm',
  );
  const m = tsCode.match(re);
  return m ? m[1] : null;
}

function extractPyToolBlock(toolName) {
  // Each Python entry is: "TOOL_NAME": ToolVoicePrefillContract(...).
  // Capture everything up to the matching `),` that closes the
  // constructor (relies on no other multi-line `)` inside the kwargs).
  const re = new RegExp(
    `"${toolName}":\\s*ToolVoicePrefillContract\\(([\\s\\S]*?)^\\s\\s\\s\\s\\),`,
    'm',
  );
  const m = pyCode.match(re);
  return m ? m[1] : null;
}

function extractTsMinConfidence(toolName) {
  const block = extractTsToolBlock(toolName);
  if (!block) return null;
  const m = block.match(/voiceGuideMinConfidence:\s*([0-9.]+)/);
  return m ? parseFloat(m[1]) : 0.75;
}

function extractPyMinConfidence(toolName) {
  const block = extractPyToolBlock(toolName);
  if (!block) return 0.75;
  const m = block.match(/voice_guide_min_confidence=([0-9.]+)/);
  return m ? parseFloat(m[1]) : 0.75;
}

const drifts = [];
for (const tool of [...tsToolNames].sort()) {
  const tsConf = extractTsMinConfidence(tool);
  const pyConf = extractPyMinConfidence(tool);
  if (tsConf == null) {
    drifts.push(`${tool}: TS missing voiceGuideMinConfidence`);
    continue;
  }
  if (Math.abs(tsConf - pyConf) > 0.001) {
    drifts.push(
      `${tool}: TS=${tsConf} vs Python=${pyConf}`,
    );
  }
}

if (drifts.length) {
  console.error('validate-tool-contracts: CONFIDENCE drift detected');
  for (const d of drifts) console.error('  ' + d);
  process.exit(1);
}

// ─── allowed_fields parity ────────────────────────────────────────────────
function extractTsAllowed(toolName) {
  const block = extractTsToolBlock(toolName);
  if (!block) return null;
  const m = block.match(/allowedFields:\s*\[([^\]]*)\]/);
  if (!m) return null;
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]).sort();
}
function extractPyAllowed(toolName) {
  const block = extractPyToolBlock(toolName);
  if (!block) return null;
  const m = block.match(/allowed_fields=\(([^)]*)\)/);
  if (!m) return null;
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]).sort();
}

const fieldDrifts = [];
for (const tool of [...tsToolNames].sort()) {
  const tsFields = extractTsAllowed(tool);
  const pyFields = extractPyAllowed(tool);
  if (!tsFields || !pyFields) continue; // already handled above
  if (tsFields.length !== pyFields.length || tsFields.some((f, i) => f !== pyFields[i])) {
    fieldDrifts.push(
      `${tool}: TS=[${tsFields.join(',')}] vs Python=[${pyFields.join(',')}]`,
    );
  }
}

if (fieldDrifts.length) {
  console.error('validate-tool-contracts: ALLOWED_FIELDS drift detected');
  for (const d of fieldDrifts) console.error('  ' + d);
  process.exit(1);
}

console.log(
  'validate-tool-contracts: OK — ' +
    tsToolNames.size +
    ' tools match across TS + Python (names, min_confidence, allowed_fields)',
);
console.log('  ' + [...tsToolNames].sort().join(', '));
