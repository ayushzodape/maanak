import { GoogleGenAI } from '@google/genai';
import { EvidenceImage, Observation, ObservationStatus, createObservation } from '../domain';
import { ExtractionAdapter, ExtractionError } from './extraction-adapter';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const FALLBACK_MODELS = Array.from(new Set([GEMINI_MODEL, 'gemini-3.6-flash']));
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const EXTRACTION_METHOD = 'GEMINI_VISION';
const OBSERVATION_FIELDS = new Set([
  'manufacturer',
  'generic_name',
  'net_quantity',
  'date_mfg',
  'mrp',
  'consumer_care',
  'other_label_text',
  'principal_display_panel_area_cm2',
  'character_height_mm',
  'character_width_mm',
  'container_marking_method',
  'package_scope',
]);
const OBSERVATION_STATUSES: readonly ObservationStatus[] = [
  'OBSERVED',
  'NOT_DETECTED',
  'UNCERTAIN',
  'NOT_VISIBLE',
  'NOT_MEASURABLE',
];

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    observations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          field: { type: 'string' },
          value: { type: ['string', 'number', 'boolean', 'null'] },
          unit: { type: 'string', nullable: true },
          confidence: { type: 'number' },
          status: { type: 'string', enum: OBSERVATION_STATUSES },
          boundingBox: {
            type: 'object',
            nullable: true,
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
              width: { type: 'number' },
              height: { type: 'number' },
            },
            required: ['x', 'y', 'width', 'height'],
          },
        },
        required: ['field', 'value', 'confidence', 'status'],
      },
    },
  },
  required: ['observations'],
};

const EXTRACTION_INSTRUCTIONS = [
  'Inspect the supplied packaged-commodity image carefully and return observable label evidence.',
  'Use only these field names: manufacturer, generic_name, net_quantity, date_mfg, mrp, consumer_care, other_label_text, principal_display_panel_area_cm2, character_height_mm, character_width_mm, container_marking_method, package_scope.',
  'For consumer_care, look for any customer care phone number, email address, or physical address.',
  'If a printed label header (such as M.R.P, MFD, Use By, Batch No) is present on the packaging but the value after the label header is blank, unprinted, missing, or empty, set status to NOT_DETECTED or NOT_VISIBLE and value to null.',
  'If information is not visible, do not guess.',
  'If text is unreadable, report it as UNCERTAIN or NOT_DETECTED according to the observation model.',
  'Do not infer hidden declarations. Do not invent measurements.',
  'Do not infer legal compliance. Do not return PASS or FAIL.',
  'For Rule 7 fields, report panel area and character dimensions only when a reliable physical scale reference is visible and the measurement is derivable. Otherwise use NOT_MEASURABLE and do not guess.',
  'For container_marking_method, use only NORMAL, BLOWN, FORMED, MOULDED, MOLDED, EMBOSSED, or PERFORATED when visibly supported; otherwise use UNCERTAIN or NOT_DETECTED.',
  'For package_scope, report IN_SCOPE, OUT_OF_SCOPE, or UNCERTAIN only when the image and supplied context support it; do not infer exemptions from product appearance alone.',
  'Return one observation for each requested field that is visible, not visible, not detected, or not measurable.',
  'The confidence value is confidence in the observation only, from 0 to 1.',
  'Every OBSERVED field must include a bounding box indicating where the evidence is located.',
  'If an OBSERVED field applies to the entire package (e.g. container_marking_method, package_scope), use a full-image bounding box {x: 0, y: 0, width: 1, height: 1}.',
  'Bounding boxes must be normalized to the range 0 to 1 relative to the supplied image.',
].join(' ');

interface GeminiGenerateContentResponse {
  readonly text?: string;
}

interface GeminiModelClient {
  generateContent(params: {
    model: string;
    contents: unknown;
    config: {
      systemInstruction: string;
      responseMimeType: 'application/json';
      responseJsonSchema: unknown;
      temperature: number;
      abortSignal: AbortSignal;
    };
  }): Promise<GeminiGenerateContentResponse>;
}

export interface GeminiExtractionAdapterOptions {
  readonly apiKey?: string;
  readonly loadImageBytes: (image: EvidenceImage) => Uint8Array | undefined;
  readonly client?: GeminiModelClient;
  readonly timeoutMs?: number;
  readonly retryDelayMs?: number;
}

