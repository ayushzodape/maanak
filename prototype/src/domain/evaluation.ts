import {
  assertConfidence,
  assertEvidenceReference,
  assertNonEmpty,
  assertTimestamp,
  DomainValidationError,
  EvidenceReference,
  ISODateTime,
} from './common';

export const COMPLIANCE_RESULTS = [
  'PASS',
  'FAIL',
  'UNCERTAIN',
  'NOT_APPLICABLE',
  'NOT_MEASURABLE',
] as const;

export type ComplianceResult = (typeof COMPLIANCE_RESULTS)[number];

export interface Evaluation {
  readonly id: string;
  readonly ruleId: string;
  readonly ruleVersion: string;
  readonly observationId: string | null;
  readonly result: ComplianceResult;
  readonly observationConfidence: number | null;
  readonly observedValue?: unknown;
  readonly requiredValue?: unknown;
  readonly reason: string;
  readonly evidence: EvidenceReference | null;
  readonly evaluatedAt: ISODateTime;
}

export type EvaluationInput = Evaluation;

export function createEvaluation(input: EvaluationInput): Evaluation {
  assertNonEmpty(input.id, 'id');
  assertNonEmpty(input.ruleId, 'ruleId');
  assertNonEmpty(input.ruleVersion, 'ruleVersion');
  assertNonEmpty(input.reason, 'reason');
  assertTimestamp(input.evaluatedAt, 'evaluatedAt');
  if (!COMPLIANCE_RESULTS.includes(input.result)) {
    throw new DomainValidationError(`unsupported compliance result: ${String(input.result)}`);
  }
  if (input.observationId !== null) {
    assertNonEmpty(input.observationId, 'observationId');
  }
  if (input.observationConfidence !== null) {
    assertConfidence(input.observationConfidence);
  }
  assertEvidenceReference(input.evidence, input.result === 'PASS' || input.result === 'FAIL');
  return Object.freeze({ ...input });
}
