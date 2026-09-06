/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Maanak - Statutory Compendium & Interactive Rule 7 Calculator
 * Digital compendium of Legal Metrology Act, 2009 and LMPC Rules, 2011
 */

import React, { useState } from 'react';
import { BookOpen, Calculator, Scale, AlertTriangle, ShieldCheck, Check } from 'lucide-react';
import { RULE_7_TABLE_I, STATUTORY_CITATIONS, getRequiredNumeralHeight } from '../data/statutoryRules';

export const StatutoryCompendium: React.FC = () => {
  // Calculator State
  const [shape, setShape] = useState<'rectangular' | 'cylindrical'>('rectangular');
  const [heightCm, setHeightCm] = useState<number>(20);
  const [widthCm, setWidthCm] = useState<number>(12);
  const [circumferenceCm, setCircumferenceCm] = useState<number>(25);
  const [isBlowMoulded, setIsBlowMoulded] = useState<boolean>(false);
  const [testedNumeralHeightMm, setTestedNumeralHeightMm] = useState<number>(3.5);

  // Compute PDP Area
  const pdpArea = shape === 'rectangular' 
    ? heightCm * widthCm 
    : 0.4 * heightCm * circumferenceCm;

  const requiredHeight = getRequiredNumeralHeight(pdpArea, isBlowMoulded);
  const isPass = testedNumeralHeightMm >= requiredHeight;
  const deficit = isPass ? 0 : (requiredHeight - testedNumeralHeightMm).toFixed(1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Title & Statutory Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-700" />
            <h1 className="text-lg font-bold text-slate-900">
              Statutory Compendium & Rule 7 Table-I Engine
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Reference manual for Legal Metrology (Packaged Commodities) Rules, 2011 & Legal Metrology Act, 2009
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-blue-50 text-blue-800 px-3 py-1.5 rounded border border-blue-200">
          <Scale className="w-4 h-4 text-blue-700" />
          <span>Act No. 1 of 2010 • Section 18 & 36</span>
        </div>
      </div>

      {/* Grid: Left is Interactive Calculator, Right is Table-I statutory reference */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* INTERACTIVE RULE 7 CALCULATOR (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider">
                Interactive Principal Display Panel (PDP) Calculator
              </h2>
            </div>
            <span className="text-[10px] font-mono text-amber-300">Rule 7(1) Formula</span>
          </div>

          <div className="p-5 space-y-5 text-xs text-slate-700 flex-1">
            {/* Shape selection */}
            <div>
              <label className="block font-bold text-slate-900 mb-1.5">
                Package Physical Geometry:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShape('rectangular')}
                  className={`p-2.5 rounded border text-left transition-all ${
                    shape === 'rectangular'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-1 ring-blue-600'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="font-bold block">Rectangular / Box / Pouch</span>
                  <span className="text-[10px] text-slate-500">Area = Height × Width</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShape('cylindrical')}
                  className={`p-2.5 rounded border text-left transition-all ${
                    shape === 'cylindrical'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-1 ring-blue-600'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="font-bold block">Cylindrical / Can / Bottle</span>
                  <span className="text-[10px] text-slate-500">Area = 40% × Height × Circumference</span>
                </button>
              </div>
            </div>

            {/* Dimensional Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-slate-800 mb-1">
                  Package Height (cm):
                </label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Math.max(1, parseFloat(e.target.value) || 1))}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {shape === 'rectangular' ? (
                <div>
                  <label className="block font-medium text-slate-800 mb-1">
                    Panel Width (cm):
                  </label>
                  <input
                    type="number"
                    value={widthCm}
                    onChange={(e) => setWidthCm(Math.max(1, parseFloat(e.target.value) || 1))}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block font-medium text-slate-800 mb-1">
                    Cylinder Circumference (cm):
                  </label>
                  <input
                    type="number"
                    value={circumferenceCm}
                    onChange={(e) => setCircumferenceCm(Math.max(1, parseFloat(e.target.value) || 1))}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Packaging Material Switch */}
            <div className="bg-slate-50 p-3 rounded border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Blow-Moulded / Perforated Package</span>
                <span className="text-[10px] text-slate-500">
                  Rule 7 Table-I mandates higher character height thresholds for moulded containers.
                </span>
              </div>
              <input
                type="checkbox"
                checked={isBlowMoulded}
                onChange={(e) => setIsBlowMoulded(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 cursor-pointer"
              />
            </div>

            {/* Tested Numeral Height Comparator */}
            <div className="border-t border-slate-200 pt-4">
              <label className="block font-bold text-slate-900 mb-1">
                Measured Character / Numeral Height (mm):
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0.5"
                  max="8.0"
                  step="0.1"
                  value={testedNumeralHeightMm}
                  onChange={(e) => setTestedNumeralHeightMm(parseFloat(e.target.value))}
                  className="flex-1 accent-blue-600 cursor-pointer"
                />
                <span className="w-16 font-mono font-bold text-sm bg-slate-100 py-1 px-2 rounded text-center border">
                  {testedNumeralHeightMm.toFixed(1)} mm
                </span>
              </div>
            </div>

            {/* Statutory Result Card */}
            <div className={`p-4 rounded-lg border transition-all ${
              isPass 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isPass ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                  )}
                  <span className="font-bold text-sm">
                    {isPass ? 'STATUTORY COMPLIANCE: PASS' : 'STATUTORY CONTRAVENTION: FAIL'}
                  </span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  isPass ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                }`}>
                  {isPass ? 'COMPLIES' : `DEFICIT: -${deficit} mm`}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs mt-3 pt-2 border-t border-current/20">
                <div>
                  <span className="text-[10px] opacity-75 block uppercase">Computed PDP Area</span>
                  <span className="font-mono font-bold text-base">{pdpArea.toFixed(1)} cm²</span>
                </div>
                <div>
                  <span className="text-[10px] opacity-75 block uppercase">Statutory Minimum</span>
                  <span className="font-mono font-bold text-base">{requiredHeight.toFixed(1)} mm</span>
                </div>
                <div>
                  <span className="text-[10px] opacity-75 block uppercase">Measured Height</span>
                  <span className="font-mono font-bold text-base">{testedNumeralHeightMm.toFixed(1)} mm</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* TABLE-I OFFICIAL STATUTORY GAZETTE REFERENCE (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider">
              Rule 7 Table-I Statutory Matrix
            </h2>
            <span className="text-[10px] text-slate-400 font-mono">LMPC Rules, 2011</span>
          </div>

          <div className="p-4 space-y-4 text-xs text-slate-700 flex-1 overflow-y-auto">
            <p className="text-[11px] text-slate-500 leading-tight">
              Table-I specifies the minimum height of numerals and letters depending on the Principal Display Panel area:
            </p>

            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                    <th className="p-2 text-[11px]">Area of PDP (A)</th>
                    <th className="p-2 text-[11px] text-center">Std Print</th>
                    <th className="p-2 text-[11px] text-center">Moulded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {RULE_7_TABLE_I.map((tier, idx) => {
                    const isCurrentTier = pdpArea > tier.minAreaSqCm && pdpArea <= tier.maxAreaSqCm;
                    return (
                      <tr 
                        key={idx} 
                        className={`transition-colors ${isCurrentTier ? 'bg-blue-50 font-bold text-blue-900' : 'hover:bg-slate-50'}`}
                      >
                        <td className="p-2">
                          <span className="block font-mono">{tier.label}</span>
                          <span className="text-[10px] text-slate-500 font-normal">{tier.description}</span>
                        </td>
                        <td className="p-2 text-center font-mono text-sm">
                          {tier.minHeightStandardMm.toFixed(1)} mm
                        </td>
                        <td className="p-2 text-center font-mono text-sm">
                          {tier.minHeightBlowMouldedMm.toFixed(1)} mm
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Rule 7(3) Ratio Note */}
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <span className="font-bold text-slate-900 block text-xs mb-1">
                Rule 7(3) Aspect Ratio Requirement:
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                The width of the letter or numeral shall not be less than <strong>one-third of its height</strong>, except in the case of the numeral '1' and letters (i, I, l).
              </p>
            </div>

            {/* Rule 26(a) Exemption Callout */}
            <div className="bg-indigo-50 p-3 rounded border border-indigo-200 text-indigo-900">
              <span className="font-bold block text-xs mb-1">
                Rule 26(a) Small Pack Statutory Exemption:
              </span>
              <p className="text-[11px] text-indigo-800 leading-relaxed">
                Nothing in Chapter II applies to commodities with a net weight or measure of <strong>10 grams or 10 milliliters or less</strong>.
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* Full Legal Metrology Act Penal Provisions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs mb-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            Section 18(1) - Prohibition
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Strict prohibition on manufacturing, pre-packing, importing, or selling any packaged commodity that does not strictly comply with statutory declaration standards.
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-rose-900 font-bold text-xs mb-2">
            <span className="w-2 h-2 rounded-full bg-rose-600" />
            Section 36(1) - Penalty Scale
          </div>
          <ul className="text-[11px] text-slate-700 space-y-1">
            <li>• First Offense: Fine up to <strong>₹25,000</strong></li>
            <li>• Second Offense: Fine up to <strong>₹50,000</strong></li>
            <li>• Subsequent: Fine up to <strong>₹1,00,000</strong> or 1 year imprisonment</li>
          </ul>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs mb-2">
            <span className="w-2 h-2 rounded-full bg-amber-600" />
            GSR 128(E) - E-Commerce
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Mandates prominent digital display of Country of Origin, Manufacturer / Importer details, and true MRP on primary marketplace listing page prior to checkout.
          </p>
        </div>
      </div>

    </div>
  );
};
