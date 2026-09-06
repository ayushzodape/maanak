import assert from 'node:assert/strict';
import test from 'node:test';
import { createEvidenceImage } from '../domain';
import { ExtractionError } from './extraction-adapter';
import { GeminiConfigurationError, GeminiExtractionAdapter } from './gemini-extraction-adapter';
import { MockLocalExtractionAdapter } from './mock-local-extraction-adapter';

const now = '2026-09-06T10:00:00.000Z';

const image = createEvidenceImage({
  id: 'img-source-1',
  storageKey: 'scans/scan-1/original.jpg',
  mimeType: 'image/jpeg',
  byteSize: 1024,
  sha256: 'source-image-hash',
  capturedAt: now,
  createdAt: now,
});

test('extracts a strong observed declaration with source evidence', async () => {
  const [observation] = await new MockLocalExtractionAdapter([{
    id: 'obs-mrp',
    field: 'mrp',
    value: 120,
    unit: 'INR',
    confidence: 0.98,
    status: 'OBSERVED',
    boundingBox: { x: 0.1, y: 0.2, width: 0.3, height: 0.1 },
    observedAt: now,
  }]).extract(image);

  assert.equal(observation.status, 'OBSERVED');
  assert.equal(observation.value, 120);
  assert.equal(observation.evidence?.imageId, image.id);
  assert.equal(observation.evidence?.sourceImage?.storageKey, image.storageKey);
  assert.equal(observation.evidence?.boundingBox?.width, 0.3);
});

test('preserves a low-confidence observation as UNCERTAIN', async () => {
  const [observation] = await new MockLocalExtractionAdapter([{
    id: 'obs-date', field: 'date_mfg', value: '08/2026', confidence: 0.42,
    status: 'UNCERTAIN', observedAt: now,
  }]).extract(image);
  assert.equal(observation.status, 'UNCERTAIN');
  assert.equal(observation.confidence, 0.42);
});

test('represents a missing declaration as NOT_DETECTED without inventing a value', async () => {
  const [observation] = await new MockLocalExtractionAdapter([{
    id: 'obs-consumer-care', field: 'consumer_care', value: null, confidence: 0,
    status: 'NOT_DETECTED', observedAt: now,
  }]).extract(image);
  assert.equal(observation.status, 'NOT_DETECTED');
  assert.equal(observation.value, null);
});

test('represents a declaration outside the visible frame as NOT_VISIBLE', async () => {
  const [observation] = await new MockLocalExtractionAdapter([{
    id: 'obs-manufacturer', field: 'manufacturer', value: null, confidence: 0.15,
    status: 'NOT_VISIBLE', observedAt: now,
  }]).extract(image);
  assert.equal(observation.status, 'NOT_VISIBLE');
});

test('represents unavailable physical measurement as NOT_MEASURABLE', async () => {
  const [observation] = await new MockLocalExtractionAdapter([{
    id: 'obs-font-height', field: 'character_height', value: null, unit: 'mm',
    confidence: 0.9, status: 'NOT_MEASURABLE', observedAt: now,
  }]).extract(image);
  assert.equal(observation.status, 'NOT_MEASURABLE');
  assert.equal(observation.value, null);
});

test('distinguishes extraction failure from a NOT_DETECTED observation', async () => {
  await assert.rejects(
    () => new MockLocalExtractionAdapter(new Error('fixture unavailable')).extract(image),
    (error: unknown) => error instanceof ExtractionError && error.code === 'EXTRACTION_FAILED',
  );
});

test('rejects invalid local fixture data instead of returning an invented observation', async () => {
  await assert.rejects(
    () => new MockLocalExtractionAdapter([{
      id: 'obs-invalid', field: 'mrp', value: 120, confidence: 1.5,
      status: 'OBSERVED', observedAt: now,
    }]).extract(image),
    (error: unknown) => error instanceof ExtractionError && error.message.includes('invalid'),
  );
});

