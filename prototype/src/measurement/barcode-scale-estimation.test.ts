import assert from 'node:assert/strict';
import test from 'node:test';
import { CURRENT_RULE_DEFINITIONS } from '../evaluation';
import { createBarcodeScaleObservation, formatBarcodeScaleEstimate, isBarcodeScaleEstimateValue } from './barcode-scale-estimation';

const image = {
  id: 'image-barcode',
  storageKey: 'scans/scan-1/images/image-barcode',
  width: 1200,
  height: 1600,
};

const base = {
  id: 'observation-barcode',
  image,
  barcodeFormat: 'EAN_13' as const,
  boundingBox: { x: 0.1, y: 0.2, width: 0.25, height: 0.1 },
  detectionConfidence: 0.96,
  minimumDetectionConfidence: 0.8,
  observedAt: '2026-09-06T12:00:00.000Z',
};

test('creates a clearly labelled barcode screening estimate with evidence and scale assumptions', () => {
  const observation = createBarcodeScaleObservation(base);
  const value = observation.value;

  assert.equal(observation.field, 'barcode_scale_reference');
  assert.equal(observation.status, 'OBSERVED');
  assert.equal(observation.confidence, 0.96);
  assert.equal(observation.evidence?.imageId, image.id);
  assert.deepEqual(observation.evidence?.boundingBox, base.boundingBox);
  assert.ok(isBarcodeScaleEstimateValue(value));
  assert.equal(value.label, 'SCREENING ESTIMATE');
  assert.equal(value.estimatedScale?.pixelsPerMillimetreX, (300 / 37.29));
  assert.ok(value.assumptions.length > 0);
  assert.ok(value.limitations.some((limitation) => /certified measurement/i.test(limitation)));
  assert.ok(value.limitations.some((limitation) => /legal fact|statutory verdict/i.test(limitation)));
  assert.match(formatBarcodeScaleEstimate(value), /SCREENING ESTIMATE/);
  assert.match(formatBarcodeScaleEstimate(value), /not certified/);
  assert.ok(!('result' in observation));
});

test('missing barcode geometry is NOT_MEASURABLE and never fabricates scale', () => {
  const observation = createBarcodeScaleObservation({ ...base, boundingBox: null });
  const value = observation.value;

  assert.equal(observation.status, 'NOT_MEASURABLE');
  assert.ok(isBarcodeScaleEstimateValue(value));
  assert.equal(value.estimatedScale, null);
  assert.equal(observation.evidence?.imageId, image.id);
  assert.equal(observation.evidence?.boundingBox, undefined);
});

test('low-confidence barcode detection remains UNCERTAIN and cannot provide usable scale', () => {
  const observation = createBarcodeScaleObservation({ ...base, detectionConfidence: 0.42 });
  const value = observation.value;

  assert.equal(observation.status, 'UNCERTAIN');
  assert.equal(observation.confidence, 0.42);
  assert.ok(isBarcodeScaleEstimateValue(value));
  assert.equal(value.estimatedScale, null);
});

test('invalid barcode geometry is NOT_MEASURABLE', () => {
  const observation = createBarcodeScaleObservation({
    ...base,
    boundingBox: { x: 0.9, y: 0.2, width: 0.3, height: 0.1 },
  });

  assert.equal(observation.status, 'NOT_MEASURABLE');
  assert.equal((observation.value as { estimatedScale: unknown }).estimatedScale, null);
});

test('missing image dimensions are NOT_MEASURABLE', () => {
  const observation = createBarcodeScaleObservation({
    ...base,
    image: { ...image, width: undefined, height: undefined },
  });

  assert.equal(observation.status, 'NOT_MEASURABLE');
  assert.equal((observation.value as { estimatedScale: unknown }).estimatedScale, null);
});

test('barcode estimate remains outside the current statutory rule definitions', () => {
  assert.equal(CURRENT_RULE_DEFINITIONS.some((rule) => rule.logic.field === 'barcode_scale_reference'), false);
});
