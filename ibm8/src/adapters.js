const { request } = require('./http');
const { parseTle } = require('./orbit');
const { BoundedTtlCache } = require('./cache');
const fs = require('node:fs');
const path = require('node:path');

const CELESTRAK = 'https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE';
const CREW = 'https://corquaid.github.io/international-space-station-APIs/JSON/people-in-space.json';

function createAdapters({ requestFn = request, env = process.env, now = Date.now } = {}) {
  const passCache = new BoundedTtlCache({ ttlMs: 5 * 60 * 1000, maxEntries: 100, now });
  return {
    async tle() {
      try { return parseTle(await requestFn(CELESTRAK, { responseType: 'text', timeoutMs: 5000 })); }
      catch {
        const snapshot = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'iss-2024-001.tle'), 'utf8');
        return parseTle(snapshot, new Date('2024-01-01T12:00:00Z'), 'bundled-celestrak-snapshot');
      }
    },
    async crew() {
      const data = await requestFn(CREW, { timeoutMs: 4000 });
      if (!Array.isArray(data.people)) throw new Error('Invalid crew response');
      return data.people.filter(person => person.craft === 'ISS' && typeof person.name === 'string')
        .map(person => ({ name: person.name, craft: 'ISS' }));
    },
    async location(latitude, longitude) {
      const url = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
      url.search = new URLSearchParams({ latitude, longitude, localityLanguage: 'en' });
      const data = await requestFn(url, { timeoutMs: 3500 });
      if (!data || typeof data !== 'object') throw new Error('Invalid location response');
      const name = typeof data.countryName === 'string' && data.countryName.trim()
        ? data.countryName.trim() : typeof data.locality === 'string' && data.locality.trim() ? data.locality.trim() : null;
      if (!name) return null;
      return { name, type: data.countryName ? 'country' : /ocean|sea/i.test(name) ? 'ocean' : 'region' };
    },
    async passes(latitude, longitude) {
      if (!env.N2YO_API_KEY) return { available: false, reason: 'N2YO_API_KEY is not configured', passes: [] };
      const cacheKey = `${latitude},${longitude}`;
      const cached = passCache.get(cacheKey);
      if (cached) return cached;
      const url = `https://api.n2yo.com/rest/v1/satellite/visualpasses/25544/${latitude}/${longitude}/0/10/300/&apiKey=${encodeURIComponent(env.N2YO_API_KEY)}`;
      try {
        const data = await requestFn(url, { timeoutMs: 5000 });
        if (!Array.isArray(data.passes)) throw new Error('Invalid visible-pass response');
        return passCache.set(cacheKey, { available: true, stale: false,
          passes: data.passes.filter(pass => Number.isFinite(pass.startUTC) && pass.startUTC * 1000 > now()) });
      } catch (error) {
        const stale = passCache.get(cacheKey, { allowStale: true });
        if (stale) return { ...stale, stale: true };
        throw error;
      }
    }
  };
}

module.exports = { createAdapters, CELESTRAK, CREW };
