export type Cadre = 
  | 'INVESTIGATION' 
  | 'ASI' 
  | 'CONSTABULARY' 
  | 'NAIB_COURT' 
  | 'LAW_BRANCH';

export type Rank =
  | 'AD (Assistant Director)'
  | 'Inspector'
  | 'Sub-Inspector (SI)'
  | 'Assistant Sub-Inspector (ASI)'
  | 'Head Constable (HC)'
  | 'Constable (PC)'
  | 'Naib Court'
  | 'AD Law / Prosecutor';

export type Circle =
  | 'Anti-Corruption Circle (ACC)'
  | 'Cyber Crime Circle (CCC)'
  | 'Anti-Human Trafficking Circle (AHTC)'
  | 'Commercial Banking Circle (CBC)'
  | 'Counter Terrorism Wing (CTW)'
  | 'Zone Legal & Prosecution Wing'
  | (string & {});

export interface CircleDefinition {
  id: string;
  name: string;
  code: string;
  inchargeName: string;
  inchargeRank: string;
  inchargeOfficerId?: string;
  jurisdiction: string;
  headquarters: string;
  contactNo: string;
  securityClassification: 'RESTRICTED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP SECRET';
  establishedYear?: string;
  description?: string;
  isDefault?: boolean;
}

// Base conduct indicators common to all cadres
export interface ConductRecognitionMetrics {
  violationsShowcausesIssued: number;
  appreciationsReceived: number;
  explanationsCalled: number;
  participationInGoodWork: number;
  conductRecognitionIndex: number; // e.g. 75 / 100
  weightedScore: number; // e.g. 67.7 / 100
  overallGradeRemarks: 'Outstanding' | 'Very Good' | 'Good' | 'Satisfactory' | 'Below Average';
}

// 1. SI - Inspector - AD
export interface InvestigationMetrics extends ConductRecognitionMetrics {
  enquiriesAssigned: number;
  enquiriesClosed: number;
  enquiriesMerged: number;
  casesFirRegistered: number;
  challansSubmitted: number;
  pendingCases: number;
  accusedArrested: number;
  casesDecidedInCourt: number;
  convictionsObtained: number;
  totalRecoveriesPkr: number;
  // Computed rates
  disposalRate: number; // e.g. 0.45 (45%)
  challanRate: number; // e.g. 0.833 (83.3%)
  convictionRate: number; // e.g. 0.60 (60%)
}

// 2. ASI
export interface AsiMetrics extends ConductRecognitionMetrics {
  verificationsEntrusted: number;
  verificationsDisposedOff: number;
  closed: number;
  convertedIntoEnquiries: number;
  weaponHandlingSkill: 'Excellent' | 'Very Good' | 'Good' | 'Fair' | 'Needs Improvement';
  weaponHandlingScore: number; // e.g. 3 / 5
  // Computed rates
  disposalRate: number; // e.g. 0.80 (80%)
  conversionRate: number; // e.g. 0.30 (30%)
}

// 3. Constable - Head Constable
export interface ConstabularyMetrics extends ConductRecognitionMetrics {
  dutiesAssigned: number;
  timesDeassignedRelieved: number;
  tasksAssigned: number;
  tasksCompleted: number;
  deputedWithNoOfIos: number;
  raidsConducted: number;
  typeOfDuty: 'Field Duty' | 'Raid Party' | 'VIP & Witness Escort' | 'Surveillance' | 'Court Transit' | 'General Guard' | 'Evidence Transport';
  willingnessToWork: 'Excellent' | 'Very Good' | 'Good' | 'Fair' | 'Needs Motivation';
  totalLeaveDays: number;
  discipline: 'Impeccable' | 'Very Good' | 'Good' | 'Fair' | 'Warning Issued';
  attitudeTowardDuty: 'Proactive & Professional' | 'Very Good' | 'Good' | 'Cooperative' | 'Routine' | 'Hesitant';
  hoursOnAdditionalDuty: number;
  remarksOfCircleIncharge: string;
  // Computed rates
  taskCompletionRate: number; // e.g. 0.8667 (86.7%)
  behaviourScore: number; // e.g. 60 / 100
}

// 4. Naib Court
export interface NaibCourtMetrics extends ConductRecognitionMetrics {
  totalSummonsExecuted: number;
  pendingSummons: number;
  coordinationWithOfficers: 'Excellent' | 'Very Good' | 'Good' | 'Fair' | 'Poor';
  coordinationScore: number; // e.g. 3 / 5
  courtSessionsAttended: number;
  specialCourtCentralCompliance: string;
  // Computed rates
  executionRate: number; // e.g. 0.90 (90%)
}

// 5. Law Branch
export interface LawBranchMetrics extends ConductRecognitionMetrics {
  filesWithLegalOpinionRendered: number;
  hoursSpentInCourt: number;
  hoursSpentInOffice: number;
  casesContestedInCourt: number;
  totalConvictions: number;
  totalAcquittals: number;
  anyHighProfileCase: 'Yes' | 'No';
  highProfileCaseDetails?: string[];
  // Computed rates
  convictionRate: number; // e.g. 0.7143 (71.4%)
}

export type OfficerMetrics = 
  | InvestigationMetrics 
  | AsiMetrics 
  | ConstabularyMetrics 
  | NaibCourtMetrics 
  | LawBranchMetrics;

export interface Officer {
  id: string;
  srNo?: number;
  name: string;
  badgeNo: string;
  beltNo?: string;
  cadre: Cadre;
  rank: Rank;
  circle: Circle;
  phone: string;
  cnic: string;
  postingDuration: string;
  status: 'Active Duty' | 'On Leave' | 'Court Deputation' | 'Special Assignment';
  metrics: OfficerMetrics;
  lastUpdated: string;
  acrScore?: number;
  acrGrade?: string;
  isBenchmarkSample?: boolean;
  sheetName?: string;
}

export interface OfficerTask {
  id: string;
  officerId: string;
  officerName: string;
  cadre: Cadre;
  title: string;
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'Completed' | 'In Progress' | 'Pending';
  assignedDate: string;
  dueDate: string;
  completionDate?: string;
  assignedBy: string;
  circle: string;
}

export interface DailyActivityLog {
  id: string;
  officerId: string;
  officerName: string;
  cadre: Cadre;
  date: string;
  time: string;
  activityTitle: string;
  details: string;
  hoursSpent: number;
  category: string;
  verificationStatus: 'Verified by Incharge' | 'Pending Review' | 'Flagged';
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  targetOfficer: string;
  details: string;
}

export interface AcrEvaluation {
  acrScore: number;
  grading: string;
  integrityAssessment: string;
  operationalEfficiencySummary: string;
  keyStrengths: string[];
  areasForImprovement: string[];
  promotionSuitability: string;
  officialDossierSummary: string;
  hqRecommendation: string;
  conductIndexAssessment?: string;
  generatedAt: string;
}

export interface ZoneExecutiveBrief {
  zoneReadinessRating: string;
  executiveSummary: string;
  investigationPace: string;
  courtAndProsecutionAnalysis: string;
  constabularyAndRaidsHealth: string;
  priorityBottlenecks: string[];
  commandDirectives: string[];
  circleRankings?: { circle: string; score: number; status: string }[];
  generatedAt?: string;
}
