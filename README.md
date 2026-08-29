# Mission Control Twin

Mission Control Twin is a zero-cost educational digital twin of the International Space Station, created for the IBM AI Builders Challenge theme **Mission Beyond Earth: Space Exploration**. It turns public orbital elements into a live, understandable mission-control display without pretending that an educational web application is operational flight software.

## What it does

The canonical application is **`ibm8/`**: an Express backend and a dependency-free responsive browser frontend. It propagates a real CelesTrak ISS TLE with `satellite.js`, displays location and inertial speed on an interactive canvas globe, estimates whether the point below the ISS is in daylight, optionally enriches location/crew/pass data, and creates strictly grounded narration. `backend/` is a preserved early prototype and is not used.

The UI polls every five seconds without overlapping requests, retains the last valid packet, limits the trail to 36 points, supports touch/keyboard navigation and reduced motion, and offers opt-in Web Speech playback. English and Arabic text can coexist through `dir="auto"` and logical CSS properties.

## Architecture and data integrity

Browser → Express `/api/state` → bounded caches → CelesTrak adapter → `satellite.js`. Location and crew are independent best-effort enrichments. Failures produce `meta.degraded`, `meta.partialReasons`, or `meta.stale`; absent values are `null`, never invented. See [architecture](docs/architecture.md) and [API boundaries](docs/apis.md).

Speed is the magnitude of the propagated Earth-centered inertial velocity in km/h, not ground-track speed. “Daylight/night beneath the ISS” uses SunCalc at the sub-satellite point; it is an educational ground-light approximation, **not** full spacecraft eclipse geometry. TLE epochs older than 72 hours are identified as stale.

Narration defaults to a deterministic template and requires no key. It includes only supplied normalized fields. The provider-neutral grounding rules are in [the prompt](docs/prompt.md). No mandatory path uses Gemini, Qwen, N2YO, or a paid service.

## Requirements and reproducible operation

- Node.js 20+
- npm 10+

```bash
cd ibm8
npm ci
npm test
npm run check
npm run build
npm start
```

Open <http://localhost:3000>. For development, run `npm run dev:server`; edit `client/`, run `npm run build`, and refresh. The checked-in `public/` build makes production startup deterministic. Root convenience commands (`npm test`, `npm run check`, `npm run build`, `npm start`) delegate to `ibm8/`.

### Optional environment variables

| Variable | Default | Purpose |
|---|---:|---|
| `PORT` | `3000` | HTTP listen port |
| `N2YO_API_KEY` | unset | Optional future visible-pass lookup |

A browser served separately can set `window.MISSION_CONTROL_API_URL` before `app.js`; same-origin is the secure default. Never put N2YO keys in frontend code. No AI key is required or currently consumed.

## APIs and sources

- CelesTrak GP/TLE over HTTPS: primary orbital elements.
- `satellite.js`: SGP4 propagation from that TLE.
- SunCalc: approximate light at the Earth subpoint.
- BigDataCloud reverse-geocode client: optional, keyless location.
- Corquaid’s public people-in-space JSON: optional crew mirror; source availability and authority are limitations.
- N2YO: optional visible passes, called only with a human-provided server environment key.

See [full contracts, timeouts, validation, and cache policy](docs/apis.md). Public-source names and NASA/ISS marks remain the property of their owners. This repository currently draws the globe procedurally and includes no NASA texture. If a NASA Blue Marble asset is added, retain its NASA public-media attribution and review the NASA media guidelines.

## Tests and CI

`npm test` uses only local fixtures/mocks and covers app import, health, API smoke flow, coordinate boundaries, bounded-cache behavior, cancellation/timeouts, malformed/rate-limited responses, deterministic TLE propagation, partial enrichment, stale retention, and no-key narration. GitHub Actions installs from the lockfile, tests, checks syntax, builds, and verifies a clean generated frontend. Optional integrations need no CI secrets.

## Limits and risks

- TLE propagation is educational and depends on CelesTrak freshness; it is not certified navigation.
- If CelesTrak is unreachable at startup, the app propagates a bundled 1 January 2024 snapshot and prominently reports `tle-stale`; this is a resilience demonstration, not current telemetry.
- The daylight label does not prove that the spacecraft itself is sunlit.
- Reverse geocoding and crew information are optional and can be absent or delayed.
- N2YO predictions need a key and are never fabricated when unavailable.
- The globe is a lightweight canvas visualization rather than a photorealistic Three.js renderer; it provides a controlled fallback if canvas is unavailable.
- No external AI provider is enabled in this safe core. Adding one requires output grounding validation, timeout/rate-limit handling, and mocked tests.

## Troubleshooting

- **`SERVICE_UNAVAILABLE`:** verify outbound HTTPS/DNS; the UI will retain a prior packet when one exists.
- **Partial data:** inspect `meta.partialReasons`; core orbit remains useful when enrichment fails.
- **No pass:** configure `N2YO_API_KEY` on the server or accept the explicit unavailable state.
- **Old frontend:** run `npm run build` after changing `client/`.
- **Port in use:** set `PORT=3001 npm start`.
- **WebGL/canvas unavailable:** telemetry and narration still render; the globe area explains its fallback.

## Rollback

Each roadmap unit is a separate commit. To roll back without rewriting history, use `git revert <commit>` from newest to oldest. The pre-roadmap canonical server is commit `77284d4`; do not reset shared history or merge the prototype into it.

## IBM Bob and human-required submission work

The project is intended to demonstrate how IBM Bob can assist with repository analysis, implementation planning, tests, and iterative code review. This repository does **not** claim that Bob sessions, IBM SkillsBuild coursework, registrations, screenshots, video production, deployment, or the final competition submission have been completed. A human must perform and truthfully document those activities, record the demo, review competition terms, and submit it. See the [submission checklist](docs/submission-checklist.md) and [three-minute demo script](docs/demo-script.md).
