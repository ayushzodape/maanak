import { CanonicalScanResult, Observation, Rule, Scan } from '../domain';

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
    readonly createdAt: string;
    readonly completedAt?: string;
  };
  readonly canonicalResult: CanonicalScanResult;
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
      createdAt: scan.timestamps.createdAt,
      ...(scan.timestamps.completedAt ? { completedAt: scan.timestamps.completedAt } : {}),
    },
    canonicalResult,
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
    lines.push(
      `${evaluation.ruleId}: ${evaluation.result}`,
      `  Reason: ${evaluation.reason}`,
      `  Observation: ${evaluation.observationId ?? 'none'}`,
      `  Confidence: ${evaluation.observationConfidence === null ? 'not available' : `${Math.round(evaluation.observationConfidence * 100)}%`}`,
      `  Evidence image: ${evaluation.evidence?.imageId ?? 'none'}`,
      `  Evidence bounding box: ${evaluation.evidence?.boundingBox ? JSON.stringify(evaluation.evidence.boundingBox) : 'not available'}`,
    );
  }

  lines.push('', 'OBSERVATIONS', '------------');
  for (const observation of report.observations) {
    lines.push(`${observation.id}: ${observation.field} = ${observation.value ?? 'no value'} [${observation.status}], confidence ${Math.round(observation.confidence * 100)}%, evidence ${observation.evidence?.imageId ?? 'none'}`);
  }

  lines.push('', 'LIMITATIONS', '-----------', ...report.limitations.map((limitation) => `- ${limitation}`), '', 'DISCLAIMER', '----------', report.disclaimer);
  return lines.join('\n');
}
