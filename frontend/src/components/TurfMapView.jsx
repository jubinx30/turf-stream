import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Radio, Check, Sparkles, Filter, Layers, ExternalLink } from 'lucide-react';

export default function TurfMapView({ 
  turfs = [], 
  activeTurfId, 
  onSelectTurf, 
  onBookTurf 
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const [selectedSport, setSelectedSport] = useState('all');
  const [activeMarkerId, setActiveMarkerId] = useState(activeTurfId || turfs[0]?.id);

  // Available sports for filtering
  const sports = [
    { id: 'all', label: 'All Grounds' },
    { id: 'football', label: '⚽ Football' },
    { id: 'futsal', label: '⚡ Futsal' },
    { id: 'cricket', label: '🏏 Cricket' }
  ];

  const filteredTurfs = turfs.filter(t => {
    if (selectedSport === 'all') return true;
    return (t.category || t.sport || '').toLowerCase().includes(selectedSport);
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center around NYC metro turfs
      const defaultLat = 40.7380;
      const defaultLng = -73.9890;

      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 13,
        zoomControl: false,
        attributionControl: false
      });

      // CartoDB Dark Matter Tiles for an ultra-sleek Sports OTT dark aesthetic
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
        crossOrigin: true
      }).addTo(map);

      // Re-position zoom control to bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers when turfs or activeTurfId changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    const bounds = [];

    filteredTurfs.forEach((turf) => {
      if (turf.lat && turf.lng) {
        const isSelected = turf.id === activeTurfId;
        const isLive = turf.isLive;

        // Custom Neon Volt Sports OTT Marker HTML
        const markerHtml = `
          <div class="ott-map-marker ${isSelected ? 'marker-selected' : ''} ${isLive ? 'marker-live' : ''}" id="marker-${turf.id}">
            <div class="marker-pulse-ring"></div>
            <div class="marker-bubble">
              <span class="marker-icon">${turf.sport?.toLowerCase().includes('cricket') ? '🏏' : turf.sport?.toLowerCase().includes('futsal') ? '⚡' : '⚽'}</span>
              <span class="marker-price-tag">${turf.priceFormatted || '$' + turf.price}</span>
            </div>
            <div class="marker-stem"></div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: markerHtml,
          className: 'ott-leaflet-marker-wrap',
          iconSize: [88, 48],
          iconAnchor: [44, 46],
          popupAnchor: [0, -48]
        });

        const marker = L.marker([turf.lat, turf.lng], { icon: customIcon }).addTo(map);

        // Custom Popup Content
        const popupContent = document.createElement('div');
        popupContent.className = 'ott-popup-card';
        popupContent.innerHTML = `
          <div class="popup-thumb-wrap">
            <img src="${turf.image || 'https://images.unsplash.com/photo-1529900241454-946a3628e93d?auto=format&fit=crop&w=400&q=80'}" alt="${turf.name}" class="popup-thumb" />
            <div class="popup-badges">
              <span class="popup-badge-live">${isLive ? '🔴 LIVE FEED' : 'HD READY'}</span>
              <span class="popup-badge-price">${turf.priceFormatted || '$' + turf.price}/hr</span>
            </div>
          </div>
          <div class="popup-content">
            <div class="popup-title">${turf.name}</div>
            <div class="popup-sub">
              <span>📍 ${turf.location}</span> &bull; 
              <span>★ ${turf.rating || '4.9'}</span>
            </div>
            <div class="popup-amenities">
              ${(turf.amenities || ['Artificial Grass', 'Floodlights', 'Free Parking']).slice(0, 3).map(a => `<span class="popup-pill">${a}</span>`).join('')}
            </div>
            <div class="popup-actions">
              <button class="popup-btn-watch" id="btn-watch-${turf.id}">
                Watch Live
              </button>
              <button class="popup-btn-book" id="btn-book-${turf.id}">
                Book Slot
              </button>
            </div>
          </div>
        `;

        // Attach event listeners to popup buttons
        popupContent.querySelector(`#btn-watch-${turf.id}`)?.addEventListener('click', () => {
          onSelectTurf(turf.id);
          const liveSection = document.getElementById('live-player-section');
          if (liveSection) {
            liveSection.scrollIntoView({ behavior: 'smooth' });
          }
        });

        popupContent.querySelector(`#btn-book-${turf.id}`)?.addEventListener('click', () => {
          if (onBookTurf) onBookTurf(turf);
        });

        marker.bindPopup(popupContent, {
          maxWidth: 280,
          className: 'ott-custom-leaflet-popup'
        });

        marker.on('click', () => {
          setActiveMarkerId(turf.id);
          onSelectTurf(turf.id);
        });

        markersRef.current[turf.id] = marker;
        bounds.push([turf.lat, turf.lng]);
      }
    });

    // Auto fit bounds if markers exist
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [filteredTurfs, activeTurfId]);

  // Handle clicking a turf card in the quick selector
  const handleFocusTurf = (turf) => {
    setActiveMarkerId(turf.id);
    onSelectTurf(turf.id);
    const map = mapInstanceRef.current;
    if (map && turf.lat && turf.lng) {
      map.flyTo([turf.lat, turf.lng], 15, {
        duration: 1.2
      });
      const marker = markersRef.current[turf.id];
      if (marker) {
        setTimeout(() => marker.openPopup(), 400);
      }
    }
  };

  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const bounds = filteredTurfs
      .filter(t => t.lat && t.lng)
      .map(t => [t.lat, t.lng]);
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  };

  return (
    <div className="ott-map-section-card" id="turf-map-section">
      {/* Section Header */}
      <div className="ott-map-header">
        <div>
          <div className="ott-section-badge">
            <MapPin size={13} className="text-lime" />
            <span>GEO RADAR & LIVE ARENAS</span>
          </div>
          <h2 className="ott-section-title">Turf Map Radar</h2>
          <p className="ott-section-sub">
            Explore floodlit turf venues with real-time camera broadcast status & instant slot reservations
          </p>
        </div>

        {/* Filter Pills */}
        <div className="ott-map-controls">
          <div className="ott-sport-filter-pills">
            {sports.map((sport) => (
              <button
                key={sport.id}
                type="button"
                className={`ott-filter-pill ${selectedSport === sport.id ? 'active' : ''}`}
                onClick={() => setSelectedSport(sport.id)}
              >
                {sport.label}
              </button>
            ))}
          </div>

          <button 
            type="button"
            className="btn btn-ott-dark btn-sm"
            onClick={handleRecenter}
            title="Recenter view"
          >
            <Navigation size={13} />
            <span>Recenter</span>
          </button>
        </div>
      </div>

      {/* Map + Sidebar Layout */}
      <div className="ott-map-grid">
        {/* The Leaflet Map Canvas */}
        <div className="ott-map-viewport-wrapper">
          <div ref={mapContainerRef} className="ott-leaflet-container" />

          {/* Floating Map Live Legend */}
          <div className="ott-map-floating-legend">
            <div className="legend-item">
              <span className="legend-dot-live" />
              <span>Live Broadcast</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot-ready" />
              <span>Available for Booking</span>
            </div>
            <div className="legend-item">
              <span className="legend-count">{filteredTurfs.length} Pitches Mapped</span>
            </div>
          </div>
        </div>

        {/* Quick Turf Directory Selector on the Side */}
        <div className="ott-map-sidebar-list">
          <div className="sidebar-list-header">
            <span>Select Venue to Locate</span>
            <span className="venues-count">{filteredTurfs.length} Nearby</span>
          </div>

          <div className="sidebar-turf-cards">
            {filteredTurfs.map((turf) => {
              const isSelected = turf.id === activeTurfId;
              return (
                <div
                  key={turf.id}
                  className={`ott-mini-venue-card ${isSelected ? 'active' : ''}`}
                  onClick={() => handleFocusTurf(turf)}
                >
                  <div className="mini-thumb-container">
                    <img 
                      src={turf.image || 'https://images.unsplash.com/photo-1529900241454-946a3628e93d?auto=format&fit=crop&w=300&q=80'} 
                      alt={turf.name} 
                      className="mini-thumb"
                    />
                    {turf.isLive && (
                      <span className="mini-live-tag">LIVE</span>
                    )}
                  </div>

                  <div className="mini-info">
                    <div className="mini-name-row">
                      <h4 className="mini-name">{turf.name}</h4>
                      {isSelected && (
                        <span className="mini-selected-check">
                          <Check size={11} strokeWidth={3} />
                        </span>
                      )}
                    </div>

                    <div className="mini-sub-row">
                      <span>{turf.sport} &bull; {turf.location}</span>
                    </div>

                    <div className="mini-bottom-row">
                      <span className="mini-price">{turf.priceFormatted || '$' + turf.price}</span>
                      <div className="mini-actions">
                        <button 
                          type="button"
                          className="mini-action-book"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onBookTurf) onBookTurf(turf);
                          }}
                        >
                          Book
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
