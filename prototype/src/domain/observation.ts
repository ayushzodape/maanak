import {
  assertConfidence,
  assertEvidenceReference,
  assertNonEmpty,
  assertTimestamp,
  DomainValidationError,
  EvidenceReference,
  ISODateTime,
} from './common';

export const OBSERVATION_STATUSES = [
  'OBSERVED',
  'NOT_DETECTED',
  'UNCERTAIN',
  'NOT_VISIBLE',
  'NOT_MEASURABLE',
] as const;

export type ObservationStatus = (typeof OBSERVATION_STATUSES)[number];

export interface Observation {
  readonly id: string;
  readonly field: string;
  readonly value: unknown;
  readonly unit?: string;
  readonly confidence: number;
  readonly status: ObservationStatus;
  readonly evidence: EvidenceReference | null;
  readonly extractionMethod: string;
  readonly observedAt: ISODateTime;
}

export type ObservationInput = Observation;

function hasLegalResultKey(input: object): boolean {
  return Object.prototype.hasOwnProperty.call(input, 'result') ||
    Object.prototype.hasOwnProperty.call(input, 'complianceResult');
}

export function createObservation(input: ObservationInput): Observation {
  assertNonEmpty(input.id, 'id');
  assertNonEmpty(input.field, 'field');
  assertNonEmpty(input.extractionMethod, 'extractionMethod');
  assertConfidence(input.confidence);
  assertTimestamp(input.observedAt, 'observedAt');

  if (!OBSERVATION_STATUSES.includes(input.status)) {
    throw new DomainValidationError(`unsupported observation status: ${String(input.status)}`);
  }
  if (hasLegalResultKey(input)) {
    throw new DomainValidationError('observations cannot contain a legal compliance result');
  }

  assertEvidenceReference(input.evidence, input.status === 'OBSERVED');
  if (input.unit !== undefined) {
    assertNonEmpty(input.unit, 'unit');
  }
  return Object.freeze({ ...input });
}
