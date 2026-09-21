import assert from 'node:assert/strict';
import test from 'node:test';
import { createCanonicalScanResult, createEvidenceImage, createEvaluation, createObservation, createScan } from '../domain';
import { CURRENT_RULE_DEFINITIONS } from '../evaluation';
import { createBarcodeScaleObservation } from '../measurement';
import { createScreeningReport, renderCsvReport, renderDocxReport, renderHumanReadableReport, renderPdfReport, SCREENING_DISCLAIMER, serializeCanonicalJson } from './screening-report';

const now = '2026-09-06T10:00:00.000Z';
const image = createEvidenceImage({ id: 'image-1', storageKey: 'scans/scan-1/source.jpg', mimeType: 'image/jpeg', byteSize: 100, sha256: 'hash', width: 1000, height: 1000, capturedAt: now, createdAt: now });
const observation = createObservation({ id: 'observation-1', field: 'mrp', value: 120, unit: 'INR', confidence: 0.94, status: 'OBSERVED', evidence: { imageId: image.id, sourceImage: { storageKey: image.storageKey } }, extractionMethod: 'VISION_EXTRACTION', observedAt: now });
const reportRule = CURRENT_RULE_DEFINITIONS.find((rule) => rule.logic.kind === 'DECLARATION_PRESENCE' && rule.logic.field === 'mrp')!;
const evaluation = createEvaluation({ id: 'evaluation-1', ruleId: reportRule.id, ruleVersion: reportRule.sourceVersion, observationId: observation.id, result: 'PASS', observationConfidence: observation.confidence, observedValue: observation.value, reason: 'Observed in source evidence.', evidence: observation.evidence, evaluatedAt: now });
const canonicalResult = createCanonicalScanResult({ scanId: 'scan-1', overallResult: 'PASS', evaluations: [evaluation], generatedAt: now, source: 'DETERMINISTIC_RULE_ENGINE' });
const scan = createScan({ id: 'scan-1', productName: 'Test commodity', sourceType: 'PHYSICAL_PHOTO', mode: 'LIVE', images: [image], observations: [observation], evaluations: [evaluation], ruleVersion: reportRule.sourceVersion, processing: { stage: 'COMPLETE', lifecycle: 'COMPLETE' }, timestamps: { createdAt: now, updatedAt: now, completedAt: now } });

