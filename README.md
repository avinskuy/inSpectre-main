# inSpectre

### Environmental & Threat Intelligence Platform

An integrated platform for digital threat awareness and environmental monitoring. inSpectre brings together security checks, environmental data, public situational summaries, and practical security guidance in one interface.

**Developed for ISCOMFEST 2026.**

<p>
  <img src="https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?logo=javascript&logoColor=000" alt="JavaScript" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=000" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-Backend-339933?logo=nodedotjs&logoColor=fff" alt="Node.js" />
  <img src="https://img.shields.io/badge/Vite-Frontend-646CFF?logo=vite&logoColor=fff" alt="Vite" />
  <img src="https://img.shields.io/badge/SQLite-Database-003B57?logo=sqlite&logoColor=fff" alt="SQLite" />
</p>

---

## Overview

inSpectre is an **Environmental & Threat Intelligence** platform designed to help users interpret indicators of digital threats and monitor selected environmental information. Its modules combine URL and phone-number checks, file and QR inspection, environmental monitoring, public aggregate statistics, security news, and educational guidance.

The platform is an information and awareness tool. Its findings are indicators that require context and, where appropriate, independent verification.

## Current capabilities

### Digital security
- **URL analysis:** heuristic checks for suspicious URL patterns, domain characteristics, and phishing indicators.
- **URL reputation:** optional Google Safe Browsing lookup when a server-side API key is configured.
- **Phone-number checks:** community-report signals and supported reputation lookups.
- **APK and ZIP inspection:** static archive inspection and Android manifest analysis when AAPT is available. Files are not executed.
- **QR inspection:** QR decoding in the browser; decoded destinations are not opened automatically.
- **Private scan history:** registered users can view their own scan records. The public dashboard exposes aggregate statistics, not individual scan details.

### Environmental intelligence
- **Satellite hotspots:** NASA FIRMS thermal-anomaly data.
- **Air quality:** available observations from OpenAQ.
- **Weather and warnings:** BMKG forecast and warning data.
- **Earthquake information:** available BMKG earthquake feed.
- **Interactive monitoring:** map-based presentation of supported environmental layers.

### Platform modules
- **Public dashboard:** aggregate scan statistics and service status.
- **Security news:** curated security-related news feed from the configured backend source.
- **AI assistance:** optional Indonesian-language assistant using the configured OpenRouter model provider.
- **Security education:** learning materials and practical guidance.
- **Accessibility options:** supported display and motion preferences.

Availability of external data depends on provider uptime, API access, network connectivity, and server configuration.

## Technology

| Layer | Technologies |
|---|---|
| Frontend | React 18, Vite, JavaScript |
| Mapping | Leaflet, React Leaflet, OpenStreetMap |
| Backend | Node.js, Express |
| Database | SQLite via better-sqlite3 |
| Realtime updates | Socket.IO |
| QR decoding | jsQR |
| External intelligence | Google Safe Browsing, NASA FIRMS, OpenAQ, BMKG |
| AI provider | OpenRouter (optional) |
| Tests | Node.js built-in test runner |
| Deployment support | Docker, Docker Compose, Nginx, Cloudflare Pages Function proxy |

## Architecture

```text
Browser
  |
  +-- React application
  |     +-- Nexus and public dashboard
  |     +-- Digital security analysis
  |     +-- Environmental monitoring
  |     +-- News, education, and assistant
  |     +-- Login and private scan history
  |
  +-- Same-origin /api requests
          |
          v
     Express API
          |
          +-- Authentication and sessions
          +-- URL and phone-number analysis
          +-- APK / ZIP inspection
          +-- Public aggregate statistics
          +-- Environmental data services
          +-- News and AI assistance
          |
          +-- SQLite
          |
          +-- External data providers
                +-- Google Safe Browsing
                +-- NASA FIRMS
                +-- OpenAQ
                +-- BMKG
                +-- OpenRouter (optional)

     Socket.IO
          +-- Aggregate dashboard updates
```

The frontend uses same-origin `/api` requests. In the Cloudflare Pages deployment path, a Pages Function proxies those requests to the configured backend and forwards the session cookie.

## Repository layout

```text
.
├── .github/
│   └── workflows/          # Continuous integration
├── backend/
│   ├── data/               # Public reference dataset and its license
│   ├── test/               # Backend unit and integration tests
│   ├── *.js                # API server and domain modules
│   ├── Dockerfile
│   └── package.json
├── deploy/
│   ├── nginx.conf
│   └── smoke-test.sh
├── frontend/
│   ├── functions/          # Cloudflare Pages API proxy
│   ├── public/             # Static media assets
│   └── src/
│       ├── components/
│       ├── lib/
│       └── pages/
├── docker-compose.yml
└── README.md
```

Backend modules are currently separated by domain (authentication, database, privacy, URL checks, phone checks, environmental providers, news, and archive inspection). Keep that separation when adding or refactoring functionality; avoid creating folders that only add another level without a clear ownership boundary.

## Getting started

### Requirements
- Node.js 18 or newer
- npm
- A C++ build toolchain supported by better-sqlite3 on platforms where a prebuilt binary is unavailable

