import React, { useState } from 'react';
import { 
  Film, 
  Lock, 
  Unlock, 
  Download, 
  Play, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  X,
  ExternalLink 
} from 'lucide-react';

export default function ReplayArchives({ 
  archives, 
  onTriggerPaywall, 
  isSubscriber, 
  unlockedMatchIds = new Set(),
  getTokenForMatch 
}) {
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'free', 'paywalled'
  const [activeReplaySession, setActiveReplaySession] = useState(null);
  const [replayLoading, setReplayLoading] = useState(false);
  const [replayError, setReplayError] = useState(null);

  const filteredArchives = archives.filter(item => {
    if (selectedFilter === 'free') return !item.isOlderThan2Hours;
    if (selectedFilter === 'paywalled') return item.isOlderThan2Hours;
    return true;
  });

  const handleWatchReplay = async (session) => {
    const isUnlocked = isSubscriber || unlockedMatchIds.has(session.id) || !session.isOlderThan2Hours;
    
    if (!isUnlocked) {
      onTriggerPaywall(session);
      return;
    }

    setReplayLoading(true);
    setReplayError(null);
    setActiveReplaySession(session);

    try {
      // Query backend playback endpoint with match-specific token
      const token = getTokenForMatch ? getTokenForMatch(session.id) : (isSubscriber ? 'SIMULATED_ACTIVE_SUBSCRIBER' : null);
      const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
      const res = await fetch(`/api/archives/${session.id}/playback${tokenParam}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Access blocked by paywall');
      }

      setActiveReplaySession({
        ...session,
        playbackUrl: data.videoUrl,
        accessType: data.accessType
      });
    } catch (err) {
      setReplayError(err.message);
    } finally {
      setReplayLoading(false);
    }
  };

  const handleDownload = (session) => {
    const isUnlocked = isSubscriber || unlockedMatchIds.has(session.id) || !session.isOlderThan2Hours;
    
    if (!isUnlocked) {
      onTriggerPaywall(session);
      return;
    }

    const token = getTokenForMatch ? getTokenForMatch(session.id) : (isSubscriber ? 'SIMULATED_ACTIVE_SUBSCRIBER' : null);
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
    const downloadUrl = `/api/archives/${session.id}/download${tokenParam}`;
    window.open(downloadUrl, '_blank');
  };

  const formatRemainingTime = (ms) => {
    if (ms <= 0) return 'Expired';
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins}m left`;
  };

  return (
    <div className="card" style={{ marginTop: '2rem' }}>
      <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="card-title">
            <Film size={20} className="text-emerald-400" />
            <span>Match Archives & Replays</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            <strong>Rule:</strong> Replays are 100% free for 2 hours following live broadcast. After 2 hours, replay & download require access pass.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', background: '#090d16', padding: '0.25rem', borderRadius: 8, border: '1px solid var(--border-color)' }}>
          <button 
            className={`btn btn-sm ${selectedFilter === 'all' ? 'btn-secondary' : ''}`}
            style={{ color: selectedFilter === 'all' ? '#ffffff' : '#94a3b8' }}
            onClick={() => setSelectedFilter('all')}
          >
            All ({archives.length})
          </button>
          <button 
            className={`btn btn-sm ${selectedFilter === 'free' ? 'btn-secondary' : ''}`}
            style={{ color: selectedFilter === 'free' ? '#34d399' : '#94a3b8' }}
            onClick={() => setSelectedFilter('free')}
          >
            Free Window (&lt; 2h)
          </button>
          <button 
            className={`btn btn-sm ${selectedFilter === 'paywalled' ? 'btn-secondary' : ''}`}
            style={{ color: selectedFilter === 'paywalled' ? '#fbbf24' : '#94a3b8' }}
            onClick={() => setSelectedFilter('paywalled')}
          >
            Paywalled (&gt; 2h)
          </button>
        </div>
      </div>

      <div className="card-body">
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '1.25rem' 
        }}>
          {filteredArchives.map((session) => {
            const isUnlocked = isSubscriber || unlockedMatchIds.has(session.id) || !session.isOlderThan2Hours;
            const isFreeWindow = !session.isOlderThan2Hours;

            return (
              <div 
                key={session.id} 
                style={{
                  background: 'var(--bg-card-hover)',
                  border: isFreeWindow 
                    ? '1px solid rgba(16, 185, 129, 0.4)' 
                    : (isUnlocked ? '1px solid rgba(147, 51, 234, 0.4)' : '1px solid rgba(245, 158, 11, 0.35)'),
                  borderRadius: 14,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.25)'
                }}
              >
                {/* Thumbnail & Badges */}
                <div style={{ position: 'relative', height: 160, overflow: 'hidden', background: '#000' }}>
                  <img 
                    src={session.thumbnail} 
                    alt={session.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} 
                  />

                  {/* Top Status Badge */}
                  <div style={{ position: 'absolute', top: 10, left: 10 }}>
                    {isFreeWindow ? (
                      <div className="badge badge-free">
                        <Clock size={12} />
                        <span>Free Window ({formatRemainingTime(session.timeRemainingInFreeWindowMs)})</span>
                      </div>
                    ) : isUnlocked ? (
                      <div className="badge badge-sub">
                        <Unlock size={12} />
                        <span>Unlocked ({isSubscriber ? 'Subscriber' : 'Paid Pass'})</span>
                      </div>
                    ) : (
                      <div className="badge badge-locked">
                        <Lock size={12} />
                        <span>Paywalled (Ended {session.ageMinutes}m ago)</span>
                      </div>
                    )}
                  </div>

                  {/* Score pill */}
                  <div style={{ 
                    position: 'absolute', 
                    bottom: 10, 
                    right: 10, 
                    background: 'rgba(0, 0, 0, 0.8)', 
                    backdropFilter: 'blur(4px)',
                    padding: '0.2rem 0.6rem', 
                    borderRadius: 6,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {session.score}
                  </div>
                </div>

                {/* Session Details */}
                <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    {session.sport} &bull; Turf {session.turfId.toUpperCase()}
                  </div>

                  <h4 style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.35, marginBottom: '0.5rem' }}>
                    {session.title}
                  </h4>

                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem', flex: 1 }}>
                    {session.description}
                  </p>

                  {/* Actions Bar */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    gap: '0.5rem'
                  }}>
                    <button 
                      onClick={() => handleWatchReplay(session)}
                      className={`btn btn-sm ${isUnlocked ? 'btn-primary' : 'btn-warning'}`}
                      style={{ flex: 1 }}
                    >
                      {isUnlocked ? <Play size={14} /> : <Lock size={14} />}
                      <span>{isUnlocked ? 'Watch Replay' : 'Unlock ($1.99)'}</span>
                    </button>

                    <button 
                      onClick={() => handleDownload(session)}
                      className="btn btn-secondary btn-sm"
                      title={isUnlocked ? 'Download full match recording' : 'Download requires pass'}
                    >
                      <Download size={14} />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Replay Player for Authorized Sessions */}
      {activeReplaySession && (
        <div className="modal-backdrop" onClick={() => setActiveReplaySession(null)}>
          <div className="modal-content" style={{ maxWidth: 780 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge badge-free">
                    <Play size={12} />
                    <span>Authorized Replay</span>
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Access: {activeReplaySession.accessType === 'free_window' ? 'Free 2hr Window' : 'Paid Pass'}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.25rem' }}>
                  {activeReplaySession.title}
                </h3>
              </div>
              <button onClick={() => setActiveReplaySession(null)} className="btn btn-secondary btn-sm">
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1rem' }}>
              {replayLoading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                  Verifying access token and loading stream...
                </div>
              ) : replayError ? (
                <div className="notice-box" style={{ borderColor: '#f43f5e', color: '#fca5a5' }}>
                  <AlertTriangle size={18} />
                  <span>{replayError}</span>
                </div>
              ) : (
                <div style={{ borderRadius: 10, overflow: 'hidden', background: '#000' }}>
                  <video 
                    src={activeReplaySession.playbackUrl} 
                    controls 
                    autoPlay 
                    style={{ width: '100%', maxHeight: 420, display: 'block' }} 
                  />
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                onClick={() => handleDownload(activeReplaySession)}
                className="btn btn-secondary btn-sm"
              >
                <Download size={14} />
                <span>Download MP4 File</span>
              </button>
              <button 
                onClick={() => setActiveReplaySession(null)}
                className="btn btn-primary btn-sm"
              >
                Close Replay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
