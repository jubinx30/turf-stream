import React, { useState } from 'react';
import { 
  Film, 
  Lock, 
  Unlock, 
  Download, 
  Play, 
  Clock, 
  AlertTriangle, 
  X,
  Sparkles
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
    const hasPaidAccess = isSubscriber || unlockedMatchIds.has(session.id);
    
    if (!hasPaidAccess) {
      onTriggerPaywall({ ...session, requiredFor: 'download' });
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
    <div className="ott-vod-section" id="match-archives-section">
      <div className="grounds-section-header">
        <div>
          <div className="ott-section-badge">
            <Film size={13} className="text-lime" />
            <span>VOD & MATCH VAULT</span>
          </div>
          <h2 className="ott-section-title">Replays & Match Highlights</h2>
          <p className="ott-section-sub">
            Public matches include full 2-hour free replay following the final whistle. Archive downloads & classic recordings require a Match Pass.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="ott-sport-filter-pills">
          <button 
            type="button"
            className={`ott-filter-pill ${selectedFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('all')}
          >
            All Matches ({archives.length})
          </button>
          <button 
            type="button"
            className={`ott-filter-pill ${selectedFilter === 'free' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('free')}
          >
            Free Window
          </button>
          <button 
            type="button"
            className={`ott-filter-pill ${selectedFilter === 'paywalled' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('paywalled')}
          >
            Match Vault
          </button>
        </div>
      </div>

      <div className="vod-grid">
        {filteredArchives.map((session) => {
          const isUnlocked = isSubscriber || unlockedMatchIds.has(session.id) || !session.isOlderThan2Hours;
          const isFreeWindow = !session.isOlderThan2Hours;
          const hasDownloadAccess = isSubscriber || unlockedMatchIds.has(session.id);

          return (
            <div key={session.id} className="vod-card">
              {/* Thumbnail Container */}
              <div className="vod-thumb-box" onClick={() => handleWatchReplay(session)}>
                <img 
                  src={session.thumbnail} 
                  alt={session.title}
                  className="vod-thumb-img" 
                />
                <div className="vod-thumb-overlay" />

                {/* Status Badges */}
                <div className="vod-badge-top">
                  {isFreeWindow ? (
                    <span className="vod-free-badge">
                      <Clock size={11} />
                      Free Replay ({formatRemainingTime(session.timeRemainingInFreeWindowMs)})
                    </span>
                  ) : isUnlocked ? (
                    <span className="vod-unlocked-badge">
                      <Unlock size={11} />
                      {isSubscriber ? 'VIP Access' : 'Unlocked'}
                    </span>
                  ) : (
                    <span className="vod-locked-badge">
                      <Lock size={11} />
                      Match Pass ($1.99)
                    </span>
                  )}
                </div>

                {/* Score Pill */}
                <div className="vod-score-pill">
                  {session.score}
                </div>

                {/* Play Button Overlay */}
                <div className="vod-play-overlay">
                  <div className="vod-play-circle">
                    <Play size={20} className="fill-white text-white" />
                  </div>
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="vod-content">
                <div className="vod-meta-top">
                  <span className="vod-sport-tag">{session.sport}</span>
                  <span className="vod-views">{session.views} views</span>
                </div>

                <h4 className="vod-title" onClick={() => handleWatchReplay(session)}>
                  {session.title}
                </h4>

                <p className="vod-desc">{session.description}</p>

                {/* Actions */}
                <div className="vod-actions-row">
                  <button 
                    type="button"
                    onClick={() => handleWatchReplay(session)}
                    className={`btn btn-sm ${isUnlocked ? 'btn-ott-lime' : 'btn-ott-gold'}`}
                    style={{ flex: 1.2 }}
                  >
                    {isUnlocked ? <Play size={13} /> : <Lock size={13} />}
                    <span>{isUnlocked ? 'Watch Replay' : 'Unlock ($1.99)'}</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleDownload(session)}
                    className="btn btn-ott-dark btn-sm"
                    title={hasDownloadAccess ? 'Download full match recording (MP4)' : 'Download requires Match Pass ($1.99)'}
                  >
                    {hasDownloadAccess ? <Download size={13} /> : <Lock size={13} />}
                    <span>MP4</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Replay Player for Authorized Sessions */}
      {activeReplaySession && (() => {
        const hasActiveDownloadAccess = isSubscriber || unlockedMatchIds.has(activeReplaySession.id);
        return (
          <div className="modal-backdrop" onClick={() => setActiveReplaySession(null)}>
            <div className="modal-content" style={{ maxWidth: 780 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge-ott-pill">
                      <Play size={12} /> Match Replay
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Access: {activeReplaySession.accessType === 'free_window' ? 'Public Free Replay' : 'Match Pass'}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.35rem' }}>
                    {activeReplaySession.title}
                  </h3>
                </div>
                <button onClick={() => setActiveReplaySession(null)} className="ott-icon-button">
                  <X size={16} />
                </button>
              </div>

              <div className="modal-body" style={{ padding: '1rem' }}>
                {replayLoading ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    Authorizing stream playback...
                  </div>
                ) : replayError ? (
                  <div className="notice-box" style={{ borderColor: '#f43f5e', color: '#fca5a5' }}>
                    <AlertTriangle size={18} />
                    <span>{replayError}</span>
                  </div>
                ) : (
                  <div style={{ borderRadius: 12, overflow: 'hidden', background: '#000' }}>
                    <video 
                      src={activeReplaySession.playbackUrl} 
                      controls 
                      autoPlay 
                      style={{ width: '100%', maxHeight: 440, display: 'block' }} 
                    />
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button 
                  onClick={() => handleDownload(activeReplaySession)}
                  className="btn btn-ott-dark btn-sm"
                >
                  {hasActiveDownloadAccess ? <Download size={14} /> : <Lock size={14} />}
                  <span>{hasActiveDownloadAccess ? 'Download MP4 File' : 'Download ($1.99)'}</span>
                </button>
                <button 
                  onClick={() => setActiveReplaySession(null)}
                  className="btn btn-ott-lime btn-sm"
                >
                  Close Replay
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
