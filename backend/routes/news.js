'use strict';

const express = require('express');
const { getNews } = require('../services/news/news');

function createNewsRouter() {
  const router = express.Router();

  router.get('/news', async (req, res) => {
    try {
      const data = await getNews({ force: req.query.refresh === '1' });
      res.set('Cache-Control', 'no-store');
      return res.json(data);
    } catch (error) {
      console.error('news error:', error.message);
      return res.status(502).json({
        articles: [],
        updatedAt: null,
        error: 'Berita belum dapat dimuat. Coba lagi beberapa saat.',
      });
    }
  });

  return router;
}

module.exports = { createNewsRouter };
