import { DcmPublication, NIGERIA_37_JURISDICTIONS, DcmClassification } from '../types/dcm';

// Helper to build a full 37-jurisdiction map
function buildJurisdictionMap(
  overrides: Record<string, {
    classification: DcmClassification;
    direction?: string;
    confidence?: string;
    keyFinding?: string;
    rationale?: string;
    evidence?: string;
    response?: any;
  }>
) {
  const result: Record<string, any> = {};
  for (const j of NIGERIA_37_JURISDICTIONS) {
    const o = overrides[j.code] || overrides[j.name];
    if (o) {
      result[j.code] = {
        stateCode: j.code,
        stateName: j.name,
        classification: o.classification,
        direction: o.direction || (o.classification === 'Insufficient evidence' ? 'insufficient-basis' : 'newly-classified'),
        confidence: o.confidence || (o.classification === 'Insufficient evidence' ? 'Low' : 'Medium'),
        keyFinding: o.keyFinding || o.rationale || o.evidence || '',
        classificationRationale: o.rationale || '',
        evidenceSummary: o.evidence || '',
        rightOfResponseStatus: o.response || 'Not required'
      };
    } else {
      result[j.code] = {
        stateCode: j.code,
        stateName: j.name,
        classification: 'Insufficient evidence' as DcmClassification,
        direction: 'insufficient-basis',
        confidence: 'Low',
        keyFinding: 'Insufficient verified evidence held by AEO for classification.',
        classificationRationale: '',
        evidenceSummary: '',
        rightOfResponseStatus: 'Not required'
      };
    }
  }
  return result;
}

