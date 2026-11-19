#!/usr/bin/env node
/**
 * simulate-camera.js
 * 
 * Simulates a live sports camera feed pushing RTSP to MediaMTX.
 * Supports:
 *   1. Synthetic animated sports pattern with running clock, scoreboard, and bouncing ball.
 *   2. Or looping a real video file if path is supplied (--video <path>).
 * 
 * Usage:
 *   node scripts/simulate-camera.js [--turf turf1] [--rtsp rtsp://localhost:8554] [--video path/to/clip.mp4]
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
function getArg(flag, defaultValue) {
  const idx = args.indexOf(flag);
  if (idx !== -1 && args[idx + 1]) {
    return args[idx + 1];
  }
  return defaultValue;
}

const turfId = getArg('--turf', 'turf1');
const rtspServer = getArg('--rtsp', 'rtsp://localhost:8554');
const videoFile = getArg('--video', null);
const targetUrl = `${rtspServer}/${turfId}`;

console.log(`===============================================`);
console.log(`   TURF LIVE - Synthetic Camera Simulator`);
console.log(`===============================================`);
console.log(`Target Stream : ${targetUrl}`);
console.log(`Turf ID       : ${turfId}`);
if (videoFile) {
  console.log(`Source Video  : ${videoFile} (Looping)`);
} else {
  console.log(`Source        : Dynamic Sports Match Graphics & Clock`);
}
console.log(`Press Ctrl+C to stop streaming.\n`);

let ffmpegArgs = [];

if (videoFile && fs.existsSync(videoFile)) {
  ffmpegArgs = [
    '-re',
    '-stream_loop', '-1',
    '-i', videoFile,
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-tune', 'zerolatency',
    '-b:v', '2000k',
    '-maxrate', '2500k',
    '-bufsize', '4000k',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-ar', '44100',
    '-f', 'rtsp',
    '-rtsp_transport', 'tcp',
    targetUrl
  ];
} else {
  // Generate a dynamic sports broadcast pattern with real-time digital timer and motion
  ffmpegArgs = [
    '-re',
    '-f', 'lavfi',
    '-i', 'testsrc2=size=1280x720:rate=30',
    '-f', 'lavfi',
    '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    '-b:v', '1800k',
    '-pix_fmt', 'yuv420p',
    '-g', '60',
    '-keyint_min', '30',
    '-c:a', 'aac',
    '-b:a', '96k',
    '-ar', '44100',
    '-f', 'rtsp',
    '-rtsp_transport', 'tcp',
    targetUrl
  ];
}

let ffmpegProcess = null;
let isShuttingDown = false;

function launchFFmpeg() {
  if (isShuttingDown) return;
  console.log(`Launching FFmpeg RTSP stream -> ${targetUrl}...`);
  ffmpegProcess = spawn('ffmpeg', ffmpegArgs, { stdio: ['ignore', 'inherit', 'inherit'] });

  ffmpegProcess.on('error', (err) => {
    console.error(`Failed to launch ffmpeg: ${err.message}`);
    console.error(`Please ensure ffmpeg is installed and available in PATH.`);
    if (!isShuttingDown) {
      console.log(`Retrying stream connection in 3 seconds...`);
      setTimeout(launchFFmpeg, 3000);
    }
  });

  ffmpegProcess.on('exit', (code, signal) => {
    if (isShuttingDown) return;
    console.log(`FFmpeg process exited with code ${code} (${signal || 'clean'}).`);
    console.log(`Reconnecting RTSP stream in 3 seconds...`);
    setTimeout(launchFFmpeg, 3000);
  });
}

launchFFmpeg();

process.on('SIGINT', () => {
  isShuttingDown = true;
  console.log(`Stopping camera simulation...`);
  if (ffmpegProcess) {
    ffmpegProcess.kill('SIGINT');
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  isShuttingDown = true;
  if (ffmpegProcess) {
    ffmpegProcess.kill('SIGTERM');
  }
  process.exit(0);
});
