const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const db = require('./db');
const paymentService = require('./paymentService');
const mediaService = require('./mediaService');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// NOTE: We deliberately DO NOT expose config.recordingsDir as a public static directory.
// Direct access to /public/recordings is blocked so all playback and downloads
// MUST pass through the 2-hour paywall validation rules.

// Pre-create sample recording files on startup
mediaService.ensureRecordingsExist();

// -------------------------------------------------------------
// 1. PUBLIC TURF DIRECTORY & LIVE STREAM ENDPOINTS (FREE, NO AUTH)
// -------------------------------------------------------------

/**
 * GET /api/turfs
 * Returns all available turfs with live stream status.
 * Public access: Anyone can browse turfs.
 */
app.get('/api/turfs', async (req, res) => {
  const turfs = db.getTurfs();
  const mtxStatus = await mediaService.getLiveStreamsStatus();

  const enrichedTurfs = turfs.map(turf => {
    const isActivelyIngesting = Boolean(mtxStatus.connected && mtxStatus.paths[turf.streamPath]?.ready);
    return {
      ...turf,
      isLive: isActivelyIngesting,
      hlsUrl: `${config.mediamtxHlsBaseUrl}/${turf.streamPath}/index.m3u8`,
      rtspPublishUrl: `${config.mediamtxRtspBaseUrl}/${turf.streamPath}`,
      activeViewers: isActivelyIngesting ? Math.floor(Math.random() * 25) + 8 : 0
    };
  });

  res.json({
    success: true,
    data: enrichedTurfs,
    mediaServerOnline: mtxStatus.connected
  });
});

/**
 * GET /api/turfs/:id
 */
app.get('/api/turfs/:id', async (req, res) => {
  const turf = db.getTurfById(req.params.id);
  if (!turf) {
    return res.status(404).json({ success: false, error: 'Turf not found' });
  }

  const mtxStatus = await mediaService.getLiveStreamsStatus();
  const isActivelyIngesting = Boolean(mtxStatus.connected && mtxStatus.paths[turf.streamPath]?.ready);

  res.json({
    success: true,
    data: {
      ...turf,
      isLive: isActivelyIngesting,
      hlsUrl: `${config.mediamtxHlsBaseUrl}/${turf.streamPath}/index.m3u8`,
      rtspPublishUrl: `${config.mediamtxRtspBaseUrl}/${turf.streamPath}`
    }
  });
});

/**
 * GET /api/turfs/:id/live
 * Public live feed: anyone visiting can view the live feed without booking or login.
 */
app.get('/api/turfs/:id/live', async (req, res) => {
  const turf = db.getTurfById(req.params.id);
  if (!turf) {
    return res.status(404).json({ success: false, error: 'Turf not found' });
  }

  const mtxStatus = await mediaService.getLiveStreamsStatus();
  const isActivelyIngesting = Boolean(mtxStatus.connected && mtxStatus.paths[turf.streamPath]?.ready);

  res.json({
    success: true,
    turfId: turf.id,
    turfName: turf.name,
    isPublic: true,
    requiresAuth: false,
    requiresBooking: false,
    isLive: isActivelyIngesting,
    hlsUrl: `${config.mediamtxHlsBaseUrl}/${turf.streamPath}/index.m3u8`,
    // If stream is offline, provide a fallback demo clip URL so user can test the UI player
    fallbackPlaybackUrl: `/api/recordings/demo-stream.mp4`
  });
});

// -------------------------------------------------------------
// 2. REPLAY & ARCHIVES WITH 2-HOUR PAYWALL RULE
// -------------------------------------------------------------

/**
 * Shared archives handler supporting query param (?turfId=...) or route param (/api/turfs/:id/archives)
 */
function handleGetArchives(req, res) {
  const turfId = req.params.id || req.query.turfId;
  const token = req.headers.authorization || req.query.token;
  const archives = db.getArchives(turfId);

  // Annotate if current request has unlocked access
  const enriched = archives.map(archive => {
    let hasAccess = false;
    let accessReason = 'none';

    if (!archive.isOlderThan2Hours) {
      hasAccess = true;
      accessReason = 'free_window';
    } else if (token) {
      const verify = paymentService.verifyAccess(token, archive.id);
      if (verify.authorized) {
        hasAccess = true;
        accessReason = verify.planType || 'paid';
      }
    }

    return {
      ...archive,
      hasAccess,
      accessReason,
      streamUrl: `/api/archives/${archive.id}/stream`,
      playbackEndpoint: `/api/archives/${archive.id}/playback`,
      downloadEndpoint: `/api/archives/${archive.id}/download`
    };
  });

  res.json({
    success: true,
    data: enriched,
    freeWindowDurationMinutes: config.paywallFreeWindowMs / 60000
  });
}

/**
 * GET /api/archives
 * Lists all recorded sessions across all turfs, or filter by ?turfId=...
 */
app.get('/api/archives', handleGetArchives);

/**
 * GET /api/turfs/:id/archives
 * Clean delegated route without internal _router hacks
 */
app.get('/api/turfs/:id/archives', handleGetArchives);

/**
 * GET /api/archives/:id
 */
