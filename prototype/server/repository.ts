import { createHash } from 'node:crypto';
import { createScan, CanonicalScanResult, ComplianceResult, EvidenceImage, Observation, Scan } from '../src/domain';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface ScanHistoryQuery {
  readonly productName?: string;
  readonly result?: ComplianceResult;
  readonly from?: string;
  readonly to?: string;
}

export interface ScanHistoryEntry {
  readonly scan: Scan;
  readonly result: CanonicalScanResult;
}

export interface ScanRepository {
  create(scan: Scan): Scan;
  getById(id: string): Scan | undefined;
  save(scan: Scan): Scan;
  saveImage(scanId: string, image: EvidenceImage, bytes: Buffer): Scan;
  saveObservations(scanId: string, observations: readonly Observation[]): Scan;
  markError(scanId: string, message: string): Scan;
  getImageBytes(scanId: string, imageId: string): Buffer | undefined;
  saveCanonicalResult(scanId: string, result: CanonicalScanResult): Scan;
  getCanonicalResult(scanId: string): CanonicalScanResult | undefined;
  listCompleted(query?: ScanHistoryQuery): ScanHistoryEntry[];
}

/**
 * Test-friendly in-memory repository. Production uses FileScanRepository.
 */
export class InMemoryScanRepository implements ScanRepository {
  private readonly scans = new Map<string, Scan>();
  private readonly imageBytes = new Map<string, Buffer>();
  private readonly canonicalResults = new Map<string, CanonicalScanResult>();

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

  saveCanonicalResult(scanId: string, result: CanonicalScanResult): Scan {
    const scan = this.getById(scanId);
    if (!scan) throw new Error(`scan does not exist: ${scanId}`);
    if (result.scanId !== scanId) throw new Error('canonical result does not belong to scan');
    const completedAt = result.generatedAt;
    this.canonicalResults.set(scanId, result);
    return this.save(createScan({
      ...scan,
      evaluations: [...result.evaluations],
      processing: { stage: 'COMPLETE', lifecycle: 'COMPLETE' },
      timestamps: { ...scan.timestamps, updatedAt: completedAt, completedAt },
    }));
  }

  getCanonicalResult(scanId: string): CanonicalScanResult | undefined {
    return this.canonicalResults.get(scanId);
  }

  listCompleted(query: ScanHistoryQuery = {}): ScanHistoryEntry[] {
    return [...this.scans.values()]
      .map((scan) => ({ scan, result: this.getCanonicalResult(scan.id) }))
      .filter((entry): entry is ScanHistoryEntry => Boolean(entry.result))
      .filter(({ scan, result }) => matchesHistoryQuery(scan, result, query))
      .sort((left, right) => right.scan.timestamps.createdAt.localeCompare(left.scan.timestamps.createdAt));
  }

  private imageKey(scanId: string, imageId: string): string {
    return `${scanId}:${imageId}`;
  }
}

interface PersistedRepositoryState {
  scans: Scan[];
  canonicalResults: CanonicalScanResult[];
  imageBytes: Record<string, string>;
}

/** Small file-backed repository for local development and the first demo deployment. */
export class FileScanRepository implements ScanRepository {
  private readonly scans = new Map<string, Scan>();
  private readonly imageBytes = new Map<string, Buffer>();
  private readonly canonicalResults = new Map<string, CanonicalScanResult>();

  constructor(private readonly directory: string) {
    mkdirSync(directory, { recursive: true });
    this.load();
  }

  create(scan: Scan): Scan {
    if (this.scans.has(scan.id)) throw new Error(`scan already exists: ${scan.id}`);
    this.scans.set(scan.id, scan);
    this.persist();
    return scan;
  }

  getById(id: string): Scan | undefined { return this.scans.get(id); }

  save(scan: Scan): Scan {
    if (!this.scans.has(scan.id)) throw new Error(`scan does not exist: ${scan.id}`);
    this.scans.set(scan.id, scan);
    this.persist();
    return scan;
  }

