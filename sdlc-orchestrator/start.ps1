#requires -Version 5.1
<#
  SDLC Orchestrator — local dev server
  Serves the orchestrator at http://localhost:3000 with the generate/launch API.
  Usage:  .\start.ps1            # default port 3000
          .\start.ps1 -Port 8080 # custom port
#>
param(
  [int]$Port = 3000,
  [switch]$NoBrowser
)

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $here

# Load local secrets (GITHUB_TOKEN, JENKINS_TOKEN, …) from .env.local.ps1
# if present. The file is gitignored — see .env.local.ps1 for the template.
$envFile = Join-Path $here '.env.local.ps1'
if (Test-Path $envFile) {
  . $envFile
  Write-Host " Loaded .env.local.ps1" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host " SDLC Orchestrator" -ForegroundColor Cyan
Write-Host " Serving $here"     -ForegroundColor DarkGray
Write-Host " URL:   http://localhost:$Port/" -ForegroundColor Green
Write-Host " Stop:  Ctrl+C"     -ForegroundColor DarkGray
if ($env:JENKINS_USER -and $env:JENKINS_TOKEN) {
  Write-Host " Jenkins: $($env:JENKINS_URL) (user=$($env:JENKINS_USER))" -ForegroundColor DarkGray
} else {
  Write-Host " Jenkins: not configured (set JENKINS_USER and JENKINS_TOKEN to enable)" -ForegroundColor DarkYellow
}
if ($env:GITHUB_TOKEN -and $env:GITHUB_REPO) {
  Write-Host " GitHub:  $($env:GITHUB_REPO) (token set, $($env:GITHUB_TOKEN.Length) chars)" -ForegroundColor DarkGray
} else {
  Write-Host " GitHub:  not configured (set GITHUB_TOKEN and GITHUB_REPO to enable real PR tracker)" -ForegroundColor DarkYellow
}
Write-Host ""

if (-not $NoBrowser) {
  Start-Process "http://localhost:$Port/"
}

$env:SDLC_PORT = $Port
python server.py
