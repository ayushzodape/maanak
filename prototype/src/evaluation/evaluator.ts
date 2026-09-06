import {
  CanonicalScanResult,
  createCanonicalScanResult,
  createEvaluation,
  Evaluation,
  Observation,
  Rule,
} from '../domain';

export interface EvaluationBundle {
  readonly evaluations: readonly Evaluation[];
  readonly canonicalResult: CanonicalScanResult;
}

function resultForObservation(observation: Observation | undefined, rule: Rule) {
  if (!observation) {
    return { result: 'UNCERTAIN' as const, reason: `No observation was supplied for ${rule.title}.` };
  }

  switch (observation.status) {
    case 'OBSERVED':
      return observation.evidence
        ? { result: 'PASS' as const, reason: `${rule.title} was observed in the referenced evidence.` }
        : { result: 'UNCERTAIN' as const, reason: `${rule.title} has no traceable evidence.` };
    case 'NOT_DETECTED':
      return observation.evidence
        ? { result: 'FAIL' as const, reason: `${rule.title} was not detected in the referenced evidence.` }
        : { result: 'UNCERTAIN' as const, reason: `${rule.title} was not detected without traceable evidence.` };
    case 'NOT_MEASURABLE':
      return { result: 'NOT_MEASURABLE' as const, reason: `${rule.title} cannot be reliably determined from the available evidence.` };
    case 'UNCERTAIN':
    case 'NOT_VISIBLE':
      return { result: 'UNCERTAIN' as const, reason: `${rule.title} cannot be determined with the available observation.` };
  }
}

function evaluateRule(observations: readonly Observation[], rule: Rule): Evaluation {
  const field = rule.logic.kind === 'DECLARATION_PRESENCE' || rule.logic.kind === 'BLOCKED'
    ? rule.logic.field ?? null
    : null;
  const matching = field ? observations.filter((observation) => observation.field === field) : [];
  const observation = matching[0];

  const outcome = rule.logic.kind === 'NOT_APPLICABLE'
    ? { result: 'NOT_APPLICABLE' as const, reason: rule.logic.reason }
    : rule.verificationStatus !== 'VERIFIED'
    ? observation?.status === 'NOT_MEASURABLE'
      ? { result: 'NOT_MEASURABLE' as const, reason: `${rule.title} is blocked and the required measurement is not measurable.` }
      : { result: 'UNCERTAIN' as const, reason: `${rule.title} is blocked: ${rule.logic.kind === 'BLOCKED' ? rule.logic.reason : 'the rule is not verified.'}` }
    : resultForObservation(observation, rule);

  return createEvaluation({
    id: `evaluation-${rule.id}`,
    ruleId: rule.id,
    ruleVersion: rule.sourceVersion,
    observationId: observation?.id ?? null,
    result: outcome.result,
    observationConfidence: observation?.confidence ?? null,
    observedValue: observation?.value,
    reason: outcome.reason,
    evidence: observation?.evidence ?? null,
    evaluatedAt: new Date().toISOString(),
  });
}

function overallResult(evaluations: readonly Evaluation[]) {
  if (evaluations.some(({ result }) => result === 'FAIL')) return 'FAIL' as const;
  if (evaluations.some(({ result }) => result === 'UNCERTAIN')) return 'UNCERTAIN' as const;
  if (evaluations.some(({ result }) => result === 'NOT_MEASURABLE')) return 'NOT_MEASURABLE' as const;
  if (evaluations.every(({ result }) => result === 'NOT_APPLICABLE')) return 'NOT_APPLICABLE' as const;
  return 'PASS' as const;
}

export function evaluateObservations(
  observations: readonly Observation[],
  rules: readonly Rule[],
): readonly Evaluation[] {
  return rules.map((rule) => evaluateRule(observations, rule));
}

export function evaluateScan(
  scanId: string,
  observations: readonly Observation[],
  rules: readonly Rule[],
  evaluatedAt = new Date().toISOString(),
): EvaluationBundle {
  const evaluations = evaluateObservations(observations, rules);
  const canonicalResult = createCanonicalScanResult({
    scanId,
    overallResult: overallResult(evaluations),
    evaluations,
    generatedAt: evaluatedAt,
    source: 'DETERMINISTIC_RULE_ENGINE',
  });
  return { evaluations, canonicalResult };
}
