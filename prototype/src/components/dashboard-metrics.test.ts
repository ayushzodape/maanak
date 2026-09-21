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

import { deriveManufacturerTrends } from '../analytics';

test('deriveManufacturerTrends groups by manufacturer and flags repeat screening findings', () => {
  const timestamp = '2026-09-06T00:00:00.000Z';
  const makeScan = (id: string, productName: string, mfg: string, resultState: CanonicalScanResult['overallResult'], failedRuleId?: string): ScanHistoryEntry => ({
    scan: {
      id,
      productName,
      sourceType: 'PHYSICAL_PHOTO',
      mode: 'LIVE',
      images: [],
      observations: [{
        id: `obs-mfg-${id}`,
        field: 'manufacturer',
        value: mfg,
        unit: null,
        confidence: 0.95,
        status: 'OBSERVED',
        evidence: { imageId: 'img-1' },
        extractionMethod: 'AI_EXTRACTION',
        observedAt: timestamp,
      }],
      evaluations: [],
      ruleVersion: 'verified-test-ruleset',
      processing: { stage: 'COMPLETE', lifecycle: 'COMPLETE' },
      timestamps: { createdAt: timestamp, updatedAt: timestamp, completedAt: timestamp },
    },
    result: {
      scanId: id,
      overallResult: resultState,
      evaluations: failedRuleId ? [{
        id: `eval-${id}`,
        ruleId: failedRuleId,
        ruleVersion: 'verified-test-ruleset',
        observationId: `obs-mfg-${id}`,
        result: 'FAIL',
        observationConfidence: 0.95,
        reason: 'Failed declaration',
        evidence: null,
        evaluatedAt: timestamp,
      }] : [],
      generatedAt: timestamp,
      source: 'DETERMINISTIC_RULE_ENGINE',
    },
  });

  const entries: ScanHistoryEntry[] = [
    makeScan('s1', 'Parle-G Biscuit 1', 'Parle Products Ltd', 'FAIL', 'RULE-6-1-E'),
    makeScan('s2', 'Parle-G Biscuit 2', 'Parle Products Ltd', 'FAIL', 'RULE-6-1-E'),
    makeScan('s3', 'Parle Monaco', 'Parle Products Ltd', 'PASS'),
    makeScan('s4', 'Nestle KitKat', 'Nestle India', 'PASS'),
  ];

  const trends = deriveManufacturerTrends(entries);
  assert.equal(trends.length, 2);

  const parle = trends.find((t) => t.manufacturer === 'Parle Products Ltd');
  assert.ok(parle);
  assert.equal(parle.totalScans, 3);
  assert.equal(parle.byResult.FAIL, 2);
  assert.equal(parle.byResult.PASS, 1);
  assert.equal(parle.complianceRate, 33);
  assert.equal(parle.screeningCategory, 'REPEAT_NON_COMPLIANCE');
  assert.equal(parle.recurringViolations.length, 1);
  assert.equal(parle.recurringViolations[0].ruleId, 'RULE-6-1-E');
  assert.equal(parle.recurringViolations[0].count, 2);

  const nestle = trends.find((t) => t.manufacturer === 'Nestle India');
  assert.ok(nestle);
  assert.equal(nestle.totalScans, 1);
  assert.equal(nestle.screeningCategory, 'LIMITED_DATA');
});

