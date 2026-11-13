'use strict';

const OVERFLOW_KEY = Symbol('inspectre-rate-limit-overflow');

function createRateLimit({
  windowMs = 60_000,
  max = 30,
  maxKeys = 10_000,
  cleanupIntervalMs = 60_000,
  now = Date.now,
} = {}) {
  const hits = new Map();
  const keyLimit = Math.max(1, Math.floor(Number(maxKeys) || 10_000));
  const requestLimit = Math.max(1, Math.floor(Number(max) || 30));
  const window = Math.max(1, Number(windowMs) || 60_000);
  const cleanupEvery = Math.max(1, Number(cleanupIntervalMs) || 60_000);
  let lastCleanup = 0;

  function pruneExpired(currentTime) {
    for (const [key, hit] of hits) {
      if (currentTime - hit.start >= window) hits.delete(key);
    }
    lastCleanup = currentTime;
  }

  return (req, res, next) => {
    const currentTime = now();

    // Pembersihan dilakukan saat ada permintaan; tidak membuat timer per limiter.
    if (currentTime - lastCleanup >= cleanupEvery) {
      pruneExpired(currentTime);
    }

    const clientKey = req.ip || req.socket?.remoteAddress || 'unknown';
    let key = clientKey;

    // Batasi memori yang dipakai alamat IP unik. IP baru berbagi satu bucket
    // sementara sampai entri lama kedaluwarsa dan kapasitas tersedia kembali.
    if (!hits.has(key) && hits.size >= keyLimit - 1) {
      key = OVERFLOW_KEY;
    }

    let hit = hits.get(key);
    if (!hit || currentTime - hit.start >= window) {
      hit = { start: currentTime, count: 0 };
      hits.set(key, hit);
    }

    hit.count += 1;
    const remaining = Math.max(0, requestLimit - hit.count);
    const resetSeconds = Math.max(1, Math.ceil((hit.start + window - currentTime) / 1000));

    res.setHeader?.('RateLimit-Limit', String(requestLimit));
    res.setHeader?.('RateLimit-Remaining', String(remaining));
    res.setHeader?.('RateLimit-Reset', String(resetSeconds));

    if (hit.count > requestLimit) {
      res.setHeader?.('Retry-After', String(resetSeconds));
      return res.status(429).json({
        error: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.',
      });
    }

    return next();
  };
}

module.exports = { createRateLimit };
