'use strict';

const express = require('express');
const { checkNumber, isValidPhone } = require('../services/phones/numberChecker');
const { optionalAuth } = require('../services/accounts/auth');
const { emitThreat, emitStats } = require('../emitter');

function createPhoneRouter({ scanLimiter, lookupWhoTag }) {
  const router = express.Router();

  router.get('/check/:nomor', scanLimiter, optionalAuth, async (req, res) => {
    const raw = req.params.nomor;

    if (!isValidPhone(raw)) {
      return res.status(400).json({
        error: 'Nomor tidak valid. Gunakan format 08xx atau +62xx.',
      });
    }

    let result;
    try {
      result = checkNumber(raw, req.user?.id || null);
    } catch (error) {
      console.error('community number check error:', error.message);
      return res.status(500).json({ error: 'Pengecekan gagal' });
    }

    let externalReputation = {
      status: 'UNAVAILABLE',
      reason: 'INVALID_PROVIDER_NUMBER',
    };

    if (/^62\d{8,13}$/.test(result.number)) {
      try {
        externalReputation = await lookupWhoTag(`+${result.number}`);
      } catch (error) {
        console.error('WhoTag provider error:', error.message);
        externalReputation = {
          status: 'UNAVAILABLE',
          reason: 'PROVIDER_ERROR',
        };
      }
    }

    emitThreat({ type: 'scam_number', ...result });
    emitStats();
    return res.json({ ...result, externalReputation });
  });

  return router;
}

module.exports = { createPhoneRouter };
