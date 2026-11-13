# Deployment: Cloudflare Pages + Render

This branch adds account-based private scan history. Keep the frontend and API on the same public site origin by proxying /api/* through a Cloudflare Pages Function.

## 1. Render API

Create a Web Service from this repository with:
- Root Directory: backend
- Build Command: npm install
- Start Command: npm start
- Health Check Path: /api/health

Set these environment variables:
- NODE_ENV=production
- HOST=0.0.0.0
- TRUST_PROXY=1
- INSPECTRE_DATA_DIR=/tmp/inspectre-data
- INSPECTRE_DB_PATH=/tmp/inspectre-data/inspectre.db
- INSPECTRE_NUMBERS_FILE=/tmp/inspectre-data/numbers.json
- CORS_ORIGIN=https://YOUR-PAGES-DOMAIN.pages.dev (plus custom domain, comma-separated, if used)
- DEMO_ACCOUNT_EMAIL and DEMO_ACCOUNT_PASSWORD (optional, for a pre-created jury/demo account; use a unique strong password)

The /tmp database is intentionally ephemeral for the temporary competition deployment. Accounts and scan history can reset when the instance restarts or is replaced. Do not use this storage choice for long-term production.

Copy the Render service URL, for example https://inspectre-api.onrender.com.

## 2. Cloudflare Pages frontend

Create a Pages project from the same repository:
- Root Directory: frontend
- Build Command: npm install && npm run build
- Build Output Directory: dist

Set the Pages environment variable:
- API_ORIGIN=https://YOUR-RENDER-SERVICE.onrender.com

The Pages Function in frontend/functions/api/[[path]].js proxies API requests and forwards the session cookie without exposing the API origin in the browser.

For the public live dashboard Socket.IO connection, set the frontend build variable:
- VITE_SOCKET_URL=https://YOUR-RENDER-SERVICE.onrender.com

The Render CORS origin must include the Pages domain for Socket.IO polling. If a custom domain is used, include that too.

## 3. Verify after deployment

1. Open the public dashboard and confirm it loads without login.
2. Open #/history; it should show the login/register screen.
3. Register two separate accounts.
4. Sign into account A, run a link/phone/APK scan, then open history.
5. Sign out and sign into account B; account A's scan must not appear.
6. Open /api/recent in a private browser session; it must return HTTP 401.
7. Confirm /api/stats remains public.

Do not put demo passwords, API keys, or other secrets in repository files or commit history. Configure them only in Render's environment settings.