export class GeminiConfigurationError extends ExtractionError {
  readonly category = 'CONFIGURATION';

  constructor() {
    super('Gemini extraction provider is not configured');
    this.name = 'GeminiConfigurationError';
  }
}

export class GeminiExtractionAdapter implements ExtractionAdapter {
  private readonly client: GeminiModelClient;
  private readonly timeoutMs: number;
  private readonly retryDelayMs: number;
  private readonly loadImageBytes: (image: EvidenceImage) => Uint8Array | undefined;

  constructor(options: GeminiExtractionAdapterOptions) {
    if (!options.apiKey?.trim()) throw new GeminiConfigurationError();
    this.client = options.client || new GoogleGenAI({ apiKey: options.apiKey }).models;
    this.timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
    this.retryDelayMs = options.retryDelayMs ?? (process.env.NODE_ENV === 'test' ? 50 : 1500);
    this.loadImageBytes = options.loadImageBytes;
  }

  async extract(image: EvidenceImage): Promise<Observation[]> {
    let imageBytes: Uint8Array | undefined;
    try {
      imageBytes = this.loadImageBytes(image);
    } catch (error) {
      throw new ExtractionError('source image bytes are unavailable for Gemini extraction', { cause: error });
    }
    if (!imageBytes || imageBytes.byteLength === 0) {
      throw new ExtractionError('source image bytes are unavailable for Gemini extraction');
    }

    let lastError: unknown;
    const base64Data = Buffer.from(imageBytes).toString('base64');

    // Try models in fallback order and retry transient 503/429 errors
    for (const targetModel of FALLBACK_MODELS) {
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
          const response = await this.client.generateContent({
            model: targetModel,
            contents: [{
              role: 'user',
              parts: [
                { text: EXTRACTION_INSTRUCTIONS },
                { inlineData: { mimeType: image.mimeType, data: base64Data } },
              ],
            }],
            config: {
              systemInstruction: 'You are an evidence extraction component. You do not decide compliance.',
              responseMimeType: 'application/json',
              responseJsonSchema: RESPONSE_SCHEMA,
              temperature: 0,
              abortSignal: controller.signal,
            },
          });
          return this.convertResponse(response.text, image);
        } catch (error) {
          lastError = error;
          if (error instanceof ExtractionError) throw error;
          if (controller.signal.aborted) {
            lastError = new ExtractionError('Gemini extraction provider timed out');
            break;
          }
          const isTransient = isTransientError(error);
          if (isTransient && attempt < MAX_RETRIES) {
            // Exponential backoff with jitter before retry
            const delay = this.retryDelayMs * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 400);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          // If model is 404 or persistent error, break loop to try next fallback model
          break;
        } finally {
          clearTimeout(timeout);
        }
      }
    }

    const message = classifyProviderFailure(lastError);
    throw new ExtractionError(message, { cause: lastError });
  }

  private convertResponse(responseText: string | undefined, image: EvidenceImage): Observation[] {
    if (!responseText?.trim()) throw new ExtractionError('Gemini extraction returned an empty response');

    let parsed: unknown;
    try {
      parsed = JSON.parse(responseText);
    } catch (error) {
      throw new ExtractionError('Gemini extraction returned malformed JSON', { cause: error });
    }
    if (!isRecord(parsed) || !Array.isArray(parsed.observations) || hasComplianceResult(parsed)) {
      throw new ExtractionError('Gemini extraction response does not match the observation schema');
    }

    try {
      return parsed.observations.map((candidate, index) => this.toObservation(candidate, index, image));
    } catch (error) {
      if (error instanceof ExtractionError) throw error;
      throw new ExtractionError('Gemini extraction response contained invalid observations', { cause: error });
    }
  }

  private toObservation(candidate: unknown, index: number, image: EvidenceImage): Observation {
    if (!isRecord(candidate) || typeof candidate.field !== 'string' || !OBSERVATION_FIELDS.has(candidate.field)) {
      throw new ExtractionError('Gemini extraction returned an unsupported observation field');
    }
    let status = candidate.status as ObservationStatus;
    if (!OBSERVATION_STATUSES.includes(status)) {
      throw new ExtractionError('Gemini extraction returned an unsupported observation status');
    }
    if (typeof candidate.confidence !== 'number' || candidate.confidence < 0 || candidate.confidence > 1) {
      throw new ExtractionError('Gemini extraction returned an invalid observation confidence');
    }
    if (!isObservationValue(candidate.value)) {
      throw new ExtractionError('Gemini extraction returned an invalid observation value');
    }
    if (candidate.unit !== undefined && candidate.unit !== null && typeof candidate.unit !== 'string') {
      throw new ExtractionError('Gemini extraction returned an invalid observation unit');
    }

    let value = candidate.value;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed || ['n/a', 'na', 'none', 'null', 'nil', 'undefined', 'unprinted', 'blank'].includes(trimmed.toLowerCase())) {
        value = null;
      } else {
        value = trimmed;
      }
    }

    // A null value cannot carry OBSERVED status
    if (value === null && status === 'OBSERVED') {
      status = 'NOT_DETECTED';
    }

    let boundingBox = candidate.boundingBox === null || candidate.boundingBox === undefined
      ? undefined
      : parseBoundingBox(candidate.boundingBox);

    // Strip hallucinated bounding boxes for unobserved fields
    if (status !== 'OBSERVED') {
      boundingBox = undefined;
    }

    // Ensure OBSERVED fields always have a bounding box (fallback to full image)
    if (status === 'OBSERVED' && !boundingBox) {
      boundingBox = { x: 0, y: 0, width: 1, height: 1 };
    }
    return createObservation({
      id: `gemini-observation-${index + 1}`,
      field: candidate.field,
      value,
      ...(candidate.unit ? { unit: candidate.unit } : {}),
      confidence: candidate.confidence,
      status,
      evidence: {
        imageId: image.id,
        sourceImage: { storageKey: image.storageKey },
        ...(boundingBox ? { boundingBox } : {}),
      },
      extractionMethod: EXTRACTION_METHOD,
      observedAt: new Date().toISOString(),
    });
  }
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isObservationValue(value: unknown): value is string | number | boolean | null {
  return value === null || typeof value === 'string' || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value));
}

