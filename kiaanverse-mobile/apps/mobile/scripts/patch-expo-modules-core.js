#!/usr/bin/env node
/**
 * patch-expo-modules-core.js
 *
 * Postinstall patcher for expo-modules-core's PermissionsService.kt.
 *
 * Problem
 * -------
 * When building with Android compileSdk 35 (Kotlin strict null-safety),
 * expo-modules-core 1.12.x fails to compile:
 *
 *   e: .../PermissionsService.kt:166:36 Only safe (?.) or non-null
 *   asserted (!!.) calls are allowed on a nullable receiver of type
 *   Array<(out) String!>?
 *
 * The offending line is:
 *   return requestedPermissions.contains(permission)
 *
 * We rewrite it to the null-safe form:
 *   return requestedPermissions?.contains(permission) ?: false
 *
 * Why a postinstall hook
 * ----------------------
 * - pnpm `patchedDependencies` is defined at the monorepo root, but
 *   EAS Build treats `apps/mobile` as the project root and ignores it.
 * - `eas-build-post-install` lifecycle scripts have proven unreliable
 *   on this Expo monorepo (no log lines ever appeared in the build).
 * - The standard npm `postinstall` lifecycle is executed by every
 *   package manager (npm / pnpm / yarn) regardless of EAS config,
 *   so this is the most robust place to patch.
 *
 * Behaviour
 * ---------
 * - Search strategy: walk upward from __dirname collecting any
 *   `node_modules` directories, plus a few well-known absolute
 *   fallback roots (EAS working dir, monorepo root, /home/expo/workingdir).
 * - Each discovered `node_modules` is checked for the target file.
 * - Found files are deduped via a Set.
 * - For each file: skip if already patched, patch if the original
 *   vulnerable line is present, otherwise log an "unexpected content"
 *   warning and skip.
 * - Exit code is always 0: install must never fail because of this
 *   script (the file may legitimately not exist yet at certain stages).
 */

'use strict';

const fs = require('fs');
const path = require('path');

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

const LOG_PREFIX = '[patch-expo-modules-core]';

/**
 * Walk upward from `startDir` collecting absolute paths of every
 * `node_modules` directory encountered. Walks until filesystem root.
 */
function collectAncestorNodeModules(startDir) {
  const found = [];
  let current = path.resolve(startDir);
  // Guard against infinite loops on pathological paths.
  for (let i = 0; i < 32; i++) {
    const candidate = path.join(current, 'node_modules');
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
        found.push(candidate);
      }
    } catch (_err) {
      // ignore permission/race errors
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return found;
}

/**
 * Recursively collect `node_modules` directories under `root` up to
 * `maxDepth` levels deep. Used for absolute fallback roots where we
 * don't know the precise layout (e.g. /home/expo/workingdir).
 */
function collectDescendantNodeModules(root, maxDepth) {
  const found = [];
  if (!root) return found;
  let rootStat;
  try {
    rootStat = fs.statSync(root);
  } catch (_err) {
    return found;
  }
  if (!rootStat.isDirectory()) return found;

  const stack = [{ dir: root, depth: 0 }];
  while (stack.length > 0) {
    const { dir, depth } = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (_err) {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const abs = path.join(dir, entry.name);
      if (entry.name === 'node_modules') {
        found.push(abs);
        // Do not descend into node_modules to look for nested node_modules;
        // ancestor walk from here would be expensive. The caller already
        // handles nested scope via the TARGET_RELATIVE lookup.
        continue;
      }
      // Skip common heavy / irrelevant directories to keep this cheap.
      if (
        entry.name === '.git' ||
        entry.name === '.expo' ||
        entry.name === 'ios' ||
        entry.name === 'android' ||
        entry.name === 'dist' ||
        entry.name === 'build' ||
        entry.name.startsWith('.')
      ) {
        continue;
      }
      if (depth + 1 <= maxDepth) {
        stack.push({ dir: abs, depth: depth + 1 });
      }
    }
  }
  return found;
}

/**
 * For a given node_modules directory, return the absolute path to the
 * target PermissionsService.kt if it exists, else null.
 */
function targetInNodeModules(nodeModulesDir) {
  const candidate = path.join(nodeModulesDir, TARGET_RELATIVE);
  try {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  } catch (_err) {
    // ignore
  }
  return null;
}

function patchFile(filePath, stats) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.log(`${LOG_PREFIX} read failed: ${filePath} (${err.message})`);
    return;
  }

  if (content.includes(PATCHED_MARKER)) {
    console.log(`${LOG_PREFIX} already patched: ${filePath}`);
    return;
  }

  if (content.includes(ORIGINAL_LINE)) {
    const updated = content.replace(ORIGINAL_LINE, PATCHED_LINE);
    try {
      fs.writeFileSync(filePath, updated, 'utf8');
      stats.patched += 1;
      console.log(`${LOG_PREFIX} patched: ${filePath}`);
    } catch (err) {
      console.log(`${LOG_PREFIX} write failed: ${filePath} (${err.message})`);
    }
    return;
  }

  console.log(`${LOG_PREFIX} unexpected content: ${filePath}`);
}

function main() {
  const stats = { patched: 0 };
  const nodeModulesDirs = new Set();

  // Strategy 1: walk upward from this script's location.
  for (const dir of collectAncestorNodeModules(__dirname)) {
    nodeModulesDirs.add(dir);
  }

  // Strategy 2: known absolute fallback roots.
  const fallbackRoots = [
    process.env.EAS_BUILD_WORKINGDIR,
    path.resolve(__dirname, '..', '..', '..'), // monorepo root
    '/home/expo/workingdir',
  ].filter(Boolean);

  for (const root of fallbackRoots) {
    // Also walk ancestors of the fallback root in case of nested layouts.
    for (const dir of collectAncestorNodeModules(root)) {
      nodeModulesDirs.add(dir);
    }
    for (const dir of collectDescendantNodeModules(root, 6)) {
      nodeModulesDirs.add(dir);
    }
  }

  // Resolve to unique target files.
  const targetFiles = new Set();
  for (const nmDir of nodeModulesDirs) {
    const target = targetInNodeModules(nmDir);
    if (target) targetFiles.add(path.resolve(target));
  }

  for (const file of targetFiles) {
    patchFile(file, stats);
  }

  console.log(
    `${LOG_PREFIX} done (patched ${stats.patched} / found ${targetFiles.size})`
  );
}

try {
  main();
} catch (err) {
  // Never fail install because of this script.
  console.log(`${LOG_PREFIX} unexpected error (ignored): ${err && err.stack ? err.stack : err}`);
}

process.exit(0);
