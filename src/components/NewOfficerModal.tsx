import React, { useState } from 'react';
import { Cadre, Circle, Rank, Officer } from '../types';
import { X, UserPlus, Shield } from 'lucide-react';

interface NewOfficerModalProps {
  onClose: () => void;
  onAddOfficer: (newOfficer: Officer) => void;
}

export const NewOfficerModal: React.FC<NewOfficerModalProps> = ({ onClose, onAddOfficer }) => {
  const [name, setName] = useState('');
  const [cadre, setCadre] = useState<Cadre>('INVESTIGATION');
  const [rank, setRank] = useState<Rank>('Sub-Inspector (SI)');
  const [circle, setCircle] = useState<Circle>('Anti-Corruption Circle (ACC)');
  const [badgeNo, setBadgeNo] = useState(`FIA-${Date.now().toString().slice(-4)}`);
  const [beltNo, setBeltNo] = useState(`ISB-${Math.floor(Math.random() * 300) + 1}`);
  const [phone, setPhone] = useState('+92 300 ');
  const [cnic, setCnic] = useState('61101-');
  const [postingDuration, setPostingDuration] = useState('6 Months');

  const handleCadreChange = (selectedCadre: Cadre) => {
    setCadre(selectedCadre);
    if (selectedCadre === 'INVESTIGATION') {
      setRank('Sub-Inspector (SI)');
    } else if (selectedCadre === 'ASI') {
      setRank('Assistant Sub-Inspector (ASI)');
    } else if (selectedCadre === 'CONSTABULARY') {
      setRank('Constable (PC)');
    } else if (selectedCadre === 'NAIB_COURT') {
      setRank('Naib Court');
    } else if (selectedCadre === 'LAW_BRANCH') {
      setRank('AD Law / Prosecutor');
      setCircle('Zone Legal & Prosecution Wing');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let defaultMetrics: any;
    if (cadre === 'INVESTIGATION') {
      defaultMetrics = {
        enquiriesAssigned: 12,
        enquiriesClosed: 8,
        enquiriesMerged: 1,
        casesFirRegistered: 6,
        challansSubmitted: 5,
        pendingCases: 2,
        accusedArrested: 9,
        casesDecidedInCourt: 4,
        convictionsObtained: 3,
        totalRecoveriesPkr: 15000000,
        violationsShowcausesIssued: 0,
        appreciationsReceived: 1,
        explanationsCalled: 0,
        participationInGoodWork: 1,
        disposalRate: 0.75,
        challanRate: 0.8333,
        convictionRate: 0.75,
        conductRecognitionIndex: 70,
        weightedScore: 72.5,
        overallGradeRemarks: 'Good',
      };
    } else if (cadre === 'ASI') {
      defaultMetrics = {
        verificationsEntrusted: 25,
        verificationsDisposedOff: 20,
        closed: 16,
        convertedIntoEnquiries: 4,
        weaponHandlingSkill: 'Good',
        weaponHandlingScore: 3,
        violationsShowcausesIssued: 0,
        appreciationsReceived: 1,
        explanationsCalled: 0,
        participationInGoodWork: 1,
        disposalRate: 0.80,
        conversionRate: 0.16,
        conductRecognitionIndex: 70,
        weightedScore: 71.0,
        overallGradeRemarks: 'Good',
      };
    } else if (cadre === 'CONSTABULARY') {
      defaultMetrics = {
        dutiesAssigned: 15,
        timesDeassignedRelieved: 1,
        tasksAssigned: 20,
        tasksCompleted: 18,
        deputedWithNoOfIos: 2,
        raidsConducted: 8,
        typeOfDuty: 'Field Duty',
        willingnessToWork: 'Good',
        totalLeaveDays: 4,
        discipline: 'Good',
        attitudeTowardDuty: 'Proactive & Professional',
        hoursOnAdditionalDuty: 35,
        remarksOfCircleIncharge: 'Enrolled in Islamabad Zone; diligent and disciplined.',
        violationsShowcausesIssued: 0,
        appreciationsReceived: 1,
        explanationsCalled: 0,
        participationInGoodWork: 1,
        taskCompletionRate: 0.90,
        behaviourScore: 75,
        conductRecognitionIndex: 70,
        weightedScore: 73.0,
        overallGradeRemarks: 'Good',
      };
    } else if (cadre === 'NAIB_COURT') {
      defaultMetrics = {
        totalSummonsExecuted: 45,
        pendingSummons: 5,
        coordinationWithOfficers: 'Good',
        coordinationScore: 3,
        courtSessionsAttended: 50,
        specialCourtCentralCompliance: 'Active coordination with Special Judge Central Islamabad.',
        violationsShowcausesIssued: 0,
        appreciationsReceived: 1,
        explanationsCalled: 0,
        participationInGoodWork: 1,
        executionRate: 0.90,
        conductRecognitionIndex: 70,
        weightedScore: 78.0,
        overallGradeRemarks: 'Very Good',
      };
    } else if (cadre === 'LAW_BRANCH') {
      defaultMetrics = {
        filesWithLegalOpinionRendered: 22,
        hoursSpentInCourt: 110,
        hoursSpentInOffice: 160,
        casesContestedInCourt: 18,
        totalConvictions: 14,
        totalAcquittals: 4,
        anyHighProfileCase: 'No',
        highProfileCaseDetails: [],
        violationsShowcausesIssued: 0,
        appreciationsReceived: 1,
        explanationsCalled: 0,
        participationInGoodWork: 1,
        convictionRate: 0.7778,
        conductRecognitionIndex: 70,
        weightedScore: 75.0,
        overallGradeRemarks: 'Very Good',
      };
    }

    const newOfficer: Officer = {
      id: `off-${Date.now()}`,
      name: name.trim(),
      badgeNo: badgeNo.trim(),
      beltNo: beltNo.trim(),
      cadre,
      rank,
      circle,
      phone: phone.trim(),
      cnic: cnic.trim(),
      postingDuration,
      status: 'Active Duty',
      metrics: defaultMetrics,
      lastUpdated: new Date().toISOString(),
      acrScore: 85,
      acrGrade: 'Good',
    };

    onAddOfficer(newOfficer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden my-8">
        
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Enroll Officer in Islamabad Zone
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Officer Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tariq Mehmood"
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Branch / Cadre</label>
              <select
                value={cadre}
                onChange={(e) => handleCadreChange(e.target.value as Cadre)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
              >
                <option value="INVESTIGATION">Investigation (SI, Insp, AD)</option>
                <option value="ASI">ASI (Verifications)</option>
                <option value="CONSTABULARY">Constabulary (HC & PC)</option>
                <option value="NAIB_COURT">Naib Court</option>
                <option value="LAW_BRANCH">Law Branch & Prosecutors</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Designation / Rank</label>
              <select
                value={rank}
                onChange={(e) => setRank(e.target.value as Rank)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
              >
                {cadre === 'INVESTIGATION' && (
                  <>
                    <option value="AD (Assistant Director)">AD (Assistant Director)</option>
                    <option value="Inspector">Inspector</option>
                    <option value="Sub-Inspector (SI)">Sub-Inspector (SI)</option>
                  </>
                )}
                {cadre === 'ASI' && (
                  <option value="Assistant Sub-Inspector (ASI)">Assistant Sub-Inspector (ASI)</option>
                )}
                {cadre === 'CONSTABULARY' && (
                  <>
                    <option value="Head Constable (HC)">Head Constable (HC)</option>
                    <option value="Constable (PC)">Constable (PC)</option>
                  </>
                )}
                {cadre === 'NAIB_COURT' && (
                  <option value="Naib Court">Naib Court</option>
                )}
                {cadre === 'LAW_BRANCH' && (
                  <option value="AD Law / Prosecutor">AD Law / Prosecutor</option>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Badge / Agency ID</label>
              <input
                type="text"
                required
                value={badgeNo}
                onChange={(e) => setBadgeNo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Belt Number</label>
              <input
                type="text"
                value={beltNo}
                onChange={(e) => setBeltNo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Circle / Wing (Islamabad Zone)</label>
            <select
              value={circle}
              onChange={(e) => setCircle(e.target.value as Circle)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
            >
              <option value="Anti-Corruption Circle (ACC)">Anti-Corruption Circle (ACC)</option>
              <option value="Cyber Crime Circle (CCC)">Cyber Crime Circle (CCC)</option>
              <option value="Anti-Human Trafficking Circle (AHTC)">Anti-Human Trafficking Circle (AHTC)</option>
              <option value="Commercial Banking Circle (CBC)">Commercial Banking Circle (CBC)</option>
              <option value="Counter Terrorism Wing (CTW)">Counter Terrorism Wing (CTW)</option>
              <option value="Zone Legal & Prosecution Wing">Zone Legal & Prosecution Wing</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">CNIC No.</label>
              <input
                type="text"
                value={cnic}
                onChange={(e) => setCnic(e.target.value)}
                placeholder="61101-XXXXXXX-X"
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Posting Duration in Zone</label>
            <input
              type="text"
              value={postingDuration}
              onChange={(e) => setPostingDuration(e.target.value)}
              placeholder="e.g. 1 Year 2 Months"
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded transition-colors"
            >
              Enroll into Zone Register
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
