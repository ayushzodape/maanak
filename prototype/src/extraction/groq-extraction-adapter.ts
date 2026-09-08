import { EvidenceImage, Observation, ObservationStatus, createObservation } from '../domain';
import { ExtractionAdapter, ExtractionError } from './extraction-adapter';

const FIELDS = new Set(['manufacturer', 'generic_name', 'net_quantity', 'date_mfg', 'mrp', 'consumer_care', 'other_label_text', 'principal_display_panel_area_cm2', 'character_height_mm', 'character_width_mm', 'container_marking_method', 'package_scope']);
const STATUSES: readonly ObservationStatus[] = ['OBSERVED', 'NOT_DETECTED', 'UNCERTAIN', 'NOT_VISIBLE', 'NOT_MEASURABLE'];
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1_000;

const INSTRUCTIONS = `You are an evidence extraction component, not a compliance judge. Inspect the packaged-commodity image and return JSON exactly as {"observations":[]}. Use only these fields: manufacturer, generic_name, net_quantity, date_mfg, mrp, consumer_care, other_label_text, principal_display_panel_area_cm2, character_height_mm, character_width_mm, container_marking_method, package_scope. Each observation requires field, value, confidence, status, optional unit, and optional boundingBox with normalized x,y,width,height. Use only statuses OBSERVED, NOT_DETECTED, UNCERTAIN, NOT_VISIBLE, NOT_MEASURABLE. Never return PASS or FAIL. Never guess. Rule 7 measurements in millimetres require a visible reliable physical scale reference; otherwise use NOT_MEASURABLE. package_scope may be IN_SCOPE, OUT_OF_SCOPE, or UNCERTAIN only when supported by evidence. Every OBSERVED field must include a bounding box indicating where the evidence is located. If an OBSERVED field applies to the entire package (e.g. container_marking_method, package_scope), use a full-image bounding box {"x": 0, "y": 0, "width": 1, "height": 1}.`;

export class GroqExtractionAdapter implements ExtractionAdapter {
  private readonly timeoutMs: number;

  constructor(
    private readonly apiKey: string,
    private readonly loadImageBytes: (image: EvidenceImage) => Uint8Array | undefined,
    private readonly model = process.env.GROQ_VISION_MODEL || 'qwen/qwen3.6-27b',
    timeoutMs?: number,
  ) {
    if (!apiKey.trim()) throw new ExtractionError('Groq extraction provider is not configured');
    this.timeoutMs = timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async extract(image: EvidenceImage): Promise<Observation[]> {
    const bytes = this.loadImageBytes(image);
    if (!bytes?.byteLength) throw new ExtractionError('source image bytes are unavailable for Groq extraction');

    const requestBody = JSON.stringify({
      model: this.model,
      temperature: 0,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: INSTRUCTIONS },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract only visible observations from this image.' },
            { type: 'image_url', image_url: { url: `data:${image.mimeType};base64,${Buffer.from(bytes).toString('base64')}` } },
          ],
        },
      ],
    });

    const response = await this.fetchWithRetry(requestBody);
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const text = payload.choices?.[0]?.message?.content;
    if (!text) throw new ExtractionError('Groq extraction returned an empty response');

    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { throw new ExtractionError('Groq extraction returned malformed JSON'); }

    if (!isRecord(parsed) || !Array.isArray(parsed.observations)) {
      throw new ExtractionError('Groq extraction response does not match the observation schema');
    }
    if (hasComplianceResult(parsed)) {
      throw new ExtractionError('Groq extraction response contains a compliance result — observations cannot carry legal verdicts');
    }

    return parsed.observations.map((item, index) => toObservation(item, index, image));
  }

  private async fetchWithRetry(body: string): Promise<Response> {
    let lastError: ExtractionError | undefined;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { authorization: `Bearer ${this.apiKey}`, 'content-type': 'application/json' },
          body,
          signal: controller.signal,
        });

        if (response.ok) return response;

        const status = response.status;

        // Retry on 429 (rate limit) and 5xx (server errors)
        if (status === 429 || status >= 500) {
          const retryAfterHeader = response.headers.get('retry-after');
          const retryAfterMs = retryAfterHeader
            ? Math.min(Number(retryAfterHeader) * 1000, 10_000)
            : BASE_RETRY_DELAY_MS * Math.pow(2, attempt);

          lastError = new ExtractionError(classifyHttpFailure(status));

          if (attempt < MAX_RETRIES - 1) {
            await sleep(retryAfterMs);
            continue;
          }
        }

        // Non-retryable HTTP error
        throw new ExtractionError(classifyHttpFailure(status));
      } catch (error) {
        if (error instanceof ExtractionError) {
          lastError = error;
          if (attempt < MAX_RETRIES - 1) continue;
          throw error;
        }
        if (controller.signal.aborted) {
          lastError = new ExtractionError('Groq extraction provider timed out');
          if (attempt < MAX_RETRIES - 1) {
            await sleep(BASE_RETRY_DELAY_MS * Math.pow(2, attempt));
            continue;
          }
          throw lastError;
        }
        throw new ExtractionError('Groq extraction provider request failed');
      } finally {
        clearTimeout(timeout);
      }
    }

    throw lastError ?? new ExtractionError('Groq extraction failed after retries');
  }
}

