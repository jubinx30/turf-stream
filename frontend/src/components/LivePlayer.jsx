import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Volume2, VolumeX, Maximize2, Radio, Info, Eye, Camera, AlertCircle } from 'lucide-react';

export default function LivePlayer({ activeTurf, isMediaServerOnline, onOpenGuide }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [streamError, setStreamError] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [streamStats, setStreamStats] = useState({ resolution: '1080p', fps: 30, protocol: 'HLS (fMP4)' });

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
              // Stream not currently publishing or media server restarting
              setIsConnecting(false);
              setStreamError(true);
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari HLS
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
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="badge badge-live">
            <span className="badge-live-pulse" />
            <span>LIVE NOW</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{activeTurf?.name}</span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            &bull; {activeTurf?.sport} &bull; {activeTurf?.location}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="badge badge-free" title="Zero login or booking needed for live streams">
            <Radio size={12} />
            <span>100% Free Public Feed</span>
          </div>
        </div>
      </div>

      {/* Video Container */}
      <div className="player-container">
        <video
          ref={videoRef}
          className="player-video"
          playsInline
          muted={isMuted}
          autoPlay
        />

        {/* Top Overlay */}
        <div className="player-overlay">
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div className="player-info-pill">
              <span style={{ 
                width: 6, 
                height: 6, 
                borderRadius: '50%', 
                backgroundColor: !streamError ? '#10b981' : '#f59e0b' 
              }} />
              <span>{activeTurf?.dimensions}</span>
            </div>
            <div className="player-info-pill">
              <Eye size={12} className="text-emerald-400" />
              <span>{activeTurf?.activeViewers || 14} watching live</span>
            </div>
          </div>

          <div className="player-overlay-right">
            <button 
              onClick={toggleMute}
              className="player-info-pill"
              style={{ cursor: 'pointer' }}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <button 
              onClick={toggleFullscreen}
              className="player-info-pill"
              style={{ cursor: 'pointer' }}
              title="Fullscreen"
            >
              <Maximize2 size={14} />
            </button>
          </div>
        </div>

        {/* Offline / Waiting for Ingestion Camera */}
        {streamError && (
          <div className="player-offline-state">
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(245, 158, 11, 0.3)'
            }}>
              <Camera size={26} className="text-amber-400" />
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Camera Feed Standby ({activeTurf?.streamPath})
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto' }}>
                MediaMTX is ready to ingest. Start the synthetic camera or connect an RTSP/IP camera to publish live to this turf.
              </p>
            </div>

            <div style={{
              background: '#090d16',
              border: '1px solid #1e293b',
              borderRadius: 8,
              padding: '0.75rem 1rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: '#34d399',
              textAlign: 'left'
            }}>
              node scripts/simulate-camera.js --turf {activeTurf?.streamPath}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button 
                onClick={retryStream}
                className="btn btn-primary btn-sm"
              >
                <Radio size={14} />
                <span>Retry Connection</span>
              </button>
              <button 
                onClick={onOpenGuide}
                className="btn btn-secondary btn-sm"
              >
                <Info size={14} />
                <span>How to connect real IP cameras</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Under Player Stream Pipeline Info Bar */}
      <div style={{ 
        padding: '0.875rem 1.25rem', 
        background: '#0c121e', 
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        fontSize: '0.8125rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <span style={{ color: '#34d399', fontWeight: 600 }}>Active Ingestion:</span>
          <span>{activeTurf?.ingestionType}</span>
          <span>&bull;</span>
          <span>MediaMTX HLS Normalizer</span>
          <span>&bull;</span>
          <span style={{ color: '#38bdf8' }}>HLS.js fMP4</span>
        </div>

        <div style={{ color: 'var(--text-muted)' }}>
          RTSP Publish: <code style={{ fontFamily: 'var(--font-mono)', color: '#a5f3fc' }}>{activeTurf?.rtspPublishUrl}</code>
        </div>
      </div>
    </div>
  );
}
