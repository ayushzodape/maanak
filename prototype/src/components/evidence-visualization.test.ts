import assert from 'node:assert/strict';
import test from 'node:test';
import { createCanonicalScanResult, createEvaluation } from '../domain';
import { collectEvidencePoints } from './evidence-visualization';

const now = '2026-09-06T10:00:00.000Z';
const result = createCanonicalScanResult({
  scanId: 'scan-1',
  overallResult: 'UNCERTAIN',
  generatedAt: now,
  source: 'DETERMINISTIC_RULE_ENGINE',
  evaluations: [
    createEvaluation({ id: 'evaluation-1', ruleId: 'rule-1', ruleVersion: 'v1', observationId: 'obs-1', result: 'PASS', observationConfidence: 0.9, reason: 'Observed', evidence: { imageId: 'image-1', boundingBox: { x: 0.1, y: 0.2, width: 0.3, height: 0.2 } }, evaluatedAt: now }),
    createEvaluation({ id: 'evaluation-2', ruleId: 'rule-2', ruleVersion: 'v1', observationId: 'obs-2', result: 'UNCERTAIN', observationConfidence: 0.3, reason: 'Not localized', evidence: { imageId: 'image-1' }, evaluatedAt: now }),
  ],
});

test('collects source evidence points and preserves bounding boxes', () => {
  const points = collectEvidencePoints(result, 'image-1');
  assert.equal(points.length, 2);
  assert.deepEqual(points[0].evidence.boundingBox, { x: 0.1, y: 0.2, width: 0.3, height: 0.2 });
});

test('missing bounding boxes remain unlocalized rather than fabricated', () => {
  const points = collectEvidencePoints(result, 'image-1');
  assert.equal(points[1].evidence.boundingBox, undefined);
});

test('filters evidence points by their actual source image', () => {
  assert.equal(collectEvidencePoints(result, 'other-image').length, 0);
});
