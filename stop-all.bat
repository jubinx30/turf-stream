@echo off
echo Stopping all Turf Live prototype services...

taskkill /f /im mediamtx.exe 2>nul
taskkill /f /im ffmpeg.exe 2>nul
for /f "tokens=2" %%i in ('wmic process where "name='node.exe' and (commandline like '%%server.js%%' or commandline like '%%simulate-camera%%')" get processid 2^>nul') do (
    taskkill /f /pid %%i 2>nul
)

echo All services stopped.
