#!/bin/bash
# eas-build-pre-install.sh — runs BEFORE pnpm install on the EAS server.
#
# Three nukes:
#
#   1. expo-in-app-purchases (legacy Gradle-8.8-incompat package). Always purge.
#
#   2. @kiaanverse/{kiaan,sakha}-voice-native (LEGACY scoped name pre-PR-#1696).
#
#   3. kiaanverse-{kiaan,sakha}-voice-native (post-#1696 unscoped name, also
#      now stale per PR #1698 which removed `native/*` from pnpm-workspace.yaml).
#
# After PR #1698 the voice modules are NOT pnpm workspace packages anymore.
# pnpm install should not create symlinks for them in any node_modules. But
# EAS Build aggressively caches `node_modules` across builds, so any stale
# symlinks from prior structures (PRs #1685-#1697) MUST be wiped before pnpm
# install runs — otherwise the autolinker scans node_modules, finds them, and
# registers gradle modules pointing at the same workspace source dir as our
# plugin's explicit registration, producing AGP namespace collisions.
#
# Idempotent: rm -rf on non-existent paths is a no-op.

set -e

log() { echo "[eas-build-pre-install] $*"; }

# ─── 1. expo-in-app-purchases (legacy Gradle-8.8-incompat package) ───────
log "Removing expo-in-app-purchases from node_modules..."
rm -rf "$EAS_BUILD_WORKINGDIR/kiaanverse-mobile/node_modules/expo-in-app-purchases" 2>/dev/null || true
rm -rf "$EAS_BUILD_WORKINGDIR/node_modules/expo-in-app-purchases" 2>/dev/null || true
find "$EAS_BUILD_WORKINGDIR" \
  -type d -name "expo-in-app-purchases" -path "*/node_modules/*" \
  -exec rm -rf {} + 2>/dev/null || true
log "expo-in-app-purchases removed"

# ─── 2. ALL voice-native symlinks (scoped + unscoped) ────────────────────
log "Removing any voice-native symlinks (scoped @kiaanverse/* and unscoped kiaanverse-*)..."

# Direct paths first.
for ROOT in \
  "$EAS_BUILD_WORKINGDIR" \
  "$EAS_BUILD_WORKINGDIR/kiaanverse-mobile" \
  "$EAS_BUILD_WORKINGDIR/kiaanverse-mobile/apps/mobile"; do
  [ -d "$ROOT" ] || continue

  # Scoped (pre-PR-#1696)
  rm -rf "$ROOT/node_modules/@kiaanverse/kiaan-voice-native" 2>/dev/null || true
  rm -rf "$ROOT/node_modules/@kiaanverse/sakha-voice-native" 2>/dev/null || true

  # Unscoped (post-PR-#1696, pre-PR-#1698)
  rm -rf "$ROOT/node_modules/kiaanverse-kiaan-voice-native" 2>/dev/null || true
  rm -rf "$ROOT/node_modules/kiaanverse-sakha-voice-native" 2>/dev/null || true
done

# Sweep every node_modules tree as a backstop.
find "$EAS_BUILD_WORKINGDIR" \
  \( -type d -o -type l \) \
  \( -name "kiaan-voice-native" -o -name "sakha-voice-native" \) \
  -path "*/node_modules/@kiaanverse/*" \
  -exec rm -rf {} + 2>/dev/null || true

find "$EAS_BUILD_WORKINGDIR" \
  \( -type d -o -type l \) \
  \( -name "kiaanverse-kiaan-voice-native" -o -name "kiaanverse-sakha-voice-native" \) \
  -path "*/node_modules/*" \
  -exec rm -rf {} + 2>/dev/null || true

# Also wipe cached gradle build/ output for both naming conventions.
find "$EAS_BUILD_WORKINGDIR" \
  -type d \
  \( -path "*/@kiaanverse/kiaan-voice-native/android/build" \
     -o -path "*/@kiaanverse/sakha-voice-native/android/build" \
     -o -path "*/kiaanverse-kiaan-voice-native/android/build" \
     -o -path "*/kiaanverse-sakha-voice-native/android/build" \) \
  -exec rm -rf {} + 2>/dev/null || true

log "voice-native symlinks removed"
