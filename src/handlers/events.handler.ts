/**
 * Events Handler for LLM Ecosystem Core
 * Accepts events and forwards them to downstream services (fire-and-forget)
 */

import http from 'http';
import { URL } from 'url';

/**
 * Configuration for downstream service endpoints
 */
export interface EventsConfig {
  marketplaceEndpoint: string;
  analyticsEndpoint: string;
  benchmarkEndpoint: string;
}

/**
 * Get events configuration from environment variables
 */
export function getEventsConfig(): EventsConfig {
  return {
    marketplaceEndpoint:
      process.env.MARKETPLACE_ENDPOINT || 'http://localhost:3001',
    analyticsEndpoint:
      process.env.ANALYTICS_ENDPOINT || 'http://localhost:3002',
    benchmarkEndpoint:
      process.env.BENCHMARK_ENDPOINT || 'http://localhost:3003',
  };
}

/**
 * Forward event payload to a single downstream endpoint.
 * Resolves on completion, rejects on error.
 */
function postToEndpoint(baseUrl: string, body: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = new URL('/api/v1/events', baseUrl);
    const options: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = http.request(options, (res) => {
      // Consume response to free socket
      res.resume();
      resolve();
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(body);
    req.end();
  });
}

/**
 * Forward event body to all downstream service endpoints.
 * Fire-and-forget: logs errors but does not propagate them.
 */
export function forwardEvents(body: string, endpoints: string[]): void {
  Promise.all(
    endpoints.map((endpoint) =>
      postToEndpoint(endpoint, body).catch((err) => {
        console.error(
          `[events] Failed to forward to ${endpoint}: ${err.message}`
        );
      })
    )
  ).catch((err) => {
    console.error(`[events] Unexpected forwarding error: ${err.message}`);
  });
}

/**
 * Handle POST /v1/events
 * Reads body, validates JSON, responds 202, then forwards to downstream services.
 */
export function handleEventsPost(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  config?: EventsConfig
): void {
  const chunks: Buffer[] = [];

  req.on('data', (chunk: Buffer) => {
    chunks.push(chunk);
  });

  req.on('end', () => {
    const body = Buffer.concat(chunks).toString('utf-8');

    // Validate non-empty JSON
    if (!body) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Request body is required' }));
      return;
    }

    try {
      JSON.parse(body);
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
      return;
    }

    // Respond immediately with 202 Accepted
    res.writeHead(202, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'accepted' }));

    // Fire-and-forget forwarding to downstream services
    const cfg = config || getEventsConfig();
    const endpoints = [
      cfg.marketplaceEndpoint,
      cfg.analyticsEndpoint,
      cfg.benchmarkEndpoint,
    ];

    forwardEvents(body, endpoints);
  });
}
