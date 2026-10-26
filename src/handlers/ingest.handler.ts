/**
 * Ingest Handlers for ecosystem and marketplace event endpoints.
 * Leaf handlers — no downstream fanout.
 */

import http from 'http';
import { readJsonObject, sendJson } from './request-body';

interface IngestEvent extends Record<string, unknown> {
  source: string;
  event_type: string;
  execution_id: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

const SAFE_TEXT = /^[^\u0000-\u001f\u007f]+$/;

function isBoundedText(value: unknown, maxLength: number): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= maxLength &&
    SAFE_TEXT.test(value)
  );
}

function isIngestEvent(value: Record<string, unknown>): value is unknown & IngestEvent {
  return (
    isBoundedText(value.source, 128) &&
    isBoundedText(value.event_type, 128) &&
    isBoundedText(value.execution_id, 256) &&
    isBoundedText(value.timestamp, 64) &&
    Number.isFinite(Date.parse(value.timestamp)) &&
    typeof value.payload === 'object' &&
    value.payload !== null &&
    !Array.isArray(value.payload)
  );
}

function handleIngest(
  label: string,
  req: http.IncomingMessage,
  res: http.ServerResponse
): void {
  readJsonObject(req).then((result) => {
    if (!result.ok) {
      sendJson(res, result.status, { error: result.error });
      return;
    }

    if (!isIngestEvent(result.value)) {
      sendJson(res, 400, { error: 'Invalid event envelope' });
      return;
    }

    const event = result.value;
    console.log(`[${label}] valid event accepted`);

    sendJson(res, 202, {
      status: 'accepted',
      execution_id: event.execution_id,
    });
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
