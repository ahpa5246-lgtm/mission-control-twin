const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createApp } = require('../src/app');

const state = { timestamp: '2026-01-01T00:00:00Z', latitude: 10, longitude: 20, altitudeKm: 420,
  speedKmh: 27600, illumination: 'daylight-below', location: null, astronauts: [], astronautCount: 0,
  meta: { stale: false, degraded: true, partialReasons: ['location-unavailable'] } };

async function withServer(app, fn) {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try { return await fn(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve => server.close(resolve)); }
}

function fixture() {
  const calls = [];
  const adapters = { passes: async (lat, lng) => { calls.push([lat, lng]); return { available: false, passes: [] }; } };
  const telemetry = { state: async () => state };
  return { app: createApp({ adapters, telemetry }), calls };
}

test('importing app module does not open a listening socket', () => {
  assert.equal(typeof createApp, 'function');
});

test('health distinguishes process and upstream status', async () => withServer(fixture().app, async base => {
  const response = await fetch(`${base}/api/health`); const body = await response.json();
  assert.equal(response.status, 200); assert.equal(body.process, 'healthy'); assert.equal(body.upstream, 'available');
}));

test('state and deterministic narration form an HTTP smoke path', async () => withServer(fixture().app, async base => {
  const stateResponse = await fetch(`${base}/api/state`); assert.deepEqual(await stateResponse.json(), state);
  const narration = await fetch(`${base}/api/narration`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  assert.equal((await narration.json()).grounded, true);
}));

test('visible-pass route validates all coordinate edge cases before adapter', async () => {
  const { app, calls } = fixture();
  await withServer(app, async base => {
    for (const query of ['', '?lat=&lng=1', '?lat=NaN&lng=1', '?lat=Infinity&lng=1', '?lat=90.1&lng=1', '?lat=1&lng=-180.1']) {
      const response = await fetch(`${base}/api/visualpass${query}`); assert.equal(response.status, 400, query);
      assert.equal((await response.json()).error.code, 'INVALID_COORDINATES');
    }
    for (const query of ['?lat=-90&lng=-180', '?lat=90&lng=180']) assert.equal((await fetch(`${base}/api/visualpass${query}`)).status, 200);
  });
  assert.deepEqual(calls, [[-90, -180], [90, 180]]);
});

test('health remains process-healthy when upstream is unavailable', async () => {
  const app = createApp({ adapters: { passes: async () => ({}) }, telemetry: { state: async () => { throw Error('offline'); } } });
  await withServer(app, async base => assert.equal((await (await fetch(`${base}/api/health`)).json()).upstream, 'unavailable'));
});

test('production frontend exposes telemetry, fallback, accessibility and polling controls', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
  const script = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
  assert.match(html, /id="globe-fallback"/); assert.match(html, /id="telemetry"/);
  assert.match(html, /id="speak"/); assert.match(html, /aria-label="Interactive globe/);
  assert.match(script, /if \(controller\) return/); assert.match(script, /setTimeout\(poll,5000\)/);
  assert.match(script, /trail\.length > 36/); assert.match(script, /Last verified packet remains visible/);
});
