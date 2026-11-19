import React from 'react';
import { Video, ShieldCheck, Zap, RefreshCw, Cpu, CheckCircle2 } from 'lucide-react';

export default function Header({ 
  isSubscriber, 
  onToggleSubscriber, 
  onOpenGuide, 
  onResetFixtures, 
  turfsCount = 3,
  mediaServerOnline = false 
}) {
  return (
    <header className="header">
      <div className="header-inner">
        {/* Brand */}
        <div className="logo-group">
          <div className="brand-icon">
            <Video className="w-5 h-5 text-slate-950" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="brand-title">TURF LIVE</span>
              <span className="brand-tag">PUBLIC FEED</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Open Live Ingestion &bull; 2-Hour Replay Paywall Architecture
            </p>
          </div>
        </div>

        {/* Status Indicators & Test Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Media Server Status */}
          <div className="player-info-pill" title="MediaMTX Ingestion Gateway">
            <span style={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              backgroundColor: mediaServerOnline ? '#10b981' : '#f59e0b' 
            }} />
            <span style={{ fontSize: '0.75rem' }}>
              Media Server: {mediaServerOnline ? 'Ready' : 'Standby'}
            </span>
          </div>

          {/* Camera Setup Guide Button */}
          <button 
            className="btn btn-secondary btn-sm"
            onClick={onOpenGuide}
            title="View camera ingestion recipes (Android, PoE, Pi Cam)"
          >
            <Cpu size={14} className="text-cyan-400" />
            <span>Camera Pipeline Guide</span>
          </button>

          {/* Reset Demo Fixtures Button */}
          <button 
            className="btn btn-secondary btn-sm"
            onClick={onResetFixtures}
            title="Reset match timestamps relative to now for testing 2hr paywall"
          >
            <RefreshCw size={14} />
            <span>Reset Demo Clock</span>
          </button>

          {/* Subscriber Simulator Toggle */}
          <button 
            onClick={onToggleSubscriber}
            className={`btn btn-sm ${isSubscriber ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
              border: isSubscriber ? '1px solid #10b981' : '1px dashed #64748b',
              backgroundColor: isSubscriber ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: isSubscriber ? '#34d399' : '#94a3b8'
            }}
            title="Toggle subscriber status to test paywall bypass"
          >
            {isSubscriber ? <CheckCircle2 size={14} /> : <Zap size={14} />}
            <span>{isSubscriber ? 'Subscriber Active (Unlocked)' : 'Simulate Subscriber'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
