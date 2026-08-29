class BoundedTtlCache {
  constructor({ ttlMs, maxEntries, now = Date.now }) {
    if (!(ttlMs > 0) || !(maxEntries > 0)) throw new TypeError('Positive ttlMs and maxEntries are required');
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.now = now;
    this.entries = new Map();
  }

  set(key, value, ttlMs = this.ttlMs) {
    this.entries.delete(key);
    this.entries.set(key, { value, expiresAt: this.now() + ttlMs });
    while (this.entries.size > this.maxEntries) this.entries.delete(this.entries.keys().next().value);
    return value;
  }

  get(key, { allowStale = false } = {}) {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.now() && !allowStale) return undefined;
    return entry.value;
  }

  hasFresh(key) { return this.get(key) !== undefined; }
  get size() { return this.entries.size; }
}

module.exports = { BoundedTtlCache };
