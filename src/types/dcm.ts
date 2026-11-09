export type DcmClassification = 
  | 'Open'
  | 'Emerging concern'
  | 'Constrained'
  | 'Severely constrained'
  | 'Insufficient evidence';

export type RightOfResponseStatus =
  | 'Not required'
  | 'Pending'
  | 'Requested'
  | 'Response received'
  | 'Response incorporated'
  | 'No response received';

export type DcmPublicationStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export type DcmConfidence = 'High' | 'Medium' | 'Low';
export type DcmDirection = 'newly-classified' | 'deteriorating' | 'improving' | 'stable' | 'insufficient-basis';

export const DCM_CONFIDENCE_LEVELS: DcmConfidence[] = ['High', 'Medium', 'Low'];
export const DCM_DIRECTIONS: { value: DcmDirection; label: string }[] = [
  { value: 'newly-classified', label: 'Newly classified' },
  { value: 'deteriorating', label: 'Deteriorating' },
  { value: 'insufficient-basis', label: 'Insufficient basis' },
  { value: 'improving', label: 'Improving' },
  { value: 'stable', label: 'Stable' }
];

export interface DcmStateRecord {
  stateCode: string;
  stateName: string;
  classification: DcmClassification;
  direction?: DcmDirection | string;
  confidence?: DcmConfidence | string;
  keyFinding?: string;
  classificationRationale?: string;
  evidenceSummary?: string;
  rightOfResponseStatus?: RightOfResponseStatus;
  supportingSource?: string;
  internalNotes?: string;
}

export interface DcmPublication {
  id: string; // e.g., 'dcm-2026-10-15'
  title: string;
  year: number;
  month: number; // 1-12
  periodIndex: number; // 1 (1st-15th) or 2 (16th-end)
  periodStart: string;
  periodEnd: string;
  reportingPeriodLabel: string; // e.g. "1st – 15th October 2026"
  publicationDate: string; // e.g. "16 October 2026"
  evidenceCutoffDate: string; // e.g. "15 October 2026"
  methodologyVersion: string; // e.g. "Version 1.1"
  revisionNote?: string;
  status: DcmPublicationStatus;
  isLatest: boolean;
  isBaseline?: boolean;
  summary: string;
  changesSummary?: string;
  supportingDocumentUrl?: string;
  classifications: Record<string, DcmStateRecord>; // exactly 37 entries keyed by state code
  createdAt: number;
  updatedAt: number;
}

export interface DcmStateChange {
  stateCode: string;
  stateName: string;
  previousClassification: DcmClassification;
  newClassification: DcmClassification;
  rationale?: string;
  rightOfResponseStatus?: RightOfResponseStatus;
  changeType: 'changed' | 'first-classification' | 'returned-to-insufficient';
}

export interface DcmComparisonResult {
  hasPrevious: boolean;
  previousPublication?: DcmPublication;
  changedStates: DcmStateChange[];
  totalChanged: number;
  isBaseline: boolean;
  methodologyChanged: boolean;
}

export interface NigeriaJurisdiction {
  code: string;
  name: string;
  zone: string;
}

export const DCM_CLASSIFICATIONS: DcmClassification[] = [
  'Open',
  'Emerging concern',
  'Constrained',
  'Severely constrained',
  'Insufficient evidence'
];

export const RIGHT_OF_RESPONSE_OPTIONS: RightOfResponseStatus[] = [
  'Not required',
  'Pending',
  'Requested',
  'Response received',
  'Response incorporated',
  'No response received'
];

