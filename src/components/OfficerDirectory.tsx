import React, { useState, useMemo } from 'react';
import { 
  Officer, 
  Cadre, 
  CircleDefinition,
  InvestigationMetrics, 
  AsiMetrics, 
  ConstabularyMetrics, 
  NaibCourtMetrics, 
  LawBranchMetrics 
} from '../types';
import { formatPkr, formatPercent, getCadreDisplayName } from '../utils/formatters';
import { 
  Search, 
  UserPlus, 
  ChevronRight, 
  Sparkles, 
  Award, 
  ShieldAlert, 
  CheckCircle2 
} from 'lucide-react';

interface OfficerDirectoryProps {
  officers: Officer[];
  circles?: CircleDefinition[];
  onSelectOfficer: (officer: Officer) => void;
  onOpenNewOfficerModal: () => void;
  onGenerateAcr: (officer: Officer) => void;
}

export const OfficerDirectory: React.FC<OfficerDirectoryProps> = ({
  officers,
  circles,
  onSelectOfficer,
  onOpenNewOfficerModal,
  onGenerateAcr,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCadre, setSelectedCadre] = useState<Cadre | 'ALL'>('ALL');
  const [selectedCircle, setSelectedCircle] = useState<string>('ALL');

  const filteredOfficers = useMemo(() => {
    return officers.filter((officer) => {
      const matchesCadre = selectedCadre === 'ALL' || officer.cadre === selectedCadre;
      const matchesCircle = 
        selectedCircle === 'ALL' || 
        officer.circle === selectedCircle || 
        officer.circle.toLowerCase().includes(selectedCircle.toLowerCase());
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !query ||
        officer.name.toLowerCase().includes(query) ||
        officer.badgeNo.toLowerCase().includes(query) ||
        (officer.beltNo && officer.beltNo.toLowerCase().includes(query)) ||
        officer.rank.toLowerCase().includes(query) ||
        officer.circle.toLowerCase().includes(query);

      return matchesCadre && matchesCircle && matchesSearch;
    });
  }, [officers, selectedCadre, selectedCircle, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Top Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Field */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by officer name, badge #, belt #, rank, or wing..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
            />
          </div>

          {/* Wing / Circle Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCircle}
              onChange={(e) => setSelectedCircle(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="ALL">All Islamabad Circles / Wings</option>
              {circles && circles.length > 0 ? (
                circles.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))
              ) : (
                <>
                  <option value="Anti-Corruption Circle (ACC)">Anti-Corruption Circle (ACC)</option>
                  <option value="Cyber Crime Circle (CCC)">Cyber Crime Circle (CCC)</option>
                  <option value="Anti-Human Trafficking Circle (AHTC)">Anti-Human Trafficking (AHTC)</option>
                  <option value="Commercial Banking Circle (CBC)">Commercial Banking (CBC)</option>
                  <option value="Zone Legal & Prosecution Wing">Zone Legal & Prosecution Wing</option>
                </>
              )}
            </select>

            <button
              onClick={onOpenNewOfficerModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              <span>Enroll Officer</span>
            </button>
          </div>

        </div>

        {/* Cadre Segmented Filter Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-950 rounded-md border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setSelectedCadre('ALL')}
            className={`px-3 py-1.5 font-medium rounded transition-colors whitespace-nowrap ${
              selectedCadre === 'ALL'
                ? 'bg-slate-800 text-amber-400 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Personnel ({officers.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCadre('INVESTIGATION')}
            className={`px-3 py-1.5 font-medium rounded transition-colors whitespace-nowrap ${
              selectedCadre === 'INVESTIGATION'
                ? 'bg-slate-800 text-amber-400 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SI - Inspector - AD
          </button>
          <button
            type="button"
            onClick={() => setSelectedCadre('ASI')}
            className={`px-3 py-1.5 font-medium rounded transition-colors whitespace-nowrap ${
              selectedCadre === 'ASI'
                ? 'bg-slate-800 text-amber-400 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ASI Branch
          </button>
          <button
            type="button"
            onClick={() => setSelectedCadre('CONSTABULARY')}
            className={`px-3 py-1.5 font-medium rounded transition-colors whitespace-nowrap ${
              selectedCadre === 'CONSTABULARY'
                ? 'bg-slate-800 text-amber-400 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Constable - Head Constable
          </button>
          <button
            type="button"
            onClick={() => setSelectedCadre('NAIB_COURT')}
            className={`px-3 py-1.5 font-medium rounded transition-colors whitespace-nowrap ${
              selectedCadre === 'NAIB_COURT'
                ? 'bg-slate-800 text-amber-400 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Naib Court
          </button>
          <button
            type="button"
            onClick={() => setSelectedCadre('LAW_BRANCH')}
            className={`px-3 py-1.5 font-medium rounded transition-colors whitespace-nowrap ${
              selectedCadre === 'LAW_BRANCH'
                ? 'bg-slate-800 text-amber-400 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Law Branch
          </button>
        </div>
      </div>

      {/* Officers Grid */}
      {filteredOfficers.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-lg">
          <p className="text-slate-400 text-sm">No officer records found matching your filter criteria.</p>
          <button
            onClick={() => { setSelectedCadre('ALL'); setSelectedCircle('ALL'); setSearchQuery(''); }}
            className="mt-3 text-xs text-amber-400 hover:underline"
          >
            Reset filter criteria
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOfficers.map((officer) => {
            const m: any = officer.metrics;
            return (
              <div
                key={officer.id}
                className="group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg p-4 transition-all duration-150 flex flex-col justify-between cursor-pointer"
                onClick={() => onSelectOfficer(officer)}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-0.5">
                        <span>{officer.badgeNo}</span>
                        {officer.beltNo && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Belt: {officer.beltNo}</span>
                          </>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                        {officer.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                        <span className="text-amber-400 font-medium">{officer.rank}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate max-w-[150px]">{officer.circle}</span>
                      </div>
                    </div>

                    {/* Weighted Score & Grade */}
                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 font-mono block">WEIGHTED</span>
                      <span className="text-lg font-bold font-mono text-amber-400 tabular-nums">
                        {m.weightedScore ?? 70.0}
                        <span className="text-[10px] text-slate-500 font-normal"> /100</span>
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-400 block">
                        {m.overallGradeRemarks || officer.acrGrade || 'Good'}
                      </span>
                    </div>
                  </div>

                  {/* Indicators Preview Box */}
                  <div className="p-3 bg-slate-950/80 rounded border border-slate-850 text-xs mb-3 space-y-2">
                    
                    {/* Cadre-Specific Highlights */}
                    {officer.cadre === 'INVESTIGATION' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-500 block text-[11px]">Disposal Rate</span>
                          <span className="font-mono text-emerald-400 font-semibold tabular-nums">
                            {formatPercent(m.disposalRate)} ({m.enquiriesClosed}/{m.enquiriesAssigned})
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Challan Rate</span>
                          <span className="font-mono text-cyan-400 font-semibold tabular-nums">
                            {formatPercent(m.challanRate)} ({m.challansSubmitted}/{m.casesFirRegistered})
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Conviction Rate</span>
                          <span className="font-mono text-purple-400 font-semibold tabular-nums">
                            {formatPercent(m.convictionRate)} ({m.convictionsObtained}/{m.casesDecidedInCourt})
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Total Recoveries</span>
                          <span className="font-mono text-amber-300 font-semibold tabular-nums">
                            {formatPkr(m.totalRecoveriesPkr)}
                          </span>
                        </div>
                      </div>
                    )}

                    {officer.cadre === 'ASI' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-500 block text-[11px]">Verifications Disposed</span>
                          <span className="font-mono text-emerald-400 font-semibold tabular-nums">
                            {formatPercent(m.disposalRate)} ({m.verificationsDisposedOff}/{m.verificationsEntrusted})
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Conversion Rate</span>
                          <span className="font-mono text-amber-400 font-semibold tabular-nums">
                            {formatPercent(m.conversionRate)} ({m.convertedIntoEnquiries} files)
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-500 block text-[11px]">Weapon Handling</span>
                          <span className="text-slate-200 font-medium">
                            {m.weaponHandlingSkill} ({m.weaponHandlingScore ?? 3}/5)
                          </span>
                        </div>
                      </div>
                    )}

                    {officer.cadre === 'CONSTABULARY' && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 text-[11px]">Task Execution:</span>
                          <span className="font-mono text-emerald-400 font-semibold">
                            {formatPercent(m.taskCompletionRate)} ({m.tasksCompleted}/{m.tasksAssigned})
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-850">
                          <div>
                            <span className="text-slate-500 text-[11px] block">Raids / Additional</span>
                            <span className="font-mono text-amber-400 font-semibold tabular-nums">
                              {m.raidsConducted} Raids / {m.hoursOnAdditionalDuty}h
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[11px] block">Discipline</span>
                            <span className="font-semibold text-emerald-400">{m.discipline}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {officer.cadre === 'NAIB_COURT' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-500 block text-[11px]">Summons Executed</span>
                          <span className="font-mono text-emerald-400 font-semibold tabular-nums">
                            {m.totalSummonsExecuted} (Pending: {m.pendingSummons})
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Execution Rate</span>
                          <span className="font-mono text-cyan-400 font-semibold tabular-nums">
                            {formatPercent(m.executionRate)}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-500 block text-[11px]">Officer Coordination</span>
                          <span className="text-slate-200 font-medium">
                            {m.coordinationWithOfficers} ({m.coordinationScore ?? 3}/5)
                          </span>
                        </div>
                      </div>
                    )}

                    {officer.cadre === 'LAW_BRANCH' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-500 block text-[11px]">Legal Opinions</span>
                          <span className="font-mono text-cyan-400 font-semibold tabular-nums">
                            {m.filesWithLegalOpinionRendered}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Conviction Rate</span>
                          <span className="font-mono text-emerald-400 font-semibold tabular-nums">
                            {formatPercent(m.convictionRate)} ({m.totalConvictions}/{m.casesContestedInCourt})
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Court Hours</span>
                          <span className="font-mono text-amber-400 tabular-nums">
                            {m.hoursSpentInCourt} hrs
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">High Profile</span>
                          <span className="font-semibold text-purple-400">
                            {m.anyHighProfileCase}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Conduct & Recognition Index Footer */}
                    <div className="pt-1.5 border-t border-slate-850 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Conduct Index:</span>
                      <span className="font-mono font-semibold text-cyan-400">
                        {m.conductRecognitionIndex ?? 70}/100
                      </span>
                      <span className="text-slate-500">
                        Apprec: <strong className="text-emerald-400">{m.appreciationsReceived || 0}</strong> | Showcause: <strong className="text-rose-400">{m.violationsShowcausesIssued || 0}</strong>
                      </span>
                    </div>

                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {officer.status}
                  </span>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onGenerateAcr(officer)}
                      className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                      title="Generate AI ACR Dossier"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectOfficer(officer)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors text-xs font-medium"
                    >
                      <span>Update & Inspect</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
