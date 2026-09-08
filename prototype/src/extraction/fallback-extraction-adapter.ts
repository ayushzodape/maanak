import { EvidenceImage, Observation } from '../domain';
import { ExtractionAdapter, ExtractionError } from './extraction-adapter';

export class FallbackExtractionAdapter implements ExtractionAdapter {
  constructor(
    private readonly primary: ExtractionAdapter,
    private readonly fallback: ExtractionAdapter
  ) {}

  async extract(image: EvidenceImage): Promise<Observation[]> {
    try {
      return await this.primary.extract(image);
    } catch (error) {
      if (error instanceof ExtractionError) {
        try {
          return await this.fallback.extract(image);
        } catch (fallbackError) {
          const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
          error.message = `${error.message} (note: fallback also failed: ${fallbackMsg})`;
          throw error;
        }
      }
      throw error;
    }
  }
}
