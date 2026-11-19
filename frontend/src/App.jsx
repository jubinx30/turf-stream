import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import LivePlayer from './components/LivePlayer';
import TurfDirectory from './components/TurfDirectory';
import ReplayArchives from './components/ReplayArchives';
import PaywallModal from './components/PaywallModal';
import CameraSetupGuide from './components/CameraSetupGuide';

export default function App() {
  const [turfs, setTurfs] = useState([]);
  const [activeTurfId, setActiveTurfId] = useState('turf1');
  const [archives, setArchives] = useState([]);
  const [mediaServerOnline, setMediaServerOnline] = useState(false);
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
  const [isGuideOpen, setIsGuideOpen] = useState(false);
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

  const activeTurf = turfs.find(t => t.id === activeTurfId) || turfs[0];

  return (
    <div className="app-container">
      {/* Navigation Header */}
      <Header 
        isSubscriber={isSubscriber}
        onToggleSubscriber={handleToggleSubscriber}
        onOpenGuide={() => setIsGuideOpen(true)}
        onResetFixtures={handleResetFixtures}
        turfsCount={turfs.length}
        mediaServerOnline={mediaServerOnline}
      />

      {/* Main Body */}
      <main className="main-content">
        {/* Banner highlighting the 2 core user requirements */}
        <div style={{
          background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: 12,
          padding: '0.875rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ 
              background: '#10b981', 
              color: '#042f1a', 
              fontWeight: 800, 
              fontSize: '0.7rem', 
              padding: '0.2rem 0.5rem', 
              borderRadius: 6 
            }}>
              ARCHITECTURE RULES
            </span>
            <span style={{ color: '#e2e8f0' }}>
              <strong>1. Public Live Feed:</strong> 100% free streaming for anyone, zero login/booking required.
              &bull; 
              <strong>2. Paywall:</strong> Replays older than 2 hours require pass/subscription.
            </span>
          </div>

          <div style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 600 }}>
            Camera Agnostic Pipeline &bull; MediaMTX Normalizer
          </div>
        </div>

        {/* Live Stage & Turf Directory Grid */}
        <div className="grid-layout">
          <div>
            <LivePlayer 
              activeTurf={activeTurf} 
              isMediaServerOnline={mediaServerOnline}
              onOpenGuide={() => setIsGuideOpen(true)}
            />
          </div>

          <div>
            <TurfDirectory 
              turfs={turfs}
              activeTurfId={activeTurfId}
              onSelectTurf={setActiveTurfId}
            />
          </div>
        </div>

        {/* Match Archives & 2-Hour Paywalled Replays */}
        <ReplayArchives 
          archives={archives}
          onTriggerPaywall={(session) => setPaywallSession(session)}
          isSubscriber={isSubscriber}
          unlockedMatchIds={unlockedMatchIds}
          getTokenForMatch={getTokenForMatch}
        />
      </main>

      {/* Paywall Checkout Modal */}
      {paywallSession && (
        <PaywallModal 
          session={paywallSession}
          onClose={() => setPaywallSession(null)}
          onUnlockSuccess={handleUnlockSuccess}
        />
      )}

      {/* Camera Pipeline Architecture Guide Modal */}
      <CameraSetupGuide 
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
