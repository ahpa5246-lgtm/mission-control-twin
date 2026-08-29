const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createGlobe, appendBoundedTrail, localAsset, MAX_TRAIL } = require('../client/globe');

test('ISS trail keeps only the newest bounded telemetry points', () => {
  let trail = [];
  for (let index = 0; index < MAX_TRAIL + 9; index++) trail = appendBoundedTrail(trail, { lat: index, lng: -index });
  assert.equal(trail.length, MAX_TRAIL);
  assert.deepEqual(trail[0], { lat: 9, lng: -9 });
  assert.deepEqual(trail.at(-1), { lat: 44, lng: -44 });
});

test('globe accepts only local runtime texture paths', () => {
  assert.equal(localAsset('/assets/earth-texture.svg'), true);
  assert.equal(localAsset('https://example.com/earth.jpg'), false);
  assert.equal(localAsset('//cdn.example.com/earth.jpg'), false);
});

test('WebGL initialization has an explicit failure seam', () => {
  assert.throws(() => createGlobe({ canvas: { getContext: () => null } }), /WebGL is unavailable/);
});

test('built page preserves accessible fallback and has no runtime CDN dependency', () => {
  const root = path.join(__dirname, '..', 'client');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const globe = fs.readFileSync(path.join(root, 'globe.js'), 'utf8');
  assert.match(html, /role="status">3D Earth unavailable/);
  assert.match(html, /aria-label="Interactive globe/);
  assert.match(html, /src="\/globe\.js"/);
  assert.doesNotMatch(`${html}\n${globe}`, /https?:\/\//);
  assert.equal(fs.existsSync(path.join(root, 'assets', 'earth-texture.svg')), true);
});

test('cinematic assets, controls, motion suspension and cleanup are local', () => {
  const root = path.join(__dirname, '..', 'client');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const globe = fs.readFileSync(path.join(root, 'globe.js'), 'utf8');
  for (const asset of ['earth-fallback.svg', 'earth-clouds.svg', 'ATTRIBUTION.md']) assert.equal(fs.existsSync(path.join(root, 'assets', asset)), true);
  assert.match(html, /id="follow-iss"/);
  assert.match(html, /id="reset-view"/);
  assert.match(html, /id="power-mode"/);
  assert.match(globe, /document\.hidden/);
  assert.match(globe, /reducedMotion/);
  assert.match(globe, /deleteTexture/);
  assert.match(globe, /removeEventListener\('pointerdown'/);
  assert.doesNotMatch(`${html}\n${globe}`, /<script[^>]+https?:\/\//);
});

test('page retains responsive semantic landmarks and honest status regions', () => {
  const root = path.join(__dirname, '..', 'client');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  for (const landmark of ['header', 'main', 'footer']) assert.match(html, new RegExp(`<${landmark}`));
  assert.match(html, /role="status"/);
  assert.match(html, /dir="auto"/);
  assert.match(css, /@media\(max-width:600px\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});