function toObservation(value: unknown, index: number, image: EvidenceImage): Observation {
  if (!isRecord(value) || typeof value.field !== 'string' || !FIELDS.has(value.field) || !STATUSES.includes(value.status as ObservationStatus) || typeof value.confidence !== 'number' || value.confidence < 0 || value.confidence > 1) {
    throw new ExtractionError('Groq extraction returned an invalid observation');
  }
  if (!(value.value === null || typeof value.value === 'string' || typeof value.value === 'boolean' || (typeof value.value === 'number' && Number.isFinite(value.value)))) {
    throw new ExtractionError('Groq extraction returned an invalid observation value');
  }
  if (value.unit !== undefined && value.unit !== null && typeof value.unit !== 'string') {
    throw new ExtractionError('Groq extraction returned an invalid observation unit');
  }
  let status = value.status as ObservationStatus;
  if (value.value === null && status === 'OBSERVED') {
    status = 'NOT_DETECTED';
  }

  let boundingBox = parseBoundingBox(value.boundingBox);
  if (status !== 'OBSERVED') {
    boundingBox = undefined;
  }
  if (status === 'OBSERVED' && !boundingBox) {
    boundingBox = { x: 0, y: 0, width: 1, height: 1 };
  }
  return createObservation({
    id: `groq-observation-${index + 1}`,
    field: value.field,
    value: value.value,
    ...(typeof value.unit === 'string' && value.unit.trim() ? { unit: value.unit.trim() } : {}),
    confidence: value.confidence,
    status,
    evidence: {
      imageId: image.id,
      sourceImage: { storageKey: image.storageKey },
      ...(boundingBox ? { boundingBox } : {}),
    },
    extractionMethod: 'GROQ_VISION',
    observedAt: new Date().toISOString(),
  });
}

function parseBoundingBox(value: unknown): { x: number; y: number; width: number; height: number } | undefined {
  if (value === null || value === undefined) return undefined;
  if (!isRecord(value) || !['x', 'y', 'width', 'height'].every((key) => typeof value[key] === 'number')) return undefined;
  const { x, y, width, height } = value as Record<'x' | 'y' | 'width' | 'height', number>;
  if ([x, y, width, height].some((v) => !Number.isFinite(v)) || x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > 1 || y + height > 1) {
    throw new ExtractionError('Groq extraction returned an invalid bounding box');
  }
  return { x, y, width, height };
}

function hasComplianceResult(value: Record<string, unknown>): boolean {
  return Object.prototype.hasOwnProperty.call(value, 'result') ||
    Object.prototype.hasOwnProperty.call(value, 'complianceResult');
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function classifyHttpFailure(status: number): string {
  if (status === 429) return 'Groq extraction provider rate limit reached';
  if (status === 401 || status === 403) return 'Groq extraction provider authentication failed';
  if (status >= 500) return 'Groq extraction provider is unavailable';
  return `Groq extraction request failed (${status})`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
