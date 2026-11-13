'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createRateLimit } = require('../middleware/rateLimit');

function invoke(limiter, ip) {
  const headers = {};
  let statusCode = 200;
  let body;
  let nextCalled = false;
  const res = {
    setHeader(name, value) { headers[name] = value; },
    status(code) {
      statusCode = code;
      return this;
    },
    json(value) {
      body = value;
      return this;
    },
  };

  limiter({ ip }, res, () => { nextCalled = true; });
  return { headers, statusCode, body, nextCalled };
}

test('rate limiter mengizinkan permintaan sesuai batas', () => {
  const limiter = createRateLimit({ max: 2, windowMs: 60_000 });
  assert.equal(invoke(limiter, '192.0.2.1').nextCalled, true);
  assert.equal(invoke(limiter, '192.0.2.1').nextCalled, true);
  const blocked = invoke(limiter, '192.0.2.1');
  assert.equal(blocked.statusCode, 429);
  assert.equal(blocked.nextCalled, false);
  assert.equal(blocked.headers['Retry-After'], '60');
  assert.equal(blocked.headers['RateLimit-Remaining'], '0');
});

test('rate limiter membatasi jumlah kunci IP dan memakai bucket overflow', () => {
  const limiter = createRateLimit({ max: 1, maxKeys: 3, windowMs: 60_000 });
  assert.equal(invoke(limiter, '192.0.2.1').nextCalled, true);
  assert.equal(invoke(limiter, '192.0.2.2').nextCalled, true);
  const firstOverflow = invoke(limiter, '192.0.2.3');
  const secondOverflow = invoke(limiter, '192.0.2.4');

  assert.equal(firstOverflow.nextCalled, true);
  assert.equal(secondOverflow.statusCode, 429);
  assert.equal(secondOverflow.nextCalled, false);
});

test('rate limiter mengatur ulang hit setelah jendela waktu berakhir', () => {
  let currentTime = 1_000;
  const limiter = createRateLimit({
    max: 1,
    windowMs: 1_000,
    cleanupIntervalMs: 1_000,
    now: () => currentTime,
  });

  assert.equal(invoke(limiter, '192.0.2.5').nextCalled, true);
  assert.equal(invoke(limiter, '192.0.2.5').statusCode, 429);
  currentTime += 1_001;
  assert.equal(invoke(limiter, '192.0.2.5').nextCalled, true);
});

test('IP yang tidak tersedia menggunakan kunci fallback yang sama', () => {
  const limiter = createRateLimit({ max: 1 });
  assert.equal(invoke(limiter, undefined).nextCalled, true);
  const blocked = invoke(limiter, undefined);
  assert.equal(blocked.statusCode, 429);
});
