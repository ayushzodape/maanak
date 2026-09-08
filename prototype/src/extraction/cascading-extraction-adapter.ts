import { EvidenceImage, Observation } from '../domain';
import { ExtractionAdapter, ExtractionError } from './extraction-adapter';

/**
 * Tries each adapter in order. If the primary fails, falls back to the next.
 * This ensures maximum reliability during demos and live scanning.
 */
export class CascadingExtractionAdapter implements ExtractionAdapter {
  constructor(private readonly adapters: readonly ExtractionAdapter[]) {
    if (adapters.length === 0) throw new Error('CascadingExtractionAdapter requires at least one adapter');
  }

  async extract(image: EvidenceImage): Promise<Observation[]> {
    const errors: string[] = [];

    for (let i = 0; i < this.adapters.length; i++) {
      try {
        return await this.adapters[i].extract(image);
      } catch (error) {
        const message = error instanceof ExtractionError
          ? error.message
          : 'unexpected extraction failure';
        errors.push(`adapter[${i}]: ${message}`);
        console.error(`Extraction adapter[${i}] failed: ${message}`);

        // If this is not the last adapter, continue to the next one
        if (i < this.adapters.length - 1) {
          console.log(`Falling back to extraction adapter[${i + 1}]...`);
          continue;
        }
      }
    }

    throw new ExtractionError(`All extraction adapters failed: ${errors.join('; ')}`);
  }
}
