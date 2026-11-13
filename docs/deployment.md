# Deployment guide

This document describes the deployment options represented by the repository. Choose one topology and keep frontend origins, API routing, and persistent storage consistent.

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
