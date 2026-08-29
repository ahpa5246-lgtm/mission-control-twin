const express = require('express');
const path = require('path');
const { createAdapters } = require('./adapters');
const { createTelemetryService } = require('./telemetry');
const { createNarrationService } = require('./narration');
const { validateCoordinates } = require('./coordinates');

function apiError(res, status, code, message, details) {
  return res.status(status).json({ error: { code, message, ...(details ? { details } : {}) } });
}

function createApp(options = {}) {
  const app = express();
  const adapters = options.adapters || createAdapters(options);
  const telemetry = options.telemetry || createTelemetryService({ adapters });
  const narration = options.narration || createNarrationService();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));

  app.get('/api/health', async (_req, res) => {
    let upstream = 'available';
    try { await telemetry.state(); } catch { upstream = 'unavailable'; }
    res.json({ status: 'ok', process: 'healthy', upstream, timestamp: new Date().toISOString() });
  });
  app.get('/api/state', async (_req, res, next) => { try { res.json(await telemetry.state()); } catch (error) { next(error); } });
  app.get('/api/visualpass', async (req, res, next) => {
    const validation = validateCoordinates(req.query.lat, req.query.lng);
    if (!validation.valid) return apiError(res, 400, 'INVALID_COORDINATES', 'Valid observer coordinates are required', validation.errors);
    try { res.json(await adapters.passes(validation.latitude, validation.longitude)); } catch (error) { next(error); }
  });
  app.post('/api/narration', async (req, res, next) => {
    try {
      const state = req.body?.telemetry || await telemetry.state();
      res.json(narration.narrate(state));
    } catch (error) { next(error); }
  });

  const publicDir = path.join(__dirname, '..', 'public');
  app.use(express.static(publicDir));
  app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));
  app.use('/api', (_req, res) => apiError(res, 404, 'NOT_FOUND', 'API route not found'));
  app.use((error, _req, res, _next) => {
    console.error('Request failed:', error.code || error.message);
    apiError(res, 503, 'SERVICE_UNAVAILABLE', 'The requested data is temporarily unavailable');
  });
  return app;
}

module.exports = { createApp };
