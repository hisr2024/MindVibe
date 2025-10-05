#!/usr/bin/env pwsh
<#
  Run Aider suggestions from PowerShell.
  Installs Aider (PyPI first, then git fallback) and writes report to reports/aider-suggestions.txt
#>

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

try {
  Write-Output "Upgrading pip..."
  python -m pip install --upgrade pip
} catch {
  Write-Warning "Failed to upgrade pip: $_"
}

try {
  if (Test-Path -Path "requirements-dev.txt") {
    Write-Output "Installing requirements-dev.txt..."
    python -m pip install -r requirements-dev.txt
  }
} catch {
  Write-Warning "Failed to install requirements-dev.txt: $_"
}

try {
  Write-Output "Trying to install Aider from PyPI..."
  python -m pip install --upgrade aider
  Write-Output "Attempted PyPI install."
} catch {
  Write-Warning "PyPI install failed: $_"
}

try {
  if (-not (Get-Command aider -ErrorAction SilentlyContinue)) {
    Write-Output "aider CLI not found after PyPI attempt; trying git fallback..."
    python -m pip install --upgrade "git+https://github.com/get-aider/aider.git"
  }
} catch {
  Write-Warning "Git fallback install failed: $_"
}

New-Item -ItemType Directory -Path "reports" -Force | Out-Null

if (Get-Command aider -ErrorAction SilentlyContinue) {
  Write-Output "Running aider suggestion..."
  & aider suggestion --prompt code-review 2>&1 | Out-File -Encoding utf8 -FilePath "reports/aider-suggestions.txt"
  Write-Output "Wrote reports/aider-suggestions.txt"
} else {
  Write-Warning "aider CLI not found on PATH after installs; run scripts/check-aider-cli.ps1 for diagnostics."
  exit 0
}