// 1. Baseline Publication (July – September 2026)
export const DCM_PUBLICATION_BASELINE: DcmPublication = {
  id: 'dcm-2026-09-30',
  title: 'Democratic Competitiveness Map: Baseline Assessment',
  year: 2026,
  month: 9,
  periodIndex: 0,
  periodStart: '2026-07-01',
  periodEnd: '2026-09-30',
  reportingPeriodLabel: '1st July – 30th September 2026',
  publicationDate: '30 September 2026',
  evidenceCutoffDate: '28 September 2026',
  methodologyVersion: 'Version 1.0',
  revisionNote: 'Initial baseline publication establishing comparative monitoring benchmark across all 36 states and the FCT.',
  status: 'published',
  isLatest: false,
  isBaseline: true,
  summary: "Initial national assessment evaluating political competition space across Nigeria ahead of the 2027 general elections. Concerns around political mobilisation are evident in Benue, Delta and Enugu, while campaign-access issues have emerged in Anambra, Abia, Imo, Kaduna, Kogi, Osun and Rivers.",
  changesSummary: 'Baseline publication — establishes the initial comparative benchmark. No earlier publication exists for comparison.',
  classifications: buildJurisdictionMap({
    BE: {
      classification: 'Constrained',
      direction: 'newly-classified',
      confidence: 'High',
      keyFinding: 'Material restrictions and security concerns affecting political mobilisation across multiple LGAs.',
      rationale: 'Material restrictions and security concerns affecting political mobilisation across multiple LGAs.',
      evidence: 'Verified disruption of party assembly and public rally access.',
      response: 'Requested'
    },
    DE: {
      classification: 'Constrained',
      direction: 'newly-classified',
      confidence: 'High',
      keyFinding: 'Verified interference with opposition campaign mobilisation and logistical movement.',
      rationale: 'Verified interference with opposition campaign mobilisation and logistical movement.',
      evidence: 'Documented obstruction of peaceful political gatherings.',
      response: 'Requested'
    },
    EN: {
      classification: 'Constrained',
      direction: 'newly-classified',
      confidence: 'High',
      keyFinding: 'Contested access to political assembly and documented security incidents affecting party offices.',
      rationale: 'Contested access to political assembly and documented security incidents affecting party offices.',
      evidence: 'Reports of venue denials and physical confrontation at political secretariat.',
      response: 'Pending'
    },
    AB: {
      classification: 'Emerging concern',
      direction: 'newly-classified',
      confidence: 'Medium',
      keyFinding: 'Emerging pressure on party campaign signages and localized assembly friction.',
      rationale: 'Emerging pressure on party campaign signages and localized assembly friction.',
      evidence: 'Verified municipal enforcement with discriminatory impact on opposition visibility.',
      response: 'Not required'
    },
    AN: {
      classification: 'Emerging concern',
      direction: 'newly-classified',
      confidence: 'Medium',
      keyFinding: 'Security concerns and movement restrictions impacting evening and weekend voter mobilisation.',
      rationale: 'Security concerns and movement restrictions impacting evening and weekend voter mobilisation.',
      evidence: 'Independent field observer reports documenting campaign access limitations.',
      response: 'Not required'
    },
    IM: {
      classification: 'Emerging concern',
      direction: 'newly-classified',
      confidence: 'Medium',
      keyFinding: 'Unresolved disputes and heightened security tension affecting political gatherings in rural constituencies.',
      rationale: 'Unresolved disputes and heightened security tension affecting political gatherings in rural constituencies.',
      evidence: 'Documentation of intimidation reports submitted to security authorities.',
      response: 'Not required'
    },
    KD: {
      classification: 'Emerging concern',
      direction: 'newly-classified',
      confidence: 'Medium',
      keyFinding: 'Police confirm using tear gas at the ADC governorship launch; supporters of both main parties allege attacks.',
      rationale: 'Police confirm using tear gas at the ADC governorship launch; supporters of both main parties allege attacks.',
      evidence: 'Documented denial of municipal stadium and hall facilities for opposition congresses.',
      response: 'Requested'
    },
    KO: {
      classification: 'Emerging concern',
      direction: 'newly-classified',
      confidence: 'Medium',
      keyFinding: 'Documented incidents of partisan intimidation and disruption of voter mobilization outings.',
      rationale: 'Documented incidents of partisan intimidation and disruption of voter mobilization outings.',
      evidence: 'Attacks on campaign motorcades in Kogi West and Koton-Karfe areas.',
      response: 'Requested'
    },
    OS: {
      classification: 'Emerging concern',
      direction: 'newly-classified',
      confidence: 'Medium',
      keyFinding: 'Partisan friction and contested administrative neutrality ahead of governorship preparation.',
      rationale: 'Partisan friction and contested administrative neutrality ahead of governorship preparation.',
      evidence: 'Accreditation disputes and localized party office vandalism.',
      response: 'Not required'
    },
    RI: {
      classification: 'Emerging concern',
      direction: 'newly-classified',
      confidence: 'High',
      keyFinding: 'Intense institutional disputes and threats affecting party coordination structures.',
      rationale: 'Intense institutional disputes and threats affecting party coordination structures.',
      evidence: 'Attacks on local government party secretariats and public assembly standoffs.',
      response: 'Pending'
    }
  }),
  createdAt: 1727740800000,
  updatedAt: 1727740800000
};

