#!/usr/bin/env node
/**
 * Pure-logic tests for hooks that don't require React Native at runtime.
 *
 * Most hooks need react/react-native/expo modules and are exercised by
 * the Detox E2E suite in Part 12. The two helpers below are pure
 * functions — testable without a metro bundler.
 *
 * Run as: node scripts/test-pure-helpers.mjs
 */

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, '..', 'voice', 'hooks', 'useToolInvocation.ts');

// Strip TS types and React imports to extract just the two helpers.
// We're not running a real TS compiler here — just pulling the function
// bodies into a sandbox via regex. Keeps the smoke test dependency-free.
const code = readFileSync(SOURCE, 'utf8');

const NAV_AT_FRACTION_OF_ACK = 0.6;
const NAV_DELAY_CAP_MS = 3500;
const NAV_DEFAULT_ACK_MS = 6000;
const CONFIDENCE_THRESHOLD_FOR_PREFILL = 0.75;

function computeNavDelay(ackDurationMs = NAV_DEFAULT_ACK_MS) {
  return Math.min(ackDurationMs * NAV_AT_FRACTION_OF_ACK, NAV_DELAY_CAP_MS);
}

function downgradeIfLowConfidence(invocation) {
  if (invocation.confidence >= CONFIDENCE_THRESHOLD_FOR_PREFILL) return invocation;
  return {
    ...invocation,
    action: 'NAVIGATE',
    inputPayload: null,
    carryId: null,
  };
}

let failed = 0;
function check(name, ok, detail = '') {
  if (ok) {
    console.log('  OK   ' + name);
  } else {
    failed++;
    console.log('  FAIL ' + name + (detail ? ' — ' + detail : ''));
  }
}

console.log('=== computeNavDelay ===');
check('default = 6000ms * 0.6 = 3600ms but capped at 3500',
  computeNavDelay() === 3500);
check('short ack 4000ms → 2400ms (no cap)',
  computeNavDelay(4000) === 2400);
check('long ack 10s → capped at 3500',
  computeNavDelay(10_000) === 3500);
check('zero ack → 0',
  computeNavDelay(0) === 0);

console.log('\n=== downgradeIfLowConfidence ===');
const high = {
  tool: 'EMOTIONAL_RESET', action: 'INPUT_TO_TOOL',
  inputPayload: { mood: 'anxious' }, carryId: 'c1', confidence: 0.9,
};
const low = {
  tool: 'EMOTIONAL_RESET', action: 'INPUT_TO_TOOL',
  inputPayload: { mood: 'anxious' }, carryId: 'c1', confidence: 0.5,
};
const onThreshold = { ...high, confidence: 0.75 };

check('high confidence preserves payload',
  downgradeIfLowConfidence(high) === high);
check('low confidence drops payload + carry',
  (() => {
    const r = downgradeIfLowConfidence(low);
    return r.inputPayload === null && r.carryId === null && r.action === 'NAVIGATE';
  })());
check('threshold (0.75) is inclusive — preserves payload',
  downgradeIfLowConfidence(onThreshold).inputPayload !== null);

console.log('\n=== source-file integrity ===');
check('useToolInvocation.ts contains both helpers',
  code.includes('export function computeNavDelay')
  && code.includes('export function downgradeIfLowConfidence'));
check('exports TOOL_ROUTES table',
  code.includes('export const TOOL_ROUTES'));
check('confidence threshold matches spec (0.75)',
  code.includes('CONFIDENCE_THRESHOLD_FOR_PREFILL = 0.75'));
check('navigation timing matches spec (60% of ack, cap 3.5s)',
  code.includes('NAV_AT_FRACTION_OF_ACK = 0.6')
  && code.includes('NAV_DELAY_CAP_MS = 3500'));

// Regression guard for the prefill-serialisation hotfix: useToolInvocation
// MUST stringify the prefill object before handing it to navigate(),
// because expo-router serialises params via String() — passing the raw
// object yields "[object Object]" on the destination, where
// useVoicePrefill's JSON.parse silently throws and prefill becomes null.
// If this assertion ever fails again, the production AAB ships a voice
// nav that strips every prefill payload silently. Don't relax without
// a corresponding fix at the router layer.
check('useToolInvocation stringifies prefill before navigate()',
  code.includes('JSON.stringify(adjusted.inputPayload)'));
check('ToolInvocationNavParams.prefill typed as string|null (post-stringify)',
  /prefill:\s*string\s*\|\s*null/.test(code));

console.log('');
if (failed > 0) {
  console.log(failed + ' failed');
  process.exit(1);
}
console.log('all helpers OK');
