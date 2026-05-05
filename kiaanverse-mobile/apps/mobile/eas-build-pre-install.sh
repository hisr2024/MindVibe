#!/bin/bash
# eas-build-pre-install.sh — runs BEFORE pnpm install on the EAS server.
#
# Two nukes:
#
#   1. expo-in-app-purchases (legacy Gradle-8.8-incompat package). Always purge.
#
#   2. @kiaanverse/{kiaan,sakha}-voice-native symlinks (LEGACY scoped names —
#      renamed to unscoped `kiaanverse-{kiaan,sakha}-voice-native` in PR #1696
#      to fix the autolinker name-mangling collision between RN and Expo).
#
#      EAS Build aggressively caches `node_modules` across builds. After the
#      rename, pnpm install creates the NEW unscoped symlinks but does NOT
#      necessarily delete the OLD scoped ones from the cache — so EAS ends up
#      with BOTH:
#         apps/mobile/node_modules/@kiaanverse/{kiaan,sakha}-voice-native  (stale)
#         apps/mobile/node_modules/kiaanverse-{kiaan,sakha}-voice-native   (current)
#
#      Both get registered as DIFFERENT gradle modules pointing at the SAME
#      source through the symlinks → AGP namespace collision → build death.
#      This nuke runs BEFORE pnpm install so any stale @kiaanverse-scoped
#      voice-native dirs are gone before the autolinker scans node_modules.
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

# ─── 2. Stale @kiaanverse/{kiaan,sakha}-voice-native symlinks (post-PR-#1696) ─
log "Removing any stale @kiaanverse-scoped voice-native symlinks..."

# Direct paths first (canonical pnpm hoist locations).
for ROOT in \
  "$EAS_BUILD_WORKINGDIR" \
  "$EAS_BUILD_WORKINGDIR/kiaanverse-mobile" \
  "$EAS_BUILD_WORKINGDIR/kiaanverse-mobile/apps/mobile"; do
  [ -d "$ROOT" ] || continue
  rm -rf "$ROOT/node_modules/@kiaanverse/kiaan-voice-native" 2>/dev/null || true
  rm -rf "$ROOT/node_modules/@kiaanverse/sakha-voice-native" 2>/dev/null || true
done

# Sweep every node_modules tree as a backstop. Kill the symlink itself
# (-type l) AND any real directory that might have been materialised at
# any depth.
find "$EAS_BUILD_WORKINGDIR" \
  \( -type d -o -type l \) \
  \( -name "kiaan-voice-native" -o -name "sakha-voice-native" \) \
  -path "*/node_modules/@kiaanverse/*" \
  -exec rm -rf {} + 2>/dev/null || true

# Also wipe any cached gradle build/ output that might reference the
# stale @kiaanverse-scoped paths — without this, the cached AAR could
# resurrect at link time.
find "$EAS_BUILD_WORKINGDIR" \
  -type d -path "*/@kiaanverse/kiaan-voice-native/android/build" \
  -exec rm -rf {} + 2>/dev/null || true
find "$EAS_BUILD_WORKINGDIR" \
  -type d -path "*/@kiaanverse/sakha-voice-native/android/build" \
  -exec rm -rf {} + 2>/dev/null || true

log "stale @kiaanverse voice-native symlinks removed"
