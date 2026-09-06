import {
  assertBoundingBox,
  assertConfidence,
  assertNonEmpty,
  assertTimestamp,
  BoundingBox,
  createObservation,
  DomainValidationError,
  EvidenceImage,
  Observation,
} from '../domain';

export const BARCODE_SCALE_ESTIMATE_KIND = 'BARCODE_SCALE_ESTIMATE' as const;
export const BARCODE_SCALE_ESTIMATE_LABEL = 'SCREENING ESTIMATE' as const;

export type BarcodeFormat = 'EAN_13' | 'UPC_A';
const BARCODE_FORMATS = ['EAN_13', 'UPC_A'] as const;

export interface BarcodeScaleEstimationInput {
  readonly id: string;
  readonly image: Pick<EvidenceImage, 'id' | 'storageKey' | 'width' | 'height'>;
  readonly barcodeFormat: BarcodeFormat;
  readonly boundingBox: BoundingBox | null;
  readonly detectionConfidence: number;
  /** Technical extraction-quality floor, not a legal threshold. */
  readonly minimumDetectionConfidence: number;
  readonly observedAt: string;
}

export interface BarcodeScaleEstimateValue {
  readonly kind: typeof BARCODE_SCALE_ESTIMATE_KIND;
  readonly label: typeof BARCODE_SCALE_ESTIMATE_LABEL;
  readonly barcodeFormat: BarcodeFormat;
  readonly reference: {
    readonly nominalWidthMm: 37.29;
    readonly nominalHeightMm: 25.93;
    readonly basis: 'GS1_NOMINAL_REFERENCE';
  };
  readonly estimatedScale: {
    readonly pixelsPerMillimetreX: number;
    readonly pixelsPerMillimetreY: number;
  } | null;
  readonly assumptions: readonly string[];
  readonly limitations: readonly string[];
  readonly note: string;
}

const REFERENCE = {
  nominalWidthMm: 37.29,
  nominalHeightMm: 25.93,
  basis: 'GS1_NOMINAL_REFERENCE',
} as const;

const ASSUMPTIONS = [
  'The detected symbol is an EAN-13 or UPC-A barcode.',
  'The bounding box covers the printed barcode region in the source image.',
  'The barcode orientation matches the nominal reference axes used for this estimate.',
  'The image dimensions and detected region are sufficient for a screening estimate.',
] as const;

const LIMITATIONS = [
  'This is a screening estimate, not a certified measurement.',
  'Printed barcode magnification may differ from the nominal reference size.',
  'Orientation and perspective correction are not performed by this boundary; lens distortion, blur, glare, and cropping can change the estimate.',
  'This estimate must not be used as a legal fact or statutory verdict by itself.',
] as const;

/**
 * Converts an extractor-supplied barcode detection into an observation.
 *
 * This function performs no legal evaluation and is intentionally not imported
 * by the deterministic evaluator. A missing usable region is represented as
 * NOT_MEASURABLE; a detected but low-confidence region is UNCERTAIN.
 */
export function createBarcodeScaleObservation(input: BarcodeScaleEstimationInput): Observation {
  assertNonEmpty(input.id, 'id');
  assertNonEmpty(input.image.id, 'image.id');
  assertNonEmpty(input.image.storageKey, 'image.storageKey');
  if (!BARCODE_FORMATS.includes(input.barcodeFormat)) {
    throw new DomainValidationError(`unsupported barcode format: ${String(input.barcodeFormat)}`);
  }
  assertTimestamp(input.observedAt, 'observedAt');
  assertConfidence(input.detectionConfidence);
  assertConfidence(input.minimumDetectionConfidence);

  const geometryIsUsable = typeof input.image.width === 'number' && Number.isInteger(input.image.width) && input.image.width > 0 &&
    typeof input.image.height === 'number' && Number.isInteger(input.image.height) && input.image.height > 0 &&
    hasUsableBoundingBox(input.boundingBox);
  const confidenceIsUsable = input.detectionConfidence >= input.minimumDetectionConfidence;
  const status = !geometryIsUsable
    ? 'NOT_MEASURABLE' as const
    : !confidenceIsUsable
      ? 'UNCERTAIN' as const
      : 'OBSERVED' as const;

  const estimatedScale = status === 'OBSERVED' && input.boundingBox && input.image.width && input.image.height
    ? {
      pixelsPerMillimetreX: (input.boundingBox.width * input.image.width) / REFERENCE.nominalWidthMm,
      pixelsPerMillimetreY: (input.boundingBox.height * input.image.height) / REFERENCE.nominalHeightMm,
    }
    : null;

  const value: BarcodeScaleEstimateValue = {
    kind: BARCODE_SCALE_ESTIMATE_KIND,
    label: BARCODE_SCALE_ESTIMATE_LABEL,
    barcodeFormat: input.barcodeFormat,
    reference: REFERENCE,
    estimatedScale,
    assumptions: ASSUMPTIONS,
    limitations: LIMITATIONS,
    note: status === 'OBSERVED'
      ? 'Use only as an approximate scale reference for screening.'
      : status === 'UNCERTAIN'
        ? 'Barcode evidence was detected but is not confident enough for a scale estimate.'
        : 'No usable barcode geometry is available for a scale estimate.',
  };

  return createObservation({
    id: input.id,
    field: 'barcode_scale_reference',
    value,
    confidence: input.detectionConfidence,
    status,
    evidence: {
      imageId: input.image.id,
      sourceImage: { storageKey: input.image.storageKey },
      ...(input.boundingBox && geometryIsUsable ? { boundingBox: input.boundingBox } : {}),
    },
    extractionMethod: 'BARCODE_SCALE_ESTIMATION',
    observedAt: input.observedAt,
  });
}

export function isBarcodeScaleEstimateValue(value: unknown): value is BarcodeScaleEstimateValue {
  return typeof value === 'object' && value !== null &&
    (value as { kind?: unknown }).kind === BARCODE_SCALE_ESTIMATE_KIND;
}

export function formatBarcodeScaleEstimate(value: BarcodeScaleEstimateValue): string {
  if (!value.estimatedScale) {
    return `${value.label}: unavailable (${value.note})`;
  }

  return `${value.label}: approximate scale ${value.estimatedScale.pixelsPerMillimetreX.toFixed(2)} × ${value.estimatedScale.pixelsPerMillimetreY.toFixed(2)} px/mm; not certified`;
}

function hasUsableBoundingBox(box: BoundingBox | null): box is BoundingBox {
  if (!box) return false;
  if (box.x + box.width > 1 || box.y + box.height > 1) return false;
  try {
    assertBoundingBox(box);
    return true;
  } catch {
    return false;
  }
}
