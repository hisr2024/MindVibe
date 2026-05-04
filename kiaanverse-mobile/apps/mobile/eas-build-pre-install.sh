#!/bin/bash
# eas-build-pre-install.sh — runs BEFORE pnpm install on the EAS server.
#
# Two nukes here, both critical:
#
#   1. expo-in-app-purchases (legacy): the package breaks Gradle 8.8 due to a
#      removed `classifier` property. Always purge.
#
#   2. @kiaanverse/{kiaan,sakha}-voice-native (PR #1688 backstop): pnpm
#      should NOT create these symlinks in apps/mobile/node_modules/@kiaanverse/
#      anymore (PR #1687 removed native/* from pnpm-workspace.yaml + deleted
#      the workspace package.json files), but the EAS build server appears to
#      cache node_modules across builds aggressively — so a stale symlink from
#      a pre-#1687 build can linger and the autolinker re-discovers it,
#      registering :kiaanverse_{X}-voice-native (underscore) as a duplicate
#      gradle module alongside the plugin's correct :kiaanverse-{X}-voice-native
#      (hyphen). The result: AGP namespace collision → MainApplication.kt
#      "Unresolved reference: sakha" → 9-minute build wasted.
#
#      We aggressively delete every voice-native symlink/directory from any
#      node_modules tree under EAS_BUILD_WORKINGDIR, in two passes: a couple
#      of fast direct rm -rf for the canonical locations, then a find -prune
#      sweep that catches any other cached path. The find is fast because
#      `-prune` stops descending into matched dirs.
#
# Both nukes are idempotent: if the targets don't exist, rm exits cleanly.
# We run set -e ONLY for the pre-install part — find / rm errors don't fail
# the build because they're catch-all defensive deletes.

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

# ─── 2. @kiaanverse/{kiaan,sakha}-voice-native (autolink-duplicate guard) ─
log "Removing any cached @kiaanverse/{kiaan,sakha}-voice-native symlinks..."

# Direct paths first (canonical pnpm hoist locations).
for ROOT in \
  "$EAS_BUILD_WORKINGDIR" \
  "$EAS_BUILD_WORKINGDIR/kiaanverse-mobile" \
  "$EAS_BUILD_WORKINGDIR/kiaanverse-mobile/apps/mobile"; do
  [ -d "$ROOT" ] || continue
  rm -rf "$ROOT/node_modules/@kiaanverse/kiaan-voice-native" 2>/dev/null || true
  rm -rf "$ROOT/node_modules/@kiaanverse/sakha-voice-native" 2>/dev/null || true
done

# Sweep every node_modules tree as a backstop. Kill both the symlink and any
# real directory at any depth.
find "$EAS_BUILD_WORKINGDIR" \
  \( -type d -o -type l \) \
  \( -name "kiaan-voice-native" -o -name "sakha-voice-native" \) \
  -path "*/node_modules/@kiaanverse/*" \
  -exec rm -rf {} + 2>/dev/null || true

# Also delete any standalone gradle build cache the previous failed builds
# left for these modules — without this, AGP can re-pick-up the cached AAR
# even after node_modules is clean.
find "$EAS_BUILD_WORKINGDIR" \
  -type d -path "*/kiaan-voice-native/android/build" \
  -exec rm -rf {} + 2>/dev/null || true
find "$EAS_BUILD_WORKINGDIR" \
  -type d -path "*/sakha-voice-native/android/build" \
  -exec rm -rf {} + 2>/dev/null || true

log "voice-native autolink-duplicate guard complete"
