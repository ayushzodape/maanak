/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Maanak - Realistic Packaged Commodity Visual Artwork & Interactive Canvas
 * High-fidelity vector packaging representations for Legal Metrology examination
 */

import React from 'react';
import { BoundingBox, ComplianceStatus } from '../types';

interface PackageArtworkProps {
  svgId: string;
  customImageUrl?: string;
  boundingBoxes: BoundingBox[];
  selectedBoxId: string | null;
  onSelectBox: (boxId: string) => void;
  showBoundingBoxes: boolean;
  isCaliperActive: boolean;
  caliperHeightMm: number;
  requiredHeightMm: number;
  onCaliperChange?: (val: number) => void;
}

export const PackageArtwork: React.FC<PackageArtworkProps> = ({
  svgId,
  customImageUrl,
  boundingBoxes,
  selectedBoxId,
  onSelectBox,
  showBoundingBoxes,
  isCaliperActive,
  caliperHeightMm,
  requiredHeightMm,
  onCaliperChange
}) => {
  const getStatusColor = (status: ComplianceStatus) => {
    switch (status) {
      case 'COMPLIANT':
        return { stroke: '#15803d', fill: 'rgba(21, 128, 61, 0.12)', bg: 'bg-emerald-700' };
      case 'NON_COMPLIANT':
        return { stroke: '#dc2626', fill: 'rgba(220, 38, 38, 0.14)', bg: 'bg-rose-700' };
      case 'NEEDS_REVIEW':
        return { stroke: '#d97706', fill: 'rgba(217, 119, 6, 0.14)', bg: 'bg-amber-600' };
      case 'STATUTORILY_EXEMPT':
        return { stroke: '#6366f1', fill: 'rgba(99, 102, 241, 0.14)', bg: 'bg-indigo-600' };
      default:
        return { stroke: '#2563eb', fill: 'rgba(37, 99, 235, 0.12)', bg: 'bg-blue-600' };
    }
  };

  return (
    <div className="relative w-full h-full min-h-[480px] flex items-center justify-center p-3 select-none overflow-hidden bg-slate-900/5 rounded-lg border border-slate-200">
      {/* Background Grid Pattern for Optical Alignment */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#1e293b 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      />

      {/* Main Packaging Stage */}
      <div className="relative max-w-md w-full aspect-[4/5] bg-white rounded-md shadow-lg border border-slate-300 overflow-hidden flex flex-col items-center justify-center">
        
        {customImageUrl ? (
          <img 
            src={customImageUrl} 
            alt="Custom inspection commodity" 
            className="w-full h-full object-contain"
          />
        ) : svgId === 'mustard_oil' ? (
          /* ANANDA MUSTARD OIL BOTTLE LABEL */
          <div className="w-full h-full bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col justify-between p-5 border-x-8 border-amber-400/50">
            {/* Top Brand Header */}
            <div className="text-center pt-2">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-5 h-5 border border-emerald-700 flex items-center justify-center p-0.5 bg-white">
                  <div className="w-3 h-3 rounded-full bg-emerald-700" />
                </div>
                <span className="text-[10px] font-bold tracking-widest text-emerald-900 uppercase">100% PURE & NATURAL</span>
              </div>
              <h2 className="text-2xl font-black text-amber-950 tracking-wider font-serif">ANANDA</h2>
              <p className="text-[11px] font-bold text-amber-800 tracking-wider">KACHI GHANI MUSTARD OIL</p>
              <div className="h-0.5 w-32 mx-auto bg-amber-600 my-1"></div>
            </div>

            {/* Middle Graphic & Manufacturer details */}
            <div className="my-auto text-center px-4">
              <div className="inline-block p-2 bg-amber-200/60 rounded border border-amber-300 mb-2">
                <span className="text-[9px] font-semibold text-amber-900 block">COLD PRESSED • RICH IN OMEGA 3</span>
                <span className="text-[9px] text-amber-800">Traditional Kolhu Process</span>
              </div>
              
              <div className="text-[9.5px] text-slate-700 leading-tight bg-white/70 p-2 rounded border border-amber-200 text-left">
                <p className="font-semibold text-slate-900">Mfd & Packed by: Ananda Agro Foods Ltd.</p>
                <p>Plot 14, Phase II, RIICO Industrial Area, Alwar (Raj.) 301030</p>
                <p className="text-[8.5px] text-slate-600">FSSAI Central Lic. No. 10014013000788</p>
              </div>
            </div>

            {/* Bottom Commercial Declarations (Focus of Inspection) */}
            <div className="bg-amber-100/90 border-t-2 border-amber-500/40 p-2.5 rounded-b text-slate-900">
              <div className="grid grid-cols-2 gap-2 text-left">
                {/* Left: Net Volume (Violation: Under-height 2.8mm) */}
                <div className="p-1.5 bg-white/90 rounded border border-amber-300">
                  <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block">NET QUANTITY</span>
                  <span className="text-xs font-semibold text-slate-900 block leading-tight">
                    1 Litre (910 g)
                  </span>
                  <span className="text-[7.5px] text-rose-700 font-mono font-medium block">
                    (Printed Height: 2.8mm)
                  </span>
                </div>

                {/* Right: MRP Box (Violation: Missing 'incl. of all taxes') */}
                <div className="p-1.5 bg-white/90 rounded border border-amber-300">
                  <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block">RETAIL PRICE</span>
                  <span className="text-xs font-bold text-slate-900 block leading-tight">
                    MRP: Rs. 185.00
                  </span>
                  <span className="text-[8px] text-slate-600 block">PKD: 08/2026</span>
                </div>
              </div>

              {/* Bottom Strip: Consumer Care (Missing Email) */}
              <div className="mt-2 pt-1 border-t border-amber-300 flex items-center justify-between text-[8px] text-slate-700">
                <span>Consumer Care Call: 0144-2884190</span>
                <span className="font-mono text-[7px] text-slate-400">BATCH: AKG-8812</span>
              </div>
            </div>
          </div>
        ) : svgId === 'table_butter' ? (
          /* KISAN FRESH TABLE BUTTER CARTON */
          <div className="w-full h-full bg-gradient-to-b from-yellow-100 to-amber-200 flex flex-col justify-between p-5 border-4 border-amber-500">
            <div className="text-center pt-2">
              <div className="flex items-center justify-between">
                <div className="w-4 h-4 border border-emerald-700 flex items-center justify-center bg-white">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-700" />
                </div>
                <span className="text-[9px] font-bold text-blue-900 uppercase">COOPERATIVE QUALITY</span>
                <span className="text-[8px] font-mono text-slate-700">FSSAI 10012021000045</span>
              </div>
              <h2 className="text-3xl font-black text-blue-900 tracking-wider mt-1">KISAN</h2>
              <p className="text-xs font-bold text-amber-900 tracking-widest uppercase">PASTEURISED TABLE BUTTER</p>
            </div>

            <div className="bg-white/80 p-2.5 rounded border border-amber-300 text-[9.5px] text-slate-800 text-left">
              <p className="font-bold text-slate-900">Mfd by: Kisan Dairy Cooperative Ltd.</p>
              <p>Anand Road, District Kaira, Gujarat - 388001</p>
              <p className="text-[8px] text-slate-600 mt-1">Ingredients: Butter (Pasteurised Cream), Common Salt (max 3%).</p>
            </div>

            <div className="bg-blue-900 text-white p-3 rounded shadow">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[8px] text-blue-200 uppercase font-semibold block">Net Weight</span>
                  <span className="text-sm font-bold tracking-wide">500 g</span>
                  <span className="text-[8px] text-emerald-300 block font-mono">H: 4.2mm (Complies)</span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] text-blue-200 uppercase font-semibold block">Maximum Retail Price</span>
                  <span className="text-xs font-bold">MRP ₹ 275.00</span>
                  <span className="text-[8px] text-emerald-200 block">(incl. of all taxes)</span>
                  <span className="text-[8px] text-blue-200 font-mono block">USP: ₹ 0.55 / g</span>
                </div>
              </div>
              <div className="mt-2 pt-1 border-t border-blue-800 text-[8px] text-blue-200 flex justify-between">
                <span>Care: 1800-258-3333 | care@kisandairy.coop</span>
                <span>PKD: 08/2026</span>
              </div>
            </div>
          </div>
        ) : svgId === 'electrolyte_sachet' ? (
          /* NEUTRACARE SACHET (8G EXEMPT) */
          <div className="w-full h-full bg-gradient-to-tr from-cyan-600 to-blue-700 flex flex-col justify-between p-6 text-white text-center">
            <div>
              <span className="text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded tracking-widest uppercase">Instant Hydration</span>
              <h2 className="text-2xl font-black mt-2 tracking-wide">NeutraCare™</h2>
              <p className="text-xs font-medium text-cyan-100">ELECTROLYTE BOOST SACHET</p>
            </div>

            <div className="my-auto py-4 bg-black/15 rounded border border-white/20">
              <span className="text-[9px] uppercase tracking-widest text-cyan-200 block font-semibold">Net Weight</span>
              <span className="text-3xl font-extrabold text-white">8 g</span>
              <span className="text-[9px] text-amber-200 block mt-1 font-mono">Rule 26(a) Exemption Scope (≤10g)</span>
            </div>

            <div className="text-[8.5px] text-cyan-100">
              <p>Mfd by NeutraCare Formulations, Peenya Ind. Area, Bengaluru - 560058</p>
              <p className="mt-1">For single dose use in 200ml drinking water</p>
            </div>
          </div>
        ) : svgId === 'cosmetic_serum' ? (
          /* GLOWRADIANCE VITAMIN C SERUM E-COMMERCE LISTING */
          <div className="w-full h-full bg-slate-50 flex flex-col justify-between p-5 border border-slate-300">
            <div className="border-b border-slate-200 pb-2">
              <span className="text-[9px] font-bold text-purple-700 uppercase bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                E-Commerce Digital PDP Listing (ASIN: B09X87KLLM)
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-1">GlowRadiance 15% Pure Vitamin C Serum (30 ml)</h3>
              <p className="text-[10px] text-slate-500">Seller: QuickMart Global Retail Pvt. Ltd.</p>
            </div>

            <div className="my-auto flex items-center justify-center p-4 bg-amber-50 rounded border border-amber-200">
              <div className="w-16 h-28 bg-amber-800 rounded-sm shadow flex flex-col justify-center items-center text-amber-100 text-[8px] p-1 border-t-2 border-amber-900">
                <span className="font-bold text-[9px]">GlowRadiance</span>
                <span>Vitamin C</span>
                <span className="text-[7px] mt-2 font-mono">30 ml</span>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded border border-slate-300 text-left text-xs">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold text-slate-900">M.R.P.: ₹ 899.00</span>
                <span className="text-[9px] text-emerald-700 font-semibold">(incl. of all taxes)</span>
              </div>
              <p className="text-[9px] text-slate-600 font-mono">Unit Price: ₹ 29.97 / ml</p>
              
              {/* GSR 128(E) Violation Note */}
              <div className="mt-2 p-1.5 bg-rose-50 border border-rose-200 rounded text-[9px] text-rose-800">
                <span className="font-bold block">⚠️ GSR 128(E) Contravention:</span>
                <span>Country of Origin missing on primary digital buy-box!</span>
              </div>
            </div>
          </div>
        ) : (
          /* SWASTHYA CHYAWANPRASH JAR */
          <div className="w-full h-full bg-gradient-to-b from-amber-800 via-amber-900 to-amber-950 text-amber-50 flex flex-col justify-between p-5 border-4 border-amber-600">
            <div className="text-center pt-2">
              <div className="w-4 h-4 border border-emerald-400 mx-auto flex items-center justify-center bg-white mb-1">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-700" />
              </div>
              <span className="text-[9px] font-bold text-amber-300 tracking-widest uppercase">Ayurvedic Immunity Rasayana</span>
              <h2 className="text-2xl font-black text-white tracking-wider mt-1">SWASTHYA</h2>
              <p className="text-[10px] font-bold text-amber-200">SPECIAL CHYAWANPRASH</p>
            </div>

            <div className="bg-amber-950/80 p-2.5 rounded border border-amber-700/60 text-left text-[9px] text-amber-200">
              <p className="font-bold text-white">Mfd by: Swasthya Ayur Laboratories Pvt. Ltd.</p>
              <p>Plot 48, GIDC Industrial Estate, Mehsana - 384002</p>
              <p className="text-[8px] text-amber-300/80 mt-1">Ayush Lic. No. GA/1284-A</p>
            </div>

            <div className="bg-amber-100 text-slate-900 p-2.5 rounded border border-amber-400">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block">Net Quantity</span>
                  <span className="text-sm font-bold text-rose-800 block">1000</span>
                  <span className="text-[7.5px] text-rose-700 font-semibold">(Rule 13 Violation: Missing 'g' or 'kg')</span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block">Maximum Retail Price</span>
                  <span className="text-xs font-bold text-slate-900 block">MRP ₹ 395.00</span>
                  <span className="text-[7.5px] text-emerald-800 font-semibold">(incl. of all taxes)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OVERLAID INTERACTIVE BOUNDING BOXES */}
        {showBoundingBoxes && boundingBoxes.map((box) => {
          const colors = getStatusColor(box.status);
          const isSelected = selectedBoxId === box.id;

          return (
            <div
              key={box.id}
              onClick={() => onSelectBox(box.id)}
              className={`absolute cursor-pointer transition-all duration-150 rounded ${
                isSelected ? 'ring-2 ring-blue-500 z-20' : 'hover:ring-1 hover:ring-slate-700 z-10'
              }`}
              style={{
                left: `${box.x}%`,
                top: `${box.y}%`,
                width: `${box.width}%`,
                height: `${box.height}%`,
                border: `2px dashed ${colors.stroke}`,
                backgroundColor: colors.fill
              }}
              title={`${box.label}: ${box.status}`}
            >
              {/* Pill badge for Box Identifier */}
              <div 
                className={`absolute -top-3 left-1 text-[8px] font-bold text-white px-1.5 py-0.2 rounded shadow-sm whitespace-nowrap ${colors.bg}`}
              >
                {box.label}
              </div>
            </div>
          );
        })}

        {/* OPTICAL RULE 7 CALIPER TOOL OVERLAY */}
        {isCaliperActive && (
          <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-center items-center">
            {/* Caliper Measurement Bracket */}
            <div className="relative w-48 bg-slate-950/85 backdrop-blur-sm text-white p-2.5 rounded-lg shadow-2xl border border-amber-400 pointer-events-auto">
              <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-700">
                <span className="text-[9px] font-bold text-amber-400 tracking-wider uppercase flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Rule 7 Optical Caliper
                </span>
                <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded ${
                  caliperHeightMm >= requiredHeightMm 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-rose-600 text-white'
                }`}>
                  {caliperHeightMm >= requiredHeightMm ? 'PASS' : `FAIL (-${(requiredHeightMm - caliperHeightMm).toFixed(1)}mm)`}
                </span>
              </div>

              {/* Digital Readout */}
              <div className="grid grid-cols-2 gap-2 text-center my-1">
                <div className="bg-slate-900 p-1 rounded border border-slate-700">
                  <span className="text-[7.5px] text-slate-400 block uppercase">Measured Height</span>
                  <span className="text-base font-black font-mono text-amber-300">
                    {caliperHeightMm.toFixed(1)} <span className="text-[9px] font-normal">mm</span>
                  </span>
                </div>
                <div className="bg-slate-900 p-1 rounded border border-slate-700">
                  <span className="text-[7.5px] text-slate-400 block uppercase">Statutory Min (Table I)</span>
                  <span className="text-base font-black font-mono text-slate-200">
                    {requiredHeightMm.toFixed(1)} <span className="text-[9px] font-normal">mm</span>
                  </span>
                </div>
              </div>

              {/* Precision Micrometer Adjuster Slider */}
              <div className="mt-2">
                <div className="flex justify-between text-[8px] text-slate-400 mb-0.5">
                  <span>Micrometer Slider</span>
                  <span className="font-mono">{caliperHeightMm.toFixed(1)} mm</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="8.0"
                  step="0.1"
                  value={caliperHeightMm}
                  onChange={(e) => onCaliperChange && onCaliperChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <div className="flex justify-between text-[7px] text-slate-500 font-mono mt-0.5">
                  <span>0.5 mm</span>
                  <span>4.0 mm (Req)</span>
                  <span>8.0 mm</span>
                </div>
              </div>
            </div>

            {/* Virtual Vernier Caliper Jaw Graphic */}
            <div className="mt-2 w-32 border-x-2 border-b-2 border-amber-400 h-8 flex items-center justify-center pointer-events-none">
              <span className="text-[8px] font-mono text-amber-400 bg-slate-950/80 px-1 rounded">
                ↕ {caliperHeightMm.toFixed(1)} mm
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
