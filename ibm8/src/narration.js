const { BoundedTtlCache } = require('./cache');

function format(value, digits = 1) { return Number.isFinite(value) ? value.toFixed(digits) : null; }

function templateNarration(state) {
  const parts = ['International Space Station telemetry update.'];
  const lat = format(state.latitude, 2), lng = format(state.longitude, 2);
  if (lat && lng) parts.push(`Position: ${lat} degrees latitude and ${lng} degrees longitude.`);
  if (format(state.altitudeKm)) parts.push(`Altitude: ${format(state.altitudeKm)} kilometres.`);
  if (format(state.speedKmh, 0)) parts.push(`Inertial speed: ${format(state.speedKmh, 0)} kilometres per hour.`);
  if (state.location?.name) parts.push(`The point beneath the station is reported as ${state.location.name}.`);
  if (state.astronautCount !== null && state.astronautCount !== undefined) parts.push(`${state.astronautCount} ISS crew members are listed by the crew source.`);
  if (state.illumination === 'daylight-below') parts.push('The point beneath the station is in daylight.');
  if (state.illumination === 'night-below') parts.push('The point beneath the station is in night.');
  if (state.meta?.stale) parts.push(`This is last known telemetry from ${state.timestamp}.`);
  else if (state.meta?.degraded) parts.push('Some optional information is currently unavailable.');
  return parts.join(' ');
}

function createNarrationService({ now = Date.now } = {}) {
  const cache = new BoundedTtlCache({ ttlMs: 45000, maxEntries: 1, now });
  return {
    narrate(state) {
      const hit = cache.get('narration');
      if (hit && hit.telemetryTimestamp === state.timestamp) return hit;
      const result = { text: templateNarration(state), provider: 'deterministic-template', grounded: true,
        generatedAt: new Date(now()).toISOString(), telemetryTimestamp: state.timestamp };
      cache.set('narration', result);
      return result;
    }
  };
}

module.exports = { templateNarration, createNarrationService };
