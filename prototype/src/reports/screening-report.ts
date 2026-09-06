import { CanonicalScanResult, Observation, Rule, Scan } from '../domain';
import { formatBarcodeScaleEstimate, isBarcodeScaleEstimateValue } from '../measurement';
import { createEvidenceBackedExplanation, EvidenceBackedExplanation } from '../explanations';

export const SCREENING_DISCLAIMER = 'Maanak is a digital compliance screening system. This output is not an official inspection report, government notice, government certification, or certified measurement report.';

export interface ScreeningReportDocument {
  readonly reportType: 'MAANAK_DIGITAL_COMPLIANCE_SCREENING';
  readonly generatedAt: string;
  readonly disclaimer: string;
  readonly scan: {
    readonly id: string;
    readonly productName: string;
    readonly sourceType: Scan['sourceType'];
    readonly mode: Scan['mode'];
    readonly ruleVersion: string;
    readonly processing: Scan['processing'];
    readonly timestamps: Scan['timestamps'];
    readonly createdAt: string;
    readonly completedAt?: string;
  };
  readonly canonicalResult: CanonicalScanResult;
  readonly explanations: readonly EvidenceBackedExplanation[];
  readonly observations: readonly Observation[];
  readonly evidenceImages: Scan['images'];
  readonly ruleMetadata: readonly Pick<Rule, 'id' | 'title' | 'source' | 'sourceVersion' | 'effectiveFrom' | 'verifiedOn' | 'verificationStatus' | 'knownGaps'>[];
  readonly limitations: readonly string[];
}

export function createScreeningReport(
  scan: Scan,
  canonicalResult: CanonicalScanResult,
  rules: readonly Rule[],
  generatedAt = new Date().toISOString(),
): ScreeningReportDocument {
  if (canonicalResult.scanId !== scan.id) {
    throw new Error('canonical result does not belong to scan');
  }

  const ruleMetadata = rules.map(({ id, title, source, sourceVersion, effectiveFrom, verifiedOn, verificationStatus, knownGaps }) => ({
    id, title, source, sourceVersion, effectiveFrom, verifiedOn, verificationStatus, knownGaps,
  }));
  const rulesById = new Map(rules.map((rule) => [rule.id, rule]));
  const observationsById = new Map(scan.observations.map((observation) => [observation.id, observation]));
  const imagesById = new Map(scan.images.map((image) => [image.id, image]));
  for (const evaluation of canonicalResult.evaluations) {
    const rule = rulesById.get(evaluation.ruleId);
    if (!rule) throw new Error(`canonical result references unknown rule ${evaluation.ruleId}`);
    if (rule.sourceVersion !== evaluation.ruleVersion) {
      throw new Error(`evaluation ${evaluation.id} does not match rule ${evaluation.ruleId} version`);
    }
    if (evaluation.observationId !== null && !observationsById.has(evaluation.observationId)) {
      throw new Error(`evaluation ${evaluation.id} references unknown observation ${evaluation.observationId}`);
    }
    if (evaluation.evidence && !imagesById.has(evaluation.evidence.imageId)) {
      throw new Error(`evaluation ${evaluation.id} references unknown evidence image ${evaluation.evidence.imageId}`);
    }
  }
  const explanations = canonicalResult.evaluations.map((evaluation) => {
    const rule = rulesById.get(evaluation.ruleId)!;
    const observation = evaluation.observationId === null ? undefined : observationsById.get(evaluation.observationId);
    return createEvidenceBackedExplanation({
      evaluation,
      rule,
      observation,
      knownLimitations: rule.knownGaps,
    });
  });
  const limitations = [
    'This screening is limited to the observations and source images retained on this scan.',
    'Observation confidence is extraction confidence, not legal certainty.',
    'Ordinary phone photographs must not be treated as certified measurement evidence.',
    ...rules.flatMap((rule) => rule.knownGaps),
  ];

  return Object.freeze({
    reportType: 'MAANAK_DIGITAL_COMPLIANCE_SCREENING',
    generatedAt,
    disclaimer: SCREENING_DISCLAIMER,
    scan: {
      id: scan.id,
      productName: scan.productName,
      sourceType: scan.sourceType,
      mode: scan.mode,
      ruleVersion: scan.ruleVersion,
      processing: scan.processing,
      timestamps: scan.timestamps,
      createdAt: scan.timestamps.createdAt,
      ...(scan.timestamps.completedAt ? { completedAt: scan.timestamps.completedAt } : {}),
    },
    canonicalResult,
    explanations,
    observations: scan.observations,
    evidenceImages: scan.images,
    ruleMetadata,
    limitations: [...new Set(limitations)],
  });
}

