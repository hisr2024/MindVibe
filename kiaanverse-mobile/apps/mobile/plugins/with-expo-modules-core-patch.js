/**
 * with-expo-modules-core-patch.js
 *
 * Expo Config Plugin — patches expo-modules-core's PermissionsService.kt
 * during `expo prebuild`.
 *
 * Why this exists
 * ---------------
 * Third layer of defense (alongside pnpm `patchedDependencies` at the
 * monorepo root, and the app-local `postinstall` hook). Config plugins
 * run during Expo's own build pipeline (`expo prebuild`), which happens
 * AFTER install and BEFORE gradle on EAS. This makes the patch
 * independent of package-manager behavior and EAS install-phase hooks
 * (both of which have been unreliable for this monorepo).
 *
 * Problem being patched
 * ---------------------
 * On Android compileSdk 35 (Kotlin strict null-safety), expo-modules-core
 * 1.12.x fails to compile:
 *
 *   e: .../PermissionsService.kt:166:36 Only safe (?.) or non-null
 *   asserted (!!.) calls are allowed on a nullable receiver of type
 *   Array<(out) String!>?
 *
 * Offending line:
 *   return requestedPermissions.contains(permission)
 *
 * Rewritten to the null-safe form:
 *   return requestedPermissions?.contains(permission) ?: false
 *
 * Failure mode
 * ------------
 * Never throws — always returns the config. If the target file isn't
 * found (e.g. plugin evaluated before install completes, or module
 * layout changes), prebuild continues normally and one of the other
 * two patch layers will handle it.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Lazy require so that missing peer dep (shouldn't happen — expo brings
// @expo/config-plugins transitively) cannot crash config evaluation.
let withDangerousMod;
try {
  ({ withDangerousMod } = require('@expo/config-plugins'));
} catch (_err) {
  withDangerousMod = null;
}

const LOG_PREFIX = '[expo-modules-core-patch]';

const TARGET_RELATIVE = path.join(
  'expo-modules-core',
  'android',
  'src',
  'main',
  'java',
  'expo',
  'modules',
  'adapters',
  'react',
  'permissions',
  'PermissionsService.kt'
);

const ORIGINAL_LINE = 'return requestedPermissions.contains(permission)';
const PATCHED_LINE = 'return requestedPermissions?.contains(permission) ?: false';
const PATCHED_MARKER = 'requestedPermissions?.contains(permission) ?: false';

/**
 * Build the list of candidate node_modules roots to scan. Order does
 * not matter (we dedupe below), but we include every layout we have
 * observed on EAS and local monorepo setups.
 */
function buildCandidateNodeModulesRoots(projectRoot) {
  const candidates = [
    path.join(projectRoot, 'node_modules'),
    path.resolve(projectRoot, '..', 'node_modules'),
    path.resolve(projectRoot, '..', '..', 'node_modules'),
  ];
  if (process.env.EAS_BUILD_WORKINGDIR) {
    candidates.push(path.join(process.env.EAS_BUILD_WORKINGDIR, 'node_modules'));
  }
  return candidates;
}

/**
 * Return absolute path to the target file under `nodeModulesDir` if it
 * exists and is a regular file; else null.
 */
function resolveTargetFile(nodeModulesDir) {
  try {
    const candidate = path.join(nodeModulesDir, TARGET_RELATIVE);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return path.resolve(candidate);
    }
  } catch (_err) {
    // ignore permission / race errors
  }
  return null;
}

/**
 * Patch a single file. Idempotent: logs "already patched" if the safe
 * form is present, "patched" if we successfully rewrote the vulnerable
 * line, and is silent otherwise so prebuild logs stay clean.
 */
function patchFile(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.log(`${LOG_PREFIX} read failed: ${filePath} (${err && err.message})`);
    return;
  }

  if (content.includes(PATCHED_MARKER)) {
    console.log(`${LOG_PREFIX} already patched: ${filePath}`);
    return;
  }

  if (content.includes(ORIGINAL_LINE)) {
    try {
      const updated = content.replace(ORIGINAL_LINE, PATCHED_LINE);
      fs.writeFileSync(filePath, updated, 'utf8');
      console.log(`${LOG_PREFIX} patched: ${filePath}`);
    } catch (err) {
      console.log(`${LOG_PREFIX} write failed: ${filePath} (${err && err.message})`);
    }
    return;
  }

  // Unexpected content — another layer may have already transformed it
  // differently. Leave it alone rather than risk a bad edit.
}

/**
 * Perform the patch across every discovered target. Safe to call any
 * number of times.
 */
function runPatch(projectRoot) {
  try {
    const roots = buildCandidateNodeModulesRoots(projectRoot);
    const seen = new Set();
    for (const nmDir of roots) {
      const target = resolveTargetFile(nmDir);
      if (target && !seen.has(target)) {
        seen.add(target);
        patchFile(target);
      }
    }
  } catch (err) {
    // Never fail prebuild because of this plugin.
    console.log(
      `${LOG_PREFIX} unexpected error (ignored): ${err && err.stack ? err.stack : err}`
    );
  }
}

/**
 * Config plugin entry point. Hooks into the Android dangerous mod so
 * the file-system patch runs as part of `expo prebuild` on the android
 * platform, after install and before gradle configuration.
 */
function withExpoModulesCorePatch(config) {
  if (!withDangerousMod) {
    console.log(`${LOG_PREFIX} @expo/config-plugins not available — skipping`);
    return config;
  }

  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      try {
        const projectRoot =
          (modConfig.modRequest && modConfig.modRequest.projectRoot) || process.cwd();
        runPatch(projectRoot);
      } catch (err) {
        console.log(
          `${LOG_PREFIX} mod error (ignored): ${err && err.stack ? err.stack : err}`
        );
      }
      return modConfig;
    },
  ]);
}

module.exports = withExpoModulesCorePatch;
