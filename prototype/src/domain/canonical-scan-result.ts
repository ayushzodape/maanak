import {
  assertNonEmpty,
  assertTimestamp,
  DomainValidationError,
  ISODateTime,
} from './common';
import { ComplianceResult, Evaluation, createEvaluation } from './evaluation';

export interface CanonicalScanResult {
  readonly scanId: string;
  readonly overallResult: ComplianceResult;
  readonly evaluations: readonly Evaluation[];
  readonly generatedAt: ISODateTime;
  readonly source: 'DETERMINISTIC_RULE_ENGINE';
}

export type CanonicalScanResultInput = CanonicalScanResult;

export function createCanonicalScanResult(input: CanonicalScanResultInput): CanonicalScanResult {
  assertNonEmpty(input.scanId, 'scanId');
  assertTimestamp(input.generatedAt, 'generatedAt');
  if (input.source !== 'DETERMINISTIC_RULE_ENGINE') {
    throw new DomainValidationError('canonical scan results must come from the deterministic rule engine');
  }
  if (input.evaluations.length === 0) {
    throw new DomainValidationError('canonical scan result requires at least one evaluation');
  }
  const evaluations = input.evaluations.map(createEvaluation);
  return Object.freeze({ ...input, evaluations: Object.freeze(evaluations) });
}
