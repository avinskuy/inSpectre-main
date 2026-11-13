'use strict';

const express = require('express');
const { getStats, getRecentScans } = require('../services/storage/db');
const { requireAuth } = require('../services/accounts/auth');

function createPlatformRouter({ assistantLimiter }) {
  const router = express.Router();

  router.post('/assistant', assistantLimiter, async (req, res) => {
    const question = req.body && req.body.question;

    if (typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'Tulis pertanyaan terlebih dahulu.' });
    }
    if (question.length > 2000) {
      return res.status(400).json({ error: 'Pertanyaan maksimal 2000 karakter.' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'Asisten AI belum dikonfigurasi di server.' });
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'nvidia/nemotron-3.5-lightning:free',
          messages: [
            {
              role: 'system',
              content: 'Kamu adalah AsistenAI inSpectre, pendamping keamanan digital berbahasa Indonesia. Jawab jelas, praktis, dan ringkas. Bantu mengenali phishing, penipuan, APK, QR, serta langkah pelaporan. Jangan pernah meminta atau mengulang OTP, PIN, kata sandi, atau data rahasia. Jangan mengklaim telah memindai atau memverifikasi sesuatu jika belum dilakukan. Jika ada dugaan penipuan, anjurkan verifikasi melalui kanal resmi. Berikan saran keselamatan, bukan jaminan bahwa tautan atau file aman.',
            },
            { role: 'user', content: question.trim() },
          ],
          max_tokens: 700,
          reasoning: { enabled: false },
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        console.error('OpenRouter API gagal dengan status HTTP', response.status);
        if (response.status === 429 || response.status === 402) {
          return res.status(503).json({
            error: 'Batas penggunaan AI gratis tercapai. Coba lagi nanti.',
          });
        }
        if (response.status === 401 || response.status === 403) {
          return res.status(502).json({
            error: 'OpenRouter menolak API key atau akses model. Periksa konfigurasi key di server.',
          });
        }
        return res.status(502).json({
          error: 'Layanan AI sedang bermasalah. Coba lagi nanti.',
        });
      }

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content;
      if (typeof answer !== 'string' || !answer.trim()) {
        return res.status(502).json({
          error: 'AI belum memberikan jawaban teks. Coba lagi.',
        });
      }

      res.set('Cache-Control', 'no-store');
      return res.json({ answer: answer.trim() });
    } catch (error) {
      console.error('OpenRouter request gagal:', error.name || 'Error');
      return res.status(502).json({
        error: error.name === 'TimeoutError'
          ? 'AI terlalu lama merespons. Coba lagi.'
          : 'Tidak dapat menghubungi layanan AI saat ini.',
      });
    }
  });

  router.get('/stats', (req, res) => {
    return res.json(getStats());
  });

  router.get('/recent', requireAuth, (req, res) => {
    res.set('Cache-Control', 'no-store');
    return res.json(getRecentScans(20, req.user.id));
  });

  router.get('/health', (req, res) => {
    return res.json({ status: 'ok', uptime: process.uptime() });
  });

  return router;
}

module.exports = { createPlatformRouter };
