import React from 'react';
import { Camera, History, ShieldCheck } from 'lucide-react';

interface HomeScreenProps {
  onStartScan: () => void;
  caseCount: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStartScan, caseCount }) => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
    <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 sm:p-7">
      <div className="max-w-2xl">
        <p className="text-[11px] font-bold tracking-wider uppercase text-blue-700 mb-2">Digital Compliance Screening</p>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Screen a packaged commodity</h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">Capture a product image, extract visible declarations, and review evidence against verified rules. Maanak supports preliminary screening; it is not an official inspection or legal determination.</p>
        <button onClick={onStartScan} className="mt-5 flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2.5 rounded-md text-sm font-bold shadow-sm transition-colors">
          <Camera className="w-4 h-4" /> Scan a product
        </button>
      </div>
    </section>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
        <div><h2 className="font-bold text-sm text-slate-900">Evidence-first review</h2><p className="text-xs text-slate-500 mt-1">AI observations remain separate from deterministic rule results.</p></div>
      </div>
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 flex items-start gap-3">
        <History className="w-5 h-5 text-blue-700 shrink-0" />
        <div><h2 className="font-bold text-sm text-slate-900">Recent screening records</h2><p className="text-xs text-slate-500 mt-1">{caseCount} temporary records are available in the current prototype.</p></div>
      </div>
    </div>
  </div>
);