  saveImage(scanId: string, image: EvidenceImage, bytes: Buffer): Scan {
    const scan = this.requireScan(scanId);
    if (scan.images.some((existing) => existing.id === image.id)) throw new Error(`image already exists: ${image.id}`);
    this.imageBytes.set(this.imageKey(scanId, image.id), Buffer.from(bytes));
    return this.save(createScan({ ...scan, images: [...scan.images, image], processing: { stage: 'UPLOADING', lifecycle: 'PROCESSING' }, timestamps: { ...scan.timestamps, updatedAt: image.createdAt } }));
  }

  saveObservations(scanId: string, observations: readonly Observation[]): Scan {
    const scan = this.requireScan(scanId);
    return this.save(createScan({ ...scan, observations: [...observations], processing: { stage: 'EXTRACTING', lifecycle: 'PROCESSING' }, timestamps: { ...scan.timestamps, updatedAt: new Date().toISOString() } }));
  }

  markError(scanId: string, message: string): Scan {
    const scan = this.requireScan(scanId);
    return this.save(createScan({ ...scan, processing: { stage: 'ERROR', lifecycle: 'ERROR', errorMessage: message }, timestamps: { ...scan.timestamps, updatedAt: new Date().toISOString() } }));
  }

  getImageBytes(scanId: string, imageId: string): Buffer | undefined {
    const bytes = this.imageBytes.get(this.imageKey(scanId, imageId));
    return bytes ? Buffer.from(bytes) : undefined;
  }

  saveCanonicalResult(scanId: string, result: CanonicalScanResult): Scan {
    const scan = this.requireScan(scanId);
    if (result.scanId !== scanId) throw new Error('canonical result does not belong to scan');
    this.canonicalResults.set(scanId, result);
    return this.save(createScan({ ...scan, evaluations: [...result.evaluations], processing: { stage: 'COMPLETE', lifecycle: 'COMPLETE' }, timestamps: { ...scan.timestamps, updatedAt: result.generatedAt, completedAt: result.generatedAt } }));
  }

  getCanonicalResult(scanId: string): CanonicalScanResult | undefined { return this.canonicalResults.get(scanId); }

  listCompleted(query: ScanHistoryQuery = {}): ScanHistoryEntry[] {
    return [...this.scans.values()]
      .map((scan) => ({ scan, result: this.getCanonicalResult(scan.id) }))
      .filter((entry): entry is ScanHistoryEntry => Boolean(entry.result))
      .filter(({ scan, result }) => matchesHistoryQuery(scan, result, query))
      .sort((left, right) => right.scan.timestamps.createdAt.localeCompare(left.scan.timestamps.createdAt));
  }

  private requireScan(id: string): Scan { const scan = this.getById(id); if (!scan) throw new Error(`scan does not exist: ${id}`); return scan; }
  private imageKey(scanId: string, imageId: string): string { return `${scanId}:${imageId}`; }
  private statePath(): string { return join(this.directory, 'scans.json'); }
  private persist(): void {
    const state: PersistedRepositoryState = {
      scans: [...this.scans.values()],
      canonicalResults: [...this.canonicalResults.values()],
      imageBytes: Object.fromEntries([...this.imageBytes.entries()].map(([key, bytes]) => [key, bytes.toString('base64')])),
    };
    const tempPath = `${this.statePath()}.tmp`;
    writeFileSync(tempPath, JSON.stringify(state), 'utf8');
    renameSync(tempPath, this.statePath());
  }
  private load(): void {
    if (!existsSync(this.statePath())) return;
    const state = JSON.parse(readFileSync(this.statePath(), 'utf8')) as PersistedRepositoryState;
    for (const scan of state.scans || []) this.scans.set(scan.id, createScan(scan));
    for (const result of state.canonicalResults || []) this.canonicalResults.set(result.scanId, result);
    for (const [key, encoded] of Object.entries(state.imageBytes || {})) this.imageBytes.set(key, Buffer.from(encoded, 'base64'));
  }
}

function matchesHistoryQuery(scan: Scan, result: CanonicalScanResult, query: ScanHistoryQuery): boolean {
  if (query.productName && !scan.productName.toLocaleLowerCase().includes(query.productName.toLocaleLowerCase())) return false;
  if (query.result && result.overallResult !== query.result) return false;
  const createdAt = Date.parse(scan.timestamps.createdAt);
  if (query.from && createdAt < Date.parse(query.from)) return false;
  if (query.to && createdAt > Date.parse(query.to)) return false;
  return true;
}

export function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}
