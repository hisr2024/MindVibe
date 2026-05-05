#!/bin/bash
# eas-build-post-install.sh — runs AFTER pnpm install on the EAS server.
#
# Three nukes (mirrors eas-build-pre-install.sh):
#
#   1. expo-in-app-purchases (legacy Gradle-8.8-incompat package).
#   2. @kiaanverse/{kiaan,sakha}-voice-native (legacy scoped names).
#   3. kiaanverse-{kiaan,sakha}-voice-native (legacy unscoped names).
#
# Belt-and-braces with the pre-install nuke: if pnpm install somehow
# re-materialises a stale voice-native symlink between pre-install and
# now, this catches it before gradle's autolinker scans node_modules.
#
# Per PR #1698, voice modules are NOT pnpm workspace packages, so pnpm
# install should never create symlinks for them. This belt-and-braces
# is defense against any unexpected behavior.
#
# We do NOT `set -e` so transient find / rm errors can't fail the build.

log() { echo "[eas-post-install] $*"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd)" || SCRIPT_DIR="."
CANDIDATES=(
  "${EAS_BUILD_WORKINGDIR:-}"
  "${SCRIPT_DIR}/../.."
  "/home/expo/workingdir"
)

# ─── 1. expo-in-app-purchases ────────────────────────────────────────────
log "Purging expo-in-app-purchases from all node_modules trees..."
for root in "${CANDIDATES[@]}"; do
  [ -n "$root" ] && [ -d "$root" ] || continue
  find "$root" \
    -type d -name "expo-in-app-purchases" -path "*/node_modules/*" \
    -exec rm -rf {} + 2>/dev/null || true
done

# ─── 2 + 3. ALL voice-native symlinks (scoped + unscoped) ────────────────
log "Purging any voice-native symlinks (scoped + unscoped)..."
for root in "${CANDIDATES[@]}"; do
  [ -n "$root" ] && [ -d "$root" ] || continue

  # Scoped @kiaanverse/* (pre-PR-#1696)
  rm -rf "$root/node_modules/@kiaanverse/kiaan-voice-native" 2>/dev/null || true
  rm -rf "$root/node_modules/@kiaanverse/sakha-voice-native" 2>/dev/null || true
  rm -rf "$root/apps/mobile/node_modules/@kiaanverse/kiaan-voice-native" 2>/dev/null || true
  rm -rf "$root/apps/mobile/node_modules/@kiaanverse/sakha-voice-native" 2>/dev/null || true

  # Unscoped kiaanverse-* (post-PR-#1696, pre-PR-#1698)
  rm -rf "$root/node_modules/kiaanverse-kiaan-voice-native" 2>/dev/null || true
  rm -rf "$root/node_modules/kiaanverse-sakha-voice-native" 2>/dev/null || true
  rm -rf "$root/apps/mobile/node_modules/kiaanverse-kiaan-voice-native" 2>/dev/null || true
  rm -rf "$root/apps/mobile/node_modules/kiaanverse-sakha-voice-native" 2>/dev/null || true

  # Sweep every node_modules tree.
  find "$root" \
    \( -type d -o -type l \) \
    \( -name "kiaan-voice-native" -o -name "sakha-voice-native" \) \
    -path "*/node_modules/@kiaanverse/*" \
    -exec rm -rf {} + 2>/dev/null || true

  find "$root" \
    \( -type d -o -type l \) \
    \( -name "kiaanverse-kiaan-voice-native" -o -name "kiaanverse-sakha-voice-native" \) \
    -path "*/node_modules/*" \
    -exec rm -rf {} + 2>/dev/null || true
done

log "done"
exit 0
