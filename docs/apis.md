# API and external-boundary reference

All errors use `{ "error": { "code": "…", "message": "…", "details"?: [] } }`; no stack, path, environment, upstream body, or credential is returned.

## Application routes

### `GET /api/health`

Always reports process liveness as `status: "ok", process: "healthy"`. `upstream` is independently `available` or `unavailable` after a state attempt. An unavailable upstream does not make the process unhealthy.

### `GET /api/state`

Normalized response:

```json
{
  "timestamp": "2026-08-29T12:00:00.000Z",
  "latitude": 12.3,
  "longitude": -45.6,
  "altitudeKm": 420.1,
  "speedKmh": 27590,
  "illumination": "daylight-below",
  "location": { "name": "Brazil", "type": "country" },
  "astronauts": [{ "name": "Source-provided name", "craft": "ISS" }],
  "astronautCount": 1,
  "meta": {
    "source": "CelesTrak TLE propagated with satellite.js",
    "tleEpoch": "…",
    "fetchedAt": "…",
    "stale": false,
    "degraded": false,
    "partialReasons": []
  }
}
```

Optional `location`, `astronauts`, and `astronautCount` are `null` when unavailable. `partialReasons` can contain `crew-unavailable`, `location-unavailable`, `tle-stale`, and `telemetry-refresh-failed`. A failed core refresh returns the latest valid state with `stale: true` when available; otherwise HTTP 503.

State cache: 15-second TTL, one entry, insertion-order eviction, stale entry retained only as last-known fallback. TLE refresh: six hours in-process. A TLE epoch older than 72 hours marks the response partial. If CelesTrak cannot be reached before the first packet, a clearly identified bundled 1 January 2024 CelesTrak-format fixture supports the free demonstration; it is propagated only at its historical epoch (never extrapolated as a current position) and always carries `tle-stale` and `source: bundled-celestrak-snapshot ...`. Process restarts clear caches.

### `GET /api/visualpass?lat=&lng=`

Coordinates must be finite: latitude `-90..90`, longitude `-180..180`, inclusive. Missing, empty, nonnumeric, infinity, and out-of-range values receive HTTP 400 `INVALID_COORDINATES`. Without `N2YO_API_KEY`, HTTP 200 returns `{ "available": false, "reason": "N2YO_API_KEY is not configured", "passes": [] }`. Only valid future timestamps are shown; no pass is invented.

### `POST /api/narration`

Accepts optional `{ "telemetry": <normalized state> }`, otherwise obtains current state. Returns deterministic, grounded text with provider, generation time, and telemetry timestamp. Cache: 45-second TTL, one entry, only reused for the same telemetry timestamp.

## Outbound endpoints

| Service | HTTPS endpoint | Timeout | Validation | Failure behavior |
|---|---|---:|---|---|
| CelesTrak | `celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE` | 5 s | matching line 1/2 satellite number and parseable epoch | last state or controlled 503 |
| Crew mirror | `corquaid.github.io/.../people-in-space.json` | 4 s | `people` array; ISS craft and string names only | `crew-unavailable` partial result |
| BigDataCloud | `api.bigdatacloud.net/data/reverse-geocode-client` | 3.5 s | object and nonempty country/locality | `location-unavailable` partial result |
| N2YO | `api.n2yo.com/rest/v1/satellite/visualpasses/...` | 5 s | `passes` array and finite future `startUTC` | controlled 503; unavailable without key |

Every request uses `AbortController`. Network/DNS, timeout, non-2xx, HTTP 429, malformed JSON, and malformed shapes are classified internally. Optional enrichment runs independently with `Promise.allSettled`, so it cannot discard core telemetry. Open Notify's legacy HTTP endpoint is deliberately not used.
