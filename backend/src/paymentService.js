const jwt = require('jsonwebtoken');
const config = require('./config');

// Store issued receipts / subscriptions
const mockReceipts = [];

module.exports = {
  createCheckout({ planType, archiveId, paymentMethod = 'card', customerEmail = 'guest@turf-user.io' }) {
    const now = Date.now();
    let validUntil;
    let title;
    let amount;

    if (planType === 'subscription') {
      // 30 days access
      validUntil = now + (30 * 24 * 60 * 60 * 1000);
      title = 'All-Access Turf Pass (Monthly)';
      amount = 9.99;
    } else {
      // single match pass: 7 days access to this match
      validUntil = now + (7 * 24 * 60 * 60 * 1000);
      title = 'Single Match Replay & Download Pass';
      amount = 1.99;
    }

    const payload = {
      planType,
      archiveId: planType === 'single_match' ? archiveId : null,
      customerEmail,
      issuedAt: now,
      validUntil
    };

    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: planType === 'subscription' ? '30d' : '7d'
    });

    const receipt = {
      id: `rcpt_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`,
      planType,
      archiveId: planType === 'single_match' ? archiveId : null,
      title,
      amount,
      currency: 'USD',
      paymentMethod,
      customerEmail,
      createdAt: new Date().toISOString(),
      token,
      validUntil: new Date(validUntil).toISOString(),
      status: 'completed'
    };

    mockReceipts.push(receipt);

    return {
      success: true,
      receipt,
      token,
      message: planType === 'subscription' 
        ? 'Subscription activated! You now have unlimited access to all live and past matches.'
        : 'Match unlocked! You can now watch the full replay and download the recording.'
    };
  },

  /**
   * Verifies if a given token or header grants access to a specific archive session.
   */
  verifyAccess(token, targetArchiveId) {
    if (!token) {
      return { authorized: false, reason: 'NO_TOKEN' };
    }

    // Clean token if Bearer format
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();

    // Check for simulated quick bypass (e.g. for testing or UI toggle)
    if (cleanToken === 'SIMULATED_ACTIVE_SUBSCRIBER') {
      return { authorized: true, planType: 'subscription', bypass: true };
    }

    try {
      const decoded = jwt.verify(cleanToken, config.jwtSecret);
      
      // If subscription, access to everything is granted!
      if (decoded.planType === 'subscription') {
        return { authorized: true, planType: 'subscription', decoded };
      }

      // If single match, verify target archive ID matches
      if (decoded.planType === 'single_match') {
        if (decoded.archiveId === targetArchiveId) {
          return { authorized: true, planType: 'single_match', decoded };
        } else {
          return { 
            authorized: false, 
            reason: 'ARCHIVE_MISMATCH',
            message: 'This pass was purchased for a different match.' 
          };
        }
      }

      return { authorized: false, reason: 'INVALID_PLAN' };
    } catch (err) {
      return { authorized: false, reason: 'TOKEN_EXPIRED_OR_INVALID', error: err.message };
    }
  },

  getReceipts: () => mockReceipts
};
