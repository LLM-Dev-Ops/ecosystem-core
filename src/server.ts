import http from 'http';
import { handleEventsPost } from './handlers';

const PORT = parseInt(process.env.PORT || '8080', 10);

const server = http.createServer((req, res) => {
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'ecosystem-core',
      version: process.env.npm_package_version || 'unknown'
    }));
    return;
  }

  if (req.url === '/v1/events' && req.method === 'POST') {
    handleEventsPost(req, res);
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok' }));
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
