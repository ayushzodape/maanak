import assert from 'node:assert/strict';
import test from 'node:test';
import { createEvaluation, createObservation, createRule } from '../domain';
import { createEvidenceBackedExplanation } from './evidence-backed-explanation';

const now = '2026-09-06T12:00:00.000Z';
const rule = createRule({
  id: 'rule-mrp',
  title: 'Maximum retail price declaration',
  source: 'Verified rule source',
  sourceVersion: 'rules-v1',
  effectiveFrom: null,
  verifiedOn: now,
  verificationStatus: 'VERIFIED',
  logic: { kind: 'DECLARATION_PRESENCE', field: 'mrp' },
  knownGaps: ['Context-specific applicability is not encoded.'],
});
const observation = createObservation({
  id: 'observation-mrp',
  field: 'mrp',
  value: 120,
  unit: 'INR',
  confidence: 0.94,
  status: 'OBSERVED',
  evidence: { imageId: 'image-1', sourceImage: { storageKey: 'scans/scan-1/source.jpg' } },
  extractionMethod: 'VISION_EXTRACTION',
  observedAt: now,
});
const evaluation = createEvaluation({
  id: 'evaluation-mrp',
  ruleId: rule.id,
  ruleVersion: rule.sourceVersion,
  observationId: observation.id,
  result: 'PASS',
  observationConfidence: observation.confidence,
  observedValue: observation.value,
  reason: 'Observed in source evidence.',
  evidence: observation.evidence,
  evaluatedAt: now,
});

test('creates a plain-language explanation grounded in result, rule, observation, evidence, and limitations', () => {
  const explanation = createEvidenceBackedExplanation({
    evaluation,
    rule,
    observation,
    knownLimitations: [...rule.knownGaps],
  });

  assert.equal(explanation.result, evaluation.result);
  assert.equal(explanation.ruleId, evaluation.ruleId);
  assert.equal(explanation.observationConfidence, evaluation.observationConfidence);
  assert.deepEqual(explanation.evidence, evaluation.evidence);
  assert.match(explanation.text, /Recorded screening result: PASS/);
  assert.match(explanation.text, /Maximum retail price declaration/);
  assert.match(explanation.text, /mrp = 120 INR/);
  assert.match(explanation.text, /source image image-1/);
  assert.match(explanation.text, /Context-specific applicability/);
});

test('does not invent evidence or observation data for an incomplete evaluation', () => {
  const incompleteEvaluation = createEvaluation({
    ...evaluation,
    id: 'evaluation-incomplete',
    observationId: null,
    result: 'UNCERTAIN',
    observationConfidence: null,
    observedValue: undefined,
    reason: 'No traceable evidence.',
    evidence: null,
  });
  const explanation = createEvidenceBackedExplanation({ evaluation: incompleteEvaluation, rule, knownLimitations: [] });

  assert.match(explanation.text, /no observation is linked/);
  assert.match(explanation.text, /no evidence reference is attached/);
  assert.doesNotMatch(explanation.text, /image-1/);
});

test('cannot be used with a different rule, observation, or unsupported language', () => {
  assert.throws(() => createEvidenceBackedExplanation({
    evaluation,
    rule: createRule({ ...rule, id: 'other-rule' }),
    observation,
    knownLimitations: [],
  }), /rule does not match/);
  assert.throws(() => createEvidenceBackedExplanation({
    evaluation,
    rule,
    observation: createObservation({ ...observation, id: 'other-observation' }),
    knownLimitations: [],
  }), /observation does not match/);
  assert.throws(() => createEvidenceBackedExplanation({ evaluation, rule, observation, knownLimitations: [], language: 'hi' as 'en' }), /unsupported explanation language/);
});

test('explanation output cannot change the canonical evaluation result or confidence', () => {
  const before = JSON.stringify(evaluation);
  const explanation = createEvidenceBackedExplanation({ evaluation, rule, observation, knownLimitations: [] });

  assert.equal(JSON.stringify(evaluation), before);
  assert.equal(explanation.result, 'PASS');
  assert.equal(explanation.observationConfidence, 0.94);
  assert.notEqual(explanation.text.includes('FAIL'), true);
});

test('does not expose an evaluation required value as an invented legal requirement', () => {
  const evaluationWithRequiredValue = createEvaluation({
    ...evaluation,
    id: 'evaluation-with-required-value',
    requiredValue: 'invented legal threshold',
  });
  const explanation = createEvidenceBackedExplanation({ evaluation: evaluationWithRequiredValue, rule, observation, knownLimitations: [] });

  assert.doesNotMatch(explanation.text, /invented legal threshold/);
});
