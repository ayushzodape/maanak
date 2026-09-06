import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveDashboardMetrics } from './EnforcementDashboard';
import { CanonicalScanResult, Scan } from '../domain';
import { ScanHistoryEntry } from '../services/scanApi';

function entry(id: string, overallResult: CanonicalScanResult['overallResult']): ScanHistoryEntry {
  const timestamp = '2026-09-06T00:00:00.000Z';
  const scan: Scan = {
    id,
    productName: id,
    sourceType: 'PHYSICAL_PHOTO',
    mode: 'LIVE',
    images: [],
    observations: [],
    evaluations: [],
    ruleVersion: 'verified-test-ruleset',
    processing: { stage: 'COMPLETE', lifecycle: 'COMPLETE' },
    timestamps: { createdAt: timestamp, updatedAt: timestamp, completedAt: timestamp },
  };
  return { scan, result: { scanId: id, overallResult, evaluations: [], generatedAt: timestamp, source: 'DETERMINISTIC_RULE_ENGINE' } };
}

test('dashboard metrics count only persisted canonical result states', () => {
  const metrics = deriveDashboardMetrics([
    entry('pass-scan', 'PASS'),
    entry('fail-scan', 'FAIL'),
    entry('uncertain-scan', 'UNCERTAIN'),
    entry('not-measurable-scan', 'NOT_MEASURABLE'),
  ]);

  assert.equal(metrics.completedScans, 4);
  assert.deepEqual(metrics.byResult, { PASS: 1, FAIL: 1, UNCERTAIN: 1, NOT_APPLICABLE: 0, NOT_MEASURABLE: 1 });
});
