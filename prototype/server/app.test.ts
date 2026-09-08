import assert from 'node:assert/strict';
import test from 'node:test';
import { createApp } from './app';
import { MockLocalExtractionAdapter } from '../src/extraction';
import { RULESET_VERSION } from '../src/evaluation';

async function withServer<T>(callback: (baseUrl: string) => Promise<T>, app = createApp()): Promise<T> {
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('test server did not expose a TCP address');
  }
  const loginResponse = await fetch(`http://127.0.0.1:${address.port}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'test-inspector', password: 'test-password' }),
  });
  // The test app is configured with these credentials through the process env below.
  assert.equal(loginResponse.status, 200);
  const sessionCookie = loginResponse.headers.get('set-cookie')?.split(';', 1)[0];
  assert.ok(sessionCookie);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (typeof input === 'string' && input.startsWith(`http://127.0.0.1:${address.port}/scans`)) headers.set('cookie', sessionCookie);
    return originalFetch(input, { ...init, headers });
  }) as typeof fetch;
  try {
    return await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    globalThis.fetch = originalFetch;
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

process.env.MAANAK_AUTH_USERNAME = 'test-inspector';
process.env.MAANAK_AUTH_PASSWORD = 'test-password';

test('creates and retrieves a scan with validated metadata', async () => {
  await withServer(async (baseUrl) => {
    const createResponse = await fetch(`${baseUrl}/scans`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        productName: 'Example commodity',
        sourceType: 'PHYSICAL_PHOTO',
        ruleVersion: 'pending-verified-ruleset',
        mode: 'DEMO_FIXTURE',
      }),
    });
    assert.equal(createResponse.status, 201);
    const scan = await createResponse.json() as { id: string; productName: string; sourceType: string; images: unknown[] };
    assert.match(scan.id, /^scan_/);
    assert.equal(scan.productName, 'Example commodity');
    assert.equal(scan.sourceType, 'PHYSICAL_PHOTO');
    assert.deepEqual(scan.images, []);

    const getResponse = await fetch(`${baseUrl}/scans/${scan.id}`);
    assert.equal(getResponse.status, 200);
    assert.equal((await getResponse.json() as { id: string }).id, scan.id);
  });
});

test('stores source image bytes and returns a structured evidence image', async () => {
  const app = createApp(undefined, new MockLocalExtractionAdapter([]));
  await withServer(async (baseUrl) => {
    const createResponse = await fetch(`${baseUrl}/scans`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ productName: 'Image test', sourceType: 'ECOMMERCE_LISTING', ruleVersion: 'pending-verified-ruleset', mode: 'DEMO_FIXTURE' }),
    });
    const scan = await createResponse.json() as { id: string };
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const uploadResponse = await fetch(`${baseUrl}/scans/${scan.id}/images`, {
      method: 'POST',
      headers: { 'content-type': 'image/png', 'x-captured-at': '2026-09-06T10:00:00.000Z' },
      body: bytes,
    });
    assert.equal(uploadResponse.status, 201);
    const payload = await uploadResponse.json() as { image: { id: string; byteSize: number; sha256: string }; scan: { images: unknown[]; observations: unknown[] } };
    assert.match(payload.image.id, /^img_/);
    assert.equal(payload.image.byteSize, 4);
    assert.match(payload.image.sha256, /^[a-f0-9]{64}$/);
    assert.equal(payload.scan.images.length, 1);
    assert.equal(payload.scan.observations.length, 0);
  }, app);
});

test('rejects invalid scan metadata and invalid image requests', async () => {
  await withServer(async (baseUrl) => {
    const invalidScanResponse = await fetch(`${baseUrl}/scans`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ productName: 'Missing source', ruleVersion: 'pending-verified-ruleset', mode: 'DEMO_FIXTURE' }),
    });
    assert.equal(invalidScanResponse.status, 400);
    assert.equal((await invalidScanResponse.json() as { error: { code: string } }).error.code, 'INVALID_REQUEST');

    const missingScanResponse = await fetch(`${baseUrl}/scans/scan_missing/images`, {
      method: 'POST',
      headers: { 'content-type': 'image/png' },
      body: new Uint8Array([1]),
    });
    assert.equal(missingScanResponse.status, 404);

    const unsupportedTypeResponse = await fetch(`${baseUrl}/scans/scan_missing/images`, {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: 'not an image',
    });
    assert.equal(unsupportedTypeResponse.status, 404);
  });
});

