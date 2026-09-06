import assert from 'node:assert/strict';
import test from 'node:test';
import { createApp } from './app';

async function withServer<T>(callback: (baseUrl: string) => Promise<T>): Promise<T> {
  const server = createApp().listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('test server did not expose a TCP address');
  }
  try {
    return await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test('creates and retrieves a scan with validated metadata', async () => {
  await withServer(async (baseUrl) => {
    const createResponse = await fetch(`${baseUrl}/scans`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        productName: 'Example commodity',
        sourceType: 'PHYSICAL_PHOTO',
        ruleVersion: 'pending-verified-ruleset',
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
  await withServer(async (baseUrl) => {
    const createResponse = await fetch(`${baseUrl}/scans`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ productName: 'Image test', sourceType: 'ECOMMERCE_LISTING', ruleVersion: 'pending-verified-ruleset' }),
    });
    const scan = await createResponse.json() as { id: string };
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const uploadResponse = await fetch(`${baseUrl}/scans/${scan.id}/images`, {
      method: 'POST',
      headers: { 'content-type': 'image/png', 'x-captured-at': '2026-09-06T10:00:00.000Z' },
      body: bytes,
    });
    assert.equal(uploadResponse.status, 201);
    const payload = await uploadResponse.json() as { image: { id: string; byteSize: number; sha256: string }; scan: { images: unknown[] } };
    assert.match(payload.image.id, /^img_/);
    assert.equal(payload.image.byteSize, 4);
    assert.match(payload.image.sha256, /^[a-f0-9]{64}$/);
    assert.equal(payload.scan.images.length, 1);
  });
});

test('rejects invalid scan metadata and invalid image requests', async () => {
  await withServer(async (baseUrl) => {
    const invalidScanResponse = await fetch(`${baseUrl}/scans`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ productName: 'Missing source', ruleVersion: 'pending-verified-ruleset' }),
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
      body: JSON.stringify({ productName: 'Type test', sourceType: 'PHYSICAL_PHOTO', ruleVersion: 'pending-verified-ruleset' }),
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
