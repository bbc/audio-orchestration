import http from 'http';
import express from 'express';

import initSyncServices from './sync-services';

// Serve static files from dist/ on port 8000
const app = express();
app.use(express.static('dist/'));

const server = http.createServer(app);

const host = '0.0.0.0';
const port = 8000;

server.listen(port, host, () => {
  console.log(`HTTP server listening on ${host}:${port}`);
});

// Start the synchronisation services if required.
if (!process.argv.includes('--external')) {
  initSyncServices();
} else {
  console.log('Not starting sync services. Run an external TS and WC server. Remove --external flag to use built-in servers.');
}
