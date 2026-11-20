import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Radio, 
  Eye, 
  Tv, 
  Activity, 
  Camera, 
  Sparkles, 
  Layers,
  ChevronRight
} from 'lucide-react';

export default function LivePlayer({ 
  activeTurf, 
  turfs = [], 
  onSelectTurf, 
  isMediaServerOnline 
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

  // Match minute ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setMatchMinute(m => (m >= 90 ? 1 : m + 1));
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const retryStream = () => {
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
        backBufferLength: 60
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsConnecting(false);
        setStreamError(false);
        video.play().then(() => setIsPlaying(true)).catch(() => {
          setIsPlaying(false);
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setIsConnecting(false);
              setStreamError(true);
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              setIsConnecting(false);
              setStreamError(true);
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsConnecting(false);
        setStreamError(false);
        video.play().then(() => setIsPlaying(true)).catch(() => {});
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
      el.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="ott-broadcast-container" id="live-player-section">
      {/* OTT Screen Frame */}
      <div className="ott-player-frame">
        {/* Real Video or High-Impact Sports Canvas */}
        <video
          ref={videoRef}
          className="ott-video-element"
          playsInline
          muted={isMuted}
          autoPlay
        />

        {/* Video Overlay / Top HUD */}
        <div className="ott-hud-overlay">
          <div className="ott-hud-top-left">
            <div className="ott-live-badge-glow">
              <span className="ott-pulse-beacon" />
              <span>LIVE BROADCAST</span>
            </div>

            <div className="ott-score-bug">
              <span className="bug-team home">TITANS</span>
              <span className="bug-score">2</span>
              <span className="bug-divider">-</span>
              <span className="bug-score">1</span>
              <span className="bug-team away">APEX</span>
              <span className="bug-clock">{matchMinute}'</span>
            </div>
          </div>

          <div className="ott-hud-top-right">
            {/* Camera angle switcher */}
            <div className="ott-cam-angle-selector">
              <Camera size={13} className="text-lime" />
              <select 
                value={cameraAngle} 
                onChange={(e) => setCameraAngle(e.target.value)}
                className="ott-cam-select"
              >
                <option value="Sideline HD">Cam 1: Sideline HD</option>
                <option value="Goal High">Cam 2: Goal End High</option>
                <option value="Tactical Drone">Cam 3: Tactical Aerial</option>
              </select>
            </div>

            {/* Viewers */}
            <div className="ott-pill-stat">
              <Eye size={13} className="text-lime" />
              <span>{activeTurf?.activeViewers || 38} live fans</span>
            </div>

            {/* Mute button */}
            <button 
              type="button"
              onClick={toggleMute}
              className="ott-control-btn"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            {/* Fullscreen */}
            <button 
              type="button"
              onClick={toggleFullscreen}
              className="ott-control-btn"
              title="Fullscreen"
            >
              <Maximize2 size={15} />
            </button>
          </div>
        </div>

        {/* Bottom Metadata Bar over Player */}
        <div className="ott-player-bottom-bar">
          <div className="ott-player-turf-info">
            <div className="turf-sport-tag">
              ⚽ {activeTurf?.sport} &bull; {activeTurf?.location}
            </div>
            <h1 className="turf-display-name">{activeTurf?.name}</h1>
          </div>

          <div className="ott-player-actions">
            <span className="ott-quality-pill">4K &bull; 60 FPS &bull; LOW LATENCY</span>
          </div>
        </div>

        {/* Stream Error / Standby Broadcast Screen */}
        {streamError && (
          <div className="ott-standby-screen">
            <div className="standby-ambient-glow" />
            <div className="standby-content">
              <div className="standby-icon-badge">
                <Radio size={24} className="text-lime" />
              </div>

              <div className="standby-text">
                <h3>Live Feed Standby &bull; Next Kick-Off Approaching</h3>
                <p>
                  Cameras are online at <strong>{activeTurf?.name}</strong>. MediaMTX ingestion pipeline is ready for camera stream.
                </p>
              </div>

              <div className="standby-controls">
                <button onClick={retryStream} className="btn btn-ott-lime btn-sm">
                  Retry Live Feed
                </button>
                <span className="free-public-guarantee">
                  ✓ 100% Free Public OTT Streaming &bull; No Login Required
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* OTT Channel Switcher Bar (Like DAZN / Apple TV Channels) */}
      <div className="ott-channels-bar">
        <div className="channels-bar-title">
          <Tv size={15} className="text-lime" />
          <span>CHANNELS ON AIR</span>
        </div>

        <div className="channels-scroll-row">
          {turfs.map((t) => {
            const isSelected = t.id === activeTurf?.id;
            return (
              <button
                key={t.id}
                type="button"
                className={`ott-channel-chip ${isSelected ? 'channel-active' : ''}`}
                onClick={() => onSelectTurf(t.id)}
              >
                <div className="channel-chip-thumb">
                  <img src={t.image || 'https://images.unsplash.com/photo-1529900241454-946a3628e93d?auto=format&fit=crop&w=200&q=80'} alt={t.name} />
                  <span className="channel-live-dot" />
                </div>
                <div className="channel-chip-info">
                  <span className="channel-name">{t.name}</span>
                  <span className="channel-sport">{t.sport} &bull; {t.priceFormatted || '$' + t.price}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
