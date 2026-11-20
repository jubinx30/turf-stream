import React from 'react';
import { MapPin, Star, Radio, Calendar, Sparkles, Search } from 'lucide-react';

export default function TurfDirectory({ 
  turfs = [], 
  activeTurfId, 
  onSelectTurf, 
  onBookTurf,
  searchQuery = '',
  onClearSearch
}) {
  return (
    <section className="ott-section" id="grounds-near-me">
      {/* Section Header */}
      <div className="ott-section-header">
        <div className="section-title-wrap">
          <div className="section-badge-pill">
            <MapPin size={13} className="text-blue" />
            <span>COMMUNITY TURFS</span>
          </div>
          <h2 className="section-heading">Featured Grounds & Venues</h2>
          <p className="section-subheading">
            Live broadcast arenas equipped with 4K multi-angle automated match cameras.
          </p>
        </div>
        <div className="section-count-badge">
          {turfs.length} {searchQuery ? 'Matching' : 'Active'} {turfs.length === 1 ? 'Venue' : 'Venues'}
        </div>
      </div>

      {turfs.length === 0 ? (
        <div className="turf-empty-search-state">
          <div className="empty-icon-wrap">
            <Search size={32} className="text-muted" />
          </div>
          <h3 className="empty-title">No turfs found</h3>
          <p className="empty-desc">
            We couldn't find any turf matching {searchQuery ? `"${searchQuery}"` : 'your filters'}.
          </p>
          {onClearSearch && (
            <button
              type="button"
              className="btn-clear-search"
              onClick={onClearSearch}
            >
              Clear Search & Show All Turfs
            </button>
          )}
        </div>
      ) : (
        /* Grid of Turf Arena Cards */
        <div className="ott-grounds-grid">
        {turfs.map((turf) => {
          const isActive = turf.id === activeTurfId;

          return (
            <div
              key={turf.id}
              className={`ground-card ${isActive ? 'is-current-active' : ''}`}
              onClick={() => onSelectTurf(turf.id)}
            >
              {/* Image & Badges */}
              <div className="ground-thumb-wrap">
                <img
                  src={turf.image || 'https://images.unsplash.com/photo-1529900241454-946a3628e93d?auto=format&fit=crop&w=600&q=80'}
                  alt={turf.name}
                  className="ground-thumb-img"
                />
                <div className="ground-thumb-gradient" />

                {/* Badges */}
                <div className="ground-badge-row">
                  {turf.isLive ? (
                    <span className="ground-live-badge">
                      <span className="live-dot-mini" />
                      LIVE FEED
                    </span>
                  ) : (
                    <span className="ground-hd-badge">4K CAM READY</span>
                  )}
                  {turf.badge && (
                    <span className="ground-tag-pill">{turf.badge}</span>
                  )}
                </div>

                <div className="ground-price-badge">
                  {turf.priceFormatted || `$${turf.price}`}
                </div>
              </div>

              {/* Card Content */}
              <div className="ground-card-body">
                <div className="ground-title-row">
                  <h3 className="ground-name">{turf.name}</h3>
                  <div className="ground-star-rating">
                    <Star size={13} className="star-icon" fill="currentColor" />
                    <span>{turf.rating || '4.9'}</span>
                  </div>
                </div>

                <div className="ground-specs">
                  <span className="ground-location">
                    <MapPin size={12} />
                    {turf.location}
                  </span>
                  <span>&bull;</span>
                  <span>{turf.sport}</span>
                  <span>&bull;</span>
                  <span>{turf.dimensions}</span>
                </div>

                {/* Amenities */}
                <div className="ground-amenities">
                  {(turf.amenities || ['Turf Grass', 'Floodlights', 'Free Parking']).slice(0, 3).map((item, idx) => (
                    <span key={idx} className="amenity-tag">
                      {item}
                    </span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="ground-btn-row">
                  <button
                    type="button"
                    className={`btn-ground-watch ${isActive ? 'active-watching' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTurf(turf.id);
                      document.getElementById('live-player-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <Radio size={14} />
                    <span>{isActive ? 'Watching' : 'Watch Stream'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn-ground-book-slot"
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
      )}
    </section>
  );
}
