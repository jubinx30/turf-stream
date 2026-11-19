import React from 'react';
import { Radio, MapPin, Activity, Check } from 'lucide-react';

export default function TurfDirectory({ turfs, activeTurfId, onSelectTurf }) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <Activity size={18} className="text-emerald-400" />
          <span>Active Turfs Directory</span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {turfs.length} Pitches Online
        </span>
      </div>

      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {turfs.map((turf) => {
          const isActive = turf.id === activeTurfId;
          return (
            <div
              key={turf.id}
              onClick={() => onSelectTurf(turf.id)}
              style={{
                border: isActive ? '2px solid #10b981' : '1px solid var(--border-color)',
                backgroundColor: isActive ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-card-hover)',
                borderRadius: '12px',
                padding: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ 
                    fontWeight: 700, 
                    fontSize: '0.95rem',
                    color: isActive ? '#ffffff' : '#cbd5e1' 
                  }}>
                    {turf.name}
                  </span>
                  {isActive && (
                    <span style={{ 
                      background: '#10b981', 
                      color: '#042f1a', 
                      borderRadius: '50%', 
                      width: 18, 
                      height: 18, 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </div>

                <div className="badge badge-live">
                  <span className="badge-live-pulse" />
                  <span>LIVE</span>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                alignItems: 'center', 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)',
                marginBottom: '0.5rem'
              }}>
                <MapPin size={12} />
                <span>{turf.location}</span>
                <span>&bull;</span>
                <span>{turf.sport}</span>
              </div>

              <div style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
                marginBottom: '0.6rem'
              }}>
                {turf.description}
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                fontSize: '0.7rem',
                paddingTop: '0.5rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                color: 'var(--text-muted)'
              }}>
                <span>Ingest: <strong style={{ color: '#67e8f9' }}>{turf.streamPath}</strong></span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>Free Instant Watch &rarr;</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
