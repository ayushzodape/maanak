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

/**
 * Used for live scans until an approved vision provider is connected.
 * It fails explicitly so a live image cannot receive demo observations.
 */
export class UnavailableExtractionAdapter implements ExtractionAdapter {
  async extract(_image: EvidenceImage): Promise<Observation[]> {
    throw new ExtractionError('live extraction provider is not configured');
  }
}
