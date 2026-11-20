import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Check, ShieldCheck, Sparkles } from 'lucide-react';

export default function TurfBookingModal({ turf, isOpen, onClose, onSelectLive }) {
  if (!isOpen || !turf) return null;

  const dates = [
    { dayNum: '17', dayName: 'Mon' },
    { dayNum: '18', dayName: 'Tue' },
    { dayNum: '19', dayName: 'Wed' },
    { dayNum: '20', dayName: 'Thu' },
    { dayNum: '21', dayName: 'Fri' },
    { dayNum: '22', dayName: 'Sat' }
  ];

  const timeSlots = turf.availableSlots || [
    '14:30 - 15:30',
    '16:00 - 17:00',
    '17:30 - 18:30',
    '20:00 - 21:00'
  ];

  const [selectedDate, setSelectedDate] = useState('17');
  const [selectedSlot, setSelectedSlot] = useState(timeSlots[0]);
  const [bookedSuccess, setBookedSuccess] = useState(false);
  const [bookingRef, setBookingRef] = useState('');

  const handleConfirmBooking = () => {
    const ref = 'TL-' + Math.floor(100000 + Math.random() * 900000);
    setBookingRef(ref);
    setBookedSuccess(true);
  };

  const handleResetAndClose = () => {
    setBookedSuccess(false);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleResetAndClose}>
      <div 
        className="modal-content ott-booking-sheet" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px', width: '92%' }}
      >
        <div className="booking-hero">
          <img 
            src={turf.image || 'https://images.unsplash.com/photo-1529900241454-946a3628e93d?auto=format&fit=crop&w=800&q=80'} 
            alt={turf.name} 
            className="booking-hero-img"
          />
          <div className="booking-hero-gradient" />
          
          <button 
            className="booking-close-btn"
            onClick={handleResetAndClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="booking-hero-content">
            <div className="booking-sport-pill">
              <span className="sport-dot">⚽</span>
              <span>{turf.sport} Turf</span>
            </div>
            <h2 className="booking-turf-title">{turf.name}</h2>
            <div className="booking-meta-row">
              <span className="ott-tag-highlight">{turf.badge || 'Top 10'}</span>
              <span className="booking-location">
                <MapPin size={13} /> {turf.location}
              </span>
              <span className="booking-rating">★ {turf.rating || '4.9'}</span>
            </div>
          </div>
        </div>

        <div className="modal-body" style={{ padding: '1.25rem 1.5rem', gap: '1.25rem' }}>
          {bookedSuccess ? (
            <div className="booking-success-box">
              <div className="booking-success-icon">
                <Check size={28} strokeWidth={3} />
              </div>
              <h3>Slot Confirmed!</h3>
              <p className="success-ref">Booking Ref: <strong>{bookingRef}</strong></p>
              <div className="success-details-card">
                <div><strong>Pitch:</strong> {turf.name}</div>
                <div><strong>Date:</strong> {selectedDate} Nov 2026</div>
                <div><strong>Time:</strong> {selectedSlot}</div>
                <div><strong>Total Paid:</strong> {turf.priceFormatted || `$${turf.price}`}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
                <button 
                  className="btn btn-ott-lime" 
                  style={{ flex: 1 }}
                  onClick={() => {
                    handleResetAndClose();
                    if (onSelectLive) onSelectLive(turf.id);
                  }}
                >
                  Watch Live Cam
                </button>
                <button 
                  className="btn btn-ott-dark" 
                  style={{ flex: 1 }}
                  onClick={handleResetAndClose}
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="booking-section">
                <label className="section-label">Amenities</label>
                <div className="amenities-pills">
                  {(turf.amenities || ['First-Aid', 'Changing Room', 'Kit Provided', 'Artificial Grass', 'Free Parking', '6v6']).map((am, i) => (
                    <span key={i} className="amenity-pill">
                      {am}
                    </span>
                  ))}
                </div>
              </div>

              <div className="booking-section">
                <div className="section-header-flex">
                  <label className="section-label">
                    <Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />
                    Select a reservation date
                  </label>
                  <span className="month-tag">Nov 2026</span>
                </div>
                <div className="date-selector-row">
                  {dates.map((d) => {
                    const isSelected = selectedDate === d.dayNum;
                    return (
                      <button
                        key={d.dayNum}
                        type="button"
                        className={`date-pill ${isSelected ? 'active' : ''}`}
                        onClick={() => setSelectedDate(d.dayNum)}
                      >
                        <span className="date-number">{d.dayNum}</span>
                        <span className="date-name">{d.dayName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="booking-section">
                <label className="section-label">
                  <Clock size={13} style={{ display: 'inline', marginRight: 4 }} />
                  Select a time slot
                </label>
                <div className="time-slots-grid">
                  {timeSlots.map((slot) => {
                    const isSelected = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        className={`time-slot-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="booking-action-bar">
                <div>
                  <div className="price-sub">Hourly Rate</div>
                  <div className="price-main">{turf.priceFormatted || `$${turf.price}`}</div>
                </div>

                <button 
                  type="button"
                  className="btn btn-ott-lime btn-large"
                  onClick={handleConfirmBooking}
                >
                  <Sparkles size={16} />
                  <span>Book now</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

