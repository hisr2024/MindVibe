# PowerShell helper to collect runtime logs on Windows (for local debugging or CI)
param()
$ErrorActionPreference = 'Stop'

$githubWorkspace = $Env:GITHUB_WORKSPACE
if (-not $githubWorkspace) { $githubWorkspace = (Get-Location).Path }

$runnerTemp = $Env:RUNNER_TEMP
if (-not $runnerTemp) { $runnerTemp = [IO.Path]::GetTempPath() }

$targetDir = Join-Path -Path $runnerTemp -ChildPath "runtime-logs"
New-Item -ItemType Directory -Path $targetDir -Force | Out-Null

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
    Copy-Item -Path $p -Destination $targetDir -Recurse -Force -ErrorAction SilentlyContinue
  }
}

Get-ChildItem -Path $targetDir -Recurse -File | ForEach-Object { Write-Host $_.FullName }
