import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import LivePlayer from './components/LivePlayer';
import TurfMapView from './components/TurfMapView';
import TurfDirectory from './components/TurfDirectory';
import ReplayArchives from './components/ReplayArchives';
import TurfBookingModal from './components/TurfBookingModal';
import PaywallModal from './components/PaywallModal';
import CameraSetupGuide from './components/CameraSetupGuide';
import { Compass, Flame, ShieldAlert, Sparkles, Trophy } from 'lucide-react';

export default function App() {
  const [turfs, setTurfs] = useState([]);
  const [activeTurfId, setActiveTurfId] = useState('turf1');
  const [archives, setArchives] = useState([]);
  const [mediaServerOnline, setMediaServerOnline] = useState(false);
  const [activeTab, setActiveTab] = useState('live');
  const [selectedSport, setSelectedSport] = useState('all');
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

  // Store individual match tokens to prevent one match pass from overwriting another
  const [matchTokens, setMatchTokens] = useState(() => {
    try {
      const saved = localStorage.getItem('turf_match_tokens');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Store monthly all-access subscription token
  const [subscriptionToken, setSubscriptionToken] = useState(() => {
    return localStorage.getItem('turf_sub_token') || '';
  });

  const [paywallSession, setPaywallSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to resolve the correct token for any given match
  const getTokenForMatch = (matchId) => {
    if (subscriptionToken) return subscriptionToken;
    if (isSubscriber) return 'SIMULATED_ACTIVE_SUBSCRIBER';
    if (matchTokens[matchId]) return matchTokens[matchId];
    return null;
  };

  // Fetch turfs and media status
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

  // Fetch archives with token if available
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

    // Periodic refresh every 5 seconds to track live ingestion and countdowns
    const interval = setInterval(() => {
      loadTurfs();
      loadArchives();
    }, 5000);

    return () => clearInterval(interval);
  }, [subscriptionToken, isSubscriber]);

  // Toggle subscriber mode (for easy reviewer testing)
  const handleToggleSubscriber = () => {
    const nextState = !isSubscriber;
    setIsSubscriber(nextState);
    localStorage.setItem('turf_is_subscriber', String(nextState));
    if (!nextState) {
      setSubscriptionToken('');
      localStorage.removeItem('turf_sub_token');
    }
  };

  // Paywall checkout completed
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

  // Reset fixtures relative to current time
  const handleResetFixtures = async () => {
    try {
      await fetch('/api/turfs/reset-demo', { method: 'POST' });
      await loadArchives();
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  // Filter turfs based on sport selection
  const filteredTurfs = turfs.filter(t => {
    if (selectedSport === 'all') return true;
    return (t.category || t.sport || '').toLowerCase().includes(selectedSport);
  });

  const activeTurf = turfs.find(t => t.id === activeTurfId) || turfs[0];

  // Tab navigation scroll helper
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

  // Sports category list matching the user reference
  const sportsCategories = [
    { 
      id: 'all', 
      title: 'ALL SPORTS', 
      img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=400&q=80' 
    },
    { 
      id: 'football', 
      title: 'FOOTBALL', 
      img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=400&q=80' 
    },
    { 
      id: 'futsal', 
      title: 'FUTSAL', 
      img: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=400&q=80' 
    },
    { 
      id: 'cricket', 
      title: 'BOX CRICKET', 
      img: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=400&q=80' 
    }
  ];

  return (
    <div className="app-container">
      {/* Navigation Header */}
      <Header 
        isSubscriber={isSubscriber}
        onToggleSubscriber={handleToggleSubscriber}
        onResetFixtures={handleResetFixtures}
        turfsCount={turfs.length}
        mediaServerOnline={mediaServerOnline}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenTechGuide={() => setIsTechGuideOpen(true)}
      />

      {/* Main Body */}
      <main className="main-content">
        {/* Choose Your Sport Carousel (User Reference Image Style) */}
        <section className="choose-sport-section">
          <div className="section-title-subtle">
            <Trophy size={14} className="text-lime" />
            <span>Choose your sport</span>
          </div>

          <div className="sport-cards-row">
            {sportsCategories.map((cat) => {
              const isActive = selectedSport === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`sport-category-card ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedSport(cat.id)}
                >
                  <img src={cat.img} alt={cat.title} className="sport-card-bg" />
                  <div className="sport-card-overlay" />
                  <span className="sport-card-text">{cat.title}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Live Sports OTT Player & TV Channel Switcher Bar */}
        <LivePlayer 
          activeTurf={activeTurf}
          turfs={filteredTurfs.length ? filteredTurfs : turfs}
          onSelectTurf={setActiveTurfId}
          isMediaServerOnline={mediaServerOnline}
        />

        {/* Interactive Map View Section with Markers */}
        <TurfMapView 
          turfs={turfs}
          activeTurfId={activeTurfId}
          onSelectTurf={setActiveTurfId}
          onBookTurf={(turf) => setBookingTurf(turf)}
        />

        {/* Grounds Near Me Section (Matching Reference Style) */}
        <TurfDirectory 
          turfs={filteredTurfs.length ? filteredTurfs : turfs}
          activeTurfId={activeTurfId}
          onSelectTurf={setActiveTurfId}
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
      </main>

      {/* Slot Booking Sheet / Modal (Matches User Reference Image) */}
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
