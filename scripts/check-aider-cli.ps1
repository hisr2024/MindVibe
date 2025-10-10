<#
  Check Aider CLI and write diagnostics to reports/check-aider-cli.txt
#>

[CmdletBinding()]
param()

$ErrorActionPreference = 'Continue'
$report = "reports/check-aider-cli.txt"
New-Item -ItemType Directory -Path "reports" -Force | Out-Null
"`n==== aider diagnostic: $(Get-Date -Format o) ====" | Out-File $report -Encoding utf8

if (Get-Command aider -ErrorAction SilentlyContinue) {
  $path = (Get-Command aider).Path
  "aider found at: $path" | Out-File $report -Append -Encoding utf8
  try { & aider --version 2>&1 | Out-File $report -Append -Encoding utf8 } catch { "Error running --version" | Out-File $report -Append }

  try {
    "Running: aider suggestion --prompt code-review (sample)..." | Out-File $report -Append -Encoding utf8
    & aider suggestion --prompt code-review 2>&1 | Tee-Object -FilePath reports/aider-suggestion-sample.txt -Append
    "Wrote reports/aider-suggestion-sample.txt" | Out-File $report -Append -Encoding utf8
  } catch { "Suggestion failed: $_" | Out-File $report -Append -Encoding utf8 }
} else {
  "aider CLI not found on PATH." | Out-File $report -Append -Encoding utf8
}

"Inspecting pip-installed package 'aider'..." | Out-File $report -Append -Encoding utf8
try { python -m pip show -f aider 2>&1 | Out-File $report -Append -Encoding utf8 } catch { "pip show failed" | Out-File $report -Append }
$py = Get-Command python -ErrorAction SilentlyContinue
if ($py) {
  $pyBin = Split-Path -Parent $py.Path
  $scriptsPath = Join-Path $pyBin "Scripts"
  "Python executable: $py.Path" | Out-File $report -Append -Encoding utf8
  "Scripts dir: $scriptsPath" | Out-File $report -Append -Encoding utf8
  if (Test-Path $scriptsPath) { Get-ChildItem -Path $scriptsPath -Filter "*aider*" | Out-File $report -Append -Encoding utf8 }
}
Write-Output "Diagnostic finished. See $report"