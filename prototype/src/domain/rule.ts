import {
  assertNonEmpty,
  assertTimestamp,
  DomainValidationError,
  ISODateTime,
} from './common';

export type RuleVerificationStatus = 'VERIFIED' | 'UNVERIFIED' | 'BLOCKED';

export type RuleLogic =
  | { readonly kind: 'DECLARATION_PRESENCE'; readonly field: string }
  | { readonly kind: 'CHARACTER_HEIGHT_AREA'; readonly field?: string; readonly fields: { readonly panelArea: string; readonly characterHeight: string; readonly characterWidth: string; readonly markingMethod: string; readonly packageScope: string } }
  | { readonly kind: 'NOT_APPLICABLE'; readonly reason: string; readonly field?: string }
  | { readonly kind: 'BLOCKED'; readonly reason: string; readonly field?: string };

export interface Rule {
  readonly id: string;
  readonly title: string;
  readonly source: string;
  readonly sourceVersion: string;
  readonly effectiveFrom: ISODateTime | null;
  readonly verifiedOn: ISODateTime | null;
  readonly verificationStatus: RuleVerificationStatus;
  readonly logic: RuleLogic;
  readonly knownGaps: readonly string[];
}

export type RuleInput = Rule;

export function createRule(input: RuleInput): Rule {
  assertNonEmpty(input.id, 'id');
  assertNonEmpty(input.title, 'title');
  assertNonEmpty(input.source, 'source');
  assertNonEmpty(input.sourceVersion, 'sourceVersion');
  if (input.effectiveFrom !== null && typeof input.effectiveFrom !== 'string') {
    throw new DomainValidationError('effectiveFrom must be an ISO date-time or null when unresolved');
  }
  if (input.verifiedOn !== null && typeof input.verifiedOn !== 'string') {
    throw new DomainValidationError('verifiedOn must be an ISO date-time or null when unresolved');
  }
  if (input.effectiveFrom !== null) assertTimestamp(input.effectiveFrom, 'effectiveFrom');
  if (input.verifiedOn !== null) assertTimestamp(input.verifiedOn, 'verifiedOn');
  if (!input.logic || !['DECLARATION_PRESENCE', 'CHARACTER_HEIGHT_AREA', 'NOT_APPLICABLE', 'BLOCKED'].includes(input.logic.kind)) {
    throw new DomainValidationError('unsupported rule logic');
  }
  if (input.logic.kind === 'DECLARATION_PRESENCE') assertNonEmpty(input.logic.field, 'logic.field');
  if (input.logic.kind === 'CHARACTER_HEIGHT_AREA') {
    for (const field of Object.values(input.logic.fields)) assertNonEmpty(field, 'logic.fields');
  }
  if (input.logic.kind === 'NOT_APPLICABLE' || input.logic.kind === 'BLOCKED') assertNonEmpty(input.logic.reason, 'logic.reason');
  if (input.logic.kind === 'NOT_APPLICABLE' && input.logic.field !== undefined) assertNonEmpty(input.logic.field, 'logic.field');
  if (input.logic.kind === 'BLOCKED' && input.logic.field !== undefined) assertNonEmpty(input.logic.field, 'logic.field');
  if (!['VERIFIED', 'UNVERIFIED', 'BLOCKED'].includes(input.verificationStatus)) {
    throw new DomainValidationError(`unsupported rule verification status: ${String(input.verificationStatus)}`);
  }
  if (!Array.isArray(input.knownGaps) || input.knownGaps.some((gap) => typeof gap !== 'string')) {
    throw new DomainValidationError('knownGaps must be an array of strings');
  }
  return Object.freeze({ ...input, knownGaps: Object.freeze([...input.knownGaps]) });
}
