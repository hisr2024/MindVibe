#!/usr/bin/env bash
# scripts/scan-and-fix-runtime-files.sh
# Scan remote branches for runtime diagnostics files, compare to canonical, and optionally create fix branches.
#
# Usage:
#   chmod +x scripts/scan-and-fix-runtime-files.sh
#   ./scripts/scan-and-fix-runtime-files.sh       # safe scan, prints report
#   ./scripts/scan-and-fix-runtime-files.sh --apply  # interactively create fix branches & push
set -euo pipefail

# Canonical contents (edit here if you prefer different canonical files)
read -r -d '' CANON_UPLOAD_YML <<'YML' || true
name: Upload runtime diagnostics

on:
  workflow_dispatch:
  push:
    branches:
      - main
      - fix/upload-artifacts

jobs:
  collect-and-upload:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Debug: show workspace & runner temp (Linux)
        if: matrix.os == 'ubuntu-latest'
        run: |
          echo "GITHUB_WORKSPACE: $GITHUB_WORKSPACE"
          echo "RUNNER_TEMP: $RUNNER_TEMP"

      - name: Debug: show workspace & runner temp (Windows)
        if: matrix.os == 'windows-latest'
        shell: pwsh
        run: |
          Write-Host "GITHUB_WORKSPACE: $Env:GITHUB_WORKSPACE"
          Write-Host "RUNNER_TEMP: $Env:RUNNER_TEMP"

      - name: Collect runtime logs (Linux)
        if: matrix.os == 'ubuntu-latest'
        run: |
          set -euo pipefail
          chmod +x ./scripts/collect-runtime-logs.sh || true
          ./scripts/collect-runtime-logs.sh

      - name: Collect runtime logs (Windows)
        if: matrix.os == 'windows-latest'
        shell: pwsh
        run: |
          ./scripts/collect-runtime-logs.ps1

      - name: Upload runtime-logs artifact (warn if nothing found)
        uses: actions/upload-artifact@v4
        with:
          name: runtime-logs
          path: ${{ runner.temp }}/runtime-logs/**
          if-no-files-found: 'warn'
YML

read -r -d '' CANON_SH <<'SH' || true
#!/usr/bin/env bash
# Linux helper to collect runtime logs into runner temp (for CI)
set -euo pipefail

GITHUB_WORKSPACE="${GITHUB_WORKSPACE:-$(pwd)}"
RUNNER_TEMP="${RUNNER_TEMP:-/tmp}"
TARGET_DIR="${RUNNER_TEMP}/runtime-logs"
mkdir -p "${TARGET_DIR}"

paths=(
  "${GITHUB_WORKSPACE}/runtime-logs"
  "${GITHUB_WORKSPACE}/logs"
  "${GITHUB_WORKSPACE}/.tmp/runtime-logs"
  "${GITHUB_WORKSPACE}/build/logs"
  "${RUNNER_TEMP}/runtime-logs"
  "${GITHUB_WORKSPACE}/.github/workflows/runtime-logs"
)

for p in "${paths[@]}"; do
  if [ -e "$p" ]; then
    echo "Copying from: $p"
    cp -R "$p" "${TARGET_DIR}/" || true
  else
    echo "Not found: $p"
  fi
done

echo "Collected files:"
find "${TARGET_DIR}" -maxdepth 6 -type f -print || echo "No files collected"
SH

read -r -d '' CANON_PS1 <<'PS1' || true
# PowerShell helper to collect runtime logs on Windows (for local debugging or CI)
param()
$ErrorActionPreference = 'Stop'

$githubWorkspace = $Env:GITHUB_WORKSPACE
if (-not $githubWorkspace) { $githubWorkspace = (Get-Location).Path }
# Normalize workspace path (no trailing slash)
$githubWorkspace = $githubWorkspace.TrimEnd('\','/')

$runnerTemp = $Env:RUNNER_TEMP
if (-not $runnerTemp) { $runnerTemp = [IO.Path]::GetTempPath() }

$targetDir = Join-Path -Path $runnerTemp -ChildPath "runtime-logs"
# ensure directory exists
New-Item -ItemType Directory -Path $targetDir -Force | Out-Null

Write-Host "Collecting runtime logs into $targetDir"
$pathsToCheck = @(
  (Join-Path $githubWorkspace "runtime-logs"),
  (Join-Path $githubWorkspace "logs"),
  (Join-Path $githubWorkspace ".tmp\runtime-logs"),
  (Join-Path $githubWorkspace "build\logs"),
  (Join-Path $runnerTemp "runtime-logs"),
  (Join-Path $githubWorkspace ".github\workflows\runtime-logs")
)

foreach ($p in $pathsToCheck) {
  if (Test-Path $p) {
    Write-Host "Copying from: $p"
    try {
      Copy-Item -LiteralPath $p -Destination $targetDir -Recurse -Force -ErrorAction SilentlyContinue
    } catch {
      Write-Warning "Failed to copy $p : $_"
    }
  } else {
    Write-Host "Not found: $p"
  }
}

# Copy blocked.* files preserving relative path (use -File for compatibility)
Get-ChildItem -Path $githubWorkspace -Filter "blocked.*" -Recurse -File -ErrorAction SilentlyContinue |
  ForEach-Object {
    try {
      $full = $_.FullName
      $rel = $full.Substring($githubWorkspace.Length).TrimStart('\','/')
      if ([string]::IsNullOrWhiteSpace($rel)) { $rel = $_.Name }
      $dest = Join-Path $targetDir $rel
      $destDir = Split-Path $dest -Parent
      if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
      Copy-Item -LiteralPath $full -Destination $dest -Force -ErrorAction SilentlyContinue
    } catch {
      Write-Warning "Failed to copy blocked file $($_.FullName): $_"
    }
  }

Write-Host "Collected files:"
Get-ChildItem -Path $targetDir -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object { Write-Host $_.FullName }
PS1

# files to check
FILES=(
  ".github/workflows/upload-artifacts.yml"
  "scripts/collect-runtime-logs.sh"
  "scripts/collect-runtime-logs.ps1"
)

TMPDIR="$(mktemp -d)"
REPORT="$TMPDIR/scan-report.txt"
> "$REPORT"

APPLY=false
if [ "${1:-}" = "--apply" ] || [ "${1:-}" = "-a" ]; then
  APPLY=true
fi

echo "Fetching origin..." | tee -a "$REPORT"
git fetch origin --prune

echo "Scanning remote branches..." | tee -a "$REPORT"
mapfile -t BRANCHES < <(git for-each-ref --format='%(refname:short)' refs/remotes/origin | sed 's@^origin/@@' | grep -v '^HEAD$' || true)
if [ "${#BRANCHES[@]}" -eq 0 ]; then
  echo "No remote branches found." | tee -a "$REPORT"
  exit 1
fi

# write canonical temps
echo "$CANON_UPLOAD_YML" > "$TMPDIR/canon_upload.yml"
echo "$CANON_SH" > "$TMPDIR/canon_collect.sh"
echo "$CANON_PS1" > "$TMPDIR/canon_collect.ps1"
chmod +x "$TMPDIR/canon_collect.sh" || true

echo "Branches found: ${#BRANCHES[@]}" | tee -a "$REPORT"
for br in "${BRANCHES[@]}"; do
  echo "----" | tee -a "$REPORT"
  echo "Branch: $br" | tee -a "$REPORT"
  for f in "${FILES[@]}"; do
    if git ls-tree --name-only "origin/$br" -- "$f" >/dev/null 2>&1; then
      echo "  Exists: $f" | tee -a "$REPORT"
      OUT="$TMPDIR/$(echo "$br" | sed 's@/@__@g')__$(basename "$f")"
      if git show "origin/$br:$f" > "$OUT" 2>/dev/null; then
        case "$f" in
          ".github/workflows/upload-artifacts.yml") CANON="$TMPDIR/canon_upload.yml" ;;
          "scripts/collect-runtime-logs.sh") CANON="$TMPDIR/canon_collect.sh" ;;
          "scripts/collect-runtime-logs.ps1") CANON="$TMPDIR/canon_collect.ps1" ;;
          *) CANON="/dev/null" ;;
        esac
        if diff -u "$CANON" "$OUT" >/dev/null 2>&1; then
          echo "    MATCHES canonical version" | tee -a "$REPORT"
        else
          echo "    DIFFERS from canonical version" | tee -a "$REPORT"
          diff -u "$CANON" "$OUT" > "$OUT.diff" || true
          echo "    diff saved to: $OUT.diff" | tee -a "$REPORT"
        fi
      else
        echo "    ERROR: could not extract $f from origin/$br" | tee -a "$REPORT"
      fi
    else
      echo "  MISSING: $f" | tee -a "$REPORT"
    fi
  done
done

echo "Scan complete. Report: $REPORT"
cat "$REPORT"

if [ "$APPLY" = false ]; then
  echo
  echo "To create fix branches for differing branches run:"
  echo "  ./scripts/scan-and-fix-runtime-files.sh --apply"
  exit 0
fi

# APPLY mode
echo
echo "APPLY mode: will create backup/* and fix branches for branches with diffs."
read -p "Proceed with creating fix branches and pushing them? [y/N]: " proceed
if [[ ! "$proceed" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

for br in "${BRANCHES[@]}"; do
  DIFF_FOUND=false
  for f in "${FILES[@]}"; do
    OUT="$TMPDIR/$(echo "$br" | sed 's@/@__@g')__$(basename "$f")"
    if [ -f "$OUT.diff" ]; then DIFF_FOUND=true; break; fi
  done
  if [ "$DIFF_FOUND" = false ]; then
    echo "No diffs for $br; skipping."
    continue
  fi

  SAFE="$(echo "$br" | sed 's/[^a-zA-Z0-9._-]/_/g')"
  BACKUP_BRANCH="backup/${SAFE}"
  FIX_BRANCH="${br//\//-}-ci-fix"

  echo "Creating backup $BACKUP_BRANCH -> origin/$br"
  git branch -f "$BACKUP_BRANCH" "origin/$br"
  git push -u origin "$BACKUP_BRANCH:$BACKUP_BRANCH" || echo "Warning: push failed"

  echo "Creating fix branch $FIX_BRANCH from origin/$br"
  git checkout -B "$FIX_BRANCH" "origin/$br"
  mkdir -p .github/workflows scripts
  echo "$CANON_UPLOAD_YML" > .github/workflows/upload-artifacts.yml
  echo "$CANON_SH" > scripts/collect-runtime-logs.sh
  echo "$CANON_PS1" > scripts/collect-runtime-logs.ps1
  chmod +x scripts/collect-runtime-logs.sh || true

  git add .github/workflows/upload-artifacts.yml scripts/collect-runtime-logs.sh scripts/collect-runtime-logs.ps1
  if git diff --cached --quiet; then
    echo "No changes to commit for $FIX_BRANCH (identical files)."
  else
    git commit -m "chore(ci): apply canonical runtime diagnostic files (fix for $br)"
    git push -u origin "$FIX_BRANCH"
    echo "Pushed $FIX_BRANCH"
    if command -v gh >/dev/null 2>&1; then
      read -p "Create PR from $FIX_BRANCH -> $br now? [y/N]: " do_pr
      if [[ "$do_pr" =~ ^[Yy]$ ]]; then
        gh pr create --title "chore(ci): fix runtime diagnostics for $br" --body "Apply canonical upload-artifacts and collectors." --base "$br" --head "$FIX_BRANCH" || echo "gh failed"
      fi
    fi
  fi
done

echo "Apply completed. See $REPORT for details."
