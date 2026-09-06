/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Maanak - Demo Fixture Reviewer Action Modal
 * Applies a reviewer action to a preloaded fixture record only.
 */

import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldAlert, Key, FileEdit } from 'lucide-react';
import { DeclarationAuditItem, ComplianceStatus } from '../types';

interface InspectorOverrideModalProps {
  item: DeclarationAuditItem | null;
  officerName: string;
  onClose: () => void;
  onSaveOverride: (
    itemId: string,
    newStatus: ComplianceStatus,
    reason: string,
    remarks: string,
    officerPin: string
  ) => void;
}

export const InspectorOverrideModal: React.FC<InspectorOverrideModalProps> = ({
  item,
  officerName,
  onClose,
  onSaveOverride
}) => {
  if (!item) return null;

  const [selectedStatus, setSelectedStatus] = useState<ComplianceStatus>(item.status);
  const [selectedReason, setSelectedReason] = useState<string>('Reviewer recorded a fixture-only finding');
  const [remarks, setRemarks] = useState<string>("");
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>("");

  const reasonOptions = [
    'Reviewer recorded a fixture-only finding from the displayed example',
    'Reviewer marked the displayed example for additional review',
    'Reviewer recorded that the displayed evidence is insufficient',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length < 4) {
      setErrorMsg("Please enter your 4-digit Officer Authorization PIN.");
      return;
    }
    if (!remarks.trim()) {
      setErrorMsg("Fixture review remarks are required for traceability.");
      return;
    }

    onSaveOverride(item.id, selectedStatus, selectedReason, remarks, pin);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileEdit className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold tracking-wide">Fixture Reviewer Action</h3>
              <p className="text-[11px] text-slate-300 font-mono">
                Legal Metrology Act, 2009 • Human-in-the-Loop Override
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-700">
          
          {/* Item Details Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded p-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">{item.declarationName}</span>
              <span className="font-mono text-[10px] text-slate-500">{item.statutoryRule}</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              <span className="font-medium text-slate-800">Machine Detected Text:</span> "{item.detectedText}"
            </p>
            <div className="mt-2 text-[11px] flex items-center gap-2">
              <span className="text-slate-500">Algorithmic Finding:</span>
              <span className="font-medium text-slate-800">{item.algorithmicFinding}</span>
            </div>
          </div>

          {/* Adjudication Status Selection */}
          <div>
            <label className="block font-bold text-slate-900 mb-1.5">
              Officer Adjudication Determination:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedStatus('COMPLIANT')}
                className={`p-2 rounded border flex items-center gap-2 font-semibold text-left transition-all ${
                  selectedStatus === 'COMPLIANT'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="block text-xs">Verify Compliant</span>
                  <span className="text-[10px] font-normal text-slate-500">Fixture status only</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('NON_COMPLIANT')}
                className={`p-2 rounded border flex items-center gap-2 font-semibold text-left transition-all ${
                  selectedStatus === 'NON_COMPLIANT'
                    ? 'border-rose-600 bg-rose-50 text-rose-900 ring-1 ring-rose-600'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <div>
                  <span className="block text-xs">Uphold Contravention</span>
                  <span className="text-[10px] font-normal text-slate-500">Fixture reviewer action only</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('NEEDS_REVIEW')}
                className={`p-2 rounded border flex items-center gap-2 font-semibold text-left transition-all ${
                  selectedStatus === 'NEEDS_REVIEW'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 ring-1 ring-amber-600'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <span className="block text-xs">Mark Needs Review</span>
                  <span className="text-[10px] font-normal text-slate-500">Require laboratory test</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('STATUTORILY_EXEMPT')}
                className={`p-2 rounded border flex items-center gap-2 font-semibold text-left transition-all ${
                  selectedStatus === 'STATUTORILY_EXEMPT'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-600'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                  §
                </div>
                <div>
                  <span className="block text-xs">Rule 26 Exemption</span>
                  <span className="text-[10px] font-normal text-slate-500">Statutorily exempt scope</span>
                </div>
              </button>
            </div>
          </div>

          {/* Standard Reason Dropdown */}
          <div>
            <label className="block font-bold text-slate-900 mb-1">
              Standard Justification Code:
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              {reasonOptions.map((opt, idx) => (
                <option key={idx} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Officer Remarks Field */}
          <div>
            <label className="block font-bold text-slate-900 mb-1">
              Fixture Review Notes: <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => {
                setRemarks(e.target.value);
                setErrorMsg("");
              }}
              placeholder="Record notes about the displayed fixture example..."
              className="w-full bg-white border border-slate-300 rounded p-2 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Officer Authorization & PIN */}
          <div className="bg-slate-50 p-3 rounded border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-slate-900 block">Adjudicating Officer:</span>
              <span className="text-xs text-slate-700">{officerName}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-slate-500" />
              <div>
                <label className="text-[10px] font-medium text-slate-600 block">Officer PIN:</label>
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-24 bg-white border border-slate-300 rounded px-2 py-1 text-center font-mono text-xs focus:ring-1 focus:ring-blue-500"
                  placeholder="PIN"
                />
              </div>
            </div>
          </div>

          {errorMsg && (
            <p className="text-rose-600 text-xs font-semibold">{errorMsg}</p>
          )}

          {/* Action Footer */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded font-bold transition-colors shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Sign & Apply Adjudication
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
