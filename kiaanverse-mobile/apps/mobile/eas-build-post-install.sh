#!/bin/bash
# eas-build-post-install.sh — runs AFTER pnpm install on the EAS server.
#
# The PermissionsService.kt patch for compileSdk 35 is applied by:
#   - postinstall script:       ./scripts/patch-expo-modules-core.js
#   - Expo config plugin:       ./plugins/with-expo-modules-core-patch.js
#
# Single nuke here: expo-in-app-purchases (legacy Gradle-8.8-incompat package).
#
# NOTE: PR #1689 removed the previous voice-native symlink nuke. The voice
# native packages (@kiaanverse/{kiaan,sakha}-voice-native) are now expected
# in apps/mobile/node_modules — pnpm hoists them as workspace packages and
# the autolinker uses them to register :kiaanverse_{X}-voice-native gradle
# modules. We need them present, not removed.
#
# We do NOT `set -e` so transient find / rm errors can't fail the build.

log() { echo "[eas-post-install] $*"; }

log "Purging expo-in-app-purchases from all node_modules trees..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd)" || SCRIPT_DIR="."
CANDIDATES=(
  "${EAS_BUILD_WORKINGDIR:-}"
  "${SCRIPT_DIR}/../.."
  "/home/expo/workingdir"
)

for root in "${CANDIDATES[@]}"; do
  [ -n "$root" ] && [ -d "$root" ] || continue
  find "$root" \
    -type d -name "expo-in-app-purchases" -path "*/node_modules/*" \
    -exec rm -rf {} + 2>/dev/null || true
done

log "done"
exit 0
