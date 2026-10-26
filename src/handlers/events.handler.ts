/**
 * Events Handler for LLM Ecosystem Core
 * Accepts events and forwards them to downstream services (fire-and-forget)
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';
import { readJsonObject, sendJson } from './request-body';

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
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      reject(new Error('Unsupported endpoint protocol'));
      return;
    }

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

    const transport = url.protocol === 'https:' ? https : http;
    const req = transport.request(options, (res) => {
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
      postToEndpoint(endpoint, body).catch(() => {
        console.error('[events] Failed to forward to a configured endpoint');
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
  readJsonObject(req).then((result) => {
    if (!result.ok) {
      sendJson(res, result.status, { error: result.error });
      return;
    }

    sendJson(res, 202, { status: 'accepted' });

    // Fire-and-forget forwarding to downstream services
    const cfg = config || getEventsConfig();
    const endpoints = [
      cfg.marketplaceEndpoint,
      cfg.analyticsEndpoint,
      cfg.benchmarkEndpoint,
    ];

    forwardEvents(result.raw, endpoints);
  });
}
