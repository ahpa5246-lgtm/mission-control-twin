const { BoundedTtlCache } = require('./cache');
const { calculateState } = require('./orbit');

function createTelemetryService({ adapters, now = () => new Date(), cache } = {}) {
  const stateCache = cache || new BoundedTtlCache({ ttlMs: 15000, maxEntries: 1, now: () => now().getTime() });
  let tle;
  let tleLoadedAt = 0;

  async function getTle() {
    const current = now().getTime();
    if (!tle || current - tleLoadedAt >= 6 * 60 * 60 * 1000) {
      tle = await adapters.tle();
      tleLoadedAt = current;
    }
    return tle;
  }

  async function state({ force = false } = {}) {
    if (!force) {
      const hit = stateCache.get('latest');
      if (hit) return hit;
    }
    try {
      const currentDate = now();
      const currentTle = await getTle();
      // Never extrapolate the old offline fixture into a misleading current position.
      const calculationDate = currentTle.source === 'bundled-celestrak-snapshot' ? new Date(currentTle.epoch) : currentDate;
      const core = calculateState(currentTle, calculationDate);
      const partialReasons = [];
      const [crewResult, locationResult] = await Promise.allSettled([
        adapters.crew(), adapters.location(core.latitude, core.longitude)
      ]);
      const crew = crewResult.status === 'fulfilled' ? crewResult.value : null;
      const location = locationResult.status === 'fulfilled' ? locationResult.value : null;
      if (crewResult.status === 'rejected') partialReasons.push('crew-unavailable');
      if (locationResult.status === 'rejected' || !location) partialReasons.push('location-unavailable');
      const epochAgeHours = (currentDate - new Date(currentTle.epoch)) / 3600000;
      if (epochAgeHours > 72) partialReasons.push('tle-stale');
      const value = {
        ...core, location, astronauts: crew, astronautCount: crew ? crew.length : null,
        meta: { source: `${currentTle.source || 'celestrak-live'} TLE propagated with satellite.js`, tleEpoch: currentTle.epoch,
          fetchedAt: currentTle.fetchedAt, stale: currentTle.source === 'bundled-celestrak-snapshot',
          degraded: partialReasons.length > 0, partialReasons }
      };
      stateCache.set('latest', value, 15000);
      return value;
    } catch (error) {
      const previous = stateCache.get('latest', { allowStale: true });
      if (previous) return { ...previous, meta: { ...previous.meta, stale: true, degraded: true,
        partialReasons: [...new Set([...previous.meta.partialReasons, 'telemetry-refresh-failed'])] } };
      throw error;
    }
  }

  return { state, cache: stateCache };
}

module.exports = { createTelemetryService };
