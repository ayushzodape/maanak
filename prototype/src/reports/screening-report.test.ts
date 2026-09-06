import assert from 'node:assert/strict';
import test from 'node:test';
import { createCanonicalScanResult, createEvidenceImage, createEvaluation, createObservation, createScan } from '../domain';
import { CURRENT_RULE_DEFINITIONS } from '../evaluation';
import { createScreeningReport, renderHumanReadableReport, SCREENING_DISCLAIMER, serializeCanonicalJson } from './screening-report';

const now = '2026-09-06T10:00:00.000Z';
const image = createEvidenceImage({ id: 'image-1', storageKey: 'scans/scan-1/source.jpg', mimeType: 'image/jpeg', byteSize: 100, sha256: 'hash', width: 1000, height: 1000, capturedAt: now, createdAt: now });
const observation = createObservation({ id: 'observation-1', field: 'mrp', value: 120, unit: 'INR', confidence: 0.94, status: 'OBSERVED', evidence: { imageId: image.id, sourceImage: { storageKey: image.storageKey } }, extractionMethod: 'VISION_EXTRACTION', observedAt: now });
const evaluation = createEvaluation({ id: 'evaluation-1', ruleId: 'rule-1', ruleVersion: 'v1', observationId: observation.id, result: 'PASS', observationConfidence: observation.confidence, observedValue: observation.value, reason: 'Observed in source evidence.', evidence: observation.evidence, evaluatedAt: now });
const canonicalResult = createCanonicalScanResult({ scanId: 'scan-1', overallResult: 'PASS', evaluations: [evaluation], generatedAt: now, source: 'DETERMINISTIC_RULE_ENGINE' });
const scan = createScan({ id: 'scan-1', productName: 'Test commodity', sourceType: 'PHYSICAL_PHOTO', mode: 'LIVE', images: [image], observations: [observation], evaluations: [evaluation], ruleVersion: 'v1', processing: { stage: 'COMPLETE', lifecycle: 'COMPLETE' }, timestamps: { createdAt: now, updatedAt: now, completedAt: now } });

test('JSON and human-readable report derive the same canonical result', () => {
  const report = createScreeningReport(scan, canonicalResult, CURRENT_RULE_DEFINITIONS, now);
  const json = JSON.parse(serializeCanonicalJson(report)) as typeof report;
  const text = renderHumanReadableReport(report);
  assert.deepEqual(json.canonicalResult, canonicalResult);
  assert.match(text, new RegExp(`Screening result: ${canonicalResult.overallResult}`));
  assert.match(text, new RegExp(evaluation.ruleId));
  assert.match(text, new RegExp(evaluation.result));
  assert.match(text, new RegExp(evaluation.evidence!.imageId));
});

test('report includes required metadata, evidence, limitations, and disclaimer', () => {
  const report = createScreeningReport(scan, canonicalResult, CURRENT_RULE_DEFINITIONS, now);
  assert.equal(report.scan.productName, scan.productName);
  assert.equal(report.scan.sourceType, scan.sourceType);
  assert.deepEqual(report.observations, scan.observations);
  assert.deepEqual(report.evidenceImages, scan.images);
  assert.equal(report.disclaimer, SCREENING_DISCLAIMER);
  assert.ok(report.limitations.some((limitation) => limitation.includes('certified measurement')));
});

test('report rejects a canonical result belonging to another scan', () => {
  assert.throws(() => createScreeningReport(scan, { ...canonicalResult, scanId: 'other-scan' }, CURRENT_RULE_DEFINITIONS, now), /does not belong/);
});
