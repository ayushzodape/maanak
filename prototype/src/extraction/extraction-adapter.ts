import { EvidenceImage, Observation } from '../domain';

export interface ExtractionAdapter {
  extract(image: EvidenceImage): Promise<Observation[]>;
}

export class ExtractionError extends Error {
  readonly code = 'EXTRACTION_FAILED';

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'ExtractionError';
  }
}
