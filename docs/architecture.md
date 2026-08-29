# Architecture baseline

## Canonical application

`ibm8/` is the canonical Mission Control Twin. Its Node/Express service owns telemetry acquisition, orbital calculations, optional enrichment, narration, and the production static frontend. The dependency-free browser source lives in `ibm8/client/` and builds to `ibm8/public/`. The audit found no React application or globe.gl/Three.js stack to preserve; the safe core therefore uses an interactive Canvas globe rather than adding a large framework migration. The root `backend/` directory is an earlier minimal prototype retained for history; it is not part of installation, CI, or runtime and must not be combined with the canonical service without a deliberate migration.

## Baseline audit (29 August 2026)

The starting repository contained two Node services and no frontend. `ibm8/server.js` calculated position from a CelesTrak TLE using `satellite.js`, estimated daylight below the ISS with SunCalc, called Open Notify over HTTP for crew, called BigDataCloud for reverse geocoding, and optionally called N2YO. It started listening and scheduled refresh work at import time. Its state and pass caches had no TTL or size bound; outbound requests had no timeout; coordinate validation accepted unsafe values; one enrichment failure discarded all fresh telemetry; no lockfile or tests existed. The prototype in `backend/` required a Gemini key merely to start and exposed only root and health routes.

No committed credentials were found. `N2YO_API_KEY` and future AI provider keys remain optional. Dependency directories were present locally but untracked and are ignored.

## Target data flow

1. The browser polls `GET /api/state` through a configurable same-origin/API base URL.
2. Express asks the telemetry service for a current state.
3. A bounded TLE cache refreshes from CelesTrak through a timeout-aware HTTP boundary; `satellite.js` deterministically propagates position and inertial speed.
4. Independent, optional adapters enrich the result with reverse-geocoded location and crew. Failure is represented in `meta.partialReasons`, never by fabricated data.
5. The latest valid state is retained in a bounded TTL cache. A transient failure returns it as explicitly stale.
6. `/api/narration` uses normalized state and a deterministic grounded template by default. An optional provider is isolated behind the same timeout boundary.
7. `/api/visualpass` validates observer coordinates, then uses N2YO only when configured. It otherwise returns an explicit feature-unavailable response.
8. The browser UI retains the latest valid response, bounds its trail, and renders connection, freshness, accessibility, and WebGL-fallback states.

## Reproducible commands

From `ibm8/` on Node 20 or later:

- Install: `npm ci`
- Develop backend: `npm run dev:server`
- Develop frontend: edit `client/`, run `npm run build`, then refresh the backend-served page
- Test: `npm test`
- Lint/type-oriented checks: `npm run check`
- Production build: `npm run build`
- Production start: `npm start`

The backend defaults to port 3000 and serves the built client from the same origin.
