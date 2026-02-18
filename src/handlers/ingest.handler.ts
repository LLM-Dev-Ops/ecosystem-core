/**
 * Ingest Handlers for ecosystem and marketplace event endpoints.
 * Leaf handlers — no downstream fanout.
 */

import http from 'http';

interface IngestEvent {
  source: string;
  event_type: string;
  execution_id: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

function handleIngest(
  label: string,
  req: http.IncomingMessage,
  res: http.ServerResponse
): void {
  readBody(req).then((body) => {
    if (!body) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Request body is required' }));
      return;
    }

    let event: IngestEvent;
    try {
      event = JSON.parse(body);
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
      return;
    }

    console.log(
      `[${label}] event received source=${event.source} execution_id=${event.execution_id}`
    );

    res.writeHead(202, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'accepted',
        execution_id: event.execution_id,
      })
    );
  });
}

export function handleEcosystemEvent(
  req: http.IncomingMessage,
  res: http.ServerResponse
): void {
  handleIngest('ecosystem', req, res);
}

export function handleMarketplaceEvent(
  req: http.IncomingMessage,
  res: http.ServerResponse
): void {
  handleIngest('marketplace', req, res);
}