### 1. Clone the repository

```bash
git clone https://github.com/avinskuy/inSpectre-main.git
cd inSpectre-main
```

### 2. Configure the backend

```bash
cd backend
npm install
cp .env.example .env
```

Set the required values in `backend/.env`. Do not commit the real `.env` file or share API keys.

Common optional integrations:

| Variable | Purpose |
|---|---|
| `GOOGLE_SAFE_BROWSING_API_KEY` | URL reputation lookup |
| `NASA_FIRMS_MAP_KEY` | NASA FIRMS hotspot data |
| `OPENAQ_API_KEY` | OpenAQ access, if required by the configured endpoint |
| `OPENROUTER_API_KEY` | AI assistant |
| `AAPT_PATH` | Path to Android AAPT executable for APK manifest analysis |
| `CORS_ORIGIN` | Allowed frontend origin(s), comma-separated |
| `TRUST_PROXY` | Set to `1` only when running behind a trusted reverse proxy |
| `INSPECTRE_DATA_DIR` | Directory for SQLite and local data files |
| `INSPECTRE_DB_PATH` | Optional explicit SQLite database path |
| `INSPECTRE_NUMBERS_FILE` | Optional community number-report data file |

Authentication settings for an optional jury/demo account are documented in `backend/.env.example`. Use a unique strong password and configure secrets only in the server environment.

### 3. Run the backend

```bash
npm start
```

The API listens on port `5000` by default. For local development, keep the backend running in its own terminal.

### 4. Run the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite serves the frontend on port `3000` and proxies `/api` and `/socket.io` to `http://localhost:5000` by default. Override the proxy target with `VITE_PROXY_TARGET` when needed.

## Authentication and privacy

- Registration and login use server-managed sessions.
- Session cookies are HttpOnly and are not exposed to frontend JavaScript.
- The private history endpoint requires an authenticated session and returns records associated with that account.
- The public dashboard uses aggregate statistics and does not expose individual scan history.
- Scan details are not broadcast to all Socket.IO clients.
- Use HTTPS in deployed environments and configure trusted proxy settings correctly.
- Temporary or ephemeral storage can lose accounts, sessions, and scan history when an instance is replaced or restarted. Use persistent storage for long-term deployments.

## API reference

All routes are served under `/api`.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/health` | Public | API health status |
| `POST` | `/auth/register` | Public, rate-limited | Create an account and session |
| `POST` | `/auth/login` | Public, rate-limited | Start a session |
| `POST` | `/auth/logout` | Session-aware | End the current session |
| `GET` | `/auth/me` | Authenticated | Get the current account |
| `GET` | `/stats` | Public | Aggregate dashboard statistics |
| `GET` | `/recent` | Authenticated | Current account's recent scans |
| `GET` | `/news` | Public | Security news feed |
| `POST` | `/assistant` | Public, rate-limited | AI assistance |
| `GET` | `/check/:nomor` | Public, rate-limited | Phone-number check |
| `POST` | `/scan` | Public, rate-limited | URL scan |
| `POST` | `/scan-file` | Public, rate-limited | File scan |
| `GET` | `/environment/hotspots` | Public | NASA FIRMS hotspot data |
| `GET` | `/environment/air-quality` | Public | OpenAQ observations |
| `GET` | `/environment/regions` | Public | BMKG administrative region data |
| `GET` | `/environment/weather` | Public | BMKG forecast |
| `GET` | `/environment/weather-warnings` | Public | BMKG weather warnings |
| `GET` | `/environment/disasters` | Public | BMKG earthquake information |

The phone check accepts the phone number in the route parameter. The weather route accepts the `adm4` query parameter. Request and response details are defined in the route handlers in `backend/server.js`.

## Testing

Run backend tests:

```bash
cd backend
npm test
```

Build the frontend:

```bash
cd frontend
npm install
npm run build
```

Run both checks before proposing a deployment. Tests that depend on external services should be interpreted according to their mocked or live integration setup.

## Deployment

- **Docker:** use the root `docker-compose.yml` to run the frontend and backend together.
- **Nginx:** `deploy/nginx.conf` contains the reverse-proxy configuration used by the deployment setup.
- **Cloudflare Pages:** the API proxy function is located at `frontend/functions/api/[[path]].js`.
- **Backend hosting:** configure environment variables, persistent data storage, allowed origins, and health checks in the hosting provider.

Deployment-specific instructions should be kept in the deployment documentation and updated whenever hosting configuration changes.

## Important limitations

- Heuristic scores are not probabilities and cannot guarantee that a URL, phone number, or file is safe or malicious.
- A clean reputation lookup is not proof of safety.
- APK and ZIP inspection is static analysis, not full malware execution or sandbox analysis.
- APK manifest analysis depends on AAPT being installed and configured.
- Hotspot observations are thermal anomalies, not confirmed fires.
- Environmental observations and forecasts may be delayed, incomplete, or unavailable.
- External providers may impose rate limits, coverage constraints, or API-key requirements.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
