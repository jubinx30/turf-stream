import React, { useState, useRef, useEffect } from 'react';
import { 
  Radio, 
  Compass, 
  MapPin, 
  Film, 
  Crown, 
  Zap, 
  CheckCircle2, 
  MoreVertical, 
  Cpu, 
  RefreshCw,
  Search,
  X,
  ChevronDown
} from 'lucide-react';

export default function Header({
  isSubscriber,
  onToggleSubscriber,
  onResetFixtures,
  turfsCount = 5,
  mediaServerOnline = false,
  activeTab = 'live',
  onSelectTab,
  onOpenTechGuide,
  searchQuery = '',
  onSearchChange
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="ott-navbar">
      <div className="ott-navbar-container">
        {/* Left: Brand Identity */}
        <div className="ott-brand-section" onClick={() => onSelectTab && onSelectTab('live')}>
          <div className="ott-logo-mark">
            <span className="logo-turf">TURF</span>
            <span className="logo-live-badge">LIVE</span>
          </div>
          <div className="ott-brand-sub">SPORTS OTT</div>
        </div>

        {/* Center: Main OTT Navigation Tabs */}
        <nav className="ott-nav-links">
          <button 
            type="button"
            className={`ott-nav-link ${activeTab === 'live' ? 'active' : ''}`}
            onClick={() => onSelectTab && onSelectTab('live')}
          >
            <Radio size={15} className="ott-tab-icon live-indicator-dot" />
            <span>Live Stream</span>
          </button>

          <button 
            type="button"
            className={`ott-nav-link ${activeTab === 'replays' ? 'active' : ''}`}
            onClick={() => onSelectTab && onSelectTab('replays')}
          >
            <Film size={15} className="ott-tab-icon" />
            <span>Replays & Matches</span>
          </button>

          <button 
            type="button"
            className={`ott-nav-link ${activeTab === 'grounds' ? 'active' : ''}`}
            onClick={() => onSelectTab && onSelectTab('grounds')}
          >
            <MapPin size={15} className="ott-tab-icon" />
            <span>Turf Arenas</span>
          </button>

          <button 
            type="button"
            className={`ott-nav-link ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => onSelectTab && onSelectTab('map')}
          >
            <Compass size={15} className="ott-tab-icon" />
            <span>Turf Radar</span>
          </button>
        </nav>

        {/* Right: Search, VIP Pass & Tools */}
        <div className="ott-navbar-right">
          {/* Header Search Input */}
          <div className="ott-header-search">
            <Search size={14} className="ott-header-search-icon" />
            <input
              type="text"
              placeholder="Search turfs..."
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              className="ott-header-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="ott-header-search-clear"
                onClick={() => onSearchChange && onSearchChange('')}
                title="Clear search"
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* VIP Pass CTA Button (Hotstar / Sony LIV Style) */}
          <button
            type="button"
            onClick={onToggleSubscriber}
            className={`ott-subscribe-btn ${isSubscriber ? 'is-subscribed' : ''}`}
            title="Toggle All-Access VIP Subscription"
          >
            {isSubscriber ? (
              <>
                <CheckCircle2 size={15} className="vip-icon" />
                <span>VIP Active</span>
              </>
            ) : (
              <>
                <Crown size={15} className="vip-icon text-amber" />
                <span>Get VIP Pass</span>
              </>
            )}
          </button>

          {/* More Options Dropdown (Cleanly tucks technical tools out of normal user's way) */}
          <div className="ott-dropdown-wrapper" ref={menuRef}>
            <button
              type="button"
              className="ott-icon-button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              title="Settings & Tools"
              aria-label="Settings"
            >
              <MoreVertical size={18} />
            </button>

            {isMenuOpen && (
              <div className="ott-dropdown-menu">
                <div className="dropdown-header">System Tools</div>
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (onResetFixtures) onResetFixtures();
                  }}
                >
                  <RefreshCw size={14} />
                  <span>Reset Match Timetable</span>
                </button>
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (onOpenTechGuide) onOpenTechGuide();
                  }}
                >
                  <Cpu size={14} />
                  <span>Camera Ingest Guide</span>
                </button>
                <div className="dropdown-footer">
                  <span>Server: {mediaServerOnline ? '🟢 Connected' : '🟡 Standby'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
