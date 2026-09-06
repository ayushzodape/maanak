import { GoogleGenAI } from '@google/genai';
import { EvidenceImage, Observation, ObservationStatus, createObservation } from '../domain';
import { ExtractionAdapter, ExtractionError } from './extraction-adapter';

const GEMINI_MODEL = 'gemini-2.5-flash';
const DEFAULT_TIMEOUT_MS = 30_000;
const EXTRACTION_METHOD = 'GEMINI_VISION';
const OBSERVATION_FIELDS = new Set([
  'manufacturer',
  'generic_name',
  'net_quantity',
  'date_mfg',
  'mrp',
  'consumer_care',
  'other_label_text',
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
          value: { type: ['string', 'number', 'null'] },
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
  'Inspect the supplied packaged-commodity image and return only observable label evidence.',
  'Use only these field names: manufacturer, generic_name, net_quantity, date_mfg, mrp, consumer_care, other_label_text.',
  'If information is not visible, do not guess.',
  'If text is unreadable, report it as UNCERTAIN or NOT_DETECTED according to the observation model.',
  'Do not infer hidden declarations. Do not invent measurements.',
  'Do not infer legal compliance. Do not return PASS or FAIL.',
  'Return one observation for each requested field that is visible, not visible, not detected, or not measurable.',
  'The confidence value is confidence in the observation only, from 0 to 1.',
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
  private readonly loadImageBytes: (image: EvidenceImage) => Uint8Array | undefined;

  constructor(options: GeminiExtractionAdapterOptions) {
    if (!options.apiKey?.trim()) throw new GeminiConfigurationError();
    this.client = options.client || new GoogleGenAI({ apiKey: options.apiKey }).models;
    this.timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.client.generateContent({
        model: GEMINI_MODEL,
        contents: [{
          role: 'user',
          parts: [
            { text: EXTRACTION_INSTRUCTIONS },
            { inlineData: { mimeType: image.mimeType, data: Buffer.from(imageBytes).toString('base64') } },
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
      if (error instanceof ExtractionError) throw error;
      if (controller.signal.aborted) throw new ExtractionError('Gemini extraction provider timed out');
      throw new ExtractionError(classifyProviderFailure(error));
    } finally {
      clearTimeout(timeout);
    }
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
    if (!OBSERVATION_STATUSES.includes(candidate.status as ObservationStatus)) {
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

    const boundingBox = candidate.boundingBox === null || candidate.boundingBox === undefined
      ? undefined
      : parseBoundingBox(candidate.boundingBox);
    return createObservation({
      id: `gemini-observation-${index + 1}`,
      field: candidate.field,
      value: candidate.value,
      ...(candidate.unit ? { unit: candidate.unit } : {}),
      confidence: candidate.confidence,
      status: candidate.status as ObservationStatus,
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

function isObservationValue(value: unknown): value is string | number | null {
  return value === null || typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value));
}

function parseBoundingBox(value: unknown): { x: number; y: number; width: number; height: number } {
  if (!isRecord(value) || !['x', 'y', 'width', 'height'].every((key) => typeof value[key] === 'number')) {
    throw new ExtractionError('Gemini extraction returned an invalid bounding box');
  }
  const { x, y, width, height } = value as Record<'x' | 'y' | 'width' | 'height', number>;
  if ([x, y, width, height].some((part) => !Number.isFinite(part)) || x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > 1 || y + height > 1) {
    throw new ExtractionError('Gemini extraction returned an invalid bounding box');
  }
  return { x, y, width, height };
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
