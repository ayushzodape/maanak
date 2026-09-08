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
      if (observation.extractionMethod === 'SYSTEM_CONFLICT_RESOLUTION') {
        return { result: 'UNCERTAIN' as const, reason: `Conflicting values observed for ${rule.title} across multiple images.` };
      }
      return { result: 'UNCERTAIN' as const, reason: `${rule.title} cannot be determined with the available observation.` };
  }
}

function evaluateRule7(observations: readonly Observation[], rule: Rule): { result: 'PASS' | 'FAIL' | 'UNCERTAIN' | 'NOT_APPLICABLE' | 'NOT_MEASURABLE'; reason: string; observation?: Observation } {
  if (rule.logic.kind !== 'CHARACTER_HEIGHT_AREA') throw new Error('invalid Rule 7 logic');
  const get = (field: string) => selectBestObservation(observations.filter((item) => item.field === field));
  const scope = get(rule.logic.fields.packageScope);
  if (scope?.status === 'UNCERTAIN' || scope?.status === 'NOT_VISIBLE') return { result: 'UNCERTAIN', reason: 'Rule 7 applicability cannot be determined from the available evidence.', observation: scope };
  if (scope?.value === false || scope?.value === 'OUT_OF_SCOPE') return { result: 'NOT_APPLICABLE', reason: 'The package is outside the supplied Rule 7 scope.', observation: scope };
  const area = get(rule.logic.fields.panelArea);
  const height = get(rule.logic.fields.characterHeight);
  const width = get(rule.logic.fields.characterWidth);
  const method = get(rule.logic.fields.markingMethod);
  if ([area, height, width, method].some((item) => !item || item.status === 'NOT_MEASURABLE')) return { result: 'NOT_MEASURABLE', reason: 'Rule 7 requires reliable panel-area and character measurements with a traceable scale reference.', observation: area ?? height };
  if ([area, height, width, method].some((item) => item!.status !== 'OBSERVED')) return { result: 'UNCERTAIN', reason: 'Rule 7 measurement evidence is not sufficiently reliable.', observation: area };
  const a = Number(area!.value), h = Number(height!.value), w = Number(width!.value);
  if (![a, h, w].every(Number.isFinite) || a < 0 || h < 0 || w < 0) return { result: 'UNCERTAIN', reason: 'Rule 7 measurement observations are invalid.', observation: area };
  const blown = ['BLOWN', 'FORMED', 'MOULDED', 'MOLDED', 'EMBOSSED', 'PERFORATED'].includes(String(method!.value).toUpperCase());
  const required = a < 50 ? (blown ? 1.5 : 1) : a < 100 ? (blown ? 3 : 1.5) : a < 500 ? (blown ? 4 : 2.5) : a < 2500 ? (blown ? 6 : 4) : 6;
  return h >= required && w >= h / 3
    ? { result: 'PASS', reason: `Observed character height and width meet Rule 7 Table-I and Rule 7(3) thresholds.`, observation: height }
    : { result: 'FAIL', reason: `Observed character dimensions do not meet the Rule 7 Table-I height or Rule 7(3) width threshold.`, observation: height };
}

const STATUS_PRIORITY: Record<string, number> = {
  OBSERVED: 5,
  UNCERTAIN: 4,
  NOT_MEASURABLE: 3,
  NOT_VISIBLE: 2,
  NOT_DETECTED: 1,
};

function selectBestObservation(matching: readonly Observation[]): Observation | undefined {
  if (matching.length === 0) return undefined;
  
  const sorted = [...matching].sort((a, b) => {
    const priorityDiff = (STATUS_PRIORITY[b.status] ?? 0) - (STATUS_PRIORITY[a.status] ?? 0);
    if (priorityDiff !== 0) return priorityDiff;
    const confDiff = (b.confidence ?? 0) - (a.confidence ?? 0);
    if (confDiff !== 0) return confDiff;
    const aEvidence = a.evidence ? 1 : 0;
    const bEvidence = b.evidence ? 1 : 0;
    return bEvidence - aEvidence;
  });

  const best = sorted[0];

  if (best.status === 'OBSERVED') {
    const observedItems = matching.filter(o => o.status === 'OBSERVED');
    const uniqueValues = new Set(observedItems.map(o => String(o.value).trim().toLowerCase()));
    
    if (uniqueValues.size > 1) {
      return {
        id: `conflict-${best.id}`,
        field: best.field,
        value: null,
        confidence: 0,
        status: 'UNCERTAIN',
        evidence: null,
        extractionMethod: 'SYSTEM_CONFLICT_RESOLUTION',
        observedAt: new Date().toISOString()
      };
    }
  }

  return best;
}

function evaluateRule(observations: readonly Observation[], rule: Rule): Evaluation {
  const field = rule.logic.kind === 'DECLARATION_PRESENCE' || rule.logic.kind === 'BLOCKED'
    ? rule.logic.field ?? null
    : null;
  const matching = field ? observations.filter((observation) => observation.field === field) : [];
  const observation = selectBestObservation(matching);

  const outcome = rule.logic.kind === 'CHARACTER_HEIGHT_AREA'
    ? evaluateRule7(observations, rule)
    : rule.logic.kind === 'NOT_APPLICABLE'
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
    observationId: ('observation' in outcome ? outcome.observation?.id : observation?.id) ?? null,
    result: outcome.result,
    observationConfidence: ('observation' in outcome ? outcome.observation?.confidence : observation?.confidence) ?? null,
    observedValue: ('observation' in outcome ? outcome.observation?.value : observation?.value),
    reason: outcome.reason,
    evidence: ('observation' in outcome ? outcome.observation?.evidence : observation?.evidence) ?? null,
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
