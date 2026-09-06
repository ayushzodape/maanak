import { randomUUID } from 'node:crypto';
import express, { NextFunction, Request, Response } from 'express';
import { createEvidenceImage, createScan, DomainValidationError, Scan, ScanMode, SourceType } from '../src/domain';
import { ExtractionAdapter, ExtractionError, UnavailableExtractionAdapter } from '../src/extraction';
import { InMemoryScanRepository, ScanRepository, sha256 } from './repository';

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

interface CreateScanBody {
  productName?: unknown;
  sourceType?: unknown;
  ruleVersion?: unknown;
  mode?: unknown;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

export function createApp(
  repository: ScanRepository = new InMemoryScanRepository(),
  demoExtractionAdapter: ExtractionAdapter = new UnavailableExtractionAdapter(),
  liveExtractionAdapter: ExtractionAdapter = new UnavailableExtractionAdapter(),
): express.Express {
  const app = express();
  app.use(express.json({ limit: '256kb' }));
  app.use(express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: MAX_IMAGE_BYTES }));

  app.post('/scans', (req, res, next) => {
    try {
      const body = req.body as CreateScanBody;
      const productName = requiredString(body?.productName, 'productName');
      const sourceType = requiredSourceType(body?.sourceType);
      const ruleVersion = requiredString(body?.ruleVersion, 'ruleVersion');
      const mode = requiredScanMode(body?.mode);
      const timestamp = new Date().toISOString();
      const scan: Scan = createScan({
        id: `scan_${randomUUID()}`,
        productName,
        sourceType,
        mode,
        images: [],
        observations: [],
        evaluations: [],
        ruleVersion,
        processing: { stage: 'IDLE', lifecycle: 'DRAFT' },
        timestamps: { createdAt: timestamp, updatedAt: timestamp },
      });
      res.status(201).json(repository.create(scan));
    } catch (error) {
      next(error);
    }
  });

  app.post('/scans/:id/images', async (req, res, next) => {
    try {
      const scan = repository.getById(req.params.id);
      if (!scan) {
        res.status(404).json(apiError('SCAN_NOT_FOUND', 'scan was not found'));
        return;
      }

      const mimeType = req.header('content-type')?.split(';', 1)[0].trim();
      if (!mimeType || !IMAGE_MIME_TYPES.has(mimeType)) {
        res.status(415).json(apiError('UNSUPPORTED_IMAGE_TYPE', 'content-type must be image/jpeg, image/png, or image/webp'));
        return;
      }
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        res.status(400).json(apiError('IMAGE_REQUIRED', 'request body must contain image bytes'));
        return;
      }
      if (req.body.length > MAX_IMAGE_BYTES) {
        res.status(413).json(apiError('IMAGE_TOO_LARGE', 'image exceeds the 10 MB limit'));
        return;
      }

      const timestamp = new Date().toISOString();
      const image = createEvidenceImage({
        id: `img_${randomUUID()}`,
        storageKey: `scans/${scan.id}/images/${randomUUID()}`,
        mimeType: mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
        byteSize: req.body.length,
        sha256: sha256(req.body),
        capturedAt: req.header('x-captured-at') || timestamp,
        createdAt: timestamp,
      });
      const uploadedScan = repository.saveImage(scan.id, image, req.body);
      repository.save(createScan({
        ...uploadedScan,
        processing: { ...uploadedScan.processing, stage: 'ANALYZING', lifecycle: 'PROCESSING' },
        timestamps: { ...uploadedScan.timestamps, updatedAt: new Date().toISOString() },
      }));
      const activeExtractionAdapter = uploadedScan.mode === 'DEMO_FIXTURE'
        ? demoExtractionAdapter
        : liveExtractionAdapter;
      const observations = await activeExtractionAdapter.extract(image);
      const extractedScan = repository.saveObservations(scan.id, observations);
      res.status(201).json({ image, scan: extractedScan });
    } catch (error) {
      if (error instanceof ExtractionError) {
        try {
          repository.markError(req.params.id, error.message);
        } catch (persistError) {
          next(persistError);
          return;
        }
        res.status(502).json({
          ...apiError('EXTRACTION_FAILED', error.message),
          scanId: req.params.id,
        });
        return;
      }
      next(error);
    }
  });

  app.get('/scans/:id', (req, res) => {
    const scan = repository.getById(req.params.id);
    if (!scan) {
      res.status(404).json(apiError('SCAN_NOT_FOUND', 'scan was not found'));
      return;
    }
    res.status(200).json(scan);
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof SyntaxError) {
      res.status(400).json(apiError('INVALID_JSON', 'request body is not valid JSON'));
      return;
    }
    if (error instanceof DomainValidationError) {
      res.status(400).json(apiError('INVALID_REQUEST', error.message));
      return;
    }
    if (isPayloadTooLargeError(error)) {
      res.status(413).json(apiError('PAYLOAD_TOO_LARGE', 'request payload is too large'));
      return;
    }
    console.error(error);
    res.status(500).json(apiError('INTERNAL_SERVER_ERROR', 'unexpected server error'));
  });

  return app;
}

function requiredString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new DomainValidationError(`${fieldName} is required`);
  }
  return value.trim();
}

function requiredSourceType(value: unknown): SourceType {
  if (value !== 'PHYSICAL_PHOTO' && value !== 'ECOMMERCE_LISTING') {
    throw new DomainValidationError('sourceType must be PHYSICAL_PHOTO or ECOMMERCE_LISTING');
  }
  return value;
}

function requiredScanMode(value: unknown): ScanMode {
  if (value === undefined) return 'LIVE';
  if (value !== 'LIVE' && value !== 'DEMO_FIXTURE') {
    throw new DomainValidationError('mode must be LIVE or DEMO_FIXTURE');
  }
  return value;
}

function apiError(code: string, message: string): ApiErrorBody {
  return { error: { code, message } };
}

function isPayloadTooLargeError(error: unknown): boolean {
  return typeof error === 'object' && error !== null &&
    'type' in error && (error as { type?: string }).type === 'entity.too.large';
}
