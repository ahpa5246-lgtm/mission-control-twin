const { createApp } = require('./src/app');

const port = Number(process.env.PORT) || 3000;
const server = createApp().listen(port, () => console.log(`Mission Control Twin listening on http://localhost:${port}`));

function shutdown() { server.close(() => process.exit(0)); }
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
