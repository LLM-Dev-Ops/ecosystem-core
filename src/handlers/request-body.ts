import http from 'http';

export const MAX_JSON_BODY_BYTES = 64 * 1024;

export type JsonBodyResult =
  | { ok: true; raw: string; value: Record<string, unknown> }
  | { ok: false; status: 400 | 413 | 415; error: string };

export function sendJson(
  res: http.ServerResponse,
  status: number,
  value: Record<string, unknown>
): void {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(value));
}

function isJsonContentType(value: string | undefined): boolean {
  if (!value) return false;
  const mediaType = value.split(';', 1)[0].trim().toLowerCase();
  return mediaType === 'application/json' || mediaType.endsWith('+json');
}

export function readJsonObject(
  req: http.IncomingMessage,
  limit = MAX_JSON_BODY_BYTES
): Promise<JsonBodyResult> {
  if (!isJsonContentType(req.headers['content-type'])) {
    return Promise.resolve({
      ok: false,
      status: 415,
      error: 'Content-Type must be application/json',
    });
  }

  const declaredLength = req.headers['content-length'];
  if (declaredLength !== undefined) {
    const length = Number(declaredLength);
    if (!Number.isSafeInteger(length) || length < 0) {
      return Promise.resolve({ ok: false, status: 400, error: 'Invalid Content-Length' });
    }
    if (length > limit) {
      return Promise.resolve({ ok: false, status: 413, error: 'Request body is too large' });
    }
  }

  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let received = 0;
    let settled = false;

    const finish = (result: JsonBodyResult): void => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    req.on('data', (chunk: Buffer | string) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      received += buffer.length;
      if (received > limit) {
        finish({ ok: false, status: 413, error: 'Request body is too large' });
        return;
      }
      chunks.push(buffer);
    });

    req.on('error', () => {
      finish({ ok: false, status: 400, error: 'Unable to read request body' });
    });

    req.on('end', () => {
      if (settled) return;
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) {
        finish({ ok: false, status: 400, error: 'Request body is required' });
        return;
      }

      try {
        const value: unknown = JSON.parse(raw);
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          finish({ ok: false, status: 400, error: 'JSON body must be an object' });
          return;
        }
        finish({ ok: true, raw, value: value as Record<string, unknown> });
      } catch {
        finish({ ok: false, status: 400, error: 'Invalid JSON' });
      }
    });
  });
}
