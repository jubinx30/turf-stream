# =========================================================
# TURF LIVE - Stop All Prototype Services (PowerShell)
# =========================================================

Write-Host "Stopping all Turf Live prototype services..." -ForegroundColor Yellow

# Kill MediaMTX
Stop-Process -Name mediamtx -Force -ErrorAction SilentlyContinue

# Kill FFmpeg synthetic cameras
Stop-Process -Name ffmpeg -Force -ErrorAction SilentlyContinue

# Kill backend node server
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue | 
  Where-Object { $_.CommandLine -match "backend[/\\]src[/\\]server\.js|simulate-camera\.js" } | 
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

Write-Host "All Turf Live services stopped successfully." -ForegroundColor Green
