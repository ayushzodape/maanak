/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Maanak - Digital Compliance Screening Header & Navigation
 */

import React from 'react';
import { Home, ShieldCheck, Scale, Database, BarChart3, UserCheck, History } from 'lucide-react';
import { UserRole } from '../types';

interface HeaderProps {
  currentTab: 'home' | 'history' | 'workbench' | 'repository' | 'dashboard';
  onSelectTab: (tab: 'home' | 'history' | 'workbench' | 'repository' | 'dashboard') => void;
  activeRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  caseCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  activeRole,
  onChangeRole,
  caseCount
}) => {
  return (
    <header className="w-full bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-40">
      {/* Subtle National Accent Line */}
      <div className="h-1 w-full flex">
        <div className="w-1/3 bg-[#FF9933]"></div>
        <div className="w-1/3 bg-white"></div>
        <div className="w-1/3 bg-[#138808]"></div>
      </div>

      {/* Top Institutional Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between border-b border-slate-800/80 gap-3">
        {/* Left: Indian Emblem & Authority Branding */}
        <div className="flex items-center gap-3">
          {/* Stylized Emblem of India Icon */}
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-amber-400/40 flex items-center justify-center p-1 shadow-inner">
            <Scale className="w-5 h-5 text-amber-400" />
          </div>

          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-300 tracking-wider uppercase">
                MAANAK • DIGITAL COMPLIANCE SCREENING
              </span>
              <span className="text-[10px] bg-blue-900/80 text-blue-300 border border-blue-700/50 px-1.5 py-0.2 rounded font-mono">
                SCREENING MODE
              </span>
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Evidence-first packaged commodity review
            </div>
          </div>
        </div>

        {/* Right: National Brand & Officer Controls */}
        <div className="flex items-center gap-3">
          {/* Main Brand Title */}
          <div className="text-right hidden sm:block">
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-lg font-black tracking-tight text-white font-serif">
                मानक
              </span>
              <span className="text-xs font-bold text-amber-400 tracking-widest uppercase">
                • MAANAK
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block -mt-1 font-mono">
                Preliminary screening • evidence + rules
            </span>
          </div>

          {/* Role Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-md px-2.5 py-1">
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={activeRole}
              onChange={(e) => onChangeRole(e.target.value as UserRole)}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="LEGAL_METROLOGY_OFFICER" className="bg-slate-900 text-slate-200">
                Enforcement reviewer
              </option>
              <option value="ZONAL_INSPECTOR" className="bg-slate-900 text-slate-200">
                Supervising reviewer
              </option>
              <option value="CONTROLLER_OF_LEGAL_METROLOGY" className="bg-slate-900 text-slate-200">
                Compliance administrator
              </option>
              <option value="ENTERPRISE_COMPLIANCE_AUDITOR" className="bg-slate-900 text-slate-200">
                Demo fixture reviewer
              </option>
            </select>
          </div>

        </div>
      </div>

      {/* Main Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav className="flex items-center justify-between overflow-x-auto py-1.5 no-scrollbar">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onSelectTab('history')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                currentTab === 'history' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Scan History</span>
            </button>

            <button
              onClick={() => onSelectTab('home')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                currentTab === 'home' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>
            <button
              onClick={() => onSelectTab('workbench')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                currentTab === 'workbench'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Fixture Workbench</span>
            </button>

            <button
              onClick={() => onSelectTab('repository')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all relative ${
                currentTab === 'repository'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Fixture Repository</span>
              <span className="bg-slate-700 text-slate-200 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {caseCount}
              </span>
            </button>

            <button
              onClick={() => onSelectTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

          </div>

          {/* Current Statutory Amendment Badge */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live scan path separate from demo fixtures</span>
          </div>
        </nav>
      </div>
    </header>
  );
};
