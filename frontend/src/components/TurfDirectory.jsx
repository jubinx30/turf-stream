import React from 'react';
import { MapPin, Star, Radio, Sparkles, Check, ArrowRight, Calendar } from 'lucide-react';

export default function TurfDirectory({ 
  turfs, 
  activeTurfId, 
  onSelectTurf, 
  onBookTurf 
}) {
  return (
    <div className="grounds-section" id="grounds-near-me">
      <div className="grounds-section-header">
        <div>
          <div className="ott-section-badge">
            <MapPin size={13} className="text-lime" />
            <span>GROUNDS NEAR ME</span>
          </div>
          <h2 className="ott-section-title">Verified Grassroots Venues</h2>
        </div>
        <span className="grounds-count-badge">
          {turfs.length} Arenas Active
        </span>
      </div>

      <div className="grounds-cards-grid">
        {turfs.map((turf) => {
          const isActive = turf.id === activeTurfId;

          return (
            <div
              key={turf.id}
              className={`ground-card ${isActive ? 'active-pitch' : ''}`}
              onClick={() => onSelectTurf(turf.id)}
            >
              {/* Pitch Visual & Overlay Badges */}
              <div className="ground-img-wrapper">
                <img 
                  src={turf.image || 'https://images.unsplash.com/photo-1529900241454-946a3628e93d?auto=format&fit=crop&w=800&q=80'} 
                  alt={turf.name}
                  className="ground-img" 
                />
                <div className="ground-img-overlay" />

                {/* Top Badges */}
                <div className="ground-top-badges">
                  {turf.badge && (
                    <span className="badge-ott-pill">{turf.badge}</span>
                  )}
                  {turf.isLive ? (
                    <span className="badge-ott-live">
                      <span className="live-radar-dot" />
                      LIVE FEED
                    </span>
                  ) : (
                    <span className="badge-ott-ready">4K BROADCAST</span>
                  )}
                </div>

                {/* Price Tag Pill directly on card */}
                <div className="ground-price-tag">
                  {turf.priceFormatted || `$${turf.price}`}
                </div>
              </div>

              {/* Card Content Details */}
              <div className="ground-details">
                <div className="ground-headline">
                  <h3 className="ground-title">{turf.name}</h3>
                  <div className="ground-rating">
                    <Star size={13} className="fill-lime text-lime" />
                    <span>{turf.rating || '4.9'}</span>
                  </div>
                </div>

                <div className="ground-subline">
                  <span className="ground-location">
                    <MapPin size={12} />
                    {turf.location}
                  </span>
                  <span className="ground-dot">&bull;</span>
                  <span className="ground-sport">{turf.sport}</span>
                  <span className="ground-dot">&bull;</span>
                  <span className="ground-dims">{turf.dimensions}</span>
                </div>

                {/* Amenities Chips */}
                <div className="ground-amenities-row">
                  {(turf.amenities || ['Artificial Grass', 'Floodlights', 'Free Parking']).slice(0, 4).map((item, idx) => (
                    <span key={idx} className="amenity-chip">
                      {item}
                    </span>
                  ))}
                </div>

                {/* Actions Footer */}
                <div className="ground-actions-footer">
                  <button 
                    type="button"
                    className={`btn-ground-stream ${isActive ? 'is-streaming' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTurf(turf.id);
                      const player = document.getElementById('live-player-section');
                      if (player) player.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <Radio size={14} />
                    <span>{isActive ? 'Watching Live' : 'Watch Live Feed'}</span>
                  </button>

                  <button 
                    type="button"
                    className="btn-ground-book"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onBookTurf) onBookTurf(turf);
                    }}
                  >
                    <Calendar size={14} />
                    <span>Book Slot</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