test('requires a Gemini API key without exposing configuration details', () => {
  assert.throws(
    () => new GeminiExtractionAdapter({ apiKey: ' ', loadImageBytes: () => new Uint8Array([1]) }),
    (error: unknown) => error instanceof GeminiConfigurationError &&
      error.message === 'Gemini extraction provider is not configured' &&
      !error.message.includes('key'),
  );
});

test('converts valid Gemini structured output into evidence-backed observations', async () => {
  let request: unknown;
  const adapter = new GeminiExtractionAdapter({
    apiKey: 'test-key',
    loadImageBytes: () => new Uint8Array([1, 2, 3]),
    client: {
      generateContent: async (params) => {
        request = params;
        return {
          text: JSON.stringify({
            observations: [{
              field: 'mrp', value: '₹120', unit: 'INR', confidence: 0.96, status: 'OBSERVED',
              boundingBox: { x: 0.1, y: 0.2, width: 0.3, height: 0.1 },
            }],
          }),
        };
      },
    },
  });

  const [observation] = await adapter.extract(image);
  assert.equal(observation.field, 'mrp');
  assert.equal(observation.value, '₹120');
  assert.equal(observation.status, 'OBSERVED');
  assert.equal(observation.extractionMethod, 'GEMINI_VISION');
  assert.deepEqual(observation.evidence?.boundingBox, { x: 0.1, y: 0.2, width: 0.3, height: 0.1 });
  assert.equal((request as { model: string }).model, 'gemini-2.5-flash');
  assert.equal((request as { config: { responseMimeType: string } }).config.responseMimeType, 'application/json');
  assert.match(JSON.stringify(request), /Do not infer legal compliance/);
  assert.match(JSON.stringify(request), /Do not return PASS or FAIL/);
});

test('rejects malformed Gemini output instead of fabricating observations', async () => {
  const adapter = new GeminiExtractionAdapter({
    apiKey: 'test-key',
    loadImageBytes: () => new Uint8Array([1]),
    client: { generateContent: async () => ({ text: '{not-json' }) },
  });

  await assert.rejects(
    () => adapter.extract(image),
    (error: unknown) => error instanceof ExtractionError && error.message.includes('malformed JSON'),
  );
});

test('rejects an empty Gemini response and missing source bytes', async () => {
  const emptyResponseAdapter = new GeminiExtractionAdapter({
    apiKey: 'test-key',
    loadImageBytes: () => new Uint8Array([1]),
    client: { generateContent: async () => ({ text: '  ' }) },
  });
  await assert.rejects(
    () => emptyResponseAdapter.extract(image),
    (error: unknown) => error instanceof ExtractionError && error.message.includes('empty response'),
  );

  const missingBytesAdapter = new GeminiExtractionAdapter({
    apiKey: 'test-key',
    loadImageBytes: () => undefined,
    client: { generateContent: async () => ({ text: '{}' }) },
  });
  await assert.rejects(
    () => missingBytesAdapter.extract(image),
    (error: unknown) => error instanceof ExtractionError && error.message.includes('source image bytes'),
  );
});

test('converts provider failures into sanitized extraction errors', async () => {
  const adapter = new GeminiExtractionAdapter({
    apiKey: 'test-key',
    loadImageBytes: () => new Uint8Array([1]),
    client: {
      generateContent: async () => { throw { status: 503, message: 'secret provider details' }; },
    },
  });

  await assert.rejects(
    () => adapter.extract(image),
    (error: unknown) => error instanceof ExtractionError &&
      error.message === 'Gemini extraction provider is unavailable' &&
      !error.message.includes('secret'),
  );
});

test('never accepts a provider compliance result as an observation result', async () => {
  const adapter = new GeminiExtractionAdapter({
    apiKey: 'test-key',
    loadImageBytes: () => new Uint8Array([1]),
    client: {
      generateContent: async () => ({
        text: JSON.stringify({ result: 'PASS', observations: [] }),
      }),
    },
  });

  await assert.rejects(
    () => adapter.extract(image),
    (error: unknown) => error instanceof ExtractionError && error.message.includes('observation schema'),
  );
});
