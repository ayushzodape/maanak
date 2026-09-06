import assert from 'node:assert/strict';
import test from 'node:test';
import { createEvidenceImage, createObservation } from '../domain';
import { BLOCKED_RULE_7, CURRENT_RULE_DEFINITIONS, VERIFIED_RULE_DEFINITIONS } from './rule-definitions';
import { evaluateObservations, evaluateScan } from './evaluator';

const now = '2026-09-06T10:00:00.000Z';
const image = createEvidenceImage({ id: 'image-1', storageKey: 'scans/1/source.jpg', mimeType: 'image/jpeg', byteSize: 10, sha256: 'hash', width: 100, height: 100, capturedAt: now, createdAt: now });
const evidence = { imageId: image.id, sourceImage: { storageKey: image.storageKey } };

function observation(status: 'OBSERVED' | 'NOT_DETECTED' | 'UNCERTAIN' | 'NOT_VISIBLE' | 'NOT_MEASURABLE', field = 'mrp', value: unknown = 120) {
  return createObservation({ id: `observation-${field}`, field, value, unit: field === 'mrp' ? 'INR' : undefined, confidence: status === 'OBSERVED' ? 0.98 : 0.2, status, evidence, extractionMethod: 'VISION_EXTRACTION', observedAt: now });
}

test('verified declaration rules deterministically pass observed evidence and preserve its reference', () => {
  const rule = VERIFIED_RULE_DEFINITIONS.find(({ logic }) => logic.kind === 'DECLARATION_PRESENCE' && logic.field === 'mrp')!;
  const result = evaluateObservations([observation('OBSERVED')], [rule])[0];
  assert.equal(result.result, 'PASS');
  assert.deepEqual(result.evidence, evidence);
  assert.equal(result.observationId, 'observation-mrp');
});

test('each implemented declaration rule has deterministic missing, detected, and uncertain behavior', () => {
  for (const rule of VERIFIED_RULE_DEFINITIONS) {
    const field = rule.logic.kind === 'DECLARATION_PRESENCE' ? rule.logic.field : 'unknown';
    assert.equal(evaluateObservations([observation('OBSERVED', field)], [rule])[0].result, 'PASS');
    assert.equal(evaluateObservations([observation('NOT_DETECTED', field)], [rule])[0].result, 'FAIL');
    assert.equal(evaluateObservations([observation('UNCERTAIN', field)], [rule])[0].result, 'UNCERTAIN');
    assert.equal(evaluateObservations([], [rule])[0].result, 'UNCERTAIN');
  }
});

test('blocked Rule 7 never evaluates a legal verdict and never uses PDP-area logic', () => {
  const evaluation = evaluateObservations([observation('OBSERVED', 'character_height', 2)], [BLOCKED_RULE_7])[0];
  assert.equal(evaluation.result, 'UNCERTAIN');
  assert.match(evaluation.reason, /blocked/i);
  assert.equal(BLOCKED_RULE_7.logic.kind, 'BLOCKED');
});

test('NOT_MEASURABLE remains NOT_MEASURABLE and cannot become PASS', () => {
  const evaluation = evaluateObservations([observation('NOT_MEASURABLE', 'character_height')], [BLOCKED_RULE_7])[0];
  assert.equal(evaluation.result, 'NOT_MEASURABLE');
});

test('explicitly non-applicable rules produce NOT_APPLICABLE deterministically', () => {
  const rule = {
    id: 'rule-not-applicable',
    title: 'Out-of-scope declaration',
    source: 'verified applicability source',
    sourceVersion: 'verified-applicability-1',
    effectiveFrom: null,
    verifiedOn: now,
    verificationStatus: 'VERIFIED' as const,
    logic: { kind: 'NOT_APPLICABLE' as const, reason: 'This verified rule does not apply to this product context.' },
    knownGaps: [],
  };
  const evaluation = evaluateObservations([observation('OBSERVED')], [rule])[0];
  assert.equal(evaluation.result, 'NOT_APPLICABLE');
  assert.equal(evaluation.reason, rule.logic.reason);
  assert.equal(evaluateScan('scan-na', [observation('OBSERVED')], [rule], now).canonicalResult.overallResult, 'NOT_APPLICABLE');
});

test('LLM wording cannot influence deterministic output', () => {
  const rule = VERIFIED_RULE_DEFINITIONS.find(({ logic }) => logic.kind === 'DECLARATION_PRESENCE' && logic.field === 'mrp')!;
  const base = observation('OBSERVED');
  const withWording = { ...base, llmGeneratedExplanation: 'FAIL: definitely illegal' } as typeof base & { llmGeneratedExplanation: string };
  const first = evaluateObservations([base], [rule])[0];
  const second = evaluateObservations([withWording], [rule])[0];
  assert.equal(second.result, first.result);
  assert.equal(second.reason, first.reason);
});

test('canonical result uses deterministic precedence and contains only evaluator output', () => {
  const bundle = evaluateScan('scan-1', [observation('NOT_DETECTED')], [VERIFIED_RULE_DEFINITIONS.find(({ logic }) => logic.kind === 'DECLARATION_PRESENCE' && logic.field === 'mrp')!], now);
  assert.equal(bundle.canonicalResult.overallResult, 'FAIL');
  assert.equal(bundle.canonicalResult.source, 'DETERMINISTIC_RULE_ENGINE');
});
