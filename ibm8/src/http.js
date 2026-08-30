class UpstreamError extends Error {
  constructor(code, message, status) {
    super(message);
    this.name = 'UpstreamError';
    this.code = code;
    this.status = status;
  }
}

async function request(url, { timeoutMs = 5000, responseType = 'json', fetchImpl = global.fetch, headers } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response;
    try { response = await fetchImpl(url, { signal: controller.signal, headers }); }
    catch (error) {
      throw new UpstreamError(error.name === 'AbortError' ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_NETWORK', 'Upstream request failed');
    }
    if (!response.ok) {
      throw new UpstreamError(response.status === 429 ? 'UPSTREAM_RATE_LIMITED' : 'UPSTREAM_HTTP', 'Upstream returned an error', response.status);
    }
    try { return responseType === 'text' ? await response.text() : await response.json(); }
    catch { throw new UpstreamError('UPSTREAM_MALFORMED', 'Upstream response was malformed'); }
  } finally { clearTimeout(timer); }
}

module.exports = { request, UpstreamError };
