param (
    [string]$TurfId = "turf1",
    [string]$VideoFile = (Join-Path $PSScriptRoot "sample-feed.mp4")
)

$targetUrl = "rtsp://localhost:8554/$TurfId"
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   TURF LIVE - Synthetic Camera (PowerShell)   " -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Target Stream : $targetUrl"
Write-Host "Turf ID       : $TurfId"

if ($VideoFile -ne "" -and (Test-Path $VideoFile)) {
    Write-Host "Source Video  : $VideoFile (Looping)" -ForegroundColor Yellow
    ffmpeg -re -stream_loop -1 -i $VideoFile -c:v libx264 -preset veryfast -tune zerolatency -pix_fmt yuv420p -c:a aac -f rtsp -rtsp_transport tcp $targetUrl
} else {
    Write-Host "Source        : Synthetic High Definition Feed (testsrc2 with digital clock)" -ForegroundColor Yellow
    ffmpeg -re -f lavfi -i "testsrc2=size=1280x720:rate=30" -f lavfi -i "anullsrc=channel_layout=stereo:sample_rate=44100" -c:v libx264 -preset ultrafast -tune zerolatency -pix_fmt yuv420p -c:a aac -f rtsp -rtsp_transport tcp $targetUrl
}
