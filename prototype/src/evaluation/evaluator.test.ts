import assert from 'node:assert/strict';
import test from 'node:test';
import { createEvidenceImage, createObservation } from '../domain';
import { BLOCKED_RULE_7, CURRENT_RULE_DEFINITIONS, RULE_7, VERIFIED_RULE_DEFINITIONS } from './rule-definitions';
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

test('prioritizes OBSERVED observations when multiple observations exist for the same field across images', () => {
  const rule = VERIFIED_RULE_DEFINITIONS.find(({ logic }) => logic.kind === 'DECLARATION_PRESENCE' && logic.field === 'mrp')!;
  const obs1 = createObservation({ id: 'obs-mrp-1', field: 'mrp', value: null, confidence: 0, status: 'NOT_DETECTED', evidence: null, extractionMethod: 'TEST', observedAt: now });
  const obs2 = createObservation({ id: 'obs-mrp-2', field: 'mrp', value: '185', confidence: 0.95, status: 'OBSERVED', evidence, extractionMethod: 'TEST', observedAt: now });

  const result = evaluateObservations([obs1, obs2], [rule])[0];
  assert.equal(result.result, 'PASS');
  assert.equal(result.observationId, 'obs-mrp-2');
});

test('returns UNCERTAIN when multiple images yield conflicting OBSERVED facts', () => {
  const rule = VERIFIED_RULE_DEFINITIONS.find(({ logic }) => logic.kind === 'DECLARATION_PRESENCE' && logic.field === 'mrp')!;
  const obs1 = createObservation({ id: 'obs-mrp-1', field: 'mrp', value: '100', confidence: 0.95, status: 'OBSERVED', evidence, extractionMethod: 'TEST', observedAt: now });
  const obs2 = createObservation({ id: 'obs-mrp-2', field: 'mrp', value: '200', confidence: 0.96, status: 'OBSERVED', evidence, extractionMethod: 'TEST', observedAt: now });

  const result = evaluateObservations([obs1, obs2], [rule])[0];
  assert.equal(result.result, 'UNCERTAIN');
  assert.match(String(result.reason), /conflict/i);
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

// ---- Rule 7 Live Threshold Tests ----

function rule7Observations(area: number, height: number, width: number, method: string, scope: string | boolean = 'IN_SCOPE') {
  return [
    createObservation({ id: 'obs-area', field: 'principal_display_panel_area_cm2', value: area, confidence: 0.95, status: 'OBSERVED', evidence, extractionMethod: 'VISION_EXTRACTION', observedAt: now }),
    createObservation({ id: 'obs-height', field: 'character_height_mm', value: height, confidence: 0.95, status: 'OBSERVED', evidence, extractionMethod: 'VISION_EXTRACTION', observedAt: now }),
    createObservation({ id: 'obs-width', field: 'character_width_mm', value: width, confidence: 0.95, status: 'OBSERVED', evidence, extractionMethod: 'VISION_EXTRACTION', observedAt: now }),
    createObservation({ id: 'obs-method', field: 'container_marking_method', value: method, confidence: 0.95, status: 'OBSERVED', evidence, extractionMethod: 'VISION_EXTRACTION', observedAt: now }),
    createObservation({ id: 'obs-scope', field: 'package_scope', value: scope, confidence: 0.95, status: 'OBSERVED', evidence, extractionMethod: 'VISION_EXTRACTION', observedAt: now }),
  ];
}

test('Rule 7 tier 1: area < 50 cm² requires 1.0 mm standard, 1.5 mm blown', () => {
  // Standard container at 30 cm² with 1.0 mm height passes
  assert.equal(evaluateObservations(rule7Observations(30, 1.0, 0.5, 'NORMAL'), [RULE_7])[0].result, 'PASS');
  // Standard container at 30 cm² with 0.9 mm height fails
  assert.equal(evaluateObservations(rule7Observations(30, 0.9, 0.5, 'NORMAL'), [RULE_7])[0].result, 'FAIL');
  // Blown container at 30 cm² requires 1.5 mm
  assert.equal(evaluateObservations(rule7Observations(30, 1.5, 0.6, 'BLOWN'), [RULE_7])[0].result, 'PASS');
  assert.equal(evaluateObservations(rule7Observations(30, 1.4, 0.6, 'BLOWN'), [RULE_7])[0].result, 'FAIL');
});

test('Rule 7 tier 2: 50 ≤ area < 100 cm² requires 1.5 mm standard, 3.0 mm blown', () => {
  assert.equal(evaluateObservations(rule7Observations(75, 1.5, 0.6, 'NORMAL'), [RULE_7])[0].result, 'PASS');
  assert.equal(evaluateObservations(rule7Observations(75, 1.4, 0.6, 'NORMAL'), [RULE_7])[0].result, 'FAIL');
  assert.equal(evaluateObservations(rule7Observations(75, 3.0, 1.1, 'MOULDED'), [RULE_7])[0].result, 'PASS');
  assert.equal(evaluateObservations(rule7Observations(75, 2.9, 1.1, 'MOULDED'), [RULE_7])[0].result, 'FAIL');
});

test('Rule 7 tier 3: 100 ≤ area < 500 cm² requires 2.5 mm standard, 4.0 mm blown', () => {
  assert.equal(evaluateObservations(rule7Observations(250, 2.5, 1.0, 'NORMAL'), [RULE_7])[0].result, 'PASS');
  assert.equal(evaluateObservations(rule7Observations(250, 2.4, 1.0, 'NORMAL'), [RULE_7])[0].result, 'FAIL');
  assert.equal(evaluateObservations(rule7Observations(250, 4.0, 1.5, 'EMBOSSED'), [RULE_7])[0].result, 'PASS');
  assert.equal(evaluateObservations(rule7Observations(250, 3.9, 1.5, 'EMBOSSED'), [RULE_7])[0].result, 'FAIL');
});

test('Rule 7 tier 4: 500 ≤ area < 2500 cm² requires 4.0 mm standard, 6.0 mm blown', () => {
  assert.equal(evaluateObservations(rule7Observations(1000, 4.0, 1.5, 'NORMAL'), [RULE_7])[0].result, 'PASS');
  assert.equal(evaluateObservations(rule7Observations(1000, 3.9, 1.5, 'NORMAL'), [RULE_7])[0].result, 'FAIL');
  assert.equal(evaluateObservations(rule7Observations(1000, 6.0, 2.1, 'FORMED'), [RULE_7])[0].result, 'PASS');
  assert.equal(evaluateObservations(rule7Observations(1000, 5.9, 2.1, 'FORMED'), [RULE_7])[0].result, 'FAIL');
});

test('Rule 7 tier 5: area ≥ 2500 cm² requires 6.0 mm for both standard and blown', () => {
  assert.equal(evaluateObservations(rule7Observations(3000, 6.0, 2.1, 'NORMAL'), [RULE_7])[0].result, 'PASS');
  assert.equal(evaluateObservations(rule7Observations(3000, 5.9, 2.1, 'NORMAL'), [RULE_7])[0].result, 'FAIL');
  assert.equal(evaluateObservations(rule7Observations(5000, 6.0, 2.1, 'PERFORATED'), [RULE_7])[0].result, 'PASS');
});

test('Rule 7(3): character width must be ≥ height / 3', () => {
  // Height 3.0 mm, width must be >= 1.0 mm. Width 0.9 fails.
  assert.equal(evaluateObservations(rule7Observations(250, 3.0, 0.9, 'NORMAL'), [RULE_7])[0].result, 'FAIL');
  // Width exactly 1.0 passes
  assert.equal(evaluateObservations(rule7Observations(250, 3.0, 1.0, 'NORMAL'), [RULE_7])[0].result, 'PASS');
});

test('Rule 7 returns NOT_APPLICABLE when package scope is OUT_OF_SCOPE', () => {
  assert.equal(evaluateObservations(rule7Observations(100, 2.5, 1.0, 'NORMAL', 'OUT_OF_SCOPE'), [RULE_7])[0].result, 'NOT_APPLICABLE');
});

test('Rule 7 properly uses multi-observation priority across fields', () => {
  // Give an array of observations where the first one is NOT_DETECTED but a later one is OBSERVED
  const areaNotDetected = createObservation({ id: 'obs-area-1', field: 'principal_display_panel_area_cm2', value: null, confidence: 0.95, status: 'NOT_DETECTED', evidence, extractionMethod: 'VISION', observedAt: now });
  const areaObserved = createObservation({ id: 'obs-area-2', field: 'principal_display_panel_area_cm2', value: 250, confidence: 0.95, status: 'OBSERVED', evidence, extractionMethod: 'VISION', observedAt: now });
  
  const obs = [
    areaNotDetected, // This should be ignored by selectBestObservation
    areaObserved,    // This should be picked
    createObservation({ id: 'obs-height', field: 'character_height_mm', value: 3.0, confidence: 0.95, status: 'OBSERVED', evidence, extractionMethod: 'VISION', observedAt: now }),
    createObservation({ id: 'obs-width', field: 'character_width_mm', value: 1.0, confidence: 0.95, status: 'OBSERVED', evidence, extractionMethod: 'VISION', observedAt: now }),
    createObservation({ id: 'obs-method', field: 'container_marking_method', value: 'NORMAL', confidence: 0.95, status: 'OBSERVED', evidence, extractionMethod: 'VISION', observedAt: now }),
    createObservation({ id: 'obs-scope', field: 'package_scope', value: 'IN_SCOPE', confidence: 0.95, status: 'OBSERVED', evidence, extractionMethod: 'VISION', observedAt: now }),
  ];
  
  assert.equal(evaluateObservations(obs, [RULE_7])[0].result, 'PASS');
});

test('Rule 7 returns NOT_MEASURABLE when measurements are NOT_MEASURABLE', () => {
  const obs = [
    createObservation({ id: 'obs-area', field: 'principal_display_panel_area_cm2', value: null, confidence: 0.5, status: 'NOT_MEASURABLE', evidence, extractionMethod: 'VISION_EXTRACTION', observedAt: now }),
    createObservation({ id: 'obs-height', field: 'character_height_mm', value: null, confidence: 0.5, status: 'NOT_MEASURABLE', evidence, extractionMethod: 'VISION_EXTRACTION', observedAt: now }),
    createObservation({ id: 'obs-width', field: 'character_width_mm', value: null, confidence: 0.5, status: 'NOT_MEASURABLE', evidence, extractionMethod: 'VISION_EXTRACTION', observedAt: now }),
    createObservation({ id: 'obs-method', field: 'container_marking_method', value: null, confidence: 0.5, status: 'NOT_MEASURABLE', evidence, extractionMethod: 'VISION_EXTRACTION', observedAt: now }),
    createObservation({ id: 'obs-scope', field: 'package_scope', value: 'IN_SCOPE', confidence: 0.95, status: 'OBSERVED', evidence, extractionMethod: 'VISION_EXTRACTION', observedAt: now }),
  ];
  assert.equal(evaluateObservations(obs, [RULE_7])[0].result, 'NOT_MEASURABLE');
});

test('SMALL_SACHET commodity category deterministically exempts MRP, consumer care, mfg date, and Rule 7', () => {
  // Empty observations - normally MRP, consumer care, mfg date would be UNCERTAIN or FAIL
  const evaluations = evaluateObservations([], CURRENT_RULE_DEFINITIONS, 'SMALL_SACHET');
  
  const mrpEval = evaluations.find(e => e.ruleId === 'LMPC_RULE_6_MRP')!;
  assert.equal(mrpEval.result, 'NOT_APPLICABLE');
  assert.match(mrpEval.reason, /Rule 26\(a\)/);

  const careEval = evaluations.find(e => e.ruleId === 'LMPC_RULE_6_CONSUMER_CARE')!;
  assert.equal(careEval.result, 'NOT_APPLICABLE');
  assert.match(careEval.reason, /Rule 26\(a\)/);

  const dateEval = evaluations.find(e => e.ruleId === 'LMPC_RULE_6_PACKING_DATE')!;
  assert.equal(dateEval.result, 'NOT_APPLICABLE');
  assert.match(dateEval.reason, /Rule 26\(a\)/);

  const rule7Eval = evaluations.find(e => e.ruleId === 'LMPC_RULE_7_CHARACTER_HEIGHT')!;
  assert.equal(rule7Eval.result, 'NOT_APPLICABLE');

  // Manufacturer and Net Quantity still apply and remain UNCERTAIN since no observations supplied
  const mfgEval = evaluations.find(e => e.ruleId === 'LMPC_RULE_6_MANUFACTURER')!;
  assert.equal(mfgEval.result, 'UNCERTAIN');
});

test('INDUSTRIAL_BULK commodity category deterministically exempts retail MRP and consumer care under Rule 3', () => {
  const evaluations = evaluateObservations([], CURRENT_RULE_DEFINITIONS, 'INDUSTRIAL_BULK');

  const mrpEval = evaluations.find(e => e.ruleId === 'LMPC_RULE_6_MRP')!;
  assert.equal(mrpEval.result, 'NOT_APPLICABLE');
  assert.match(mrpEval.reason, /Rule 3/);

  const careEval = evaluations.find(e => e.ruleId === 'LMPC_RULE_6_CONSUMER_CARE')!;
  assert.equal(careEval.result, 'NOT_APPLICABLE');
  assert.match(careEval.reason, /Rule 3/);
});

test('GENERAL_RETAIL commodity category requires all standard declarations', () => {
  const evaluations = evaluateObservations([], CURRENT_RULE_DEFINITIONS, 'GENERAL_RETAIL');
  const mrpEval = evaluations.find(e => e.ruleId === 'LMPC_RULE_6_MRP')!;
  assert.notEqual(mrpEval.result, 'NOT_APPLICABLE');
});
