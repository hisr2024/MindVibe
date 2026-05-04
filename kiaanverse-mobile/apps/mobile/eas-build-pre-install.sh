#!/bin/bash
# eas-build-pre-install.sh — runs BEFORE pnpm install on the EAS server.
#
# Single nuke: expo-in-app-purchases (legacy). The package breaks Gradle 8.8
# due to a removed `classifier` property. Always purge.
#
# NOTE: PR #1689 removed the previous voice-native symlink nuke. The voice
# native packages (@kiaanverse/{kiaan,sakha}-voice-native) are now expected
# in apps/mobile/node_modules — pnpm hoists them as workspace packages and
# the autolinker uses them to register :kiaanverse_{X}-voice-native gradle
# modules. The plugin no longer registers its own duplicate gradle module,
# so there's no symlink to fight against.
#
# Idempotent: rm -rf on non-existent paths is a no-op.

set -e

log() { echo "[eas-build-pre-install] $*"; }

log "Removing expo-in-app-purchases from node_modules..."
rm -rf "$EAS_BUILD_WORKINGDIR/kiaanverse-mobile/node_modules/expo-in-app-purchases" 2>/dev/null || true
rm -rf "$EAS_BUILD_WORKINGDIR/node_modules/expo-in-app-purchases" 2>/dev/null || true
find "$EAS_BUILD_WORKINGDIR" \
  -type d -name "expo-in-app-purchases" -path "*/node_modules/*" \
  -exec rm -rf {} + 2>/dev/null || true
log "expo-in-app-purchases removed"
