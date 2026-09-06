/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Maanak - persisted screening dashboard
 */

import React, { useEffect, useState } from 'react';
import { AlertCircle, BarChart3, CalendarDays, ChevronRight, History, LoaderCircle } from 'lucide-react';
import { ComplianceResult } from '../domain';
import { ScanHistoryEntry } from '../services/scanApi';

interface EnforcementDashboardProps {
  onLoad: () => Promise<ScanHistoryEntry[]>;
  onOpen: (entry: ScanHistoryEntry) => void;
}

const RESULT_STATES: readonly ComplianceResult[] = ['PASS', 'FAIL', 'UNCERTAIN', 'NOT_APPLICABLE', 'NOT_MEASURABLE'];
const RESULT_STYLES: Record<ComplianceResult, string> = {
  PASS: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  FAIL: 'bg-rose-50 text-rose-800 border-rose-200',
  UNCERTAIN: 'bg-amber-50 text-amber-800 border-amber-200',
  NOT_APPLICABLE: 'bg-slate-100 text-slate-700 border-slate-300',
  NOT_MEASURABLE: 'bg-orange-50 text-orange-800 border-orange-200',
};

export interface DashboardMetrics {
  readonly completedScans: number;
  readonly byResult: Record<ComplianceResult, number>;
}

export function deriveDashboardMetrics(entries: readonly ScanHistoryEntry[]): DashboardMetrics {
  const byResult = RESULT_STATES.reduce<Record<ComplianceResult, number>>((result, state) => {
    result[state] = entries.filter(({ result: canonical }) => canonical.overallResult === state).length;
    return result;
  }, { PASS: 0, FAIL: 0, UNCERTAIN: 0, NOT_APPLICABLE: 0, NOT_MEASURABLE: 0 });
  return { completedScans: entries.length, byResult };
}

export const EnforcementDashboard: React.FC<EnforcementDashboardProps> = ({ onLoad, onOpen }) => {
  const [entries, setEntries] = useState<ScanHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setEntries(await onLoad());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Dashboard data could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const metrics = deriveDashboardMetrics(entries);

  return <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
    <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-700" /><h1 className="text-lg font-bold text-slate-900">Screening dashboard</h1></div>
        <p className="text-xs text-slate-500 mt-1">Counts and recent activity from completed scans with persisted canonical results.</p>
        <p className="text-[10px] text-slate-400 font-mono mt-1">Source: GET /scans · completed entries only · no fixture records</p>
      </div>
      <button onClick={() => void load()} className="text-xs font-bold text-blue-700 hover:text-blue-900">Refresh</button>
    </div>

    {loading && <div className="bg-white rounded-lg border border-slate-200 p-10 text-center text-xs text-slate-500"><LoaderCircle className="w-6 h-6 animate-spin text-blue-700 mx-auto mb-2" />Loading persisted dashboard data…</div>}
    {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900 flex items-center justify-between gap-3"><span className="flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</span><button onClick={() => void load()} className="font-bold underline">Retry</button></div>}
    {!loading && !error && entries.length === 0 && <div className="bg-white rounded-lg border border-slate-200 p-10 text-center"><History className="w-7 h-7 text-slate-300 mx-auto mb-2" /><p className="text-sm font-bold text-slate-700">No completed scans yet</p><p className="text-xs text-slate-500 mt-1">Dashboard metrics will appear after a persisted canonical result is available.</p></div>}
    {!loading && !error && entries.length > 0 && <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <MetricCard label="Completed scans" value={metrics.completedScans} />
        {RESULT_STATES.map((state) => <MetricCard key={state} label={state.replace('_', ' ')} value={metrics.byResult[state]} result={state} />)}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100"><h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent screening activity</h2><p className="text-[10px] text-slate-500 mt-1">Source: persisted completed scan records, ordered by scan creation time.</p></div>
        <div className="divide-y divide-slate-100">{entries.slice(0, 10).map((entry) => <button key={entry.scan.id} onClick={() => onOpen(entry)} className="w-full text-left px-5 py-3 flex items-center justify-between gap-3 hover:bg-blue-50/40 transition-colors"><div className="min-w-0"><span className="font-bold text-sm text-slate-900 block truncate">{entry.scan.productName}</span><span className="text-[11px] text-slate-500 block mt-1"><CalendarDays className="w-3 h-3 inline mr-1" />{new Date(entry.scan.timestamps.createdAt).toLocaleString()} · {entry.scan.id}</span></div><span className="flex items-center gap-2 shrink-0"><span className={`rounded border px-2 py-1 text-[10px] font-bold ${RESULT_STYLES[entry.result.overallResult]}`}>{entry.result.overallResult.replace('_', ' ')}</span><ChevronRight className="w-4 h-4 text-slate-400" /></span></button>)}</div>
      </div>
    </>}
  </section>;
};

function MetricCard({ label, value, result }: { label: string; value: number; result?: ComplianceResult; key?: React.Key }) {
  return <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm"><span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{label}</span><div className="flex items-baseline justify-between mt-2"><span className="text-2xl font-black text-slate-900 font-mono">{value}</span>{result && <span className={`text-[9px] font-bold rounded border px-1.5 py-0.5 ${RESULT_STYLES[result]}`}>CANONICAL</span>}</div><span className="text-[10px] text-slate-500 mt-1 block">Persisted result state</span></div>;
}
