import React from 'react';
import { FIAEmblem } from './FIAEmblem';
import { Shield, RefreshCw, Lock, PlusCircle, CheckCircle2, CloudCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewOfficerModal: () => void;
  onOpenActivityModal: () => void;
  onTriggerSecurityLock: () => void;
  isSyncing: boolean;
  onSyncHq: () => void;
  isConsoleLocked: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewOfficerModal,
  onOpenActivityModal,
  onTriggerSecurityLock,
  isSyncing,
  onSyncHq,
  isConsoleLocked,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 transition-colors">
      {/* Top Banner: Classification Notice */}
      <div className="bg-slate-950 px-4 py-1 text-[11px] font-mono tracking-wider border-b border-slate-800 flex items-center justify-between text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-semibold">RESTRICTED</span>
          <span aria-hidden="true">·</span>
          <span>FEDERAL INVESTIGATION AGENCY — ISLAMABAD ZONE</span>
          <span aria-hidden="true" className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">PERFORMANCE EVALUATION WING</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:inline text-slate-400">SYSTEM CMS: ONLINE</span>
          <span aria-hidden="true" className="hidden md:inline">·</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            HQ CMS LINKED
          </span>
        </div>
      </div>

      {/* Main Bar: 3-Zone Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Zone 1: Single text element Brand mark */}
        <div className="flex items-center gap-3">
          <FIAEmblem size={36} />
          <button 
            onClick={() => setActiveTab('officers')}
            className="text-left font-bold text-lg tracking-tight text-white hover:text-amber-400 transition-colors whitespace-nowrap"
          >
            FIA Islamabad Command
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('officers')}
            className={`transition-colors whitespace-nowrap py-1 border-b-2 ${
              activeTab === 'officers'
                ? 'text-amber-400 border-amber-400 font-semibold'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            Officer Records
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`transition-colors whitespace-nowrap py-1 border-b-2 ${
              activeTab === 'roster'
                ? 'text-amber-400 border-amber-400 font-semibold'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            Duty Roster
          </button>
          <button
            onClick={() => setActiveTab('acr')}
            className={`transition-colors whitespace-nowrap py-1 border-b-2 ${
              activeTab === 'acr'
                ? 'text-amber-400 border-amber-400 font-semibold'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            ACR Dossiers
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`transition-colors whitespace-nowrap py-1 border-b-2 ${
              activeTab === 'analytics'
                ? 'text-amber-400 border-amber-400 font-semibold'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            Zone Statistics
          </button>
          <button
            onClick={() => setActiveTab('hq-sync')}
            className={`transition-colors whitespace-nowrap py-1 border-b-2 ${
              activeTab === 'hq-sync'
                ? 'text-amber-400 border-amber-400 font-semibold'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            HQ Integration
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`transition-colors whitespace-nowrap py-1 border-b-2 ${
              activeTab === 'audit'
                ? 'text-amber-400 border-amber-400 font-semibold'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            Audit Logs
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenActivityModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors whitespace-nowrap"
            title="Log officer day-to-day activity"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Log Daily Duty</span>
          </button>

          <button
            onClick={onSyncHq}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors whitespace-nowrap disabled:opacity-50"
            title="Synchronize records with FIA Headquarters CMS"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Sync HQ CMS</span>
            <span className="md:hidden">Sync</span>
          </button>

          <button
            onClick={onTriggerSecurityLock}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-800 border border-slate-700 rounded-md transition-colors cursor-pointer"
            title="Lock Console with Security Authentication PIN"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Lock Console</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Row (Horizontal Scrollable) */}
      <div className="lg:hidden flex items-center gap-4 px-4 py-2 overflow-x-auto border-t border-slate-800 text-xs font-medium scrollbar-none">
        <button
          onClick={() => setActiveTab('officers')}
          className={`whitespace-nowrap pb-1 ${activeTab === 'officers' ? 'text-amber-400 font-semibold border-b-2 border-amber-400' : 'text-slate-400'}`}
        >
          Officers
        </button>
        <button
          onClick={() => setActiveTab('roster')}
          className={`whitespace-nowrap pb-1 ${activeTab === 'roster' ? 'text-amber-400 font-semibold border-b-2 border-amber-400' : 'text-slate-400'}`}
        >
          Duty Roster
        </button>
        <button
          onClick={() => setActiveTab('acr')}
          className={`whitespace-nowrap pb-1 ${activeTab === 'acr' ? 'text-amber-400 font-semibold border-b-2 border-amber-400' : 'text-slate-400'}`}
        >
          ACR Dossiers
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`whitespace-nowrap pb-1 ${activeTab === 'analytics' ? 'text-amber-400 font-semibold border-b-2 border-amber-400' : 'text-slate-400'}`}
        >
          Statistics
        </button>
        <button
          onClick={() => setActiveTab('hq-sync')}
          className={`whitespace-nowrap pb-1 ${activeTab === 'hq-sync' ? 'text-amber-400 font-semibold border-b-2 border-amber-400' : 'text-slate-400'}`}
        >
          HQ Sync
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`whitespace-nowrap pb-1 ${activeTab === 'audit' ? 'text-amber-400 font-semibold border-b-2 border-amber-400' : 'text-slate-400'}`}
        >
          Audit
        </button>
      </div>
    </header>
  );
};
