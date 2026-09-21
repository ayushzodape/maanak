import { ComplianceResult, Scan } from '../domain';
import { ScanHistoryEntry } from '../services/scanApi';

export interface ManufacturerTrendSummary {
  readonly manufacturer: string;
  readonly totalScans: number;
  readonly byResult: Record<ComplianceResult, number>;
  readonly recurringViolations: readonly {
    readonly ruleId: string;
    readonly title: string;
    readonly count: number;
  }[];
  readonly complianceRate: number; // percentage (0-100)
  readonly screeningCategory:
    | 'REPEAT_NON_COMPLIANCE'
    | 'MIXED_SCREENING_HISTORY'
    | 'LARGELY_COMPLIANT'
    | 'LIMITED_DATA';
}

/**
 * Derives manufacturer screening history and recurring screening findings.
 *
 * NOTE: Per Rule 15 of AGENTS.md, historical scan trends represent digital screening
 * findings only and must never be represented as proof of legal wrongdoing.
 */
export function deriveManufacturerTrends(entries: readonly ScanHistoryEntry[]): ManufacturerTrendSummary[] {
  const groups = new Map<string, ScanHistoryEntry[]>();

  for (const entry of entries) {
    const obs = entry.scan.observations.find((o) => o.field === 'manufacturer' && o.status === 'OBSERVED');
    let mfg = typeof obs?.value === 'string' && obs.value.trim().length > 0
      ? obs.value.trim()
      : undefined;

    if (!mfg) {
      const words = entry.scan.productName.trim().split(/\s+/);
      mfg = words.length > 0 && words[0].length > 1 ? words.slice(0, 2).join(' ') : 'Unspecified Manufacturer';
    }

    const key = mfg.toLocaleLowerCase();
    const list = groups.get(key) ?? [];
    list.push(entry);
    groups.set(key, list);
  }

  const results: ManufacturerTrendSummary[] = [];

  for (const group of groups.values()) {
    const totalScans = group.length;
    const byResult: Record<ComplianceResult, number> = {
      PASS: 0,
      FAIL: 0,
      UNCERTAIN: 0,
      NOT_APPLICABLE: 0,
      NOT_MEASURABLE: 0,
    };

    const violationCounts = new Map<string, { count: number; title: string }>();

    for (const item of group) {
      byResult[item.result.overallResult]++;
      for (const ev of item.result.evaluations) {
        if (ev.result === 'FAIL') {
          const current = violationCounts.get(ev.ruleId) ?? { count: 0, title: ev.ruleId };
          violationCounts.set(ev.ruleId, { count: current.count + 1, title: current.title });
        }
      }
    }

    const recurringViolations = [...violationCounts.entries()]
      .map(([ruleId, { count, title }]) => ({ ruleId, count, title }))
      .sort((a, b) => b.count - a.count);

    const complianceRate = totalScans > 0 ? Math.round((byResult.PASS / totalScans) * 100) : 0;

    let screeningCategory: ManufacturerTrendSummary['screeningCategory'] = 'LIMITED_DATA';
    if (totalScans >= 2) {
      if (byResult.FAIL >= 2) {
        screeningCategory = 'REPEAT_NON_COMPLIANCE';
      } else if (byResult.FAIL > 0) {
        screeningCategory = 'MIXED_SCREENING_HISTORY';
      } else {
        screeningCategory = 'LARGELY_COMPLIANT';
      }
    }

    const obsValue = group[0].scan.observations.find((o) => o.field === 'manufacturer' && o.status === 'OBSERVED')?.value;
    const displayMfg = typeof obsValue === 'string' && obsValue.trim().length > 0
      ? obsValue.trim()
      : group[0].scan.productName.trim().split(/\s+/).slice(0, 2).join(' ');

    results.push({
      manufacturer: displayMfg,
      totalScans,
      byResult,
      recurringViolations,
      complianceRate,
      screeningCategory,
    });
  }

  return results.sort((a, b) => b.totalScans - a.totalScans);
}
