/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Maanak - Legacy Demo Fixture Workbench
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Scale, 
  Sliders, 
  Eye, 
  Maximize2, 
  ChevronRight, 
  FileEdit, 
  Download, 
  CheckCircle2, 
  Sparkles, 
  Info,
  Layers
} from 'lucide-react';
import { PackageEvidence, DeclarationAuditItem, ComplianceStatus } from '../types';
import { PackageArtwork } from './PackageArtwork';

interface InspectionWorkbenchProps {
  currentCase: PackageEvidence;
  cases: PackageEvidence[];
  onSelectCase: (caseItem: PackageEvidence) => void;
  onOpenCustomScan: () => void;
  onOpenOverride: (item: DeclarationAuditItem) => void;
}

export const InspectionWorkbench: React.FC<InspectionWorkbenchProps> = ({
  currentCase,
  cases,
  onSelectCase,
  onOpenCustomScan,
  onOpenOverride,
}) => {
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [isCaliperActive, setIsCaliperActive] = useState<boolean>(false);
  const [caliperHeightMm, setCaliperHeightMm] = useState<number>(
    currentCase.rule7Measurement?.measuredNumeralHeightMm || 3.0
  );
  const [activeTab, setActiveTab] = useState<'all' | 'violations' | 'compliant'>('all');

  const requiredHeightMm = currentCase.rule7Measurement?.requiredNumeralHeightMm || 4.0;

  // Filter declarations based on mini-filter
  const filteredDeclarations = currentCase.declarations.filter((d) => {
    if (activeTab === 'violations') return d.status === 'NON_COMPLIANT' || d.status === 'NEEDS_REVIEW';
    if (activeTab === 'compliant') return d.status === 'COMPLIANT' || d.status === 'STATUTORILY_EXEMPT';
    return true;
  });

  const getStatusBadge = (status: ComplianceStatus) => {
    switch (status) {
      case 'COMPLIANT':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
            <ShieldCheck className="w-3 h-3" />
            COMPLIANT
          </span>
        );
      case 'NON_COMPLIANT':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded">
            <ShieldAlert className="w-3 h-3" />
            CONTRAVENTION
          </span>
        );
      case 'NEEDS_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
            <AlertTriangle className="w-3 h-3" />
            NEEDS REVIEW
          </span>
        );
      case 'STATUTORILY_EXEMPT':
        return (
          <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded">
            § RULE 26 EXEMPT
          </span>
        );
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentCase, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${currentCase.caseId}_audit_dossier.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4">
      
      {/* CASE SELECTOR RIBBON */}
      <div className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
        <strong>DEMO FIXTURE WORKBENCH:</strong> package artwork, OCR, measurements, hashes, and case outcomes below are synthetic examples, not uploaded source evidence or official inspection findings.
      </div>
      <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
            Commodity Case:
          </span>
          {cases.map((c) => {
            const isSelected = c.caseId === currentCase.caseId;
            return (
              <button
                key={c.caseId}
                onClick={() => {
                  onSelectCase(c);
                  setSelectedBoxId(null);
                  if (c.rule7Measurement) {
                    setCaliperHeightMm(c.rule7Measurement.measuredNumeralHeightMm);
                  }
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{c.productName.split(' ')[0]} {c.productName.split(' ')[1]}</span>
                <span className={`w-2 h-2 rounded-full ${
                  c.overallStatus === 'COMPLIANT' ? 'bg-emerald-400' :
                  c.overallStatus === 'NON_COMPLIANT' ? 'bg-rose-500' :
                  c.overallStatus === 'STATUTORILY_EXEMPT' ? 'bg-indigo-400' : 'bg-amber-400'
                }`} />
              </button>
            );
          })}
        </div>

        {/* Custom Ingestion CTA */}
        <button
          onClick={onOpenCustomScan}
          className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>+ Ingest / Test Custom Commodity</span>
        </button>
      </div>

      {/* MAIN DUAL-PANE AUDIT INTERFACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: FORENSIC EVIDENCE & PACKAGING CANVAS (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-3 sticky top-20">
          
          {/* Canvas Control Toolbar */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-700" />
                Physical Label Visualizer
              </span>
              <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                {currentCase.sensorDpi} DPI
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Toggle Bounding Boxes */}
              <button
                onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                className={`p-1.5 rounded text-xs transition-colors ${
                  showBoundingBoxes ? 'bg-blue-100 text-blue-800 font-semibold' : 'text-slate-500 hover:bg-slate-100'
                }`}
                title="Toggle Detected OCR Bounding Boxes"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>

              {/* Fixture-only visual control; never a legal measurement. */}
              <button
                onClick={() => setIsCaliperActive(!isCaliperActive)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                  isCaliperActive 
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium'
                }`}
                title="Toggle fixture measurement illustration"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Fixture visualizer</span>
              </button>
            </div>
          </div>

          {/* Synthetic package artwork container — explicitly fixture-only. */}
          <PackageArtwork
            svgId={currentCase.packageSvgId}
            boundingBoxes={currentCase.boundingBoxes}
            selectedBoxId={selectedBoxId}
            onSelectBox={(boxId) => {
              setSelectedBoxId(boxId);
              // Find matching declaration and scroll into view
              const box = currentCase.boundingBoxes.find(b => b.id === boxId);
              if (box) {
                const element = document.getElementById(`decl-card-${box.fieldKey}`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }
            }}
            showBoundingBoxes={showBoundingBoxes}
            isCaliperActive={isCaliperActive}
            caliperHeightMm={caliperHeightMm}
            requiredHeightMm={requiredHeightMm}
            onCaliperChange={(val) => setCaliperHeightMm(val)}
          />

          {/* Physical Dimensions & Forensic Chain of Custody Strip */}
          <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] space-y-1.5 font-sans">
            <div className="flex justify-between items-center text-slate-700">
              <span className="font-medium">Principal Display Panel (PDP):</span>
              <span className="font-mono font-bold text-slate-900">
                {currentCase.pdpDimensions.heightCm} × {currentCase.pdpDimensions.widthCm} cm = {currentCase.pdpDimensions.areaSqCm.toFixed(1)} cm²
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="font-medium">Rule 7 Table-I Threshold:</span>
              <span className="font-mono font-semibold text-blue-900">
                Fixture value only — no certified threshold
              </span>
            </div>
            <div className="pt-1 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 font-mono">
              <span>SHA-256: {currentCase.sha256Digest.substring(0, 20)}...</span>
              <span>Fixture data — not calibrated</span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: STATUTORY AUDIT & TRACEABILITY ENGINE (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* PRIMARY STATUTORY VERDICT HERO CARD */}
          <div className={`p-4 rounded-lg border shadow-sm transition-all ${
            currentCase.overallStatus === 'COMPLIANT'
              ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
              : currentCase.overallStatus === 'NON_COMPLIANT'
              ? 'bg-rose-50/70 border-rose-300 text-rose-950'
              : currentCase.overallStatus === 'STATUTORILY_EXEMPT'
              ? 'bg-indigo-50/70 border-indigo-300 text-indigo-950'
              : 'bg-amber-50/70 border-amber-300 text-amber-950'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                {currentCase.overallStatus === 'COMPLIANT' ? (
                  <ShieldCheck className="w-6 h-6 text-emerald-700 shrink-0" />
                ) : currentCase.overallStatus === 'NON_COMPLIANT' ? (
                  <ShieldAlert className="w-6 h-6 text-rose-700 shrink-0" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-amber-700 shrink-0" />
                )}
                <div>
                  <h2 className="text-sm font-bold tracking-tight">
                    {currentCase.overallStatus === 'COMPLIANT' && 'FIXTURE MARKED COMPLIANT'}
                    {currentCase.overallStatus === 'NON_COMPLIANT' && 'FIXTURE FLAGGED FOR REVIEW'}
                    {currentCase.overallStatus === 'NEEDS_REVIEW' && 'FIXTURE REVIEW REQUIRED'}
                    {currentCase.overallStatus === 'STATUTORILY_EXEMPT' && 'STATUTORILY EXEMPT UNDER RULE 26(a)'}
                  </h2>
                  <span className="text-[11px] font-mono opacity-80 block">
                    Case Ref: {currentCase.caseId} • Section 18(1) / Section 36(1)
                  </span>
                </div>
              </div>

            </div>

            <p className="text-xs leading-relaxed mt-1 opacity-90">
              {currentCase.summaryVerdict}
            </p>
          </div>

          {/* EXPLAINABILITY TRACEABILITY PIPELINE BAR */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Fixture Evidence & Explainability Chain:
            </span>
            <div className="flex items-center justify-between text-[11px] text-slate-700 font-medium overflow-x-auto gap-1">
              <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span>1. Detected String</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                <span>2. Fixture Rule Label</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                <span>3. Algorithmic Metric</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span>4. Fixture Reviewer Action</span>
              </div>
            </div>
          </div>

          {/* ITEMIZED RULE 6 DECLARATIONS AUDIT LIST */}
          <div className="space-y-3">
            
            {/* Mini Filter Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Fixture Declaration Examples:
              </span>

              <div className="flex items-center gap-1 text-[11px]">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    activeTab === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All ({currentCase.declarations.length})
                </button>
                <button
                  onClick={() => setActiveTab('violations')}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    activeTab === 'violations' ? 'bg-rose-700 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Contraventions ({currentCase.declarations.filter(d => d.status === 'NON_COMPLIANT' || d.status === 'NEEDS_REVIEW').length})
                </button>
                <button
                  onClick={() => setActiveTab('compliant')}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    activeTab === 'compliant' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Compliant ({currentCase.declarations.filter(d => d.status === 'COMPLIANT' || d.status === 'STATUTORILY_EXEMPT').length})
                </button>
              </div>
            </div>

            {/* Declaration Cards */}
            <div className="space-y-3">
              {filteredDeclarations.map((decl) => {
                const isSelected = selectedBoxId === decl.boundingBoxId;

                return (
                  <div
                    key={decl.id}
                    id={`decl-card-${decl.fieldKey}`}
                    className={`bg-white rounded-lg border transition-all p-3.5 shadow-sm ${
                      isSelected 
                        ? 'border-blue-600 ring-2 ring-blue-500/20' 
                        : decl.status === 'NON_COMPLIANT'
                        ? 'border-rose-200 hover:border-rose-400'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold text-slate-900">{decl.declarationName}</h3>
                          {getStatusBadge(decl.status)}
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 mt-0.5 block">
                          {decl.statutoryRule}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {decl.boundingBoxId && (
                          <button
                            onClick={() => setSelectedBoxId(isSelected ? null : decl.boundingBoxId)}
                            className={`p-1 rounded text-xs font-medium transition-colors ${
                              isSelected 
                                ? 'bg-blue-600 text-white' 
                                : 'text-blue-700 hover:bg-blue-50'
                            }`}
                            title="Highlight on Physical Label"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onOpenOverride(decl)}
                          className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[11px] font-semibold transition-colors"
                          title="Statutory Officer Adjudication / Override"
                        >
                          <FileEdit className="w-3 h-3" />
                          <span>Adjudicate</span>
                        </button>
                      </div>
                    </div>

                    {/* Detected Text Box */}
                    <div className="mt-2.5 p-2 bg-slate-50 rounded border border-slate-200 text-xs">
                      <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                        <span className="font-semibold uppercase tracking-wider">Detected OCR Text</span>
                        <span className="font-mono">Confidence: {decl.confidence.toFixed(1)}%</span>
                      </div>
                      <p className="font-mono text-slate-900 font-medium whitespace-pre-line text-xs">
                        "{decl.detectedText}"
                      </p>
                    </div>

                    {/* Algorithmic Finding & Statutory Requirement */}
                    <div className="mt-2.5 text-xs space-y-1.5">
                      <div className="text-slate-700">
                        <span className="font-bold text-slate-900">Legal Requirement: </span>
                        <span className="text-slate-600">{decl.requiredFormat}</span>
                      </div>
                      <div className={`p-2 rounded text-[11px] leading-relaxed ${
                        decl.status === 'NON_COMPLIANT' 
                          ? 'bg-rose-50 text-rose-900 font-medium' 
                          : 'bg-slate-50 text-slate-800'
                      }`}>
                        <strong>Finding: </strong>{decl.algorithmicFinding}
                      </div>
                    </div>

                    {/* Officer Override Indicator if Present */}
                    {decl.isOverridden && decl.overrideDetails && (
                      <div className="mt-2.5 p-2 bg-blue-50 rounded border border-blue-200 text-[11px] text-blue-950 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block">
                            Adjudicated by {decl.overrideDetails.officerName}
                          </span>
                          <p className="text-slate-700 mt-0.5">
                            "{decl.overrideDetails.remarks}" ({decl.overrideDetails.reason})
                          </p>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

          </div>

          {/* WORKBENCH BOTTOM ACTION FOOTER */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 text-[11px]">
              Inspected at: <strong className="text-slate-800">{currentCase.inspectionPlace}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-100 font-medium text-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export fixture JSON</span>
              </button>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
