import React, { useState } from 'react';
import { 
  Officer, 
  InvestigationMetrics, 
  AsiMetrics, 
  ConstabularyMetrics, 
  NaibCourtMetrics, 
  LawBranchMetrics 
} from '../types';
import { 
  formatPkr, 
  formatPercent, 
  formatDateTime, 
  getCadreDisplayName, 
  recalculateOfficerMetrics 
} from '../utils/formatters';
import { 
  X, 
  Award, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Plus, 
  ShieldAlert, 
  ThumbsUp, 
  HelpCircle, 
  Star,
  Activity
} from 'lucide-react';

interface OfficerDetailModalProps {
  officer: Officer;
  onClose: () => void;
  onUpdateMetrics: (officerId: string, updatedMetrics: any, logNote: string) => void;
  onGenerateAcr: (officer: Officer) => void;
  onAssignTask: (officer: Officer) => void;
  onLogDuty: (officer: Officer) => void;
}

export const OfficerDetailModal: React.FC<OfficerDetailModalProps> = ({
  officer,
  onClose,
  onUpdateMetrics,
  onGenerateAcr,
  onAssignTask,
  onLogDuty,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({ ...officer.metrics });
  const [updateLogReason, setUpdateLogReason] = useState('Routine day-to-day record verification & statistical update');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleFieldChange = (field: string, value: any) => {
    setEditFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveMetrics = (e: React.FormEvent) => {
    e.preventDefault();
    // Wrap in dummy officer to recalculate rates, conduct index, and weighted score
    const dummyOfficer: Officer = {
      ...officer,
      metrics: editFormData,
    };
    const recalculated = recalculateOfficerMetrics(dummyOfficer);
    
    onUpdateMetrics(officer.id, recalculated.metrics, updateLogReason);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsEditing(false);
    }, 600);
  };

  const m: any = officer.metrics;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden my-8">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold font-mono text-sm">
              {officer.rank.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">{officer.name}</h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                  {officer.badgeNo}
                </span>
                {officer.beltNo && (
                  <span className="text-xs font-mono text-slate-400">
                    Belt: {officer.beltNo}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="text-amber-400 font-medium">{officer.rank}</span>
                <span aria-hidden="true">·</span>
                <span>{officer.circle}</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400">{officer.status}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Top Score Banner: Weighted Score & Conduct Index */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950/80 rounded border border-slate-800">
            <div>
              <span className="text-slate-500 text-[11px] block mb-0.5">Weighted Score (/100)</span>
              <span className="text-xl font-bold font-mono text-amber-400 tabular-nums">
                {m.weightedScore ?? 67.7}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Grade: <strong className="text-emerald-400">{m.overallGradeRemarks ?? 'Satisfactory'}</strong>
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block mb-0.5">Conduct & Recognition (/100)</span>
              <span className="text-xl font-bold font-mono text-cyan-400 tabular-nums">
                {m.conductRecognitionIndex ?? 70}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Disciplinary Index</span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block mb-0.5">Appreciations / Good Work</span>
              <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                {m.appreciationsReceived ?? 0} / {m.participationInGoodWork ?? 0}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Recognitions</span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block mb-0.5">Showcauses / Explanations</span>
              <span className="text-base font-bold font-mono text-rose-400 tabular-nums">
                {m.violationsShowcausesIssued ?? 0} / {m.explanationsCalled ?? 0}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Advisories Issued</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Cadre Category:
              </span>
              <span className="text-xs font-medium text-amber-400">
                {getCadreDisplayName(officer.cadre)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onGenerateAcr(officer)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI ACR Dossier</span>
              </button>
              <button
                type="button"
                onClick={() => onAssignTask(officer)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Assign Task</span>
              </button>
              <button
                type="button"
                onClick={() => onLogDuty(officer)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Log Duty</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
                  isEditing 
                    ? 'bg-red-900/40 border-red-700 text-red-300 hover:bg-red-900/60' 
                    : 'bg-blue-900/30 border-blue-700 text-blue-300 hover:bg-blue-900/50'
                }`}
              >
                {isEditing ? 'Cancel Edit' : 'Edit Day-to-Day Indicators'}
              </button>
            </div>
          </div>

          {/* EDIT FORM (FOR ALL CADRES) */}
          {isEditing ? (
            <form onSubmit={handleSaveMetrics} className="space-y-4 bg-slate-950 p-4 rounded border border-slate-800 text-xs">
              
              <div className="font-semibold text-amber-400 border-b border-slate-800 pb-1">
                1. Operational Indicators (Real-Life Day-to-Day)
              </div>

              {/* SI - Inspector - AD Form */}
              {officer.cadre === 'INVESTIGATION' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Enquiries Assigned</label>
                    <input
                      type="number"
                      value={editFormData.enquiriesAssigned ?? 0}
                      onChange={(e) => handleFieldChange('enquiriesAssigned', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Enquiries Closed</label>
                    <input
                      type="number"
                      value={editFormData.enquiriesClosed ?? 0}
                      onChange={(e) => handleFieldChange('enquiriesClosed', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Enquiries Merged</label>
                    <input
                      type="number"
                      value={editFormData.enquiriesMerged ?? 0}
                      onChange={(e) => handleFieldChange('enquiriesMerged', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Total FIRs Registered</label>
                    <input
                      type="number"
                      value={editFormData.casesFirRegistered ?? 0}
                      onChange={(e) => handleFieldChange('casesFirRegistered', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Challans Submitted</label>
                    <input
                      type="number"
                      value={editFormData.challansSubmitted ?? 0}
                      onChange={(e) => handleFieldChange('challansSubmitted', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Pending Cases</label>
                    <input
                      type="number"
                      value={editFormData.pendingCases ?? 0}
                      onChange={(e) => handleFieldChange('pendingCases', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Accused Arrested</label>
                    <input
                      type="number"
                      value={editFormData.accusedArrested ?? 0}
                      onChange={(e) => handleFieldChange('accusedArrested', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Cases Decided in Court</label>
                    <input
                      type="number"
                      value={editFormData.casesDecidedInCourt ?? 0}
                      onChange={(e) => handleFieldChange('casesDecidedInCourt', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Convictions Obtained</label>
                    <input
                      type="number"
                      value={editFormData.convictionsObtained ?? 0}
                      onChange={(e) => handleFieldChange('convictionsObtained', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-slate-400 mb-1">Total Recoveries (PKR)</label>
                    <input
                      type="number"
                      value={editFormData.totalRecoveriesPkr ?? 0}
                      onChange={(e) => handleFieldChange('totalRecoveriesPkr', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {/* ASI Form */}
              {officer.cadre === 'ASI' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Verifications Entrusted</label>
                    <input
                      type="number"
                      value={editFormData.verificationsEntrusted ?? 0}
                      onChange={(e) => handleFieldChange('verificationsEntrusted', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Verifications Disposed</label>
                    <input
                      type="number"
                      value={editFormData.verificationsDisposedOff ?? 0}
                      onChange={(e) => handleFieldChange('verificationsDisposedOff', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Closed Directly</label>
                    <input
                      type="number"
                      value={editFormData.closed ?? 0}
                      onChange={(e) => handleFieldChange('closed', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Converted to Enquiries</label>
                    <input
                      type="number"
                      value={editFormData.convertedIntoEnquiries ?? 0}
                      onChange={(e) => handleFieldChange('convertedIntoEnquiries', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1">Weapon Handling Skill</label>
                    <select
                      value={editFormData.weaponHandlingSkill || 'Good'}
                      onChange={(e) => handleFieldChange('weaponHandlingSkill', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
                    >
                      <option value="Excellent">Excellent (Marksman - Score 5/5)</option>
                      <option value="Very Good">Very Good (Score 4/5)</option>
                      <option value="Good">Good (Qualified - Score 3/5)</option>
                      <option value="Fair">Fair (Score 2/5)</option>
                      <option value="Needs Improvement">Needs Improvement (Score 1/5)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Constable-HeadConstable Form */}
              {officer.cadre === 'CONSTABULARY' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Duties Assigned</label>
                    <input
                      type="number"
                      value={editFormData.dutiesAssigned ?? 0}
                      onChange={(e) => handleFieldChange('dutiesAssigned', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Times De-assigned</label>
                    <input
                      type="number"
                      value={editFormData.timesDeassignedRelieved ?? 0}
                      onChange={(e) => handleFieldChange('timesDeassignedRelieved', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Tasks Assigned</label>
                    <input
                      type="number"
                      value={editFormData.tasksAssigned ?? 0}
                      onChange={(e) => handleFieldChange('tasksAssigned', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Tasks Completed</label>
                    <input
                      type="number"
                      value={editFormData.tasksCompleted ?? 0}
                      onChange={(e) => handleFieldChange('tasksCompleted', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Deputed with IOs</label>
                    <input
                      type="number"
                      value={editFormData.deputedWithNoOfIos ?? 0}
                      onChange={(e) => handleFieldChange('deputedWithNoOfIos', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Raids Conducted</label>
                    <input
                      type="number"
                      value={editFormData.raidsConducted ?? 0}
                      onChange={(e) => handleFieldChange('raidsConducted', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Total Leave (Days)</label>
                    <input
                      type="number"
                      value={editFormData.totalLeaveDays ?? 0}
                      onChange={(e) => handleFieldChange('totalLeaveDays', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Hours Additional Duty</label>
                    <input
                      type="number"
                      value={editFormData.hoursOnAdditionalDuty ?? 0}
                      onChange={(e) => handleFieldChange('hoursOnAdditionalDuty', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Discipline</label>
                    <select
                      value={editFormData.discipline || 'Good'}
                      onChange={(e) => handleFieldChange('discipline', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
                    >
                      <option value="Impeccable">Impeccable</option>
                      <option value="Very Good">Very Good</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Warning Issued">Warning Issued</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Willingness to Work</label>
                    <select
                      value={editFormData.willingnessToWork || 'Good'}
                      onChange={(e) => handleFieldChange('willingnessToWork', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
                    >
                      <option value="Excellent">Excellent</option>
                      <option value="Very Good">Very Good</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Needs Motivation">Needs Motivation</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1">Remarks of Circle Incharge</label>
                    <input
                      type="text"
                      value={editFormData.remarksOfCircleIncharge || ''}
                      onChange={(e) => handleFieldChange('remarksOfCircleIncharge', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
                    />
                  </div>
                </div>
              )}

              {/* Naib Court Form */}
              {officer.cadre === 'NAIB_COURT' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Total Summons Executed</label>
                    <input
                      type="number"
                      value={editFormData.totalSummonsExecuted ?? 0}
                      onChange={(e) => handleFieldChange('totalSummonsExecuted', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Pending Summons</label>
                    <input
                      type="number"
                      value={editFormData.pendingSummons ?? 0}
                      onChange={(e) => handleFieldChange('pendingSummons', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Coordination with Officers</label>
                    <select
                      value={editFormData.coordinationWithOfficers || 'Good'}
                      onChange={(e) => handleFieldChange('coordinationWithOfficers', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
                    >
                      <option value="Excellent">Excellent (Score 5/5)</option>
                      <option value="Very Good">Very Good (Score 4/5)</option>
                      <option value="Good">Good (Score 3/5)</option>
                      <option value="Fair">Fair (Score 2/5)</option>
                      <option value="Poor">Poor (Score 1/5)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Law Branch Form */}
              {officer.cadre === 'LAW_BRANCH' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Files with Legal Opinion</label>
                    <input
                      type="number"
                      value={editFormData.filesWithLegalOpinionRendered ?? 0}
                      onChange={(e) => handleFieldChange('filesWithLegalOpinionRendered', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Hours in Court</label>
                    <input
                      type="number"
                      value={editFormData.hoursSpentInCourt ?? 0}
                      onChange={(e) => handleFieldChange('hoursSpentInCourt', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Hours in Office</label>
                    <input
                      type="number"
                      value={editFormData.hoursSpentInOffice ?? 0}
                      onChange={(e) => handleFieldChange('hoursSpentInOffice', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Cases Contested in Court</label>
                    <input
                      type="number"
                      value={editFormData.casesContestedInCourt ?? 0}
                      onChange={(e) => handleFieldChange('casesContestedInCourt', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Total Convictions</label>
                    <input
                      type="number"
                      value={editFormData.totalConvictions ?? 0}
                      onChange={(e) => handleFieldChange('totalConvictions', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Total Acquittals</label>
                    <input
                      type="number"
                      value={editFormData.totalAcquittals ?? 0}
                      onChange={(e) => handleFieldChange('totalAcquittals', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Any High Profile Case</label>
                    <select
                      value={editFormData.anyHighProfileCase || 'No'}
                      onChange={(e) => handleFieldChange('anyHighProfileCase', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
              )}

              {/* 2. Conduct & Recognition Indicators (Common to All Cadres) */}
              <div className="font-semibold text-cyan-400 border-b border-slate-800 pb-1 pt-3">
                2. Conduct, Commendations & Disciplinary Records
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-emerald-400 mb-1">Appreciations Received (+5 pts)</label>
                  <input
                    type="number"
                    value={editFormData.appreciationsReceived ?? 0}
                    onChange={(e) => handleFieldChange('appreciationsReceived', parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-emerald-800 rounded p-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-emerald-400 mb-1">Good Work Participation (+5 pts)</label>
                  <input
                    type="number"
                    value={editFormData.participationInGoodWork ?? 0}
                    onChange={(e) => handleFieldChange('participationInGoodWork', parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-emerald-800 rounded p-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-rose-400 mb-1">Violations / Showcauses (-15 pts)</label>
                  <input
                    type="number"
                    value={editFormData.violationsShowcausesIssued ?? 0}
                    onChange={(e) => handleFieldChange('violationsShowcausesIssued', parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-rose-800 rounded p-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-rose-400 mb-1">Explanations Called (-10 pts)</label>
                  <input
                    type="number"
                    value={editFormData.explanationsCalled ?? 0}
                    onChange={(e) => handleFieldChange('explanationsCalled', parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-rose-800 rounded p-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Reason for Day-to-Day Log Update</label>
                <input
                  type="text"
                  value={updateLogReason}
                  onChange={(e) => setUpdateLogReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded"
                >
                  Save & Recalculate Score
                </button>
              </div>

            </form>
          ) : (
            /* VIEW MODE: DETAILED CADRE RECORD */
            <div className="space-y-4">
              
              {/* Cadre-Specific Section */}
              {officer.cadre === 'INVESTIGATION' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Investigation & Case Disposal Parameters
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                      <span className="text-slate-500 block">Enquiries (Assigned / Closed / Merged)</span>
                      <span className="text-base font-bold font-mono text-white tabular-nums">
                        {m.enquiriesAssigned} / <span className="text-emerald-400">{m.enquiriesClosed}</span> / {m.enquiriesMerged}
                      </span>
                      <span className="text-[11px] text-cyan-400 block mt-0.5 font-mono">
                        Disposal: {formatPercent(m.disposalRate)}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                      <span className="text-slate-500 block">FIRs vs Challans Submitted</span>
                      <span className="text-base font-bold font-mono text-white tabular-nums">
                        {m.casesFirRegistered} / <span className="text-cyan-400">{m.challansSubmitted}</span>
                      </span>
                      <span className="text-[11px] text-cyan-400 block mt-0.5 font-mono">
                        Challan Rate: {formatPercent(m.challanRate)}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                      <span className="text-slate-500 block">Court Trials & Convictions</span>
                      <span className="text-base font-bold font-mono text-white tabular-nums">
                        {m.casesDecidedInCourt} / <span className="text-emerald-400">{m.convictionsObtained}</span>
                      </span>
                      <span className="text-[11px] text-emerald-400 block mt-0.5 font-mono">
                        Conviction Rate: {formatPercent(m.convictionRate)}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                      <span className="text-slate-500 block">Accused Arrested / Pending</span>
                      <span className="text-base font-bold font-mono text-purple-400 tabular-nums">
                        {m.accusedArrested} Arrested
                      </span>
                      <span className="text-[11px] text-rose-400 block mt-0.5 font-mono">
                        {m.pendingCases} Pending Cases
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded sm:col-span-4 flex items-center justify-between">
                      <span className="text-slate-400 font-semibold">Total Recoveries Secured:</span>
                      <span className="text-base font-bold font-mono text-amber-300 tabular-nums">
                        {formatPkr(m.totalRecoveriesPkr)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {officer.cadre === 'ASI' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    ASI Verification & Weapon Skill Record
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                      <span className="text-slate-500 block">Verifications Entrusted / Disposed</span>
                      <span className="text-base font-bold font-mono text-white tabular-nums">
                        {m.verificationsEntrusted} / <span className="text-emerald-400">{m.verificationsDisposedOff}</span>
                      </span>
                      <span className="text-[11px] text-cyan-400 block mt-0.5 font-mono">
                        Disposal: {formatPercent(m.disposalRate)}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                      <span className="text-slate-500 block">Closed vs Converted</span>
                      <span className="text-base font-bold font-mono text-white tabular-nums">
                        {m.closed} / <span className="text-amber-400">{m.convertedIntoEnquiries}</span>
                      </span>
                      <span className="text-[11px] text-amber-400 block mt-0.5 font-mono">
                        Conversion: {formatPercent(m.conversionRate)}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded sm:col-span-2">
                      <span className="text-slate-500 block">Weapon Handling Proficiency</span>
                      <span className="text-sm font-semibold text-slate-200">
                        {m.weaponHandlingSkill}
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
                        Standard Score: {m.weaponHandlingScore ?? 3} / 5
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {officer.cadre === 'CONSTABULARY' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Constabulary Duties, Raids & Field Evaluation
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                      <span className="text-slate-500 block">Duties Assigned / Relieved</span>
                      <span className="text-base font-bold font-mono text-white tabular-nums">
                        {m.dutiesAssigned} / {m.timesDeassignedRelieved}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                      <span className="text-slate-500 block">Tasks Completed / Assigned</span>
                      <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                        {m.tasksCompleted} / {m.tasksAssigned}
                      </span>
                      <span className="text-[11px] text-cyan-400 block mt-0.5 font-mono">
                        Completion: {formatPercent(m.taskCompletionRate)}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                      <span className="text-slate-500 block">Deputed with IOs / Raids</span>
                      <span className="text-base font-bold font-mono text-amber-400 tabular-nums">
                        {m.deputedWithNoOfIos} IOs / {m.raidsConducted} Raids
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                      <span className="text-slate-500 block">Additional Duty Hours</span>
                      <span className="text-base font-bold font-mono text-cyan-400 tabular-nums">
                        {m.hoursOnAdditionalDuty} hrs
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded sm:col-span-4 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Type of Duty: <strong className="text-white">{m.typeOfDuty}</strong></span>
                        <span className="text-slate-400">Discipline: <strong className="text-emerald-400">{m.discipline}</strong></span>
                        <span className="text-slate-400">Attitude: <strong className="text-cyan-400">{m.attitudeTowardDuty}</strong></span>
                        <span className="text-slate-400">Leave: <strong className="text-slate-200">{m.totalLeaveDays} Days</strong></span>
                      </div>
                      <p className="text-slate-300 italic pt-1 border-t border-slate-850">
                        Incharge Remarks: "{m.remarksOfCircleIncharge}"
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {officer.cadre === 'NAIB_COURT' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Naib Court Summons & Judicial Liaison
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                      <span className="text-slate-500 block">Total Summons Executed</span>
                      <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                        {m.totalSummonsExecuted}
                      </span>
                      <span className="text-[11px] text-cyan-400 block mt-0.5 font-mono">
                        Execution Rate: {formatPercent(m.executionRate)}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                      <span className="text-slate-500 block">Pending Summons</span>
                      <span className="text-base font-bold font-mono text-amber-400 tabular-nums">
                        {m.pendingSummons}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                      <span className="text-slate-500 block">Officer Coordination</span>
                      <span className="text-sm font-semibold text-slate-200">
                        {m.coordinationWithOfficers}
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
                        Score: {m.coordinationScore ?? 3} / 5
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {officer.cadre === 'LAW_BRANCH' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Law Branch & Prosecution Register
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                      <span className="text-slate-500 block">Legal Opinions Rendered</span>
                      <span className="text-base font-bold font-mono text-white tabular-nums">
                        {m.filesWithLegalOpinionRendered}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                      <span className="text-slate-500 block">Court vs Office Hours</span>
                      <span className="text-base font-bold font-mono text-amber-400 tabular-nums">
                        {m.hoursSpentInCourt} / {m.hoursSpentInOffice} hrs
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                      <span className="text-slate-500 block">Cases Contested</span>
                      <span className="text-base font-bold font-mono text-white tabular-nums">
                        {m.casesContestedInCourt}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                      <span className="text-slate-500 block">Convictions Secured</span>
                      <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                        {m.totalConvictions} <span className="text-slate-400 text-xs">({m.totalAcquittals} Acq.)</span>
                      </span>
                      <span className="text-[11px] text-emerald-400 block mt-0.5 font-mono">
                        Conviction: {formatPercent(m.convictionRate)}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded sm:col-span-4 flex items-center justify-between">
                      <span className="text-slate-400">Any High Profile Case: <strong className="text-amber-400">{m.anyHighProfileCase}</strong></span>
                      {m.highProfileCaseDetails && (
                        <span className="text-slate-300 text-[11px] truncate max-w-md">{m.highProfileCaseDetails.join('; ')}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Conduct & Recognition Breakdown */}
              <div className="pt-2 border-t border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Conduct, Commendations & Disciplinary Records
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 bg-emerald-950/30 border border-emerald-800/60 rounded">
                    <span className="text-emerald-400 font-medium block">Appreciations Received</span>
                    <span className="text-lg font-bold font-mono text-emerald-300">{m.appreciationsReceived ?? 0}</span>
                  </div>
                  <div className="p-2.5 bg-emerald-950/30 border border-emerald-800/60 rounded">
                    <span className="text-emerald-400 font-medium block">Participation in Good Work</span>
                    <span className="text-lg font-bold font-mono text-emerald-300">{m.participationInGoodWork ?? 0}</span>
                  </div>
                  <div className="p-2.5 bg-rose-950/30 border border-rose-800/60 rounded">
                    <span className="text-rose-400 font-medium block">Showcauses Issued</span>
                    <span className="text-lg font-bold font-mono text-rose-300">{m.violationsShowcausesIssued ?? 0}</span>
                  </div>
                  <div className="p-2.5 bg-rose-950/30 border border-rose-800/60 rounded">
                    <span className="text-rose-400 font-medium block">Explanations Called</span>
                    <span className="text-lg font-bold font-mono text-rose-300">{m.explanationsCalled ?? 0}</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Toast Notification */}
          {saveSuccess && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs rounded flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Officer day-to-day indicators updated and recalculated successfully.</span>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-400">
          <span>Security Classification: OFFICIAL // RESTRICTED PERSONNEL RECORD</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition-colors"
          >
            Close Docket
          </button>
        </div>

      </div>
    </div>
  );
};
