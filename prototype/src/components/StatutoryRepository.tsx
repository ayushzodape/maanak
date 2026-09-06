/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Maanak - Statutory Repository & Historical Inspection Ledger
 * Searchable, filterable repository of commodity inspections across circles
 */

import React, { useState } from 'react';
import { Search, Filter, Download, ExternalLink, ShieldCheck, AlertTriangle, ShieldAlert, FileText, X } from 'lucide-react';
import { PackageEvidence, ComplianceStatus } from '../types';

interface StatutoryRepositoryProps {
  cases: PackageEvidence[];
  onSelectCaseForWorkbench: (caseItem: PackageEvidence) => void;
  onOpenNotice: (caseItem: PackageEvidence) => void;
}

export const StatutoryRepository: React.FC<StatutoryRepositoryProps> = ({
  cases,
  onSelectCaseForWorkbench,
  onOpenNotice
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeDrawerCase, setActiveDrawerCase] = useState<PackageEvidence | null>(null);

  // Filtering
  const filteredCases = cases.filter((c) => {
    const matchesSearch = 
      c.caseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.inspectionCircle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === 'ALL' || c.overallStatus === selectedStatus;
    const matchesCategory = selectedCategory === 'ALL' || c.category === selectedCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status: ComplianceStatus) => {
    switch (status) {
      case 'COMPLIANT':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded">
            <ShieldCheck className="w-3 h-3" />
            COMPLIANT
          </span>
        );
      case 'NON_COMPLIANT':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-[11px] font-bold px-2 py-0.5 rounded">
            <ShieldAlert className="w-3 h-3" />
            CONTRAVENTION
          </span>
        );
      case 'NEEDS_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded">
            <AlertTriangle className="w-3 h-3" />
            NEEDS REVIEW
          </span>
        );
      case 'STATUTORILY_EXEMPT':
        return (
          <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 text-[11px] font-bold px-2 py-0.5 rounded">
            § RULE 26 EXEMPT
          </span>
        );
    }
  };

  const handleExportCSV = () => {
    const headers = ["Case ID", "Product", "Brand", "Category", "Status", "Net Qty", "Circle", "Inspector", "Timestamp", "SHA256"];
    const rows = filteredCases.map(c => [
      c.caseId,
      `"${c.productName.replace(/"/g, '""')}"`,
      `"${c.brand.replace(/"/g, '""')}"`,
      c.category,
      c.overallStatus,
      `"${c.netQuantityDeclared}"`,
      `"${c.inspectionCircle}"`,
      `"${c.inspectorName}"`,
      c.timestamp,
      c.sha256Digest
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `maanak_inspections_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      
      {/* Search and Filters Header */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search bar */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Product, Brand, Case ID or Circle..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Dropdown Filters & Export */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-700"
            >
              <option value="ALL">All Compliance Statuses</option>
              <option value="COMPLIANT">Compliant Only</option>
              <option value="NON_COMPLIANT">Contraventions Only</option>
              <option value="NEEDS_REVIEW">Needs Review</option>
              <option value="STATUTORILY_EXEMPT">Rule 26 Exempt</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-700"
            >
              <option value="ALL">All Categories</option>
              <option value="EDIBLE_OILS">Edible Oils</option>
              <option value="DAIRY">Dairy</option>
              <option value="COSMETICS">Cosmetics</option>
              <option value="PACKAGED_FOODS">Packaged Foods</option>
              <option value="PHARMACEUTICALS">Pharmaceuticals</option>
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3 py-1 rounded text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

      </div>

      {/* Main Repository Data Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-3 w-36">Case Identifier</th>
                <th className="p-3">Commodity & Brand</th>
                <th className="p-3 w-28">Category</th>
                <th className="p-3 w-28">Net Quantity</th>
                <th className="p-3 w-40">Inspection Circle</th>
                <th className="p-3 w-36 text-center">Statutory Status</th>
                <th className="p-3 w-36 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCases.map((c) => (
                <tr 
                  key={c.caseId}
                  className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                  onClick={() => setActiveDrawerCase(c)}
                >
                  <td className="p-3 font-mono font-bold text-blue-900">
                    {c.caseId}
                    <span className="block text-[10px] text-slate-400 font-sans">
                      {new Date(c.timestamp).toLocaleDateString('en-IN')}
                    </span>
                  </td>

                  <td className="p-3">
                    <span className="font-bold text-slate-900 block">{c.productName}</span>
                    <span className="text-[11px] text-slate-500">{c.brand}</span>
                  </td>

                  <td className="p-3">
                    <span className="text-[11px] font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                      {c.category.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="p-3 font-semibold text-slate-800">
                    {c.netQuantityDeclared}
                  </td>

                  <td className="p-3 text-[11px] text-slate-600">
                    {c.inspectionCircle}
                  </td>

                  <td className="p-3 text-center">
                    {getStatusBadge(c.overallStatus)}
                  </td>

                  <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSelectCaseForWorkbench(c)}
                        className="p-1 text-blue-700 hover:bg-blue-50 rounded"
                        title="Load in Active Workbench"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      {c.legalNoticeEligible && (
                        <button
                          onClick={() => onOpenNotice(c)}
                          className="p-1 text-rose-700 hover:bg-rose-50 rounded"
                          title="View Form VIII Notice"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCases.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs">
            No inspection records match the current filters.
          </div>
        )}
      </div>

      {/* Slide-out Case Detail Dossier Drawer */}
      {activeDrawerCase && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-slate-300 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            
            {/* Drawer Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block">
                  INSPECTION DOSSIER
                </span>
                <h3 className="text-sm font-bold">{activeDrawerCase.caseId}</h3>
              </div>
              <button
                onClick={() => setActiveDrawerCase(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 flex-1">
              
              {/* Product Info */}
              <div className="bg-slate-50 p-3.5 rounded border border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm">{activeDrawerCase.productName}</h4>
                <p className="text-slate-600 mt-0.5">{activeDrawerCase.brand}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Declared Net Qty:</span>
                    <span className="font-semibold text-slate-800">{activeDrawerCase.netQuantityDeclared}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Packaging Type:</span>
                    <span className="font-semibold text-slate-800">{activeDrawerCase.packagingType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Inspection Date:</span>
                    <span className="font-semibold text-slate-800">
                      {new Date(activeDrawerCase.timestamp).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Inspecting Officer:</span>
                    <span className="font-semibold text-slate-800">{activeDrawerCase.inspectorName}</span>
                  </div>
                </div>
              </div>

              {/* Status & Verdict */}
              <div className="p-3 rounded border border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900">Overall Statutory Finding:</span>
                  {getStatusBadge(activeDrawerCase.overallStatus)}
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed bg-white p-2 rounded border border-slate-100">
                  {activeDrawerCase.summaryVerdict}
                </p>
              </div>

              {/* Itemized Declaration Breakdown */}
              <div>
                <h5 className="font-bold text-slate-900 mb-2">Itemized Declarations Audited:</h5>
                <div className="space-y-2">
                  {activeDrawerCase.declarations.map((d) => (
                    <div key={d.id} className="p-2.5 rounded border border-slate-200 bg-white">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{d.declarationName}</span>
                        {getStatusBadge(d.status)}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        <span className="font-mono text-[10px] text-slate-400">{d.statutoryRule}</span>
                      </p>
                      <p className="text-[11px] text-slate-700 mt-1">
                        {d.algorithmicFinding}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Digital Chain of Custody */}
              <div className="bg-slate-900 text-slate-300 p-3 rounded text-[10px] font-mono space-y-1">
                <span className="text-amber-400 font-bold block">Digital Chain of Custody:</span>
                <p>SHA-256: {activeDrawerCase.sha256Digest}</p>
                <p>Sensor Resolution: {activeDrawerCase.imageResolution} @ {activeDrawerCase.sensorDpi} DPI</p>
              </div>

            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  onSelectCaseForWorkbench(activeDrawerCase);
                  setActiveDrawerCase(null);
                }}
                className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-3 rounded text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open in Workbench
              </button>
              {activeDrawerCase.legalNoticeEligible && (
                <button
                  onClick={() => {
                    onOpenNotice(activeDrawerCase);
                    setActiveDrawerCase(null);
                  }}
                  className="bg-rose-700 hover:bg-rose-800 text-white font-bold py-2 px-3 rounded text-xs transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Form VIII Notice
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
