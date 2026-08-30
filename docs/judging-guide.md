# Judging guide

## One-sentence pitch

Mission Control Twin is a resilient, zero-cost educational ISS digital twin that converts public orbital elements into an interactive, honest, and accessible mission-control experience.

## Evaluation map

| Criterion | Evidence |
|---|---|
| Problem | Public orbital data is fragmented and difficult for learners to interpret. |
| Solution | A responsive globe, ISS trail, telemetry cards, data-quality states, optional enrichment, and grounded briefing in one interface. |
| Technical depth | Express service, SGP4 propagation, timeout-aware adapters, bounded caches, WebGL renderer, Canvas fallback, and deterministic builds. |
| Reliability | Partial sources cannot discard the orbit; stale data is labeled; requests time out; inputs are validated; storage is bounded. |
| Accessibility | Keyboard controls, semantic landmarks, status announcements, reduced motion, low-power mode, responsive layout, and fallback rendering. |
| Responsible data use | Missing values are never fabricated; approximations and optional sources are disclosed; no mandatory secret or paid service is used. |
| Feasibility | Three small runtime dependencies, local assets, no database, no AI key, and reproducible npm/CI commands. |
| Educational value | Learners can explore position, altitude, speed, data freshness, orbital modelling, and system resilience. |

## Architecture at a glance

1. The browser requests normalized state from Express.
2. The server refreshes CelesTrak TLE data through a timeout-aware boundary.
3. `satellite.js` propagates position and inertial speed.
4. Optional crew and location adapters settle independently.
5. Bounded caches retain only controlled state and provide an explicitly stale fallback.
6. The browser renders telemetry, a bounded trail, and a local WebGL Earth; Canvas remains available as a fallback.
7. Narration uses only normalized fields and needs no external AI key.

## What to demonstrate

1. Rotate the globe and select Follow ISS.
2. Point to the station marker, recent trail, timestamp, and telemetry cards.
3. Explain the fresh/partial/stale label visible in that recording.
4. Show the deterministic briefing.
5. Show reduced-motion or low-power support briefly.
6. End on the successful CI evidence.

## Honest limitations

- Educational, not flight-control software.
- Orbital freshness depends on CelesTrak.
- The daylight label is about the point beneath the ISS.
- Crew, location, and visible passes are optional.
- Earth artwork is original approximate imagery, not NASA Blue Marble.
- The core does not call an external generative-AI provider.

## Repository map

- `ibm8/src/` — server, telemetry, adapters, cache, orbit, narration.
- `ibm8/client/` — browser source and local visual assets.
- `ibm8/public/` — deterministic generated production client.
- `ibm8/tests/` — focused unit/integration/static contract tests.
- `docs/` — architecture, APIs, narration contract, demo, and submission evidence.
- `.github/workflows/ci.yml` — reproducible PR/main verification.
