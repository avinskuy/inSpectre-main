'use strict';

const express = require('express');
const { getHotspots } = require('../services/environment/hotspots');
const { getAirQuality } = require('../services/environment/airQuality');
const { getRegions, getForecast, getWarnings } = require('../services/environment/weather');
const { getDisasters } = require('../services/environment/disasters');

function createEnvironmentRouter() {
  const router = express.Router();

  router.get('/environment/hotspots', async (req, res) => {
    try {
      const result = await getHotspots();
      res.set('Cache-Control', 'public, max-age=60');
      return res.json(result);
    } catch (error) {
      console.error('hotspots error:', error.name || 'Error');
      return res.status(502).json({
        data: [],
        source: 'NASA FIRMS',
        status: 'unavailable',
        updatedAt: null,
        error: 'Data hotspot belum dapat dimuat.',
      });
    }
  });

  router.get('/environment/air-quality', async (req, res) => {
    try {
      const result = await getAirQuality();
      res.set('Cache-Control', 'public, max-age=60');
      return res.json(result);
    } catch (error) {
      console.error('air quality error:', error.name || 'Error');
      return res.status(502).json({
        data: [],
        source: 'OpenAQ v3',
        status: 'unavailable',
        fetchedAt: null,
        error: 'Data kualitas udara belum dapat dimuat.',
      });
    }
  });

  router.get('/environment/regions', (req, res) => {
    try {
      const parent = typeof req.query.parent === 'string' ? req.query.parent : '';
      const data = getRegions(parent);
      res.set('Cache-Control', 'public, max-age=3600');
      return res.json({ status: 'ok', data });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        status: 'error',
        data: [],
        error: error.statusCode === 400
          ? error.message
          : 'Daftar wilayah belum dapat dimuat.',
      });
    }
  });

  router.get('/environment/weather', async (req, res) => {
    try {
      const adm4 = typeof req.query.adm4 === 'string' ? req.query.adm4 : '';
      const result = await getForecast(adm4);
      res.set('Cache-Control', 'public, max-age=300');
      return res.json(result);
    } catch (error) {
      const status = error.statusCode === 400 ? 400 : 502;
      console.error('weather forecast error:', error.name || 'Error');
      return res.status(status).json({
        status: 'unavailable',
        source: 'BMKG',
        forecast: [],
        error: status === 400
          ? error.message
          : 'Prakiraan cuaca belum dapat dimuat. Coba lagi beberapa saat.',
      });
    }
  });

  router.get('/environment/weather-warnings', async (req, res) => {
    try {
      const result = await getWarnings();
      res.set('Cache-Control', 'public, max-age=60');
      return res.json(result);
    } catch (error) {
      console.error('weather warnings error:', error.name || 'Error');
      return res.status(502).json({
        status: 'unavailable',
        source: 'BMKG',
        warnings: [],
        fetchedAt: null,
        error: 'Peringatan cuaca BMKG belum dapat dimuat.',
      });
    }
  });

  router.get('/environment/disasters', async (req, res) => {
    try {
      const result = await getDisasters();
      res.set('Cache-Control', 'public, max-age=60');
      return res.json(result);
    } catch (error) {
      console.error('disasters error:', error.name || 'Error');
      return res.status(502).json({
        status: 'unavailable',
        source: 'BMKG',
        sourceUrl: 'https://data.bmkg.go.id/gempabumi/',
        fetchedAt: null,
        latest: null,
        significant: [],
        felt: [],
        errors: {
          all: 'Data gempa belum dapat dimuat. Coba lagi beberapa saat.',
        },
      });
    }
  });

  return router;
}

module.exports = { createEnvironmentRouter };
