#!/usr/bin/env node
/**
 * validate-ios-bridge.mjs — offline validator for the iOS RN bridge.
 *
 * The Android side has `validate-bridge-coverage.mjs` which parses Kotlin
 * `@ReactMethod` annotations and ensures every JS-called method exists
 * natively. This script does the same for iOS by parsing:
 *
 *   • apps/mobile/native/ios/Sources/Bridge/<Module>Bridge.m
 *       — RCT_EXTERN_MODULE / RCT_EXTERN_REMAP_MODULE registrations
 *       — RCT_EXTERN_METHOD declarations (the ground truth for what JS sees)
 *
 *   • apps/mobile/native/ios/Sources/Bridge/<Module>Bridge.swift
 *       — supportedEvents() return list (events emitted to JS)
 *
 * Cross-references against:
 *
 *   • apps/mobile/types/<module>.ts
 *       — NativeModule interface (every method must have an iOS bridge)
 *       — _EVENTS const (every JS-subscribed event must be in supportedEvents)
 *
 * This catches the iOS analog of the bug `validate-bridge-coverage.mjs`
 * catches on Android: a JS hook calls `NativeModules.KiaanVoice.foo()` but
 * `foo` was never bridged → silent runtime failure with confusing error.
 *
 * Exit codes:
 *   0 — all checks pass
 *   1 — at least one check failed (with a diagnostic)
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MOBILE_ROOT = resolve(__dirname, '..');
const BRIDGE_DIR = resolve(MOBILE_ROOT, 'native/ios/Sources/Bridge');
const TYPES_DIR = resolve(MOBILE_ROOT, 'types');

let failures = 0;
function check(label, cond, detail) {
  if (cond) {
    console.log('OK   ' + label);
  } else {
    console.error('FAIL ' + label + (detail ? ': ' + detail : ''));
    failures++;
  }
}

// ─── Parsers ────────────────────────────────────────────────────────────

/**
 * Parse RCT_EXTERN_METHOD declarations from a .m file.
 * Returns the set of bridged method names (Swift selector first segment).
 *
 * Example input:
 *   RCT_EXTERN_METHOD(initialize:(NSDictionary *)config
 *                     resolver:(RCTPromiseResolveBlock)resolve
 *                     rejecter:(RCTPromiseRejectBlock)reject)
 * Returns: 'initialize'
 */
function parseExternMethods(objcSource) {
  const methods = new Set();
  const re = /RCT_EXTERN_METHOD\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*[:\(]/g;
  let m;
  while ((m = re.exec(objcSource)) !== null) {
    methods.add(m[1]);
  }
  return methods;
}

/**
 * Parse the JS-facing module name from RCT_EXTERN_MODULE or
 * RCT_EXTERN_REMAP_MODULE declaration.
 *
 * Example input: RCT_EXTERN_REMAP_MODULE(KiaanVoice, KiaanVoiceBridge, RCTEventEmitter)
 * Returns: 'KiaanVoice'
 *
 * Example input: RCT_EXTERN_MODULE(KiaanVoiceBridge, RCTEventEmitter)
 * Returns: 'KiaanVoiceBridge'
 */
function parseModuleName(objcSource) {
  const remapRe = /RCT_EXTERN_REMAP_MODULE\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*,/;
  const externRe = /RCT_EXTERN_MODULE\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*,/;
  const remapMatch = objcSource.match(remapRe);
  if (remapMatch) return remapMatch[1];
  const externMatch = objcSource.match(externRe);
  if (externMatch) return externMatch[1];
  return null;
}

/**
 * Parse the supportedEvents() return list from a Swift bridge source.
 * Looks for the `override func supportedEvents()` block and extracts the
 * string literals inside the returned array.
 */
function parseSupportedEvents(swiftSource) {
  const blockRe = /override\s+func\s+supportedEvents\s*\(\s*\)\s*->\s*\[String\][^{]*\{([\s\S]*?)\}/;
  const blockMatch = swiftSource.match(blockRe);
  if (!blockMatch) return new Set();
  const block = blockMatch[1];
  const events = new Set();
  const litRe = /"([^"]+)"/g;
  let m;
  while ((m = litRe.exec(block)) !== null) {
    events.add(m[1]);
  }
  return events;
}

/**
 * Parse the JS bridge contract from a TypeScript types file.
 * Looks for an `interface <Module>NativeModule { ... }` block and extracts
 * method names (line-leading identifier followed by '(' or ':').
 *
 * Also returns the EVENTS const map values.
 */
