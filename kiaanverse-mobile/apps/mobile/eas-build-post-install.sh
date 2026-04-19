#!/bin/bash
# Runs AFTER pnpm install on EAS. Purpose:
#   1. Remove the excluded expo-in-app-purchases package (autolinking guard).
#   2. Defensively patch expo-modules-core 1.12.26 PermissionsService.kt for
#      the Kotlin null-safety compile error triggered by compileSdk 35, in
#      case the pnpm patchedDependencies entry did not apply (e.g. on EAS
#      where apps/mobile is treated as the project root and pnpm ignores
#      the monorepo-root patchedDependencies key).
#
# Why multiple search roots?
#   On EAS, $EAS_BUILD_WORKINGDIR is set to apps/mobile, so a find rooted
#   there never traverses the hoisted node_modules at the pnpm workspace
#   root. We therefore sweep:
#     a) $EAS_BUILD_WORKINGDIR (when set) — covers local installs
#     b) script dir walked up 2 levels — the kiaanverse-mobile monorepo
#        root where pnpm hoists dependencies
#     c) /home/expo/workingdir — the default EAS workspace root, as a
#        final defensive sweep in case the checkout layout changes
#
# See: patches/expo-modules-core@1.12.26.patch (primary fix, local only).
set -eo pipefail

log() { echo "[eas-post-install] $*"; }

# ---- Build the list of candidate search roots ------------------------------
# Use an array so we can dedupe and skip missing paths cleanly.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

CANDIDATE_ROOTS=()
if [ -n "${EAS_BUILD_WORKINGDIR:-}" ] && [ -d "${EAS_BUILD_WORKINGDIR}" ]; then
  CANDIDATE_ROOTS+=("${EAS_BUILD_WORKINGDIR}")
fi
if [ -d "${MONOREPO_ROOT}" ]; then
  CANDIDATE_ROOTS+=("${MONOREPO_ROOT}")
fi
if [ -d "/home/expo/workingdir" ]; then
  CANDIDATE_ROOTS+=("/home/expo/workingdir")
fi

# Dedupe (preserving order) — two candidates may resolve to the same path.
SEARCH_ROOTS=()
for root in "${CANDIDATE_ROOTS[@]}"; do
  skip=0
  for seen in "${SEARCH_ROOTS[@]:-}"; do
    if [ "$root" = "$seen" ]; then
      skip=1
      break
    fi
  done
  if [ "$skip" -eq 0 ]; then
    SEARCH_ROOTS+=("$root")
  fi
done

if [ "${#SEARCH_ROOTS[@]}" -eq 0 ]; then
  log "No search roots resolved — nothing to do."
  exit 0
fi

log "Search roots: ${SEARCH_ROOTS[*]}"

# ---- 1. Purge expo-in-app-purchases everywhere it may have been hoisted ----
log "Purging expo-in-app-purchases from all node_modules trees..."
for root in "${SEARCH_ROOTS[@]}"; do
  find "$root" \
    -type d -name "expo-in-app-purchases" -path "*/node_modules/*" \
    -exec rm -rf {} + 2>/dev/null || true
done

# ---- 2. Defensive patch for expo-modules-core PermissionsService.kt --------
# Root cause: PackageInfo.requestedPermissions became @Nullable String[] in
# compileSdk 35, so `requestedPermissions.contains(permission)` fails Kotlin
# strict null checks with:
#   Only safe (?.) or non-null asserted (!!.) calls are allowed on a nullable
#   receiver of type Array<(out) String!>?
PATCHED_COUNT=0
SEEN_FILES=()

for root in "${SEARCH_ROOTS[@]}"; do
  # NUL-delimited iteration so paths with spaces never split incorrectly.
  while IFS= read -r -d '' f; do
    # Dedupe in case two roots see the same hoisted file.
    already_seen=0
    for seen in "${SEEN_FILES[@]:-}"; do
      if [ "$f" = "$seen" ]; then
        already_seen=1
        break
      fi
    done
    if [ "$already_seen" -eq 1 ]; then
      continue
    fi
    SEEN_FILES+=("$f")

    if grep -qF 'requestedPermissions?.contains(permission) ?: false' "$f"; then
      log "Already patched: $f"
      continue
    fi
    if grep -qF 'return requestedPermissions.contains(permission)' "$f"; then
      log "Patching: $f"
      # Pipe delimiter so slashes in indentation do not confuse sed.
      sed -i.bak \
        's|return requestedPermissions\.contains(permission)|return requestedPermissions?.contains(permission) ?: false|' \
        "$f"
      rm -f "${f}.bak"
      PATCHED_COUNT=$((PATCHED_COUNT + 1))
    else
      log "Unexpected content in $f — skipping (upstream may already be fixed)."
    fi
  done < <(find "$root" \
    -path "*/expo-modules-core/android/src/main/java/expo/modules/adapters/react/permissions/PermissionsService.kt" \
    -print0 2>/dev/null || true)
done

log "patched ${PATCHED_COUNT} file(s)"
log "done"
