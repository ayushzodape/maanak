/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Maanak - Digital Compliance Screening
 */

import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { InspectionWorkbench } from './components/InspectionWorkbench';
import { StatutoryRepository } from './components/StatutoryRepository';
import { EnforcementDashboard } from './components/EnforcementDashboard';
import { InspectorOverrideModal } from './components/InspectorOverrideModal';
import { CustomScanModal } from './components/CustomScanModal';
import { ScanResultScreen } from './components/ScanResultScreen';
import { ScanHistoryScreen } from './components/ScanHistoryScreen';
import { LoginScreen } from './components/LoginScreen';
import { CanonicalScanResult, Scan } from './domain';
import { createScanApiClient } from './services/scanApi';
import { AuthenticatedUser, ScanApiError, ScanHistoryEntry } from './services/scanApi';
import { INITIAL_CASES } from './data/sampleCases';
import { PackageEvidence, DeclarationAuditItem, UserRole, ComplianceStatus } from './types';

export default function App() {
  // Master state
  const [cases, setCases] = useState<PackageEvidence[]>(INITIAL_CASES);
  const [currentCase, setCurrentCase] = useState<PackageEvidence>(INITIAL_CASES[0]);
  const [currentTab, setCurrentTab] = useState<'home' | 'history' | 'workbench' | 'repository' | 'dashboard'>('home');
  const [activeRole, setActiveRole] = useState<UserRole>('LEGAL_METROLOGY_OFFICER');

  // Modal triggers
  const [isCustomScanOpen, setIsCustomScanOpen] = useState<boolean>(false);
  const [overrideItem, setOverrideItem] = useState<DeclarationAuditItem | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [resultScan, setResultScan] = useState<Scan | null>(null);
  const [canonicalResult, setCanonicalResult] = useState<CanonicalScanResult | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthenticatedUser | null>(null);
  const scanApi = createScanApiClient('', () => setAuthenticatedUser(null));

  const checkSession = () => {
    setAuthLoading(true);
    setAuthError(null);
    scanApi.getSession()
      .then((user) => {
        setAuthenticatedUser(user);
        setAuthError(null);
      })
      .catch((error) => {
        if (error instanceof ScanApiError && error.status === 401) {
          setAuthenticatedUser(null);
          return;
        }
        setAuthError('The screening server could not be reached. Check the network and retry.');
      })
      .finally(() => setAuthLoading(false));
  };

  useEffect(() => { checkSession(); }, []);

  if (authLoading) return <main className="min-h-screen bg-slate-100 flex items-center justify-center text-xs text-slate-500">Checking screening session…</main>;
  if (authError) return <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4"><div className="w-full max-w-sm rounded-lg border border-rose-200 bg-white p-6 text-center shadow-sm"><p className="text-sm font-bold text-slate-900">Screening server unavailable</p><p className="mt-2 text-xs text-slate-600">{authError}</p><button onClick={checkSession} className="mt-4 rounded bg-blue-700 px-4 py-2 text-xs font-bold text-white">Retry connection</button></div></main>;
  if (!authenticatedUser) return <LoginScreen onLogin={async (username, password) => {
    const user = await scanApi.login(username, password);
    setAuthenticatedUser(user);
    setAuthError(null);
    return user;
  }} />;

  const officerNameMap: Record<UserRole, string> = {
    LEGAL_METROLOGY_OFFICER: 'Enforcement reviewer',
    ZONAL_INSPECTOR: 'Supervising reviewer',
    CONTROLLER_OF_LEGAL_METROLOGY: 'Compliance administrator',
    ENTERPRISE_COMPLIANCE_AUDITOR: 'Demo fixture reviewer',
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

  const handleOpenHistory = (entry: ScanHistoryEntry) => {
    setResultScan(entry.scan);
    setCanonicalResult(entry.result);
  };

  // Save a reviewer action against a demo fixture only.
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
        ? `Fixture record marked compliant by ${officerNameMap[activeRole]}.`
        : currentCase.summaryVerdict
    };

    setCurrentCase(updatedCase);
    setCases(prev => prev.map(c => c.caseId === updatedCase.caseId ? updatedCase : c));
    showNotification(`Demo fixture record updated to ${newStatus}.`);
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

      {/* Maanak screening header */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setResultScan(null);
          setCanonicalResult(null);
          setCurrentTab(tab);
        }}
        activeRole={activeRole}
        onChangeRole={(role) => {
          setActiveRole(role);
          showNotification(`Display role changed to: ${officerNameMap[role]}. Server authorization remains ${authenticatedUser.role}.`);
        }}
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
        {(currentTab === 'workbench' || currentTab === 'repository' || currentTab === 'dashboard') && <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4"><div className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] text-amber-900"><strong>DEMO FIXTURE MODE:</strong> this legacy surface uses preloaded synthetic case data. It is not live scan evidence or live enforcement data.</div></div>}
        {currentTab === 'home' && <HomeScreen caseCount={cases.length} onStartScan={() => setIsCustomScanOpen(true)} />}
        {currentTab === 'history' && <ScanHistoryScreen onLoad={(filters) => scanApi.listHistory(filters)} onOpen={handleOpenHistory} />}
        {currentTab === 'workbench' && (
          <InspectionWorkbench
            currentCase={currentCase}
            cases={cases}
            onSelectCase={(c) => setCurrentCase(c)}
            onOpenCustomScan={() => setIsCustomScanOpen(true)}
            onOpenOverride={(item) => setOverrideItem(item)}
          />
        )}

        {currentTab === 'repository' && (
          <StatutoryRepository
            cases={cases}
            onSelectCaseForWorkbench={(c) => {
              setCurrentCase(c);
              setCurrentTab('workbench');
            }}
          />
        )}

        {currentTab === 'dashboard' && (
          <EnforcementDashboard
            onLoad={() => scanApi.listHistory()}
            onOpen={handleOpenHistory}
          />
        )}

        </>}
      </main>

      {/* Institutional Legal Footer */}
      <footer className="w-full bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="font-bold text-slate-200 flex items-center justify-center md:justify-start gap-2">
              <span className="font-serif text-sm">मानक • MAANAK</span>
              <span>• Digital Compliance Screening</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Evidence-first screening support for packaged commodities. Not an official inspection system.
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              Source images remain the evidence of record • Results are preliminary screening outputs
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400">
            <span className="text-slate-500 font-mono">No certified measurement claim</span>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      {isCustomScanOpen && (
        <CustomScanModal
          onClose={() => setIsCustomScanOpen(false)}
          onScanCreated={handleScanCreated}
          onUnauthorized={() => setAuthenticatedUser(null)}
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

    </div>
  );
}
