const test = require('node:test');
const assert = require('node:assert/strict');
const { BoundedTtlCache } = require('../src/cache');
const { validateCoordinates } = require('../src/coordinates');
const { request, UpstreamError } = require('../src/http');
const { parseTle, calculateState } = require('../src/orbit');
const { createTelemetryService } = require('../src/telemetry');
const { templateNarration, createNarrationService } = require('../src/narration');

const TLE = `ISS (ZARYA)
1 25544U 98067A   24001.50000000  .00016717  00000+0  30270-3 0  9994
2 25544  51.6400  20.0000 0005000  30.0000  40.0000 15.50000000430000`;

test('bounded cache expires, replaces, and evicts oldest insertion deterministically', () => {
  let clock = 0;
  const cache = new BoundedTtlCache({ ttlMs: 10, maxEntries: 2, now: () => clock });
  cache.set('a', 1); cache.set('b', 2); assert.equal(cache.get('a'), 1);
  cache.set('c', 3); assert.equal(cache.get('a'), undefined); assert.equal(cache.size, 2);
  cache.set('b', 4); assert.equal(cache.get('b'), 4);
  clock = 11; assert.equal(cache.get('b'), undefined); assert.equal(cache.get('b', { allowStale: true }), 4);
});

test('coordinate validation accepts exact boundaries', () => {
  for (const [lat, lng] of [[-90, -180], [90, 180], [0, 0]]) assert.equal(validateCoordinates(lat, lng).valid, true);
});

test('coordinate validation rejects missing, malformed, infinite, empty and out of range values', () => {
  const invalid = [[undefined, 0], [0, undefined], ['', 0], [0, ''], ['NaN', 0], [Infinity, 0], [-90.0001, 0], [90.0001, 0], [0, -180.0001], [0, 180.0001]];
  for (const pair of invalid) assert.equal(validateCoordinates(...pair).valid, false, pair.join(','));
});

test('HTTP boundary parses data and classifies malformed and rate-limited responses', async () => {
  assert.deepEqual(await request('test', { fetchImpl: async () => ({ ok: true, json: async () => ({ ok: 1 }) }) }), { ok: 1 });
  await assert.rejects(request('test', { fetchImpl: async () => ({ ok: true, json: async () => { throw Error('bad'); } }) }), { code: 'UPSTREAM_MALFORMED' });
  await assert.rejects(request('test', { fetchImpl: async () => ({ ok: false, status: 429 }) }), { code: 'UPSTREAM_RATE_LIMITED' });
});

test('HTTP boundary aborts a timed-out request', async () => {
  let aborted = false;
  const fetchImpl = (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => {
    aborted = true; const error = new Error('abort'); error.name = 'AbortError'; reject(error);
  }));
  await assert.rejects(request('test', { fetchImpl, timeoutMs: 2 }), error => error instanceof UpstreamError && error.code === 'UPSTREAM_TIMEOUT');
  assert.equal(aborted, true);
});

test('fixed TLE propagation produces finite physical state and deterministic result', () => {
  const tle = parseTle(TLE, new Date('2024-01-01T12:00:00Z'));
  const state = calculateState(tle, new Date('2024-01-01T12:00:00Z'));
  assert.equal(tle.epoch, '2024-01-01T12:00:00.000Z');
  assert.ok(state.latitude >= -90 && state.latitude <= 90);
  assert.ok(state.longitude >= -180 && state.longitude <= 180);
  assert.ok(state.altitudeKm > 300 && state.altitudeKm < 500);
  assert.ok(state.speedKmh > 25000 && state.speedKmh < 30000);
});

test('optional enrichment failure returns useful partial telemetry', async () => {
  const adapters = { tle: async () => parseTle(TLE), crew: async () => { throw Error('offline'); }, location: async () => ({ name: 'Atlantic Ocean', type: 'ocean' }) };
  const service = createTelemetryService({ adapters, now: () => new Date('2024-01-01T12:00:00Z') });
  const state = await service.state();
  assert.equal(state.astronauts, null); assert.equal(state.location.type, 'ocean');
  assert.deepEqual(state.meta.partialReasons, ['crew-unavailable']);
});

test('latest valid state is returned explicitly stale after core refresh failure', async () => {
  let clock = new Date('2024-01-01T12:00:00Z');
  let fails = false;
  const adapters = { tle: async () => { if (fails) throw Error('offline'); return parseTle(TLE); }, crew: async () => [], location: async () => null };
  const service = createTelemetryService({ adapters, now: () => clock });
  const first = await service.state(); fails = true;
  clock = new Date('2024-01-01T19:00:00Z');
  const fallback = await service.state();
  assert.equal(fallback.timestamp, first.timestamp);
  assert.equal(fallback.meta.stale, true);
  assert.ok(fallback.meta.partialReasons.includes('telemetry-refresh-failed'));
});

test('deterministic narration is grounded, handles partial/ocean state and caches', () => {
  const state = { timestamp: '2024-01-01T00:00:00Z', latitude: 1, longitude: 2, altitudeKm: null,
    speedKmh: null, location: { name: 'Pacific Ocean', type: 'ocean' }, astronautCount: null,
    illumination: 'night-below', meta: { degraded: true, stale: false } };
  const text = templateNarration(state);
  assert.match(text, /Pacific Ocean/); assert.doesNotMatch(text, /Altitude/); assert.match(text, /unavailable/);
  const service = createNarrationService({ now: () => 0 });
  assert.equal(service.narrate(state), service.narrate(state));
  assert.equal(service.narrate(state).provider, 'deterministic-template');
});
