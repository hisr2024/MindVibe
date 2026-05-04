#!/bin/bash
# eas-build-post-install.sh — runs AFTER pnpm install on the EAS server.
#
# The PermissionsService.kt patch for compileSdk 35 is applied by:
#   - postinstall script:       ./scripts/patch-expo-modules-core.js
#   - Expo config plugin:       ./plugins/with-expo-modules-core-patch.js
#
# This hook handles two post-install nukes:
#
#   1. expo-in-app-purchases (legacy): the package breaks Gradle 8.8 due to a
#      removed `classifier` property. Always purge.
#
#   2. @kiaanverse/{kiaan,sakha}-voice-native (PR #1688 backstop): paired with
#      the same nuke in eas-build-pre-install.sh. Defensive — pnpm with the
#      current code (PR #1687: native/* removed from pnpm-workspace.yaml,
#      package.json files deleted, host-side react-native.config.js opt-out,
#      Expo autolinking.exclude entries) should NOT create symlinks for these
#      packages, but the EAS build server has demonstrated aggressive caching
#      that survives --clear-cache. Running this AGAIN after pnpm install
#      catches any symlinks that somehow re-materialised between pre-install
#      and now. Idempotent: if the targets don't exist, rm exits cleanly.
#
# We do NOT `set -e` so transient find / rm errors can't fail the build.

log() { echo "[eas-post-install] $*"; }

# Resolve candidate search roots. Missing paths are silently skipped.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd)" || SCRIPT_DIR="."
CANDIDATES=(
  "${EAS_BUILD_WORKINGDIR:-}"
  "${SCRIPT_DIR}/../.."
  "/home/expo/workingdir"
)

# ─── 1. expo-in-app-purchases (legacy Gradle-8.8-incompat package) ───────
log "Purging expo-in-app-purchases from all node_modules trees..."
for root in "${CANDIDATES[@]}"; do
  [ -n "$root" ] && [ -d "$root" ] || continue
  find "$root" \
    -type d -name "expo-in-app-purchases" -path "*/node_modules/*" \
    -exec rm -rf {} + 2>/dev/null || true
done

# ─── 2. @kiaanverse/{kiaan,sakha}-voice-native (autolink-duplicate guard) ─
log "Purging any cached voice-native symlinks from all node_modules trees..."
for root in "${CANDIDATES[@]}"; do
  [ -n "$root" ] && [ -d "$root" ] || continue

  # Direct paths first (canonical pnpm hoist locations).
  rm -rf "$root/node_modules/@kiaanverse/kiaan-voice-native" 2>/dev/null || true
  rm -rf "$root/node_modules/@kiaanverse/sakha-voice-native" 2>/dev/null || true
  rm -rf "$root/apps/mobile/node_modules/@kiaanverse/kiaan-voice-native" 2>/dev/null || true
  rm -rf "$root/apps/mobile/node_modules/@kiaanverse/sakha-voice-native" 2>/dev/null || true

  # Sweep every node_modules tree as a backstop (catches any depth).
  find "$root" \
    \( -type d -o -type l \) \
    \( -name "kiaan-voice-native" -o -name "sakha-voice-native" \) \
    -path "*/node_modules/@kiaanverse/*" \
    -exec rm -rf {} + 2>/dev/null || true
done

log "done"
exit 0