app.get('/api/archives/:id', (req, res) => {
  const archive = db.getArchiveById(req.params.id);
  if (!archive) {
    return res.status(404).json({ success: false, error: 'Archive session not found' });
  }

  const token = req.headers.authorization || req.query.token;
  let hasAccess = false;
  let accessReason = 'none';

  if (!archive.isOlderThan2Hours) {
    hasAccess = true;
    accessReason = 'free_window';
  } else if (token) {
    const verify = paymentService.verifyAccess(token, archive.id);
    if (verify.authorized) {
      hasAccess = true;
      accessReason = verify.planType || 'paid';
    }
  }

  res.json({
    success: true,
    data: {
      ...archive,
      hasAccess,
      accessReason,
      streamUrl: `/api/archives/${archive.id}/stream`,
      playbackEndpoint: `/api/archives/${archive.id}/playback`,
      downloadEndpoint: `/api/archives/${archive.id}/download`
    }
  });
});

/**
 * GET /api/archives/:id/playback
 * ENFORCES THE 2-HOUR PAYWALL RULE FOR METADATA:
 * 1. If session ended within 2 hours: Free for everyone.
 * 2. If session ended > 2 hours ago: Requires Single Match Pass or Subscription token.
 */
app.get('/api/archives/:id/playback', (req, res) => {
  const archive = db.getArchiveById(req.params.id);
  if (!archive) {
    return res.status(404).json({ success: false, error: 'Archive session not found' });
  }

  const token = req.headers.authorization || req.query.token;
  const cleanToken = token ? (token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim()) : '';

  // Rule 1: Within 2 hours of live session ending -> FREE
  if (!archive.isOlderThan2Hours) {
    return res.json({
      success: true,
      archiveId: archive.id,
      title: archive.title,
      isOlderThan2Hours: false,
      accessType: 'free_window',
      timeRemainingInFreeWindowMs: archive.timeRemainingInFreeWindowMs,
      freeWindowExpiresAt: archive.freeWindowExpiresAt,
      // Secure stream endpoint (no static directory exposure)
      videoUrl: `/api/archives/${archive.id}/stream`,
      message: 'Free playback: This match ended less than 2 hours ago.'
    });
  }

  // Rule 2: Older than 2 hours -> Paywall check
  const verification = paymentService.verifyAccess(token, archive.id);
  if (!verification.authorized) {
    return res.status(403).json({
      success: false,
      error: 'PAYWALL_LOCKED',
      reason: verification.reason || 'PAYMENT_REQUIRED',
      message: 'This session concluded more than 2 hours ago. A paid single match pass or active subscription is required to replay this match.',
      archiveId: archive.id,
      title: archive.title,
      endedAt: archive.endedAt,
      ageMinutes: archive.ageMinutes,
      isOlderThan2Hours: true,
      pricing: {
        singleMatch: {
          id: 'single_match',
          name: 'Single Match Replay Pass',
          price: 1.99,
          currency: 'USD',
          validity: '7 days access to this match replay and download'
        },
        subscription: {
          id: 'subscription',
          name: 'All-Access Turf Pass',
          price: 9.99,
          currency: 'USD',
          period: 'month',
          validity: 'Unlimited access to all live matches, replays, and downloads'
        }
      }
    });
  }

  // User is authorized via paid pass or subscription!
  const streamUrl = `/api/archives/${archive.id}/stream?token=${encodeURIComponent(cleanToken)}`;
  return res.json({
    success: true,
    archiveId: archive.id,
    title: archive.title,
    isOlderThan2Hours: true,
    accessType: verification.planType === 'subscription' ? 'subscription' : 'single_match_pass',
    videoUrl: streamUrl,
    message: verification.planType === 'subscription'
      ? 'Access granted via active monthly subscription.'
      : 'Access granted via verified Single Match Pass.'
  });
});

/**
 * GET /api/archives/:id/stream
 * SECURE VIDEO STREAMING ENDPOINT:
 * Delivers chunked / range-supported video directly to the HTML5 video player.
 * Strictly verifies the 2-hour free window and authorization token.
 */
app.get('/api/archives/:id/stream', (req, res) => {
  const archive = db.getArchiveById(req.params.id);
  if (!archive) {
    return res.status(404).json({ success: false, error: 'Archive session not found' });
  }

  const token = req.headers.authorization || req.query.token;

  // Paywall check: if older than 2 hours, verify pass or subscription
  if (archive.isOlderThan2Hours) {
    const verification = paymentService.verifyAccess(token, archive.id);
    if (!verification.authorized) {
      return res.status(403).json({
        success: false,
        error: 'PAYWALL_LOCKED',
        reason: verification.reason || 'PAYMENT_REQUIRED',
        message: 'This session concluded more than 2 hours ago. A paid single match pass or active subscription is required to stream this replay.',
        archiveId: archive.id
      });
    }
  }

  const filePath = path.join(config.recordingsDir, archive.fileName);
  if (!fs.existsSync(filePath)) {
    mediaService.ensureRecordingsExist();
  }

  res.setHeader('Content-Type', 'video/mp4');
  return res.sendFile(filePath, { acceptRanges: true });
});

