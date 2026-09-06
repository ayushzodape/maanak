import React, { useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, ExternalLink, Image as ImageIcon, Info, Ruler, ShieldAlert } from 'lucide-react';
import { CanonicalScanResult, Observation, Rule, Scan } from '../domain';
import { CURRENT_RULE_DEFINITIONS } from '../evaluation';

interface ScanResultScreenProps {
  scan: Scan;
  result: CanonicalScanResult;
  onBack: () => void;
  onRetry: () => void;
}

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
  const style = RESULT_STYLES[result.overallResult];
  const observationsById = useMemo(() => new Map(scan.observations.map((observation) => [observation.id, observation])), [scan.observations]);
  const rulesById = useMemo(() => new Map(CURRENT_RULE_DEFINITIONS.map((rule) => [rule.id, rule])), []);

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
              <p className="mt-1 text-xs opacity-80">{scan.productName} · {scan.sourceType === 'PHYSICAL_PHOTO' ? 'Physical product photo' : 'E-commerce listing'}</p>
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
            return <RequirementRow key={evaluation.id} evaluation={evaluation} observation={observation} rule={rule} scanId={scan.id} onOpenEvidence={setSelectedEvidence} />;
          })}
        </div>
      </div>

      {selectedEvidence && <EvidenceViewer scan={scan} imageId={selectedEvidence} onClose={() => setSelectedEvidence(null)} />}
    </section>
  );
};

const RequirementRow: React.FC<{ evaluation: CanonicalScanResult['evaluations'][number]; observation?: Observation; rule?: Rule; scanId: string; onOpenEvidence: (imageId: string) => void }> = ({ evaluation, observation, rule, onOpenEvidence }) => {
  const hasEvidence = Boolean(evaluation.evidence?.imageId);
  return <article className="p-4 space-y-3">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="text-sm font-bold text-slate-900">{rule?.title ?? evaluation.ruleId}</h3><p className="text-[10px] font-mono text-slate-500 mt-1">{evaluation.ruleId} · version {evaluation.ruleVersion}</p></div>
      {resultBadge(evaluation.result)}
    </div>
    <p className="text-xs text-slate-700">{evaluation.reason}</p>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
      <InfoCell label="Observation" value={observation ? `${observation.field}: ${observation.value ?? 'no value'} (${observation.status})` : 'No observation supplied'} />
      <InfoCell label="Confidence" value={evaluation.observationConfidence === null ? 'Not available' : `${Math.round(evaluation.observationConfidence * 100)}% observation confidence`} />
      <InfoCell label="Evidence" value={hasEvidence ? evaluation.evidence!.imageId : 'Incomplete evidence'} />
    </div>
    {rule && <p className="text-[10px] text-slate-500">Source: {rule.source} · Verification: {rule.verificationStatus}{rule.knownGaps.length > 0 ? ` · Gaps: ${rule.knownGaps[0]}` : ''}</p>}
    {hasEvidence && <button onClick={() => onOpenEvidence(evaluation.evidence!.imageId)} className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900"><ImageIcon className="w-3.5 h-3.5" /> View source image <ExternalLink className="w-3 h-3" /></button>}
  </article>;
};

function InfoCell({ label, value }: { label: string; value: string }) {
  return <div className="rounded border border-slate-200 bg-slate-50 px-2.5 py-2"><p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">{label}</p><p className="mt-1 text-slate-700 break-words">{value}</p></div>;
}

function EvidenceViewer({ scan, imageId, onClose }: { scan: Scan; imageId: string; onClose: () => void }) {
  const image = scan.images.find((candidate) => candidate.id === imageId);
  return <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Source image evidence">
    <div className="bg-white rounded-lg max-w-2xl w-full overflow-hidden shadow-2xl">
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between"><div><h2 className="text-sm font-bold">Source image evidence</h2><p className="text-[10px] font-mono text-slate-400">{imageId}</p></div><button onClick={onClose} className="text-xs px-2 py-1 border border-slate-600 rounded">Close</button></div>
      <div className="p-4"><img src={`/scans/${encodeURIComponent(scan.id)}/images/${encodeURIComponent(imageId)}`} alt="Original uploaded source evidence" className="max-h-[65vh] w-full object-contain bg-slate-100 rounded" /><p className="mt-2 text-[10px] text-slate-500 break-all">Storage reference: {image?.storageKey ?? 'not available'}</p></div>
    </div>
  </div>;
}
