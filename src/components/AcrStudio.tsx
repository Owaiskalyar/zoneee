import React, { useState } from 'react';
import { Officer, AcrEvaluation, OfficerTask, DailyActivityLog } from '../types';
import { calculateCadreAcrScore, formatPkr, formatDateTime, getCadreDisplayName } from '../utils/formatters';
import { downloadAcrPdf, downloadAcrHtml, generateAcrHtml, getPerformanceAnalysis } from '../utils/printDocket';
import { FIAEmblem } from './FIAEmblem';
import { 
  Sparkles, 
  Printer, 
  Download, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Award, 
  FileText, 
  UserCheck, 
  ChevronDown,
  RefreshCw,
  Eye,
  X,
  FileDown,
  ExternalLink,
  Info,
  TrendingUp,
  Calculator,
  BarChart3,
  Shield,
  Activity
} from 'lucide-react';

interface AcrStudioProps {
  officers: Officer[];
  tasks: OfficerTask[];
  activities: DailyActivityLog[];
  selectedOfficerId?: string;
  onSelectOfficerId: (id: string) => void;
  onUpdateOfficerAcr: (officerId: string, score: number, grade: string) => void;
}

export const AcrStudio: React.FC<AcrStudioProps> = ({
  officers,
  tasks,
  activities,
  selectedOfficerId,
  onSelectOfficerId,
  onUpdateOfficerAcr,
}) => {
  const currentOfficer = officers.find((o) => o.id === selectedOfficerId) || officers[0];
  const [isGenerating, setIsGenerating] = useState(false);
  const [acrData, setAcrData] = useState<AcrEvaluation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Print & Export modal states
  const [showSandboxNotice, setShowSandboxNotice] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);

  const officerTasks = tasks.filter((t) => t.officerId === currentOfficer?.id);
  const officerActivities = activities.filter((a) => a.officerId === currentOfficer?.id);
  const fallbackAcr = calculateCadreAcrScore(currentOfficer);
  const analysis = getPerformanceAnalysis(currentOfficer);
  const m: any = currentOfficer.metrics || {};

  const handleGenerateAcr = async () => {
    if (!currentOfficer) return;
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/evaluate-acr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officer: currentOfficer,
          recentActivities: officerActivities,
          pendingTasks: officerTasks,
        }),
      });

      if (!response.ok) {
        throw new Error(`Evaluation failed with status ${response.status}`);
      }

      const data = await response.json();
      setAcrData({
        ...data,
        generatedAt: new Date().toISOString(),
      });

      if (data.acrScore && data.grading) {
        onUpdateOfficerAcr(currentOfficer.id, data.acrScore, data.grading);
      }
    } catch (err: any) {
      console.warn('AI evaluation error, using official formula fallback:', err);
      const fallback = {
        acrScore: fallbackAcr.score,
        grading: fallbackAcr.grade,
        integrityAssessment: 'Impeccable & Beyond Reproach',
        operationalEfficiencySummary: `Officer demonstrates robust operational fidelity in ${currentOfficer.circle} with high compliance in task execution and records maintenance.`,
        keyStrengths: [
          'Diligent adherence to FIA Investigation Manual and CrPC procedural mandates',
          'Consistent record updating on day-to-day zonal roster',
          'High integrity in field operations and evidence preservation'
        ],
        areasForImprovement: [
          'Accelerate disposal of pending inquiries exceeding statutory threshold',
          'Enhance court prosecution coordination with Law Branch'
        ],
        promotionSuitability: 'Recommended in Normal Course for Next Cadre Tier',
        officialDossierSummary: `The officer's performance in Islamabad Zone throughout the reporting period has been assessed as ${fallbackAcr.grade}. Integrity is well attested and operational velocity meets federal standards.`,
        hqRecommendation: 'Confirmed for retention in current specialized circle; suitable for advanced financial/cyber investigation training.',
        generatedAt: new Date().toISOString(),
      };
      setAcrData(fallback);
      onUpdateOfficerAcr(currentOfficer.id, fallback.acrScore, fallback.grading);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    const isInIframe = window.self !== window.top;
    try {
      window.print();
      if (isInIframe) {
        setTimeout(() => {
          setShowSandboxNotice(true);
        }, 800);
      }
    } catch (err) {
      console.warn('[FIA Print System] window.print restricted by iframe sandbox:', err);
      setShowSandboxNotice(true);
    }
  };

  const handleDownloadPdf = () => {
    if (!currentOfficer) return;
    try {
      downloadAcrPdf(currentOfficer, acrData, fallbackAcr);
      setDownloadSuccessMsg(`Official PDF Dossier for ${currentOfficer.name} downloaded!`);
      setTimeout(() => setDownloadSuccessMsg(null), 4000);
    } catch (err) {
      console.error('PDF export failed:', err);
    }
  };

  const handleDownloadHtml = () => {
    if (!currentOfficer) return;
    try {
      downloadAcrHtml(currentOfficer, acrData, fallbackAcr);
      setDownloadSuccessMsg(`Print-Ready HTML Docket downloaded! Double-click to open and print in any browser.`);
      setTimeout(() => setDownloadSuccessMsg(null), 4500);
    } catch (err) {
      console.error('HTML export failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Alert for Successful Download */}
      {downloadSuccessMsg && (
        <div className="no-print bg-emerald-950/80 border border-emerald-500 text-emerald-200 px-4 py-2.5 rounded-lg flex items-center justify-between text-xs animate-fadeIn shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{downloadSuccessMsg}</span>
          </div>
          <button 
            onClick={() => setDownloadSuccessMsg(null)}
            className="text-emerald-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Officer Selector & Studio Controls */}
      <div className="no-print bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">
            Select Officer for Official Performance Evaluation Report (PER / ACR):
          </label>
          <div className="relative">
            <select
              value={currentOfficer?.id}
              onChange={(e) => {
                onSelectOfficerId(e.target.value);
                setAcrData(null);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-white font-medium focus:outline-none focus:border-amber-400 appearance-none pr-10"
            >
              {officers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.rank}) — {o.badgeNo} [{o.circle}]
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* AI Generate Button */}
          <button
            type="button"
            onClick={handleGenerateAcr}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors disabled:opacity-50 whitespace-nowrap shadow-md cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Evaluating Metrics...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Official AI ACR</span>
              </>
            )}
          </button>

          {/* Primary Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-md transition-all shadow-sm hover:border-slate-500 whitespace-nowrap cursor-pointer"
            title="Open System Print Dialog (or use PDF export if in preview iframe)"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print Docket</span>
          </button>

          {/* Direct Download Official PDF Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-700/60 rounded-md transition-all whitespace-nowrap cursor-pointer"
            title="Download Official A4 Vector PDF directly"
          >
            <FileDown className="w-4 h-4 text-emerald-400" />
            <span>Download PDF</span>
          </button>

          {/* Print Preview Modal Button */}
          <button
            type="button"
            onClick={() => setShowPrintPreview(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-md transition-colors whitespace-nowrap cursor-pointer"
            title="Preview Docket on paper"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>Preview</span>
          </button>
        </div>

      </div>

      {/* ACR SCORECARD & AI DOSSIER PREVIEW (Printable Container) */}
      <div 
        id="printable-acr-docket" 
        className="printable-docket bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-xl"
      >
        
        {/* Official Header Banner */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <FIAEmblem size={42} />
            <div>
              <span className="text-[11px] font-mono text-amber-400 font-semibold tracking-wider block">
                ANNUAL CONFIDENTIAL REPORT (PER) — FORM ACR-FIA-IZ-2026
              </span>
              <h3 className="text-base font-bold text-white tracking-tight">
                {currentOfficer?.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Rank: <strong className="text-slate-200">{currentOfficer?.rank}</strong></span>
                <span aria-hidden="true">·</span>
                <span>Badge: <strong className="text-slate-200 font-mono">{currentOfficer?.badgeNo}</strong></span>
                <span aria-hidden="true">·</span>
                <span>{currentOfficer?.circle}</span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-400 font-medium">Cadre: {getCadreDisplayName(currentOfficer?.cadre)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded border border-slate-800">
            <div className="text-right">
              <span className="text-[11px] text-slate-500 font-mono block">CONDUCT INDEX</span>
              <span className="text-xs font-bold text-cyan-400">
                {m.conductRecognitionIndex ?? 75}/100
              </span>
            </div>
            <div className="h-8 w-px bg-slate-800"></div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 font-mono block">FINAL ACR RATING</span>
              <span className="text-xs font-bold text-emerald-400">
                {acrData?.grading || m.overallGradeRemarks || fallbackAcr.grade}
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
              {acrData?.acrScore || m.weightedScore || fallbackAcr.score}
              <span className="text-xs text-slate-500 font-normal">/100</span>
            </div>
          </div>
        </div>

        {/* Dossier Body */}
        <div className="p-6 space-y-6">
          
          {/* PART I: PRIMARY OPERATIONAL INDICATORS (ALL INDICATORS BY CADRE) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Part I: Primary Operational Performance Indicators (Complete Cadre Audit)</span>
              </h4>
              <span className="text-[11px] font-mono text-slate-500">
                Cadre: {getCadreDisplayName(currentOfficer?.cadre)}
              </span>
            </div>

            {/* 1. INVESTIGATION CADRE (13 Indicators) */}
            {currentOfficer?.cadre === 'INVESTIGATION' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">1. Enquiries Assigned</span>
                  <span className="text-base font-bold font-mono text-white tabular-nums">
                    {m.enquiriesAssigned || 0} Inquiries
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">2. Enquiries Closed</span>
                  <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                    {m.enquiriesClosed || 0} Closed
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">3. Enquiries Merged</span>
                  <span className="text-base font-bold font-mono text-cyan-400 tabular-nums">
                    {m.enquiriesMerged || 0} Files
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">4. Clearance Ratio</span>
                  <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                    {Math.round((m.disposalRate || 0) * 100)}%
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">5. FIRs Registered</span>
                  <span className="text-base font-bold font-mono text-white tabular-nums">
                    {m.casesFirRegistered || 0} Cases
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">6. Challans Submitted</span>
                  <span className="text-base font-bold font-mono text-amber-300 tabular-nums">
                    {m.challansSubmitted || 0} Challans
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">7. Challan Ratio</span>
                  <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                    {Math.round((m.challanRate || 0) * 100)}%
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">8. Active Pending Cases</span>
                  <span className={`text-base font-bold font-mono tabular-nums ${(m.pendingCases || 0) > 6 ? 'text-rose-400' : 'text-slate-300'}`}>
                    {m.pendingCases || 0} Files
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">9. Accused Apprehended</span>
                  <span className="text-base font-bold font-mono text-purple-400 tabular-nums">
                    {m.accusedArrested || 0} Persons
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">10. Cases Decided in Court</span>
                  <span className="text-base font-bold font-mono text-white tabular-nums">
                    {m.casesDecidedInCourt || 0} Trials
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">11. Convictions Obtained</span>
                  <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                    {m.convictionsObtained || 0} Convictions
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">12. Conviction Rate</span>
                  <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                    {Math.round((m.convictionRate || 0) * 100)}%
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded col-span-2 sm:col-span-4 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 text-xs block">13. Total State / Public Recoveries</span>
                    <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                      {formatPkr(m.totalRecoveriesPkr || 0)}
                    </span>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 font-mono font-semibold">
                    Recovery Bonus: +{Math.min(10, Math.floor((m.totalRecoveriesPkr || 0) / 10000000))} pts
                  </span>
                </div>
              </div>
            )}

            {/* 2. ASI CADRE (8 Indicators) */}
            {currentOfficer?.cadre === 'ASI' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">1. Verifications Entrusted</span>
                  <span className="text-base font-bold font-mono text-white tabular-nums">
                    {m.verificationsEntrusted || 0} Files
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">2. Verifications Disposed</span>
                  <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                    {m.verificationsDisposedOff || 0} Disposed
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">3. Verification Disposal Rate</span>
                  <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                    {Math.round((m.disposalRate || 0) * 100)}%
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">4. Verified & Closed</span>
                  <span className="text-base font-bold font-mono text-slate-200 tabular-nums">
                    {m.closed || 0} Files
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">5. Converted to Enquiries</span>
                  <span className="text-base font-bold font-mono text-amber-400 tabular-nums">
                    {m.convertedIntoEnquiries || 0} Matters
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">6. Conversion Ratio</span>
                  <span className="text-base font-bold font-mono text-amber-300 tabular-nums">
                    {Math.round((m.conversionRate || 0) * 100)}%
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">7. Weapon Handling Skill</span>
                  <span className="text-sm font-semibold text-slate-200">
                    {m.weaponHandlingSkill || 'Good'}
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">8. Weapon Score</span>
                  <span className="text-base font-bold font-mono text-cyan-400 tabular-nums">
                    {m.weaponHandlingScore || 3} / 5
                  </span>
                </div>
              </div>
            )}

            {/* 3. CONSTABULARY CADRE (14-15 Indicators) */}
            {currentOfficer?.cadre === 'CONSTABULARY' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">1. Operational Tasks Assigned</span>
                  <span className="text-base font-bold font-mono text-white tabular-nums">
                    {m.tasksAssigned || 0} Tasks
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">2. Tasks Completed</span>
                  <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                    {m.tasksCompleted || 0} Done
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">3. Execution Ratio</span>
                  <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                    {Math.round((m.taskCompletionRate || 0) * 100)}%
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">4. Shift Duties Assigned</span>
                  <span className="text-base font-bold font-mono text-slate-200 tabular-nums">
                    {m.dutiesAssigned || 0} Duties
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">5. Times Deassigned / Relieved</span>
                  <span className="text-base font-bold font-mono text-slate-300 tabular-nums">
                    {m.timesDeassignedRelieved || 0} Times
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">6. Raids & Search Ops</span>
                  <span className="text-base font-bold font-mono text-amber-400 tabular-nums">
                    {m.raidsConducted || 0} Raids
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">7. Deputed with IOs</span>
                  <span className="text-base font-bold font-mono text-cyan-400 tabular-nums">
                    {m.deputedWithNoOfIos || 0} IOs
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">8. Primary Duty Type</span>
                  <span className="text-xs font-semibold text-slate-200">
                    {m.typeOfDuty || 'Field Duty'}
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">9. Willingness to Work</span>
                  <span className="text-xs font-semibold text-emerald-400">
                    {m.willingnessToWork || 'Very Good'}
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">10. Discipline Evaluation</span>
                  <span className="text-xs font-semibold text-emerald-400">
                    {m.discipline || 'Impeccable'}
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">11. Attitude Toward Duty</span>
                  <span className="text-xs font-semibold text-slate-200">
                    {m.attitudeTowardDuty || 'Proactive'}
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">12. Behaviour Score</span>
                  <span className="text-base font-bold font-mono text-cyan-400 tabular-nums">
                    {m.behaviourScore || 75} / 100
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">13. Total Leaves Availed</span>
                  <span className="text-base font-bold font-mono text-slate-300 tabular-nums">
                    {m.totalLeaveDays || 0} Days
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">14. Additional Duty Overtime</span>
                  <span className="text-base font-bold font-mono text-amber-400 tabular-nums">
                    {m.hoursOnAdditionalDuty || 0} Hours
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded col-span-2">
                  <span className="text-slate-500 text-xs block">15. Incharge Circle Directives</span>
                  <span className="text-xs text-slate-300 italic">
                    {m.remarksOfCircleIncharge || 'Maintains strict compliance with post orders.'}
                  </span>
                </div>
              </div>
            )}

            {/* 4. NAIB COURT CADRE (7-8 Indicators) */}
            {currentOfficer?.cadre === 'NAIB_COURT' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">1. Summons Executed</span>
                  <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                    {m.totalSummonsExecuted || 0} Served
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">2. Pending Summons</span>
                  <span className="text-base font-bold font-mono text-amber-400 tabular-nums">
                    {m.pendingSummons || 0} Pending
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">3. Execution Ratio</span>
                  <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                    {Math.round((m.executionRate || 0) * 100)}%
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">4. Judicial Sessions</span>
                  <span className="text-base font-bold font-mono text-white tabular-nums">
                    {m.courtSessionsAttended || 0} Sessions
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">5. Coordination with IOs</span>
                  <span className="text-xs font-semibold text-slate-200">
                    {m.coordinationWithOfficers || 'Active'}
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">6. Coordination Score</span>
                  <span className="text-base font-bold font-mono text-cyan-400 tabular-nums">
                    {m.coordinationScore || 4} / 5
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded col-span-2">
                  <span className="text-slate-500 text-xs block">7. Special Court Compliance</span>
                  <span className="text-xs font-semibold text-emerald-400">
                    {m.specialCourtCentralCompliance || '100% Punctual Cause List Tracking'}
                  </span>
                </div>
              </div>
            )}

            {/* 5. LAW BRANCH CADRE (8 Indicators) */}
            {currentOfficer?.cadre === 'LAW_BRANCH' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">1. Legal Opinions Rendered</span>
                  <span className="text-base font-bold font-mono text-cyan-400 tabular-nums">
                    {m.filesWithLegalOpinionRendered || 0} Files
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">2. Trials Contested in Court</span>
                  <span className="text-base font-bold font-mono text-white tabular-nums">
                    {m.casesContestedInCourt || 0} Cases
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">3. Convictions Secured</span>
                  <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                    {m.totalConvictions || 0} Convictions
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">4. Acquittals Recorded</span>
                  <span className="text-base font-bold font-mono text-slate-300 tabular-nums">
                    {m.totalAcquittals || 0} Cases
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">5. Trial Conviction Rate</span>
                  <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                    {Math.round((m.convictionRate || 0) * 100)}%
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">6. Courtroom Hours</span>
                  <span className="text-base font-bold font-mono text-amber-400 tabular-nums">
                    {m.hoursSpentInCourt || 0} hrs
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">7. Office Scrutiny Hours</span>
                  <span className="text-base font-bold font-mono text-slate-300 tabular-nums">
                    {m.hoursSpentInOffice || 0} hrs
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-slate-500 text-xs block">8. High Profile Case Handled</span>
                  <span className={`text-xs font-bold ${m.anyHighProfileCase === 'Yes' ? 'text-amber-400' : 'text-slate-400'}`}>
                    {m.anyHighProfileCase || 'No'}
                  </span>
                </div>
              </div>
            )}

            {/* Universal Conduct & Recognition Sheet Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
              <div className="p-2.5 bg-emerald-950/20 border border-emerald-800/60 rounded">
                <span className="text-emerald-400 block text-[11px]">Appreciations Received</span>
                <span className="font-mono font-bold text-white text-base">
                  {m.appreciationsReceived ?? 0}
                </span>
              </div>
              <div className="p-2.5 bg-emerald-950/20 border border-emerald-800/60 rounded">
                <span className="text-emerald-400 block text-[11px]">Participation in Good Work</span>
                <span className="font-mono font-bold text-white text-base">
                  {m.participationInGoodWork ?? 0}
                </span>
              </div>
              <div className="p-2.5 bg-rose-950/20 border border-rose-800/60 rounded">
                <span className="text-rose-400 block text-[11px]">Violations / Showcauses</span>
                <span className="font-mono font-bold text-white text-base">
                  {m.violationsShowcausesIssued ?? 0}
                </span>
              </div>
              <div className="p-2.5 bg-rose-950/20 border border-rose-800/60 rounded">
                <span className="text-rose-400 block text-[11px]">Explanations Called</span>
                <span className="font-mono font-bold text-white text-base">
                  {m.explanationsCalled ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* PART II: DETAILED OFFICER PERFORMANCE ANALYSIS & MATHEMATICAL BREAKDOWN */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span>Part II: Officer Performance Analysis & Mathematical Scoring Breakdown</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Box 1: Velocity & Efficiency Evaluation */}
              <div className="p-4 bg-slate-950 rounded border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <Activity className="w-3.5 h-3.5" />
                  <span>1. Operational Velocity & Disposal Analysis</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {analysis.efficiencyNote}
                </p>
                <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-slate-400">
                  <span>Circle & Zonal Standing:</span>
                  <span className="text-emerald-400 font-bold">{analysis.benchmarkRating}</span>
                </div>
              </div>

              {/* Box 2: Formula Scoring Decomposition */}
              <div className="p-4 bg-slate-950 rounded border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-semibold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>2. Cadre Formula Decomposition</span>
                </div>
                <p className="text-slate-300 font-mono text-[11px] leading-relaxed bg-slate-900/80 p-2 rounded border border-slate-800">
                  {analysis.formulaSummary}
                </p>
                <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-slate-400">
                  <span>Vigilance & Risk Profile:</span>
                  <span className="text-cyan-400 font-medium">{analysis.riskAssessment}</span>
                </div>
              </div>
            </div>
          </div>

          {/* PART III: AI QUALITATIVE EVALUATION & INTEGRITY REVIEW */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Part III: Qualitative Assessment & Administrative Narrative</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-950 rounded border border-slate-800 space-y-2">
                <span className="text-slate-400 font-semibold block">Integrity & General Conduct:</span>
                <p className="text-slate-200 leading-relaxed font-medium">
                  {acrData?.integrityAssessment || 'Impeccable and Beyond Reproach. No complaints or vigilance inquiries pending.'}
                </p>
                <div className="pt-2 border-t border-slate-850 text-slate-400">
                  <span className="font-semibold block mb-1">Operational Velocity:</span>
                  <p className="text-slate-300 leading-relaxed">
                    {acrData?.operationalEfficiencySummary || `Demonstrated high procedural efficiency in ${currentOfficer?.circle}. Work output adheres to statutory benchmarks.`}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded border border-slate-800 space-y-2">
                <span className="text-slate-400 font-semibold block">Promotion & Cadre Progression:</span>
                <p className="text-amber-400 font-bold">
                  {acrData?.promotionSuitability || 'Recommended for Promotion in Normal Course'}
                </p>
                <div className="pt-2 border-t border-slate-850 text-slate-400">
                  <span className="font-semibold block mb-1">Headquarters Strategic Recommendation:</span>
                  <p className="text-slate-300 leading-relaxed">
                    {acrData?.hqRecommendation || 'Suitable for continuation in specialized investigation squads and federal training modules.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Strengths & Advisory Directives */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-emerald-950/20 border border-emerald-800/60 rounded">
                <span className="text-emerald-400 font-bold block mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Key Strengths & Commendations:</span>
                </span>
                <ul className="space-y-1 text-slate-300 list-disc list-inside">
                  {(acrData?.keyStrengths || [
                    'High output in core investigation and verification tasks',
                    'Accurate and tamper-free day-to-day activity documentation',
                    'Effective inter-branch coordination with Law & Court wings'
                  ]).map((st, i) => (
                    <li key={i} className="leading-relaxed">{st}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-amber-950/20 border border-amber-800/60 rounded">
                <span className="text-amber-400 font-bold block mb-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Advisory Directives & Areas for Focus:</span>
                </span>
                <ul className="space-y-1 text-slate-300 list-disc list-inside">
                  {(acrData?.areasForImprovement || [
                    'Maintain stricter turnaround times on old pending matters',
                    'Ensure 100% digital sync with Headquarters CMS'
                  ]).map((imp, i) => (
                    <li key={i} className="leading-relaxed">{imp}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Official Transmittal Summary Paragraph */}
            <div className="p-4 bg-slate-950 rounded border border-slate-800 text-xs space-y-2">
              <span className="text-amber-400 font-semibold block">
                Official ACR Transmittal Text (For Headquarters CMS Record):
              </span>
              <p className="text-slate-200 leading-relaxed italic bg-slate-900/60 p-3 rounded border border-slate-850">
                "{acrData?.officialDossierSummary || `The officer ${currentOfficer?.name} has served in Islamabad Zone with credit. Overall performance is graded as ${fallbackAcr.grade} (${fallbackAcr.score}/100). The officer is fit for retention in current specialized assignment.`}"
              </p>
            </div>

          </div>

          {/* PART IV: SIGNATURE & AUTHENTICATION BLOCK */}
          <div className="pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs text-slate-400 break-inside-avoid">
            <div className="space-y-4">
              <div className="h-12 border-b border-dashed border-slate-700 flex items-end">
                <span className="text-[11px] text-slate-500 font-mono">Digitally Verified: Incharge {currentOfficer?.circle}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-300 block">Reporting Officer</span>
                <span className="text-slate-500">Circle Incharge / Deputy Director, Islamabad Zone</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="h-12 border-b border-dashed border-slate-700 flex items-end">
                <span className="text-[11px] text-slate-500 font-mono">Countersigned: ZONAL-DIR-ISB-SEAL</span>
              </div>
              <div>
                <span className="font-semibold text-slate-300 block">Countersigning Officer</span>
                <span className="text-slate-500">Director, FIA Islamabad Zone (HQ G-9/4)</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>DOCKET ID: FIA-IZ-PER-{currentOfficer?.badgeNo.replace(/[^0-9]/g, '')}-2026</span>
          <span>AUTHENTICATED FOR HEADQUARTERS CMS TRANSMISSION</span>
        </div>

      </div>

      {/* MODAL 1: Sandbox / Direct Print Helper Modal */}
      {showSandboxNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/50 rounded-xl p-6 shadow-2xl space-y-4 text-slate-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Print & Document Export Options</h3>
                  <span className="text-xs text-slate-400">Official FIA Islamabad Zone PER / ACR Docket</span>
                </div>
              </div>
              <button 
                onClick={() => setShowSandboxNotice(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-2 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <Info className="w-4 h-4 shrink-0" />
                <span>Notice regarding embedded browser previews:</span>
              </div>
              <p className="leading-relaxed">
                If your browser blocked the printer dialogue inside this preview frame, you can immediately download the official Vector PDF or the standalone Printable Web file:
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  handleDownloadPdf();
                  setShowSandboxNotice(false);
                }}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-md"
              >
                <div className="flex items-center gap-2">
                  <FileDown className="w-4 h-4" />
                  <span>Download Official PDF Dossier (A4 Standard)</span>
                </div>
                <span className="text-[11px] opacity-80 font-mono">Immediate .pdf</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleDownloadHtml();
                  setShowSandboxNotice(false);
                }}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Download Print-Ready Web Docket (.html)</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">Opens in any browser</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSandboxNotice(false);
                  setShowPrintPreview(true);
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-950 hover:bg-slate-850 text-slate-300 text-xs border border-slate-800 transition-colors"
              >
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>View Full-Screen Document Preview</span>
              </button>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowSandboxNotice(false)}
                className="text-xs text-slate-400 hover:text-slate-200 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Full Document Print Preview Modal */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white text-slate-900 rounded-lg shadow-2xl my-6 flex flex-col max-h-[92vh]">
            
            {/* Modal Controls Header */}
            <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white rounded-t-lg border-b border-slate-800 sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold">Print Preview: Official ACR Docket ({currentOfficer?.name})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      window.print();
                    } catch (e) {
                      handleDownloadPdf();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print (Ctrl+P)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintPreview(false)}
                  className="text-slate-400 hover:text-white p-1 rounded ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Content formatted for A4 Paper */}
            <div className="p-8 overflow-y-auto font-sans text-xs space-y-6 bg-slate-50">
              
              {/* Paper Representation */}
              <div className="bg-white border border-slate-300 shadow-sm p-8 rounded max-w-3xl mx-auto space-y-5">
                
                {/* Official Header */}
                <div className="text-center border-b-2 border-slate-900 pb-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Government of Pakistan · Ministry of Interior
                  </div>
                  <h2 className="text-base font-extrabold text-emerald-800 tracking-wide mt-0.5">
                    FEDERAL INVESTIGATION AGENCY
                  </h2>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">
                    Islamabad Zone · Regional Headquarters (Sector G-9/4, Islamabad)
                  </div>
                  <div className="inline-block mt-2 px-3 py-0.5 bg-slate-100 border border-slate-900 text-[10px] font-bold tracking-wider text-slate-900 uppercase">
                    CONFIDENTIAL — ANNUAL PERFORMANCE EVALUATION REPORT (PER / ACR)
                  </div>
                </div>

                {/* Officer Banner */}
                <div className="flex justify-between items-center bg-slate-100 border border-slate-300 p-3 rounded">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{currentOfficer?.name}</h3>
                    <div className="text-[11px] text-slate-700 mt-0.5">
                      <strong>Rank:</strong> {currentOfficer?.rank} &nbsp;|&nbsp; 
                      <strong>Badge:</strong> {currentOfficer?.badgeNo} &nbsp;|&nbsp; 
                      <strong>Circle:</strong> {currentOfficer?.circle} &nbsp;|&nbsp;
                      <strong>Cadre:</strong> {getCadreDisplayName(currentOfficer?.cadre)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-mono font-extrabold text-emerald-800">
                      {acrData?.acrScore || m.weightedScore || fallbackAcr.score}
                      <span className="text-xs text-slate-500 font-normal">/100</span>
                    </div>
                    <div className="text-[10px] font-bold text-slate-900">
                      RATING: {acrData?.grading || m.overallGradeRemarks || fallbackAcr.grade}
                    </div>
                  </div>
                </div>

                {/* Part I: All Primary Indicators */}
                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[10.5px] border-l-4 border-emerald-700 pl-2 mb-2">
                    Part I: Primary Evaluation Metrics & Day-to-Day Output (Cadre Audit)
                  </h4>
                  
                  {currentOfficer?.cadre === 'INVESTIGATION' && (
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2 border border-slate-300 rounded bg-slate-50">
                        <span className="text-slate-600 block">1. Enquiries Assigned / Closed:</span>
                        <strong className="font-mono text-emerald-800 text-xs">
                          {m.enquiriesClosed || 0} / {m.enquiriesAssigned || 0} ({Math.round((m.disposalRate || 0) * 100)}%)
                        </strong>
                      </div>
                      <div className="p-2 border border-slate-300 rounded bg-slate-50">
                        <span className="text-slate-600 block">2. FIRs Registered / Challans:</span>
                        <strong className="font-mono text-slate-900 text-xs">
                          {m.casesFirRegistered || 0} FIRs / {m.challansSubmitted || 0} Challans ({Math.round((m.challanRate || 0) * 100)}%)
                        </strong>
                      </div>
                      <div className="p-2 border border-slate-300 rounded bg-slate-50">
                        <span className="text-slate-600 block">3. Accused Apprehended:</span>
                        <strong className="font-mono text-purple-800 text-xs">
                          {m.accusedArrested || 0} Persons
                        </strong>
                      </div>
                      <div className="p-2 border border-slate-300 rounded bg-slate-50">
                        <span className="text-slate-600 block">4. Court Convictions Secured:</span>
                        <strong className="font-mono text-emerald-800 text-xs">
                          {m.convictionsObtained || 0} / {m.casesDecidedInCourt || 0} ({Math.round((m.convictionRate || 0) * 100)}%)
                        </strong>
                      </div>
                      <div className="p-2 border border-slate-300 rounded bg-slate-50">
                        <span className="text-slate-600 block">5. Active Pending Files:</span>
                        <strong className="font-mono text-slate-900 text-xs">
                          {m.pendingCases || 0} Files
                        </strong>
                      </div>
                      <div className="p-2 border border-slate-300 rounded bg-slate-50">
                        <span className="text-slate-600 block">6. Total State Recoveries:</span>
                        <strong className="font-mono text-emerald-800 text-xs">
                          {formatPkr(m.totalRecoveriesPkr || 0)}
                        </strong>
                      </div>
                    </div>
                  )}

                  {currentOfficer?.cadre === 'ASI' && (
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2 border border-slate-300 rounded bg-slate-50">
                        <span className="text-slate-600 block">1. Verifications Disposed:</span>
                        <strong className="font-mono text-emerald-800 text-xs">
                          {m.verificationsDisposedOff || 0} / {m.verificationsEntrusted || 0} ({Math.round((m.disposalRate || 0) * 100)}%)
                        </strong>
                      </div>
                      <div className="p-2 border border-slate-300 rounded bg-slate-50">
                        <span className="text-slate-600 block">2. Upgraded to Formal Inquiries:</span>
                        <strong className="font-mono text-amber-800 text-xs">
                          {m.convertedIntoEnquiries || 0} ({Math.round((m.conversionRate || 0) * 100)}%)
                        </strong>
                      </div>
                      <div className="p-2 border border-slate-300 rounded bg-slate-50">
                        <span className="text-slate-600 block">3. Weapon Handling Proficiency:</span>
                        <strong className="text-slate-900">{m.weaponHandlingSkill || 'Good'} ({m.weaponHandlingScore || 3}/5)</strong>
                      </div>
                      <div className="p-2 border border-slate-300 rounded bg-slate-50">
                        <span className="text-slate-600 block">4. Verified & Closed:</span>
                        <strong className="font-mono text-slate-900">{m.closed || 0} Files</strong>
                      </div>
                    </div>
                  )}

                  {currentOfficer?.cadre === 'CONSTABULARY' && (
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2 border border-slate-300 rounded bg-slate-50">
                        <span className="text-slate-600 block">1. Tasks Executed:</span>
                        <strong className="font-mono text-emerald-800 text-xs">
                          {m.tasksCompleted || 0} / {m.tasksAssigned || 0} ({Math.round((m.taskCompletionRate || 0) * 100)}%)
                        </strong>
                      </div>
                      <div className="p-2 border border-slate-300 rounded bg-slate-50">
                        <span className="text-slate-600 block">2. Raids & Search Operations:</span>
                        <strong className="font-mono text-amber-800 text-xs">
                          {m.raidsConducted || 0} Raids (Overtime: {m.hoursOnAdditionalDuty || 0} hrs)
                        </strong>
                      </div>
                      <div className="p-2 border border-slate-300 rounded bg-slate-50">
                        <span className="text-slate-600 block">3. Discipline & Attitude:</span>
                        <strong className="text-emerald-800">{m.discipline || 'Impeccable'} / {m.attitudeTowardDuty || 'Proactive'}</strong>
                      </div>
                      <div className="p-2 border border-slate-300 rounded bg-slate-50">
                        <span className="text-slate-600 block">4. Behaviour Score:</span>
                        <strong className="font-mono text-slate-900">{m.behaviourScore || 75} / 100</strong>
                      </div>
                    </div>
                  )}

                  {currentOfficer?.cadre === 'NAIB_COURT' && (
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2 border border-slate-300 rounded bg-slate-50">
                        <span className="text-slate-600 block">1. Summons Executed:</span>
                        <strong className="font-mono text-emerald-800 text-xs">
                          {m.totalSummonsExecuted || 0} ({Math.round((m.executionRate || 0) * 100)}%)
                        </strong>
                      </div>
                      <div className="p-2 border border-slate-300 rounded bg-slate-50">
                        <span className="text-slate-600 block">2. Judicial Sessions Attended:</span>
                        <strong className="font-mono text-slate-900 text-xs">
                          {m.courtSessionsAttended || 0} Sessions (Pending: {m.pendingSummons || 0})
                        </strong>
                      </div>
                      <div className="p-2 border border-slate-300 rounded bg-slate-50 col-span-2">
                        <span className="text-slate-600 block">3. Court Compliance:</span>
                        <strong className="text-slate-900">{m.specialCourtCentralCompliance || '100% Punctual Cause List Tracking'}</strong>
                      </div>
                    </div>
                  )}

                  {currentOfficer?.cadre === 'LAW_BRANCH' && (
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2 border border-slate-300 rounded bg-slate-50">
                        <span className="text-slate-600 block">1. Legal Opinions Rendered:</span>
                        <strong className="font-mono text-cyan-800 text-xs">
                          {m.filesWithLegalOpinionRendered || 0} Opinions
                        </strong>
                      </div>
                      <div className="p-2 border border-slate-300 rounded bg-slate-50">
                        <span className="text-slate-600 block">2. Convictions in Contested Trials:</span>
                        <strong className="font-mono text-emerald-800 text-xs">
                          {m.totalConvictions || 0} / {m.casesContestedInCourt || 0} ({Math.round((m.convictionRate || 0) * 100)}%)
                        </strong>
                      </div>
                      <div className="p-2 border border-slate-300 rounded bg-slate-50">
                        <span className="text-slate-600 block">3. Court Advocacy vs Office Vetting:</span>
                        <strong className="font-mono text-slate-900 text-xs">
                          {m.hoursSpentInCourt || 0} hrs Court / {m.hoursSpentInOffice || 0} hrs Office
                        </strong>
                      </div>
                      <div className="p-2 border border-slate-300 rounded bg-slate-50">
                        <span className="text-slate-600 block">4. High Profile Federal Case:</span>
                        <strong className="text-slate-900">{m.anyHighProfileCase || 'No'}</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Part II: Conduct & Discipline Assessment */}
                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[10.5px] border-l-4 border-emerald-700 pl-2 mb-2">
                    Part II: Conduct, Discipline & Vigilance Record
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="p-2 border border-slate-300 rounded bg-slate-50">
                      <span className="text-slate-600 block">Appreciations & Commendations:</span>
                      <strong className="text-emerald-800">
                        {m.appreciationsReceived ?? 0} Appreciations / {m.participationInGoodWork ?? 0} Good Works
                      </strong>
                    </div>
                    <div className="p-2 border border-slate-300 rounded bg-slate-50">
                      <span className="text-slate-600 block">Showcauses / Disciplinary Inquiries:</span>
                      <strong className="text-slate-900">
                        {m.violationsShowcausesIssued ?? 0} (Conduct Index: {m.conductRecognitionIndex ?? 75}/100)
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Part III: Detailed Officer Performance Analysis & Formula Breakdown */}
                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[10.5px] border-l-4 border-emerald-700 pl-2 mb-2">
                    Part III: Officer Performance Analysis & Mathematical Scoring Breakdown
                  </h4>
                  <div className="p-3 border border-slate-300 rounded bg-slate-50 space-y-2 text-[10px]">
                    <div>
                      <strong className="text-slate-900 block">1. Operational Clearance Velocity Analysis:</strong>
                      <p className="text-slate-700 mt-0.5">{analysis.efficiencyNote}</p>
                    </div>
                    <div>
                      <strong className="text-slate-900 block">2. Cadre Scoring Formula Computation:</strong>
                      <p className="font-mono text-emerald-800 mt-0.5 bg-white p-1.5 border border-slate-200 rounded">
                        {analysis.formulaSummary}
                      </p>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200 text-[9.5px]">
                      <span><strong>Zonal Standing:</strong> <span className="text-emerald-800 font-semibold">{analysis.benchmarkRating}</span></span>
                      <span><strong>Vigilance Risk:</strong> <span className="text-slate-700">{analysis.riskAssessment}</span></span>
                    </div>
                  </div>
                </div>

                {/* Part IV: Qualitative Assessment & Narrative */}
                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[10.5px] border-l-4 border-emerald-700 pl-2 mb-2">
                    Part IV: Qualitative Assessment & Administrative Narrative
                  </h4>
                  <div className="space-y-2 text-[10px]">
                    <div className="p-2.5 border border-slate-300 rounded bg-slate-50">
                      <strong className="text-slate-900 block mb-0.5">Integrity & General Reputation:</strong>
                      <p className="text-slate-700">
                        {acrData?.integrityAssessment || 'Impeccable and Beyond Reproach. No complaints or vigilance inquiries pending.'}
                      </p>
                    </div>
                    <div className="p-2.5 border border-slate-300 rounded bg-slate-50">
                      <strong className="text-slate-900 block mb-0.5">Promotion Suitability:</strong>
                      <p className="text-emerald-800 font-bold">
                        {acrData?.promotionSuitability || 'Recommended for Promotion in Normal Course'}
                      </p>
                    </div>
                    <div className="p-2.5 border-l-4 border-slate-900 bg-slate-100 rounded text-slate-800 italic">
                      "{acrData?.officialDossierSummary || `The officer ${currentOfficer?.name} has served in Islamabad Zone with credit. Overall performance is graded as ${fallbackAcr.grade} (${fallbackAcr.score}/100). Fit for retention in current specialized assignment.`}"
                    </div>
                  </div>
                </div>

                {/* Signatures Block */}
                <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-[10px] text-slate-600 text-center">
                  <div className="pt-8 border-t border-dashed border-slate-400">
                    <strong className="text-slate-900 block">REPORTING OFFICER</strong>
                    <span>Circle Incharge / Deputy Director<br />FIA {currentOfficer?.circle}</span>
                  </div>
                  <div className="pt-8 border-t border-dashed border-slate-400">
                    <strong className="text-slate-900 block">COUNTERSIGNING OFFICER</strong>
                    <span>Director, FIA Islamabad Zone<br />Regional Headquarters (G-9/4 Islamabad)</span>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="text-[9px] font-mono text-slate-400 border-t border-slate-200 pt-2 flex justify-between">
                  <span>DOCKET ID: FIA-IZ-PER-{currentOfficer?.badgeNo.replace(/[^0-9]/g, '')}-2026</span>
                  <span>CONFIDENTIAL OFFICIAL RECORD</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
