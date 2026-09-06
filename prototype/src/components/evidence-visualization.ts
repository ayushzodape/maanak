import { CanonicalScanResult, EvidenceReference } from '../domain';

export interface EvidencePoint {
  readonly evaluationId: string;
  readonly result: CanonicalScanResult['overallResult'];
  readonly evidence: EvidenceReference;
}

/** Only references already present on canonical evaluations are renderable. */
export function collectEvidencePoints(result: CanonicalScanResult, imageId: string): readonly EvidencePoint[] {
  return result.evaluations
    .filter((evaluation) => evaluation.evidence?.imageId === imageId)
    .map((evaluation) => ({
      evaluationId: evaluation.id,
      result: evaluation.result,
      evidence: evaluation.evidence!,
    }));
}
