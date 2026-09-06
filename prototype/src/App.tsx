/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Maanak - National Packaged Commodity Statutory Compliance Platform
 * Department of Consumer Affairs, Ministry of Consumer Affairs, Food & Public Distribution
 * Legal Metrology Division • Legal Metrology Act, 2009 & LMPC Rules, 2011
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { InspectionWorkbench } from './components/InspectionWorkbench';
import { StatutoryRepository } from './components/StatutoryRepository';
import { EnforcementDashboard } from './components/EnforcementDashboard';
import { StatutoryCompendium } from './components/StatutoryCompendium';
import { InspectorOverrideModal } from './components/InspectorOverrideModal';
import { NoticeGeneratorModal } from './components/NoticeGeneratorModal';
import { CustomScanModal } from './components/CustomScanModal';
import { HelplineModal } from './components/HelplineModal';
import { ScanResultScreen } from './components/ScanResultScreen';
import { CanonicalScanResult, Scan } from './domain';
import { INITIAL_CASES } from './data/sampleCases';
import { PackageEvidence, DeclarationAuditItem, UserRole, ComplianceStatus } from './types';

export default function App() {
  // Master state
  const [cases, setCases] = useState<PackageEvidence[]>(INITIAL_CASES);
  const [currentCase, setCurrentCase] = useState<PackageEvidence>(INITIAL_CASES[0]);
  const [currentTab, setCurrentTab] = useState<'home' | 'workbench' | 'repository' | 'dashboard' | 'rules' | 'notice'>('home');
  const [activeRole, setActiveRole] = useState<UserRole>('LEGAL_METROLOGY_OFFICER');

  // Modal triggers
  const [isCustomScanOpen, setIsCustomScanOpen] = useState<boolean>(false);
  const [overrideItem, setOverrideItem] = useState<DeclarationAuditItem | null>(null);
  const [noticeCase, setNoticeCase] = useState<PackageEvidence | null>(null);
  const [isHelplineOpen, setIsHelplineOpen] = useState<boolean>(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [resultScan, setResultScan] = useState<Scan | null>(null);
  const [canonicalResult, setCanonicalResult] = useState<CanonicalScanResult | null>(null);

  const officerNameMap: Record<UserRole, string> = {
    LEGAL_METROLOGY_OFFICER: "Rajesh Kumar Sharma (Inspector Grade I, LMO-4091)",
    ZONAL_INSPECTOR: "Smt. Priya V. Deshmukh (Zonal Circle Inspector, LMO-2104)",
    CONTROLLER_OF_LEGAL_METROLOGY: "Dr. K. S. Murthy, IAS (Controller of Legal Metrology)",
    ENTERPRISE_COMPLIANCE_AUDITOR: "Amitabh Sen (Lead Regulatory Compliance Auditor)"
  };

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  // Add newly scanned custom case
  const handleScanCreated = (scan: Scan, result: CanonicalScanResult) => {
    setResultScan(scan);
    setCanonicalResult(result);
    setIsCustomScanOpen(false);
    showNotification(`Canonical screening result ready for "${scan.productName}".`);
  };

  // Save inspector human-in-the-loop override
  const handleSaveOverride = (
    itemId: string,
    newStatus: ComplianceStatus,
    reason: string,
    remarks: string,
    officerPin: string
  ) => {
    const updatedDeclarations = currentCase.declarations.map((d) => {
      if (d.id === itemId) {
        return {
          ...d,
          status: newStatus,
          isOverridden: true,
          overrideDetails: {
            officerId: officerPin,
            officerName: officerNameMap[activeRole],
            previousStatus: d.status,
            newStatus,
            reason,
            timestamp: new Date().toISOString(),
            remarks
          }
        };
      }
      return d;
    });

    // Recalculate overall status
    const hasContraventions = updatedDeclarations.some(d => d.status === 'NON_COMPLIANT');
    const hasReview = updatedDeclarations.some(d => d.status === 'NEEDS_REVIEW');
    const isExempt = updatedDeclarations.every(d => d.status === 'STATUTORILY_EXEMPT');

    let newOverallStatus: ComplianceStatus = 'COMPLIANT';
    if (hasContraventions) newOverallStatus = 'NON_COMPLIANT';
    else if (hasReview) newOverallStatus = 'NEEDS_REVIEW';
    else if (isExempt) newOverallStatus = 'STATUTORILY_EXEMPT';

    const updatedCase: PackageEvidence = {
      ...currentCase,
      overallStatus: newOverallStatus,
      declarations: updatedDeclarations,
      legalNoticeEligible: newOverallStatus === 'NON_COMPLIANT',
      statutoryPenaltyEstimate: newOverallStatus === 'NON_COMPLIANT' ? 25000 : 0,
      summaryVerdict: newOverallStatus === 'COMPLIANT'
        ? `Adjudicated compliant by ${officerNameMap[activeRole]}. All statutory mandates satisfied.`
        : currentCase.summaryVerdict
    };

    setCurrentCase(updatedCase);
    setCases(prev => prev.map(c => c.caseId === updatedCase.caseId ? updatedCase : c));
    showNotification(`Statutory declaration updated to ${newStatus} by Inspecting Officer.`);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Toast Notification Banner */}
      {notificationMsg && (
        <div className="fixed top-14 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-md shadow-xl border border-amber-400/60 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Institutional Indian Government Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'notice') {
            setNoticeCase(currentCase);
          } else {
            setResultScan(null);
            setCanonicalResult(null);
            setCurrentTab(tab);
          }
        }}
        activeRole={activeRole}
        onChangeRole={(role) => {
          setActiveRole(role);
          showNotification(`Active role switched to: ${officerNameMap[role]}`);
        }}
        onOpenHelpline={() => setIsHelplineOpen(true)}
        caseCount={cases.length}
      />

      {/* Main App Body */}
      <main className="flex-1 pb-10">
        {resultScan && canonicalResult ? <ScanResultScreen
          scan={resultScan}
          result={canonicalResult}
          onBack={() => { setResultScan(null); setCanonicalResult(null); }}
          onRetry={() => { setResultScan(null); setCanonicalResult(null); setIsCustomScanOpen(true); }}
        /> : <>
        {currentTab === 'home' && <HomeScreen caseCount={cases.length} onStartScan={() => setIsCustomScanOpen(true)} />}
        {currentTab === 'workbench' && (
          <InspectionWorkbench
            currentCase={currentCase}
            cases={cases}
            onSelectCase={(c) => setCurrentCase(c)}
            onOpenCustomScan={() => setIsCustomScanOpen(true)}
            onOpenOverride={(item) => setOverrideItem(item)}
            onOpenNotice={(evidence) => setNoticeCase(evidence)}
          />
        )}

        {currentTab === 'repository' && (
          <StatutoryRepository
            cases={cases}
            onSelectCaseForWorkbench={(c) => {
              setCurrentCase(c);
              setCurrentTab('workbench');
            }}
            onOpenNotice={(c) => setNoticeCase(c)}
          />
        )}

        {currentTab === 'dashboard' && (
          <EnforcementDashboard
            cases={cases}
            onSelectCase={(c) => {
              setCurrentCase(c);
              setCurrentTab('workbench');
            }}
          />
        )}

        {currentTab === 'rules' && (
          <StatutoryCompendium />
        )}
        </>}
      </main>

      {/* Institutional Legal Footer */}
      <footer className="w-full bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="font-bold text-slate-200 flex items-center justify-center md:justify-start gap-2">
              <span className="font-serif text-sm">मानक • MAANAK</span>
              <span>• National Legal Metrology Packaged Commodities Portal</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Department of Consumer Affairs, Ministry of Consumer Affairs, Food and Public Distribution, Government of India.
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              Statutory Basis: Legal Metrology Act, 2009 (Act 1 of 2010) • LMPC Rules, 2011 • GSR 128(E) 2024
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400">
            <button onClick={() => setCurrentTab('rules')} className="hover:text-white">
              Rule 7 Table-I Standards
            </button>
            <button onClick={() => setIsHelplineOpen(true)} className="hover:text-white">
              National Consumer Helpline 1915
            </button>
            <span className="text-slate-600 font-mono">ISO/IEC 17025 Calibrated</span>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      {isCustomScanOpen && (
        <CustomScanModal
          onClose={() => setIsCustomScanOpen(false)}
          onScanCreated={handleScanCreated}
        />
      )}

      {overrideItem && (
        <InspectorOverrideModal
          item={overrideItem}
          officerName={officerNameMap[activeRole]}
          onClose={() => setOverrideItem(null)}
          onSaveOverride={handleSaveOverride}
        />
      )}

      {noticeCase && (
        <NoticeGeneratorModal
          evidence={noticeCase}
          onClose={() => setNoticeCase(null)}
        />
      )}

      {isHelplineOpen && (
        <HelplineModal
          onClose={() => setIsHelplineOpen(false)}
          onLinkCase={(complaintId) => {
            showNotification(`Linked complaint ${complaintId} to current statutory inspection case.`);
          }}
        />
      )}

    </div>
  );
}
