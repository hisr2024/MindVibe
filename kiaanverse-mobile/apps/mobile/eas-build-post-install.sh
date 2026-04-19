#!/bin/bash
# The PermissionsService.kt patch for compileSdk 35 is now applied by:
#   - postinstall script:       ./scripts/patch-expo-modules-core.js
#   - Expo config plugin:       ./plugins/with-expo-modules-core-patch.js
#
# This hook only purges the deprecated expo-in-app-purchases package, which
# breaks Gradle 8.8 due to the removed `classifier` property. The script is
# intentionally non-failing — we do NOT `set -e` so transient find/rm errors
# can't fail the EAS build.

log() { echo "[eas-post-install] $*"; }

log "Purging expo-in-app-purchases from all node_modules trees..."

# Resolve candidate search roots. Missing paths are silently skipped.
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
