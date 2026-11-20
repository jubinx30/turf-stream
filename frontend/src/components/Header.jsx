import React from 'react';
import { 
  Tv, 
  MapPin, 
  Film, 
  Zap, 
  RefreshCw, 
  CheckCircle2, 
  Cpu, 
  Radio, 
  Compass
} from 'lucide-react';

export default function Header({ 
  isSubscriber, 
  onToggleSubscriber, 
  onResetFixtures, 
  turfsCount = 5,
  mediaServerOnline = false,
  activeTab = 'live',
  onSelectTab,
  onOpenTechGuide
}) {
  return (
    <header className="ott-header">
      <div className="ott-header-inner">
        {/* Left: Brand Logo & OTT Live Indicator */}
        <div className="ott-brand-group">
          <div className="ott-brand-icon">
            <span className="brand-bolt">⚡</span>
          </div>
          <div>
            <div className="ott-brand-title-wrap">
              <span className="ott-brand-title">TURF LIVE</span>
              <span className="ott-brand-badge">OTT SPORTS</span>
            </div>
            <p className="ott-brand-tagline">
              Grassroots Sports Arena &bull; Live Match Broadcasts
            </p>
          </div>
        </div>

        {/* Center: Sports OTT Navigation Links */}
        <nav className="ott-nav-tabs">
          <button 
            type="button"
            className={`ott-nav-tab ${activeTab === 'live' ? 'active' : ''}`}
            onClick={() => onSelectTab('live')}
          >
            <Radio size={14} className="tab-icon" />
            <span>Live Broadcast</span>
          </button>

          <button 
            type="button"
            className={`ott-nav-tab ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => onSelectTab('map')}
          >
            <Compass size={14} className="tab-icon" />
            <span>Map Radar</span>
          </button>

          <button 
            type="button"
            className={`ott-nav-tab ${activeTab === 'grounds' ? 'active' : ''}`}
            onClick={() => onSelectTab('grounds')}
          >
            <MapPin size={14} className="tab-icon" />
            <span>Grounds Near Me</span>
          </button>

          <button 
            type="button"
            className={`ott-nav-tab ${activeTab === 'replays' ? 'active' : ''}`}
            onClick={() => onSelectTab('replays')}
          >
            <Film size={14} className="tab-icon" />
            <span>Replays & VOD</span>
          </button>
        </nav>

        {/* Right: VIP Pass & Controls */}
        <div className="ott-header-actions">
          {/* Tech Ingestion Guide */}
          <button 
            type="button"
            className="ott-icon-button"
            onClick={onOpenTechGuide}
            title="Camera Ingestion & Hardware Specs"
          >
            <Cpu size={15} />
            <span className="btn-label-desktop">Camera Ingest</span>
          </button>

          {/* Reset Schedule Fixtures Button */}
          <button 
            type="button"
            className="ott-icon-button"
            onClick={onResetFixtures}
            title="Refresh match timetable relative to now"
          >
            <RefreshCw size={14} />
          </button>

          {/* All-Access VIP Pass Pill */}
          <button 
            type="button"
            onClick={onToggleSubscriber}
            className={`ott-pass-button ${isSubscriber ? 'is-active-pass' : ''}`}
            title="Toggle All-Access subscriber membership"
          >
            {isSubscriber ? <CheckCircle2 size={14} /> : <Zap size={14} />}
            <span>{isSubscriber ? 'VIP All-Access Active' : 'Get VIP Pass'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