test('rejects unsupported image content type for an existing scan', async () => {
  await withServer(async (baseUrl) => {
    const createResponse = await fetch(`${baseUrl}/scans`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ productName: 'Type test', sourceType: 'PHYSICAL_PHOTO', ruleVersion: 'pending-verified-ruleset', mode: 'DEMO_FIXTURE' }),
    });
    const scan = await createResponse.json() as { id: string };
    const response = await fetch(`${baseUrl}/scans/${scan.id}/images`, {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: 'not an image',
    });
    assert.equal(response.status, 415);
    assert.equal((await response.json() as { error: { code: string } }).error.code, 'UNSUPPORTED_IMAGE_TYPE');
  });
});

test('persists adapter observations linked to the uploaded source image', async () => {
  const app = createApp(undefined, new MockLocalExtractionAdapter([{
    id: 'obs-mrp', field: 'mrp', value: 120, unit: 'INR', confidence: 0.96,
    status: 'OBSERVED', boundingBox: { x: 0.1, y: 0.2, width: 0.3, height: 0.1 },
    observedAt: '2026-09-06T10:00:00.000Z',
  }]));
  await withServer(async (baseUrl) => {
    const createResponse = await fetch(`${baseUrl}/scans`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ productName: 'Extraction test', sourceType: 'PHYSICAL_PHOTO', ruleVersion: 'pending-verified-ruleset', mode: 'DEMO_FIXTURE' }),
    });
    const scan = await createResponse.json() as { id: string };
    const uploadResponse = await fetch(`${baseUrl}/scans/${scan.id}/images`, {
      method: 'POST', headers: { 'content-type': 'image/jpeg' }, body: new Uint8Array([9, 8, 7]),
    });
    assert.equal(uploadResponse.status, 201);
    const result = await uploadResponse.json() as { scan: { images: { id: string }[]; observations: { evidence: { imageId: string; sourceImage: { storageKey: string } } | null; confidence: number }[] } };
    assert.equal(result.scan.observations.length, 1);
    assert.equal(result.scan.observations[0].evidence?.imageId, result.scan.images[0].id);
    assert.match(result.scan.observations[0].evidence?.sourceImage.storageKey || '', new RegExp(`^scans/${scan.id}/images/`));
    assert.equal(result.scan.observations[0].confidence, 0.96);
  }, app);
});

test('live extraction failure is explicit and leaves the uploaded scan errored', async () => {
  await withServer(async (baseUrl) => {
    const createResponse = await fetch(`${baseUrl}/scans`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ productName: 'Live extraction test', sourceType: 'PHYSICAL_PHOTO', ruleVersion: 'pending-verified-ruleset' }),
    });
    const scan = await createResponse.json() as { id: string };
    const uploadResponse = await fetch(`${baseUrl}/scans/${scan.id}/images`, {
      method: 'POST', headers: { 'content-type': 'image/png' }, body: new Uint8Array([1, 2, 3]),
    });
    assert.equal(uploadResponse.status, 502);
    assert.equal((await uploadResponse.json() as { error: { code: string } }).error.code, 'EXTRACTION_FAILED');
    const getResponse = await fetch(`${baseUrl}/scans/${scan.id}`);
    const persisted = await getResponse.json() as { images: unknown[]; observations: unknown[]; processing: { lifecycle: string; stage: string } };
    assert.equal(persisted.images.length, 1);
    assert.equal(persisted.observations.length, 0);
    assert.deepEqual(persisted.processing, { stage: 'ERROR', lifecycle: 'ERROR', errorMessage: 'live extraction provider is not configured' });
  });
});

test('does not turn extraction failure into a completed uncertain result', async () => {
  await withServer(async (baseUrl) => {
    const createResponse = await fetch(`${baseUrl}/scans`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ productName: 'Failed extraction', sourceType: 'PHYSICAL_PHOTO', ruleVersion: RULESET_VERSION }),
    });
    const scan = await createResponse.json() as { id: string };
    const uploadResponse = await fetch(`${baseUrl}/scans/${scan.id}/images`, {
      method: 'POST',
      headers: { 'content-type': 'image/png' },
      body: new Uint8Array([1, 2, 3]),
    });
    assert.equal(uploadResponse.status, 502);

    const resultResponse = await fetch(`${baseUrl}/scans/${scan.id}/result`, { method: 'POST' });
    assert.equal(resultResponse.status, 409);
    const persisted = await (await fetch(`${baseUrl}/scans/${scan.id}`)).json() as { processing: { lifecycle: string; stage: string }; evaluations: unknown[] };
    assert.equal(persisted.processing.lifecycle, 'ERROR');
    assert.equal(persisted.processing.stage, 'ERROR');
    assert.equal(persisted.evaluations.length, 0);
  });
});