// 2. Latest Publication (1st – 15th October 2026)
export const DCM_PUBLICATION_OCTOBER_2026: DcmPublication = {
  id: 'dcm-2026-10-15',
  title: 'Democratic Competitiveness Map: October 2026 Update',
  year: 2026,
  month: 10,
  periodIndex: 1,
  periodStart: '2026-10-01',
  periodEnd: '2026-10-15',
  reportingPeriodLabel: '1st – 15th October 2026',
  publicationDate: '16 October 2026',
  evidenceCutoffDate: '15 October 2026',
  methodologyVersion: 'Version 1.1',
  revisionNote: 'Updated reporting window incorporating verified incidents from 1 to 15 October 2026.',
  status: 'published',
  isLatest: true,
  summary: "Three months before the 2027 general elections, the space for opposition campaigning is narrowing in a growing number of states. In the first half of October, five more states showed material concerns, and violence against opposition events and party offices spread beyond the South-East. This brief sets out where conditions are deteriorating, why it matters, and what each institution can do before campaigns intensify.",
  changesSummary: 'Edo and Oyo moved from Insufficient evidence to Orange (Constrained) following verified violence against campaign rallies and candidate convoys. Kano moved from Insufficient evidence to Amber (Emerging Concern) following public threats against opposition mobilisation.',
  classifications: buildJurisdictionMap({
    // Changed states in this cycle:
    ED: {
      classification: 'Constrained',
      rationale: 'Classification changed following verified incidents affecting campaign access, armed attacks on candidate convoys in Igueben, and threatening rhetoric against political competition.',
      evidence: 'Video-recorded threatening statements by party leadership; confirmed armed attack on ADC senatorial candidate convoy on 6 October.',
      response: 'Requested'
    },
    OY: {
      classification: 'Constrained',
      rationale: 'Classification changed following violent disruption of political reception in Ibadan South-West resulting in a confirmed supporter fatality.',
      evidence: 'Police-confirmed attack on political procession in Molete on 14 October and subsequent death of a supporter on 15 October.',
      response: 'Requested'
    },
    KN: {
      classification: 'Emerging concern',
      rationale: 'Classification changed following emerging political assembly friction and aggressive statements against rival mobilization in urban centers.',
      evidence: 'Verified municipal hall access disputes and heightened security policing of party meetings.',
      response: 'Not required'
    },
    // Carried forward from baseline:
    BE: {
      classification: 'Constrained',
      rationale: 'Continued material restrictions on political space and public gathering permissions.',
      evidence: 'Ongoing limitations on opposition rallies carried forward from baseline monitoring.',
      response: 'Requested'
    },
    DE: {
      classification: 'Constrained',
      rationale: 'Sustained pattern of opposition campaign disruption in riverine and urban LGAs.',
      evidence: 'Verified reports of campaign motorcade obstructions.',
      response: 'Requested'
    },
    EN: {
      classification: 'Constrained',
      rationale: 'Serious incident involving armed shooting outside party secretariat during campaign flag-off and dispersal of airport reception.',
      evidence: 'Police-confirmed shooting with one survivor and vehicle damage on 10 October; contested fatality reports.',
      response: 'Response received'
    },
    AB: {
      classification: 'Emerging concern',
      rationale: 'Continued municipal pressure on campaign billboarding and localized assembly conditions.',
      evidence: 'Carried forward from baseline assessment.',
      response: 'Not required'
    },
    AN: {
      classification: 'Emerging concern',
      rationale: 'Security restrictions affecting voter mobilisation timing.',
      evidence: 'Carried forward from baseline assessment.',
      response: 'Not required'
    },
    IM: {
      classification: 'Emerging concern',
      rationale: 'Unresolved disputes and rural constituency intimidation concerns.',
      evidence: 'Carried forward from baseline assessment.',
      response: 'Not required'
    },
    KD: {
      classification: 'Emerging concern',
      rationale: 'Administrative restrictions on venue access and assembly permitting delays.',
      evidence: 'Carried forward from baseline assessment.',
      response: 'Requested'
    },
    KO: {
      classification: 'Emerging concern',
      rationale: 'Armed attack on ADC campaign convoy in Gegu-Beki near Koton-Karfe with vehicle destruction on 3 October.',
      evidence: 'Verified attack on campaign motorcade carrying senatorial and House of Reps candidates on 3 October.',
      response: 'Requested'
    },
    OS: {
      classification: 'Emerging concern',
      rationale: 'Friction between ruling and opposition party structures ahead of off-cycle cycle.',
      evidence: 'Carried forward from baseline assessment.',
      response: 'Not required'
    },
    RI: {
      classification: 'Emerging concern',
      rationale: 'Institutional contestation and recurring standoff around local party secretariats.',
      evidence: 'Carried forward from baseline assessment.',
      response: 'Pending'
    }
  }),
  createdAt: 1729036800000,
  updatedAt: 1729036800000
};

export const INITIAL_DCM_PUBLICATIONS: DcmPublication[] = [
  DCM_PUBLICATION_OCTOBER_2026,
  DCM_PUBLICATION_BASELINE
];
