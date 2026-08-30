# Mission Control Twin

Mission Control Twin is a zero-cost educational digital twin of the International Space Station, created for the IBM AI Builders Challenge theme **Mission Beyond Earth: Space Exploration**. It turns public orbital elements into an understandable mission-control experience without presenting an educational application as operational flight software.

## Team

- **Mina** — Mechatronics Engineering Technologies
- **Hawraa** — Artificial Intelligence
- **Huda** — Artificial Intelligence
- **Worood** — Artificial Intelligence

## Judge quick start

The canonical application is **`ibm8/`**. It requires Node.js 20+ and no API key for its core experience.

```bash
git clone https://github.com/ahpa5246-lgtm/mission-control-twin.git
cd mission-control-twin/ibm8
npm ci
npm test
npm run check
npm run build
npm start
```

Open <http://localhost:3000>. The team will add the approved hosted-demo URL separately after deployment and HTTPS verification.

For a concise evaluation map, see [the judging guide](docs/judging-guide.md), [two-minute demo script](docs/demo-script.md), and [submission checklist](docs/submission-checklist.md).

## What it does

The application combines an Express backend with a dependency-free responsive browser client. It:

- obtains ISS orbital elements from CelesTrak and propagates them with `satellite.js`;
- displays latitude, longitude, altitude, inertial speed, and a bounded recent trail;
- renders an interactive local WebGL globe with an accessible Canvas fallback;
- labels fresh, partial, degraded, and stale data rather than inventing missing values;
- estimates daylight at the point beneath the ISS;
- optionally enriches location, crew, and visible-pass information;
- produces a strictly grounded deterministic briefing without an AI key.

The interface polls without overlapping requests, retains the last verified packet, supports mouse, touch, and keyboard controls, respects reduced motion, offers a low-power mode, and pauses animation while hidden.

## Architecture and data integrity

Browser → Express `/api/state` → bounded caches → CelesTrak adapter → `satellite.js`.

Location and crew are independent best-effort enrichments. Failures produce `meta.degraded`, `meta.partialReasons`, or `meta.stale`; absent values are `null`, never invented. See [architecture](docs/architecture.md) and [API boundaries](docs/apis.md).

Speed is the magnitude of propagated Earth-centered inertial velocity in km/h, not ground-track speed. “Daylight/night beneath the ISS” is a ground-light approximation, not full spacecraft eclipse geometry. TLE epochs older than 72 hours are identified as stale.

Narration defaults to a deterministic template and includes only normalized supplied fields. The provider-neutral grounding contract is documented in [the prompt](docs/prompt.md). No mandatory path uses Gemini, Qwen, N2YO, or a paid service.

## Reproducible commands

From the repository root:

```bash
npm ci
npm test
npm run check
npm run build
npm start
```

The root commands delegate to `ibm8/`. For server development use `npm run dev:server --prefix ibm8`. Frontend source lives in `ibm8/client/` and the deterministic production build in `ibm8/public/`.

### Optional environment variables

| Variable | Default | Purpose |
|---|---:|---|
| `PORT` | `3000` | HTTP listen port |
| `N2YO_API_KEY` | unset | Optional server-side visible-pass lookup |

A separately served browser may set `window.MISSION_CONTROL_API_URL`; same-origin is the secure default. Never place an N2YO key in frontend code. No AI key is currently required or consumed.

## Data and visual sources

- CelesTrak GP/TLE over HTTPS: primary orbital elements.
- `satellite.js`: SGP4 propagation.
- SunCalc: approximate light at the Earth subpoint.
- BigDataCloud reverse-geocode client: optional keyless location.
- Corquaid public people-in-space JSON: optional crew mirror with documented authority limitations.
- N2YO: optional visible passes, invoked only when a server environment key is configured.

The bundled Earth and cloud textures are original project assets, not NASA imagery. Their provenance and the evaluated NASA/Globe.GL upgrade paths are documented in [ATTRIBUTION.md](ibm8/client/assets/ATTRIBUTION.md). NASA and ISS names are used descriptively; NASA does not endorse this project.

## Tests and CI

`npm test` uses local fixtures and mocks. Coverage includes:

- app import, health, state, and HTTP smoke behavior;
- coordinate boundaries and generic error responses;
- bounded caches, timeouts, malformed and rate-limited upstreams;
- deterministic TLE propagation, partial enrichment, and stale fallback;
- narration grounding;
- bounded trails and local-only texture paths;
- WebGL initialization/fallback behavior;
- persisted low-power state and deterministic texture-unit binding;
- responsive landmarks and reduced-motion support.

GitHub Actions installs from the committed lockfile, runs tests and syntax checks, builds the static client, and verifies that generated `public/` assets are committed.

## Limits and honest claims

- This is educational software, not certified navigation or flight control.
- Data freshness depends on CelesTrak. A bundled historical snapshot is visibly marked stale and is never presented as a current position.
- Daylight below the ISS does not prove whether the spacecraft itself is sunlit.
- Optional location and crew sources may be delayed or unavailable.
- Visible passes require an optional N2YO key and are never fabricated.
- The globe uses original approximate local artwork rather than official NASA Blue Marble imagery.
- No external generative-AI provider is enabled in the safe core.

## Troubleshooting

- **`SERVICE_UNAVAILABLE`:** verify outbound HTTPS/DNS; the UI retains a prior packet when available.
- **Partial data:** inspect `meta.partialReasons`; optional enrichment failure does not discard the orbit.
- **No visible pass:** configure `N2YO_API_KEY` server-side or use the explicit unavailable state.
- **Old frontend:** run `npm run build`.
- **Port in use:** set another port, for example `PORT=3001 npm start`.
- **WebGL unavailable:** telemetry remains usable through the controlled Canvas fallback.

## Repository status and licensing

The application source, tests, documentation, and generated browser build are committed. No deployment, competition submission, or IBM coursework evidence is claimed by the repository.

This repository currently has no explicit open-source license. Public visibility permits viewing but does not itself grant reuse rights. The owner must deliberately select and add a license before claiming that third parties may reuse or redistribute the project.

## Rollback

Changes are preserved as normal Git commits. Use `git revert <commit>` to undo a change without rewriting shared history.