export const DCM_COLORS: Record<DcmClassification, {
  name: string;
  fill: string;
  text: string;
  border: string;
  badgeBg: string;
  badgeText: string;
  description: string;
}> = {
  'Open': {
    name: 'Green — Open',
    fill: '#10B981',
    text: '#065F46',
    border: '#059669',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700 border-emerald-200',
    description: 'Evidence indicates broadly equal practical political access without verified material or discriminatory restrictions.'
  },
  'Emerging concern': {
    name: 'Amber — Emerging Concern',
    fill: '#F59E0B',
    text: '#92400E',
    border: '#D97706',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800 border-amber-200',
    description: 'Material concerns exist affecting political competition, but evidence does not yet establish a sustained restrictive pattern.'
  },
  'Constrained': {
    name: 'Orange — Constrained',
    fill: '#F97316',
    text: '#9A3412',
    border: '#EA580C',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-800 border-orange-200',
    description: 'Verified incidents or patterns materially restricting political competition.'
  },
  'Severely constrained': {
    name: 'Red — Severely Constrained',
    fill: '#EF4444',
    text: '#991B1B',
    border: '#DC2626',
    badgeBg: 'bg-red-50',
    badgeText: 'text-red-800 border-red-200',
    description: 'Evidence establishes serious and sustained restrictions substantially undermining fair political competition.'
  },
  'Insufficient evidence': {
    name: 'Grey — Insufficient Evidence',
    fill: '#94A3B8',
    text: '#334155',
    border: '#64748B',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700 border-slate-300',
    description: 'Available verified evidence does not meet the threshold required to reach a responsible classification.'
  }
};

// All 36 Nigerian States + FCT in official alphabetical order
export const NIGERIA_37_JURISDICTIONS: NigeriaJurisdiction[] = [
  { code: 'AB', name: 'Abia', zone: 'South East' },
  { code: 'AD', name: 'Adamawa', zone: 'North East' },
  { code: 'AK', name: 'Akwa Ibom', zone: 'South South' },
  { code: 'AN', name: 'Anambra', zone: 'South East' },
  { code: 'BA', name: 'Bauchi', zone: 'North East' },
  { code: 'BY', name: 'Bayelsa', zone: 'South South' },
  { code: 'BE', name: 'Benue', zone: 'North Central' },
  { code: 'BO', name: 'Borno', zone: 'North East' },
  { code: 'CR', name: 'Cross River', zone: 'South South' },
  { code: 'DE', name: 'Delta', zone: 'South South' },
  { code: 'EB', name: 'Ebonyi', zone: 'South East' },
  { code: 'ED', name: 'Edo', zone: 'South South' },
  { code: 'EK', name: 'Ekiti', zone: 'South West' },
  { code: 'EN', name: 'Enugu', zone: 'South East' },
  { code: 'FC', name: 'FCT', zone: 'North Central' },
  { code: 'GO', name: 'Gombe', zone: 'North East' },
  { code: 'IM', name: 'Imo', zone: 'South East' },
  { code: 'JI', name: 'Jigawa', zone: 'North West' },
  { code: 'KD', name: 'Kaduna', zone: 'North West' },
  { code: 'KN', name: 'Kano', zone: 'North West' },
  { code: 'KT', name: 'Katsina', zone: 'North West' },
  { code: 'KE', name: 'Kebbi', zone: 'North West' },
  { code: 'KO', name: 'Kogi', zone: 'North Central' },
  { code: 'KW', name: 'Kwara', zone: 'North Central' },
  { code: 'LA', name: 'Lagos', zone: 'South West' },
  { code: 'NA', name: 'Nasarawa', zone: 'North Central' },
  { code: 'NI', name: 'Niger', zone: 'North Central' },
  { code: 'OG', name: 'Ogun', zone: 'South West' },
  { code: 'OD', name: 'Ondo', zone: 'South West' },
  { code: 'OS', name: 'Osun', zone: 'South West' },
  { code: 'OY', name: 'Oyo', zone: 'South West' },
  { code: 'PL', name: 'Plateau', zone: 'North Central' },
  { code: 'RI', name: 'Rivers', zone: 'South South' },
  { code: 'SO', name: 'Sokoto', zone: 'North West' },
  { code: 'TA', name: 'Taraba', zone: 'North East' },
  { code: 'YO', name: 'Yobe', zone: 'North East' },
  { code: 'ZA', name: 'Zamfara', zone: 'North West' }
];

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
