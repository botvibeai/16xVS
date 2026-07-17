param(
  [string]$WorkerBaseUrl = "https://16xvs-poc.michael-38d.workers.dev",
  [switch]$Login
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outputDir = Join-Path $projectRoot "recovery-output\cloudflare-$stamp"
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

function Write