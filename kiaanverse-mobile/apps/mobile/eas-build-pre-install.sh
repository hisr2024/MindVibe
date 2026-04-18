#!/bin/bash
set -e
echo "[eas-build] Removing expo-in-app-purchases from node_modules..."
rm -rf "$EAS_BUILD_WORKINGDIR/kiaanverse-mobile/node_modules/expo-in-app-purchases" 2>/dev/null || true
rm -rf "$EAS_BUILD_WORKINGDIR/node_modules/expo-in-app-purchases" 2>/dev/null || true

# Also nuke from the apps/mobile node_modules if hoisted there
find "$EAS_BUILD_WORKINGDIR" -type d -name "expo-in-app-purchases" -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null || true

echo "[eas-build] expo-in-app-purchases removed successfully"
