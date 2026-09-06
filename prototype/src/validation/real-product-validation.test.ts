import assert from 'node:assert/strict';
import test from 'node:test';
import { createEvidenceImage } from '../domain';
import { MockLocalExtractionAdapter } from '../extraction';
import {
  EXTRACTION_FAILURE_EXPECTATION,
  REAL_PRODUCT_VALIDATION_MATRIX,
} from './real-product-validation';

const now = '2026-09-06T00:00:00.000Z';

const image = createEvidenceImage({
  id: 'real-product-validation-image',
  storageKey: 'validation/real-product-validation-image.jpg',
  mimeType: 'image/jpeg',
  byteSize: 100,
  sha256: 'validation-fixture-source-hash',
  width: 1200,
  height: 1600,
  capturedAt: now,
  createdAt: now,
});

test('validation matrix covers every required real-product condition', () => {
  const conditions = new Set<string>(REAL_PRODUCT_VALIDATION_MATRIX.map((item) => item.condition));

  assert.equal(REAL_PRODUCT_VALIDATION_MATRIX.length, 12);
  for (const condition of [
    'GOOD_LIGHTING',
    'GLARE',
    'REFLECTION',
    'CURVED_PACKAGING',
    'SMALL_TEXT',
    'OBLIQUE_ANGLE',
    'SHADOW',
    'PARTIAL_LABEL',
    'CLUTTERED_BACKGROUND',
    'MULTIPLE_DECLARATIONS',
    'MISSING_DECLARATION',
    'INSUFFICIENT_SCALE_EVIDENCE',
  ]) {
    assert.ok(conditions.has(condition));
  }
});

test('validation expectations preserve uncertainty and unavailable states', () => {
  const byCondition = Object.fromEntries(
    REAL_PRODUCT_VALIDATION_MATRIX.map((item) => [item.condition, item]),
  );

  assert.deepEqual(byCondition.INSUFFICIENT_SCALE_EVIDENCE.expectedObservationStatuses, ['NOT_MEASURABLE']);
  assert.ok(byCondition.SMALL_TEXT.expectedObservationStatuses.includes('UNCERTAIN'));
  assert.deepEqual(byCondition.MISSING_DECLARATION.expectedObservationStatuses, ['NOT_DETECTED']);
  assert.ok(byCondition.PARTIAL_LABEL.expectedObservationStatuses.includes('NOT_VISIBLE'));
  assert.match(EXTRACTION_FAILURE_EXPECTATION.expectedDomainOutcome, /error.*retry/i);
});

test('reproducible validation plans produce domain states without legal results', async () => {
  const adapter = new MockLocalExtractionAdapter([
    {
      id: 'obs-mrp-uncertain',
      field: 'mrp',
      value: null,
      confidence: 0.31,
      status: 'UNCERTAIN',
      observedAt: now,
    },
    {
      id: 'obs-net-quantity-not-visible',
      field: 'net_quantity',
      value: null,
      confidence: 0,
      status: 'NOT_VISIBLE',
      observedAt: now,
    },
    {
      id: 'obs-height-not-measurable',
      field: 'declaration_height',
      value: null,
      confidence: 0,
      status: 'NOT_MEASURABLE',
      observedAt: now,
    },
  ]);

  const observations = await adapter.extract(image);

  assert.deepEqual(observations.map((observation) => observation.status), [
    'UNCERTAIN',
    'NOT_VISIBLE',
    'NOT_MEASURABLE',
  ]);
  assert.ok(observations.every((observation) => observation.evidence?.imageId === image.id));
  assert.ok(observations.every((observation) => !('result' in observation)));
});

test('extraction failure is an error path rather than synthetic success', async () => {
  await assert.rejects(
    () => new MockLocalExtractionAdapter(new Error('provider unavailable')).extract(image),
    /local extraction fixture failed/,
  );
});
