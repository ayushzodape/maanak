/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Maanak - National Consumer Helpline (NCH 1915) Integration
 * Department of Consumer Affairs - Grievance Redressal Feed & Case Linkage
 */

import React from 'react';
import { X, PhoneCall, AlertCircle, ExternalLink, ShieldCheck, Check } from 'lucide-react';

interface HelplineModalProps {
  onClose: () => void;
  onLinkCase: (complaintId: string) => void;
}

export const HelplineModal: React.FC<HelplineModalProps> = ({
  onClose,
  onLinkCase
}) => {
  const complaints = [
    {
      id: "NCH-2026-88192",
      date: "04 Sep 2026",
      commodity: "Mustard Oil (1L Bottle)",
      retailer: "Garg Kirana Stores, Azadpur, Delhi",
      issue: "Retailer charging ₹195 against printed MRP of ₹185.00 without bill break-up.",
      status: "ASSIGNED_TO_CIRCLE_INSPECTOR",
      severity: "HIGH"
    },
    {
      id: "NCH-2026-77310",
      date: "03 Sep 2026",
      commodity: "Imported Cosmetic Serum",
      retailer: "E-Commerce Online Platform",
      issue: "Product delivered has no country of origin or importer registration address on outer box.",
      status: "PRELIMINARY_NOTICE_PENDING",
      severity: "MEDIUM"
    },
    {
      id: "NCH-2026-65401",
      date: "01 Sep 2026",
      commodity: "Ayurvedic Rasayana (1kg)",
      retailer: "Nature Mart Supermarket, GK-II",
      issue: "Net quantity declaration lacks unit symbol, consumer unable to verify grammage.",
      status: "VERIFIED_NON_COMPLIANT",
      severity: "MEDIUM"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold tracking-wide">National Consumer Helpline (NCH 1915)</h3>
              <p className="text-[11px] text-slate-300 font-mono">
                Department of Consumer Affairs • Live Citizen Grievance Stream
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-amber-50 p-3 border-b border-amber-200 text-xs text-amber-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Toll Free <strong>1915</strong> / SMS <strong>8800001915</strong> live telemetry active</span>
          </div>
          <a
            href="https://consumerhelpline.gov.in"
            target="_blank"
            rel="noreferrer"
            className="text-blue-700 hover:underline flex items-center gap-1 font-semibold text-[11px]"
          >
            consumerhelpline.gov.in
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Complaints List */}
        <div className="p-5 space-y-3 text-xs">
          <span className="font-bold text-slate-900 block text-xs">
            Recent Packaged Commodity Grievances in Circle:
          </span>

          <div className="space-y-2.5">
            {complaints.map((c) => (
              <div key={c.id} className="p-3 rounded border border-slate-200 bg-slate-50 hover:bg-blue-50/30 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-blue-900 text-[11px]">{c.id}</span>
                  <span className="text-[10px] text-slate-500 font-sans">{c.date}</span>
                </div>
                
                <h4 className="font-bold text-slate-900 mt-1">{c.commodity}</h4>
                <p className="text-[11px] text-slate-600">{c.retailer}</p>
                <p className="text-slate-700 mt-1 bg-white p-2 rounded border border-slate-200 text-[11px]">
                  "{c.issue}"
                </p>

                <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">
                    {c.status.replace(/_/g, ' ')}
                  </span>
                  <button
                    onClick={() => {
                      onLinkCase(c.id);
                      onClose();
                    }}
                    className="text-blue-700 hover:text-blue-900 font-bold text-[11px] hover:underline flex items-center gap-1"
                  >
                    Link to Inspection →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 py-2.5 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold"
          >
            Close Feed
          </button>
        </div>

      </div>
    </div>
  );
};
