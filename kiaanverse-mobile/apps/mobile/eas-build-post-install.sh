#!/bin/bash
# eas-build-post-install.sh — runs AFTER pnpm install on the EAS server.
#
# The PermissionsService.kt patch for compileSdk 35 is applied by:
#   - postinstall script:       ./scripts/patch-expo-modules-core.js
#   - Expo config plugin:       ./plugins/with-expo-modules-core-patch.js
#
# Two nukes:
#
#   1. expo-in-app-purchases (legacy Gradle-8.8-incompat package).
#
#   2. @kiaanverse/{kiaan,sakha}-voice-native symlinks (LEGACY scoped
#      names — renamed to unscoped in PR #1696). Belt-and-braces with
#      eas-build-pre-install.sh: if pnpm install somehow re-materialises
#      a stale scoped symlink between the pre-install nuke and now, this
#      catches it before the autolinker scans node_modules.
#
# We do NOT `set -e` so transient find / rm errors can't fail the build.

log() { echo "[eas-post-install] $*"; }

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

# ─── 2. Stale @kiaanverse/{kiaan,sakha}-voice-native symlinks ────────────
log "Purging any stale @kiaanverse-scoped voice-native symlinks..."
for root in "${CANDIDATES[@]}"; do
  [ -n "$root" ] && [ -d "$root" ] || continue

  # Direct paths first (canonical pnpm hoist locations).
  rm -rf "$root/node_modules/@kiaanverse/kiaan-voice-native" 2>/dev/null || true
  rm -rf "$root/node_modules/@kiaanverse/sakha-voice-native" 2>/dev/null || true
  rm -rf "$root/apps/mobile/node_modules/@kiaanverse/kiaan-voice-native" 2>/dev/null || true
  rm -rf "$root/apps/mobile/node_modules/@kiaanverse/sakha-voice-native" 2>/dev/null || true

  # Sweep every node_modules tree as a backstop.
  find "$root" \
    \( -type d -o -type l \) \
    \( -name "kiaan-voice-native" -o -name "sakha-voice-native" \) \
    -path "*/node_modules/@kiaanverse/*" \
    -exec rm -rf {} + 2>/dev/null || true
done

log "done"
exit 0
