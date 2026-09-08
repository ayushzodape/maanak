import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createCanonicalScanResult,
  createEvaluation,
  createEvidenceImage,
  createObservation,
  createRule,
  createScan,
  DomainValidationError,
} from './index';

const now = '2026-09-06T10:00:00.000Z';

function validEvidence() {
  return createEvidenceImage({
    id: 'img-1',
    storageKey: 'scans/scan-1/original.jpg',
    mimeType: 'image/jpeg',
    byteSize: 1024,
    sha256: 'verified-source-image-hash',
    width: 1000,
    height: 1200,
    capturedAt: now,
    createdAt: now,
  });
}

function validObservation() {
  return createObservation({
    id: 'obs-1',
    field: 'mrp',
    value: 120,
    unit: 'INR',
    confidence: 0.97,
    status: 'OBSERVED',
    evidence: { imageId: 'img-1', boundingBox: { x: 0.1, y: 0.2, width: 0.3, height: 0.1 } },
    extractionMethod: 'VISION_EXTRACTION',
    observedAt: now,
  });
}

function validEvaluation() {
  return createEvaluation({
    id: 'eval-1',
    ruleId: 'rule-6-mrp',
    ruleVersion: 'lmpc-2011-verified-subset-1',
    observationId: 'obs-1',
    result: 'PASS',
    observationConfidence: 0.97,
    observedValue: 120,
    requiredValue: 'verified rule requirement',
    reason: 'Deterministic rule evaluation completed from the referenced observation.',
    evidence: { imageId: 'img-1' },
    evaluatedAt: now,
  });
}

test('creates an evidence image with source metadata', () => {
  const image = validEvidence();
  assert.equal(image.id, 'img-1');
  assert.equal(Object.isFrozen(image), true);
});

test('requires evidence for an observed observation', () => {
  assert.throws(
    () => createObservation({ ...validObservation(), evidence: null }),
    DomainValidationError,
  );
});

test('rejects OBSERVED status with null or empty value', () => {
  assert.throws(
    () => createObservation({ ...validObservation(), value: null }),
    DomainValidationError,
  );
  assert.throws(
    () => createObservation({ ...validObservation(), value: '   ' }),
    DomainValidationError,
  );
});

test('rejects invalid confidence and bounding boxes', () => {
  assert.throws(
    () => createObservation({ ...validObservation(), confidence: 1.1 }),
    DomainValidationError,
  );
  assert.throws(
    () => createObservation({
      ...validObservation(),
      evidence: { imageId: 'img-1', boundingBox: { x: 0, y: 0, width: 1.2, height: 0.1 } },
    }),
    DomainValidationError,
  );
});

test('observation input cannot carry a legal compliance result', () => {
  assert.throws(
    () => createObservation({ ...validObservation(), result: 'PASS' } as never),
    DomainValidationError,
  );
});

test('evaluation is a separate record with a canonical compliance result', () => {
  const evaluation = validEvaluation();
  assert.equal(evaluation.result, 'PASS');
  assert.equal(evaluation.observationId, 'obs-1');
});

test('creates rules with provenance but no invented legal logic', () => {
  const rule = createRule({
    id: 'rule-6-mrp',
    title: 'MRP declaration',
    source: 'verified legal source reference',
    sourceVersion: 'source-version-1',
    effectiveFrom: null,
    verifiedOn: now,
    verificationStatus: 'VERIFIED',
    logic: { kind: 'DECLARATION_PRESENCE', field: 'mrp' },
    knownGaps: [],
  });
  assert.equal(rule.verificationStatus, 'VERIFIED');
  assert.equal(rule.knownGaps.length, 0);
});

test('requires evidence for PASS and FAIL evaluations', () => {
  assert.throws(
    () => createEvaluation({ ...validEvaluation(), evidence: null }),
    DomainValidationError,
  );
});

test('creates a canonical result only from deterministic evaluations', () => {
  const result = createCanonicalScanResult({
    scanId: 'scan-1',
    overallResult: 'PASS',
    evaluations: [validEvaluation()],
    generatedAt: now,
    source: 'DETERMINISTIC_RULE_ENGINE',
  });
  assert.equal(result.source, 'DETERMINISTIC_RULE_ENGINE');
  assert.equal(result.evaluations.length, 1);
});

test('creates a scan with explicit source, processing metadata, and timestamps', () => {
  const scan = createScan({
    id: 'scan-1',
    productName: 'Example commodity',
    sourceType: 'PHYSICAL_PHOTO',
    mode: 'LIVE',
    images: [validEvidence()],
    observations: [validObservation()],
    evaluations: [validEvaluation()],
    ruleVersion: 'lmpc-2011-verified-subset-1',
    processing: { stage: 'COMPLETE', lifecycle: 'COMPLETE' },
    timestamps: { createdAt: now, updatedAt: now, completedAt: now },
  });
  assert.equal(scan.sourceType, 'PHYSICAL_PHOTO');
  assert.equal(scan.processing.lifecycle, 'COMPLETE');
});

test('requires an error message for errored scans', () => {
  assert.throws(
    () => createScan({
      id: 'scan-1',
      productName: 'Example commodity',
      sourceType: 'ECOMMERCE_LISTING',
      mode: 'LIVE',
      images: [],
      observations: [],
      evaluations: [],
      ruleVersion: 'blocked-unverified-version',
      processing: { stage: 'ERROR', lifecycle: 'ERROR' },
      timestamps: { createdAt: now, updatedAt: now },
    }),
    DomainValidationError,
  );
});

test('rejects scan records with untraceable evidence or observations', () => {
  assert.throws(
    () => createScan({
      id: 'scan-1',
      productName: 'Example commodity',
      sourceType: 'PHYSICAL_PHOTO',
      mode: 'LIVE',
      images: [validEvidence()],
      observations: [{ ...validObservation(), evidence: { imageId: 'missing-image' } }],
      evaluations: [],
      ruleVersion: 'lmpc-2011-verified-subset-1',
      processing: { stage: 'EXTRACTING', lifecycle: 'PROCESSING' },
      timestamps: { createdAt: now, updatedAt: now },
    }),
    DomainValidationError,
  );

  assert.throws(
    () => createScan({
      id: 'scan-1',
      productName: 'Example commodity',
      sourceType: 'PHYSICAL_PHOTO',
      mode: 'LIVE',
      images: [validEvidence()],
      observations: [validObservation()],
      evaluations: [{ ...validEvaluation(), observationId: 'missing-observation' }],
      ruleVersion: 'lmpc-2011-verified-subset-1',
      processing: { stage: 'EVALUATING', lifecycle: 'PROCESSING' },
      timestamps: { createdAt: now, updatedAt: now },
    }),
    DomainValidationError,
  );
});
