import {
  assertNonEmpty,
  assertTimestamp,
  DomainValidationError,
  ISODateTime,
} from './common';

export type RuleVerificationStatus = 'VERIFIED' | 'UNVERIFIED' | 'BLOCKED';

/**
 * A rule stores provenance and an opaque logic reference only.
 * Legal logic belongs in a separately verified ruleset; this model does not
 * invent or execute a threshold.
 */
export interface Rule {
  readonly id: string;
  readonly title: string;
  readonly source: string;
  readonly sourceVersion: string;
  readonly effectiveFrom: ISODateTime;
  readonly verifiedOn: ISODateTime;
  readonly verificationStatus: RuleVerificationStatus;
  readonly logicReference: string;
  readonly knownGaps: readonly string[];
}

export type RuleInput = Rule;

export function createRule(input: RuleInput): Rule {
  assertNonEmpty(input.id, 'id');
  assertNonEmpty(input.title, 'title');
  assertNonEmpty(input.source, 'source');
  assertNonEmpty(input.sourceVersion, 'sourceVersion');
  assertNonEmpty(input.logicReference, 'logicReference');
  assertTimestamp(input.effectiveFrom, 'effectiveFrom');
  assertTimestamp(input.verifiedOn, 'verifiedOn');
  if (!['VERIFIED', 'UNVERIFIED', 'BLOCKED'].includes(input.verificationStatus)) {
    throw new DomainValidationError(`unsupported rule verification status: ${String(input.verificationStatus)}`);
  }
  if (!Array.isArray(input.knownGaps) || input.knownGaps.some((gap) => typeof gap !== 'string')) {
    throw new DomainValidationError('knownGaps must be an array of strings');
  }
  return Object.freeze({ ...input, knownGaps: Object.freeze([...input.knownGaps]) });
}
