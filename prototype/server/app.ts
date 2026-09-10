import { randomUUID } from 'node:crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import express, { NextFunction, Request, Response } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { createEvidenceImage, createScan, DomainValidationError, Scan, ScanMode, SourceType, COMPLIANCE_RESULTS, ComplianceResult, COMMODITY_CATEGORIES, CommodityCategory } from '../src/domain';
import { ExtractionAdapter, ExtractionError, UnavailableExtractionAdapter } from '../src/extraction';
import { CURRENT_RULE_DEFINITIONS, evaluateScan, RULESET_VERSION } from '../src/evaluation';
import { InMemoryScanRepository, ScanRepository, ScanHistoryQuery, sha256 } from './repository';
import { AuthConfig, AuthenticatedUser, configuredAuthFromEnvironment, InMemorySessionStore, readSessionToken, SESSION_COOKIE, SessionStore } from './auth';

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

interface CreateScanBody {
  productName?: unknown;
  sourceType?: unknown;
  ruleVersion?: unknown;
  mode?: unknown;
  commodityCategory?: unknown;
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
  authConfig: AuthConfig | undefined = configuredAuthFromEnvironment(),
  sessionStore: SessionStore = new InMemorySessionStore(),
): express.Express {
  const app = express();
  app.use(express.json({ limit: '256kb' }));
  app.use(express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: MAX_IMAGE_BYTES }));

  app.post('/auth/login', (req, res) => {
    if (!authConfig) {
      res.status(503).json(apiError('AUTH_NOT_CONFIGURED', 'server authentication is not configured'));
      return;
    }
    const username = req.body?.username;
    const password = req.body?.password;
    if (username !== authConfig.username || password !== authConfig.password) {
      res.status(401).json(apiError('INVALID_CREDENTIALS', 'username or password is incorrect'));
      return;
    }
    const session = sessionStore.create();
    res.cookie(SESSION_COOKIE, session.token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
    res.status(200).json({ user: session.user });
  });

  app.get('/auth/session', (req, res) => {
    const user = sessionStore.get(readSessionToken(req.header('cookie')));
    if (!user) {
      res.status(401).json(apiError('AUTH_REQUIRED', 'authenticated session is required'));
      return;
    }
    res.status(200).json({ user });
  });

  app.post('/auth/logout', (req, res) => {
    sessionStore.delete(readSessionToken(req.header('cookie')));
    res.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
    res.status(204).send();
  });

  app.use('/scans', requireAuthenticated(sessionStore));

  app.post('/scans', (req, res, next) => {
    try {
      const body = req.body as CreateScanBody;
      const productName = requiredString(body?.productName, 'productName');
      const sourceType = requiredSourceType(body?.sourceType);
      const ruleVersion = requiredString(body?.ruleVersion, 'ruleVersion');
      const mode = requiredScanMode(body?.mode);
      const commodityCategory = optionalCommodityCategory(body?.commodityCategory);
      const timestamp = new Date().toISOString();
      const scan: Scan = createScan({
        id: `scan_${randomUUID()}`,
        productName,
        sourceType,
        mode,
        commodityCategory,
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

  app.get('/scans', (req, res, next) => {
    try {
      const query: ScanHistoryQuery = {
        productName: optionalQueryString(req.query.productName, 'productName'),
        result: optionalResult(req.query.result),
        from: optionalDate(req.query.from, 'from'),
        to: optionalDate(req.query.to, 'to'),
      };
      const items = repository.listCompleted(query);
      res.status(200).json({ items, total: items.length });
    } catch (error) {
      next(error);
    }
  });

  app.post('/scans/:id/result', (req, res, next) => {
    try {
      const scan = repository.getById(req.params.id);
      if (!scan) {
        res.status(404).json(apiError('SCAN_NOT_FOUND', 'scan was not found'));
        return;
      }
      if (scan.images.length === 0) {
        res.status(409).json(apiError('SCAN_NOT_READY', 'a source image is required before evaluation'));
        return;
      }
      if (scan.processing.lifecycle !== 'PROCESSING' || scan.processing.stage !== 'EXTRACTING') {
        res.status(409).json(apiError('SCAN_NOT_READY', 'successful extraction is required before evaluation'));
        return;
      }
      if (scan.ruleVersion !== RULESET_VERSION) {
        res.status(409).json(apiError('RULE_VERSION_UNAVAILABLE', 'the requested rule version is not available for server evaluation'));
        return;
      }
      // The request body is intentionally ignored. Results are derived only
      // from persisted observations and the server-owned verified ruleset.
      const { canonicalResult: result } = evaluateScan(scan.id, scan.observations, CURRENT_RULE_DEFINITIONS, undefined, scan.commodityCategory);
      const completedScan = repository.saveCanonicalResult(scan.id, result);
      res.status(201).json({ scan: completedScan, result });
    } catch (error) {
      next(error);
    }
  });

  app.get('/scans/:id/result', (req, res) => {
    const scan = repository.getById(req.params.id);
    const result = repository.getCanonicalResult(req.params.id);
    if (!scan || !result) {
      res.status(404).json(apiError('RESULT_NOT_FOUND', 'completed canonical scan result was not found'));
      return;
    }
    res.status(200).json(result);
  });

  app.get('/scans/:id/images/:imageId', (req, res) => {
    const scan = repository.getById(req.params.id);
    const image = scan?.images.find((candidate) => candidate.id === req.params.imageId);
    const bytes = image ? repository.getImageBytes(req.params.id, req.params.imageId) : undefined;
    if (!image || !bytes) {
      res.status(404).json(apiError('IMAGE_NOT_FOUND', 'source image was not found'));
      return;
    }
    res.type(image.mimeType).send(bytes);
  });

  // Serve static files from the frontend build directory
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  
  // SPA Fallback for any routes that aren't API endpoints
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/scans') || req.path.startsWith('/auth')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
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

function optionalQueryString(value: unknown, fieldName: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.trim().length === 0) throw new DomainValidationError(`${fieldName} must be a non-empty string`);
  return value.trim();
}

function optionalDate(value: unknown, fieldName: string): string | undefined {
  const parsed = optionalQueryString(value, fieldName);
  if (parsed && Number.isNaN(Date.parse(parsed))) throw new DomainValidationError(`${fieldName} must be a valid ISO date-time`);
  return parsed;
}

function optionalResult(value: unknown): ComplianceResult | undefined {
  const parsed = optionalQueryString(value, 'result');
  if (parsed === undefined) return undefined;
  if (!COMPLIANCE_RESULTS.includes(parsed as ComplianceResult)) throw new DomainValidationError('result must be a canonical compliance result');
  return parsed as ComplianceResult;
}

function optionalCommodityCategory(value: unknown): CommodityCategory {
  if (value === undefined) return 'GENERAL_RETAIL';
  if (typeof value !== 'string' || !COMMODITY_CATEGORIES.includes(value as CommodityCategory)) {
    throw new DomainValidationError(`commodityCategory must be one of: ${COMMODITY_CATEGORIES.join(', ')}`);
  }
  return value as CommodityCategory;
}

function apiError(code: string, message: string): ApiErrorBody {
  return { error: { code, message } };
}

function requireAuthenticated(sessionStore: SessionStore) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = sessionStore.get(readSessionToken(req.header('cookie')));
    if (!user) {
      res.status(401).json(apiError('AUTH_REQUIRED', 'authenticated session is required'));
      return;
    }
    res.locals.user = user as AuthenticatedUser;
    next();
  };
}

function isPayloadTooLargeError(error: unknown): boolean {
  return typeof error === 'object' && error !== null &&
    'type' in error && (error as { type?: string }).type === 'entity.too.large';
}
