'use strict';

const express = require('express');
const http = require('node:http');
const cors = require('cors');
const config = require('./config');
const { ensureDemoAccount } = require('./services/accounts/auth');
const { lookupWhoTag } = require('./services/phones/whotagProvider');
const { initSocket } = require('./emitter');
const { createRateLimit } = require('./middleware/rateLimit');
const { createAuthRouter } = require('./routes/auth');
const { createPlatformRouter } = require('./routes/platform');
const { createNewsRouter } = require('./routes/news');
const { createEnvironmentRouter } = require('./routes/environment');
const { createPhoneRouter } = require('./routes/phones');
const { createFileRouter } = require('./routes/files');
const { createSecurityRouter } = require('./routes/security');

const app = express();

// Di container production, hanya reverse proxy internal yang boleh meneruskan client IP.
app.set('trust proxy', process.env.TRUST_PROXY === '1' ? 1 : false);
app.use(cors({ origin: config.CORS_ORIGINS }));
app.use(express.json({ limit: '10kb' }));

const scanLimiter = createRateLimit({ max: 30 });
const assistantLimiter = createRateLimit({ windowMs: 60_000, max: 10 });
const authLimiter = createRateLimit({ windowMs: 15 * 60_000, max: 12 });

app.use('/api', createAuthRouter({ authLimiter }));
app.use('/api', createPlatformRouter({ assistantLimiter }));
app.use('/api', createNewsRouter());
app.use('/api', createEnvironmentRouter());
app.use('/api', createPhoneRouter({ scanLimiter, lookupWhoTag }));
app.use('/api', createFileRouter({ scanLimiter }));
app.use('/api', createSecurityRouter({ scanLimiter }));

const server = http.createServer(app);
initSocket(server);

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${config.PORT} sudah dipakai. Ubah PORT di .env atau matikan proses lain.`);
  } else {
    console.error('❌ Server error:', error.message);
  }
  process.exit(1);
});

if (require.main === module) {
  ensureDemoAccount();
  const host = process.env.HOST || (process.env.RENDER ? '0.0.0.0' : '127.0.0.1');
  server.listen(config.PORT, host, () => {
    console.log(`🚀 inSpectre server berjalan di port ${config.PORT}`);
  });
}

module.exports = { app, server };
