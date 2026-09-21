import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createCanonicalScanResult, createEvidenceImage, createEvaluation, createScan } from '../src/domain';
import { FileScanRepository } from './repository';

function scan(id: string, productName: string, createdAt: string) {
  const image = createEvidenceImage({
    id: `image-${id}`,
    storageKey: `scans/${id}/source.jpg`,
    mimeType: 'image/jpeg',
    byteSize: 10,
    sha256: `hash-${id}`,
    width: 100,
    height: 100,
    capturedAt: createdAt,
    createdAt,
  });
  return createScan({
    id,
    productName,
    sourceType: 'PHYSICAL_PHOTO',
    mode: 'LIVE',
    images: [image],
    observations: [],
    evaluations: [],
    ruleVersion: 'verified-test-ruleset',
    processing: { stage: 'IDLE', lifecycle: 'DRAFT' },
    timestamps: { createdAt, updatedAt: createdAt },
  });
}

function result(scanId: string, generatedAt: string, complianceResult: 'PASS' | 'FAIL') {
  return createCanonicalScanResult({
    scanId,
    overallResult: complianceResult,
    evaluations: [createEvaluation({
      id: `evaluation-${scanId}`,
      ruleId: 'verified-test-rule',
      ruleVersion: 'verified-test-ruleset',
      observationId: null,
      result: complianceResult,
      observationConfidence: null,
      reason: 'Test result with no fabricated observation.',
      evidence: complianceResult === 'PASS' || complianceResult === 'FAIL'
        ? { imageId: `image-${scanId}`, sourceImage: { storageKey: `scans/${scanId}/source.jpg` } }
        : null,
      evaluatedAt: generatedAt,
    })],
    generatedAt,
    source: 'DETERMINISTIC_RULE_ENGINE',
  });
}

test('file repository reloads completed scans and their canonical results', () => {
  const directory = mkdtempSync(join(tmpdir(), 'maanak-history-'));
  try {
    const first = new FileScanRepository(directory);
    first.create(scan('scan-history-1', 'Aloe Soap', '2026-09-01T10:00:00.000Z'));
    first.saveCanonicalResult('scan-history-1', result('scan-history-1', '2026-09-01T10:05:00.000Z', 'PASS'));

    const reloaded = new FileScanRepository(directory);
    const entries = reloaded.listCompleted();
    assert.equal(entries.length, 1);
    assert.equal(entries[0].scan.id, 'scan-history-1');
    assert.equal(entries[0].result.scanId, 'scan-history-1');
    assert.equal(entries[0].result.overallResult, 'PASS');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('history search, result, and date filters operate on persisted canonical entries', () => {
  const directory = mkdtempSync(join(tmpdir(), 'maanak-history-filters-'));
  try {
    const repository = new FileScanRepository(directory);
    repository.create(scan('scan-history-1', 'Aloe Soap', '2026-09-01T10:00:00.000Z'));
    repository.saveCanonicalResult('scan-history-1', result('scan-history-1', '2026-09-01T10:05:00.000Z', 'PASS'));
    repository.create(scan('scan-history-2', 'Rice Flour', '2026-09-03T10:00:00.000Z'));
    repository.saveCanonicalResult('scan-history-2', result('scan-history-2', '2026-09-03T10:05:00.000Z', 'FAIL'));

    assert.deepEqual(repository.listCompleted({ productName: 'soap' }).map((entry) => entry.scan.id), ['scan-history-1']);
    assert.deepEqual(repository.listCompleted({ result: 'FAIL' }).map((entry) => entry.scan.id), ['scan-history-2']);
    assert.deepEqual(repository.listCompleted({ from: '2026-09-02T00:00:00.000Z', to: '2026-09-04T00:00:00.000Z' }).map((entry) => entry.scan.id), ['scan-history-2']);
    assert.equal(repository.listCompleted({ productName: 'coffee' }).length, 0);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('repository groups scans by manufacturer and calculates recurring screening findings', () => {
  const directory = mkdtempSync(join(tmpdir(), 'maanak-mfg-trends-'));
  try {
    const repository = new FileScanRepository(directory);
    const scanA1 = scan('scan-a1', 'Britannia Biscuits Pack 1', '2026-09-01T10:00:00.000Z');
    const scanA2 = scan('scan-a2', 'Britannia Biscuits Pack 2', '2026-09-02T10:00:00.000Z');
    repository.create(scanA1);
    repository.saveCanonicalResult('scan-a1', result('scan-a1', '2026-09-01T10:05:00.000Z', 'PASS'));
    repository.create(scanA2);
    repository.saveCanonicalResult('scan-a2', result('scan-a2', '2026-09-02T10:05:00.000Z', 'FAIL'));

    const trends = repository.getManufacturerTrends();
    assert.ok(trends.length >= 1);
    const britannia = trends.find((t) => t.manufacturer.toLowerCase().includes('britannia'));
    assert.ok(britannia);
    assert.equal(britannia.totalScans, 2);
    assert.equal(britannia.byResult.PASS, 1);
    assert.equal(britannia.byResult.FAIL, 1);
    assert.equal(britannia.complianceRate, 50);
    assert.equal(britannia.screeningCategory, 'MIXED_SCREENING_HISTORY');
    assert.equal(britannia.recurringViolations.length, 1);
    assert.equal(britannia.recurringViolations[0].ruleId, 'verified-test-rule');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

