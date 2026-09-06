import {
  assertNonEmpty,
  assertTimestamp,
  DomainValidationError,
  ISODateTime,
} from './common';

export type EvidenceImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

export interface EvidenceImage {
  readonly id: string;
  readonly storageKey: string;
  readonly mimeType: EvidenceImageMimeType;
  readonly byteSize: number;
  readonly sha256: string;
  readonly width?: number;
  readonly height?: number;
  readonly capturedAt: ISODateTime;
  readonly createdAt: ISODateTime;
}

export type EvidenceImageInput = EvidenceImage;

export function createEvidenceImage(input: EvidenceImageInput): EvidenceImage {
  assertNonEmpty(input.id, 'id');
  assertNonEmpty(input.storageKey, 'storageKey');
  assertNonEmpty(input.sha256, 'sha256');
  if (!Number.isInteger(input.byteSize) || input.byteSize <= 0) {
    throw new DomainValidationError('byteSize must be a positive integer');
  }
  if (input.width !== undefined && (!Number.isInteger(input.width) || input.width <= 0)) {
    throw new DomainValidationError('width must be a positive integer when provided');
  }
  if (input.height !== undefined && (!Number.isInteger(input.height) || input.height <= 0)) {
    throw new DomainValidationError('height must be a positive integer when provided');
  }
  assertTimestamp(input.capturedAt, 'capturedAt');
  assertTimestamp(input.createdAt, 'createdAt');
  return Object.freeze({ ...input });
}
