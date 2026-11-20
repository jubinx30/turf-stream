#!/usr/bin/env bash
TURF_ID=${1:-turf1}
DEFAULT_VIDEO="$(cd "$(dirname "$0")" && pwd)/sample-feed.mp4"
VIDEO_FILE=${2:-$DEFAULT_VIDEO}
TARGET_URL="rtsp://localhost:8554/${TURF_ID}"

echo "==============================================="
echo "   TURF LIVE - Synthetic Camera (Bash)         "
echo "==============================================="
echo "Target Stream : ${TARGET_URL}"
echo "Turf ID       : ${TURF_ID}"

if [ -n "$VIDEO_FILE" ] && [ -f "$VIDEO_FILE" ]; then
    echo "Source Video  : ${VIDEO_FILE} (Looping)"
    ffmpeg -re -stream_loop -1 -i "$VIDEO_FILE" \
      -c:v libx264 -preset veryfast -tune zerolatency -pix_fmt yuv420p \
      -c:a aac -f rtsp -rtsp_transport tcp "$TARGET_URL"
else
    echo "Source        : Synthetic High Definition Feed (testsrc2 with digital clock)"
    ffmpeg -re -f lavfi -i "testsrc2=size=1280x720:rate=30" \
      -f lavfi -i "anullsrc=channel_layout=stereo:sample_rate=44100" \
      -c:v libx264 -preset ultrafast -tune zerolatency -pix_fmt yuv420p \
      -c:a aac -f rtsp -rtsp_transport tcp "$TARGET_URL"
fi
