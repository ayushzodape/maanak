import { EvidenceImage, ObservationStatus, createObservation } from '../domain';
import { ExtractionAdapter, ExtractionError } from './extraction-adapter';

export interface LocalObservationSpec {
  readonly id: string;
  readonly field: string;
  readonly value: unknown;
  readonly unit?: string;
  readonly confidence: number;
  readonly status: ObservationStatus;
  readonly boundingBox?: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
  readonly extractionMethod?: string;
  readonly observedAt?: string;
}

export type LocalExtractionPlan = readonly LocalObservationSpec[] | Error;

/**
 * Explicitly fixture-driven adapter. It models the extraction boundary without
 * pretending to inspect pixels and never produces a compliance result.
 */
export class MockLocalExtractionAdapter implements ExtractionAdapter {
  constructor(private readonly plan: LocalExtractionPlan) {}

  async extract(image: EvidenceImage) {
    if (this.plan instanceof Error) {
      throw new ExtractionError('local extraction fixture failed', { cause: this.plan });
    }

    try {
      return this.plan.map((spec) => createObservation({
        id: spec.id,
        field: spec.field,
        value: spec.value,
        unit: spec.unit,
        confidence: spec.confidence,
        status: spec.status,
        evidence: {
          imageId: image.id,
          sourceImage: { storageKey: image.storageKey },
          ...(spec.boundingBox ? { boundingBox: spec.boundingBox } : {}),
        },
        extractionMethod: spec.extractionMethod || 'MOCK_LOCAL_FIXTURE',
        observedAt: spec.observedAt || new Date().toISOString(),
      }));
    } catch (error) {
      if (error instanceof ExtractionError) throw error;
      throw new ExtractionError('local extraction fixture was invalid', { cause: error });
    }
  }
}
