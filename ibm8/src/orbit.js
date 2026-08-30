const satellite = require('satellite.js');
const SunCalc = require('suncalc');

function parseTle(text, fetchedAt = new Date(), source = 'celestrak-live') {
  const lines = String(text).trim().split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const line1Index = lines.findIndex(line => line.startsWith('1 '));
  const line1 = lines[line1Index];
  const line2 = lines[line1Index + 1];
  if (!line1 || !line2?.startsWith('2 ') || line1.slice(2, 7) !== line2.slice(2, 7)) throw new Error('Invalid TLE response');
  const year = Number(line1.slice(18, 20));
  const day = Number(line1.slice(20, 32));
  if (!Number.isFinite(day)) throw new Error('Invalid TLE epoch');
  const fullYear = year >= 57 ? 1900 + year : 2000 + year;
  const epoch = new Date(Date.UTC(fullYear, 0, 1) + (day - 1) * 86400000);
  return { line1, line2, epoch: epoch.toISOString(), fetchedAt: new Date(fetchedAt).toISOString(), source };
}

function calculateState(tle, date = new Date()) {
  const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
  const result = satellite.propagate(satrec, date);
  if (!result.position || !result.velocity) throw new Error('TLE propagation failed');
  const geo = satellite.eciToGeodetic(result.position, satellite.gstime(date));
  const latitude = satellite.degreesLat(geo.latitude);
  const longitude = satellite.degreesLong(geo.longitude);
  const velocity = Math.hypot(result.velocity.x, result.velocity.y, result.velocity.z) * 3600;
  const solarAltitude = SunCalc.getPosition(date, latitude, longitude).altitude;
  return {
    timestamp: date.toISOString(), latitude, longitude, altitudeKm: geo.height,
    speedKmh: velocity, illumination: solarAltitude > 0 ? 'daylight-below' : 'night-below'
  };
}

module.exports = { parseTle, calculateState };
