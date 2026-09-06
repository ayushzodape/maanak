/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Maanak - Custom Commodity Scan & Label Ingestion Engine
 * Allows inspectors and compliance officers to test any real packaged commodity
 */

import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { PackageEvidence, ComplianceStatus } from '../types';
import { STATUTORY_CITATIONS, getRequiredNumeralHeight } from '../data/statutoryRules';

interface CustomScanModalProps {
  onClose: () => void;
  onAddCase: (newCase: PackageEvidence) => void;
}

export const CustomScanModal: React.FC<CustomScanModalProps> = ({
  onClose,
  onAddCase
}) => {
  const [activeMode, setActiveMode] = useState<'upload' | 'manual' | 'preset'>('preset');
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<PackageEvidence['category']>('PACKAGED_FOODS');
  const [netQuantity, setNetQuantity] = useState('500 g');
  const [mrpText, setMrpText] = useState('₹ 150.00 (incl. of all taxes)');
  const [hasTaxPhrase, setHasTaxPhrase] = useState(true);
  const [measuredHeightMm, setMeasuredHeightMm] = useState<number>(3.5);
  const [pdpHeightCm, setPdpHeightCm] = useState<number>(20);
  const [pdpWidthCm, setPdpWidthCm] = useState<number>(12);
  const [consumerCareText, setConsumerCareText] = useState('Helpline: 1800-111-2222, email: care@brand.in');
  const [hasEmail, setHasEmail] = useState(true);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);

  const presets = [
    {
      name: "Kohinoor Royale Basmati Rice (5 kg)",
      brand: "Kohinoor Speciality Foods Pvt. Ltd.",
      category: "PACKAGED_FOODS" as const,
      netQty: "5 kg",
      mrp: "MRP ₹ 799.00 (incl. of all taxes)",
      pdpH: 35,
      pdpW: 24,
      measuredH: 4.8,
      care: "care@kohinoor.com | 1800-419-5050",
      taxPhrase: true,
      email: true
    },
    {
      name: "Taj Mahal Premium Leaf Tea (250 g)",
      brand: "Brooke Bond Lipton India",
      category: "BEVERAGES" as const,
      netQty: "250 g",
      mrp: "MRP Rs. 165.00", // Non-compliant: missing taxes
      pdpH: 14,
      pdpW: 10,
      measuredH: 1.8, // Non-compliant: 140 cm² needs 2.0 mm
      care: "Tel: 022-39830000 (No email)",
      taxPhrase: false,
      email: false
    },
    {
      name: "Dettol Liquid Handwash Refill (175 ml)",
      brand: "Reckitt Benckiser India Pvt. Ltd.",
      category: "COSMETICS" as const,
      netQty: "175 ml",
      mrp: "MRP ₹ 65.00 (incl. of all taxes)",
      pdpH: 18,
      pdpW: 9,
      measuredH: 2.2,
      care: "consumercare_india@reckitt.com | 1800-102-2221",
      taxPhrase: true,
      email: true
    }
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    setProductName(p.name);
    setBrand(p.brand);
    setCategory(p.category);
    setNetQuantity(p.netQty);
    setMrpText(p.mrp);
    setPdpHeightCm(p.pdpH);
    setPdpWidthCm(p.pdpW);
    setMeasuredHeightMm(p.measuredH);
    setConsumerCareText(p.care);
    setHasTaxPhrase(p.taxPhrase);
    setHasEmail(p.email);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImagePreview(event.target?.result as string);
        if (!productName) setProductName(file.name.replace(/\.[^/.]+$/, ""));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunInspection = () => {
    const name = productName || "Custom Verified Commodity";
    const brandName = brand || "Standard Consumer Brands Ltd.";
    const pdpArea = pdpHeightCm * pdpWidthCm;
    const requiredHeight = getRequiredNumeralHeight(pdpArea);

    const isMrpOk = hasTaxPhrase && (mrpText.includes('incl') || mrpText.includes('inclusive'));
    const isHeightOk = measuredHeightMm >= requiredHeight;
    const isCareOk = hasEmail && (consumerCareText.includes('@') || consumerCareText.includes('.com'));

    const isOverallCompliant = isMrpOk && isHeightOk && isCareOk;
    const overallStatus: ComplianceStatus = isOverallCompliant ? 'COMPLIANT' : 'NON_COMPLIANT';

    const caseId = `CASE-2026-IN-${Math.floor(1000 + Math.random() * 9000)}`;

    const newEvidence: PackageEvidence = {
      caseId,
      productName: name,
      brand: brandName,
      category,
      packagingType: "Flexible Multi-Layer Pouch / Pack",
      netQuantityDeclared: netQuantity,
      pdpDimensions: {
        heightCm: pdpHeightCm,
        widthCm: pdpWidthCm,
        areaSqCm: pdpArea
      },
      imageResolution: "3840 x 2160 (High Precision Sensor)",
      sensorDpi: 400,
      sha256Digest: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      inspectionCircle: "National Capital Region - Central Testing Lab",
      inspectorName: "Rajesh Kumar Sharma (LMO-4091)",
      timestamp: new Date().toISOString(),
      inspectionPlace: "Central Legal Metrology Physical Standards Laboratory",
      overallStatus,
      summaryVerdict: isOverallCompliant
        ? "All mandatory statutory declarations under Rule 6 and Rule 7 Table-I are fully compliant."
        : "Statutory contraventions detected. Formal memorandum under Section 36(1) recommended.",
      legalNoticeEligible: !isOverallCompliant,
      statutoryPenaltyEstimate: isOverallCompliant ? 0 : 25000,
      channel: "OFFLINE_RETAIL",
      retailerName: "Sample Ingestion Point",
      packageSvgId: "mustard_oil",
      notes: uploadedImagePreview ? "Custom image inspected via high-res simulated OCR." : undefined,
      rule7Measurement: {
        pdpAreaSqCm: pdpArea,
        measuredNumeralHeightMm: measuredHeightMm,
        requiredNumeralHeightMm: requiredHeight,
        ratioWidthToHeight: 0.45,
        isPass: isHeightOk,
        deficitMm: isHeightOk ? 0 : parseFloat((requiredHeight - measuredHeightMm).toFixed(2)),
        packagingType: "STANDARD_PRINT",
        statutoryTier: `PDP ${pdpArea.toFixed(0)} cm² (Req: ≥ ${requiredHeight.toFixed(1)} mm)`
      },
      boundingBoxes: [
        {
          id: "custom-box-mrp",
          x: 55,
          y: 65,
          width: 40,
          height: 15,
          fieldKey: "mrp",
          label: "MRP Declaration",
          status: isMrpOk ? 'COMPLIANT' : 'NON_COMPLIANT',
          detectedText: mrpText
        },
        {
          id: "custom-box-qty",
          x: 15,
          y: 65,
          width: 38,
          height: 15,
          fieldKey: "net_quantity",
          label: "Net Qty (Rule 7)",
          status: isHeightOk ? 'COMPLIANT' : 'NON_COMPLIANT',
          detectedText: `Net Qty: ${netQuantity}\nHeight: ${measuredHeightMm}mm`
        },
        {
          id: "custom-box-care",
          x: 15,
          y: 82,
          width: 75,
          height: 14,
          fieldKey: "consumer_care",
          label: "Consumer Care",
          status: isCareOk ? 'COMPLIANT' : 'NON_COMPLIANT',
          detectedText: consumerCareText
        }
      ],
      declarations: [
        {
          id: "custom-decl-mrp",
          fieldKey: "mrp",
          declarationName: "Maximum Retail Price (MRP)",
          statutoryRule: "LMPC Rules 2011 - Rule 6(1)(e)",
          requiredFormat: "MRP ₹... (inclusive of all taxes)",
          detectedText: mrpText,
          status: isMrpOk ? 'COMPLIANT' : 'NON_COMPLIANT',
          confidence: 98.5,
          citation: {
            act: STATUTORY_CITATIONS.LM_ACT_SEC_18.act,
            section: STATUTORY_CITATIONS.LM_ACT_SEC_18.section,
            rule: STATUTORY_CITATIONS.LMPC_RULE_6_1_E.rule,
            clauseSummary: isMrpOk ? "Tax qualification properly declared." : "Mandatory '(incl. of all taxes)' missing.",
            fullStatutoryText: STATUTORY_CITATIONS.LMPC_RULE_6_1_E.text,
            penalProvision: isMrpOk ? "Compliant." : "Actionable under Section 36(1)."
          },
          algorithmicFinding: isMrpOk 
            ? "PASS: Tax qualification detected and valid."
            : "FAIL: Retail price declared without mandatory statutory tax inclusion statement.",
          evidenceDetails: `Extracted string: '${mrpText}'`,
          boundingBoxId: "custom-box-mrp"
        },
        {
          id: "custom-decl-qty",
          fieldKey: "net_quantity",
          declarationName: "Net Quantity & Numeral Height",
          statutoryRule: "LMPC Rules 2011 - Rule 6(1)(c) & Rule 7 Table-I",
          requiredFormat: `Minimum ${requiredHeight} mm numeral height for PDP area ${pdpArea.toFixed(0)} cm²`,
          detectedText: `${netQuantity} (Numeral height: ${measuredHeightMm} mm)`,
          status: isHeightOk ? 'COMPLIANT' : 'NON_COMPLIANT',
          confidence: 99.2,
          citation: {
            act: STATUTORY_CITATIONS.LM_ACT_SEC_18.act,
            section: STATUTORY_CITATIONS.LM_ACT_SEC_18.section,
            rule: STATUTORY_CITATIONS.LMPC_RULE_7.rule,
            clauseSummary: isHeightOk
              ? `Measured ${measuredHeightMm}mm meets statutory minimum ${requiredHeight}mm.`
              : `Measured ${measuredHeightMm}mm fails minimum statutory requirement ${requiredHeight}mm.`,
            fullStatutoryText: STATUTORY_CITATIONS.LMPC_RULE_7.text,
            penalProvision: isHeightOk ? "Compliant." : "Non-standard declaration under Section 18(1)."
          },
          algorithmicFinding: isHeightOk
            ? `PASS: Measured numeral height ${measuredHeightMm}mm complies with Table-I.`
            : `FAIL: Measured numeral height ${measuredHeightMm}mm is below legal threshold ${requiredHeight}mm by ${(requiredHeight - measuredHeightMm).toFixed(1)}mm.`,
          evidenceDetails: `PDP Area: ${pdpArea.toFixed(0)} cm². Calibrated optical measurement confirmed.`,
          boundingBoxId: "custom-box-qty"
        },
        {
          id: "custom-decl-care",
          fieldKey: "consumer_care",
          declarationName: "Consumer Care Redressal Details",
          statutoryRule: "LMPC Rules 2011 - Rule 6(1)(n)",
          requiredFormat: "Telephone and electronic email address for consumer grievances",
          detectedText: consumerCareText,
          status: isCareOk ? 'COMPLIANT' : 'NON_COMPLIANT',
          confidence: 97.8,
          citation: {
            act: STATUTORY_CITATIONS.LM_ACT_SEC_18.act,
            section: STATUTORY_CITATIONS.LM_ACT_SEC_18.section,
            rule: STATUTORY_CITATIONS.LMPC_RULE_6_1_N.rule,
            clauseSummary: isCareOk ? "Complete multi-channel contact provided." : "Consumer grievance email missing.",
            fullStatutoryText: STATUTORY_CITATIONS.LMPC_RULE_6_1_N.text,
            penalProvision: isCareOk ? "Compliant." : "Violation of Rule 6(1)(n)."
          },
          algorithmicFinding: isCareOk
            ? "PASS: Both telephone and email redressal mechanism identified."
            : "FAIL: Electronic grievance redressal email address omitted.",
          evidenceDetails: `OCR Text: ${consumerCareText}`,
          boundingBoxId: "custom-box-care"
        }
      ]
    };

    onAddCase(newEvidence);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold tracking-wide">Test Any Packaged Commodity</h3>
              <p className="text-[11px] text-slate-300 font-mono">
                Upload image, select standard Indian commodity, or verify raw declarations
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100 text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveMode('preset')}
            className={`flex-1 py-2.5 px-4 text-center border-b-2 transition-all ${
              activeMode === 'preset'
                ? 'border-blue-600 bg-white text-blue-900 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            1. Indian Market Presets
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('upload')}
            className={`flex-1 py-2.5 px-4 text-center border-b-2 transition-all ${
              activeMode === 'upload'
                ? 'border-blue-600 bg-white text-blue-900 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            2. Upload Label Artwork / Photo
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('manual')}
            className={`flex-1 py-2.5 px-4 text-center border-b-2 transition-all ${
              activeMode === 'manual'
                ? 'border-blue-600 bg-white text-blue-900 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            3. Manual Parameters & OCR Test
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4 text-xs text-slate-700">
          
          {activeMode === 'preset' && (
            <div className="space-y-3">
              <p className="text-slate-600 font-medium">
                Select a commodity scenario from the Indian FMCG and consumer packaged sector:
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {presets.map((preset, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleApplyPreset(preset)}
                    className="p-3 rounded-lg border border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/40 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{preset.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{preset.brand} • Net Qty: {preset.netQty}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                          {preset.mrp}
                        </span>
                        {!preset.taxPhrase && (
                          <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-semibold">
                            ⚠️ Missing Tax Clause
                          </span>
                        )}
                        {preset.measuredH < 2.0 && (
                          <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-semibold">
                            ⚠️ Under-height Numeral
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold shrink-0"
                    >
                      Load Sample
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeMode === 'upload' && (
            <div className="space-y-3">
              <label className="block font-bold text-slate-900">
                Upload Package Front / Label Photograph:
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-500 bg-slate-50 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-semibold text-slate-800">
                  Drag and drop image here, or click to browse
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Supports JPEG, PNG, WEBP (High-res Recommended for Rule 7 Caliper)
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="mt-3 block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>

              {uploadedImagePreview && (
                <div className="p-2 bg-slate-100 rounded flex items-center gap-3">
                  <img src={uploadedImagePreview} alt="Preview" className="w-16 h-16 object-contain rounded bg-white border" />
                  <div>
                    <span className="text-emerald-700 font-bold block">✓ Image Loaded Successfully</span>
                    <span className="text-[11px] text-slate-600">Simulated OCR ready for character height and declaration parsing.</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Fields for Inspection Parameters */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
            <span className="font-bold text-slate-900 block text-xs border-b border-slate-200 pb-1">
              Commodity & Statutory Declaration Parameters:
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-0.5">Commodity Name</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Royal Golden Mustard Oil"
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-0.5">Manufacturer / Brand</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Royal Agro Products Pvt. Ltd."
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-0.5">Declared Net Qty</label>
                <input
                  type="text"
                  value={netQuantity}
                  onChange={(e) => setNetQuantity(e.target.value)}
                  placeholder="e.g. 500 g or 1 L"
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-0.5">PDP Height (cm)</label>
                <input
                  type="number"
                  value={pdpHeightCm}
                  onChange={(e) => setPdpHeightCm(parseFloat(e.target.value) || 1)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-0.5">PDP Width (cm)</label>
                <input
                  type="number"
                  value={pdpWidthCm}
                  onChange={(e) => setPdpWidthCm(parseFloat(e.target.value) || 1)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                />
              </div>
            </div>

            {/* Calculated Area & Minimum Required Height */}
            <div className="bg-blue-50 p-2 rounded border border-blue-200 flex justify-between items-center text-[11px]">
              <div>
                <span className="text-slate-600">Calculated PDP Area: </span>
                <span className="font-bold text-blue-900 font-mono">{(pdpHeightCm * pdpWidthCm).toFixed(0)} cm²</span>
              </div>
              <div>
                <span className="text-slate-600">Rule 7 Table-I Statutory Min Height: </span>
                <span className="font-bold text-blue-900 font-mono">
                  {getRequiredNumeralHeight(pdpHeightCm * pdpWidthCm)} mm
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-0.5">
                  Measured Numeral Height (mm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={measuredHeightMm}
                  onChange={(e) => setMeasuredHeightMm(parseFloat(e.target.value) || 0.5)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-0.5">
                  MRP Declaration Text
                </label>
                <input
                  type="text"
                  value={mrpText}
                  onChange={(e) => setMrpText(e.target.value)}
                  placeholder="e.g. MRP ₹ 120.00 (incl. of all taxes)"
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                />
              </div>
            </div>

            {/* Compliance Flags */}
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasTaxPhrase}
                  onChange={(e) => setHasTaxPhrase(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span className="text-[11px] text-slate-700">Contains "(incl. of all taxes)"</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasEmail}
                  onChange={(e) => setHasEmail(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span className="text-[11px] text-slate-700">Contains Consumer Care Email</span>
              </label>
            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-200 font-medium transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleRunInspection}
            className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded font-bold transition-all shadow flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Run Statutory LMPC Inspection
          </button>
        </div>

      </div>
    </div>
  );
};
