const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const config = require('./config');

function ensureRecordingsExist() {
  if (!fs.existsSync(config.recordingsDir)) {
    fs.mkdirSync(config.recordingsDir, { recursive: true });
  }

  const sampleFiles = [
    { name: 'rec-turf1-recent-1.mp4', label: 'Match 1 (45m ago - Free Replay)', color: 'blue' },
    { name: 'rec-turf2-recent-2.mp4', label: 'Match 2 (90m ago - Free Replay)', color: 'green' },
    { name: 'rec-turf1-older-1.mp4', label: 'Match 3 (4h ago - Paywalled)', color: 'red' },
    { name: 'rec-turf3-older-2.mp4', label: 'Match 4 (7h ago - Paywalled)', color: 'orange' },
    { name: 'rec-turf2-older-3.mp4', label: 'Match 5 (22h ago - Paywalled)', color: 'purple' }
  ];

  for (const sample of sampleFiles) {
    const dest = path.join(config.recordingsDir, sample.name);
    if (!fs.existsSync(dest)) {
      try {
        console.log(`Generating sample recording clip: ${sample.name}...`);
        // Generate a 4-second animated clip using ffmpeg
        const cmd = `ffmpeg -y -f lavfi -i testsrc=duration=4:size=640x360:rate=30 -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a aac -shortest "${dest}"`;
        execSync(cmd, { stdio: 'ignore' });
        console.log(`Generated: ${sample.name}`);
      } catch (err) {
        console.warn(`Could not generate sample clip with ffmpeg: ${err.message}. Creating placeholder.`);
        fs.writeFileSync(dest, 'TURF_LIVE_SAMPLE_VIDEO_CONTENT');
      }
    }
  }
}

async function getLiveStreamsStatus() {
  try {
    const response = await fetch(`${config.mediamtxApiUrl}/v3/paths/list`, { signal: AbortSignal.timeout(1500) });
    if (!response.ok) {
      return { connected: false, paths: {} };
    }
    const data = await response.json();
    const activePaths = {};
    if (data && data.items) {
      for (const item of data.items) {
        activePaths[item.name] = {
          ready: item.ready || false,
          readersCount: item.readers ? item.readers.length : 0,
          tracks: item.tracks || [],
          bytesReceived: item.bytesReceived || 0
        };
      }
    }
    return { connected: true, paths: activePaths };
  } catch (err) {
    return { connected: false, error: err.message, paths: {} };
  }
}

module.exports = {
  ensureRecordingsExist,
  getLiveStreamsStatus
};
