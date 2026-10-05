import { jsPDF } from 'jspdf';
import { Officer } from '../types';
import { formatPkr, formatPercent, getCadreDisplayName } from './formatters';

export interface AcrEvaluationData {
  grading?: string;
  acrScore?: number;
  integrityAssessment?: string;
  operationalEfficiencySummary?: string;
  promotionSuitability?: string;
  hqRecommendation?: string;
  keyStrengths?: string[];
  areasForImprovement?: string[];
  officialDossierSummary?: string;
}

/**
 * Computes the detailed mathematical performance analysis for the officer
 * based on cadre benchmarks, disposal velocities, and conduct index.
 */
export function getPerformanceAnalysis(officer: Officer) {
  const m: any = officer.metrics || {};
  const cadre = officer.cadre;

  let formulaSummary = '';
  let efficiencyNote = '';
  let benchmarkRating = '';
  let riskAssessment = 'Minimal / Vigilance Clean';

  if (cadre === 'INVESTIGATION') {
    const disposalPct = Math.round((m.disposalRate || 0) * 100);
    const challanPct = Math.round((m.challanRate || 0) * 100);
    const convictionPct = Math.round((m.convictionRate || 0) * 100);
    const recoveryBonus = Math.min(10, Math.floor((m.totalRecoveriesPkr || 0) / 10000000));
    
    formulaSummary = `Formula: (Disposal ${disposalPct}% × 25) + (Challan ${challanPct}% × 25) + (Conviction ${convictionPct}% × 20) + (Conduct ${m.conductRecognitionIndex || 75}/100 × 20%) + Recovery Bonus (+${recoveryBonus} pts) = ${m.weightedScore || 70}/100`;
    efficiencyNote = disposalPct >= 70 
      ? `Clearance velocity of ${disposalPct}% exceeds the statutory 70% zonal enquiry benchmark. FIR-to-Challan conversion rate is at ${challanPct}%.`
      : `Clearance velocity of ${disposalPct}% is below 70% target. Requires expedited investigation disposals.`;
    benchmarkRating = (m.weightedScore || 0) >= 80 ? 'Top Tier (Zonal Command Bench)' : 'Standard Zonal Performance';
    if ((m.pendingCases || 0) > 8) riskAssessment = 'Moderate backlog in active FIR investigations';
  } else if (cadre === 'ASI') {
    const disposalPct = Math.round((m.disposalRate || 0) * 100);
    const convPct = Math.round((m.conversionRate || 0) * 100);
    const weaponScore = m.weaponHandlingScore || 3;
    
    formulaSummary = `Formula: (Disposal ${disposalPct}% × 40) + (Weapon ${weaponScore}/5 × 20) + (Conduct ${m.conductRecognitionIndex || 75}/100 × 25%) + (Conversion ${convPct}% × 15) = ${m.weightedScore || 70}/100`;
    efficiencyNote = `Disposed of ${m.verificationsDisposedOff || 0} out of ${m.verificationsEntrusted || 0} verifications (${disposalPct}%). Upgraded ${m.convertedIntoEnquiries || 0} matters into formal regular enquiries.`;
    benchmarkRating = disposalPct >= 75 ? 'Exceeds Verification Standard' : 'Average Verification Turnover';
  } else if (cadre === 'CONSTABULARY') {
    const taskPct = Math.round((m.taskCompletionRate || 0) * 100);
    const raidBonus = Math.min(10, (m.raidsConducted || 0) * 0.5);
    
    formulaSummary = `Formula: (Task Execution ${taskPct}% × 35) + (Behaviour Score ${m.behaviourScore || 60}/100 × 35%) + (Conduct ${m.conductRecognitionIndex || 75}/100 × 20%) + Raid Bonus (+${raidBonus} pts) = ${m.weightedScore || 70}/100`;
    efficiencyNote = `Executed ${m.tasksCompleted || 0} of ${m.tasksAssigned || 0} tasks (${taskPct}%). Participated in ${m.raidsConducted || 0} raids with ${m.hoursOnAdditionalDuty || 0} overtime duty hours.`;
    benchmarkRating = (m.discipline === 'Impeccable' || m.discipline === 'Very Good') ? 'High Operational Discipline' : 'Standard Field Standing';
  } else if (cadre === 'NAIB_COURT') {
    const execPct = Math.round((m.executionRate || 0) * 100);
    const coordScore = m.coordinationScore || 3;
    
    formulaSummary = `Formula: (Summons Execution ${execPct}% × 50) + (Officer Coordination ${coordScore}/5 × 20) + (Conduct ${m.conductRecognitionIndex || 75}/100 × 30%) = ${m.weightedScore || 70}/100`;
    efficiencyNote = `Served ${m.totalSummonsExecuted || 0} court summons with ${m.pendingSummons || 0} pending (${execPct}% execution). Attended ${m.courtSessionsAttended || 0} sessions in Special Court Central.`;
    benchmarkRating = execPct >= 85 ? 'Exemplary Court Liaison' : 'Standard Summons Process';
  } else if (cadre === 'LAW_BRANCH') {
    const convPct = Math.round((m.convictionRate || 0) * 100);
    const opinionBonus = Math.min(15, (m.filesWithLegalOpinionRendered || 0) * 0.5);
    const hpBonus = m.anyHighProfileCase === 'Yes' ? 8 : 0;
    
    formulaSummary = `Formula: (Trial Convictions ${convPct}% × 45) + (Conduct ${m.conductRecognitionIndex || 75}/100 × 25%) + Legal Opinion Bonus (+${opinionBonus}) + High-Profile Case (+${hpBonus}) + Base 7 = ${m.weightedScore || 70}/100`;
    efficiencyNote = `Rendered legal opinions on ${m.filesWithLegalOpinionRendered || 0} files. Secured ${m.totalConvictions || 0} convictions in ${m.casesContestedInCourt || 0} contested trials (${convPct}%).`;
    benchmarkRating = convPct >= 70 ? 'High Prosecution Conviction Yield' : 'Moderate Conviction Yield';
  }

  return {
    formulaSummary,
    efficiencyNote,
    benchmarkRating,
    riskAssessment,
  };
}

