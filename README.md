# Turf Live

A camera-agnostic live streaming and monetization platform for sports turfs.

---

## Core System Rules

1. **Public Live Feed Viewing**: Anyone visiting the site or app can view the live stream for free without booking or logging in.
2. **2-Hour Monetization Paywall**: Replays and match downloads are free for the first 2 hours after a live broadcast concludes. Once a session is older than 2 hours, viewers must unlock it via a **Single Match Pass** ($1.99) or **All-Access Subscription** ($9.99/mo).
3. **Camera & Format Agnosticism**: The platform decouples physical camera hardware from the web application. Any camera (Android phone, PoE IP camera, Raspberry Pi Cam 3, or GoPro) feeds standard RTSP/RTMP into **MediaMTX**, which normalizes all streams to HLS (fMP4) for low-latency web playback.

---

## Architecture

```
[ Physical Camera / Device ]
   ├── Android Phone (IP Webcam App via Wi-Fi) ─────────┐
   ├── PoE IP Camera (Hikvision / Dahua / Reolink) ─────┼─► [ MediaMTX Ingestion Server ]
   ├── Raspberry Pi (Pi Cam 3 + libcamera-vid) ─────────┤    │  - RTSP Port: 8554
   ├── Sports Camera (GoPro / RTMP Push) ───────────────┤    │  - RTMP Port: 1935
   └── Synthetic Camera Generator (FFmpeg lavfi) ───────┘    │  - Normalizes codecs to H.264
                                                             │  - Segments into HLS (fMP4)
                                                             ▼
                                                    [ HLS Feed (:8888) ]
                                                             │
                                                             ▼
                                                    [ React Frontend ]
                                                     (HLS.js Player)
                                                  - Public Free Live Feed
                                                  - Turf Directory Switcher
                                                  - 2-Hour Replay Paywall
                                                             ▲
                                                             │
                                                    [ Backend API (:4000) ]
                                                  - Turf state & MediaMTX API sync
                                                  - 2-hour paywall cutoff evaluation
                                                  - Mock payment & JWT unlock tokens
                                                  - Video archives & download gating
```

---

## Quick Start (No Physical Camera Needed)

### Prerequisites
- **Node.js 18+** (Installed: Node 26)
- **FFmpeg** (Installed: FFmpeg 9.0)
- *Optional:* Docker (if you prefer Docker Compose over native MediaMTX binary)

### Option A: One-Click Launch (Windows)
Run the automated launcher:
```powershell
.\start-all.ps1
# or
.\start-all.bat
```
This automatically starts:
1. MediaMTX streaming server
2. Backend API & Web App at `http://localhost:4000`
3. Synthetic animated camera generator pushing a live match feed to Turf 1

To stop all running services cleanly:
```powershell
.\stop-all.ps1
# or
.\stop-all.bat
# or
npm run stop
```

---

### Option B: Step-by-Step Manual Launch

#### 1. Start MediaMTX Ingestion Server
```bash
# Windows native:
.\mediamtx\mediamtx.exe .\mediamtx\mediamtx.yml

# Or using Docker:
docker compose up -d
```

#### 2. Start Backend API & Web App
```bash
# Start backend (serves API on :4000 and the built frontend UI)
npm start
```
Open **`http://localhost:4000`** in your browser.

#### 3. Start the Synthetic Live Camera
In a new terminal:
```bash
# High-definition synthetic sports match pattern with real-time clock:
npm run simulate:camera

# Or stream a real looping MP4 clip:
node scripts/simulate-camera.js --turf turf1 --video /path/to/clip.mp4
```

---

## Automated Verification Tests

The repository includes a comprehensive automated test suite verifying all paywall and live feed rules:

```bash
npm test
```

### Verified Test Cases:
- [x] **Requirement 1**: Public live feed info accessible without login or booking
- [x] **Requirement 1**: Turf directory lists all turfs with live stream paths
- [x] **Requirement 2**: Replay archives calculate 2-hour window cutoff and expiry times
- [x] **Requirement 2a**: Sessions ended &le; 2 hours ago allow **FREE playback metadata** without tokens
- [x] **Requirement 2b**: Sessions ended &le; 2 hours ago allow **FREE direct video streaming** (`/stream`, HTTP 200, Range support)
- [x] **Requirement 2c**: Sessions ended &le; 2 hours ago allow **FREE downloads** without tokens
- [x] **Requirement 2d**: Playback metadata for sessions ended &gt; 2 hours ago is **BLOCKED by paywall (HTTP 403)**
- [x] **Requirement 2e**: Direct streaming (`/stream`) for sessions ended &gt; 2 hours ago is **BLOCKED by paywall (HTTP 403)**
- [x] **Requirement 2f**: Downloads for sessions ended &gt; 2 hours ago are **BLOCKED by paywall (HTTP 403)**
- [x] **Security**: Direct static route to recordings (`/public/recordings/...`) disabled to eliminate paywall bypass
- [x] **Monetization**: Simulated checkout for Single Match Pass issues valid access token
- [x] **Unlock**: Single Match token unlocks replay streaming and download for the purchased match
- [x] **Isolation**: Single Match token does NOT unlock a different match
- [x] **Multi-Pass**: Buying passes for multiple matches allows streaming and downloading each without token collision
- [x] **Subscription**: All-Access pass subscription unlocks ALL past sessions and downloads
- [x] **Route Reliability**: `/api/turfs/:id/archives` functions cleanly without Node internal assertion crash
- [x] **Requirement 3**: Camera status API reports ingestion endpoints and supported formats
- [x] **Error Handling**: Unknown API routes return clean 404 JSON
- [x] **Interactive Testing**: `POST /api/turfs/reset-demo` resets fixture times relative to current clock

