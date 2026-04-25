#requires -Version 5
<#
.SYNOPSIS
    Kiaanverse — clean AAB build via EAS, no cache. PowerShell variant.

.DESCRIPTION
    Identical behaviour to clean-build-aab.sh. Use this from PowerShell or
    Windows Terminal if you don't have Git Bash. From Git Bash run the .sh
    instead — both produce the same AAB.

    Steps:
      1. Hard-reset main to origin/main.
      2. Update global CLIs (pnpm, eas-cli, expo).
      3. Wipe every cache layer (node_modules, .expo, Metro, pnpm/npm, Gradle).
      4. pnpm install --frozen-lockfile.
      5. npx expo-doctor.
      6. eas build --platform android --profile production --clear-cache.

.PARAMETER Local
    Run the build on this machine (needs JDK 17 + Android SDK).
    Default: cloud build via EAS.

.PARAMETER SkipSync
    Don't reset local main to origin/main.

.PARAMETER SkipUpdate
    Don't `npm install -g` the latest CLIs.

.PARAMETER NoClean
    Skip the cache wipe.

.EXAMPLE
    .\kiaanverse-mobile\scripts\clean-build-aab.ps1

.EXAMPLE
    .\kiaanverse-mobile\scripts\clean-build-aab.ps1 -Local
#>

[CmdletBinding()]
param(
    [switch]$Local,
    [switch]$SkipSync,
    [switch]$SkipUpdate,
    [switch]$NoClean
)

$ErrorActionPreference = 'Stop'

function Section($msg) {
    Write-Host ""
    Write-Host ("→ " + $msg) -ForegroundColor Cyan
}

# ----------------------------------------------------------------- paths --
$RepoRoot = (& git rev-parse --show-toplevel 2>$null).Trim()
if (-not $RepoRoot) {
    Write-Error "not inside a git working tree"
    exit 1
}
$Workspace = Join-Path $RepoRoot 'kiaanverse-mobile'
$AppDir    = Join-Path $Workspace 'apps\mobile'

if (-not (Test-Path $AppDir)) {
    Write-Error "$AppDir not found — is this the right repo?"
    exit 1
}

# ----------------------------------------------------------------- 1 sync --
if (-not $SkipSync) {
    Section "Sync to latest origin/main"
    Set-Location $RepoRoot
    git fetch origin --prune --tags
    git checkout main
    git reset --hard origin/main
    git status --short
    git rev-parse HEAD
}

# ----------------------------------------------------------------- 2 clis --
if (-not $SkipUpdate) {
    Section "Update global CLIs (pnpm, eas-cli, expo)"
    npm install -g pnpm@latest eas-cli@latest expo@latest
    pnpm --version
    eas --version
}

# Auth check
$null = & eas whoami 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Warning "not logged in to EAS — running 'eas login' now"
    eas login
}

# ----------------------------------------------------------------- 3 clean -
if (-not $NoClean) {
    Section "Wipe local caches"
    Set-Location $Workspace

    foreach ($pattern in @(
        'node_modules',
        'apps\*\node_modules',
        'packages\*\node_modules'
    )) {
        Get-ChildItem -Path $pattern -Force -Recurse -ErrorAction SilentlyContinue |
            Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    }

    foreach ($p in @(
        (Join-Path $AppDir '.expo'),
        (Join-Path $env:USERPROFILE '.expo'),
        (Join-Path $AppDir 'android'),
        (Join-Path $AppDir 'ios')
    )) {
        if (Test-Path $p) {
            Remove-Item -Recurse -Force $p -ErrorAction SilentlyContinue
        }
    }

    # Metro / Haste cache from temp
    $tempRoot = $env:TEMP
    if ($tempRoot -and (Test-Path $tempRoot)) {
        Get-ChildItem -Path $tempRoot -Filter 'metro-*'     -Force -ErrorAction SilentlyContinue |
            Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        Get-ChildItem -Path $tempRoot -Filter 'haste-map-*' -Force -ErrorAction SilentlyContinue |
            Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    }

    pnpm store prune
    npm cache clean --force

    if ($Local) {
        $gradleHome = Join-Path $env:USERPROFILE '.gradle'
        foreach ($g in @('caches', 'daemon')) {
            $p = Join-Path $gradleHome $g
            if (Test-Path $p) {
                Remove-Item -Recurse -Force $p -ErrorAction SilentlyContinue
            }
        }
    }
}

# ----------------------------------------------------------------- 4 install
Section "Fresh install (pnpm --frozen-lockfile)"
Set-Location $Workspace
pnpm install --frozen-lockfile

# ----------------------------------------------------------------- 5 doctor
Section "Health check (expo-doctor)"
Set-Location $AppDir
# expo-doctor warnings shouldn't abort
& npx expo-doctor

# ----------------------------------------------------------------- 6 build
Section "EAS build — production AAB, --clear-cache"
Set-Location $AppDir

$flags = @('--platform', 'android', '--profile', 'production', '--clear-cache', '--non-interactive')
if ($Local) {
    $flags += '--local'
}
& eas build @flags

Section "Done"
Write-Host "Cloud build: download URL is in the output above."
Write-Host "Local build: AAB is at $AppDir\build-*.aab"
