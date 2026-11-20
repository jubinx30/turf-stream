# =========================================================
# TURF LIVE - One-Click Prototype Launcher (PowerShell)
# =========================================================

Write-Host "=========================================================" -ForegroundColor Green
Write-Host "        TURF LIVE - STARTING PROTOTYPE SUITE             " -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green

$ScriptDir = if ($PSCommandPath) { Split-Path -Parent $PSCommandPath } elseif ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
Set-Location $ScriptDir

$mediamtxExe = (Join-Path $ScriptDir "mediamtx\mediamtx.exe")
$mediamtxYml = (Join-Path $ScriptDir "mediamtx\mediamtx.yml")
$mediamtxDir = (Join-Path $ScriptDir "mediamtx")

# 1. Start MediaMTX Media Server
Write-Host "[1/3] Launching MediaMTX Server (RTSP: 8554, HLS: 8888)..." -ForegroundColor Cyan
if (Test-Path $mediamtxExe) {
    Start-Process -FilePath $mediamtxExe -ArgumentList "`"$mediamtxYml`"" -WorkingDirectory $mediamtxDir
} else {
    Write-Host "Notice: mediamtx.exe not found locally. If using Docker, run 'docker compose up -d'." -ForegroundColor Yellow
}

Start-Sleep -Seconds 2

# 2. Start Backend API & Production Frontend Server
Write-Host "[2/3] Launching Backend Server on http://localhost:4000..." -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "backend/src/server.js" -WorkingDirectory $ScriptDir

Start-Sleep -Seconds 2

# 3. Launch Simulated Sports Camera
Write-Host "[3/3] Launching Simulated Match Camera Stream for Turf 1..." -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "scripts/simulate-camera.js --turf turf1 --video scripts/sample-feed.mp4" -WorkingDirectory $ScriptDir

Write-Host "`nAll services launched!" -ForegroundColor Green
Write-Host "-> Web Application : http://localhost:4000" -ForegroundColor White
Write-Host "-> Media HLS Stream: http://localhost:8888/turf1/index.m3u8" -ForegroundColor White
Write-Host "-> Media Ingestion : rtsp://localhost:8554/turf1" -ForegroundColor White
Write-Host "`nOpen http://localhost:4000 in your browser to view the live feed." -ForegroundColor Green
