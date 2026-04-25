#!/usr/bin/env bash
# Kiaanverse — clean AAB build via EAS, no cache.
#
# What this does, in order:
#   1. Sync repo to current origin/main (hard reset — drops local edits).
#   2. Update global CLIs (pnpm, eas-cli, expo).
#   3. Wipe every cache layer that could leak stale state into the AAB:
#        - node_modules (root + workspace packages + apps/mobile)
#        - .expo / ~/.expo (Expo CLI cache)
#        - Metro / Haste cache from $TMPDIR
#        - Generated apps/mobile/android + apps/mobile/ios (from prebuild)
#        - pnpm content-addressable store (`pnpm store prune`)
#        - npm cache
#        - Gradle daemon + caches (only matters for --local builds)
#   4. Fresh `pnpm install --frozen-lockfile` so the dep tree matches
#      pnpm-lock.yaml exactly — reproducible with what's on main.
#   5. `npx expo-doctor` health check.
#   6. `eas build --platform android --profile production --clear-cache`
#      The `--clear-cache` flag also invalidates EAS's server-side build
#      cache so the worker rebuilds from a fresh checkout.
#
# Usage (Git Bash on Windows, or any POSIX shell):
#
#     bash kiaanverse-mobile/scripts/clean-build-aab.sh
#
# Optional flags:
#   --local        Run the build on this machine (needs JDK 17 + Android SDK).
#                  Without this, EAS builds in their cloud (no SDK needed).
#   --skip-sync    Don't reset local main to origin/main. Useful if you have
#                  uncommitted work-in-progress you want to keep.
#   --skip-update  Don't `npm install -g` the latest CLIs.
#   --no-clean     Skip the cache wipe (only do install + build).
#
# Prerequisites (one-time): Node 20+, npm, an Expo login (`eas login`).

set -euo pipefail

# ---------------------------------------------------------------- args ----
LOCAL_BUILD=false
SKIP_SYNC=false
SKIP_UPDATE=false
NO_CLEAN=false
for arg in "$@"; do
    case "$arg" in
        --local)        LOCAL_BUILD=true ;;
        --skip-sync)    SKIP_SYNC=true ;;
        --skip-update)  SKIP_UPDATE=true ;;
        --no-clean)     NO_CLEAN=true ;;
        -h|--help)
            sed -n '2,30p' "$0"
            exit 0 ;;
        *)
            echo "Unknown flag: $arg" >&2
            exit 2 ;;
    esac
done

# Find repo root from anywhere — works whether you cd into the script dir
# or invoke it via an absolute path.
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$REPO_ROOT" ]; then
    echo "ERROR: not inside a git working tree" >&2
    exit 1
fi
WORKSPACE="$REPO_ROOT/kiaanverse-mobile"
APP_DIR="$WORKSPACE/apps/mobile"

if [ ! -d "$APP_DIR" ]; then
    echo "ERROR: $APP_DIR not found — is this the right repo?" >&2
    exit 1
fi

# ---------------------------------------------------------------- helpers --
section() {
    printf '\n\033[1;36m→ %s\033[0m\n' "$1"
}

# ---------------------------------------------------------------- 1. sync --
if [ "$SKIP_SYNC" = false ]; then
    section "Sync to latest origin/main"
    cd "$REPO_ROOT"
    git fetch origin --prune --tags
    git checkout main
    git reset --hard origin/main
    git status --short
    git rev-parse HEAD
fi

# ---------------------------------------------------------------- 2. clis --
if [ "$SKIP_UPDATE" = false ]; then
    section "Update global CLIs (pnpm, eas-cli, expo)"
    npm install -g pnpm@latest eas-cli@latest expo@latest
    pnpm --version
    eas --version
fi

# Sanity: must be logged in to EAS for the build to start.
if ! eas whoami >/dev/null 2>&1; then
    echo "WARN: not logged in to EAS — running 'eas login' now"
    eas login
fi

# ---------------------------------------------------------------- 3. clean -
if [ "$NO_CLEAN" = false ]; then
    section "Wipe local caches"
    cd "$WORKSPACE"

    # JS deps (workspace-aware)
    rm -rf node_modules
    rm -rf apps/*/node_modules
    rm -rf packages/*/node_modules

    # Expo / Metro
    rm -rf "$APP_DIR/.expo"
    rm -rf "$HOME/.expo"

    # Metro temp on POSIX + Windows
    if [ -n "${TMPDIR:-}" ]; then
        rm -rf "$TMPDIR/metro-"* "$TMPDIR/haste-map-"* 2>/dev/null || true
    fi
    if [ -n "${USERNAME:-}" ] && [ -d "/c/Users/$USERNAME/AppData/Local/Temp" ]; then
        rm -rf "/c/Users/$USERNAME/AppData/Local/Temp/metro-"* 2>/dev/null || true
        rm -rf "/c/Users/$USERNAME/AppData/Local/Temp/haste-map-"* 2>/dev/null || true
    fi

    # Generated native dirs (only present after a prior `expo prebuild` /
    # `eas build --local`). Always regenerated from app.config.ts on next
    # build — committing them is unsupported in EAS Managed workflow.
    rm -rf "$APP_DIR/android" "$APP_DIR/ios"

    # pnpm content-addressable store + npm cache
    pnpm store prune || true
    npm cache clean --force || true

    # Gradle (only matters with --local)
    if [ "$LOCAL_BUILD" = true ]; then
        rm -rf "$HOME/.gradle/caches" "$HOME/.gradle/daemon" 2>/dev/null || true
    fi

    # Watchman, if installed (rare on Windows)
    watchman watch-del-all 2>/dev/null || true
fi

# ---------------------------------------------------------------- 4. install
section "Fresh install (pnpm --frozen-lockfile)"
cd "$WORKSPACE"
pnpm install --frozen-lockfile

# ---------------------------------------------------------------- 5. doctor
section "Health check (expo-doctor)"
cd "$APP_DIR"
# expo-doctor exits non-zero on warnings — don't let that abort the build,
# we surface the output for the operator to decide.
npx expo-doctor || true

# ---------------------------------------------------------------- 6. build
section "EAS build — production AAB, --clear-cache"
cd "$APP_DIR"

BUILD_FLAGS=(--platform android --profile production --clear-cache --non-interactive)
if [ "$LOCAL_BUILD" = true ]; then
    BUILD_FLAGS+=(--local)
fi

eas build "${BUILD_FLAGS[@]}"

section "Done"
echo "If this was a cloud build, the AAB download URL is in the output above."
echo "If --local, the AAB is in: $APP_DIR/build-*.aab"