/**
 * Generates an official, beautifully styled standalone HTML document
 * with ALL indicators, complete performance analytics, conduct sheet, and signatures.
 */
export function generateAcrHtml(
  officer: Officer,
  acrData: AcrEvaluationData | null,
  fallbackAcr: { score: number; grade: string; remarks?: string }
): string {
  const m: any = officer.metrics || {};
  const finalScore = acrData?.acrScore || m.weightedScore || fallbackAcr.score;
  const finalGrade = acrData?.grading || m.overallGradeRemarks || fallbackAcr.grade;
  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const docketId = `FIA-IZ-PER-${officer.badgeNo.replace(/[^0-9]/g, '') || '001'}-${new Date().getFullYear()}`;
  const analysis = getPerformanceAnalysis(officer);

  // Cadre-specific output metrics HTML (ALL indicators included)
  let cadreMetricsRows = '';
  if (officer.cadre === 'INVESTIGATION') {
    cadreMetricsRows = `
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">1. Enquiries Assigned</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${m.enquiriesAssigned || 0} Inquiries</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">2. Enquiries Closed</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; color: #047857; font-weight: bold;">${m.enquiriesClosed || 0} Closed</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">3. Enquiries Merged</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${m.enquiriesMerged || 0} Merged</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">4. Clearance Ratio (Disposal)</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #047857;">${Math.round((m.disposalRate || 0) * 100)}%</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">5. FIRs Registered</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${m.casesFirRegistered || 0} FIRs</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">6. Challans Submitted (Court)</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold;">${m.challansSubmitted || 0} Challans</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">7. Challan Submission Rate</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; color: #047857; font-weight: bold;">${Math.round((m.challanRate || 0) * 100)}%</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">8. Active Pending Cases</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; color: ${(m.pendingCases || 0) > 6 ? '#b91c1c' : '#0f172a'};">${m.pendingCases || 0} Cases</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">9. Accused Apprehended / Arrested</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #6b21a8;">${m.accusedArrested || 0} Accused</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">10. Cases Decided in Court</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${m.casesDecidedInCourt || 0} Concluded</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">11. Court Convictions Secured</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #047857;">${m.convictionsObtained || 0} Convictions</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">12. Prosecution Conviction Rate</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #047857;">${Math.round((m.convictionRate || 0) * 100)}%</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">13. Total State Recoveries</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #047857;" colspan="3">${formatPkr(m.totalRecoveriesPkr || 0)}</td>
      </tr>
    `;
  } else if (officer.cadre === 'ASI') {
    cadreMetricsRows = `
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">1. Verifications Entrusted</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${m.verificationsEntrusted || 0} Files</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">2. Verifications Disposed Off</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; color: #047857; font-weight: bold;">${m.verificationsDisposedOff || 0} Disposed</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">3. Disposal Rate (Verifications)</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #047857;">${Math.round((m.disposalRate || 0) * 100)}%</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">4. Verified & Closed</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${m.closed || 0} Files</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">5. Converted into Enquiries</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #b45309;">${m.convertedIntoEnquiries || 0} Matters</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">6. Conversion Ratio</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${Math.round((m.conversionRate || 0) * 100)}%</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">7. Weapon Handling Skill</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold;">${m.weaponHandlingSkill || 'Good'}</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">8. Weapon Proficiency Score</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold;">${m.weaponHandlingScore || 3} / 5</td>
      </tr>
    `;
  } else if (officer.cadre === 'CONSTABULARY') {
    cadreMetricsRows = `
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">1. Operational Tasks Assigned</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${m.tasksAssigned || 0} Tasks</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">2. Tasks Completed Successfully</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; color: #047857; font-weight: bold;">${m.tasksCompleted || 0} Completed</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">3. Task Execution Rate</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #047857;">${Math.round((m.taskCompletionRate || 0) * 100)}%</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">4. Security & Guard Duties Assigned</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${m.dutiesAssigned || 0} Shifts</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">5. Times Relieved / Deassigned</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${m.timesDeassignedRelieved || 0} Times</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">6. Raids & Search Ops Conducted</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #b45309;">${m.raidsConducted || 0} Raids</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">7. Deputed with Number of IOs</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${m.deputedWithNoOfIos || 0} IOs</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">8. Operational Duty Type</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1;"><strong>${m.typeOfDuty || 'Field Duty'}</strong></td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">9. Willingness to Work & Zeal</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #047857;">${m.willingnessToWork || 'Very Good'}</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">10. Discipline Evaluation</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #047857;">${m.discipline || 'Impeccable'}</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">11. Attitude Toward Duty</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">${m.attitudeTowardDuty || 'Proactive & Professional'}</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">12. Behaviour & Punctuality Score</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold;">${m.behaviourScore || 75} / 100</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">13. Total Leaves Availed</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${m.totalLeaveDays || 0} Days</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">14. Additional / Overtime Hours</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #0369a1;">${m.hoursOnAdditionalDuty || 0} Hours</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">15. Incharge Circle Directives</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1;" colspan="3"><em>${m.remarksOfCircleIncharge || 'Maintains strict compliance with post orders.'}</em></td>
      </tr>
    `;
  } else if (officer.cadre === 'NAIB_COURT') {
    cadreMetricsRows = `
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">1. Total Summons Served / Executed</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #047857;">${m.totalSummonsExecuted || 0} Served</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">2. Pending Summons</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; color: ${(m.pendingSummons || 0) > 5 ? '#b91c1c' : '#0f172a'};">${m.pendingSummons || 0} Pending</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">3. Summons Execution Efficiency Rate</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #047857;">${Math.round((m.executionRate || 0) * 100)}%</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">4. Judicial Sessions Attended</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${m.courtSessionsAttended || 0} Sessions</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">5. Coordination with IOs & Prosecutors</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold;">${m.coordinationWithOfficers || 'Active & Responsive'}</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">6. Coordination Index Score</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold;">${m.coordinationScore || 4} / 5</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">7. Special Court Central Compliance</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1;" colspan="3"><strong>${m.specialCourtCentralCompliance || '100% Punctual Cause List Tracking'}</strong></td>
      </tr>
    `;
  } else if (officer.cadre === 'LAW_BRANCH') {
    cadreMetricsRows = `
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">1. Legal Opinions Rendered on Files</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #0369a1;">${m.filesWithLegalOpinionRendered || 0} Opinions</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">2. Trials Contested in Courts</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${m.casesContestedInCourt || 0} Cases</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">3. Total Court Convictions Secured</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #047857;">${m.totalConvictions || 0} Convictions</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">4. Acquittals / Discharges</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${m.totalAcquittals || 0} Cases</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">5. Prosecution Conviction Ratio</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #047857;">${Math.round((m.convictionRate || 0) * 100)}%</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">6. Courtroom Advocacy Hours</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${m.hoursSpentInCourt || 0} Hours</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">7. Office Scrutiny & Vetting Hours</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${m.hoursSpentInOffice || 0} Hours</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 600;">8. High-Profile Federal Cases</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; color: ${m.anyHighProfileCase === 'Yes' ? '#b45309' : '#0f172a'};">${m.anyHighProfileCase || 'No'}</td>
      </tr>
    `;
  }

  const strengthsList = (acrData?.keyStrengths || [
    'Demonstrated high operational velocity in official case disposals',
    'Maintained accurate and tamper-free day-to-day record documentation',
    'Demonstrated exemplary inter-branch liaison and chain-of-command discipline'
  ]).map((s) => `<li style="margin-bottom: 4px;">${s}</li>`).join('');

  const improvementsList = (acrData?.areasForImprovement || [
    'Maintain strict turnaround timelines on older pending files',
    'Ensure 100% digital synchronisation with Headquarters CMS'
  ]).map((s) => `<li style="margin-bottom: 4px;">${s}</li>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PER / ACR Dossier - ${officer.name} (${officer.badgeNo})</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 15mm 15mm 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.4;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 20px;
    }
    .official-header {
      text-align: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .gov-title {
      font-size: 11pt;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin: 0 0 2px 0;
    }
    .fia-title {
      font-size: 14pt;
      font-weight: 900;
      letter-spacing: 0.5px;
      color: #047857;
      margin: 0 0 3px 0;
    }
    .zone-title {
      font-size: 9.5pt;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 5px 0;
    }
    .form-pill {
      display: inline-block;
      border: 1px solid #0f172a;
      padding: 2px 10px;
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 1px;
      background: #f8fafc;
      text-transform: uppercase;
    }
    .officer-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 10px 14px;
      margin-bottom: 12px;
      border-radius: 4px;
    }
    .officer-name {
      font-size: 13pt;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 2px 0;
    }
    .officer-meta {
      font-size: 9pt;
      color: #334155;
    }
    .score-badge {
      text-align: right;
    }
    .score-num {
      font-size: 20pt;
      font-weight: 900;
      font-family: monospace;
      color: #047857;
      line-height: 1;
    }
    .grade-label {
      font-size: 9pt;
      font-weight: 800;
      color: #0f172a;
    }
    h3 {
      font-size: 10pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #1e293b;
      border-left: 4px solid #047857;
      padding-left: 8px;
      margin: 14px 0 6px 0;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      margin-bottom: 10px;
    }
    .analysis-box {
      border: 1px solid #94a3b8;
      background: #f8fafc;
      padding: 8px 12px;
      font-size: 8.5pt;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    .narrative-box {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      padding: 8px 12px;
      font-size: 9pt;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    .narrative-title {
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 3px;
      display: block;
    }
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .signatures-block {
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
    .signature-item {
      width: 44%;
      text-align: center;
      padding-top: 32px;
      border-top: 1px dashed #0f172a;
      font-size: 8.5pt;
    }
    .footer-note {
      margin-top: 16px;
      border-top: 1px solid #cbd5e1;
      padding-top: 6px;
      display: flex;
      justify-content: space-between;
      font-size: 7.5pt;
      color: #64748b;
      font-family: monospace;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print-controls {
        display: none !important;
      }
      .page-break {
        page-break-before: always;
      }
    }
    .no-print-controls {
      position: sticky;
      top: 0;
      background: #0f172a;
      color: #ffffff;
      padding: 8px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 6px;
      margin-bottom: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .btn-print {
      background: #f59e0b;
      color: #0f172a;
      border: none;
      padding: 6px 14px;
      font-weight: 700;
      border-radius: 4px;
      cursor: pointer;
      font-size: 9.5pt;
    }
  </style>
</head>
<body>

  <!-- Controls visible only in browser view, hidden when printed -->
  <div class="no-print-controls">
    <div>
      <strong>FIA Official Document Preview:</strong> Form ACR-FIA-IZ-2026 (All Indicators & Performance Analysis)
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="btn-print" onclick="window.print();">Print Now (Ctrl + P)</button>
    </div>
  </div>

  <div class="official-header">
    <div class="gov-title">Government of Pakistan · Ministry of Interior</div>
    <div class="fia-title">FEDERAL INVESTIGATION AGENCY</div>
    <div class="zone-title">Islamabad Zone · Regional Headquarters (Sector G-9/4, Islamabad)</div>
    <div class="form-pill">CONFIDENTIAL — ANNUAL PERFORMANCE EVALUATION REPORT (PER / ACR)</div>
  </div>

  <div class="officer-banner">
    <div>
      <div class="officer-name">${officer.name}</div>
      <div class="officer-meta">
        <strong>Rank:</strong> ${officer.rank} &nbsp;|&nbsp; 
        <strong>Badge / Pin:</strong> ${officer.badgeNo} &nbsp;|&nbsp; 
        <strong>Circle:</strong> ${officer.circle} &nbsp;|&nbsp; 
        <strong>Cadre:</strong> ${getCadreDisplayName(officer.cadre)}
      </div>
    </div>
    <div class="score-badge">
      <div class="score-num">${finalScore}<span style="font-size: 11pt; color: #64748b;">/100</span></div>
      <div class="grade-label">RATING: ${finalGrade}</div>
    </div>
  </div>

  <!-- SECTION 1: ALL PRIMARY CADRE INDICATORS -->
  <h3>Part I: Primary Operational Performance Indicators (Complete Cadre Audit)</h3>
  <table class="data-table">
    <tbody>
      ${cadreMetricsRows}
    </tbody>
  </table>

  <!-- SECTION 2: CONDUCT & RECOGNITION PROFILE -->
  <h3>Part II: Conduct, Discipline & Vigilance Record</h3>
  <table class="data-table">
    <tbody>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: 600;">Commendation Certificates (Appreciations)</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #047857;">${m.appreciationsReceived || 0}</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: 600;">Good Work Participations (Operations)</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #047857;">${m.participationInGoodWork || 0}</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: 600;">Showcauses / Violations Issued</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: ${(m.violationsShowcausesIssued || 0) > 0 ? '#b91c1c' : '#0f172a'};">
          ${m.violationsShowcausesIssued || 0}
        </td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: 600;">Administrative Explanations Called</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: ${(m.explanationsCalled || 0) > 0 ? '#b91c1c' : '#0f172a'};">
          ${m.explanationsCalled || 0}
        </td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: 600;">Conduct & Discipline Index (Base 100)</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #0369a1;">${m.conductRecognitionIndex || 75} / 100</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: 600;">Composite Weighted Score</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #047857;">${m.weightedScore || 70} / 100 (${finalGrade})</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 3: DETAILED PERFORMANCE ANALYSIS & FORMULA BREAKDOWN -->
  <h3>Part III: Officer Performance Analysis & Mathematical Scoring Breakdown</h3>
  <div class="analysis-box">
    <div style="font-weight: 700; color: #0f172a; margin-bottom: 4px;">1. Operational Velocity & Disposal Analysis:</div>
    <div style="color: #334155; margin-bottom: 6px; font-size: 8.5pt;">${analysis.efficiencyNote}</div>

    <div style="font-weight: 700; color: #0f172a; margin-bottom: 4px;">2. Cadre Formula Computation & Point Weightages:</div>
    <div style="font-family: monospace; background: #ffffff; padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 3px; font-size: 8pt; color: #047857; margin-bottom: 6px;">
      ${analysis.formulaSummary}
    </div>

    <div class="two-col" style="margin-top: 6px;">
      <div>
        <span style="font-weight: 700; color: #0f172a;">3. Circle & Zonal Standing:</span>
        <span style="color: #047857; font-weight: 600; margin-left: 4px;">${analysis.benchmarkRating}</span>
      </div>
      <div>
        <span style="font-weight: 700; color: #0f172a;">4. Operational Risk & Vigilance:</span>
        <span style="color: #334155; margin-left: 4px;">${analysis.riskAssessment}</span>
      </div>
    </div>
  </div>

  <!-- SECTION 4: QUALITATIVE ASSESSMENT & NARRATIVE -->
  <h3>Part IV: Qualitative Assessment & Administrative Narrative</h3>
  <div class="two-col">
    <div class="narrative-box">
      <span class="narrative-title">Integrity & General Reputation:</span>
      <p style="margin: 0; color: #334155;">
        ${acrData?.integrityAssessment || 'Impeccable and Beyond Reproach. No complaints or vigilance inquiries pending.'}
      </p>
    </div>
    <div class="narrative-box">
      <span class="narrative-title">Promotion Suitability:</span>
      <p style="margin: 0; font-weight: bold; color: #047857;">
        ${acrData?.promotionSuitability || 'Recommended for Promotion in Normal Course'}
      </p>
    </div>
  </div>

  <div class="narrative-box">
    <span class="narrative-title">Operational Velocity & Efficiency Summary:</span>
    <p style="margin: 0; color: #334155;">
      ${acrData?.operationalEfficiencySummary || `Demonstrated high procedural efficiency in ${officer.circle}. Work output adheres to statutory benchmarks.`}
    </p>
  </div>

  <div class="two-col">
    <div class="narrative-box">
      <span class="narrative-title" style="color: #047857;">Key Strengths & Commendations:</span>
      <ul style="margin: 3px 0 0 14px; padding: 0; color: #334155; font-size: 8.5pt;">
        ${strengthsList}
      </ul>
    </div>
    <div class="narrative-box">
      <span class="narrative-title" style="color: #b45309;">Advisory Directives / Areas for Focus:</span>
      <ul style="margin: 3px 0 0 14px; padding: 0; color: #334155; font-size: 8.5pt;">
        ${improvementsList}
      </ul>
    </div>
  </div>

  <div class="narrative-box" style="background: #f1f5f9; border-left: 4px solid #0f172a;">
    <span class="narrative-title">Official HQ Transmission Paragraph:</span>
    <p style="margin: 0; font-style: italic; color: #1e293b;">
      "${acrData?.officialDossierSummary || `The officer ${officer.name} (${officer.badgeNo}) has served in Islamabad Zone with credit. Overall performance is graded as ${finalGrade} (${finalScore}/100). The officer is fit for retention and advancement in current specialized assignment.`}"
    </p>
  </div>

  <div class="signatures-block">
    <div class="signature-item">
      <strong>REPORTING OFFICER</strong><br>
      Circle Incharge / Deputy Director<br>
      FIA ${officer.circle}, Islamabad Zone<br>
      <span style="font-family: monospace; font-size: 7.5pt; color: #64748b;">(Digital Authentication Hash: #IZ-${officer.badgeNo}-REP)</span>
    </div>
    <div class="signature-item">
      <strong>COUNTERSIGNING OFFICER</strong><br>
      Director, FIA Islamabad Zone<br>
      Regional Headquarters (G-9/4 Islamabad)<br>
      <span style="font-family: monospace; font-size: 7.5pt; color: #64748b;">(Countersigned & Verified Seal)</span>
    </div>
  </div>

  <div class="footer-note">
    <span>DOCKET NUMBER: ${docketId}</span>
    <span>EVALUATION DATE: ${dateStr}</span>
    <span>FEDERAL INVESTIGATION AGENCY · OFFICIAL RECORD</span>
  </div>

</body>
</html>`;
}

/**
 * Downloads the docket as an instant standalone HTML file that can be opened
 * in any browser and printed cleanly.
 */
export function downloadAcrHtml(
  officer: Officer,
  acrData: AcrEvaluationData | null,
  fallbackAcr: { score: number; grade: string; remarks?: string }
): void {
  const html = generateAcrHtml(officer, acrData, fallbackAcr);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PER_ACR_FIA_${officer.badgeNo.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().getFullYear()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a clean, official A4 PDF directly using jsPDF
 * containing all indicators, conduct sheet, and performance analysis.
 */
export function downloadAcrPdf(
  officer: Officer,
  acrData: AcrEvaluationData | null,
  fallbackAcr: { score: number; grade: string; remarks?: string }
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const m: any = officer.metrics || {};
  const finalScore = acrData?.acrScore || m.weightedScore || fallbackAcr.score;
  const finalGrade = acrData?.grading || m.overallGradeRemarks || fallbackAcr.grade;
  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const docketId = `FIA-IZ-PER-${officer.badgeNo.replace(/[^0-9]/g, '') || '001'}-${new Date().getFullYear()}`;
  const analysis = getPerformanceAnalysis(officer);

  const marginX = 14;
  let cursorY = 14;

  // Header Banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('GOVERNMENT OF PAKISTAN · MINISTRY OF INTERIOR', 105, cursorY, { align: 'center' });
  
  cursorY += 5;
  doc.setFontSize(13);
  doc.setTextColor(4, 120, 87);
  doc.text('FEDERAL INVESTIGATION AGENCY', 105, cursorY, { align: 'center' });

  cursorY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('ISLAMABAD ZONE · REGIONAL HEADQUARTERS (G-9/4, ISLAMABAD)', 105, cursorY, { align: 'center' });

  cursorY += 4.5;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.line(marginX, cursorY, 210 - marginX, cursorY);

  cursorY += 5;
  doc.setFillColor(241, 245, 249);
  doc.rect(marginX, cursorY, 210 - 2 * marginX, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('CONFIDENTIAL — PERFORMANCE EVALUATION REPORT (PER / ACR)', 105, cursorY + 4.5, { align: 'center' });

  // Officer Profile Card
  cursorY += 10;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, cursorY, 210 - 2 * marginX, 18, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(officer.name, marginX + 4, cursorY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Rank: ${officer.rank}   |   Badge: ${officer.badgeNo}   |   Circle: ${officer.circle}   |   Cadre: ${getCadreDisplayName(officer.cadre)}`, marginX + 4, cursorY + 12);

  // Score Badge right side
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(4, 120, 87);
  doc.text(`${finalScore}/100`, 210 - marginX - 4, cursorY + 7.5, { align: 'right' });

  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`GRADE: ${finalGrade}`, 210 - marginX - 4, cursorY + 13.5, { align: 'right' });

  // SECTION 1: ALL CADRE INDICATORS
  cursorY += 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('PART I: PRIMARY OPERATIONAL INDICATORS (COMPLETE CADRE AUDIT)', marginX, cursorY);

  cursorY += 3;
  const colW = (210 - 2 * marginX) / 2;
  const allCadreMetrics: [string, string][] = [];

  if (officer.cadre === 'INVESTIGATION') {
    allCadreMetrics.push(
      ['1. Enquiries Assigned', `${m.enquiriesAssigned || 0} Files`],
      ['2. Enquiries Closed', `${m.enquiriesClosed || 0} Disposed`],
      ['3. Enquiries Merged', `${m.enquiriesMerged || 0} Files`],
      ['4. Clearance Ratio (Disposal)', `${Math.round((m.disposalRate || 0) * 100)}%`],
      ['5. FIRs Registered', `${m.casesFirRegistered || 0} FIRs`],
      ['6. Challans Submitted', `${m.challansSubmitted || 0} Challans`],
      ['7. Challan Ratio', `${Math.round((m.challanRate || 0) * 100)}%`],
      ['8. Pending Investigation Cases', `${m.pendingCases || 0} Cases`],
      ['9. Accused Apprehended', `${m.accusedArrested || 0} Accused`],
      ['10. Cases Decided in Court', `${m.casesDecidedInCourt || 0} Cases`],
      ['11. Convictions Obtained', `${m.convictionsObtained || 0} Convictions`],
      ['12. Prosecution Conviction Rate', `${Math.round((m.convictionRate || 0) * 100)}%`],
      ['13. Total State Recoveries', formatPkr(m.totalRecoveriesPkr || 0)],
      ['14. Recovery Bonus Earned', `+${Math.min(10, Math.floor((m.totalRecoveriesPkr || 0) / 10000000))} Points`]
    );
  } else if (officer.cadre === 'ASI') {
    allCadreMetrics.push(
      ['1. Verifications Entrusted', `${m.verificationsEntrusted || 0} Files`],
      ['2. Verifications Disposed Off', `${m.verificationsDisposedOff || 0} Files`],
      ['3. Verification Disposal Rate', `${Math.round((m.disposalRate || 0) * 100)}%`],
      ['4. Inquiries Verified & Closed', `${m.closed || 0} Files`],
      ['5. Converted into Enquiries', `${m.convertedIntoEnquiries || 0} Files`],
      ['6. Inquiries Conversion Ratio', `${Math.round((m.conversionRate || 0) * 100)}%`],
      ['7. Weapon Handling Skill Tier', `${m.weaponHandlingSkill || 'Good'}`],
      ['8. Weapon Handling Score', `${m.weaponHandlingScore || 3} / 5`]
    );
  } else if (officer.cadre === 'CONSTABULARY') {
    allCadreMetrics.push(
      ['1. Operational Tasks Assigned', `${m.tasksAssigned || 0} Tasks`],
      ['2. Tasks Completed', `${m.tasksCompleted || 0} Completed`],
      ['3. Task Completion Rate', `${Math.round((m.taskCompletionRate || 0) * 100)}%`],
      ['4. Shift Duties Assigned', `${m.dutiesAssigned || 0} Duties`],
      ['5. Times Deassigned / Relieved', `${m.timesDeassignedRelieved || 0} Times`],
      ['6. Raids & Search Ops Conducted', `${m.raidsConducted || 0} Raids`],
      ['7. Deputed with Number of IOs', `${m.deputedWithNoOfIos || 0} IOs`],
      ['8. Primary Duty Type', `${m.typeOfDuty || 'Field Duty'}`],
      ['9. Willingness to Work', `${m.willingnessToWork || 'Very Good'}`],
      ['10. Discipline Evaluation', `${m.discipline || 'Impeccable'}`],
      ['11. Attitude Toward Duty', `${m.attitudeTowardDuty || 'Proactive'}`],
      ['12. Behaviour & Punctuality Score', `${m.behaviourScore || 75} / 100`],
      ['13. Total Leave Days', `${m.totalLeaveDays || 0} Days`],
      ['14. Additional Duty Overtime', `${m.hoursOnAdditionalDuty || 0} Hours`]
    );
  } else if (officer.cadre === 'NAIB_COURT') {
    allCadreMetrics.push(
      ['1. Summons Executed', `${m.totalSummonsExecuted || 0} Served`],
      ['2. Pending Summons', `${m.pendingSummons || 0} Pending`],
      ['3. Summons Execution Rate', `${Math.round((m.executionRate || 0) * 100)}%`],
      ['4. Judicial Sessions Attended', `${m.courtSessionsAttended || 0} Sessions`],
      ['5. Liaison Coordination Skill', `${m.coordinationWithOfficers || 'Active & Responsive'}`],
      ['6. Coordination Score', `${m.coordinationScore || 4} / 5`],
      ['7. Special Court Compliance', `${m.specialCourtCentralCompliance || '100% Punctual'}`],
      ['8. Courtroom Conduct Rating', 'Exemplary Compliance']
    );
  } else {
    allCadreMetrics.push(
      ['1. Legal Opinions Rendered', `${m.filesWithLegalOpinionRendered || 0} Opinions`],
      ['2. Cases Contested in Court', `${m.casesContestedInCourt || 0} Cases`],
      ['3. Convictions Secured', `${m.totalConvictions || 0} Convictions`],
      ['4. Acquittals / Discharges', `${m.totalAcquittals || 0} Cases`],
      ['5. Trial Conviction Rate', `${Math.round((m.convictionRate || 0) * 100)}%`],
      ['6. Courtroom Advocacy Hours', `${m.hoursSpentInCourt || 0} hrs`],
      ['7. Office Scrutiny & Vetting Hours', `${m.hoursSpentInOffice || 0} hrs`],
      ['8. High Profile Case Handled', `${m.anyHighProfileCase || 'No'}`]
    );
  }

  // Draw two-column metrics table
  for (let i = 0; i < allCadreMetrics.length; i += 2) {
    const leftItem = allCadreMetrics[i];
    const rightItem = allCadreMetrics[i + 1];

    doc.setFillColor(i % 4 === 0 ? 250 : 255, 250, 250);
    doc.rect(marginX, cursorY, 210 - 2 * marginX, 5.2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(71, 85, 105);
    doc.text(leftItem[0] + ':', marginX + 2.5, cursorY + 3.8);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(leftItem[1], marginX + colW - 3, cursorY + 3.8, { align: 'right' });

    if (rightItem) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(rightItem[0] + ':', marginX + colW + 2.5, cursorY + 3.8);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(rightItem[1], 210 - marginX - 3, cursorY + 3.8, { align: 'right' });
    }

    cursorY += 5.2;
  }

  // SECTION 2: CONDUCT & VIGILANCE SHEET
  cursorY += 2;
  doc.setFillColor(241, 245, 249);
  doc.rect(marginX, cursorY, 210 - 2 * marginX, 5.2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);
  doc.text('Commendations / Good Work:', marginX + 2.5, cursorY + 3.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(4, 120, 87);
  doc.text(`${m.appreciationsReceived || 0} Appreciations / ${m.participationInGoodWork || 0} Good Works`, marginX + colW - 3, cursorY + 3.8, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Showcauses / Explanations:', marginX + colW + 2.5, cursorY + 3.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${m.violationsShowcausesIssued || 0} Violations (Conduct Index: ${m.conductRecognitionIndex || 75}/100)`, 210 - marginX - 3, cursorY + 3.8, { align: 'right' });

  // SECTION 3: PERFORMANCE ANALYSIS & FORMULA BREAKDOWN
  cursorY += 9;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('PART II: OFFICER PERFORMANCE ANALYSIS & MATHEMATICAL BREAKDOWN', marginX, cursorY);

  cursorY += 3;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(marginX, cursorY, 210 - 2 * marginX, 22, 1, 1, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Operational Velocity Note:', marginX + 3, cursorY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const splitEff = doc.splitTextToSize(analysis.efficiencyNote, 210 - 2 * marginX - 48);
  doc.text(splitEff, marginX + 44, cursorY + 4.5);

  const formulaY = cursorY + 10;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. Cadre Formula Breakdown:', marginX + 3, formulaY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(4, 120, 87);
  const splitFormula = doc.splitTextToSize(analysis.formulaSummary, 210 - 2 * marginX - 48);
  doc.text(splitFormula, marginX + 44, formulaY);

  const standingY = cursorY + 17;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`3. Standing: ${analysis.benchmarkRating}   |   4. Vigilance & Risk: ${analysis.riskAssessment}`, marginX + 3, standingY);

  // SECTION 4: QUALITATIVE ASSESSMENT
  cursorY += 28;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('PART III: QUALITATIVE ASSESSMENT & ADMINISTRATIVE NARRATIVE', marginX, cursorY);

  cursorY += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Integrity Rating:', marginX, cursorY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const integrityText = acrData?.integrityAssessment || 'Impeccable and Beyond Reproach. No complaints or vigilance inquiries pending.';
  doc.text(integrityText, marginX + 30, cursorY);

  cursorY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Promotion Suitability:', marginX, cursorY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(4, 120, 87);
  doc.text(acrData?.promotionSuitability || 'Recommended for Promotion in Normal Course', marginX + 30, cursorY);

  cursorY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('HQ Recommendation:', marginX, cursorY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const hqRec = acrData?.hqRecommendation || 'Suitable for retention in specialized circle squad.';
  doc.text(hqRec, marginX + 30, cursorY);

  // Transmission Summary Box
  cursorY += 6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  const transmittal = `Transmittal Paragraph: "${acrData?.officialDossierSummary || `The officer ${officer.name} (${officer.badgeNo}) has served in Islamabad Zone with credit. Overall performance is graded as ${finalGrade} (${finalScore}/100). Recommended for retention and progression.`}"`;
  const splitTrans = doc.splitTextToSize(transmittal, 210 - 2 * marginX - 6);
  const boxHeight = splitTrans.length * 3.6 + 5;
  doc.roundedRect(marginX, cursorY, 210 - 2 * marginX, boxHeight, 1, 1, 'FD');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.2);
  doc.setTextColor(30, 41, 59);
  doc.text(splitTrans, marginX + 3, cursorY + 4);

  cursorY += boxHeight + 11;

  // SECTION 5: SIGNATURES BLOCK
  doc.setFont('helvetica', 'normal');
  doc.setDrawColor(15, 23, 42);
  doc.setLineDashPattern([1, 1], 0);

  doc.line(marginX + 5, cursorY, marginX + 65, cursorY);
  doc.line(210 - marginX - 65, cursorY, 210 - marginX - 5, cursorY);

  cursorY += 3.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('REPORTING OFFICER', marginX + 35, cursorY, { align: 'center' });
  doc.text('COUNTERSIGNING OFFICER', 210 - marginX - 35, cursorY, { align: 'center' });

  cursorY += 3.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`Circle Incharge / Deputy Director\nFIA ${officer.circle}`, marginX + 35, cursorY, { align: 'center' });
  doc.text('Director, FIA Islamabad Zone\nRegional Headquarters (G-9/4)', 210 - marginX - 35, cursorY, { align: 'center' });

  // Bottom Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`DOCKET: ${docketId}   |   DATE: ${dateStr}   |   ALL INDICATORS & PERFORMANCE AUDIT INCLUDED`, 105, 290, { align: 'center' });

  doc.save(`PER_ACR_FIA_${officer.badgeNo.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().getFullYear()}.pdf`);
}

/**
 * Downloads today's operational daily duty roster as a clean A4 PDF.
 */
export function downloadRosterPdf(tasks: any[], activities: any[], officers: Officer[]): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const marginX = 16;
  let cursorY = 16;
  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('GOVERNMENT OF PAKISTAN · MINISTRY OF INTERIOR', 105, cursorY, { align: 'center' });

  cursorY += 6;
  doc.setFontSize(14);
  doc.setTextColor(4, 120, 87);
  doc.text('FEDERAL INVESTIGATION AGENCY — ISLAMABAD ZONE', 105, cursorY, { align: 'center' });

  cursorY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`DAILY OPERATIONAL DUTY ROSTER & TASK DIRECTIVES · ${dateStr}`, 105, cursorY, { align: 'center' });

  cursorY += 6;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.line(marginX, cursorY, 210 - marginX, cursorY);

  cursorY += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`ACTIVE TASKS & SOP ALLOCATIONS (${tasks.length})`, marginX, cursorY);

  cursorY += 4;
  doc.setFillColor(241, 245, 249);
  doc.rect(marginX, cursorY, 210 - 2 * marginX, 6.5, 'FD');
  doc.setFontSize(7.5);
  doc.text('TASK / SOP DIRECTIVE', marginX + 3, cursorY + 4.5);
  doc.text('ASSIGNED OFFICER', marginX + 80, cursorY + 4.5);
  doc.text('PRIORITY', marginX + 130, cursorY + 4.5);
  doc.text('STATUS', 210 - marginX - 5, cursorY + 4.5, { align: 'right' });

  cursorY += 6.5;

  const displayTasks = tasks.slice(0, 16);
  for (const t of displayTasks) {
    const officer = officers.find((o) => o.id === t.officerId);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);

    const title = t.title.length > 40 ? t.title.substring(0, 38) + '...' : t.title;
    doc.text(title, marginX + 3, cursorY + 4.5);

    const officerName = officer ? `${officer.name} (${officer.rank})` : 'Unassigned';
    doc.text(officerName, marginX + 80, cursorY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(t.priority === 'CRITICAL' ? 185 : 30, t.priority === 'CRITICAL' ? 28 : 41, 59);
    doc.text(t.priority, marginX + 130, cursorY + 4.5);

    doc.setTextColor(t.status === 'Completed' ? 4 : 180, t.status === 'Completed' ? 120 : 83, t.status === 'Completed' ? 87 : 9);
    doc.text(t.status, 210 - marginX - 5, cursorY + 4.5, { align: 'right' });

    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, cursorY + 6, 210 - marginX, cursorY + 6);
    cursorY += 6;
  }

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`AUTHENTICATED BY ZONAL DUTY INCHARGE · ISLAMABAD ZONE · ${dateStr}`, 105, 290, { align: 'center' });

  doc.save(`FIA_ISB_ROSTER_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * High-reliability print handler that supports standard browsers,
 * handles iframe sandboxes gracefully, and reports failure to offer instant download.
 */
export async function executePrintOrFallback(
  officer: Officer,
  acrData: AcrEvaluationData | null,
  fallbackAcr: { score: number; grade: string; remarks?: string }
): Promise<{ success: boolean; reason?: 'IFRAME_RESTRICTION' | 'UNKNOWN' }> {
  try {
    window.print();
    return { success: true };
  } catch (err: any) {
    console.warn('[FIA Print System] window.print blocked by iframe sandbox or browser policy:', err);
    return { success: false, reason: 'IFRAME_RESTRICTION' };
  }
}
