'use strict';

const express = require('express');
const { optionalAuth } = require('../services/accounts/auth');
const { checkLinkWithReputation } = require('../services/security/safeLinkChecker');
const { emitThreat, emitStats } = require('../emitter');

function createSecurityRouter({ scanLimiter }) {
  const router = express.Router();

  router.post('/scan', scanLimiter, optionalAuth, async (req, res) => {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ error: 'Parameter "url" wajib diisi' });
    }
    if (url.length > 2048) {
      return res.status(400).json({
        error: 'URL terlalu panjang (maks 2048 karakter)',
      });
    }

    const target = /^https?:\\/\\//i.test(url.trim())
      ? url.trim()
      : `https://${url.trim()}`;

    try {
      const result = await checkLinkWithReputation(target, req.user?.id || null);
      emitThreat({ type: 'link', ...result });
      emitStats();
      res.set('Cache-Control', 'no-store');
      return res.json(result);
    } catch (error) {
      console.error('scan error:', error.message);
      return res.status(500).json({ error: 'Scan gagal' });
    }
  });

  return router;
}

module.exports = { createSecurityRouter };
