import { EvidenceImage, Observation, ObservationStatus, createObservation } from '../domain';
import { ExtractionAdapter, ExtractionError } from './extraction-adapter';

const FIELDS = new Set(['manufacturer', 'generic_name', 'net_quantity', 'date_mfg', 'mrp', 'consumer_care', 'other_label_text', 'principal_display_panel_area_cm2', 'character_height_mm', 'character_width_mm', 'container_marking_method', 'package_scope']);
const STATUSES: readonly ObservationStatus[] = ['OBSERVED', 'NOT_DETECTED', 'UNCERTAIN', 'NOT_VISIBLE', 'NOT_MEASURABLE'];
const INSTRUCTIONS = `You are an evidence extraction component, not a compliance judge. Inspect the packaged-commodity image and return JSON exactly as {"observations":[]}. Use only these fields: manufacturer, generic_name, net_quantity, date_mfg, mrp, consumer_care, other_label_text, principal_display_panel_area_cm2, character_height_mm, character_width_mm, container_marking_method, package_scope. Each observation requires field, value, confidence, status, and optional boundingBox with normalized x,y,width,height. Use only statuses OBSERVED, NOT_DETECTED, UNCERTAIN, NOT_VISIBLE, NOT_MEASURABLE. Never return PASS or FAIL. Never guess. Rule 7 measurements in millimetres require a visible reliable physical scale reference; otherwise use NOT_MEASURABLE. package_scope may be IN_SCOPE, OUT_OF_SCOPE, or UNCERTAIN only when supported by evidence.`;

export class GroqExtractionAdapter implements ExtractionAdapter {
  constructor(private readonly apiKey: string, private readonly loadImageBytes: (image: EvidenceImage) => Uint8Array | undefined, private readonly model = process.env.GROQ_VISION_MODEL || 'qwen/qwen3.6-27b') {
    if (!apiKey.trim()) throw new ExtractionError('Groq extraction provider is not configured');
  }

  async extract(image: EvidenceImage): Promise<Observation[]> {
    const bytes = this.loadImageBytes(image);
    if (!bytes?.byteLength) throw new ExtractionError('source image bytes are unavailable for Groq extraction');
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST', headers: { authorization: `Bearer ${this.apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: this.model, temperature: 0, max_tokens: 4096, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: INSTRUCTIONS }, { role: 'user', content: [{ type: 'text', text: 'Extract only visible observations from this image.' }, { type: 'image_url', image_url: { url: `data:${image.mimeType};base64,${Buffer.from(bytes).toString('base64')}` } }] }] }),
    });
    if (!response.ok) throw new ExtractionError(`Groq extraction request failed (${response.status})`);
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const text = payload.choices?.[0]?.message?.content;
    if (!text) throw new ExtractionError('Groq extraction returned an empty response');
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { throw new ExtractionError('Groq extraction returned malformed JSON'); }
    if (!isRecord(parsed) || !Array.isArray(parsed.observations)) throw new ExtractionError('Groq extraction response does not match the observation schema');
    return parsed.observations.map((item, index) => toObservation(item, index, image));
  }
}

function toObservation(value: unknown, index: number, image: EvidenceImage): Observation {
  if (!isRecord(value) || typeof value.field !== 'string' || !FIELDS.has(value.field) || !STATUSES.includes(value.status as ObservationStatus) || typeof value.confidence !== 'number' || value.confidence < 0 || value.confidence > 1) throw new ExtractionError('Groq extraction returned an invalid observation');
  if (!(value.value === null || typeof value.value === 'string' || typeof value.value === 'boolean' || (typeof value.value === 'number' && Number.isFinite(value.value)))) throw new ExtractionError('Groq extraction returned an invalid observation value');
  const box = value.boundingBox;
  const boundingBox = box && isRecord(box) && ['x', 'y', 'width', 'height'].every((key) => typeof box[key] === 'number') ? box as { x: number; y: number; width: number; height: number } : undefined;
  return createObservation({ id: `groq-observation-${index + 1}`, field: value.field, value: value.value, confidence: value.confidence, status: value.status as ObservationStatus, evidence: { imageId: image.id, sourceImage: { storageKey: image.storageKey }, ...(boundingBox ? { boundingBox } : {}) }, extractionMethod: 'GROQ_VISION', observedAt: new Date().toISOString() });
}
function isRecord(value: unknown): value is Record<string, any> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