function parseBoundingBox(value: unknown): { x: number; y: number; width: number; height: number } {
  if (!isRecord(value) || !['x', 'y', 'width', 'height'].every((key) => typeof value[key] === 'number')) {
    throw new ExtractionError('Gemini extraction returned an invalid bounding box');
  }
  let { x, y, width, height } = value as Record<'x' | 'y' | 'width' | 'height', number>;
  if ([x, y, width, height].some((part) => !Number.isFinite(part))) {
    throw new ExtractionError('Gemini extraction returned an invalid bounding box');
  }
  // Clamp slight floating-point overflow/underflow within [-0.05, 1.05]
  if (x >= -0.05 && x <= 1.05) x = Math.max(0, Math.min(1, x));
  if (y >= -0.05 && y <= 1.05) y = Math.max(0, Math.min(1, y));
  if (width > 0 && width <= 1.05) width = Math.max(0.001, Math.min(1 - x, width));
  if (height > 0 && height <= 1.05) height = Math.max(0.001, Math.min(1 - y, height));

  if (x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > 1.001 || y + height > 1.001) {
    throw new ExtractionError('Gemini extraction returned an invalid bounding box');
  }
  return {
    x: Number(x.toFixed(4)),
    y: Number(y.toFixed(4)),
    width: Number(width.toFixed(4)),
    height: Number(height.toFixed(4)),
  };
}

function hasComplianceResult(value: Record<string, unknown>): boolean {
  return Object.prototype.hasOwnProperty.call(value, 'result') ||
    Object.prototype.hasOwnProperty.call(value, 'complianceResult');
}

function classifyProviderFailure(error: unknown): string {
  const status = isRecord(error) && typeof error.status === 'number' ? error.status : undefined;
  if (status === 429) return 'Gemini extraction provider rate limit reached';
  if (status !== undefined && status >= 500) return 'Gemini extraction provider is unavailable';
  return 'Gemini extraction provider request failed';
}

function isTransientError(error: unknown): boolean {
  const status = isRecord(error) && typeof error.status === 'number' ? error.status : undefined;
  return status === 429 || status === 503 || status === 500 || status === 502 || status === 504;
}
