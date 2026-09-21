import React, { useEffect, useState } from 'react';
import { Shield, FileText, Activity, AlertCircle, RefreshCw, CheckCircle2, Lock, BookOpen } from 'lucide-react';
import { AuditLogEntry, ScanApiClient } from '../services/scanApi';

interface SupervisorAdminPanelProps {
  scanApi: ScanApiClient;
}

export const SupervisorAdminPanel: React.FC<SupervisorAdminPanelProps> = ({ scanApi }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [rulesData, setRulesData] = useState<{ rulesetVersion: string; rules: unknown[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'audit' | 'rules'>('audit');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [logsData, rules] = await Promise.all([
        scanApi.getAuditLogs(),
        scanApi.getRulesCatalog(),
      ]);
      setLogs(logsData);
      setRulesData(rules);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load supervisor administrative data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-lg p-5 border border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <h1 className="text-lg font-bold">Supervisor Administration & Audit Logs</h1>
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
              SUPERVISOR_ADMIN ROLE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enforcement oversight, immutable server audit logs, and verified Legal Metrology rule governance.
          </p>
        </div>
        <button
          onClick={() => void loadData()}
          disabled={loading}
          className="flex items-center gap-1.5 rounded bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 border border-slate-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh records</span>
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            {error}
          </span>
          <button onClick={() => void loadData()} className="font-bold underline">Retry</button>
        </div>
      )}

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('audit')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
            activeSubTab === 'audit' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Audit Log Trail ({logs.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('rules')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
            activeSubTab === 'rules' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Statutory Rule Catalog ({rulesData?.rules.length ?? 0})</span>
        </button>
      </div>

      {/* Tab 1: Audit Logs */}
      {activeSubTab === 'audit' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">System Audit Trail</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Captures sign-ins, product scan creations, and report exports with timestamps.</p>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Restricted to Supervisors</span>
          </div>
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading audit trail…</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">No audit events recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Actor / Username</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.action === 'LOGIN' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                          log.action === 'SCAN_CREATED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-900 font-bold">{log.username}</td>
                      <td className="px-4 py-3 text-slate-600 text-[11px]">{log.role}</td>
                      <td className="px-4 py-3 text-slate-500 text-[11px] font-sans">
                        {log.details ? JSON.stringify(log.details) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Rule Catalog */}
      {activeSubTab === 'rules' && rulesData && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Active Statutory Ruleset</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Ruleset Version: <code className="font-bold text-blue-700">{rulesData.rulesetVersion}</code></p>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
              VERIFIED & DETERMINISTIC
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {(rulesData.rules as Array<{ id: string; title: string; source: string; sourceVersion: string; verificationStatus: string; knownGaps?: string }>).map((rule) => (
              <div key={rule.id} className="p-4 sm:px-5 space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-sm text-slate-900 font-mono">{rule.id}</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {rule.verificationStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-medium">{rule.title}</p>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono pt-1">
                  <span>Source: {rule.source}</span>
                  <span>·</span>
                  <span>Version: {rule.sourceVersion}</span>
                </div>
                {rule.knownGaps && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 mt-1 font-sans">
                    <strong>Known statutory gap:</strong> {rule.knownGaps}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
