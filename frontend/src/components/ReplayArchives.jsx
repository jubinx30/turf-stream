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
  archives = [], 
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
    <section className="ott-section" id="match-archives-section">
      {/* Section Header */}
      <div className="ott-section-header">
        <div className="section-title-wrap">
          <div className="section-badge-pill">
            <Film size={13} className="text-blue" />
            <span>MATCH REPLAYS & VOD</span>
          </div>
          <h2 className="section-heading">Catch Up On Past Matches</h2>
          <p className="section-subheading">
            Watch recent match replays free within 2 hours. Full match downloads & archives available with VIP Pass.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="ott-filter-tabs">
          <button
            type="button"
            className={`filter-tab-pill ${selectedFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('all')}
          >
            All Matches ({archives.length})
          </button>
          <button
            type="button"
            className={`filter-tab-pill ${selectedFilter === 'free' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('free')}
          >
            Free Replays
          </button>
          <button
            type="button"
            className={`filter-tab-pill ${selectedFilter === 'paywalled' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('paywalled')}
          >
            VIP Archives
          </button>
        </div>
      </div>

      {/* Grid of 16:9 Match Cards */}
      <div className="ott-replays-grid">
        {filteredArchives.map((session) => {
          const isUnlocked = isSubscriber || unlockedMatchIds.has(session.id) || !session.isOlderThan2Hours;
          const isFreeWindow = !session.isOlderThan2Hours;
          const hasDownloadAccess = isSubscriber || unlockedMatchIds.has(session.id);

          return (
            <div 
              key={session.id} 
              className="replay-card"
              onClick={() => handleWatchReplay(session)}
            >
              {/* Thumbnail Container */}
              <div className="replay-thumb-wrap">
                <img 
                  src={session.thumbnail} 
                  alt={session.title}
                  className="replay-thumb-img" 
                />
                <div className="replay-thumb-overlay" />

                {/* Hover Play Button */}
                <div className="replay-play-hover-btn">
                  {isUnlocked ? <Play size={20} fill="currentColor" /> : <Lock size={20} />}
                </div>

                {/* Top Badge: Free / Unlocked / Locked */}
                <div className="replay-top-badge">
                  {isFreeWindow ? (
                    <span className="badge-free-window">
                      <Clock size={11} />
                      <span>Free ({formatRemainingTime(session.timeRemainingInFreeWindowMs)})</span>
                    </span>
                  ) : isUnlocked ? (
                    <span className="badge-unlocked">
                      <Unlock size={11} />
                      <span>Unlocked</span>
                    </span>
                  ) : (
                    <span className="badge-locked">
                      <Lock size={11} />
                      <span>Match Pass</span>
                    </span>
                  )}
                </div>

                {/* Score Pill */}
                <div className="replay-score-pill">
                  {session.score}
                </div>
              </div>

              {/* Match Details */}
              <div className="replay-body">
                <div className="replay-meta">
                  <span>{session.sport}</span>
                  <span>&bull;</span>
                  <span>{Math.round(session.durationSeconds / 60)} min</span>
                </div>

                <h3 className="replay-title" title={session.title}>
                  {session.title}
                </h3>

                <p className="replay-desc">
                  {session.description}
                </p>

                {/* Card Action Row */}
                <div className="replay-actions-row">
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWatchReplay(session);
                    }}
                    className={`btn-replay-action ${isUnlocked ? 'is-watch' : 'is-unlock'}`}
                  >
                    {isUnlocked ? <Play size={13} fill="currentColor" /> : <Lock size={13} />}
                    <span>{isUnlocked ? 'Watch' : 'Unlock ($1.99)'}</span>
                  </button>

                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(session);
                    }}
                    className="btn-replay-download"
                    title={hasDownloadAccess ? 'Download full match recording (MP4)' : 'Download requires Match Pass ($1.99)'}
                  >
                    {hasDownloadAccess ? <Download size={13} /> : <Lock size={13} />}
                    <span>{hasDownloadAccess ? 'MP4' : '$1.99'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cinematic Modal Player for Authorized Replays */}
      {activeReplaySession && (() => {
        const hasActiveDownloadAccess = isSubscriber || unlockedMatchIds.has(activeReplaySession.id);
        return (
          <div className="modal-backdrop" onClick={() => setActiveReplaySession(null)}>
            <div className="ott-modal-card" onClick={e => e.stopPropagation()}>
              <div className="ott-modal-header">
                <div>
                  <div className="modal-pill-tag">
                    <Play size={12} fill="currentColor" />
                    <span>Match Replay</span>
                  </div>
                  <h3 className="modal-title-text">
                    {activeReplaySession.title}
                  </h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setActiveReplaySession(null)} 
                  className="modal-close-btn"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="ott-modal-body">
                {replayLoading ? (
                  <div className="modal-loading-box">
                    <div className="spinner-loader" />
                    <span>Loading match stream...</span>
                  </div>
                ) : replayError ? (
                  <div className="modal-error-box">
                    <AlertTriangle size={18} />
                    <span>{replayError}</span>
                  </div>
                ) : (
                  <div className="modal-video-box">
                    <video 
                      src={activeReplaySession.playbackUrl} 
                      controls 
                      autoPlay 
                      className="modal-video-tag"
                    />
                  </div>
                )}
              </div>

              <div className="ott-modal-footer">
                <button 
                  type="button"
                  onClick={() => handleDownload(activeReplaySession)}
                  className="btn-ott-secondary btn-sm"
                >
                  {hasActiveDownloadAccess ? <Download size={14} /> : <Lock size={14} />}
                  <span>{hasActiveDownloadAccess ? 'Download MP4' : 'Download MP4 ($1.99)'}</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setActiveReplaySession(null)}
                  className="btn-ott-primary btn-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
}
