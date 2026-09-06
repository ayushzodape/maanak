/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Maanak - Statutory Form VIII Notice of Contravention & Inspection Memo
 * Legally enforceable notice under Section 18(1) & 36(1) of Legal Metrology Act, 2009
 */

import React from 'react';
import { X, Printer, Copy, Check, Scale, ShieldAlert, Download } from 'lucide-react';
import { PackageEvidence } from '../types';

interface NoticeGeneratorModalProps {
  evidence: PackageEvidence;
  onClose: () => void;
}

export const NoticeGeneratorModal: React.FC<NoticeGeneratorModalProps> = ({
  evidence,
  onClose
}) => {
  const [copied, setCopied] = React.useState(false);

  const noticeDate = new Date(evidence.timestamp).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const noticeRef = `LMD/SZ/${new Date().getFullYear()}/${evidence.caseId.replace('CASE-', '')}`;
  const violations = evidence.declarations.filter(d => d.status === 'NON_COMPLIANT' || d.status === 'NEEDS_REVIEW');

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const textContent = `
GOVERNMENT OF INDIA
MINISTRY OF CONSUMER AFFAIRS, FOOD AND PUBLIC DISTRIBUTION
DEPARTMENT OF CONSUMER AFFAIRS
LEGAL METROLOGY DIVISION
-------------------------------------------------------------
FORM VIII - NOTICE OF CONTRAVENTION & INSPECTION MEMORANDUM
[Issued under Section 18(1) read with Section 36(1) of Legal Metrology Act, 2009]

Notice Ref No: ${noticeRef}
Date of Inspection: ${noticeDate}
Inspecting Circle: ${evidence.inspectionCircle}
Inspecting Officer: ${evidence.inspectorName}

TO:
1. ${evidence.brand} (${evidence.declarations.find(d => d.fieldKey === 'manufacturer')?.detectedText || 'Packer/Manufacturer'})
2. Retailer: ${evidence.retailerName || 'Retail Dealer Premises'}, ${evidence.inspectionPlace}

SUBJECT: NOTICE UNDER SECTION 18(1) READ WITH SECTION 36(1) OF THE LEGAL METROLOGY ACT, 2009 AND RULES 6 & 7 OF THE LEGAL METROLOGY (PACKAGED COMMODITIES) RULES, 2011.

COMMODITY DETAILS:
- Name of Product: ${evidence.productName}
- Declared Net Qty: ${evidence.netQuantityDeclared}
- Packaging Type: ${evidence.packagingType}
- Digital Forensic SHA-256: ${evidence.sha256Digest}

CONTRAVENTIONS DETECTED:
${violations.map((v, i) => `${i + 1}. [${v.statutoryRule}] ${v.declarationName}: ${v.algorithmicFinding}`).join('\n')}

PENAL PROVISION:
Under Section 36(1) of the Legal Metrology Act, 2009, whoever manufactures, packs, sells or distributes any non-standard package shall be punished with fine up to ₹25,000 for the first offense.

DIRECTION:
You are hereby called upon to show cause within 15 days of the receipt of this memorandum as to why legal proceedings under Section 36(1) should not be instituted.

(Issued by Order of Controller of Legal Metrology)
Digital Seal Hash: ${evidence.sha256Digest.substring(0, 16)}...
    `.trim();

    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold tracking-wide">Statutory Form VIII Notice Generator</h3>
              <p className="text-[11px] text-slate-300 font-mono">
                Legal Metrology (Packaged Commodities) Rules, 2011 • Section 36(1)
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded text-xs font-medium transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Notice'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 bg-blue-700 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Notice</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Notice Paper Content */}
        <div className="p-8 overflow-y-auto bg-slate-50 flex-1 font-serif text-slate-900 text-xs leading-relaxed print:p-0 print:bg-white">
          <div className="max-w-2xl mx-auto bg-white p-8 rounded shadow-sm border border-slate-200 print:border-none print:shadow-none">
            
            {/* Government Seal & Heading */}
            <div className="text-center pb-4 border-b-2 border-slate-900 mb-6">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 border border-slate-400 flex items-center justify-center mb-2">
                <Scale className="w-7 h-7 text-slate-800" />
              </div>
              <h1 className="text-sm font-bold tracking-wider uppercase text-slate-900">
                भारत सरकार • GOVERNMENT OF INDIA
              </h1>
              <h2 className="text-xs font-semibold text-slate-700">
                MINISTRY OF CONSUMER AFFAIRS, FOOD AND PUBLIC DISTRIBUTION
              </h2>
              <p className="text-[11px] text-slate-600 font-sans">
                DEPARTMENT OF CONSUMER AFFAIRS • LEGAL METROLOGY DIVISION
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                Office of the Assistant Controller of Legal Metrology, {evidence.inspectionCircle}
              </p>
            </div>

            {/* Notice Metadata Grid */}
            <div className="flex justify-between items-start mb-6 font-sans text-xs">
              <div>
                <span className="font-bold text-slate-900 block">Notice Memo No:</span>
                <span className="font-mono text-slate-700">{noticeRef}</span>
                <span className="font-bold text-slate-900 block mt-2">Case Tracking ID:</span>
                <span className="font-mono text-slate-700">{evidence.caseId}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-900 block">Date of Inspection:</span>
                <span className="text-slate-700">{noticeDate}</span>
                <span className="font-bold text-slate-900 block mt-2">Inspecting Officer:</span>
                <span className="text-slate-700">{evidence.inspectorName}</span>
              </div>
            </div>

            {/* Recipient Block */}
            <div className="mb-5 font-sans bg-slate-50 p-3 rounded border border-slate-200">
              <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
                NOTICE ISSUED TO:
              </span>
              <p className="font-semibold text-slate-900 mt-1">{evidence.brand}</p>
              <p className="text-slate-700 text-[11px]">
                {evidence.declarations.find(d => d.fieldKey === 'manufacturer')?.detectedText || 'Manufacturer/Packer Address on Record'}
              </p>
              <p className="text-slate-600 text-[11px] mt-1">
                <span className="font-medium">Retail Premises Inspected:</span> {evidence.inspectionPlace}
              </p>
            </div>

            {/* Subject Line */}
            <div className="mb-5 pb-2 border-b border-slate-200">
              <p className="font-bold text-slate-900 text-xs">
                SUBJECT: NOTICE OF CONTRAVENTION UNDER SECTION 18(1) READ WITH SECTION 36(1) OF THE LEGAL METROLOGY ACT, 2009 AND RULES 6 & 7 OF THE LEGAL METROLOGY (PACKAGED COMMODITIES) RULES, 2011.
              </p>
            </div>

            {/* Memorandum Body */}
            <div className="space-y-3 text-justify text-slate-800 mb-6">
              <p>
                Whereas an inspection was conducted on <strong>{noticeDate}</strong> at the premises of <strong>{evidence.retailerName || evidence.inspectionPlace}</strong>, wherein packages of commodity described as <strong>"{evidence.productName}"</strong> bearing declared Net Quantity <strong>"{evidence.netQuantityDeclared}"</strong> were physically inspected and digitally verified using calibrated optical instruments.
              </p>
              <p>
                And whereas the said pre-packaged commodity was found to be in contravention of the mandatory statutory provisions as scheduled below:
              </p>
            </div>

            {/* Schedule of Contraventions Table */}
            <div className="mb-6 font-sans">
              <span className="font-bold text-slate-900 block text-xs mb-2">
                SCHEDULE OF STATUTORY CONTRAVENTIONS:
              </span>
              <table className="w-full border-collapse border border-slate-300 text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-900">
                    <th className="border border-slate-300 p-2 text-center w-10">Item</th>
                    <th className="border border-slate-300 p-2 text-left w-36">Statutory Rule</th>
                    <th className="border border-slate-300 p-2 text-left">Finding & Evidence</th>
                    <th className="border border-slate-300 p-2 text-left w-32">Statutory Liability</th>
                  </tr>
                </thead>
                <tbody>
                  {violations.map((v, index) => (
                    <tr key={v.id} className="align-top">
                      <td className="border border-slate-300 p-2 text-center font-bold">{index + 1}</td>
                      <td className="border border-slate-300 p-2 font-mono font-semibold text-rose-800">
                        {v.statutoryRule}
                      </td>
                      <td className="border border-slate-300 p-2">
                        <strong className="block text-slate-900 mb-0.5">{v.declarationName}</strong>
                        <span className="text-slate-700">{v.algorithmicFinding}</span>
                      </td>
                      <td className="border border-slate-300 p-2 font-medium text-slate-900">
                        Section 36(1)
                        <span className="block text-[10px] text-slate-500">Fine up to ₹25,000</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Show Cause Direction */}
            <div className="bg-amber-50 border border-amber-300 p-3.5 rounded font-sans mb-6 text-xs text-amber-950">
              <div className="flex items-center gap-1.5 font-bold mb-1 text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                SHOW-CAUSE & COMPOUNDING DIRECTIVE (15 DAYS NOTICE):
              </div>
              <p className="leading-relaxed">
                You are hereby called upon to show cause within <strong>15 (fifteen) calendar days</strong> from the receipt of this notice as to why legal proceedings under <strong>Section 36(1)</strong> of the Legal Metrology Act, 2009 should not be initiated before the competent court of law. If you desire to compound the offense in terms of <strong>Section 48</strong> of the Act, you may make a formal written application to the undersigned authority.
              </p>
            </div>

            {/* Signature & Digital Seal Block */}
            <div className="pt-6 border-t border-slate-300 flex justify-between items-end font-sans text-xs">
              <div className="text-left">
                <div className="w-20 h-20 border border-dashed border-slate-400 rounded flex flex-col items-center justify-center p-1 bg-slate-50 text-[9px] text-slate-500 font-mono">
                  <span>[DIGITAL SEAL]</span>
                  <span className="text-[7.5px] mt-1 text-center font-mono">{evidence.sha256Digest.substring(0, 10)}</span>
                </div>
                <span className="text-[9px] text-slate-400 block mt-1 font-mono">
                  Forensic Hash: {evidence.sha256Digest.substring(0, 24)}...
                </span>
              </div>

              <div className="text-right">
                <div className="font-serif italic text-base font-bold text-blue-900 mb-1">
                  {evidence.inspectorName.split('(')[0]}
                </div>
                <p className="font-bold text-slate-900">{evidence.inspectorName}</p>
                <p className="text-slate-600 text-[11px]">Inspector of Legal Metrology</p>
                <p className="text-slate-500 text-[10px]">{evidence.inspectionCircle}</p>
                <p className="text-[9px] text-emerald-700 font-semibold mt-1">
                  ✓ Digitally Signed & Timestamped
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-2.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0 font-sans">
          <span>Official Document under Rule 29, LMPC Rules 2011</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded font-medium"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
};