---

## How Any Physical Camera Plugs In

Because MediaMTX acts as a normalizing media layer, you can deploy **any** camera hardware without changing the web application or backend:

| Camera Type | Connection Method | Configuration / Command |
|---|---|---|
| **Android Phone** (IP Webcam app) | RTSP Pull | Set app resolution to 1080p H.264. In `mediamtx.yml`, add: `source: rtsp://<phone-ip>:8080/h264_pcm.sdp` |
| **PoE IP Camera** (Hikvision / Dahua) | RTSP Pull | Configure camera to H.264. In `mediamtx.yml`: `source: rtsp://admin:pass@<cam-ip>:554/Streaming/Channels/101` |
| **Raspberry Pi + Pi Cam 3** | RTSP Push | Run: `libcamera-vid -t 0 --inline -o - \| ffmpeg -re -i - -c:v copy -f rtsp rtsp://<server>:8554/turf1` |
| **GoPro / Action Cam** | RTMP Push | In GoPro Quik app, set RTMP streaming destination to: `rtmp://<server>:1935/turf1` |
| **Simulated Camera** (Development) | RTSP Push | Run `node scripts/simulate-camera.js --turf turf1` |

> **Codec Note**: Always configure cameras to output **H.264** video. H.264 remuxes directly into HLS without server transcoding overhead and plays natively across 100% of desktop and mobile browsers.

---

## Interactive UI Features

- **Zero-Barrier Live Player**: Plays HLS feeds with low-latency segmenting via HLS.js. No login, registration, or booking screen is ever shown.
- **Turf Selector**: Switch dynamically between Turf 1 (Apex Football), Turf 2 (Vanguard Futsal), and Turf 3 (Thunder Cricket).
- **Match Archives**:
  - Green badges indicate matches within the **Free 2-Hour Replay Window** with a real-time countdown timer.
  - Amber badges indicate sessions older than 2 hours that are locked behind the paywall.
- **Paywall Modal**:
  - Lets visitors purchase a Single Match Pass ($1.99) or All-Access Subscription ($9.99/mo).
  - One-click test checkout simulates payment and unlocks replay & download immediately.
- **Subscriber Simulator**: Click *"Simulate Subscriber"* in the top navigation to instantly test subscriber paywall bypass.
- **Reset Demo Clock**: Click *"Reset Demo Clock"* in the header to re-anchor fixture timestamps relative to the current minute.
- **Camera Pipeline Guide**: Built-in modal with detailed hardware connection recipes.

---

## Project Structure

```
turf-live-2/
├── mediamtx/
│   ├── mediamtx.exe            # Precompiled MediaMTX Windows binary
│   └── mediamtx.yml            # RTSP (8554), RTMP (1935), HLS (8888) config
├── backend/
│   ├── package.json
│   ├── src/
│   │   ├── server.js           # Express API, paywall enforcement, static serving
│   │   ├── config.js           # Port configurations and 2-hour window rule
│   │   ├── db.js               # Turf records and seed archives data layer
│   │   ├── paymentService.js   # Mock checkout, JWT access tokens, receipts
│   │   └── mediaService.js     # MediaMTX stream status and sample clips
│   ├── tests/
│   │   └── api.test.js         # Integration tests for all core requirements
│   └── public/recordings/      # Generated sample match clips for testing
├── frontend/
│   ├── package.json            # Vite + React + HLS.js + Lucide Icons
│   ├── vite.config.js          # API proxy configuration
│   ├── index.html
│   └── src/
│       ├── App.jsx             # Main application orchestrator
│       ├── components/
│       │   ├── LivePlayer.jsx         # HLS.js zero-barrier live player
│       │   ├── TurfDirectory.jsx      # Turf switcher
│       │   ├── ReplayArchives.jsx     # Replay cards with 2hr countdown & paywall badges
│       │   ├── PaywallModal.jsx       # Checkout dialog with 1-click test unlock
│       │   ├── CameraSetupGuide.jsx   # Architectural diagram & camera recipes
│       │   └── Header.jsx             # Top bar, status pills & subscriber toggle
│       └── styles/
│           └── index.css              # Dark stadium sports theme
├── scripts/
│   ├── simulate-camera.js      # Cross-platform Node/FFmpeg camera generator
│   ├── fake-camera.ps1         # Windows PowerShell synthetic camera script
│   └── fake-camera.sh          # Linux/macOS synthetic camera script
├── docker-compose.yml          # Optional containerized MediaMTX setup
├── start-all.ps1               # Automated launcher for PowerShell
├── start-all.bat               # Automated launcher for CMD
├── package.json                # Root package scripts
└── README.md
```
