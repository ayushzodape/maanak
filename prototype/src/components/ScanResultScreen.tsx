import React, { useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, ExternalLink, Image as ImageIcon, Info, Ruler, ShieldAlert, X } from 'lucide-react';
import { CanonicalScanResult, CommodityCategory, Observation, Rule, Scan } from '../domain';
import { CURRENT_RULE_DEFINITIONS } from '../evaluation';
import { collectEvidencePoints } from './evidence-visualization';
import { createScreeningReport, renderHumanReadableReport, renderPdfReport, serializeCanonicalJson, SCREENING_DISCLAIMER } from '../reports';
import { formatBarcodeScaleEstimate, isBarcodeScaleEstimateValue } from '../measurement';
import { EvidenceBackedExplanation } from '../explanations';

interface ScanResultScreenProps {
  scan: Scan;
  result: CanonicalScanResult;
  onBack: () => void;
  onRetry: () => void;
}

export const COMMODITY_CATEGORY_LABELS: Record<CommodityCategory, string> = {
  GENERAL_RETAIL: 'General Retail',
  FOOD_BEVERAGE: 'Food & Beverages',
  PHARMACEUTICAL: 'Pharmaceuticals / Drugs',
  COSMETIC: 'Cosmetics & Personal Care',
  SMALL_SACHET: 'Small Sachet (≤ 10g / 10ml)',
  INDUSTRIAL_BULK: 'Wholesale / Industrial (> 25kg / 25L)',
};

const RESULT_STYLES: Record<CanonicalScanResult['overallResult'], { label: string; classes: string; icon: React.ReactNode }> = {
  PASS: { label: 'PASS', classes: 'bg-emerald-50 border-emerald-200 text-emerald-900', icon: <CheckCircle2 className="w-7 h-7 text-emerald-600" /> },
  FAIL: { label: 'FAIL', classes: 'bg-rose-50 border-rose-200 text-rose-900', icon: <ShieldAlert className="w-7 h-7 text-rose-600" /> },
  UNCERTAIN: { label: 'UNCERTAIN', classes: 'bg-amber-50 border-amber-200 text-amber-900', icon: <Info className="w-7 h-7 text-amber-600" /> },
  NOT_APPLICABLE: { label: 'NOT APPLICABLE', classes: 'bg-slate-100 border-slate-300 text-slate-800', icon: <Info className="w-7 h-7 text-slate-500" /> },
  NOT_MEASURABLE: { label: 'NOT MEASURABLE', classes: 'bg-orange-50 border-orange-200 text-orange-900', icon: <Ruler className="w-7 h-7 text-orange-600" /> },
};

function resultBadge(result: CanonicalScanResult['overallResult']) {
  const style = RESULT_STYLES[result];
  return <span className={`inline-flex items-center rounded border px-2 py-1 text-[10px] font-bold tracking-wider ${style.classes}`}>{style.label}</span>;
}

