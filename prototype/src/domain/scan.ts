import {
  assertNonEmpty,
  assertTimestamp,
  DomainValidationError,
  ISODateTime,
} from './common';
import { EvidenceImage } from './evidence-image';
import { Evaluation } from './evaluation';
import { Observation } from './observation';

export const SOURCE_TYPES = ['PHYSICAL_PHOTO', 'ECOMMERCE_LISTING'] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const SCAN_PROCESSING_STAGES = [
  'IDLE',
  'CAPTURING',
  'UPLOADING',
  'ANALYZING',
  'EXTRACTING',
  'EVALUATING',
  'GENERATING_REPORT',
  'COMPLETE',
  'ERROR',
  'UNCERTAIN',
  'NOT_MEASURABLE',
] as const;
export type ScanProcessingStage = (typeof SCAN_PROCESSING_STAGES)[number];

export type ScanLifecycleStatus = 'DRAFT' | 'PROCESSING' | 'COMPLETE' | 'ERROR';

export interface ScanProcessingMetadata {
  readonly stage: ScanProcessingStage;
  readonly lifecycle: ScanLifecycleStatus;
  readonly errorMessage?: string;
}

export interface ScanTimestamps {
  readonly createdAt: ISODateTime;
  readonly updatedAt: ISODateTime;
  readonly completedAt?: ISODateTime;
}

export interface Scan {
  readonly id: string;
  readonly productName: string;
  readonly sourceType: SourceType;
  readonly images: readonly EvidenceImage[];
  readonly observations: readonly Observation[];
  readonly evaluations: readonly Evaluation[];
  readonly ruleVersion: string;
  readonly processing: ScanProcessingMetadata;
  readonly timestamps: ScanTimestamps;
}

export type ScanInput = Scan;

export function createScan(input: ScanInput): Scan {
  assertNonEmpty(input.id, 'id');
  assertNonEmpty(input.productName, 'productName');
  assertNonEmpty(input.ruleVersion, 'ruleVersion');
  if (!SOURCE_TYPES.includes(input.sourceType)) {
    throw new DomainValidationError(`unsupported source type: ${String(input.sourceType)}`);
  }
  if (!SCAN_PROCESSING_STAGES.includes(input.processing.stage)) {
    throw new DomainValidationError(`unsupported processing stage: ${String(input.processing.stage)}`);
  }
  if (!['DRAFT', 'PROCESSING', 'COMPLETE', 'ERROR'].includes(input.processing.lifecycle)) {
    throw new DomainValidationError(`unsupported lifecycle status: ${String(input.processing.lifecycle)}`);
  }
  if (input.processing.lifecycle === 'ERROR' && !input.processing.errorMessage?.trim()) {
    throw new DomainValidationError('errorMessage is required for an errored scan');
  }
  assertTimestamp(input.timestamps.createdAt, 'timestamps.createdAt');
  assertTimestamp(input.timestamps.updatedAt, 'timestamps.updatedAt');
  if (input.timestamps.completedAt) {
    assertTimestamp(input.timestamps.completedAt, 'timestamps.completedAt');
  }
  if (input.processing.lifecycle === 'COMPLETE' && !input.timestamps.completedAt) {
    throw new DomainValidationError('completedAt is required for a complete scan');
  }

  const imageIds = new Set(input.images.map((image) => image.id));
  for (const observation of input.observations) {
    if (observation.evidence && !imageIds.has(observation.evidence.imageId)) {
      throw new DomainValidationError(
        `observation ${observation.id} references unknown evidence image ${observation.evidence.imageId}`,
      );
    }
  }
  for (const evaluation of input.evaluations) {
    if (evaluation.evidence && !imageIds.has(evaluation.evidence.imageId)) {
      throw new DomainValidationError(
        `evaluation ${evaluation.id} references unknown evidence image ${evaluation.evidence.imageId}`,
      );
    }
  }

  const observationIds = new Set(input.observations.map((observation) => observation.id));
  for (const evaluation of input.evaluations) {
    if (evaluation.observationId && !observationIds.has(evaluation.observationId)) {
      throw new DomainValidationError(
        `evaluation ${evaluation.id} references unknown observation ${evaluation.observationId}`,
      );
    }
  }

  return Object.freeze({
    ...input,
    images: Object.freeze([...input.images]),
    observations: Object.freeze([...input.observations]),
    evaluations: Object.freeze([...input.evaluations]),
  });
}
