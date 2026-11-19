const path = require('path');
require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret: process.env.JWT_SECRET || 'turf-live-super-secret-key-2026',
  mediamtxApiUrl: process.env.MEDIAMTX_API_URL || 'http://localhost:9997',
  mediamtxHlsBaseUrl: process.env.MEDIAMTX_HLS_BASE_URL || 'http://localhost:8888',
  mediamtxRtspBaseUrl: process.env.MEDIAMTX_RTSP_BASE_URL || 'rtsp://localhost:8554',
  recordingsDir: path.resolve(__dirname, '../public/recordings'),
  // Paywall window rule in milliseconds: 2 hours
  paywallFreeWindowMs: 2 * 60 * 60 * 1000
};
