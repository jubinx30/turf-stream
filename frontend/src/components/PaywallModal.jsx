import React, { useState } from 'react';
import { Lock, Check, Zap, CreditCard, Shield, X, AlertCircle } from 'lucide-react';

export default function PaywallModal({ session, onClose, onUnlockSuccess }) {
  const [selectedPlan, setSelectedPlan] = useState('single_match'); // 'single_match' or 'subscription'
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  if (!session) return null;

  const handleCheckout = async () => {
    setProcessing(true);
    setError(null);

    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: selectedPlan,
          archiveId: session.id,
          paymentMethod
        })
      });

      const responseData = await res.json();
      if (!res.ok || !responseData.success) {
        throw new Error(responseData.error || 'Checkout failed');
      }

      // Notify parent of successful checkout
      onUnlockSuccess({
        planType: selectedPlan,
        archiveId: session.id,
        token: responseData.data.token,
        receipt: responseData.data.receipt
      });
    } catch (err) {
      setError(err.message);
      setProcessing(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Lock size={20} className="text-amber-400" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Match Replay Paywall</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                This session ended {session.ageMinutes} minutes ago (&gt; 2-hour free threshold)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Paywall policy notice */}
          <div className="notice-box">
            <Shield size={18} className="text-blue-400" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Fair Monetization Rule:</strong> Turf Live live feeds are 100% free for everyone. Replays remain free for the first 2 hours after a match. After 2 hours, archive servers require a pass to replay and download.
            </div>
          </div>

          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Select Access Pass:
          </div>

          {/* Option 1: Single Match */}
          <div 
            className={`plan-card ${selectedPlan === 'single_match' ? 'selected' : ''}`}
            onClick={() => setSelectedPlan('single_match')}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>Single Match Pass</span>
                <span className="badge badge-locked">This Match Only</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Full 1080p replay + high-speed MP4 download for <em>{session.title}</em>.
              </p>
              <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '0.4rem', fontWeight: 600 }}>
                &bull; 7 days unlimited viewing for this match
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="plan-price">$1.99</span>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>one-time</div>
            </div>
          </div>

          {/* Option 2: Subscription */}
          <div 
            className={`plan-card ${selectedPlan === 'subscription' ? 'selected' : ''}`}
            onClick={() => setSelectedPlan('subscription')}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>All-Access Turf Pass</span>
                <span className="badge badge-sub">Best Value</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Unlimited access to ALL live broadcasts, past tournament replays, and match downloads.
              </p>
              <div style={{ fontSize: '0.75rem', color: '#c084fc', marginTop: '0.4rem', fontWeight: 600 }}>
                &bull; Unlocks all turfs & archives instantly
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="plan-price">$9.99</span>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ month</div>
            </div>
          </div>

          {/* Payment Method selector */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
              Simulated Payment Method:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['card', 'upi', 'apple_pay'].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`btn btn-sm ${paymentMethod === method ? 'btn-secondary' : ''}`}
                  style={{ 
                    border: paymentMethod === method ? '1px solid #10b981' : '1px solid var(--border-color)',
                    background: paymentMethod === method ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                    textTransform: 'uppercase',
                    fontSize: '0.7rem'
                  }}
                >
                  <CreditCard size={12} />
                  <span>{method.replace('_', ' ')}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ color: '#f87171', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary" disabled={processing}>
            Cancel
          </button>
          <button 
            onClick={handleCheckout} 
            className="btn btn-primary"
            disabled={processing}
          >
            {processing ? (
              <span>Simulating Payment Gateway...</span>
            ) : (
              <>
                <Zap size={16} />
                <span>Simulate Pay & Unlock ({selectedPlan === 'single_match' ? '$1.99' : '$9.99/mo'})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
