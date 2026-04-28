#!/usr/bin/env node
/**
 * validate-wss-types.mjs — keep lib/wss-types.ts in sync with
 * backend/services/voice/wss_frames.py.
 *
 * The mobile WSS client and the FastAPI WSS handler MUST agree on every
 * frame type name. Drift between the two surfaces causes silent failures
 * (frames are dropped or rejected by Pydantic strict-mode) that are
 * extremely painful to debug from the mobile client.
 *
 * This script extracts the set of frame type-literal names from each
 * file and asserts they match. Run as part of CI:
 *
 *   pnpm --filter @kiaanverse/sakha-mobile run validate:wss-types
 *
 * Exit codes:
 *   0 — both sides match
 *   1 — drift detected (printed diff)
 *   2 — file missing or unreadable
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TS_PATH = resolve(__dirname, '..', 'lib', 'wss-types.ts');
// repo root is 4 levels up from apps/sakha-mobile/scripts/
const PY_PATH = resolve(
  __dirname,
  '..', '..', '..', '..',
  'backend',
  'services',
  'voice',
  'wss_frames.py',
);

function fail(msg, code = 1) {
  console.error('validate-wss-types: ' + msg);
  process.exit(code);
}

if (!existsSync(TS_PATH)) fail('missing ' + TS_PATH, 2);
if (!existsSync(PY_PATH)) fail('missing ' + PY_PATH, 2);

const tsCode = readFileSync(TS_PATH, 'utf8');
const pyCode = readFileSync(PY_PATH, 'utf8');

// Extract `type: 'foo.bar'` literals from the TS interface bodies.
const tsTypes = new Set();
for (const m of tsCode.matchAll(/^\s*type:\s*'([^']+)'/gm)) {
  tsTypes.add(m[1]);
}

// Extract `type: Literal["foo.bar"]` from the Python pydantic models.
const pyTypes = new Set();
for (const m of pyCode.matchAll(/^\s*type:\s*Literal\["([^"]+)"\]/gm)) {
  pyTypes.add(m[1]);
}

if (tsTypes.size === 0) fail('no TS frame types extracted');
if (pyTypes.size === 0) fail('no Python frame types extracted');

const onlyTs = [...tsTypes].filter((t) => !pyTypes.has(t)).sort();
const onlyPy = [...pyTypes].filter((t) => !tsTypes.has(t)).sort();

if (onlyTs.length === 0 && onlyPy.length === 0) {
  console.log(
    'validate-wss-types: OK — ' + tsTypes.size + ' frame types match',
  );
  console.log('  ' + [...tsTypes].sort().join(', '));
  process.exit(0);
}

console.error('validate-wss-types: DRIFT detected');
if (onlyTs.length) console.error('  only in TS: ' + onlyTs.join(', '));
if (onlyPy.length) console.error('  only in Py: ' + onlyPy.join(', '));
process.exit(1);