test('JSON and human-readable report derive the same canonical result', () => {
  const report = createScreeningReport(scan, canonicalResult, CURRENT_RULE_DEFINITIONS, now);
  const json = JSON.parse(serializeCanonicalJson(report)) as typeof report;
  const text = renderHumanReadableReport(report);
  assert.deepEqual(json.canonicalResult, canonicalResult);
  assert.equal(json.explanations.length, canonicalResult.evaluations.length);
  assert.equal(json.explanations[0].result, canonicalResult.evaluations[0].result);
  assert.match(text, new RegExp(`Screening result: ${canonicalResult.overallResult}`));
  assert.match(text, new RegExp(evaluation.ruleId));
  assert.match(text, new RegExp(evaluation.result));
  assert.match(text, new RegExp(evaluation.evidence!.imageId));
  assert.match(text, new RegExp(reportRule.source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(text, /Evidence-backed explanation:/);
});

test('report includes required metadata, evidence, limitations, and disclaimer', () => {
  const report = createScreeningReport(scan, canonicalResult, CURRENT_RULE_DEFINITIONS, now);
  assert.equal(report.scan.productName, scan.productName);
  assert.equal(report.scan.sourceType, scan.sourceType);
  assert.deepEqual(report.observations, scan.observations);
  assert.deepEqual(report.evidenceImages, scan.images);
  assert.equal(report.disclaimer, SCREENING_DISCLAIMER);
  assert.ok(report.limitations.some((limitation) => limitation.includes('certified measurement')));
});

test('report rejects a canonical result belonging to another scan', () => {
  assert.throws(() => createScreeningReport(scan, { ...canonicalResult, scanId: 'other-scan' }, CURRENT_RULE_DEFINITIONS, now), /does not belong/);
});

test('report rejects evaluations that are not traceable to the scan or rule version', () => {
  assert.throws(() => createScreeningReport(scan, {
    ...canonicalResult,
    evaluations: [{ ...evaluation, observationId: 'missing-observation' }],
  }, CURRENT_RULE_DEFINITIONS, now), /unknown observation/);
  assert.throws(() => createScreeningReport(scan, {
    ...canonicalResult,
    evaluations: [{ ...evaluation, ruleVersion: 'wrong-version' }],
  }, CURRENT_RULE_DEFINITIONS, now), /does not match rule/);
});

test('human-readable report labels barcode data as an estimate with assumptions and limitations', () => {
  const barcodeObservation = createBarcodeScaleObservation({
    id: 'observation-barcode',
    image,
    barcodeFormat: 'EAN_13',
    boundingBox: { x: 0.1, y: 0.2, width: 0.25, height: 0.1 },
    detectionConfidence: 0.96,
    minimumDetectionConfidence: 0.8,
    observedAt: now,
  });
  const report = createScreeningReport({ ...scan, observations: [observation, barcodeObservation] }, canonicalResult, CURRENT_RULE_DEFINITIONS, now);
  const text = renderHumanReadableReport(report);

  assert.match(text, /SCREENING ESTIMATE/);
  assert.match(text, /Estimate assumptions:/);
  assert.match(text, /Estimate limitations:/);
  assert.match(text, /not a certified measurement/i);
  assert.match(text, /must not be used as a legal fact/i);
});

test('renderPdfReport generates valid PDF byte stream with metadata and sections', () => {
  const report = createScreeningReport(scan, canonicalResult, CURRENT_RULE_DEFINITIONS, now);
  const pdfBytes = renderPdfReport(report);
  assert.ok(pdfBytes instanceof Uint8Array);
  assert.ok(pdfBytes.length > 1000);
  const pdfString = new TextDecoder('latin1').decode(pdfBytes);
  assert.ok(pdfString.startsWith('%PDF-1.4'));
  assert.ok(pdfString.includes('%%EOF'));
  assert.ok(pdfString.includes('MAANAK'));
  assert.ok(pdfString.includes('STATUTORY RULE EVALUATIONS'));
  assert.ok(pdfString.includes('Page 1 of'));
});

test('renderDocxReport generates valid DOCX OpenXML zip stream with required XML parts', () => {
  const report = createScreeningReport(scan, canonicalResult, CURRENT_RULE_DEFINITIONS, now);
  const docxBytes = renderDocxReport(report);
  assert.ok(docxBytes instanceof Uint8Array);
  assert.ok(docxBytes.length > 500);
  // Check ZIP local header signature PK\x03\x04
  assert.equal(docxBytes[0], 0x50); // P
  assert.equal(docxBytes[1], 0x4B); // K
  assert.equal(docxBytes[2], 0x03);
  assert.equal(docxBytes[3], 0x04);
  const docxString = new TextDecoder('utf-8', { fatal: false }).decode(docxBytes);
  assert.ok(docxString.includes('word/document.xml'));
  assert.ok(docxString.includes('[Content_Types].xml'));
  assert.ok(docxString.includes('MAANAK - PACKAGED COMMODITIES SCREENING REPORT'));
  assert.ok(docxString.includes('STATUTORY SCREENING DISCLAIMER'));
});

test('renderCsvReport generates valid tabular CSV with disclaimer and findings', () => {
  const report = createScreeningReport(scan, canonicalResult, CURRENT_RULE_DEFINITIONS, now);
  const csv = renderCsvReport(report);
  assert.match(csv, /MAANAK DIGITAL COMPLIANCE SCREENING REPORT/);
  assert.match(csv, /Rule ID,Statutory Requirement,Status/);
  assert.match(csv, /LMPC_RULE_6_MRP/);
  assert.match(csv, /PASS/);
  assert.match(csv, /screening system/i);
});
