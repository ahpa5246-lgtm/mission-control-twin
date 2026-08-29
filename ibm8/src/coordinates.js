function coordinate(value, name, min, max) {
  if (value === undefined || value === null || value === '') return { error: `${name} is required` };
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return { error: `${name} must be a finite number` };
  if (parsed < min || parsed > max) return { error: `${name} must be between ${min} and ${max}` };
  return { value: parsed };
}

function validateCoordinates(lat, lng) {
  const latitude = coordinate(lat, 'lat', -90, 90);
  const longitude = coordinate(lng, 'lng', -180, 180);
  const errors = [latitude.error, longitude.error].filter(Boolean);
  return errors.length ? { valid: false, errors } : { valid: true, latitude: latitude.value, longitude: longitude.value };
}

module.exports = { validateCoordinates };