function parseTSContract(tsSource, interfaceName, eventsConstName) {
  const ifaceRe = new RegExp(
    `export\\s+interface\\s+${interfaceName}\\s*\\{([\\s\\S]*?)^\\}`,
    'm',
  );
  const ifaceMatch = tsSource.match(ifaceRe);
  const methods = new Set();
  if (ifaceMatch) {
    const body = ifaceMatch[1];
    const methodRe = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*\(/gm;
    let m;
    while ((m = methodRe.exec(body)) !== null) {
      methods.add(m[1]);
    }
  }
  const events = new Set();
  if (eventsConstName) {
    const constRe = new RegExp(
      `export\\s+const\\s+${eventsConstName}\\s*=\\s*\\{([\\s\\S]*?)\\}\\s*as\\s+const`,
    );
    const constMatch = tsSource.match(constRe);
    if (constMatch) {
      const body = constMatch[1];
      const litRe = /:\s*'([^']+)'/g;
      let m;
      while ((m = litRe.exec(body)) !== null) {
        events.add(m[1]);
      }
    }
  }
  return { methods, events };
}

// ─── Module audits ──────────────────────────────────────────────────────

const AUDITS = [
  {
    moduleName: 'KiaanVoice',
    bridgeM: 'KiaanVoiceBridge.m',
    bridgeSwift: 'KiaanVoiceBridge.swift',
    typesFile: 'kiaanVoice.ts',
    interfaceName: 'KiaanVoiceNativeModule',
    eventsConstName: 'KIAAN_VOICE_EVENTS',
    // RN injects these two for every NativeEventEmitter — they don't
    // need a corresponding RCT_EXTERN_METHOD declaration.
    rnEventEmitterBuiltins: ['addListener', 'removeListeners'],
  },
];

for (const audit of AUDITS) {
  const objcPath = resolve(BRIDGE_DIR, audit.bridgeM);
  const swiftPath = resolve(BRIDGE_DIR, audit.bridgeSwift);
  const tsPath = resolve(TYPES_DIR, audit.typesFile);

  if (!existsSync(objcPath)) {
    check(`${audit.moduleName}: ${audit.bridgeM} exists`, false, `not found at ${objcPath}`);
    continue;
  }
  if (!existsSync(swiftPath)) {
    check(`${audit.moduleName}: ${audit.bridgeSwift} exists`, false, `not found at ${swiftPath}`);
    continue;
  }
  if (!existsSync(tsPath)) {
    check(`${audit.moduleName}: ${audit.typesFile} exists`, false, `not found at ${tsPath}`);
    continue;
  }

  const objcSrc = readFileSync(objcPath, 'utf8');
  const swiftSrc = readFileSync(swiftPath, 'utf8');
  const tsSrc = readFileSync(tsPath, 'utf8');

  const declaredModuleName = parseModuleName(objcSrc);
  const externMethods = parseExternMethods(objcSrc);
  const swiftEvents = parseSupportedEvents(swiftSrc);
  const { methods: tsMethods, events: tsEvents } = parseTSContract(
    tsSrc,
    audit.interfaceName,
    audit.eventsConstName,
  );

  // Module name must match what JS expects.
  check(
    `${audit.moduleName}: RCT_EXTERN_(REMAP_)MODULE registers JS name "${audit.moduleName}"`,
    declaredModuleName === audit.moduleName,
    `got "${declaredModuleName}", expected "${audit.moduleName}"`,
  );

  // Method coverage: every TS interface method must have an RCT_EXTERN_METHOD.
  for (const tsMethod of tsMethods) {
    if (audit.rnEventEmitterBuiltins.includes(tsMethod)) continue;
    check(
      `${audit.moduleName}: TS method "${tsMethod}" is bridged`,
      externMethods.has(tsMethod),
      `RCT_EXTERN_METHOD(${tsMethod}:...) not found in ${audit.bridgeM}`,
    );
  }

  // Reverse coverage: warn if a Swift bridge declares a method JS never uses.
  // (Not a failure — could be legitimate future API — but worth surfacing.)
  for (const m of externMethods) {
    if (!tsMethods.has(m)) {
      console.log(
        `INFO ${audit.moduleName}: bridge method "${m}" is not declared in ` +
          `${audit.interfaceName} — TS callers won't know it exists.`,
      );
    }
  }

  // Event coverage: every supportedEvents entry must appear as a value of
  // the JS EVENTS const, and vice-versa.
  for (const swiftEvt of swiftEvents) {
    check(
      `${audit.moduleName}: Swift event "${swiftEvt}" is in TS ${audit.eventsConstName}`,
      tsEvents.has(swiftEvt),
      `JS will not have a name to subscribe with`,
    );
  }
  for (const tsEvt of tsEvents) {
    check(
      `${audit.moduleName}: TS event "${tsEvt}" is emitted by Swift supportedEvents()`,
      swiftEvents.has(tsEvt),
      `native side will reject NativeEventEmitter subscription with "Sending '<name>' with no listeners registered"`,
    );
  }
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nvalidate-ios-bridge: all checks passed');
