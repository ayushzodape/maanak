export type ISODateTime = string;

export interface BoundingBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface EvidenceReference {
  readonly imageId: string;
  readonly boundingBox?: BoundingBox;
  readonly sourceImage?: {
    readonly storageKey: string;
  };
}

export class DomainValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainValidationError';
  }
}

export function assertNonEmpty(value: string, fieldName: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new DomainValidationError(`${fieldName} must be a non-empty string`);
  }
}

export function assertConfidence(value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new DomainValidationError('confidence must be a number between 0 and 1');
  }
}

export function assertTimestamp(value: ISODateTime, fieldName: string): void {
  assertNonEmpty(value, fieldName);
  if (Number.isNaN(Date.parse(value))) {
    throw new DomainValidationError(`${fieldName} must be a valid ISO date-time`);
  }
}

export function assertBoundingBox(box: BoundingBox): void {
  const values = [box.x, box.y, box.width, box.height];
  if (values.some((value) => !Number.isFinite(value) || value < 0 || value > 1)) {
    throw new DomainValidationError('boundingBox values must be normalized numbers between 0 and 1');
  }
  if (box.width === 0 || box.height === 0) {
    throw new DomainValidationError('boundingBox width and height must be greater than 0');
  }
}

export function assertEvidenceReference(reference: EvidenceReference | null, required: boolean): void {
  if (reference === null) {
    if (required) {
      throw new DomainValidationError('evidence reference is required for this record');
    }
    return;
  }

  assertNonEmpty(reference.imageId, 'evidence.imageId');
  if (reference.sourceImage) {
    assertNonEmpty(reference.sourceImage.storageKey, 'evidence.sourceImage.storageKey');
  }
  if (reference.boundingBox) {
    assertBoundingBox(reference.boundingBox);
  }
}
