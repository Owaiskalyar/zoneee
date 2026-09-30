import { 
  Cadre, 
  Officer, 
  InvestigationMetrics, 
  AsiMetrics, 
  ConstabularyMetrics, 
  NaibCourtMetrics, 
  LawBranchMetrics 
} from '../types';

export function formatPkr(amount: number): string {
  if (!amount || amount === 0) return '0 PKR';
  if (amount >= 10000000) {
    return `${(amount / 10000000).toFixed(2)} Crore PKR`;
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(2)}M PKR`;
  }
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(amount);
}

export function formatPercent(rate: number): string {
  if (rate === undefined || rate === null || isNaN(rate)) return '0.0%';
  return `${(rate * 100).toFixed(1)}%`;
}

export function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function getCadreDisplayName(cadre: Cadre): string {
  switch (cadre) {
    case 'INVESTIGATION':
      return 'SI - Inspector - AD';
    case 'ASI':
      return 'ASI (Assistant Sub-Inspector)';
    case 'CONSTABULARY':
      return 'Constable - Head Constable';
    case 'NAIB_COURT':
      return 'Naib Court';
    case 'LAW_BRANCH':
      return 'Law Branch (Prosecutors)';
  }
}

export function calculateCadreAcrScore(officer: Officer): { score: number; grade: string } {
  const recalculated = recalculateOfficerMetrics(officer);
  const m: any = recalculated.metrics;
  return {
    score: Math.round(m.weightedScore || 70),
    grade: m.overallGradeRemarks || 'Good',
  };
}

// Calculate Conduct & Recognition Index (/100) based on sheet rules
export function calculateConductRecognitionIndex(
  appreciations: number = 0,
  goodWork: number = 0,
  showcauses: number = 0,
  explanations: number = 0
): number {
  let score = 60; // base score
  score += Math.min(25, appreciations * 5);
  score += Math.min(20, goodWork * 5);
  score -= (showcauses * 15);
  score -= (explanations * 10);
  return Math.min(100, Math.max(10, Math.round(score)));
}

// Score mapping for weapon handling
export function weaponSkillToScore(skill: string): number {
  switch (skill) {
    case 'Excellent':
    case 'Grade A - Marksman':
      return 5;
    case 'Very Good':
      return 4;
    case 'Good':
    case 'Grade B - Qualified':
      return 3;
    case 'Fair':
    case 'Grade C - Standard':
      return 2;
    default:
      return 1;
  }
}

// Score mapping for coordination
export function coordinationSkillToScore(coord: string): number {
  switch (coord) {
    case 'Excellent':
    case 'Outstanding':
      return 5;
    case 'Very Good':
      return 4;
    case 'Good':
      return 3;
    case 'Fair':
    case 'Satisfactory':
      return 2;
    default:
      return 1;
  }
}

// Master calculation function: updates derived rates, conduct index, weighted score, and overall grade
export function recalculateOfficerMetrics(officer: Officer): Officer {
  const updated = { ...officer };
  
  if (officer.cadre === 'INVESTIGATION') {
    const m = { ...(officer.metrics as InvestigationMetrics) };
    const totalDisposals = (m.enquiriesClosed || 0) + (m.enquiriesMerged || 0);
    const assigned = m.enquiriesAssigned || 1;
    m.disposalRate = Number((totalDisposals / assigned).toFixed(4));
    
    const firs = m.casesFirRegistered || 1;
    m.challanRate = Number(((m.challansSubmitted || 0) / firs).toFixed(4));
    
    const decided = m.casesDecidedInCourt || 1;
    m.convictionRate = Number(((m.convictionsObtained || 0) / decided).toFixed(4));
    
    m.conductRecognitionIndex = calculateConductRecognitionIndex(
      m.appreciationsReceived,
      m.participationInGoodWork,
      m.violationsShowcausesIssued,
      m.explanationsCalled
    );
    
    const recoveryBonus = Math.min(10, Math.floor((m.totalRecoveriesPkr || 0) / 10000000));
    const weighted = (m.disposalRate * 25) + 
                     (m.challanRate * 25) + 
                     (m.convictionRate * 20) + 
                     (m.conductRecognitionIndex * 0.20) + 
                     recoveryBonus;
                     
    m.weightedScore = Number(Math.min(99.5, Math.max(30, weighted)).toFixed(1));
    m.overallGradeRemarks = getGradeFromScore(m.weightedScore);
    
    updated.metrics = m;
    updated.acrScore = Math.round(m.weightedScore);
    updated.acrGrade = m.overallGradeRemarks;
  } else if (officer.cadre === 'ASI') {
    const m = { ...(officer.metrics as AsiMetrics) };
    const entrusted = m.verificationsEntrusted || 1;
    m.disposalRate = Number(((m.verificationsDisposedOff || 0) / entrusted).toFixed(4));
    m.conversionRate = Number(((m.convertedIntoEnquiries || 0) / entrusted).toFixed(4));
    m.weaponHandlingScore = weaponSkillToScore(m.weaponHandlingSkill);
    
    m.conductRecognitionIndex = calculateConductRecognitionIndex(
      m.appreciationsReceived,
      m.participationInGoodWork,
      m.violationsShowcausesIssued,
      m.explanationsCalled
    );
    
    const weighted = (m.disposalRate * 40) + 
                     ((m.weaponHandlingScore / 5) * 20) + 
                     (m.conductRecognitionIndex * 0.25) + 
                     (m.conversionRate * 15);
                     
    m.weightedScore = Number(Math.min(99.5, Math.max(30, weighted)).toFixed(1));
    m.overallGradeRemarks = getGradeFromScore(m.weightedScore);
    
    updated.metrics = m;
    updated.acrScore = Math.round(m.weightedScore);
    updated.acrGrade = m.overallGradeRemarks;
  } else if (officer.cadre === 'CONSTABULARY') {
    const m = { ...(officer.metrics as ConstabularyMetrics) };
    const tasks = m.tasksAssigned || 1;
    m.taskCompletionRate = Number(((m.tasksCompleted || 0) / tasks).toFixed(4));
    
    // Behaviour score
    let beh = 60;
    if (m.discipline === 'Impeccable') beh += 15;
    else if (m.discipline === 'Very Good') beh += 10;
    else if (m.discipline === 'Good') beh += 5;
    
    if (m.attitudeTowardDuty.includes('Proactive') || m.attitudeTowardDuty === 'Very Good') beh += 15;
    else if (m.attitudeTowardDuty === 'Good' || m.attitudeTowardDuty === 'Cooperative') beh += 10;
    
    if (m.willingnessToWork === 'Excellent') beh += 10;
    else if (m.willingnessToWork === 'Very Good') beh += 7;
    else if (m.willingnessToWork === 'Good') beh += 5;
    
    m.behaviourScore = Math.min(100, Math.max(30, beh));
    
    m.conductRecognitionIndex = calculateConductRecognitionIndex(
      m.appreciationsReceived,
      m.participationInGoodWork,
      m.violationsShowcausesIssued,
      m.explanationsCalled
    );
    
    const raidBonus = Math.min(10, (m.raidsConducted || 0) * 0.5);
    const weighted = (m.taskCompletionRate * 35) + 
                     (m.behaviourScore * 0.35) + 
                     (m.conductRecognitionIndex * 0.20) + 
                     raidBonus;
                     
    m.weightedScore = Number(Math.min(99.5, Math.max(30, weighted)).toFixed(1));
    m.overallGradeRemarks = getGradeFromScore(m.weightedScore);
    
    updated.metrics = m;
    updated.acrScore = Math.round(m.weightedScore);
    updated.acrGrade = m.overallGradeRemarks;
  } else if (officer.cadre === 'NAIB_COURT') {
    const m = { ...(officer.metrics as NaibCourtMetrics) };
    const totalSummons = (m.totalSummonsExecuted || 0) + (m.pendingSummons || 0) || 1;
    m.executionRate = Number(((m.totalSummonsExecuted || 0) / totalSummons).toFixed(4));
    m.coordinationScore = coordinationSkillToScore(m.coordinationWithOfficers);
    
    m.conductRecognitionIndex = calculateConductRecognitionIndex(
      m.appreciationsReceived,
      m.participationInGoodWork,
      m.violationsShowcausesIssued,
      m.explanationsCalled
    );
    
    const weighted = (m.executionRate * 50) + 
                     ((m.coordinationScore / 5) * 20) + 
                     (m.conductRecognitionIndex * 0.30);
                     
    m.weightedScore = Number(Math.min(99.5, Math.max(30, weighted)).toFixed(1));
    m.overallGradeRemarks = getGradeFromScore(m.weightedScore);
    
    updated.metrics = m;
    updated.acrScore = Math.round(m.weightedScore);
    updated.acrGrade = m.overallGradeRemarks;
  } else if (officer.cadre === 'LAW_BRANCH') {
    const m = { ...(officer.metrics as LawBranchMetrics) };
    const contested = m.casesContestedInCourt || 1;
    m.convictionRate = Number(((m.totalConvictions || 0) / contested).toFixed(4));
    
    m.conductRecognitionIndex = calculateConductRecognitionIndex(
      m.appreciationsReceived,
      m.participationInGoodWork,
      m.violationsShowcausesIssued,
      m.explanationsCalled
    );
    
    const opinionBonus = Math.min(15, (m.filesWithLegalOpinionRendered || 0) * 0.5);
    const highProfileBonus = m.anyHighProfileCase === 'Yes' ? 8 : 0;
    const weighted = (m.convictionRate * 45) + 
                     (m.conductRecognitionIndex * 0.25) + 
                     opinionBonus + 
                     highProfileBonus + 7;
                     
    m.weightedScore = Number(Math.min(99.5, Math.max(30, weighted)).toFixed(1));
    m.overallGradeRemarks = getGradeFromScore(m.weightedScore);
    
    updated.metrics = m;
    updated.acrScore = Math.round(m.weightedScore);
    updated.acrGrade = m.overallGradeRemarks;
  }
  
  return updated;
}

export function getGradeFromScore(score: number): 'Outstanding' | 'Very Good' | 'Good' | 'Satisfactory' | 'Below Average' {
  if (score >= 85) return 'Outstanding';
  if (score >= 75) return 'Very Good';
  if (score >= 65) return 'Good';
  if (score >= 55) return 'Satisfactory';
  return 'Below Average';
}

export function exportDocketJson(officer: Officer): void {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(officer, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `FIA_ISB_ACR_${officer.badgeNo.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportCadreSheetCsv(cadreKey: string, officers: Officer[]): void {
  let headers: string[] = [];
  let rows: string[][] = [];
  let filename = `FIA_ISB_${cadreKey}_${Date.now()}.csv`;

  if (cadreKey === 'SUMMARY') {
    headers = ['Rank / Wing', 'Name', 'Weighted Score (/100)', 'Overall Grade / Remarks'];
    rows = officers.map((o) => {
      const m: any = o.metrics;
      return [
        o.rank,
        o.name,
        String(m.weightedScore ?? o.acrScore ?? 70),
        m.overallGradeRemarks ?? o.acrGrade ?? 'Satisfactory',
      ];
    });
  } else if (cadreKey === 'SI-Inspector-AD') {
    headers = [
      'Sr. No.',
      'Name of SI / Inspector / AD',
      'Enquiries Assigned',
      'Enquiries Closed',
      'Enquiries Merged',
      'Total Cases / FIRs Registered',
      'Total Challans Submitted',
      'Pending Cases',
      'Accused Arrested',
      'Cases Decided in Court',
      'Convictions Obtained',
      'Total Recoveries (PKR)',
      'Violations / Showcauses Issued',
      'Appreciations Received',
      'Explanations Called',
      'Participation in Good Work',
      'Disposal Rate (%)',
      'Challan Rate (%)',
      'Conviction Rate (%)',
      'Conduct & Recognition Index (/100)',
      'Weighted Score (/100)',
      'Overall Grade / Remarks'
    ];
    const filtered = officers.filter(o => o.cadre === 'INVESTIGATION');
    rows = filtered.map((o, idx) => {
      const m = o.metrics as InvestigationMetrics;
      return [
        String(idx + 1),
        o.name,
        String(m.enquiriesAssigned ?? 0),
        String(m.enquiriesClosed ?? 0),
        String(m.enquiriesMerged ?? 0),
        String(m.casesFirRegistered ?? 0),
        String(m.challansSubmitted ?? 0),
        String(m.pendingCases ?? 0),
        String(m.accusedArrested ?? 0),
        String(m.casesDecidedInCourt ?? 0),
        String(m.convictionsObtained ?? 0),
        String(m.totalRecoveriesPkr ?? 0),
        String(m.violationsShowcausesIssued ?? 0),
        String(m.appreciationsReceived ?? 0),
        String(m.explanationsCalled ?? 0),
        String(m.participationInGoodWork ?? 0),
        String(m.disposalRate ?? 0),
        String(m.challanRate ?? 0),
        String(m.convictionRate ?? 0),
        String(m.conductRecognitionIndex ?? 70),
        String(m.weightedScore ?? 70),
        m.overallGradeRemarks ?? 'Satisfactory'
      ];
    });
  } else if (cadreKey === 'ASI') {
    headers = [
      'Sr. No.',
      'Name of ASI',
      'No. of Verifications Entrusted',
      'Verifications Disposed Off',
      'Closed',
      'Converted into Enquiries',
      'Weapon Handling Skill',
      'Violations / Showcauses Issued',
      'Appreciations Received',
      'Explanations Called',
      'Participation in Good Work',
      'Disposal Rate (%)',
      'Conversion Rate (%)',
      'Weapon Handling Score (/5)',
      'Conduct & Recognition Index (/100)',
      'Weighted Score (/100)',
      'Overall Grade / Remarks'
    ];
    const filtered = officers.filter(o => o.cadre === 'ASI');
    rows = filtered.map((o, idx) => {
      const m = o.metrics as AsiMetrics;
      return [
        String(idx + 1),
        o.name,
        String(m.verificationsEntrusted ?? 0),
        String(m.verificationsDisposedOff ?? 0),
        String(m.closed ?? 0),
        String(m.convertedIntoEnquiries ?? 0),
        String(m.weaponHandlingSkill ?? 'Good'),
        String(m.violationsShowcausesIssued ?? 0),
        String(m.appreciationsReceived ?? 0),
        String(m.explanationsCalled ?? 0),
        String(m.participationInGoodWork ?? 0),
        String(m.disposalRate ?? 0),
        String(m.conversionRate ?? 0),
        String(m.weaponHandlingScore ?? 3),
        String(m.conductRecognitionIndex ?? 70),
        String(m.weightedScore ?? 70),
        m.overallGradeRemarks ?? 'Satisfactory'
      ];
    });
  } else if (cadreKey === 'Constable-HeadConstable') {
    headers = [
      'Sr. No.',
      'Name',
      'Rank',
      'Duties Assigned',
      'Times De-assigned / Relieved',
      'Tasks Assigned',
      'Tasks Completed',
      'Deputed with No. of IOs',
      'Raids Conducted',
      'Type of Duty',
      'Willingness to Work',
      'Total Leave (Days)',
      'Discipline',
      'Attitude toward Duty',
      'Hours on Additional Duty',
      'Remarks of Circle Incharge',
      'Violations / Showcauses Issued',
      'Appreciations Received',
      'Explanations Called',
      'Participation in Good Work',
      'Task Completion Rate (%)',
      'Behaviour Score (/100)',
      'Conduct & Recognition Index (/100)',
      'Weighted Score (/100)',
      'Overall Grade / Remarks'
    ];
    const filtered = officers.filter(o => o.cadre === 'CONSTABULARY');
    rows = filtered.map((o, idx) => {
      const m = o.metrics as ConstabularyMetrics;
      return [
        String(idx + 1),
        o.name,
        o.rank,
        String(m.dutiesAssigned ?? 0),
        String(m.timesDeassignedRelieved ?? 0),
        String(m.tasksAssigned ?? 0),
        String(m.tasksCompleted ?? 0),
        String(m.deputedWithNoOfIos ?? 0),
        String(m.raidsConducted ?? 0),
        String(m.typeOfDuty ?? 'Field Duty'),
        String(m.willingnessToWork ?? 'Good'),
        String(m.totalLeaveDays ?? 0),
        String(m.discipline ?? 'Good'),
        String(m.attitudeTowardDuty ?? 'Good'),
        String(m.hoursOnAdditionalDuty ?? 0),
        `"${(m.remarksOfCircleIncharge || '').replace(/"/g, '""')}"`,
        String(m.violationsShowcausesIssued ?? 0),
        String(m.appreciationsReceived ?? 0),
        String(m.explanationsCalled ?? 0),
        String(m.participationInGoodWork ?? 0),
        String(m.taskCompletionRate ?? 0),
        String(m.behaviourScore ?? 60),
        String(m.conductRecognitionIndex ?? 70),
        String(m.weightedScore ?? 70),
        m.overallGradeRemarks ?? 'Satisfactory'
      ];
    });
  } else if (cadreKey === 'Naib-Court') {
    headers = [
      'Sr. No.',
      'Name of Naib Court',
      'Total Summons Executed',
      'Pending Summons',
      'Coordination with Officers',
      'Violations / Showcauses Issued',
      'Appreciations Received',
      'Explanations Called',
      'Participation in Good Work',
      'Execution Rate (%)',
      'Coordination Score (/5)',
      'Conduct & Recognition Index (/100)',
      'Weighted Score (/100)',
      'Overall Grade / Remarks'
    ];
    const filtered = officers.filter(o => o.cadre === 'NAIB_COURT');
    rows = filtered.map((o, idx) => {
      const m = o.metrics as NaibCourtMetrics;
      return [
        String(idx + 1),
        o.name,
        String(m.totalSummonsExecuted ?? 0),
        String(m.pendingSummons ?? 0),
        String(m.coordinationWithOfficers ?? 'Good'),
        String(m.violationsShowcausesIssued ?? 0),
        String(m.appreciationsReceived ?? 0),
        String(m.explanationsCalled ?? 0),
        String(m.participationInGoodWork ?? 0),
        String(m.executionRate ?? 0),
        String(m.coordinationScore ?? 3),
        String(m.conductRecognitionIndex ?? 70),
        String(m.weightedScore ?? 70),
        m.overallGradeRemarks ?? 'Satisfactory'
      ];
    });
  } else if (cadreKey === 'Law-Branch') {
    headers = [
      'Sr. No.',
      'Name of Law Officer',
      'Files with Legal Opinion Rendered',
      'Hours Spent in Court',
      'Hours Spent in Office',
      'Cases Contested in Court',
      'Total Convictions',
      'Total Acquittals',
      'Any High Profile Case',
      'Violations / Showcauses Issued',
      'Appreciations Received',
      'Explanations Called',
      'Participation in Good Work',
      'Conviction Rate (%)',
      'Conduct & Recognition Index (/100)',
      'Weighted Score (/100)',
      'Overall Grade / Remarks'
    ];
    const filtered = officers.filter(o => o.cadre === 'LAW_BRANCH');
    rows = filtered.map((o, idx) => {
      const m = o.metrics as LawBranchMetrics;
      return [
        String(idx + 1),
        o.name,
        String(m.filesWithLegalOpinionRendered ?? 0),
        String(m.hoursSpentInCourt ?? 0),
        String(m.hoursSpentInOffice ?? 0),
        String(m.casesContestedInCourt ?? 0),
        String(m.totalConvictions ?? 0),
        String(m.totalAcquittals ?? 0),
        String(m.anyHighProfileCase ?? 'No'),
        String(m.violationsShowcausesIssued ?? 0),
        String(m.appreciationsReceived ?? 0),
        String(m.explanationsCalled ?? 0),
        String(m.participationInGoodWork ?? 0),
        String(m.convictionRate ?? 0),
        String(m.conductRecognitionIndex ?? 70),
        String(m.weightedScore ?? 70),
        m.overallGradeRemarks ?? 'Satisfactory'
      ];
    });
  }

  const csvContent = "data:text/csv;charset=utf-8," + [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
