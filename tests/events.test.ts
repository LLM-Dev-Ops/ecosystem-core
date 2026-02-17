/**
 * Events Handler Tests
 * Tests verify the POST /v1/events endpoint behavior:
 * - 202 Accepted for valid JSON
 * - 400 for empty or invalid body
 * - Fan-out forwarding to downstream endpoints
 */

import http from 'http';
import { handleEventsPost, forwardEvents } from '../src/handlers/events.handler';

// Simple test framework (matches project convention)
let testsPassed = 0;
let testsFailed = 0;

function test(name: string, fn: () => void | Promise<void>) {
  return async () => {
    try {
      await fn();
      testsPassed++;
      console.log(`✓ ${name}`);
    } catch (error) {
      testsFailed++;
      console.error(`✗ ${name}`);
      console.error(`  Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
}

function assertEqual(actual: unknown, expected: unknown, message?: string) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(
      message || `Expected ${expectedStr} but got ${actualStr}`
    );
  }
}

function assertTruthy(value: unknown, message?: string) {
  if (!value) {
    throw new Error(message || `Expected truthy value but got ${value}`);
  }
}

/**
 * Create a mock IncomingMessage that emits the given body
 */
function createMockRequest(body: string, method = 'POST', url = '/v1/events'): http.IncomingMessage {
  const { PassThrough } = require('stream');
  const stream = new PassThrough();
  stream.method = method;
  stream.url = url;
  stream.headers = { 'content-type': 'application/json' };

  // Push body data asynchronously
  process.nextTick(() => {
    if (body) {
      stream.write(Buffer.from(body));
    }
    stream.end();
  });

  return stream as unknown as http.IncomingMessage;
}

/**
 * Create a mock ServerResponse that captures writeHead and end calls
 */
function createMockResponse(): http.ServerResponse & {
  _statusCode: number;
  _headers: Record<string, string>;
  _body: string;
  _ended: boolean;
} {
  const res: any = {
    _statusCode: 0,
    _headers: {},
    _body: '',
    _ended: false,
    writeHead(code: number, headers?: Record<string, string>) {
      res._statusCode = code;
      if (headers) {
        Object.assign(res._headers, headers);
      }
    },
    end(body?: string) {
      if (body) {
        res._body = body;
      }
      res._ended = true;
    },
  };
  return res;
}

/**
 * Wait for response to be ended
 */
function waitForResponse(res: { _ended: boolean }): Promise<void> {
  return new Promise((resolve) => {
    const check = () => {
      if (res._ended) {
        resolve();
      } else {
        setTimeout(check, 5);
      }
    };
    check();
  });
}

// --- Tests ---

async function testHandlerReturns202ForValidJson() {
  const req = createMockRequest('{"type":"test.event","data":{}}');
  const res = createMockResponse();
  const config = {
    marketplaceEndpoint: 'http://localhost:19991',
    analyticsEndpoint: 'http://localhost:19992',
    benchmarkEndpoint: 'http://localhost:19993',
  };

  handleEventsPost(req, res, config);
  await waitForResponse(res);

  assertEqual(res._statusCode, 202, 'Should return 202 Accepted');
  const body = JSON.parse(res._body);
  assertEqual(body.status, 'accepted', 'Body should have status accepted');
}

async function testHandlerReturns400ForEmptyBody() {
  const req = createMockRequest('');
  const res = createMockResponse();

  handleEventsPost(req, res);
  await waitForResponse(res);

  assertEqual(res._statusCode, 400, 'Should return 400 for empty body');
  const body = JSON.parse(res._body);
  assertTruthy(body.error, 'Should have error message');
}

async function testHandlerReturns400ForInvalidJson() {
  const req = createMockRequest('not valid json {{{');
  const res = createMockResponse();

  handleEventsPost(req, res);
  await waitForResponse(res);

  assertEqual(res._statusCode, 400, 'Should return 400 for invalid JSON');
  const body = JSON.parse(res._body);
  assertEqual(body.error, 'Invalid JSON', 'Should indicate invalid JSON');
}

async function testHandlerSetsJsonContentType() {
  const req = createMockRequest('{"type":"test"}');
  const res = createMockResponse();
  const config = {
    marketplaceEndpoint: 'http://localhost:19991',
    analyticsEndpoint: 'http://localhost:19992',
    benchmarkEndpoint: 'http://localhost:19993',
  };

  handleEventsPost(req, res, config);
  await waitForResponse(res);

  assertEqual(
    res._headers['Content-Type'],
    'application/json',
    'Should set Content-Type to application/json'
  );
}

async function testForwardEventsPostsToAllEndpoints() {
  // Start 3 temporary HTTP servers to receive forwarded events
  const received: { port: number; body: string }[] = [];
  const servers: http.Server[] = [];

  const createReceiver = (port: number): Promise<http.Server> =>
    new Promise((resolve) => {
      const srv = http.createServer((req, res) => {
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => {
          received.push({ port, body: Buffer.concat(chunks).toString() });
          res.writeHead(200);
          res.end();
        });
      });
      srv.listen(port, () => resolve(srv));
      servers.push(srv);
    });

  try {
    await Promise.all([
      createReceiver(19994),
      createReceiver(19995),
      createReceiver(19996),
    ]);

    const payload = JSON.stringify({ type: 'test.forward', value: 42 });

    // forwardEvents is fire-and-forget, but we can wait a bit for completion
    forwardEvents(payload, [
      'http://localhost:19994',
      'http://localhost:19995',
      'http://localhost:19996',
    ]);

    // Wait for all requests to arrive
    await new Promise<void>((resolve) => {
      const check = () => {
        if (received.length >= 3) {
          resolve();
        } else {
          setTimeout(check, 20);
        }
      };
      check();
    });

    assertEqual(received.length, 3, 'Should forward to all 3 endpoints');

    for (const entry of received) {
      assertEqual(entry.body, payload, `Endpoint on port ${entry.port} should receive the payload`);
    }
  } finally {
    // Clean up servers
    for (const srv of servers) {
      srv.close();
    }
  }
}

async function testForwardEventsHandlesConnectionErrors() {
  // Forward to non-existent endpoints - should not throw
  const payload = JSON.stringify({ type: 'test.error' });

  // This should not throw even though endpoints don't exist
  forwardEvents(payload, [
    'http://localhost:19997',
    'http://localhost:19998',
  ]);

  // Wait a bit to ensure the fire-and-forget completes without crashing
  await new Promise((resolve) => setTimeout(resolve, 200));

  // If we get here without throwing, the test passes
  assertTruthy(true, 'forwardEvents should handle connection errors gracefully');
}

// --- Test runner ---

export async function runTests() {
  console.log('\n=== Events Handler Tests ===\n');

  testsPassed = 0;
  testsFailed = 0;

  const tests = [
    test('handleEventsPost returns 202 for valid JSON', testHandlerReturns202ForValidJson),
    test('handleEventsPost returns 400 for empty body', testHandlerReturns400ForEmptyBody),
    test('handleEventsPost returns 400 for invalid JSON', testHandlerReturns400ForInvalidJson),
    test('handleEventsPost sets JSON content type', testHandlerSetsJsonContentType),
    test('forwardEvents POSTs to all downstream endpoints', testForwardEventsPostsToAllEndpoints),
    test('forwardEvents handles connection errors gracefully', testForwardEventsHandlesConnectionErrors),
  ];

  for (const testFn of tests) {
    await testFn();
  }

  console.log(`\nTests passed: ${testsPassed}`);
  console.log(`Tests failed: ${testsFailed}\n`);

  return { passed: testsPassed, failed: testsFailed };
}