export const ScanResultScreen: React.FC<ScanResultScreenProps> = ({ scan, result, onBack, onRetry }) => {
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
  const [exportAcknowledged, setExportAcknowledged] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const style = RESULT_STYLES[result.overallResult];
  const observationsById = useMemo(() => new Map(scan.observations.map((observation) => [observation.id, observation])), [scan.observations]);
  const barcodeEstimates = useMemo(() => scan.observations.filter((observation) => isBarcodeScaleEstimateValue(observation.value)), [scan.observations]);
  const rulesById = useMemo(() => new Map(CURRENT_RULE_DEFINITIONS.map((rule) => [rule.id, rule])), []);
  const reportBuild = useMemo(() => {
    try {
      return { report: createScreeningReport(scan, result, CURRENT_RULE_DEFINITIONS), error: null };
    } catch (error) {
      return { report: null, error: error instanceof Error ? error.message : 'The screening report could not be prepared.' };
    }
  }, [scan, result]);
  const report = reportBuild.report;
  const explanationsByEvaluationId = useMemo(() => new Map((report?.explanations ?? []).map((explanation) => [explanation.evaluationId, explanation])), [report]);

  const download = (filename: string, content: string | Uint8Array, type: string) => {
    try {
      const url = URL.createObjectURL(new Blob([content as BlobPart], { type }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      return 'The report download could not be started. Please retry.';
    }
    return null;
  };

  const exportReport = (filename: string, content: string | Uint8Array, type: string) => {
    setExportError(null);
    const error = download(filename, content, type);
    if (error) setExportError(error);
  };

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" /> Back to scans
      </button>

      <div className={`rounded-lg border p-5 ${style.classes}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            {style.icon}
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider opacity-70">Canonical screening result</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight">{style.label}</h1>
              <p className="mt-1 text-xs opacity-80 flex flex-wrap items-center gap-1.5">
                <span>{scan.productName}</span>
                <span>·</span>
                <span>{scan.sourceType === 'PHYSICAL_PHOTO' ? 'Physical product photo' : 'E-commerce listing'}</span>
                <span>·</span>
                <span className="font-semibold bg-black/10 px-1.5 py-0.5 rounded text-[11px]">
                  {COMMODITY_CATEGORY_LABELS[scan.commodityCategory ?? 'GENERAL_RETAIL'] ?? 'General Retail'}
                </span>
              </p>
            </div>
          </div>
          <button onClick={onRetry} className="inline-flex items-center gap-1.5 rounded border border-current/30 px-3 py-2 text-xs font-bold hover:bg-white/50">
            Retry scan
          </button>
        </div>
        <p className="mt-4 max-w-2xl text-xs leading-relaxed opacity-80">
          AI observations are shown separately from this deterministic result. This is digital compliance screening, not an official inspection or certified measurement.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3">
          <div><h2 className="text-sm font-bold text-slate-900">Evaluated requirements</h2><p className="text-[11px] text-slate-500 mt-0.5">Result → rule → observation → evidence → source image</p></div>
          <span className="text-[10px] font-mono text-slate-500">{result.evaluations.length} checks</span>
        </div>
        <div className="divide-y divide-slate-100">
          {result.evaluations.map((evaluation) => {
            const observation = evaluation.observationId ? observationsById.get(evaluation.observationId) : undefined;
            const rule = rulesById.get(evaluation.ruleId);
            return <RequirementRow key={evaluation.id} evaluation={evaluation} observation={observation} rule={rule} explanation={explanationsByEvaluationId.get(evaluation.id)} onOpenEvidence={setSelectedEvidence} />;
          })}
        </div>
      </div>

      {barcodeEstimates.length > 0 && <section className="rounded-lg border border-amber-200 bg-amber-50/50 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-amber-200">
          <h2 className="text-sm font-bold text-amber-950">Screening estimates</h2>
          <p className="text-[11px] text-amber-800 mt-0.5">These barcode-based scale references are observations only. They are not statutory measurements and do not determine the canonical result.</p>
        </div>
        <div className="divide-y divide-amber-100">
          {barcodeEstimates.map((observation) => <BarcodeEstimateRow key={observation.id} observation={observation} onOpenEvidence={setSelectedEvidence} />)}
        </div>
      </section>}

      <div className="rounded-lg border border-slate-300 bg-slate-50 p-4">
        <p className="text-xs font-bold text-slate-900">Before export</p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{SCREENING_DISCLAIMER}</p>
        <label className="mt-3 flex items-start gap-2 text-[11px] text-slate-700">
          <input type="checkbox" checked={exportAcknowledged} onChange={(event) => setExportAcknowledged(event.target.checked)} className="mt-0.5 accent-blue-700" />
          <span>I understand this is a screening output, not an official inspection, notice, certification, or certified measurement report.</span>
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <button disabled={!exportAcknowledged || !report} onClick={() => report && exportReport(`${scan.id}_screening.json`, serializeCanonicalJson(report), 'application/json')} className="rounded bg-blue-700 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300">Download canonical JSON</button>
          <button disabled={!exportAcknowledged || !report} onClick={() => report && exportReport(`${scan.id}_screening.pdf`, renderPdfReport(report), 'application/pdf')} className="rounded bg-blue-700 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300">Download PDF</button>
          <button disabled={!exportAcknowledged || !report} onClick={() => report && exportReport(`${scan.id}_screening.txt`, renderHumanReadableReport(report), 'text/plain;charset=utf-8')} className="rounded border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400">Download screening report</button>
        </div>
        {reportBuild.error && <p className="mt-2 text-xs text-rose-700">Report unavailable: {reportBuild.error}</p>}
        {exportError && <p className="mt-2 text-xs text-rose-700">{exportError}</p>}
        {exportAcknowledged && !reportBuild.error && <p className="mt-2 text-[10px] text-slate-500">Exports contain this canonical result and the evidence retained for this scan.</p>}
      </div>

      {selectedEvidence && <EvidenceViewer scan={scan} result={result} imageId={selectedEvidence} onClose={() => setSelectedEvidence(null)} />}
    </section>
  );
};

const RequirementRow: React.FC<{ evaluation: CanonicalScanResult['evaluations'][number]; observation?: Observation; rule?: Rule; explanation?: EvidenceBackedExplanation; onOpenEvidence: (imageId: string) => void }> = ({ evaluation, observation, rule, explanation, onOpenEvidence }) => {
  const hasEvidence = Boolean(evaluation.evidence?.imageId);
  return <article className="p-4 space-y-3">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="text-sm font-bold text-slate-900">{rule?.title ?? evaluation.ruleId}</h3><p className="text-[10px] font-mono text-slate-500 mt-1">{evaluation.ruleId} · version {evaluation.ruleVersion}</p></div>
      {resultBadge(evaluation.result)}
    </div>
    <p className="text-xs text-slate-700">{evaluation.reason}</p>
    {explanation && <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] text-blue-950">
      <p className="font-bold uppercase tracking-wider">Evidence-backed explanation</p>
      <p className="mt-1 leading-relaxed">{explanation.text}</p>
    </div>}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
      <InfoCell
        label="Observation"
        value={
          observation
            ? `${observation.field}: ${formatObservationValue(observation.value)} (${observation.status})`
            : evaluation.result === 'NOT_APPLICABLE'
            ? 'Exempt by commodity classification'
            : 'No observation supplied'
        }
      />
      <InfoCell label="Confidence" value={evaluation.observationConfidence === null ? 'Not available' : `${Math.round(evaluation.observationConfidence * 100)}% observation confidence`} />
      <InfoCell label="Evidence" value={hasEvidence ? evaluation.evidence!.imageId : 'Incomplete evidence'} />
    </div>
    {rule && <p className="text-[10px] text-slate-500">Source: {rule.source} · Verification: {rule.verificationStatus}{rule.knownGaps.length > 0 ? ` · Gaps: ${rule.knownGaps[0]}` : ''}</p>}
    {hasEvidence && <button onClick={() => onOpenEvidence(evaluation.evidence!.imageId)} className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900"><ImageIcon className="w-3.5 h-3.5" /> View source image <ExternalLink className="w-3 h-3" /></button>}
  </article>;
};

const BarcodeEstimateRow: React.FC<{ observation: Observation; onOpenEvidence: (imageId: string) => void }> = ({ observation, onOpenEvidence }) => {
  if (!isBarcodeScaleEstimateValue(observation.value)) return null;
  const hasEvidence = Boolean(observation.evidence?.imageId);
  return <article className="p-4 space-y-2 text-[11px] text-amber-950">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <p className="font-bold uppercase tracking-wider">{observation.value.label} · barcode scale reference</p>
        <p className="mt-1 text-amber-900">{formatBarcodeScaleEstimate(observation.value)}</p>
      </div>
      <span className="rounded border border-amber-300 px-2 py-1 font-bold">{observation.status}</span>
    </div>
    <p><span className="font-bold">Confidence:</span> {Math.round(observation.confidence * 100)}% observation confidence</p>
    <p><span className="font-bold">Assumptions:</span> {observation.value.assumptions.join(' ')}</p>
    <p><span className="font-bold">Limitations:</span> {observation.value.limitations.join(' ')}</p>
    {hasEvidence && <button onClick={() => onOpenEvidence(observation.evidence!.imageId)} className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900"><ImageIcon className="w-3.5 h-3.5" /> View source image <ExternalLink className="w-3 h-3" /></button>}
    {!hasEvidence && <p className="text-amber-800">Source image evidence is unavailable.</p>}
  </article>;
};

function formatObservationValue(value: unknown): string {
  if (isBarcodeScaleEstimateValue(value)) return formatBarcodeScaleEstimate(value);
  if (value === null || value === undefined) return 'no value';
  return typeof value === 'object' ? JSON.stringify(value) ?? 'structured value' : String(value);
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return <div className="rounded border border-slate-200 bg-slate-50 px-2.5 py-2"><p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">{label}</p><p className="mt-1 text-slate-700 break-words">{value}</p></div>;
}

function EvidenceViewer({ scan, result, imageId, onClose }: { scan: Scan; result: CanonicalScanResult; imageId: string; onClose: () => void }) {
  const [imageLoadError, setImageLoadError] = useState(false);
  const image = scan.images.find((candidate) => candidate.id === imageId);
  const evidencePoints = collectEvidencePoints(result, imageId);
  const localizedPoints = evidencePoints.filter(({ evidence }) => evidence.boundingBox);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Source image evidence"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-400" /> Source image evidence
            </h2>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">{imageId}</p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition-colors"
            aria-label="Close evidence viewer"
          >
            <X className="w-4 h-4" /> Close
          </button>
        </div>
        <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
          {image && !imageLoadError ? (
            <div
              className="relative w-full overflow-hidden rounded-md bg-slate-900/5 border border-slate-200 flex items-center justify-center min-h-[300px]"
              style={image.width && image.height ? { aspectRatio: `${image.width} / ${image.height}` } : undefined}
            >
              <img
                src={`/scans/${encodeURIComponent(scan.id)}/images/${encodeURIComponent(imageId)}`}
                alt="Original uploaded source evidence"
                onError={() => setImageLoadError(true)}
                className="relative z-0 block h-auto w-full object-contain max-h-[60vh]"
              />
              {localizedPoints.map(({ evaluationId, evidence }) => {
                const box = evidence.boundingBox!;
                return (
                  <div
                    key={evaluationId}
                    className="absolute border-2 border-amber-400 bg-amber-400/20 shadow-[0_0_0_1px_rgba(15,23,42,0.35)] rounded-sm pointer-events-none"
                    style={{
                      left: `${box.x * 100}%`,
                      top: `${box.y * 100}%`,
                      width: `${box.width * 100}%`,
                      height: `${box.height * 100}%`,
                    }}
                    aria-label={`Highlighted evidence region for ${evaluationId}`}
                  />
                );
              })}
            </div>
          ) : (
            <div role="alert" className="p-6 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded">
              {image ? 'The source image could not be loaded. Check the network connection and retry.' : 'The source image is unavailable.'}
            </div>
          )}
          {imageLoadError ? (
            <p className="text-[11px] text-rose-700">Evidence display failed; no image region is being claimed.</p>
          ) : localizedPoints.length > 0 ? (
            <p className="text-[11px] text-slate-600">Amber outlines mark localized evidence bounding boxes from AI observations.</p>
          ) : (
            <p className="text-[11px] text-amber-700">Localized evidence unavailable: this observation has no bounding box coordinates.</p>
          )}
          <p className="text-[11px] font-mono text-slate-500 break-all">Storage reference: {image?.storageKey ?? 'not available'}</p>
        </div>
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded text-xs transition-colors"
          >
            Close Evidence Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
