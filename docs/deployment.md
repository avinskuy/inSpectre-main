# Deployment guide

This document describes the deployment options represented by the repository. Choose one topology and keep frontend origins, API routing, and persistent storage consistent.

## Existing VPS with Node.js, systemd, and Nginx

Use this path when the VPS already runs the frontend as static files under Nginx and the API as a native Node.js systemd service. Do not switch an existing host to Docker Compose as part of an application update unless the infrastructure migration is planned separately.

### Backend service

Keep the production environment file outside the repository and readable only by the service administrator (for example, mode `600`). It should contain the integration API keys and these deployment settings:

```dotenv
NODE_ENV=production
PORT=5000
HOST=127.0.0.1
TRUST_PROXY=1
CORS_ORIGIN=https://YOUR-DOMAIN,https://www.YOUR-DOMAIN
INSPECTRE_DATA_DIR=/var/lib/inspectre
INSPECTRE_DB_PATH=/var/lib/inspectre/inspectre.db
INSPECTRE_NUMBERS_FILE=/var/lib/inspectre/numbers.json
```

Use the real public origins and the actual persistent data paths for the host. Never put real credentials in the repository. `NODE_ENV=production` is required so session cookies receive the `Secure` attribute. Set `TRUST_PROXY=1` only when exactly one trusted Nginx reverse proxy sits in front of the API and Nginx overwrites the forwarded client IP header.

The systemd unit should load the protected environment file and run the API from the deployed backend directory. The relevant service settings are:

```ini
[Service]
Type=simple
WorkingDirectory=/opt/inspectre-source/backend
EnvironmentFile=/etc/inspectre/inspectre-api.env
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
```

Adapt `WorkingDirectory` and `EnvironmentFile` to the actual host paths. Do not duplicate production secrets in the unit file. After changing the unit, reload systemd and restart only the API service during an approved deployment; verify `systemctl is-active` and `GET /api/health` before considering the release healthy.

### Nginx reverse proxy

Keep the backend bound to loopback; do not expose port `5000` publicly. In both the `/api/` and `/socket.io/` proxy locations, forward the original HTTPS scheme:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Forwarded-Proto $scheme;
```

For Socket.IO, retain the WebSocket `Upgrade` and `Connection` headers. The `X-Forwarded-Proto` header is important for applications that need to recognize the original HTTPS request behind Nginx.

### Frontend and release safety

Build the frontend with `npm ci && npm run build` from `frontend/`, then publish the generated `dist/` contents to the configured Nginx document root. Keep a known-good frontend backup and the previous backend release available for rollback. Back up the SQLite database using SQLite's backup mechanism or a consistent stopped-service backup before applying schema migrations. Do not copy a live WAL database by copying only the main `.db` file.

After deployment, verify HTTPS redirects, frontend HTTP 200, backend health, login/logout cookie behavior, two-account history isolation, and Socket.IO dashboard updates. Run the smoke test below, then perform browser checks for file upload, QR, map layers, and responsive layouts.

## Docker Compose

From the repository root:

```bash
cp .env.vps.example .env
cp backend/.env.example backend/.env
# Edit .env dan backend/.env sebelum menjalankan layanan.
docker compose up -d --build
docker compose ps
docker compose logs -f backend
```

The frontend is published on port `WEB_PORT` (default `8080`). The backend binds to `0.0.0.0` inside its container and is reachable internally by the frontend container. Compose loads backend integration credentials and settings from `backend/.env`; the root `.env` supplies Compose-level values such as `WEB_PORT` and `CORS_ORIGIN`. Configure `CORS_ORIGIN` in the root `.env` to the exact public frontend origin when deploying; use a wildcard only for local testing. Keep both environment files out of version control.

The Compose volume `inspectre_data` persists backend database and local data files across container recreation. The backend image also installs Debian's `aapt` package so APK binary AndroidManifest analysis is available in the container.

## Cloudflare Pages frontend with a separately hosted API

- Build the frontend from the `frontend` directory using `npm install && npm run build`.
- Publish the `dist` directory.
- Configure the Pages Function environment variable `API_ORIGIN` with the backend's HTTPS origin.
- Configure `VITE_SOCKET_URL` at build time with the backend's HTTPS origin if the realtime dashboard connection is enabled.
- Configure backend `CORS_ORIGIN` with the Pages domain and any production custom domain.
- Keep the Pages Function at `frontend/functions/api/[[path]].js`; it proxies same-origin `/api/*` requests and forwards session cookies.

## Backend environment

Start from `backend/.env.example` and copy it to `backend/.env` for Docker Compose. Configure only the integrations required by the deployment. The Compose service loads this file with `env_file`; explicit Compose environment values such as `HOST`, `PORT`, and `CORS_ORIGIN` take precedence. Never commit real API keys, passwords, session secrets, or production environment files.

At minimum, configure:
- `NODE_ENV=production`
- `HOST=0.0.0.0` when the platform requires binding to all interfaces
- `PORT` to the port supplied by the hosting platform, if applicable
- `TRUST_PROXY=1` only when the service is behind a trusted reverse proxy
- `CORS_ORIGIN` to the frontend origin(s)
- `INSPECTRE_DATA_DIR` and, optionally, `INSPECTRE_DB_PATH` for persistent storage

## Health check and smoke test

The backend health endpoint is `GET /api/health`. After deployment, run:

```bash
./deploy/smoke-test.sh https://YOUR-PUBLIC-DOMAIN
```

Then verify the public dashboard, registration/login, private history isolation between two accounts, and public aggregate statistics. Do not use real personal or sensitive URLs during demonstration tests.

## Storage and session considerations

SQLite files and community number data must live on persistent storage if they need to survive restarts. Ephemeral filesystems can lose accounts, sessions, and scan history when an instance is restarted or replaced. Back up persistent data before migrations or infrastructure changes.

Use HTTPS for public deployments. Do not expose the backend database or internal service port directly to the public internet.
