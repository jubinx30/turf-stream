@echo off
echo =========================================================
echo        TURF LIVE - STARTING PROTOTYPE SUITE             
echo =========================================================

cd /d "%~dp0"

echo [1/3] Launching MediaMTX Server (RTSP: 8554, HLS: 8888)...
start "MediaMTX Server" /d "%~dp0mediamtx" "%~dp0mediamtx\mediamtx.exe" "%~dp0mediamtx\mediamtx.yml"
ping 127.0.0.1 -n 3 >nul

echo [2/3] Launching Backend Server (http://localhost:4000)...
start "Turf Live Backend" /d "%~dp0" node backend/src/server.js
ping 127.0.0.1 -n 3 >nul

echo [3/3] Launching Match Camera Simulator...
start "Turf 1 Camera Simulator" /d "%~dp0" node scripts/simulate-camera.js --turf turf1 --video scripts/sample-feed.mp4

echo.
echo All services launched!
echo -^> Web Application : http://localhost:4000
echo -^> Media HLS Stream: http://localhost:8888/turf1/index.m3u8
echo -^> Ingestion Port  : rtsp://localhost:8554/turf1
echo.
echo Open http://localhost:4000 in your browser.
