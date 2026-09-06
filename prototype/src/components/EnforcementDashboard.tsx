/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Maanak - Demo Fixture Analytics Dashboard
 */

import React from 'react';
import { BarChart3, AlertTriangle, ShieldCheck, Scale, FileText, CheckCircle2, TrendingUp, Building2 } from 'lucide-react';
import { PackageEvidence } from '../types';

interface EnforcementDashboardProps {
  cases: PackageEvidence[];
  onSelectCase: (caseItem: PackageEvidence) => void;
}

export const EnforcementDashboard: React.FC<EnforcementDashboardProps> = ({
  cases,
  onSelectCase
}) => {
  const totalInspected = cases.length;
  const nonCompliantCount = cases.filter(c => c.overallStatus === 'NON_COMPLIANT').length;
  const compliantCount = cases.filter(c => c.overallStatus === 'COMPLIANT').length;
  const reviewCount = cases.filter(c => c.overallStatus === 'NEEDS_REVIEW').length;
  const exemptCount = cases.filter(c => c.overallStatus === 'STATUTORILY_EXEMPT').length;

  const contraventionRate = totalInspected > 0 
    ? ((nonCompliantCount / totalInspected) * 100).toFixed(1) 
    : '0';

  const totalPenalties = cases.reduce((acc, c) => acc + c.statutoryPenaltyEstimate, 0);

  // Common violations breakdown
  const violationStats = [
    {
      rule: "Rule 6(1)(e) - MRP & Tax Qualifier",
      count: 4,
      percentage: 40,
      description: "Missing '(incl. of all taxes)' suffix or Unit Sale Price"
    },
    {
      rule: "Fixture character-height finding (not evaluated)",
      count: 3,
      percentage: 30,
      description: "Net quantity numeral height below statutory threshold"
    },
    {
      rule: "Rule 6(1)(n) - Consumer Care Grievance Cell",
      count: 2,
      percentage: 20,
      description: "Omission of mandatory grievance officer email"
    },
    {
      rule: "E-commerce country-of-origin finding (source pending)",
      count: 2,
      percentage: 20,
      description: "Country of origin missing on marketplace digital buy-box"
    },
    {
      rule: "Rule 13 - Unit Symbol Notation Standard",
      count: 1,
      percentage: 10,
      description: "Net quantity declared without standard unit abbreviation"
    }
  ];

  // Circle inspection performance
  const circleStats = [
    { circle: "North Delhi Circle - Subzi Mandi", inspected: 42, violations: 14, complianceRate: 66.7 },
    { circle: "Mumbai Port Zone - Ward G/North", inspected: 58, violations: 11, complianceRate: 81.0 },
    { circle: "Bengaluru South - Jayanagar Ward", inspected: 36, violations: 6, complianceRate: 83.3 },
    { circle: "Kolkata E-Commerce Enforcement Cell", inspected: 29, violations: 12, complianceRate: 58.6 },
    { circle: "Ahmedabad Industrial Metrology Unit", inspected: 45, violations: 8, complianceRate: 82.2 }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-700" />
            <h1 className="text-lg font-bold text-slate-900">
              Demo fixture analytics
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Preloaded synthetic trends for visual demonstration only — not live enforcement statistics.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold bg-amber-50 text-amber-800 px-3 py-1.5 rounded border border-amber-200">
          <CheckCircle2 className="w-4 h-4 text-amber-600" />
          <span>DEMO FIXTURE DATA</span>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Inspected */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Fixture Records
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{totalInspected}</span>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              Fixture ledger
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {compliantCount} compliant • {exemptCount} Rule 26 exempt
          </span>
        </div>

        {/* Contravention Rate */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Fixture finding rate
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-rose-700 font-mono">{contraventionRate}%</span>
            <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {nonCompliantCount} flagged fixture records
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Derived only from the preloaded fixture cases
          </span>
        </div>

        {/* Fixture finding count — not a legal notice count. */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Fixture findings requiring review
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {cases.filter(c => c.legalNoticeEligible).length}
            </span>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Screening only
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Maanak does not generate official notices
          </span>
        </div>

        {/* Recoverable Penalties */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Fixture penalty field
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              ₹{(totalPenalties / 1000).toFixed(0)}k
            </span>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              Not a legal estimate
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Synthetic fixture value; not a legal penalty
          </span>
        </div>

      </div>

      {/* Mid Section: Violations Breakdown & Circle Efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Most Prevalent Statutory Contraventions (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-700" />
              Prevalence of fixture findings
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Fixture labels only</span>
          </div>

          <div className="space-y-4 text-xs">
            {violationStats.map((v, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-800 font-semibold">{v.rule}</span>
                  <span className="text-slate-500 font-mono">{v.percentage}% of cases</span>
                </div>
                {/* Visual bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${v.percentage * 2}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">{v.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Zonal Circle Performance (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-700" />
              Fixture group comparison
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Circle Efficiency</span>
          </div>

          <div className="space-y-3 text-xs flex-1 overflow-y-auto">
            {circleStats.map((c, idx) => (
              <div key={idx} className="p-2.5 rounded border border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 block text-xs">{c.circle}</span>
                  <span className="text-[10px] text-slate-500">
                    {c.inspected} fixture records • {c.violations} findings
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                    c.complianceRate >= 80 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : c.complianceRate >= 65 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {c.complianceRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recent Surveillance Log */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
          Demo fixture activity feed
        </h3>
        <div className="divide-y divide-slate-100 text-xs">
          {cases.slice(0, 5).map((c) => (
            <div 
              key={c.caseId}
              onClick={() => onSelectCase(c)}
              className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  c.overallStatus === 'COMPLIANT' ? 'bg-emerald-600' :
                  c.overallStatus === 'NON_COMPLIANT' ? 'bg-rose-600' :
                  c.overallStatus === 'STATUTORILY_EXEMPT' ? 'bg-indigo-600' : 'bg-amber-600'
                }`} />
                <div>
                  <span className="font-bold text-slate-900">{c.productName}</span>
                  <span className="text-slate-500 text-[11px] block">
                    {c.brand} • {c.inspectionCircle}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono text-[11px] text-slate-500 block">
                  {new Date(c.timestamp).toLocaleDateString('en-IN')}
                </span>
                <span className="text-[10px] text-blue-700 font-medium hover:underline">
                  View Dossier →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
