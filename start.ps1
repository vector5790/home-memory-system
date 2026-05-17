$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = if ($args.Count -gt 0) { $args[0] } else { "4173" }

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCommand) {
  $nodeExe = $nodeCommand.Source
} else {
  $nodeExe = Join-Path $env:LOCALAPPDATA "OpenAI\Codex\bin\node.exe"
}

if (-not (Test-Path $nodeExe)) {
  Write-Host "Node.js was not found."
  Write-Host "Install Node.js or run with the full path to node.exe."
  Write-Host "Tried: $nodeExe"
  exit 1
}

Write-Host "Home Memory is running at http://localhost:$port"
Write-Host "Press Ctrl+C to stop."
& $nodeExe (Join-Path $root "server.mjs") $port