test('does not allow a demo adapter to serve a LIVE scan', async () => {
  const app = createApp(undefined, new MockLocalExtractionAdapter([{
    id: 'demo-observation', field: 'mrp', value: 120, confidence: 0.99,
    status: 'OBSERVED', observedAt: '2026-09-06T10:00:00.000Z',
  }]));
  await withServer(async (baseUrl) => {
    const createResponse = await fetch(`${baseUrl}/scans`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ productName: 'Live isolation test', sourceType: 'PHYSICAL_PHOTO', ruleVersion: 'pending-verified-ruleset', mode: 'LIVE' }),
    });
    const scan = await createResponse.json() as { id: string };
    const uploadResponse = await fetch(`${baseUrl}/scans/${scan.id}/images`, {
      method: 'POST', headers: { 'content-type': 'image/jpeg' }, body: new Uint8Array([1, 2, 3]),
    });
    assert.equal(uploadResponse.status, 502);
    const persisted = await (await fetch(`${baseUrl}/scans/${scan.id}`)).json() as { observations: unknown[] };
    assert.equal(persisted.observations.length, 0);
  }, app);
});

test('rejects unauthenticated access to scans, history, results, and source images', async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    for (const path of ['/scans', '/scans/scan_missing', '/scans/scan_missing/result', '/scans/scan_missing/images/image_missing']) {
      const response = await fetch(`${baseUrl}${path}`);
      assert.equal(response.status, 401, path);
      assert.equal((await response.json() as { error: { code: string } }).error.code, 'AUTH_REQUIRED');
    }
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('logout invalidates the server session', async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'test-inspector', password: 'test-password' }),
    });
    const cookie = loginResponse.headers.get('set-cookie')?.split(';', 1)[0];
    assert.ok(cookie);
    const logoutResponse = await fetch(`${baseUrl}/auth/logout`, { method: 'POST', headers: { cookie } });
    assert.equal(logoutResponse.status, 204);
    const protectedResponse = await fetch(`${baseUrl}/scans`, { headers: { cookie } });
    assert.equal(protectedResponse.status, 401);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('derives and persists the canonical result from server-owned observations and rules', async () => {
  const app = createApp(undefined, new MockLocalExtractionAdapter([]));
  await withServer(async (baseUrl) => {
    const createResponse = await fetch(`${baseUrl}/scans`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ productName: 'History commodity', sourceType: 'PHYSICAL_PHOTO', ruleVersion: RULESET_VERSION, mode: 'DEMO_FIXTURE' }),
    });
    const scan = await createResponse.json() as { id: string };
    const uploadResponse = await fetch(`${baseUrl}/scans/${scan.id}/images`, {
      method: 'POST',
      headers: { 'content-type': 'image/png' },
      body: new Uint8Array([1, 2, 3]),
    });
    assert.equal(uploadResponse.status, 201);
    const saveResponse = await fetch(`${baseUrl}/scans/${scan.id}/result`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        scanId: 'attacker-chosen-scan',
        overallResult: 'PASS',
        evaluations: [{
          id: 'attacker-chosen-evaluation', ruleId: 'attacker-chosen-rule', ruleVersion: 'attacker-chosen-version',
          observationId: null, result: 'PASS', observationConfidence: 1,
          reason: 'Attacker supplied result.', evidence: null, evaluatedAt: '2026-09-06T12:00:00.000Z',
        }],
        generatedAt: '2026-09-06T12:00:00.000Z',
        source: 'DETERMINISTIC_RULE_ENGINE',
      }),
    });
    assert.equal(saveResponse.status, 201);
    const saved = await saveResponse.json() as { result: { overallResult: string; evaluations: unknown[] } };
    assert.equal(saved.result.overallResult, 'UNCERTAIN');
    assert.equal(saved.result.evaluations.length, 7);
    const persistedScan = await (await fetch(`${baseUrl}/scans/${scan.id}`)).json() as { processing: { lifecycle: string }; evaluations: unknown[] };
    assert.equal(persistedScan.processing.lifecycle, 'COMPLETE');
    assert.equal(persistedScan.evaluations.length, 7);

    const today = new Date();
    const fromDate = new Date(today.getTime() - 86400000 * 2).toISOString();
    const toDate = new Date(today.getTime() + 86400000 * 2).toISOString();
    const historyResponse = await fetch(`${baseUrl}/scans?productName=history&result=UNCERTAIN&from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`);
    assert.equal(historyResponse.status, 200);
    const history = await historyResponse.json() as { items: { scan: { id: string }; result: { scanId: string; overallResult: string } }[] };
    assert.equal(history.items.length, 1);
    assert.equal(history.items[0].scan.id, scan.id);
    assert.equal(history.items[0].result.scanId, scan.id);
    assert.equal(history.items[0].result.overallResult, 'UNCERTAIN');
  }, app);
});
