const assert = require('assert');
const http = require('http');
const app = require('../src/server');

let server;
let baseUrl;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (options.body) {
      reqOptions.headers['Content-Type'] = 'application/json';
    }

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json,
          raw: data
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }

    req.end();
  });
}

async function runTests() {
  console.log(`\n======================================================`);
  console.log(` RUNNING BACKEND API & 2-HOUR PAYWALL INTEGRATION TESTS`);
  console.log(`======================================================\n`);

  server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
  console.log(`Test server running on ${baseUrl}\n`);

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(`         ${err.message}`);
      failed++;
    }
  }

  // TEST 1: Public live feed viewing (No booking, no login required)
  await test('Requirement 1: Public live feed info is accessible without login or booking', async () => {
    const res = await request('/api/turfs/turf1/live');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.isPublic, true);
    assert.strictEqual(res.data.requiresAuth, false);
    assert.strictEqual(res.data.requiresBooking, false);
    assert.ok(res.data.hlsUrl.includes('/turf1/index.m3u8'));
  });

  // TEST 2: Turf directory lists turfs
  await test('Turf directory lists all available turfs with stream paths', async () => {
    const res = await request('/api/turfs');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(Array.isArray(res.data.data));
    assert.ok(res.data.data.length >= 3);
  });

  // TEST 3: Archives metadata calculates 2-hour window correctly
  let recentArchive = null;
  let olderArchive = null;
  let anotherOlderArchive = null;

  await test('Archives endpoint calculates 2-hour cutoff rule and free window expiry', async () => {
    const res = await request('/api/archives');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(Array.isArray(res.data.data));

    recentArchive = res.data.data.find(a => !a.isOlderThan2Hours);
    olderArchive = res.data.data.find(a => a.isOlderThan2Hours);
    const olderList = res.data.data.filter(a => a.isOlderThan2Hours);
    anotherOlderArchive = olderList[1] || null;

    assert.ok(recentArchive, 'Should have at least one session ended < 2 hours ago');
    assert.ok(olderArchive, 'Should have at least one session ended > 2 hours ago');
    assert.ok(anotherOlderArchive, 'Should have a second session ended > 2 hours ago');

    assert.strictEqual(recentArchive.hasAccess, true, 'Recent session should have free access');
    assert.strictEqual(recentArchive.accessReason, 'free_window');
    assert.ok(recentArchive.timeRemainingInFreeWindowMs > 0);

    assert.strictEqual(olderArchive.hasAccess, false, 'Older session without token should be locked');
  });

  // TEST 4: Free playback within 2 hours
  await test('Requirement 2a: Session within 2 hours provides FREE playback metadata without token', async () => {
    const res = await request(`/api/archives/${recentArchive.id}/playback`);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.accessType, 'free_window');
    assert.strictEqual(res.data.isOlderThan2Hours, false);
    assert.strictEqual(res.data.videoUrl, `/api/archives/${recentArchive.id}/stream`);
  });

  // TEST 5: Free secure video stream within 2 hours
  await test('Requirement 2b: Session within 2 hours allows FREE direct video streaming (HTTP 200, Range support)', async () => {
    const res = await request(`/api/archives/${recentArchive.id}/stream`);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'video/mp4');
    assert.strictEqual(res.headers['accept-ranges'], 'bytes');
  });

  // TEST 6: Free download within 2 hours
  await test('Requirement 2c: Session within 2 hours provides FREE download without token', async () => {
    const res = await request(`/api/archives/${recentArchive.id}/download`);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'video/mp4');
    assert.ok(res.headers['content-disposition'].includes('attachment'));
  });

  // TEST 7: Paywall blocks playback metadata for sessions older than 2 hours
  await test('Requirement 2d: Playback metadata for session older than 2 hours is BLOCKED (HTTP 403 Paywall)', async () => {
    const res = await request(`/api/archives/${olderArchive.id}/playback`);
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.data.error, 'PAYWALL_LOCKED');
    assert.strictEqual(res.data.isOlderThan2Hours, true);
    assert.ok(res.data.pricing.singleMatch);
    assert.ok(res.data.pricing.subscription);
  });

  // TEST 8: Paywall blocks direct video streaming for sessions older than 2 hours
  await test('Requirement 2e: Video streaming endpoint (/stream) for session older than 2 hours is BLOCKED (HTTP 403 Paywall)', async () => {
    const res = await request(`/api/archives/${olderArchive.id}/stream`);
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.data.error, 'PAYWALL_LOCKED');
  });

  // TEST 9: Paywall blocks download for sessions older than 2 hours
  await test('Requirement 2f: Download endpoint (/download) for session older than 2 hours is BLOCKED (HTTP 403 Paywall)', async () => {
    const res = await request(`/api/archives/${olderArchive.id}/download`);
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.data.error, 'PAYWALL_LOCKED');
  });

  // TEST 10: Security check - direct static file access to recordings is disabled
  await test('Security check: Public static route to recordings (/public/recordings/...) is disabled (no paywall bypass)', async () => {
    const res = await request(`/public/recordings/${olderArchive.fileName}`);
    assert.strictEqual(res.statusCode, 404, 'Static access must not serve files directly');
  });

  // TEST 11: Checkout single match pass for match 1
  let tokenMatch1 = null;
  await test('Payment Checkout: Purchasing Single Match Pass returns valid access token', async () => {
    const res = await request('/api/payments/checkout', {
      method: 'POST',
      body: {
        planType: 'single_match',
        archiveId: olderArchive.id,
        paymentMethod: 'card'
      }
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.token);
    assert.strictEqual(res.data.data.receipt.planType, 'single_match');
    assert.strictEqual(res.data.data.receipt.archiveId, olderArchive.id);
    tokenMatch1 = res.data.data.token;
  });

  // TEST 12: Single match pass unlocks playback metadata & stream for target match
  await test('Unlock verification: Single match token allows playback metadata and streaming', async () => {
    const resMeta = await request(`/api/archives/${olderArchive.id}/playback?token=${tokenMatch1}`);
    assert.strictEqual(resMeta.statusCode, 200);
    assert.strictEqual(resMeta.data.success, true);
    assert.strictEqual(resMeta.data.accessType, 'single_match_pass');

    const resStream = await request(`/api/archives/${olderArchive.id}/stream?token=${tokenMatch1}`);
    assert.strictEqual(resStream.statusCode, 200);
    assert.strictEqual(resStream.headers['content-type'], 'video/mp4');
    assert.strictEqual(resStream.headers['accept-ranges'], 'bytes');
  });

  // TEST 13: Single match pass unlocks download for target match
  await test('Unlock verification: Single match token allows download of purchased match', async () => {
    const res = await request(`/api/archives/${olderArchive.id}/download?token=${tokenMatch1}`);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'video/mp4');
    assert.ok(res.headers['content-disposition'].includes('attachment'));
  });

  // TEST 14: Single match pass does NOT unlock a different older match
  await test('Security check: Single match pass does NOT grant access to other matches', async () => {
    const resMeta = await request(`/api/archives/${anotherOlderArchive.id}/playback?token=${tokenMatch1}`);
    assert.strictEqual(resMeta.statusCode, 403);
    assert.strictEqual(resMeta.data.error, 'PAYWALL_LOCKED');
    assert.strictEqual(resMeta.data.reason, 'ARCHIVE_MISMATCH');

    const resStream = await request(`/api/archives/${anotherOlderArchive.id}/stream?token=${tokenMatch1}`);
    assert.strictEqual(resStream.statusCode, 403);
    assert.strictEqual(resStream.data.error, 'PAYWALL_LOCKED');
  });

  // TEST 15: Multiple independent single match passes co-exist
  await test('Multi-pass check: User can buy and access multiple distinct single match passes without conflict', async () => {
    const resBuy2 = await request('/api/payments/checkout', {
      method: 'POST',
      body: {
        planType: 'single_match',
        archiveId: anotherOlderArchive.id,
        paymentMethod: 'upi'
      }
    });
    assert.strictEqual(resBuy2.statusCode, 200);
    const tokenMatch2 = resBuy2.data.data.token;

    // Both match 1 and match 2 stream successfully with their respective tokens
    const stream1 = await request(`/api/archives/${olderArchive.id}/stream?token=${tokenMatch1}`);
    assert.strictEqual(stream1.statusCode, 200);

    const stream2 = await request(`/api/archives/${anotherOlderArchive.id}/stream?token=${tokenMatch2}`);
    assert.strictEqual(stream2.statusCode, 200);

    // Cross-check: Token 2 cannot stream match 1
    const crossCheck = await request(`/api/archives/${olderArchive.id}/stream?token=${tokenMatch2}`);
    assert.strictEqual(crossCheck.statusCode, 403);
  });

  // TEST 16: Checkout monthly subscription
  let subscriptionToken = null;
  await test('Payment Checkout: Subscribing to All-Access Pass returns subscription token', async () => {
    const res = await request('/api/payments/checkout', {
      method: 'POST',
      body: {
        planType: 'subscription',
        paymentMethod: 'card'
      }
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.token);
    assert.strictEqual(res.data.data.receipt.planType, 'subscription');
    subscriptionToken = res.data.data.token;
  });

  // TEST 17: Subscription unlocks ANY older match playback, stream, and download
  await test('Subscription verification: Subscription unlocks playback, stream, and download across all past matches', async () => {
    const resMeta = await request(`/api/archives/${anotherOlderArchive.id}/playback?token=${subscriptionToken}`);
    assert.strictEqual(resMeta.statusCode, 200);
    assert.strictEqual(resMeta.data.accessType, 'subscription');

    const resStream = await request(`/api/archives/${anotherOlderArchive.id}/stream?token=${subscriptionToken}`);
    assert.strictEqual(resStream.statusCode, 200);
    assert.strictEqual(resStream.headers['content-type'], 'video/mp4');

    const resDl = await request(`/api/archives/${anotherOlderArchive.id}/download?token=${subscriptionToken}`);
    assert.strictEqual(resDl.statusCode, 200);
    assert.strictEqual(resDl.headers['content-type'], 'video/mp4');
  });

  // TEST 18: Delegated turf archives endpoint works without Node internal assertion crash
  await test('Delegated route: /api/turfs/:id/archives responds cleanly without router assertion error', async () => {
    const res = await request('/api/turfs/turf1/archives');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(Array.isArray(res.data.data));
    assert.ok(res.data.data.every(a => a.turfId === 'turf1'));
  });

  // TEST 19: Camera Agnostic status endpoint
  await test('Requirement 3: Camera status endpoint provides ingestion details and formats', async () => {
    const res = await request('/api/cameras/status');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.mediamtx);
    assert.ok(Array.isArray(res.data.supportedIngestions));
    assert.ok(res.data.supportedIngestions.some(i => i.type.includes('RTSP Push')));
    assert.ok(res.data.supportedIngestions.some(i => i.type.includes('RTSP Pull')));
  });

  // TEST 20: Unknown API routes return clean 404 JSON
  await test('Error handling: Unknown API route returns 404 JSON', async () => {
    const res = await request('/api/non-existent-route');
    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(res.data.success, false);
  });

  // TEST 21: Reset demo clock endpoint
  await test('Interactive testing: POST /api/turfs/reset-demo resets fixture times', async () => {
    const res = await request('/api/turfs/reset-demo', { method: 'POST' });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.count >= 5);
  });

  server.close();

  console.log(`\n======================================================`);
  console.log(` RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
