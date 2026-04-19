#!/bin/bash
# Runs AFTER pnpm install on EAS. Purpose:
#   1. Remove the excluded expo-in-app-purchases package (autolinking guard).
#   2. Defensively patch expo-modules-core 1.12.26 PermissionsService.kt for
#      the Kotlin null-safety compile error triggered by compileSdk 35, in
#      case the pnpm patchedDependencies entry did not apply (e.g. stale
#      lockfile, cache mismatch, or phantom install path).
#
# See: patches/expo-modules-core@1.12.26.patch (primary fix).
set -eo pipefail

log() { echo "[eas-post-install] $*"; }

# ---- 1. Purge expo-in-app-purchases everywhere it may have been hoisted ----
log "Purging expo-in-app-purchases from all node_modules trees..."
find "${EAS_BUILD_WORKINGDIR:-$(pwd)/../..}" \
  -type d -name "expo-in-app-purchases" -path "*/node_modules/*" \
  -exec rm -rf {} + 2>/dev/null || true

# ---- 2. Defensive patch for expo-modules-core PermissionsService.kt ----
# Root cause: PackageInfo.requestedPermissions became @Nullable String[] in
# compileSdk 35, so `requestedPermissions.contains(permission)` fails Kotlin
# strict null checks with:
#   Only safe (?.) or non-null asserted (!!.) calls are allowed on a nullable
#   receiver of type Array<(out) String!>?
TARGETS=$(find "${EAS_BUILD_WORKINGDIR:-$(pwd)/../..}" \
  -path "*/expo-modules-core/android/src/main/java/expo/modules/adapters/react/permissions/PermissionsService.kt" \
  2>/dev/null || true)

if [ -z "$TARGETS" ]; then
  log "No PermissionsService.kt found — skipping defensive patch."
else
  for f in $TARGETS; do
    if grep -qF 'requestedPermissions?.contains(permission) ?: false' "$f"; then
      log "Already patched: $f"
      continue
    fi
    if grep -qF 'return requestedPermissions.contains(permission)' "$f"; then
      log "Patching: $f"
      # Use a pipe delimiter so the slashes in indentation do not confuse sed.
      sed -i.bak \
        's|return requestedPermissions\.contains(permission)|return requestedPermissions?.contains(permission) ?: false|' \
        "$f"
      rm -f "${f}.bak"
    else
      log "Unexpected content in $f — skipping (upstream may already be fixed)."
    fi
  done
fi

log "done"
