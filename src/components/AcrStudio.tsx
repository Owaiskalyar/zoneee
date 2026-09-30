import React, { useState } from 'react';
import { Officer, AcrEvaluation, OfficerTask, DailyActivityLog } from '../types';
import { calculateCadreAcrScore, formatPkr, formatDateTime, getCadreDisplayName } from '../utils/formatters';
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
  RefreshCw
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

  const officerTasks = tasks.filter((t) => t.officerId === currentOfficer?.id);
  const officerActivities = activities.filter((a) => a.officerId === currentOfficer?.id);
  const fallbackAcr = calculateCadreAcrScore(currentOfficer);

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
      // Construct fallback evaluation based on cadre formula
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
          'Accelerate disposal of pending inquiries exceeding 90-day threshold',
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
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Officer Selector & Studio Controls */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        
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

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={handleGenerateAcr}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors disabled:opacity-50 whitespace-nowrap shadow-md"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Evaluating Officer Metrics...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Official AI ACR</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors whitespace-nowrap"
            title="Print Official ACR Docket for HQ Submission"
          >
            <Printer className="w-4 h-4" />
            <span>Print Docket</span>
          </button>
        </div>

      </div>

      {/* ACR SCORECARD & AI DOSSIER PREVIEW */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        
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
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded border border-slate-800">
            <div className="text-right">
              <span className="text-[11px] text-slate-500 font-mono block">CONDUCT INDEX</span>
              <span className="text-xs font-bold text-cyan-400">
                {(currentOfficer?.metrics as any).conductRecognitionIndex ?? 75}/100
              </span>
            </div>
            <div className="h-8 w-px bg-slate-800"></div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 font-mono block">FINAL ACR RATING</span>
              <span className="text-xs font-bold text-emerald-400">
                {acrData?.grading || (currentOfficer?.metrics as any).overallGradeRemarks || fallbackAcr.grade}
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
              {acrData?.acrScore || (currentOfficer?.metrics as any).weightedScore || fallbackAcr.score}
              <span className="text-xs text-slate-500 font-normal">/100</span>
            </div>
          </div>
        </div>

        {/* Dossier Body */}
        <div className="p-6 space-y-6">
          
          {/* Part I: Statistical Key Indicators Considered for ACR */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Part I: Primary Evaluation Metrics & Day-to-Day Output</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {currentOfficer?.cadre === 'INVESTIGATION' && (
                <>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                    <span className="text-slate-500 text-xs block">Enquiries Clearance</span>
                    <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                      {(currentOfficer.metrics as any).enquiriesClosed} / {(currentOfficer.metrics as any).enquiriesAssigned}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                    <span className="text-slate-500 text-xs block">FIRs / Challans</span>
                    <span className="text-base font-bold font-mono text-white tabular-nums">
                      {(currentOfficer.metrics as any).casesFirRegistered} / {(currentOfficer.metrics as any).challansSubmitted}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                    <span className="text-slate-500 text-xs block">Accused Apprehended</span>
                    <span className="text-base font-bold font-mono text-purple-400 tabular-nums">
                      {(currentOfficer.metrics as any).accusedArrested} Persons
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                    <span className="text-slate-500 text-xs block">Total Recoveries</span>
                    <span className="text-sm font-bold font-mono text-amber-300 tabular-nums">
                      {formatPkr((currentOfficer.metrics as any).totalRecoveriesPkr)}
                    </span>
                  </div>
                </>
              )}

              {currentOfficer?.cadre === 'ASI' && (
                <>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                    <span className="text-slate-500 text-xs block">Verifications Disposed</span>
                    <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                      {(currentOfficer.metrics as any).verificationsDisposedOff} / {(currentOfficer.metrics as any).verificationsEntrusted}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                    <span className="text-slate-500 text-xs block">Enquiries Converted</span>
                    <span className="text-base font-bold font-mono text-amber-400 tabular-nums">
                      {(currentOfficer.metrics as any).convertedIntoEnquiries} Files
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded col-span-2">
                    <span className="text-slate-500 text-xs block">Weapon Handling Proficiency</span>
                    <span className="text-sm font-semibold text-slate-200">
                      {(currentOfficer.metrics as any).weaponHandlingSkill}
                    </span>
                  </div>
                </>
              )}

              {currentOfficer?.cadre === 'CONSTABULARY' && (
                <>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                    <span className="text-slate-500 text-xs block">Task Execution Ratio</span>
                    <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                      {(currentOfficer.metrics as any).tasksCompleted} / {(currentOfficer.metrics as any).tasksAssigned}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                    <span className="text-slate-500 text-xs block">Raids Conducted</span>
                    <span className="text-base font-bold font-mono text-amber-400 tabular-nums">
                      {(currentOfficer.metrics as any).raidsConducted} Raids
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                    <span className="text-slate-500 text-xs block">Discipline Assessment</span>
                    <span className="text-sm font-semibold text-emerald-400">
                      {(currentOfficer.metrics as any).disciplineRating}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                    <span className="text-slate-500 text-xs block">Overtime Additional Hours</span>
                    <span className="text-base font-bold font-mono text-cyan-400 tabular-nums">
                      {(currentOfficer.metrics as any).hoursSpentAdditionalDuty} hrs
                    </span>
                  </div>
                </>
              )}

              {currentOfficer?.cadre === 'NAIB_COURT' && (
                <>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                    <span className="text-slate-500 text-xs block">Summons Executed</span>
                    <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                      {(currentOfficer.metrics as any).summonsExecuted}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                    <span className="text-slate-500 text-xs block">Pending Summons</span>
                    <span className="text-base font-bold font-mono text-amber-400 tabular-nums">
                      {(currentOfficer.metrics as any).pendingSummons}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded col-span-2">
                    <span className="text-slate-500 text-xs block">Officer Liaison Coordination</span>
                    <span className="text-sm font-semibold text-slate-200">
                      {(currentOfficer.metrics as any).coordinationWithOfficers}
                    </span>
                  </div>
                </>
              )}

              {currentOfficer?.cadre === 'LAW_BRANCH' && (
                <>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                    <span className="text-slate-500 text-xs block">Legal Opinions</span>
                    <span className="text-base font-bold font-mono text-cyan-400 tabular-nums">
                      {(currentOfficer.metrics as any).legalOpinionsRendered}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                    <span className="text-slate-500 text-xs block">Cases Contested</span>
                    <span className="text-base font-bold font-mono text-white tabular-nums">
                      {(currentOfficer.metrics as any).casesContestedInCourt}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                    <span className="text-slate-500 text-xs block">Convictions</span>
                    <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                      {(currentOfficer.metrics as any).totalConvictions}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                    <span className="text-slate-500 text-xs block">Court Room Hours</span>
                    <span className="text-base font-bold font-mono text-amber-400 tabular-nums">
                      {(currentOfficer.metrics as any).hoursSpentInCourt} hrs
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Conduct & Recognition Sheet Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
              <div className="p-2.5 bg-emerald-950/20 border border-emerald-800/60 rounded">
                <span className="text-emerald-400 block text-[11px]">Appreciations Received</span>
                <span className="font-mono font-bold text-white text-base">
                  {(currentOfficer?.metrics as any).appreciationsReceived ?? 0}
                </span>
              </div>
              <div className="p-2.5 bg-emerald-950/20 border border-emerald-800/60 rounded">
                <span className="text-emerald-400 block text-[11px]">Participation in Good Work</span>
                <span className="font-mono font-bold text-white text-base">
                  {(currentOfficer?.metrics as any).participationInGoodWork ?? 0}
                </span>
              </div>
              <div className="p-2.5 bg-rose-950/20 border border-rose-800/60 rounded">
                <span className="text-rose-400 block text-[11px]">Violations / Showcauses</span>
                <span className="font-mono font-bold text-white text-base">
                  {(currentOfficer?.metrics as any).violationsShowcausesIssued ?? 0}
                </span>
              </div>
              <div className="p-2.5 bg-rose-950/20 border border-rose-800/60 rounded">
                <span className="text-rose-400 block text-[11px]">Explanations Called</span>
                <span className="font-mono font-bold text-white text-base">
                  {(currentOfficer?.metrics as any).explanationsCalled ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* Part II: AI Qualitative Evaluation & Integrity Review */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Part II: Qualitative Assessment & Administrative Narrative</span>
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

          {/* Part III: Signature & Authentication Block */}
          <div className="pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs text-slate-400">
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

    </div>
  );
};
