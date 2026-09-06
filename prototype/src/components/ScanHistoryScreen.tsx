import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarDays, ChevronRight, History, LoaderCircle, Search } from 'lucide-react';
import { ComplianceResult } from '../domain';
import { ScanHistoryEntry } from '../services/scanApi';

interface ScanHistoryScreenProps {
  onLoad: (filters: { productName?: string; result?: ComplianceResult; from?: string; to?: string }) => Promise<ScanHistoryEntry[]>;
  onOpen: (entry: ScanHistoryEntry) => void;
}

const RESULTS: readonly ComplianceResult[] = ['PASS', 'FAIL', 'UNCERTAIN', 'NOT_APPLICABLE', 'NOT_MEASURABLE'];

const RESULT_CLASSES: Record<ComplianceResult, string> = {
  PASS: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  FAIL: 'bg-rose-50 text-rose-800 border-rose-200',
  UNCERTAIN: 'bg-amber-50 text-amber-800 border-amber-200',
  NOT_APPLICABLE: 'bg-slate-100 text-slate-700 border-slate-300',
  NOT_MEASURABLE: 'bg-orange-50 text-orange-800 border-orange-200',
};

export const ScanHistoryScreen: React.FC<ScanHistoryScreenProps> = ({ onLoad, onOpen }) => {
  const [productName, setProductName] = useState('');
  const [result, setResult] = useState<ComplianceResult | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [entries, setEntries] = useState<ScanHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filters = useMemo(() => ({
    productName: productName.trim() || undefined,
    result: result || undefined,
    from: from ? new Date(`${from}T00:00:00.000Z`).toISOString() : undefined,
    to: to ? new Date(`${to}T23:59:59.999Z`).toISOString() : undefined,
  }), [productName, result, from, to]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setEntries(await onLoad(filters));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Scan history could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [filters]);

  return <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
    <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><History className="w-5 h-5 text-blue-700" /><h1 className="text-lg font-bold text-slate-900">Scan history</h1></div>
          <p className="text-xs text-slate-500 mt-1">Persisted canonical screening results from completed scans.</p>
        </div>
        <button onClick={() => void load()} className="text-xs font-bold text-blue-700 hover:text-blue-900">Refresh</button>
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <label className="relative"><span className="sr-only">Search product name</span><Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" /><input value={productName} onChange={(event) => setProductName(event.target.value)} placeholder="Search product name" className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded" /></label>
        <label><span className="sr-only">Filter by result</span><select value={result} onChange={(event) => setResult(event.target.value as ComplianceResult | '')} className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded"><option value="">All result states</option>{RESULTS.map((state) => <option key={state} value={state}>{state.replace('_', ' ')}</option>)}</select></label>
        <label className="relative"><CalendarDays className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" /><span className="sr-only">From date</span><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded" /></label>
        <label className="relative"><CalendarDays className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" /><span className="sr-only">To date</span><input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded" /></label>
      </div>
    </div>

    {loading && <div className="bg-white rounded-lg border border-slate-200 p-10 text-center text-xs text-slate-500"><LoaderCircle className="w-6 h-6 animate-spin text-blue-700 mx-auto mb-2" />Loading persisted scans…</div>}
    {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900 flex items-center justify-between gap-3"><span className="flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</span><button onClick={() => void load()} className="font-bold underline">Retry</button></div>}
    {!loading && !error && entries.length === 0 && <div className="bg-white rounded-lg border border-slate-200 p-10 text-center"><History className="w-7 h-7 text-slate-300 mx-auto mb-2" /><p className="text-sm font-bold text-slate-700">No completed scans found</p><p className="text-xs text-slate-500 mt-1">Live history appears here after a canonical result is persisted.</p></div>}
    {!loading && !error && entries.length > 0 && <div className="bg-white rounded-lg border border-slate-200 shadow-sm divide-y divide-slate-100">{entries.map(({ scan, result: canonical }) => <button key={scan.id} onClick={() => onOpen({ scan, result: canonical })} className="w-full text-left p-4 hover:bg-blue-50/40 transition-colors flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-sm font-bold text-slate-900 truncate">{scan.productName}</p><p className="text-[11px] text-slate-500 mt-1">{scan.sourceType === 'PHYSICAL_PHOTO' ? 'Physical product photo' : 'E-commerce listing'} · {new Date(scan.timestamps.createdAt).toLocaleString()}</p><p className="text-[10px] text-slate-400 font-mono mt-1">{scan.id} · persisted canonical result</p></div><span className="flex items-center gap-2 shrink-0"><span className={`rounded border px-2 py-1 text-[10px] font-bold ${RESULT_CLASSES[canonical.overallResult]}`}>{canonical.overallResult.replace('_', ' ')}</span><ChevronRight className="w-4 h-4 text-slate-400" /></span></button>)}</div>}
  </section>;
};
