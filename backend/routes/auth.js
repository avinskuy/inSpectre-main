'use strict';

const express = require('express');
const {
  requireAuth,
  registerUser,
  loginUser,
  setSessionCookie,
  clearSessionCookie,
  readSessionToken,
  logoutToken,
} = require('../services/accounts/auth');

function createAuthRouter({ authLimiter }) {
  const router = express.Router();

  router.post('/auth/register', authLimiter, (req, res) => {
    try {
      const result = registerUser(req.body);
      setSessionCookie(res, result.token);
      res.set('Cache-Control', 'no-store');
      return res.status(201).json({ user: result.user });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        error: error.statusCode
          ? error.message
          : 'Pendaftaran gagal. Coba lagi.',
      });
    }
  });

  router.post('/auth/login', authLimiter, (req, res) => {
    try {
      const result = loginUser(req.body);
      setSessionCookie(res, result.token);
      res.set('Cache-Control', 'no-store');
      return res.json({ user: result.user });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        error: error.statusCode
          ? error.message
          : 'Login gagal. Coba lagi.',
      });
    }
  });

  router.post('/auth/logout', (req, res) => {
    logoutToken(readSessionToken(req));
    clearSessionCookie(res);
    res.set('Cache-Control', 'no-store');
    return res.json({ ok: true });
  });

  router.get('/auth/me', requireAuth, (req, res) => {
    res.set('Cache-Control', 'no-store');
    return res.json({ user: req.user });
  });

  return router;
}

module.exports = { createAuthRouter };
