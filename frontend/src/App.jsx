import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import LivePlayer from './components/LivePlayer';
import TurfMapView from './components/TurfMapView';
import TurfDirectory from './components/TurfDirectory';
import ReplayArchives from './components/ReplayArchives';
import TurfBookingModal from './components/TurfBookingModal';
import PaywallModal from './components/PaywallModal';
import CameraSetupGuide from './components/CameraSetupGuide';
import { Trophy, Radio, Film, MapPin, Compass, Shield, Cpu, RefreshCw, Search, X } from 'lucide-react';

export default function App() {
  const [turfs, setTurfs] = useState([]);
  const [activeTurfId, setActiveTurfId] = useState('turf1');
  const [archives, setArchives] = useState([]);
  const [mediaServerOnline, setMediaServerOnline] = useState(false);
  const [activeTab, setActiveTab] = useState('live');
  const [selectedSport, setSelectedSport] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchBoxRef = useRef(null);
  const [bookingTurf, setBookingTurf] = useState(null);
  const [isTechGuideOpen, setIsTechGuideOpen] = useState(false);

  const [isSubscriber, setIsSubscriber] = useState(() => {
    return localStorage.getItem('turf_is_subscriber') === 'true';
  });

  const [unlockedMatchIds, setUnlockedMatchIds] = useState(() => {
    try {
      const saved = localStorage.getItem('turf_unlocked_matches');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [matchTokens, setMatchTokens] = useState(() => {
    try {
      const saved = localStorage.getItem('turf_match_tokens');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [subscriptionToken, setSubscriptionToken] = useState(() => {
    return localStorage.getItem('turf_sub_token') || '';
  });

  const [paywallSession, setPaywallSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const getTokenForMatch = (matchId) => {
    if (subscriptionToken) return subscriptionToken;
    if (isSubscriber) return 'SIMULATED_ACTIVE_SUBSCRIBER';
    if (matchTokens[matchId]) return matchTokens[matchId];
    return null;
  };

  const loadTurfs = async () => {
    try {
      const res = await fetch('/api/turfs');
      const data = await res.json();
      if (data.success && data.data) {
        setTurfs(data.data);
        setMediaServerOnline(Boolean(data.mediaServerOnline));
      }
    } catch (err) {
      console.error('Failed to load turfs:', err);
    }
  };

  const loadArchives = async () => {
    try {
      const token = subscriptionToken || (isSubscriber ? 'SIMULATED_ACTIVE_SUBSCRIBER' : '');
      const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
      const res = await fetch(`/api/archives${tokenParam}`);
      const data = await res.json();
      if (data.success && data.data) {
        setArchives(data.data);
      }
    } catch (err) {
      console.error('Failed to load archives:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadTurfs(), loadArchives()]);
      setLoading(false);
    };
    init();

    const interval = setInterval(() => {
      loadTurfs();
      loadArchives();
    }, 5000);

    return () => clearInterval(interval);
  }, [subscriptionToken, isSubscriber]);

  const handleToggleSubscriber = () => {
    const nextState = !isSubscriber;
    setIsSubscriber(nextState);
    localStorage.setItem('turf_is_subscriber', String(nextState));
    if (!nextState) {
      setSubscriptionToken('');
      localStorage.removeItem('turf_sub_token');
    }
  };

  const handleUnlockSuccess = ({ planType, archiveId, token }) => {
    if (planType === 'subscription') {
      setSubscriptionToken(token);
      localStorage.setItem('turf_sub_token', token);
      setIsSubscriber(true);
      localStorage.setItem('turf_is_subscriber', 'true');
    } else if (archiveId) {
      setMatchTokens(prev => {
        const next = { ...prev, [archiveId]: token };
        localStorage.setItem('turf_match_tokens', JSON.stringify(next));
        return next;
      });
      setUnlockedMatchIds(prev => {
        const next = new Set(prev);
        next.add(archiveId);
        localStorage.setItem('turf_unlocked_matches', JSON.stringify(Array.from(next)));
        return next;
      });
    }

    setPaywallSession(null);
    loadArchives();
  };

  const handleResetFixtures = async () => {
    try {
      await fetch('/api/turfs/reset-demo', { method: 'POST' });
      await loadArchives();
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target)) {
        setIsSearchDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTurfs = turfs.filter(t => {
    const matchesSport = selectedSport === 'all' || 
      (t.category || t.sport || '').toLowerCase().includes(selectedSport);
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || 
      (t.name && t.name.toLowerCase().includes(query)) ||
      (t.location && t.location.toLowerCase().includes(query));
    return matchesSport && matchesSearch;
  });

  const activeTurf = filteredTurfs.find(t => t.id === activeTurfId) || 
    filteredTurfs[0] || 
    turfs.find(t => t.id === activeTurfId) || 
    turfs[0];

  const searchDropdownTurfs = searchQuery.trim()
    ? turfs.filter(t => t.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : [];

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'live') {
      document.getElementById('live-player-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'map') {
      document.getElementById('turf-map-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'grounds') {
      document.getElementById('grounds-near-me')?.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'replays') {
      document.getElementById('match-archives-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const sportsFilters = [
    { id: 'all', label: 'All Sports' },
    { id: 'football', label: '⚽ Football' },
    { id: 'futsal', label: '⚡ Futsal' },
    { id: 'cricket', label: '🏏 Box Cricket' }
  ];

  return (
    <div className="ott-app-root">
      {/* Sleek Top Navigation */}
      <Header
        isSubscriber={isSubscriber}
        onToggleSubscriber={handleToggleSubscriber}
        onResetFixtures={handleResetFixtures}
        turfsCount={turfs.length}
        mediaServerOnline={mediaServerOnline}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenTechGuide={() => setIsTechGuideOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content Area */}
      <main className="ott-main-content">
        {/* Home Screen Search & Filter Toolbar */}
        <div className="ott-home-toolbar">
          {/* Prominent Turf Name Search Bar */}
          <div className="ott-search-bar-wrap" ref={searchBoxRef}>
            <div className="ott-search-input-box">
              <Search size={17} className="ott-search-icon" />
              <input
                type="text"
                className="ott-search-input"
                placeholder="Search turfs by name (e.g. Greenfield, Vanguard, Apex...)"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchDropdownOpen(true);
                }}
                onFocus={() => setIsSearchDropdownOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsSearchDropdownOpen(false);
                  } else if (e.key === 'Enter' && filteredTurfs.length > 0) {
                    setActiveTurfId(filteredTurfs[0].id);
                    setIsSearchDropdownOpen(false);
                    document.getElementById('live-player-section')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="ott-search-clear-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchDropdownOpen(false);
                  }}
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Quick Autocomplete Suggestions Dropdown */}
            {isSearchDropdownOpen && searchQuery.trim().length > 0 && (
              <div className="ott-search-dropdown-menu">
                {searchDropdownTurfs.length > 0 ? (
                  searchDropdownTurfs.map((turf) => (
                    <div
                      key={turf.id}
                      className="ott-search-dropdown-row"
                      onClick={() => {
                        setActiveTurfId(turf.id);
                        setSearchQuery(turf.name);
                        setIsSearchDropdownOpen(false);
                        document.getElementById('live-player-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      <img 
                        src={turf.image || 'https://images.unsplash.com/photo-1529900241454-946a3628e93d?auto=format&fit=crop&w=400&q=80'} 
                        alt={turf.name}
                        className="ott-search-thumb" 
                      />
                      <div className="ott-search-details">
                        <div className="ott-search-name-row">
                          <span className="ott-search-name">{turf.name}</span>
                          {turf.isLive && (
                            <span className="ott-search-live-badge">LIVE</span>
                          )}
                        </div>
                        <span className="ott-search-sub">
                          {turf.sport} &bull; {turf.location}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="ott-search-empty-dropdown">
                    No turfs matching "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Sport Selector Bar (Clean Hotstar / Sony LIV style) */}
          <div className="ott-sport-category-bar">
            <div className="sport-pills-row">
              {sportsFilters.map((cat) => {
                const isActive = selectedSport === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`sport-pill-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedSport(cat.id)}
                  >
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active Search Results Indicator */}
        {searchQuery.trim() && (
          <div className="ott-search-status-bar">
            <span>
              Search results for "<strong>{searchQuery}</strong>" ({filteredTurfs.length} {filteredTurfs.length === 1 ? 'venue' : 'venues'} found)
            </span>
            <button
              type="button"
              className="ott-search-reset-link"
              onClick={() => setSearchQuery('')}
            >
              Reset Search
            </button>
          </div>
        )}

        {/* Hero Live Broadcast Stage & Channels Switcher */}
        <LivePlayer
          activeTurf={activeTurf}
          turfs={filteredTurfs}
          onSelectTurf={setActiveTurfId}
          isMediaServerOnline={mediaServerOnline}
          onBookTurf={(turf) => setBookingTurf(turf)}
        />

        {/* Match Archives & Replays (VOD) */}
        <ReplayArchives
          archives={archives}
          onTriggerPaywall={(session) => setPaywallSession(session)}
          isSubscriber={isSubscriber}
          unlockedMatchIds={unlockedMatchIds}
          getTokenForMatch={getTokenForMatch}
        />

        {/* Turf Arenas & Grounds Directory */}
        <TurfDirectory
          turfs={filteredTurfs}
          activeTurfId={activeTurfId}
          onSelectTurf={setActiveTurfId}
          onBookTurf={(turf) => setBookingTurf(turf)}
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery('')}
        />

        {/* Turf Radar (Map View) */}
        <TurfMapView 
          turfs={filteredTurfs.length > 0 ? filteredTurfs : (searchQuery.trim() ? [] : turfs)}
          activeTurfId={activeTurfId}
          onSelectTurf={setActiveTurfId}
          onBookTurf={(turf) => setBookingTurf(turf)}
        />
      </main>

      {/* Standard OTT Footer */}
      <footer className="ott-footer">
        <div className="ott-footer-inner">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="logo-turf">TURF</span>
              <span className="logo-live-badge">LIVE</span>
            </div>
            <p className="footer-tagline">
              Grassroots Sports OTT Streaming Platform. Watch live local matches, replays, and book premium arena slots.
            </p>
          </div>

          <div className="footer-links-group">
            <h4 className="footer-title">Browse</h4>
            <button type="button" onClick={() => handleSelectTab('live')} className="footer-link">Live Stream</button>
            <button type="button" onClick={() => handleSelectTab('replays')} className="footer-link">Match Replays</button>
            <button type="button" onClick={() => handleSelectTab('grounds')} className="footer-link">Grounds & Turfs</button>
            <button type="button" onClick={() => handleSelectTab('map')} className="footer-link">Turf Radar</button>
          </div>

          <div className="footer-links-group">
            <h4 className="footer-title">For Turf Operators</h4>
            <button type="button" onClick={() => setIsTechGuideOpen(true)} className="footer-link">
              Camera Setup & Ingestion
            </button>
            <button type="button" onClick={handleResetFixtures} className="footer-link">
              Reset Demo Fixtures
            </button>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} TurfLive OTT. All rights reserved.</span>
          <span className="footer-status-pill">
            System: {mediaServerOnline ? '🟢 Streaming Online' : '🟡 Standby'}
          </span>
        </div>
      </footer>

      {/* Slot Booking Sheet / Modal */}
      <TurfBookingModal
        turf={bookingTurf}
        isOpen={Boolean(bookingTurf)}
        onClose={() => setBookingTurf(null)}
        onSelectLive={(turfId) => {
          setActiveTurfId(turfId);
          document.getElementById('live-player-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Paywall Checkout Modal */}
      {paywallSession && (
        <PaywallModal
          session={paywallSession}
          onClose={() => setPaywallSession(null)}
          onUnlockSuccess={handleUnlockSuccess}
        />
      )}

      {/* Hardware / Ingestion Tech Architecture Guide */}
      <CameraSetupGuide
        isOpen={isTechGuideOpen}
        onClose={() => setIsTechGuideOpen(false)}
      />
    </div>
  );
}
