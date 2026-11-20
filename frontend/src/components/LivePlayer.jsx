import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  Volume2,
  VolumeX,
  Maximize2,
  Radio,
  Eye,
  RefreshCw,
  Camera,
  Calendar,
  Sparkles,
  Play
} from 'lucide-react';

export default function LivePlayer({
  activeTurf,
  turfs = [],
  onSelectTurf,
  isMediaServerOnline,
  onBookTurf
}) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [streamError, setStreamError] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [cameraAngle, setCameraAngle] = useState('Sideline HD');
  const [matchMinute, setMatchMinute] = useState(64);
  const retryCountRef = useRef(0);

  // Match minute ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setMatchMinute(m => (m >= 90 ? 1 : m + 1));
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const retryStream = () => {
    retryCountRef.current = 0;
    setStreamError(false);
    setIsConnecting(true);
    setReloadKey(k => k + 1);
  };

  useEffect(() => {
    if (!activeTurf) return;

    const video = videoRef.current;
    if (!video) return;

    setStreamError(false);
    setIsConnecting(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = activeTurf.hlsUrl;

    if (Hls.isSupported()) {
      const hls = new Hls({
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 6,
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
        manifestLoadingMaxRetry: 5,
        manifestLoadingRetryDelay: 1000
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsConnecting(false);
        setStreamError(false);
        retryCountRef.current = 0;

        video.muted = true;
        video.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          setIsPlaying(false);
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (retryCountRef.current < 4) {
                retryCountRef.current += 1;
                hls.startLoad();
              } else {
                setIsConnecting(false);
                setStreamError(true);
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setIsConnecting(false);
              setStreamError(true);
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.muted = true;
      video.addEventListener('loadedmetadata', () => {
        setIsConnecting(false);
        setStreamError(false);
        video.play().then(() => setIsPlaying(true)).catch(() => { });
      });
      video.addEventListener('error', () => {
        setIsConnecting(false);
        setStreamError(true);
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeTurf, reloadKey]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const toggleFullscreen = () => {
    const el = videoRef.current?.parentElement;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  };

  return (
    <div className="ott-hero-section" id="live-player-section">
      {/* Cinematic Main Screen */}
      <div className="ott-player-wrapper">
        <div className="ott-video-viewport">
          <video
            ref={videoRef}
            className="ott-video-surface"
            playsInline
            muted={isMuted}
            autoPlay
            poster="/sample-feed-poster.jpg"
          />

          {/* Clean Gradient Shading for Text Visibility */}
          <div className="ott-screen-vignette" />

          {/* Top Overlaid HUD Controls */}
          <div className="ott-overlay-header">
            {/* Live Indicator & Score Bug */}
            <div className="ott-header-left">
              <div className="ott-live-tag">
                <span className="live-pulse-dot" />
                <span>LIVE</span>
              </div>

              <div className="ott-scoreboard">
                <span className="scoreboard-team">TITANS</span>
                <span className="scoreboard-goals">2 - 1</span>
                <span className="scoreboard-team">APEX</span>
                <span className="scoreboard-minute">{matchMinute}'</span>
              </div>
            </div>

            {/* Right Controls */}
            <div className="ott-header-right">
              {/* Camera Switcher Dropdown */}
              <div className="ott-cam-pill">
                <Camera size={13} />
                <select
                  value={cameraAngle}
                  onChange={(e) => setCameraAngle(e.target.value)}
                  className="ott-cam-dropdown"
                >
                  <option value="Sideline HD">Cam 1: Sideline</option>
                  <option value="Goal High">Cam 2: Goal End</option>
                  <option value="Tactical Drone">Cam 3: Aerial</option>
                </select>
              </div>

              {/* Viewers Pill */}
              <div className="ott-viewer-pill">
                <Eye size={13} />
                <span>{activeTurf?.activeViewers || 42}</span>
              </div>

              {/* Sound Button */}
              <button
                type="button"
                onClick={toggleMute}
                className="ott-player-btn"
                title={isMuted ? 'Unmute' : 'Mute'}
                aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>

              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="ott-player-btn"
                title="Fullscreen"
                aria-label="Toggle fullscreen"
              >
                <Maximize2 size={16} />
              </button>
            </div>
          </div>

          {/* Standby / Next Match Screen */}
          {streamError && (
            <div className="ott-standby-overlay">
              <div className="standby-box">
                <div className="standby-badge">
                  <Radio size={20} className="text-blue" />
                </div>
                <h3>Match Feed Standby</h3>
                <p>
                  Broadcasting live from <strong>{activeTurf?.name}</strong>. Stream is synchronizing with the arena camera feed.
                </p>
                <button onClick={retryStream} className="btn-ott-primary btn-sm">
                  <RefreshCw size={14} />
                  <span>Retry Feed</span>
                </button>
              </div>
            </div>
          )}

          {/* Bottom Title & Match Info Bar */}
          <div className="ott-player-info-strip">
            <div className="info-main">
              <span className="info-sport-label">
                {activeTurf?.sport} &bull; {activeTurf?.location}
              </span>
              <h1 className="info-title">{activeTurf?.name}</h1>
            </div>

            <div className="info-actions">
              <span className="ott-badge-quality">1080p 60FPS</span>
              {onBookTurf && (
                <button
                  type="button"
                  onClick={() => onBookTurf(activeTurf)}
                  className="btn-ott-action"
                >
                  <Calendar size={14} />
                  <span>Book This Ground</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setStreamError(false);
                  setIsConnecting(false);
                  if (hlsRef.current) {
                    hlsRef.current.destroy();
                    hlsRef.current = null;
                  }
                  const v = videoRef.current;
                  if (v) {
                    v.src = '/sample-feed.mp4';
                    v.loop = true;
                    v.muted = isMuted;
                    v.play().catch(() => { });
                  }
                }}
                className="btn btn-sm"
                style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Play size={13} />
                <span>Preview Sample Feed</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Channels On Air / Turf Switcher Rail */}
      <div className="ott-channels-container">
        <div className="channels-section-header">
          <div className="section-title-group">
            <span className="live-dot-mini" />
            <span className="channels-title-text">CHANNELS ON AIR</span>
          </div>
          <span className="channels-subtitle-text">Select an arena to switch broadcast</span>
        </div>

        <div className="channels-card-row">
          {turfs.length === 0 ? (
            <div className="channels-empty-notice">
              <span>No active channels matching your turf search.</span>
            </div>
          ) : (
            turfs.map((t) => {
              const isSelected = t.id === activeTurf?.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`channel-card ${isSelected ? 'is-active' : ''}`}
                  onClick={() => onSelectTurf(t.id)}
                >
                  <div className="channel-thumb-box">
                    <img 
                      src={t.image || 'https://images.unsplash.com/photo-1529900241454-946a3628e93d?auto=format&fit=crop&w=400&q=80'} 
                      alt={t.name}
                      className="channel-thumb-img" 
                    />
                    <div className="channel-thumb-overlay" />
                    {t.isLive ? (
                      <span className="channel-live-badge">
                        <span className="channel-live-dot" />
                        LIVE
                      </span>
                    ) : null}
                    <span className="channel-viewers-count">
                      {t.activeViewers || 30}+ watching
                    </span>
                  </div>
                  <div className="channel-card-body">
                    <h4 className="channel-name">{t.name}</h4>
                    <p className="channel-details">
                      {t.sport} &bull; {t.location}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
