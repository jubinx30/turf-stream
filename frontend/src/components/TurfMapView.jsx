import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass, Radio, Calendar, Layers } from 'lucide-react';

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

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const defaultLat = 40.7380;
      const defaultLng = -73.9890;

      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 13,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
        crossOrigin: true
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    const bounds = [];

    filteredTurfs.forEach((turf) => {
      if (turf.lat && turf.lng) {
        const isSelected = turf.id === activeTurfId;
        const isLive = turf.isLive;

        const markerHtml = `
          <div class="ott-map-pin ${isSelected ? 'is-selected' : ''} ${isLive ? 'is-live' : ''}">
            <div class="pin-bubble">
              <span class="pin-sport">${turf.sport?.toLowerCase().includes('cricket') ? '🏏' : turf.sport?.toLowerCase().includes('futsal') ? '⚡' : '⚽'}</span>
              <span class="pin-price">${turf.priceFormatted || '$' + turf.price}</span>
            </div>
            <div class="pin-arrow"></div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: markerHtml,
          className: 'ott-leaflet-marker-wrap',
          iconSize: [84, 44],
          iconAnchor: [42, 42],
          popupAnchor: [0, -42]
        });

        const marker = L.marker([turf.lat, turf.lng], { icon: customIcon }).addTo(map);

        const popupContent = document.createElement('div');
        popupContent.className = 'ott-map-popup-card';
        popupContent.innerHTML = `
          <div class="popup-header-img" style="background-image: url('${turf.image || ''}')">
            ${isLive ? '<span class="popup-live-tag">LIVE FEED</span>' : ''}
          </div>
          <div class="popup-content-box">
            <h4 class="popup-title">${turf.name}</h4>
            <p class="popup-meta">${turf.sport} &bull; ${turf.location}</p>
            <div class="popup-btn-row">
              <button class="popup-btn-stream" id="popup-stream-${turf.id}">Watch Stream</button>
              <button class="popup-btn-book" id="popup-book-${turf.id}">Book Slot</button>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 260, minWidth: 220, className: 'ott-custom-popup' });

        marker.on('popupopen', () => {
          const streamBtn = document.getElementById(`popup-stream-${turf.id}`);
          if (streamBtn) {
            streamBtn.onclick = (e) => {
              e.stopPropagation();
              onSelectTurf(turf.id);
              document.getElementById('live-player-section')?.scrollIntoView({ behavior: 'smooth' });
            };
          }

          const bookBtn = document.getElementById(`popup-book-${turf.id}`);
          if (bookBtn) {
            bookBtn.onclick = (e) => {
              e.stopPropagation();
              if (onBookTurf) onBookTurf(turf);
            };
          }
        });

        markersRef.current[turf.id] = marker;
        bounds.push([turf.lat, turf.lng]);
      }
    });

    if (bounds.length > 0 && map) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } catch (err) {
        // Safe fallback
      }
    }
  }, [filteredTurfs, activeTurfId]);

  return (
    <section className="ott-section" id="turf-map-section">
      <div className="ott-section-header">
        <div className="section-title-wrap">
          <div className="section-badge-pill">
            <Compass size={13} className="text-blue" />
            <span>TURF RADAR</span>
          </div>
          <h2 className="section-heading">Interactive Arena Map</h2>
          <p className="section-subheading">
            Locate broadcast-enabled grounds and check hourly pricing near you.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="ott-filter-tabs">
          {sports.map(s => (
            <button
              key={s.id}
              type="button"
              className={`filter-tab-pill ${selectedSport === s.id ? 'active' : ''}`}
              onClick={() => setSelectedSport(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ott-map-wrapper">
        <div ref={mapContainerRef} className="ott-map-canvas" />
      </div>
    </section>
  );
}
