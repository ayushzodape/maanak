import { createHash } from 'node:crypto';
import { createScan, EvidenceImage, Observation, Scan } from '../src/domain';

export interface ScanRepository {
  create(scan: Scan): Scan;
  getById(id: string): Scan | undefined;
  save(scan: Scan): Scan;
  saveImage(scanId: string, image: EvidenceImage, bytes: Buffer): Scan;
  saveObservations(scanId: string, observations: readonly Observation[]): Scan;
  markError(scanId: string, message: string): Scan;
  getImageBytes(scanId: string, imageId: string): Buffer | undefined;
}

/**
 * Minimal repository for the first API boundary.
 * Persistence is intentionally not claimed yet; this is replaceable storage.
 */
export class InMemoryScanRepository implements ScanRepository {
  private readonly scans = new Map<string, Scan>();
  private readonly imageBytes = new Map<string, Buffer>();

  create(scan: Scan): Scan {
    if (this.scans.has(scan.id)) {
      throw new Error(`scan already exists: ${scan.id}`);
    }
    this.scans.set(scan.id, scan);
    return scan;
  }

  getById(id: string): Scan | undefined {
    return this.scans.get(id);
  }

  save(scan: Scan): Scan {
    if (!this.scans.has(scan.id)) {
      throw new Error(`scan does not exist: ${scan.id}`);
    }
    this.scans.set(scan.id, scan);
    return scan;
  }

  saveImage(scanId: string, image: EvidenceImage, bytes: Buffer): Scan {
    const scan = this.getById(scanId);
    if (!scan) {
      throw new Error(`scan does not exist: ${scanId}`);
    }
    if (scan.images.some((existingImage) => existingImage.id === image.id)) {
      throw new Error(`image already exists: ${image.id}`);
    }
    this.imageBytes.set(this.imageKey(scanId, image.id), Buffer.from(bytes));
    return this.save(createScan({
      ...scan,
      images: [...scan.images, image],
      processing: {
        ...scan.processing,
        stage: 'UPLOADING',
        lifecycle: 'PROCESSING',
        errorMessage: undefined,
      },
      timestamps: {
        ...scan.timestamps,
        updatedAt: image.createdAt,
      },
    }));
  }

  saveObservations(scanId: string, observations: readonly Observation[]): Scan {
    const scan = this.getById(scanId);
    if (!scan) {
      throw new Error(`scan does not exist: ${scanId}`);
    }
    return this.save(createScan({
      ...scan,
      observations: [...observations],
      processing: {
        ...scan.processing,
        stage: 'EXTRACTING',
        lifecycle: 'PROCESSING',
        errorMessage: undefined,
      },
      timestamps: {
        ...scan.timestamps,
        updatedAt: new Date().toISOString(),
      },
    }));
  }

  markError(scanId: string, message: string): Scan {
    const scan = this.getById(scanId);
    if (!scan) {
      throw new Error(`scan does not exist: ${scanId}`);
    }
    return this.save(createScan({
      ...scan,
      processing: { stage: 'ERROR', lifecycle: 'ERROR', errorMessage: message },
      timestamps: { ...scan.timestamps, updatedAt: new Date().toISOString() },
    }));
  }

  getImageBytes(scanId: string, imageId: string): Buffer | undefined {
    const bytes = this.imageBytes.get(this.imageKey(scanId, imageId));
    return bytes ? Buffer.from(bytes) : undefined;
  }

  private imageKey(scanId: string, imageId: string): string {
    return `${scanId}:${imageId}`;
  }
}

export function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}
