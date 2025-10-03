# PowerShell helper to collect runtime logs on Windows (for local debugging or CI)
param()
$ErrorActionPreference = 'Stop'

$githubWorkspace = $Env:GITHUB_WORKSPACE
if (-not $githubWorkspace) { $githubWorkspace = (Get-Location).Path }

$runnerTemp = $Env:RUNNER_TEMP
if (-not $runnerTemp) { $runnerTemp = [IO.Path]::GetTempPath() }

targetDir = Join-Path -Path $runnerTemp -ChildPath "runtime-logs"
# ensure directory exists (use -Force to avoid errors if already exists)
if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null } else { # still ensure permissions
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

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
      Copy-Item -Path $p -Destination $targetDir -Recurse -Force -ErrorAction SilentlyContinue
    } catch {
      Write-Warning "Failed to copy $p : $_"
    }
  } else {
    Write-Host "Not found: $p"
  }
}

# Copy blocked.* files preserving relative path
Get-ChildItem -Path $githubWorkspace -Filter "blocked.*" -Recurse -Depth 3 -ErrorAction SilentlyContinue |
  ForEach-Object {
    try {
      $full = $_.FullName
      $rel = $full.Substring($githubWorkspace.Length).TrimStart('\','/')
      if ([string]::IsNullOrWhiteSpace($rel)) { $rel = $_.Name }
      $dest = Join-Path $targetDir $rel
      $destDir = Split-Path $dest -Parent
      if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
      Copy-Item -Path $full -Destination $dest -Force -ErrorAction SilentlyContinue
    } catch {
      Write-Warning "Failed to copy blocked file $($_.FullName): $_"
    }
  }

Write-Host "Collected files:"
Get-ChildItem -Path $targetDir -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object { Write-Host $_.FullName }
