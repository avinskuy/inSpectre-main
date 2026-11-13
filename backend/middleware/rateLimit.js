'use strict';

function createRateLimit({ windowMs = 60_000, max = 30 } = {}) {
  const hits = new Map();

  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [ip, hit] of hits) {
      if (now - hit.start > windowMs) hits.delete(ip);
    }
  }, windowMs);
  cleanup.unref();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket?.remoteAddress || 'unknown';
    const hit = hits.get(key);

    if (!hit || now - hit.start > windowMs) {
      hits.set(key, { start: now, count: 1 });
      return next();
    }

    hit.count += 1;
    if (hit.count > max) {
      return res.status(429).json({
        error: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.',
      });
    }

    return next();
  };
}

module.exports = { createRateLimit };