/**
 * GET /api/archives/:id/download
 * ENFORCES THE SAME 2-HOUR PAYWALL RULE FOR DOWNLOADS:
 * 1. If session ended within 2 hours: Free download for everyone.
 * 2. If session ended > 2 hours ago: Requires valid pass or subscription.
 */
app.get('/api/archives/:id/download', (req, res) => {
  const archive = db.getArchiveById(req.params.id);
  if (!archive) {
    return res.status(404).json({ success: false, error: 'Archive session not found' });
  }

  const token = req.headers.authorization || req.query.token;

  // Paywall check if older than 2 hours
  if (archive.isOlderThan2Hours) {
    const verification = paymentService.verifyAccess(token, archive.id);
    if (!verification.authorized) {
      return res.status(403).json({
        success: false,
        error: 'PAYWALL_LOCKED',
        message: 'Download restricted: This recording is older than 2 hours. A pass or subscription is required to download.',
        archiveId: archive.id,
        isOlderThan2Hours: true
      });
    }
  }

  const filePath = path.join(config.recordingsDir, archive.fileName);
  if (!fs.existsSync(filePath)) {
    mediaService.ensureRecordingsExist();
  }

  res.setHeader('Content-Disposition', `attachment; filename="${archive.fileName}"`);
  res.setHeader('Content-Type', 'video/mp4');
  return res.sendFile(filePath);
});

// -------------------------------------------------------------
// 3. MOCK PAYMENT & SUBSCRIPTION GATEWAY
// -------------------------------------------------------------

/**
 * POST /api/payments/checkout
 * Simulates card or UPI payment and issues authorization token.
 */
app.post('/api/payments/checkout', (req, res) => {
  const { planType, archiveId, paymentMethod, customerEmail } = req.body;

  if (!planType || (planType !== 'single_match' && planType !== 'subscription')) {
    return res.status(400).json({
      success: false,
      error: "Invalid planType. Must be 'single_match' or 'subscription'."
    });
  }

  if (planType === 'single_match' && !archiveId) {
    return res.status(400).json({
      success: false,
      error: "archiveId is required for single_match plan."
    });
  }

  const result = paymentService.createCheckout({
    planType,
    archiveId,
    paymentMethod: paymentMethod || 'card',
    customerEmail: customerEmail || 'spectator@turf-user.io'
  });

  res.json({
    success: true,
    data: result
  });
});

/**
 * POST /api/payments/verify
 * Validates an existing access token.
 */
app.post('/api/payments/verify', (req, res) => {
  const { token, archiveId } = req.body;
  const result = paymentService.verifyAccess(token, archiveId);
  res.json({ success: result.authorized, details: result });
});

// -------------------------------------------------------------
// 4. CAMERA & SYSTEM STATUS
// -------------------------------------------------------------

/**
 * GET /api/cameras/status
 * Queries MediaMTX to report active camera ingestion streams.
 */
app.get('/api/cameras/status', async (req, res) => {
  const mtxStatus = await mediaService.getLiveStreamsStatus();
  res.json({
    success: true,
    mediamtx: {
      status: mtxStatus.connected ? 'online' : 'offline',
      apiUrl: config.mediamtxApiUrl,
      hlsUrl: config.mediamtxHlsBaseUrl,
      rtspUrl: config.mediamtxRtspBaseUrl,
      activeStreams: mtxStatus.paths
    },
    supportedIngestions: [
      { type: 'RTSP Push', example: 'ffmpeg -re -i cam.mp4 -c copy -f rtsp rtsp://localhost:8554/turf1', devices: 'OBS, FFmpeg, Raspberry Pi libcamera-vid' },
      { type: 'RTSP Pull', example: 'MediaMTX yml configured to pull rtsp://camera-ip:554/stream', devices: 'PoE IP Cameras (Hikvision, Dahua, Reolink), Android IP Webcam App' },
      { type: 'RTMP Push', example: 'rtmp://localhost:1935/turf1', devices: 'GoPro, Action Cams, Larix Broadcaster on iOS/Android' }
    ]
  });
});

/**
 * POST /api/turfs/reset-demo
 * Resets archives timestamps relative to current time for interactive testing.
 */
app.post('/api/turfs/reset-demo', (req, res) => {
  const freshArchives = db.resetDemoSeed();
  res.json({
    success: true,
    message: 'Demo session fixtures reset relative to current clock.',
    count: freshArchives.length
  });
});

// 404 handler for unknown /api/* endpoints
app.all('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: 'API endpoint not found' });
});

// Start server
const PORT = config.port;

// Serve built frontend if exists
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/public')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`   TURF LIVE BACKEND API RUNNING on port ${PORT}`);
    console.log(`===============================================`);
    console.log(`Live Stream Base   : ${config.mediamtxHlsBaseUrl}`);
    console.log(`MediaMTX Ingestion : ${config.mediamtxRtspBaseUrl}`);
    console.log(`Paywall Window     : 2 Hours (Sessions older require pass)`);
    console.log(`Recordings Dir     : ${config.recordingsDir}`);
    console.log(`API Endpoints      : http://localhost:${PORT}/api/turfs`);
  });
}

module.exports = app;
