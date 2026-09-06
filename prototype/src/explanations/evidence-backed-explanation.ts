import { EvidenceReference } from '../domain/common';
import { Evaluation } from '../domain/evaluation';
import { Observation } from '../domain/observation';
import { Rule } from '../domain/rule';

/** English is the canonical explanation language until INNOV-003 is implemented. */
export const EXPLANATION_LANGUAGES = ['en'] as const;
export type ExplanationLanguage = (typeof EXPLANATION_LANGUAGES)[number];

export interface EvidenceBackedExplanationInput {
  readonly evaluation: Evaluation;
  readonly rule: Rule;
  readonly observation?: Observation;
  readonly knownLimitations: readonly string[];
  readonly language?: ExplanationLanguage;
}

export interface EvidenceBackedExplanation {
  readonly language: ExplanationLanguage;
  readonly evaluationId: string;
  readonly result: Evaluation['result'];
  readonly ruleId: string;
  readonly ruleVersion: string;
  readonly observationId: string | null;
  readonly observationConfidence: number | null;
  readonly evidence: EvidenceReference | null;
  readonly knownLimitations: readonly string[];
  readonly text: string;
}

/**
 * Creates a deterministic, evidence-backed explanation for an existing
 * evaluation. This function only formats supplied canonical data; it does not
 * evaluate rules, infer missing values, or call a language model.
 */
export function createEvidenceBackedExplanation(input: EvidenceBackedExplanationInput): EvidenceBackedExplanation {
  const language = input.language ?? 'en';
  if (language !== 'en') {
    throw new Error(`unsupported explanation language: ${language}`);
  }
  if (input.evaluation.ruleId !== input.rule.id) {
    throw new Error('explanation rule does not match the evaluation');
  }
  if (input.evaluation.ruleVersion !== input.rule.sourceVersion) {
    throw new Error('explanation rule version does not match the evaluation');
  }
  if (input.evaluation.observationId !== null && input.observation?.id !== input.evaluation.observationId) {
    throw new Error('explanation observation does not match the evaluation');
  }
  if (!Array.isArray(input.knownLimitations) || input.knownLimitations.some((limitation) => typeof limitation !== 'string')) {
    throw new Error('knownLimitations must be an array of strings');
  }

  const knownLimitations = [...new Set(input.knownLimitations)];
  const text = renderExplanation(input.evaluation, input.rule, input.observation, knownLimitations);
  return Object.freeze({
    language,
    evaluationId: input.evaluation.id,
    result: input.evaluation.result,
    ruleId: input.evaluation.ruleId,
    ruleVersion: input.evaluation.ruleVersion,
    observationId: input.evaluation.observationId,
    observationConfidence: input.evaluation.observationConfidence,
    evidence: input.evaluation.evidence,
    knownLimitations: Object.freeze(knownLimitations),
    text,
  });
}

function renderExplanation(
  evaluation: Evaluation,
  rule: Rule,
  observation: Observation | undefined,
  knownLimitations: readonly string[],
): string {
  const lines = [
    `Recorded screening result: ${evaluation.result}.`,
    `Rule: ${rule.title} (${rule.id}, version ${rule.sourceVersion}). Source: ${rule.source}. Verification status: ${rule.verificationStatus}.`,
  ];

  if (observation) {
    const unit = observation.unit ? ` ${observation.unit}` : '';
    lines.push(`Observation: ${observation.field} = ${formatValue(observation.value)}${unit}; status ${observation.status}; observation confidence ${observation.confidence}.`);
  } else {
    lines.push('Observation: no observation is linked to this evaluation.');
  }

  lines.push(`Evidence: ${formatEvidence(evaluation.evidence)}.`);
  if (knownLimitations.length > 0) {
    lines.push(`Known limitations: ${knownLimitations.join(' ')}`);
  } else {
    lines.push('Known limitations: none were supplied for this explanation.');
  }

  return lines.join(' ');
}

function formatEvidence(evidence: EvidenceReference | null): string {
  if (!evidence) return 'no evidence reference is attached';
  const location = evidence.boundingBox ? 'localized bounding box recorded' : 'no localized bounding box recorded';
  const source = evidence.sourceImage?.storageKey ? `, source reference ${evidence.sourceImage.storageKey}` : '';
  return `source image ${evidence.imageId}, ${location}${source}`;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'no value recorded';
  return typeof value === 'object' ? JSON.stringify(value) ?? 'structured value' : String(value);
}