export function serializeCanonicalJson(report: ScreeningReportDocument): string {
  return JSON.stringify(report, null, 2);
}

export function renderHumanReadableReport(report: ScreeningReportDocument): string {
  const lines = [
    'MAANAK DIGITAL COMPLIANCE SCREENING',
    '===================================',
    `Product: ${report.scan.productName}`,
    `Scan ID: ${report.scan.id}`,
    `Source type: ${report.scan.sourceType}`,
    `Mode: ${report.scan.mode}`,
    `Rule version: ${report.scan.ruleVersion}`,
    `Screening result: ${report.canonicalResult.overallResult}`,
    '',
    'EVALUATIONS',
    '-----------',
  ];

  for (const evaluation of report.canonicalResult.evaluations) {
    const rule = report.ruleMetadata.find((candidate) => candidate.id === evaluation.ruleId);
    const explanation = report.explanations.find((candidate) => candidate.evaluationId === evaluation.id);
    const sourceImage = evaluation.evidence ? report.evidenceImages.find((image) => image.id === evaluation.evidence!.imageId) : undefined;
    lines.push(
      `${evaluation.ruleId}: ${evaluation.result}`,
      `  Rule source: ${rule?.source ?? 'not available'}`,
      `  Rule verification: ${rule?.verificationStatus ?? 'not available'}${rule?.verifiedOn ? ` (${rule.verifiedOn})` : ''}`,
      `  Rule source version: ${rule?.sourceVersion ?? evaluation.ruleVersion}`,
      `  Reason: ${evaluation.reason}`,
      `  Evidence-backed explanation: ${explanation?.text ?? 'not available'}`,
      `  Observation: ${evaluation.observationId ?? 'none'}`,
      `  Confidence: ${evaluation.observationConfidence === null ? 'not available' : `${Math.round(evaluation.observationConfidence * 100)}%`}`,
      `  Evidence image: ${evaluation.evidence?.imageId ?? 'none'}`,
      `  Evidence source reference: ${sourceImage?.storageKey ?? evaluation.evidence?.sourceImage?.storageKey ?? 'not available'}`,
      `  Evidence bounding box: ${evaluation.evidence?.boundingBox ? JSON.stringify(evaluation.evidence.boundingBox) : 'not available'}`,
    );
  }

  lines.push('', 'OBSERVATIONS', '------------');
  for (const observation of report.observations) {
    const sourceImage = observation.evidence ? report.evidenceImages.find((image) => image.id === observation.evidence!.imageId) : undefined;
    const value = isBarcodeScaleEstimateValue(observation.value) ? formatBarcodeScaleEstimate(observation.value) : formatObservationValue(observation.value);
    lines.push(`${observation.id}: ${observation.field} = ${value} [${observation.status}], confidence ${Math.round(observation.confidence * 100)}%, evidence ${observation.evidence?.imageId ?? 'none'} (${sourceImage?.storageKey ?? observation.evidence?.sourceImage?.storageKey ?? 'not available'})`);
    if (isBarcodeScaleEstimateValue(observation.value)) {
      lines.push(`  Estimate assumptions: ${observation.value.assumptions.join(' ')}`);
      lines.push(`  Estimate limitations: ${observation.value.limitations.join(' ')}`);
    }
  }

  lines.push('', 'LIMITATIONS', '-----------', ...report.limitations.map((limitation) => `- ${limitation}`), '', 'DISCLAIMER', '----------', report.disclaimer);
  return lines.join('\n');
}

function formatObservationValue(value: unknown): string {
  if (value === null || value === undefined) return 'no value';
  return typeof value === 'object' ? JSON.stringify(value) ?? 'structured value' : String(value);
}
