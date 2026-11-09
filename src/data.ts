import { Report, DiaryItem, EventItem, TeamMember, WeeklyIssue, AnnouncementItem } from './types';
import { sortItemsByDate } from './utils/date';

export const REPORTS: Report[] = [
  {
    id: 'custom-xl8sg',
    title: 'Africa Election Watch: Morocco Votes 2026',
    tag: 'AFRICA ELECTION WATCH',
    tagType: 'africa-election-watch',
    date: '23 September 2026',
    author: 'Athena Election Observatory',
    summary: 'Comprehensive observation analysis of the Kingdom of Morocco House of Representatives and regional council elections, evaluating proportional representation formulas, biometric accreditation, and electoral health.',
    size: '2.4 MB',
    readingTime: '6 min read',
    pdfUrl: 'ref:pdf_custom-xl8sg',
    sections: [
      {
        title: 'Executive Summary',
        content: 'On 23 September 2026, the Kingdom of Morocco conducted parliamentary elections for the 395 seats of the House of Representatives alongside 12 regional council assemblies. Athena Election Observatory deployed regional monitors to evaluate party list competitiveness, voting station compliance, and collation integrity across Rabat and provincial divisions.'
      },
      {
        title: 'Key Findings & Oversight Metrics',
        content: 'Our observation desk tracked voter participation rates across urban centers and rural provinces, biometric voter verification speed, and the application of regional quotient rules. Collation procedures exhibited high administrative discipline with verifiable returns.'
      }
    ],
    slug: 'africa-election-watch-morocco-votes-2026',
    createdAt: 1728901212022,
    reads: 342,
    downloads: 88
  },
  {
    id: 'custom-64kyo',
    title: 'The AEO Read: Monitoring Nigeria\'s Democratic and Electoral Landscape',
    tag: 'POLITICAL LANDSCAPE MONITOR',
    tagType: 'tech',
    date: '15 October 2026',
    author: 'AEO Forensics & Tech Desk',
    summary: 'Monthly evidence-based assessment tracking democratic health, institutional autonomy, technology uptime, and electoral administration across Nigeria\'s 36 states and the FCT.',
    size: '1.8 MB',
    readingTime: '8 min read',
    pdfUrl: 'ref:pdf_custom-64kyo',
    sections: [
      {
        title: 'The Five Permanent Pillars',
        content: 'The AEO Read provides a monthly evidence-based assessment across five permanent pillars: Biometric Accreditation Uptime, Form EC8A Reconciliation Rates, Collation Transparency, Electoral Dispute Adjudication, and Political Climate Health.'
      },
      {
        title: 'Sub-National Preparation Scores',
        content: 'State-by-state evaluation of BVAS readiness, logistical staging, and observer deployment accreditation across forthcoming election territories.'
      }
    ],
    slug: 'the-aeo-read-monitoring-nigerias-democratic-and-electoral-landscape',
    createdAt: 1729006301964,
    reads: 512,
    downloads: 147
  },
  {
    id: 'custom-19oz4',
    title: 'Sub-National Electoral Integrity & Technology Assessment',
    tag: 'REPORTS & BRIEFS',
    tagType: 'brief',
    date: '14 October 2026',
    author: 'Jane Azubuike, Chinedu C.',
    summary: 'A forensic study on institutional autonomy, field observer deployment protocols, and electronic result transmission integrity in sub-national elections.',
    size: '1.2 MB',
    readingTime: '7 min read',
    pdfUrl: 'ref:pdf_custom-19oz4',
    image: 'ref:img_custom-19oz4',
    sections: [
      {
        title: 'Executive Overview',
        content: 'This technical brief presents an empirical analysis of electoral integrity safeguards at the state and LGA levels. Focusing on polling unit accreditation workflows, transmission latency, and primary source verification.'
      },
      {
        title: 'Procedural Recommendations',
        content: 'Key recommendations include mandatory dual-channel verification for EC8A upload certificates, proactive machine diagnostic checks 48 hours prior to poll opening, and open observer collation feeds.'
      }
    ],
    slug: 'sub-national-electoral-integrity-technology-assessment',
    createdAt: 1728901240259,
    reads: 275,
    downloads: 64
  },
  {
    id: 'custom-42rbo',
    title: 'Forensic Election Audit & Result Reconciliation Report',
    tag: 'ELECTION AUDIT',
    tagType: 'analysis',
    date: '14 October 2026',
    author: 'Athena Forensics & Legal Unit',
    summary: 'In-depth forensic audit cross-matching BVAS accreditation logs with physical Form EC8A certificates, examining discrepancy indices and collation integrity.',
    size: '14.8 MB',
    readingTime: '12 min read',
    pdfUrl: 'ref:pdf_custom-42rbo',
    image: 'ref:img_custom-42rbo',
    sections: [
      {
        title: 'Methodology & Primary Source Scope',
        content: 'Athena Election Observatory deployed trained field observers to audit polling units, cross-referencing biometric logs against uploaded Form EC8A sheets to calculate the Electoral Health & Integrity Index (EHII).'
      },
      {
        title: 'Accreditation vs Upload Discrepancies',
        content: 'Quantitative analysis reveals patterns in transmission timing, server upload timestamps, and manual collation overrides across monitored polling divisions.'
      }
    ],
    slug: 'forensic-election-audit-result-reconciliation-report',
    createdAt: 1728901245388,
    reads: 418,
    downloads: 105
  },
  {
    id: 'custom-uf3v9',
    title: 'The Imperative of Competitive Politics: Multiparty Dynamics in Nigeria',
    tag: 'POLITICAL LANDSCAPE MONITOR',
    tagType: 'tech',
    date: '14 October 2026',
    author: 'AEO Policy & Governance Research',
    summary: 'An empirical exploration of political competition, institutional guardrails, and democratic competitiveness indices across sub-national party chapters.',
    size: '2.1 MB',
    readingTime: '9 min read',
    pdfUrl: 'ref:pdf_custom-uf3v9',
    image: 'ref:img_custom-uf3v9',
    sections: [
      {
        title: 'Democratic Competitiveness Landscape',
        content: 'Analysis of party fragmentation, incumbency advantages, and voter mobilization patterns in recent Nigerian electoral cycles.'
      },
      {
        title: 'Institutional Guardrails & Regulatory Oversight',
        content: 'Assessing the role of electoral management bodies and judicial oversight in maintaining competitive balance and transparent electoral contests.'
      }
    ],
    slug: 'the-imperative-of-competitive-politics-multiparty-dynamics',
    createdAt: 1728901248780,
    reads: 389,
    downloads: 92
  },
  {
    id: 'custom-t1mcu',
    title: 'Field Observer Accreditation & Election Administration Protocol',
    tag: 'REPORTS & BRIEFS',
    tagType: 'brief',
    date: '14 October 2026',
    author: 'Athena Field Operations Directorate',
    summary: 'Operational review of observer deployment methodologies, security coordination protocols, and primary evidence collection standards.',
    size: '1.5 MB',
    readingTime: '5 min read',
    pdfUrl: 'ref:pdf_custom-t1mcu',
    image: 'ref:img_custom-t1mcu',
    sections: [
      {
        title: 'Standardized Observer Protocols',
        content: 'Guidelines for deployed field observers documenting opening procedures, queue management, biometric accreditation timing, and vote counting.'
      },
      {
        title: 'Evidence Verification Pipeline',
        content: 'Protocols for high-resolution EC8A documentation, tamper-evident physical collation reporting, and incident response dispatch.'
      }
    ],
    slug: 'field-observer-accreditation-election-administration-protocol',
    createdAt: 1728901248436,
    reads: 298,
    downloads: 71
  },
  {
    id: 'report-anambra-2025',
    title: 'Anambra 2025 Forensic Post-Election Audit',
    tag: 'ELECTION AUDIT',
    tagType: 'analysis',
    date: '8 November 2025',
    author: 'Athena Election Observatory (AEO)',
    summary: 'Full forensic post-election audit of the 2025 Anambra Governorship Election conducted under the Athena Post-Election Audit Framework (APAF) Version 4 across 5,720 polling units.',
    size: '3.1 MB',
    readingTime: '15 min read',
    pdfUrl: '/Anambra_2025_APEA_Public_Report.pdf',
    sections: [
      {
        title: 'Executive Summary',
        content: '93.5% of assessable polling units complied with APEA forensic integrity tests (5,305 of 5,673). Discrepancies were identified in 368 polling units across Ogbaru, Idemili South, and Onitsha North.'
      }
    ],
    slug: 'anambra-2025-forensic-post-election-audit',
    createdAt: 1731110400000,
    reads: 460,
    downloads: 115
  },
  {
    id: 'report-ondo-2024',
    title: 'Ondo 2024 Forensic Post-Election Audit',
    tag: 'ELECTION AUDIT',
    tagType: 'analysis',
    date: '16 November 2024',
    author: 'Athena Election Observatory (AEO)',
    summary: 'Forensic post-election audit of the 2024 Ondo Governorship Election evaluating 3,933 polling units, 203 wards and 18 LGAs under APAF rules.',
    size: '1.0 MB',
    readingTime: '12 min read',
    pdfUrl: '/Ondo_2024_Forensic_Audit.pdf',
    sections: [
      {
        title: 'Executive Summary',
        content: '90.1% of assessable polling units complied with APEA forensic integrity tests (3,496 of 3,880). Non-compliance was concentrated in Ondo West, Ilaje, and Okitipupa.'
      }
    ],
    slug: 'ondo-2024-forensic-post-election-audit',
    createdAt: 1731715200000,
    reads: 530,
    downloads: 134
  },
  {
    id: 'report-bayelsa-2023',
    title: 'Bayelsa 2023 Forensic Post-Election Audit',
    tag: 'ELECTION AUDIT',
    tagType: 'analysis',
    date: '11 November 2023',
    author: 'Athena Election Observatory (AEO)',
    summary: 'Forensic post-election audit of the 2023 Bayelsa Governorship Election analyzing 2,244 polling units across 105 wards and 8 LGAs.',
    size: '614 KB',
    readingTime: '10 min read',
    pdfUrl: '/Bayelsa_2023_Forensic_Audit_APEA.pdf',
    sections: [
      {
        title: 'Executive Summary',
        content: '90.5% of assessable polling units complied with BVAS accreditation (1,854 of 2,049). Nembe LGA held 57% of all statewide non-compliant units.'
      }
    ],
    slug: 'bayelsa-2023-forensic-post-election-audit',
    createdAt: 1699660800000,
    reads: 380,
    downloads: 95
  },
  {
    id: 'report-kogi-2023',
    title: 'Kogi 2023 Forensic Post-Election Audit',
    tag: 'ELECTION AUDIT',
    tagType: 'analysis',
    date: '11 November 2023',
    author: 'Athena Election Observatory (AEO)',
    summary: 'Totals-based forensic post-election audit of the 2023 Kogi Governorship Election across 3,508 polling units and 239 wards.',
    size: '621 KB',
    readingTime: '10 min read',
    pdfUrl: '/Kogi_2023_Forensic_Audit_APEA.pdf',
    sections: [
      {
        title: 'Executive Summary',
        content: '82.0% of assessable polling units complied with BVAS accreditation (2,757 of 3,362). Okene LGA held 46% of non-compliant units.'
      }
    ],
    slug: 'kogi-2023-forensic-post-election-audit',
    createdAt: 1699660800001,
    reads: 420,
    downloads: 108
  },
  {
    id: 'report-imo-2023',
    title: 'Imo 2023 Forensic Post-Election Audit',
    tag: 'ELECTION AUDIT',
    tagType: 'analysis',
    date: '11 November 2023',
    author: 'Athena Election Observatory (AEO)',
    summary: 'Forensic post-election audit of the 2023 Imo Governorship Election covering 4,758 polling units across 306 wards and 27 LGAs.',
    size: '619 KB',
    readingTime: '11 min read',
    pdfUrl: '/Imo_2023_Forensic_Audit_APEA.pdf',
    sections: [
      {
        title: 'Executive Summary',
        content: '78.1% of assessable polling units complied with BVAS accreditation (3,476 of 4,451). Non-compliance was concentrated in Oru East, Oguta, and Okigwe.'
      }
    ],
    slug: 'imo-2023-forensic-post-election-audit',
    createdAt: 1699660800002,
    reads: 395,
    downloads: 99
  }
];

export const DIARY_NATIONAL: DiaryItem[] = [
  {
    id: 'nat-1',
    date: '2026-08-15',
    title: 'Osun State Governorship',
    subtitle: 'Off-cycle · INEC Monitored',
    status: 'In view',
    region: 'nigeria',
    type: 'governorship',
    country: 'Nigeria',
    location: 'Osun State, Nigeria',
    stateCode: 'OS',
    electoralBody: 'INEC (Independent National Electoral Commission)',
    registeredVoters: '2,339,233 voters',
    pollingUnits: '3,763 polling units',
    lgasCount: '30 LGAs + Area Office',
    description: 'Off-cycle gubernatorial election in Osun State. Athena Election Observatory is deploying 1,200 trained field monitors across all 30 LGAs to audit BVAS machine compliance, EC8A physical form uploads, and collation accuracy.',
    sittingExecutive: {
      name: 'Ademola Adeleke',
      title: 'Incumbent Governor of Osun State',
      party: 'PDP',
      assumedOffice: 'November 27, 2022',
      termInfo: 'First Term (2022–2026)',
      notes: 'Seeking re-election for a second four-year term under the People\'s Democratic Party banner.'
    },
    participants: [
      { name: 'Ademola Adeleke', party: 'Accord (A)', role: 'Flagbearer', platform: 'Public worker welfare, infrastructure expansion & economic development' },
      { name: 'Olanrewaju Farinloye', party: 'Action Alliance (AA)', role: 'Candidate', platform: 'Youth employment, agricultural revitalization & governance reform' },
      { name: 'Olajide Esan', party: 'African Action Congress (AAC)', role: 'Candidate', platform: 'Social justice, education access & public transparency' },
      { name: 'Najeem Salaam', party: 'African Democratic Congress (ADC)', role: 'Candidate', platform: 'Healthcare improvement, human capital & institutional autonomy' },
      { name: 'Yemisi Opawoye', party: 'Action Democratic Party (ADP)', role: 'Candidate', platform: 'Women empowerment, MSME credit support & community development' },
      { name: 'Bola Oyebamiji', party: 'All Progressives Congress (APC)', role: 'Candidate', platform: 'Fiscal consolidation, state infrastructure & industrial growth' },
      { name: 'Adewale Adebayo', party: 'Allied Peoples Movement (APM)', role: 'Candidate', platform: 'Grassroots development, social welfare & rural connectivity' },
      { name: 'Clement Adesuyi', party: 'Action Peoples Party (APP)', role: 'Candidate', platform: 'Civil service welfare, job creation & local economy support' },
      { name: 'Masilo Adeleke', party: 'Boot Party (BP)', role: 'Candidate', platform: 'Technology integration, youth innovation & digital governance' },
      { name: 'Taofeek Adeleke', party: 'New Nigeria Peoples Party (NNPP)', role: 'Candidate', platform: 'Free quality education, healthcare & agricultural hubs' },
      { name: 'Saliu Oyelami', party: 'Peoples Redemption Party (PRP)', role: 'Candidate', platform: 'Pro-people economic policy, anti-corruption & social equity' },
      { name: 'Olalekan Ogunsakin', party: 'Young Progressives Party (YPP)', role: 'Candidate', platform: 'Youth political participation, creative industry & tech hubs' },
      { name: 'Olufemi Adesuyi', party: 'Zenith Labour Party (ZLP)', role: 'Candidate', platform: 'Labor rights, local industry promotion & primary health' }
    ],
    keyIssues: [
      'BVAS startup latency and biometric accreditation rates across rural LGAs',
      'Real-time IReV server synchronization speed during polling unit counts',
      'Prevention of vote-buying and financial inducements near voting cubicles',
      'Security posture and security agency neutrality at collation centers'
    ],
    monitoringMission: 'Athena Deployment: 1,200 Accredited Observers · Direct IReV Validation Pipeline'
  },
  {
    id: 'nat-2',
    date: '2027-01-16',
    title: 'Presidential & National Assembly Election',
    subtitle: '2027 Nigeria General Election',
    status: 'Scheduled',
    region: 'nigeria',
    type: 'presidential',
    country: 'Nigeria',
    location: 'Nationwide (36 States & FCT Abuja)',
    electoralBody: 'INEC (Independent National Electoral Commission)',
    registeredVoters: '93,468,208 voters (Projected)',
    pollingUnits: '176,846 polling units',
    lgasCount: '774 LGAs',
    description: 'Federal election to elect the President and Commander-in-Chief of the Federal Republic of Nigeria, along with members of the Senate and House of Representatives.',
    sittingExecutive: {
      name: 'Bola Ahmed Tinubu',
      title: 'President of the Federal Republic of Nigeria',
      party: 'APC',
      assumedOffice: 'May 29, 2023',
      termInfo: 'First Term (2023–2027)',
      notes: 'Incumbent administration presiding over structural economic reforms, fuel subsidy removal, and currency unification.'
    },
    participants: [
      { name: 'Bola Ahmed Tinubu', party: 'APC', role: 'Incumbent President & Flagbearer', platform: 'Renewed Hope Agenda, economic liberalization, national security' },
      { name: 'Atiku Abubakar', party: 'PDP Candidate', role: 'Flagbearer', platform: 'Devolution of powers, economic restructuring, public education reform' },
      { name: 'Peter Obi', party: 'Labour Party (LP) Candidate', role: 'Flagbearer', platform: 'Production-based economy, governance cost reduction, anti-corruption' },
      { name: 'Rabiu Musa Kwankwaso', party: 'NNPP Candidate', role: 'Flagbearer', platform: 'Human capital development, free education, grassroots security' }
    ],
    keyIssues: [
      'Nationwide BVAS deployment robustness across 176,846 polling units',
      'IReV portal transmission integrity for Presidential result forms',
      'Electoral logistics timely distribution of sensitive materials',
      'Prevention of voter suppression and conflict in volatile zones'
    ],
    monitoringMission: 'Athena Nationwide Mission: 15,000 Field Observers across 774 LGAs'
  },
  {
    id: 'nat-3',
    date: '2027-02-06',
    title: 'Governorship & State Assembly Elections',
    subtitle: '2027 Nigeria General Election',
    status: 'Scheduled',
    region: 'nigeria',
    type: 'governorship',
    country: 'Nigeria',
    location: '28 States across Nigeria',
    electoralBody: 'INEC (Independent National Electoral Commission)',
    registeredVoters: '72,100,000 voters (State-level totals)',
    pollingUnits: '135,000 polling units',
    lgasCount: '620 State LGAs',
    description: 'State-level elections to elect State Governors and House of Assembly members in 28 states where elections coincide with the general election cycle.',
    sittingExecutive: {
      name: 'Incumbent Governors Council',
      title: 'State Executive Governors (28 States)',
      party: 'APC / PDP / LP / APGA / NNPP',
      termInfo: '2023–2027 Term',
      notes: 'Multiparty governance across subnational states.'
    },
    participants: [
      { name: 'APC State Candidates', party: 'APC', role: 'Gubernatorial Candidates in 28 States', platform: 'Federal-State alignment, infrastructure, agricultural hubs' },
      { name: 'PDP State Candidates', party: 'PDP', role: 'Gubernatorial Candidates in 28 States', platform: 'Subnational economy, state health insurance, civil service welfare' },
      { name: 'LP State Candidates', party: 'Labour Party', role: 'Gubernatorial Candidates in Key States', platform: 'Transparent governance, youth employment, MSME funds' },
      { name: 'APGA State Candidates', party: 'APGA', role: 'Gubernatorial Candidates in South-East', platform: 'Regional economic integration and security technology' }
    ],
    keyIssues: [
      'State-level collation center security and transparency',
      'Observer access to ward collation centers',
      'Timely announcement of state assembly results'
    ],
    monitoringMission: 'Subnational Deployment across 28 State Capitals'
  },
  {
    id: 'nat-4',
    date: '2025-11-08',
    title: 'Anambra State Governorship',
    subtitle: 'Off-cycle · INEC Monitored',
    status: 'Concluded',
    region: 'nigeria',
    type: 'governorship',
    country: 'Nigeria',
    location: 'Anambra State, Nigeria',
    stateCode: 'AN',
    electoralBody: 'INEC (Independent National Electoral Commission)',
    registeredVoters: '2,650,000 voters',
    pollingUnits: '5,720 polling units',
    lgasCount: '21 LGAs',
    description: 'Off-cycle gubernatorial election in Anambra State. Observatory auditing focuses on BVAS accreditation consistency, voter turnout metrics, and peaceful voting in the South-East.',
    sittingExecutive: {
      name: 'Prof. Chukwuma Charles Soludo',
      title: 'Incumbent Governor of Anambra State',
      party: 'APGA',
      assumedOffice: 'March 17, 2022',
      termInfo: 'First Term (2022–2026)',
      notes: 'Seeking re-election under the All Progressives Grand Alliance (APGA).'
    },
    participants: [
      { name: 'Prof. Chukwuma Soludo', party: 'APGA', role: 'Incumbent Governor & Candidate', platform: 'Smart mega-city masterplan, teacher recruitment, industrial parks' },
      { name: 'Senator Ifeanyi Ubah / YPP-APC Candidate', party: 'APC / YPP', role: 'Flagbearer', platform: 'Security modernization, commercial trade support, youth employment' },
      { name: 'Valentine Ozigbo', party: 'Labour Party (LP) Candidate', role: 'Gubernatorial Candidate', platform: 'Digital technology hubs, governance audit, export promotion' },
      { name: 'PDP Candidate', party: 'PDP', role: 'Gubernatorial Candidate', platform: 'Local government revitalization and primary healthcare' }
    ],
    keyIssues: [
      'BVAS machine performance in high-density urban wards (Awka, Onitsha, Nnewi)',
      'Security atmosphere and voter turnout assurance',
      'Form EC8A uploaded image clarity on IReV portal'
    ],
    monitoringMission: 'Athena Deployment: 1,000 Field Observers across 21 LGAs'
  }
];

export const DIARY_LOCAL: DiaryItem[] = [
  {
    id: 'loc-bauchi',
    date: '2026-08-17',
    title: 'Bauchi State Local Government Election',
    subtitle: 'Local Government · BASIEC',
    status: 'Scheduled',
    region: 'nigeria',
    type: 'local_government',
    country: 'Nigeria',
    location: 'Bauchi State (20 LGAs)',
    electoralBody: 'BASIEC (Bauchi State Independent Electoral Commission)',
    registeredVoters: '2,800,000+ voters',
    pollingUnits: '5,413 polling units',
    lgasCount: '20 LGAs & 323 Wards',
    description: 'Grassroots local council elections across Bauchi State to elect 20 Local Government Chairmen and 323 Ward Councillors.',
    keyIssues: [
      'BASIEC operational independence and non-partisan voter registration',
      'Timely distribution of voting materials to remote Sahel LGAs',
      'Observer verification of ward collation returns'
    ],
    monitoringMission: 'Grassroots Electoral Audit Team Deployment'
  },
  {
    id: 'loc-anambra-lg',
    date: '2026-08-29',
    title: 'Anambra State Local Government Election',
    subtitle: 'Local Government · ANSIEC',
    status: 'Scheduled',
    region: 'nigeria',
    type: 'local_government',
    country: 'Nigeria',
    location: 'Anambra State (21 LGAs)',
    electoralBody: 'ANSIEC (Anambra State Independent Electoral Commission)',
    registeredVoters: '2,650,000 voters',
    pollingUnits: '5,720 polling units',
    lgasCount: '21 LGAs & 326 Wards',
    description: 'Grassroots council elections across 21 LGAs in Anambra State to elect Local Government Chairmen and Councillors.',
    keyIssues: [
      'Operational autonomy of ANSIEC',
      'Peaceful voting atmosphere in commercial centers',
      'Direct fiscal allocation compliance'
    ],
    monitoringMission: 'Anambra Council Integrity Panel'
  },
  {
    id: 'loc-plateau',
    date: '2026-09-17',
    title: 'Plateau State Local Government Election',
    subtitle: 'Local Government · PLASIEC',
    status: 'Scheduled',
    region: 'nigeria',
    type: 'local_government',
    country: 'Nigeria',
    location: 'Plateau State (17 LGAs)',
    electoralBody: 'PLASIEC (Plateau State Independent Electoral Commission)',
    registeredVoters: '2,200,000 voters',
    pollingUnits: '4,989 polling units',
    lgasCount: '17 LGAs & 325 Wards',
    description: 'Subnational local government elections across Plateau State\'s 17 Local Government Areas following electronic voting hardware upgrades.',
    keyIssues: [
      'Electoral technology usage by state electoral commission',
      'Security in rural and agrarian local government areas',
      'Inclusivity of opposition political parties'
    ],
    monitoringMission: 'Plateau Subnational Election Observatory'
  },
  {
    id: 'loc-enugu',
    date: '2026-09-26',
    title: 'Enugu State Local Government Election',
    subtitle: 'Local Government · ENSIEC',
    status: 'Scheduled',
    region: 'nigeria',
    type: 'local_government',
    country: 'Nigeria',
    location: 'Enugu State (17 LGAs)',
    electoralBody: 'ENSIEC (Enugu State Independent Electoral Commission)',
    registeredVoters: '2,100,000 voters',
    pollingUnits: '4,145 polling units',
    lgasCount: '17 LGAs & 260 Wards',
    description: 'Local council elections in Enugu State electing 17 LGA Chairmen and 260 Ward Councillors.',
    keyIssues: [
      'ENSIEC logistics delivery speed across urban and rural wards',
      'Voter turnout metrics for local council elections',
      'Ward-level collation transparency'
    ],
    monitoringMission: 'Enugu LGA Monitoring Taskforce'
  },
  {
    id: 'loc-kogi',
    date: '2026-10-17',
    title: 'Kogi State Local Government Election',
    subtitle: 'Local Government · KOSIEC',
    status: 'Scheduled',
    region: 'nigeria',
    type: 'local_government',
    country: 'Nigeria',
    location: 'Kogi State (21 LGAs)',
    electoralBody: 'KOSIEC (Kogi State Independent Electoral Commission)',
    registeredVoters: '1,900,000 voters',
    pollingUnits: '3,508 polling units',
    lgasCount: '21 LGAs & 239 Wards',
    description: 'Local chairmanship and ward council polls across Kogi State\'s 21 Local Government Areas.',
    keyIssues: [
      'Security neutrality at LGA collation centers',
      'KOSIEC result sheet verification',
      'Fair competition across three senatorial zones'
    ],
    monitoringMission: 'Kogi Grassroots Governance Audit Desk'
  },
  {
    id: 'loc-oyo',
    date: '2026-12-29',
    title: 'Oyo State Local Government Election',
    subtitle: 'Local Government · OYSIEC',
    status: 'Scheduled',
    region: 'nigeria',
    type: 'local_government',
    country: 'Nigeria',
    location: 'Oyo State (33 LGAs)',
    electoralBody: 'OYSIEC (Oyo State Independent Electoral Commission)',
    registeredVoters: '3,200,000 voters',
    pollingUnits: '6,390 polling units',
    lgasCount: '33 LGAs & 351 Wards',
    description: 'Subnational elections across Oyo State\'s 33 LGAs to elect Council Chairmen and Councillors.',
    keyIssues: [
      'OYSIEC manual and digital collation procedures',
      'Inter-party participation in municipal councils',
      'Timely voting material deployment'
    ],
    monitoringMission: 'Oyo State Local Democracy Monitor'
  },
  {
    id: 'loc-osun-lg',
    date: 'Mid-2027',
    title: 'Osun State Local Government Election',
    subtitle: 'Local Government · OSSIEC',
    status: 'Scheduled',
    region: 'nigeria',
    type: 'local_government',
    country: 'Nigeria',
    location: 'Osun State (30 LGAs)',
    electoralBody: 'OSSIEC (Osun State Independent Electoral Commission)',
    registeredVoters: '1,950,000 voters',
    pollingUnits: '3,763 polling units',
    lgasCount: '30 LGAs & Area Office',
    description: 'Grassroots council elections in Osun State following administrative tenure completion.',
    keyIssues: [
      'Compliance with constitutional LG autonomy mandates',
      'OSSIEC independence and procedural integrity'
    ],
    monitoringMission: 'Osun Local Government Monitoring Desk'
  },
  {
    id: 'loc-ekiti-lg',
    date: 'Mid-to-Late 2027',
    title: 'Ekiti State Local Government Election',
    subtitle: 'Local Government · EKSIEC',
    status: 'Scheduled',
    region: 'nigeria',
    type: 'local_government',
    country: 'Nigeria',
    location: 'Ekiti State (16 LGAs & LCDAs)',
    electoralBody: 'EKSIEC (Ekiti State Independent Electoral Commission)',
    registeredVoters: '1,000,000 voters',
    pollingUnits: '2,445 polling units',
    lgasCount: '16 LGAs & 197 Wards',
    description: 'Grassroots elections across Ekiti State local councils and LCDAs.',
    keyIssues: [
      'EKSIEC operational readiness',
      'Voter accreditation and ballot accounting'
    ],
    monitoringMission: 'Ekiti Grassroots Audit Unit'
  },
  {
    id: 'loc-kano',
    date: 'Late 2027',
    title: 'Kano State Local Government Election',
    subtitle: 'Local Government · KANSIEC',
    status: 'Scheduled',
    region: 'nigeria',
    type: 'local_government',
    country: 'Nigeria',
    location: 'Kano State (44 LGAs)',
    electoralBody: 'KANSIEC (Kano State Independent Electoral Commission)',
    registeredVoters: '5,900,000 voters',
    pollingUnits: '11,222 polling units',
    lgasCount: '44 LGAs & 484 Wards',
    description: 'Large-scale subnational council elections across 44 LGAs in Kano State.',
    keyIssues: [
      'Mass voter mobilization and security in high-density urban LGAs',
      'KANSIEC logistics coordination across 44 councils'
    ],
    monitoringMission: 'Kano Subnational Integrity Observatory'
  },
  {
    id: 'loc-rivers',
    date: 'Late 2027 / Early 2028',
    title: 'Rivers State Local Government Election',
    subtitle: 'Local Government · RSIEC',
    status: 'Scheduled',
    region: 'nigeria',
    type: 'local_government',
    country: 'Nigeria',
    location: 'Rivers State (23 LGAs)',
    electoralBody: 'RSIEC (Rivers State Independent Electoral Commission)',
    registeredVoters: '3,500,000 voters',
    pollingUnits: '6,866 polling units',
    lgasCount: '23 LGAs & 319 Wards',
    description: 'Local government elections across 23 council areas in Rivers State.',
    keyIssues: [
      'RSIEC independence amidst regional political realignments',
      'Security posture during riverine area voting'
    ],
    monitoringMission: 'Rivers Local Electoral Audit Panel'
  },
  {
    id: 'loc-lagos',
    date: 'Q3 2026',
    title: 'Lagos State Local Government Elections',
    subtitle: 'Local Government · LASIEC',
    status: 'Provisional',
    region: 'nigeria',
    type: 'local_government',
    country: 'Nigeria',
    location: 'Lagos State (20 LGAs & 37 LCDAs)',
    electoralBody: 'LASIEC (Lagos State Independent Electoral Commission)',
    registeredVoters: '7,000,000+ voters',
    pollingUnits: '13,325 polling units',
    lgasCount: '20 LGAs & 37 LCDAs',
    description: 'Grassroots local council elections across Lagos State to elect 57 Council Chairmen and 376 Ward Councillors.',
    keyIssues: [
      'State Independent Electoral Commission (SIEC) operational independence',
      'Timely deployment of ballot boxes and voters registers',
      'Voter turnout in grassroots council polls'
    ],
    monitoringMission: 'Local Government Integrity Oversight Team'
  },
  {
    id: 'loc-fct',
    date: 'Q1 2026',
    title: 'FCT Abuja Municipal Area Council Polls',
    subtitle: 'Local Government · INEC Monitored',
    status: 'Scheduled',
    region: 'nigeria',
    type: 'local_government',
    country: 'Nigeria',
    location: 'Federal Capital Territory (AMAC, Bwari, Gwagwalada, Kuje, Abaji, Kwali)',
    electoralBody: 'INEC (Federal Area Council Supervision)',
    registeredVoters: '1,500,000 voters',
    pollingUnits: '2,828 polling units',
    lgasCount: '6 Area Councils',
    description: 'Area Council elections in the Federal Capital Territory, Abuja, conducted directly by INEC under federal laws.',
    keyIssues: [
      'INEC technology deployment at grassroots level in FCT',
      'Bimodal voter accreditation speed in satellite towns'
    ],
    monitoringMission: 'FCT Area Council Independent Monitoring Panel'
  },
  {
    id: 'loc-autonomy',
    date: '2026–2027',
    title: 'State-by-State Local Government Polls',
    subtitle: 'Local Government · SIECs Nationwide',
    status: 'Tracking',
    region: 'nigeria',
    type: 'local_government',
    country: 'Nigeria',
    location: '36 States Nationwide',
    electoralBody: 'State Independent Electoral Commissions (SIECs)',
    registeredVoters: 'Grassroots Sub-national Population',
    pollingUnits: 'State-wide polling locations',
    lgasCount: '774 LGAs nationwide',
    description: 'Ongoing tracking of local council elections held across Nigerian states following Supreme Court judgment on financial autonomy for local governments.',
    keyIssues: [
      'Compliance with constitutional requirement for democratically elected council leadership',
      'Level playing field for opposition parties in SIEC-conducted polls'
    ],
    monitoringMission: 'AEO Grassroots Democracy & Autonomy Index'
  }
];

export const DIARY_AFRICA: DiaryItem[] = [
  {
    id: 'afr-zambia',
    date: '2026-08-13',
    title: 'Zambia General Election',
    subtitle: 'Africa · Presidential & Parliamentary',
    status: 'Scheduled',
    region: 'africa',
    type: 'presidential',
    country: 'Zambia',
    location: 'Lusaka & 10 Provinces, Zambia',
    electoralBody: 'Electoral Commission of Zambia (ECZ)',
    registeredVoters: '7,000,000 voters',
    pollingUnits: '12,152 polling stations',
    description: 'General election to elect the President of Zambia, members of the National Assembly, and local council leadership.',
    keyIssues: [
      'Voter register audit and youth voter access',
      'Public order act enforcement and opposition campaigning rights',
      'Biometric voter verification speed'
    ],
    monitoringMission: 'AEO Southern Africa Election Monitoring Desk'
  },
  {
    id: 'afr-morocco',
    date: '2026-09-23',
    title: 'Morocco General Election',
    subtitle: 'Africa · Parliamentary & Regional',
    status: 'Scheduled',
    region: 'africa',
    type: 'other',
    country: 'Morocco',
    location: 'Rabat & 12 Regions, Morocco',
    electoralBody: 'Ministry of Interior & National Election Authority',
    registeredVoters: '18,000,000 registered voters',
    pollingUnits: '40,000 polling stations',
    description: 'Direct elections for the 395 members of the House of Representatives and regional council assemblies in Morocco.',
    keyIssues: [
      'Proportional representation distribution and quotient rule calculations',
      'Voter participation across urban centers and rural provinces',
      'Digital election oversight transparency'
    ],
    monitoringMission: 'AEO North Africa Governance Desk'
  },
  {
    id: 'afr-saotome',
    date: '2026-09-27',
    title: 'São Tomé and Príncipe Parliamentary Election',
    subtitle: 'Africa · National Assembly',
    status: 'Scheduled',
    region: 'africa',
    type: 'other',
    country: 'São Tomé and Príncipe',
    location: 'São Tomé & Príncipe Island Districts',
    electoralBody: 'Comissão Eleitoral Nacional (CEN)',
    registeredVoters: '123,000 voters',
    pollingUnits: '300 polling stations',
    description: 'Parliamentary elections to fill all 55 seats in the National Assembly of São Tomé and Príncipe.',
    keyIssues: [
      'Island-to-island ballot logistics and communication links',
      'Coalition government stability and institutional trust'
    ],
    monitoringMission: 'AEO Central & Island States Research Unit'
  },
  {
    id: 'afr-sa-muni',
    date: '2026-11-04',
    title: 'South Africa Municipal Election',
    subtitle: 'Africa · Local Government',
    status: 'Scheduled',
    region: 'africa',
    type: 'local_government',
    country: 'South Africa',
    location: 'Pretoria & 257 Municipalities, South Africa',
    electoralBody: 'IEC (Electoral Commission of South Africa)',
    registeredVoters: '27,000,000 voters',
    pollingUnits: '23,292 voting stations',
    description: 'Local government elections across all 8 metropolitan, 44 district, and 205 local municipalities in South Africa.',
    keyIssues: [
      'Voter registration management via Voter Management Devices (VMDs)',
      'Coalition governance mechanisms at metropolitan council level',
      'Essential municipal service delivery debates'
    ],
    monitoringMission: 'AEO Southern Africa Municipal Integrity Panel'
  },
  {
    id: 'afr-capeverde',
    date: '2026-11-15',
    title: 'Cape Verde Presidential Election',
    subtitle: 'Africa · Head of State',
    status: 'Scheduled',
    region: 'africa',
    type: 'presidential',
    country: 'Cape Verde',
    location: 'Praia & 22 Municipalities, Cape Verde',
    electoralBody: 'Comissão Nacional de Eleições (CNE)',
    registeredVoters: '390,000 voters',
    pollingUnits: '1,200 polling stations',
    description: 'Direct popular vote to elect the President of the Republic of Cape Verde.',
    keyIssues: [
      'Diaspora voting mobilization across Europe and the Americas',
      'Democratic governance consolidation'
    ],
    monitoringMission: 'AEO West Africa Electoral Integrity Research Desk'
  },
  {
    id: 'afr-gambia',
    date: '2026-12-05',
    title: 'Gambia Presidential Election',
    subtitle: 'Africa · Head of State',
    status: 'Scheduled',
    region: 'africa',
    type: 'presidential',
    country: 'Gambia',
    location: 'Banjul & 5 Administrative Regions, Gambia',
    electoralBody: 'Independent Electoral Commission (IEC Gambia)',
    registeredVoters: '1,000,000 voters',
    pollingUnits: '1,554 polling streams',
    description: 'Presidential election under the unique marble-in-drum voting system maintained by the Independent Electoral Commission.',
    keyIssues: [
      'Marble voting technology reliability and counting auditing',
      'Constitutional reform implementation progress'
    ],
    monitoringMission: 'AEO West Africa Field Monitoring Unit'
  },
  {
    id: 'afr-guineabissau',
    date: '2026-12-06',
    title: 'Guinea-Bissau General Election',
    subtitle: 'Africa · Presidential & Legislative',
    status: 'Scheduled',
    region: 'africa',
    type: 'presidential',
    country: 'Guinea-Bissau',
    location: 'Bissau & 8 Regions, Guinea-Bissau',
    electoralBody: 'Comissão Nacional de Eleições (CNE)',
    registeredVoters: '880,000 voters',
    pollingUnits: '3,100 polling stations',
    description: 'General election to elect the President and 102 deputies to the National People\'s Assembly.',
    keyIssues: [
      'Institutional stability and security agency neutrality',
      'Voter registration list updates and ballot paper distribution'
    ],
    monitoringMission: 'AEO Lusophone Africa Electoral Desk'
  },
  {
    id: 'afr-cameroon',
    date: '2026-12-20',
    title: 'Cameroon Parliamentary Election',
    subtitle: 'Africa · National Assembly',
    status: 'Scheduled',
    region: 'africa',
    type: 'other',
    country: 'Cameroon',
    location: 'Yaoundé & 10 Regions, Cameroon',
    electoralBody: 'ELECAM (Elections Cameroon)',
    registeredVoters: '7,500,000 voters',
    pollingUnits: '25,000 polling stations',
    description: 'Parliamentary elections to elect 180 members of the National Assembly of Cameroon.',
    keyIssues: [
      'Voting access in Anglophone South-West and North-West regions',
      'ELECAM biometric voter card distribution efficiency'
    ],
    monitoringMission: 'AEO Central Africa Observatory Panel'
  },
  {
    id: 'afr-southsudan',
    date: '2026-12-22',
    title: 'South Sudan General Election',
    subtitle: 'Africa · Presidential & Parliamentary',
    status: 'Scheduled',
    region: 'africa',
    type: 'presidential',
    country: 'South Sudan',
    location: 'Juba & 10 States, South Sudan',
    electoralBody: 'National Elections Commission (NEC)',
    registeredVoters: '5,000,000 voters (Projected)',
    pollingUnits: '8,000 polling stations',
    description: 'Historic inaugural general election in South Sudan following peace agreement roadmap implementation.',
    keyIssues: [
      'Voter registration census and permanent constitution adoption',
      'Security environment and humanitarian access to polling centers'
    ],
    monitoringMission: 'AEO East & Horn of Africa Governance Desk'
  },
  {
    id: 'afr-cotedivoire',
    date: '2025-10-25',
    title: "Côte d'Ivoire Presidential Election",
    subtitle: 'Africa · Regional Benchmark',
    status: 'Concluded',
    region: 'africa',
    type: 'presidential',
    country: "Côte d'Ivoire",
    location: 'Abidjan & All Districts, Côte d\'Ivoire',
    electoralBody: 'CEI (Commission Électorale Indépendante)',
    registeredVoters: '8,000,000 registered voters',
    pollingUnits: '22,000 polling stations',
    description: 'Presidential election in Côte d\'Ivoire serving as a key democratic indicator for West Africa.',
    keyIssues: [
      'Biometric voter identification technology performance',
      'Peaceful conduct and opposition acceptance of official tally'
    ],
    monitoringMission: 'AEO West Africa Electoral Integrity Research Desk'
  },
  {
    id: 'afr-ghana',
    date: '2028-12-07',
    title: 'Ghana General Election',
    subtitle: 'Africa · West Africa Landmark',
    status: 'Scheduled',
    region: 'africa',
    type: 'presidential',
    country: 'Ghana',
    location: 'Accra & 16 Regions, Ghana',
    electoralBody: 'Electoral Commission of Ghana (EC)',
    registeredVoters: '18,700,000 registered voters',
    pollingUnits: '40,000 polling stations',
    description: 'Ghanaian presidential and parliamentary elections representing one of the most competitive democratic transitions in Sub-Saharan Africa.',
    keyIssues: [
      'Biometric verification devices (BVD) operational efficiency',
      'Collation center security and media access transparency'
    ],
    monitoringMission: 'AEO Continental Elections Observatory Panel'
  },
  {
    id: 'afr-sa-gen',
    date: 'May 2029',
    title: 'South Africa General Election',
    subtitle: 'Africa · Southern Africa Benchmark',
    status: 'Scheduled',
    region: 'africa',
    type: 'presidential',
    country: 'South Africa',
    location: 'Pretoria & 9 Provinces, South Africa',
    electoralBody: 'IEC (Electoral Commission of South Africa)',
    registeredVoters: '27,700,000 voters',
    pollingUnits: '23,292 voting stations',
    description: 'National and Provincial elections in South Africa electing members of the National Assembly.',
    keyIssues: [
      'Proportional representation and coalition government stability',
      'Electronic voter roll verification'
    ],
    monitoringMission: 'AEO Southern Africa Governance & Integrity Desk'
  }
];

export const DIARY_OTHER: DiaryItem[] = [
  {
    id: 'oth-kazakhstan',
    date: 'Aug 2026',
    title: 'Kazakhstan Legislative Election',
    subtitle: 'Asia · Mazhilis Parliament',
    status: 'Scheduled',
    region: 'other',
    type: 'other',
    country: 'Kazakhstan',
    location: 'Astana & 17 Regions, Kazakhstan',
    electoralBody: 'Central Election Commission (CEC Kazakhstan)',
    registeredVoters: '12,000,000 voters',
    pollingUnits: '10,000 polling stations',
    description: 'Legislative elections to elect 98 deputies to the Mazhilis under a mixed parliamentary system.',
    keyIssues: [
      'Party registration rules and candidate ballot access',
      'Electronic voter list verification'
    ],
    monitoringMission: 'AEO International Democratic Standards Program'
  },
  {
    id: 'oth-iceland',
    date: '2026-08-29',
    title: 'Iceland EU Membership Referendum',
    subtitle: 'Europe · National Referendum',
    status: 'Scheduled',
    region: 'other',
    type: 'other',
    country: 'Iceland',
    location: 'Reykjavík & All Constituencies, Iceland',
    electoralBody: 'National Electoral Commission (Landskjörstjórn)',
    registeredVoters: '270,000 voters',
    pollingUnits: '300 polling stations',
    description: 'National binding referendum on resuming European Union accession negotiations.',
    keyIssues: [
      'Public information campaign fairness and equal media access',
      'Electronic ballot tabulations'
    ],
    monitoringMission: 'AEO European Referenda Audit Team'
  },
  {
    id: 'oth-haiti-1',
    date: '2026-08-30',
    title: 'Haiti General Election (First Round)',
    subtitle: 'Americas · Presidential & Legislative',
    status: 'Scheduled',
    region: 'other',
    type: 'presidential',
    country: 'Haiti',
    location: 'Port-au-Prince & 10 Departments, Haiti',
    electoralBody: 'Conseil Électoral Provisoire (CEP)',
    registeredVoters: '6,500,000 voters',
    pollingUnits: '1,500 voting centers',
    description: 'First round of elections to elect the President of Haiti, members of the Senate, and Chamber of Deputies.',
    keyIssues: [
      'Security guarantees in metropolitan areas',
      'CEP operational infrastructure recovery'
    ],
    monitoringMission: 'AEO Americas Electoral Integrity Desk'
  },
  {
    id: 'oth-estonia',
    date: '2026-09-02',
    title: 'Estonia Presidential Election',
    subtitle: 'Europe · Head of State',
    status: 'Scheduled',
    region: 'other',
    type: 'presidential',
    country: 'Estonia',
    location: 'Tallinn (Riigikogu / Electoral College)',
    electoralBody: 'State Electoral Office',
    registeredVoters: 'Riigikogu / Electoral College Electors',
    pollingUnits: 'Parliament & Regional Assembly Voting',
    description: 'Indirect presidential election conducted by the Riigikogu parliament or Electoral College.',
    keyIssues: [
      'Parliamentary consensus building mechanisms',
      'Digital electoral record auditing'
    ],
    monitoringMission: 'AEO Digital Electoral Systems Research Unit'
  },
  {
    id: 'oth-germany-saxony',
    date: '2026-09-06',
    title: 'Germany, Saxony-Anhalt State Election',
    subtitle: 'Europe · Landtag Parliament',
    status: 'Scheduled',
    region: 'other',
    type: 'governorship',
    country: 'Germany',
    location: 'Saxony-Anhalt State, Germany',
    electoralBody: 'Landeswahlleiter Saxony-Anhalt',
    registeredVoters: '1,800,000 voters',
    pollingUnits: '2,200 polling precincts',
    description: 'State parliament election to elect members of the 9th Landtag of Saxony-Anhalt.',
    keyIssues: [
      'Postal vote accounting and verification',
      'Coalition government arithmetic'
    ],
    monitoringMission: 'AEO Comparative Democratic Governance Desk'
  },
  {
    id: 'oth-sweden-gen',
    date: '2026-09-13',
    title: 'Sweden General Election',
    subtitle: 'Europe · Riksdag Parliament',
    status: 'Scheduled',
    region: 'other',
    type: 'presidential',
    country: 'Sweden',
    location: '29 Constituencies, Sweden',
    electoralBody: 'Valmyndigheten (Swedish Election Authority)',
    registeredVoters: '7,700,000 voters',
    pollingUnits: '6,200 polling places',
    description: 'General election to elect all 349 seats in the Riksdag parliament.',
    keyIssues: [
      'Early voting logistics and ballot paper distribution security',
      'Advance voting secrecy safeguards'
    ],
    monitoringMission: 'AEO European Parliamentary Audit Team'
  },
  {
    id: 'oth-sweden-loc',
    date: '2026-09-13',
    title: 'Sweden Local Election',
    subtitle: 'Europe · Municipal & Regional Councils',
    status: 'Scheduled',
    region: 'other',
    type: 'local_government',
    country: 'Sweden',
    location: '290 Municipalities & 21 Regions, Sweden',
    electoralBody: 'Valmyndigheten (Swedish Election Authority)',
    registeredVoters: '7,700,000 voters',
    pollingUnits: '6,200 polling places',
    description: 'Municipal and regional council elections held concurrently with the Swedish Riksdag election.',
    keyIssues: [
      'Local assembly proportional representation',
      'Digital vote count auditing'
    ],
    monitoringMission: 'AEO Local Governance Research Unit'
  },
  {
    id: 'oth-philippines-barmm',
    date: '2026-09-14',
    title: 'Philippines, Bangsamoro Parliament Election',
    subtitle: 'Asia · Regional Parliament',
    status: 'Scheduled',
    region: 'other',
    type: 'other',
    country: 'Philippines',
    location: 'Bangsamoro Autonomous Region (BARMM), Philippines',
    electoralBody: 'COMELEC (Commission on Elections)',
    registeredVoters: '2,000,000 voters',
    pollingUnits: '3,000 polling precincts',
    description: 'Inaugural parliamentary election for the 80 seats in the Bangsamoro Parliament.',
    keyIssues: [
      'Automated counting machine (ACM) performance in island provinces',
      'Peaceful transition and party-list system enforcement'
    ],
    monitoringMission: 'AEO Asia-Pacific Electoral Observatory'
  },
  {
    id: 'oth-russia-leg',
    date: '2026-09-18',
    title: 'Russia Legislative Election',
    subtitle: 'Europe/Asia · State Duma',
    status: 'Scheduled',
    region: 'other',
    type: 'other',
    country: 'Russia',
    location: '225 Single-Member & Federal Party List Districts',
    electoralBody: 'Central Election Commission (CEC Russia)',
    registeredVoters: '110,000,000 voters',
    pollingUnits: '96,000 polling stations',
    description: 'Elections for the 450 seats of the 9th State Duma under a multi-day voting process.',
    keyIssues: [
      'Remote Electronic Voting (REV) platform verification',
      'Multi-day ballot box storage security'
    ],
    monitoringMission: 'AEO Global Comparative Electoral Systems Program'
  },
  {
    id: 'oth-germany-berlin',
    date: '2026-09-20',
    title: 'Germany, Berlin State Election',
    subtitle: 'Europe · Abgeordnetenhaus',
    status: 'Scheduled',
    region: 'other',
    type: 'governorship',
    country: 'Germany',
    location: 'Berlin State, Germany',
    electoralBody: 'Landeswahlleiterin Berlin',
    registeredVoters: '2,400,000 voters',
    pollingUnits: '2,200 polling stations',
    description: 'Election for the House of Representatives (Abgeordnetenhaus) of the city-state of Berlin.',
    keyIssues: [
      'State-level election administration and ballot logistics',
      'Postal voting percentage trends'
    ],
    monitoringMission: 'AEO European Municipal & State Observatory'
  },
  {
    id: 'oth-germany-mecklenburg',
    date: '2026-09-20',
    title: 'Germany, Mecklenburg-Vorpommern State Election',
    subtitle: 'Europe · Landtag Parliament',
    status: 'Scheduled',
    region: 'other',
    type: 'governorship',
    country: 'Germany',
    location: 'Mecklenburg-Vorpommern, Germany',
    electoralBody: 'Landeswahlleiter Mecklenburg-Vorpommern',
    registeredVoters: '1,300,000 voters',
    pollingUnits: '1,600 polling stations',
    description: 'State parliament election to elect members of the 8th Landtag of Mecklenburg-Vorpommern.',
    keyIssues: [
      'Coastal and rural constituency voter turnout',
      'Coalition government formation'
    ],
    monitoringMission: 'AEO Subnational Governance Monitor'
  },
  {
    id: 'oth-russia-reg',
    date: '2026-09-20',
    title: 'Russia Regional Elections',
    subtitle: 'Europe/Asia · Regional Governors & Assemblies',
    status: 'Scheduled',
    region: 'other',
    type: 'governorship',
    country: 'Russia',
    location: 'Regional Subjects across Russia',
    electoralBody: 'Central Election Commission (CEC Russia)',
    registeredVoters: 'Regional Electorates',
    pollingUnits: 'Regional Voting Stations',
    description: 'Gubernatorial and regional legislative elections held on the single voting day.',
    keyIssues: [
      'Regional election commission oversight',
      'Candidate qualification and ballot registration'
    ],
    monitoringMission: 'AEO Eurasian Subnational Observatory'
  },
  {
    id: 'oth-isleofman',
    date: '2026-09-24',
    title: 'Isle of Man General Election',
    subtitle: 'Europe · House of Keys',
    status: 'Scheduled',
    region: 'other',
    type: 'other',
    country: 'Isle of Man',
    location: '12 Constituencies, Isle of Man',
    electoralBody: 'Crown Dependency Returning Officers',
    registeredVoters: '65,000 voters',
    pollingUnits: '50 polling stations',
    description: 'Election to fill the 24 seats of the House of Keys in the Tynwald parliament.',
    keyIssues: [
      'Single transferable vote (STV) counting speed',
      'Independent candidate platform evaluation'
    ],
    monitoringMission: 'AEO Small Island States Governance Desk'
  },
  {
    id: 'oth-french-senate',
    date: '2026-09-27',
    title: 'French Senate Elections',
    subtitle: 'Europe · Sénat Upper House',
    status: 'Scheduled',
    region: 'other',
    type: 'other',
    country: 'France',
    location: 'French Departments (Series 2 Renewal)',
    electoralBody: 'Ministère de l\'Intérieur',
    registeredVoters: '78,000 Grand Électeurs',
    pollingUnits: 'Departmental Prefecture Voting Halls',
    description: 'Indirect elections to renew half of the seats (Series 2) in the French Senate.',
    keyIssues: [
      'Electoral college delegate voting discipline',
      'Proportional representation in larger departments'
    ],
    monitoringMission: 'AEO European Legislative Systems Program'
  },
  {
    id: 'oth-bosnia',
    date: '2026-10-04',
    title: 'Bosnia and Herzegovina General Election',
    subtitle: 'Europe · Presidency & Parliament',
    status: 'Scheduled',
    region: 'other',
    type: 'presidential',
    country: 'Bosnia and Herzegovina',
    location: 'Federation of BiH & Republika Srpska',
    electoralBody: 'Central Election Commission (CEC BiH)',
    registeredVoters: '3,300,000 voters',
    pollingUnits: '5,500 polling stations',
    description: 'General election to elect the three-member Presidency and Parliamentary Assembly.',
    keyIssues: [
      'Introduction of biometric identification scanners',
      'Optical ballot scanner pilot testing integrity'
    ],
    monitoringMission: 'AEO Balkan Democratic Audit Panel'
  },
  {
    id: 'oth-brazil-gen1',
    date: '2026-10-04',
    title: 'Brazil General Election (First Round)',
    subtitle: 'Americas · Presidential & Congressional',
    status: 'Scheduled',
    region: 'other',
    type: 'presidential',
    country: 'Brazil',
    location: 'Brasília & 26 States + Federal District',
    electoralBody: 'TSE (Tribunal Superior Eleitoral)',
    registeredVoters: '156,000,000 voters',
    pollingUnits: '470,000 voting machines (Urnas Eletrônicas)',
    description: 'First round of elections to elect the President of Brazil, Chamber of Deputies, and 1/3 of the Senate.',
    keyIssues: [
      'Urna Eletrônica electronic voting machine public test audits',
      'TSE real-time election result transmission speed'
    ],
    monitoringMission: 'AEO Latin American Electoral Audit Program'
  },
  {
    id: 'oth-brazil-gov1',
    date: '2026-10-04',
    title: 'Brazil Gubernatorial Election (First Round)',
    subtitle: 'Americas · State Governors',
    status: 'Scheduled',
    region: 'other',
    type: 'governorship',
    country: 'Brazil',
    location: '26 States & Federal District, Brazil',
    electoralBody: 'TSE (Tribunal Superior Eleitoral)',
    registeredVoters: '156,000,000 voters',
    pollingUnits: '470,000 voting machines',
    description: 'First round elections to elect State Governors and State Assemblies across all 26 Brazilian states.',
    keyIssues: [
      'State-level electoral court (TRE) result processing',
      'Campaign finance compliance monitoring'
    ],
    monitoringMission: 'AEO Subnational Governance Monitor'
  },
  {
    id: 'oth-czech-muni',
    date: '2026-10-09',
    title: 'Czech Republic Municipal Election',
    subtitle: 'Europe · Local Councils',
    status: 'Scheduled',
    region: 'other',
    type: 'local_government',
    country: 'Czech Republic',
    location: '6,200+ Municipalities, Czech Republic',
    electoralBody: 'State Electoral Committee',
    registeredVoters: '8,300,000 voters',
    pollingUnits: '14,700 polling precincts',
    description: 'Elections to municipal councils and assembly bodies across the Czech Republic.',
    keyIssues: [
      'Local coalition agreements transparency',
      'Voter turnout in municipal wards'
    ],
    monitoringMission: 'AEO European Local Democracy Research Unit'
  },
  {
    id: 'oth-czech-sen1',
    date: '2026-10-09',
    title: 'Czech Republic Senate Election (First Round)',
    subtitle: 'Europe · Senát 1/3 Renewal',
    status: 'Scheduled',
    region: 'other',
    type: 'other',
    country: 'Czech Republic',
    location: '27 Senate Districts, Czech Republic',
    electoralBody: 'State Electoral Committee',
    registeredVoters: '2,700,000 voters in 27 districts',
    pollingUnits: '4,900 polling precincts',
    description: 'First round elections to renew one-third (27 seats) of the Senate of the Parliament of the Czech Republic.',
    keyIssues: [
      'Two-round majority system runoff qualifiers',
      'Paper ballot counting verification'
    ],
    monitoringMission: 'AEO Legislative Systems Desk'
  },
  {
    id: 'oth-israel',
    date: 'Oct 2026',
    title: 'Israel Legislative Election',
    subtitle: 'Asia/Middle East · Knesset Parliament',
    status: 'Scheduled',
    region: 'other',
    type: 'other',
    country: 'Israel',
    location: 'Nationwide Knesset Precincts, Israel',
    electoralBody: 'Central Elections Committee',
    registeredVoters: '6,800,000 voters',
    pollingUnits: '12,000 polling stations',
    description: 'Election for all 120 seats of the 26th Knesset under a single nationwide proportional representation threshold.',
    keyIssues: [
      '3.25% electoral threshold calculations',
      'Double-envelope voting verification for military and diplomatic personnel'
    ],
    monitoringMission: 'AEO Comparative Electoral Thresholds Study'
  },
  {
    id: 'oth-czech-sen2',
    date: '2026-10-16',
    title: 'Czech Republic Senate Election (Second Round)',
    subtitle: 'Europe · Senát Runoffs',
    status: 'Scheduled',
    region: 'other',
    type: 'other',
    country: 'Czech Republic',
    location: 'Senate Runoff Districts, Czech Republic',
    electoralBody: 'State Electoral Committee',
    registeredVoters: 'Runoff District Electorates',
    pollingUnits: 'Runoff Polling Precincts',
    description: 'Second round runoff elections for Senate districts where no candidate secured an absolute majority in round one.',
    keyIssues: [
      'Runoff voter turnout stability',
      'Timely certification of Senate returns'
    ],
    monitoringMission: 'AEO Parliamentary Audit Unit'
  },
  {
    id: 'oth-canada-bc',
    date: '2026-10-17',
    title: 'Canada, British Columbia Municipal Election',
    subtitle: 'Americas · Local Government',
    status: 'Scheduled',
    region: 'other',
    type: 'local_government',
    country: 'Canada',
    location: 'British Columbia Municipalities, Canada',
    electoralBody: 'Elections BC & Municipal Electoral Officers',
    registeredVoters: '3,500,000 voters',
    pollingUnits: '1,800 voting places',
    description: 'Fixed-date municipal elections for Mayors, City Councils, and School Boards across British Columbia.',
    keyIssues: [
      'Automated vote tabulator machine accuracy',
      'Campaign contribution limit auditing'
    ],
    monitoringMission: 'AEO North American Local Democracy Desk'
  },
  {
    id: 'oth-slovakia-loc',
    date: '2026-10-24',
    title: 'Slovakia Local Election',
    subtitle: 'Europe · Municipalities & Towns',
    status: 'Scheduled',
    region: 'other',
    type: 'local_government',
    country: 'Slovakia',
    location: '2,900+ Slovak Municipalities',
    electoralBody: 'State Commission for Elections',
    registeredVoters: '4,400,000 voters',
    pollingUnits: '6,000 polling precincts',
    description: 'Concurrent local council and mayoral elections across Slovak municipalities.',
    keyIssues: [
      'Paper ballot reconciliation and regional committee reporting',
      'Independent candidate registration transparency'
    ],
    monitoringMission: 'AEO European Subnational Governance Desk'
  },
  {
    id: 'oth-slovakia-reg',
    date: '2026-10-24',
    title: 'Slovakia Regional Election',
    subtitle: 'Europe · Self-Governing Regions',
    status: 'Scheduled',
    region: 'other',
    type: 'governorship',
    country: 'Slovakia',
    location: '8 Self-Governing Regions (VÚC), Slovakia',
    electoralBody: 'State Commission for Elections',
    registeredVoters: '4,400,000 voters',
    pollingUnits: '6,000 polling precincts',
    description: 'Elections for regional presidents (Governors) and regional parliaments across Slovakia\'s 8 regions.',
    keyIssues: [
      'Regional presidency single-round majority outcomes',
      'Regional assembly proportional seat allocation'
    ],
    monitoringMission: 'AEO Regional Governance Research Unit'
  },
  {
    id: 'oth-brazil-gen2',
    date: '2026-10-25',
    title: 'Brazil General Election (Potential Second Round)',
    subtitle: 'Americas · Presidential Runoff',
    status: 'Scheduled',
    region: 'other',
    type: 'presidential',
    country: 'Brazil',
    location: 'Nationwide Brazil & Overseas Diplomatic Posts',
    electoralBody: 'TSE (Tribunal Superior Eleitoral)',
    registeredVoters: '156,000,000 voters',
    pollingUnits: '470,000 voting machines',
    description: 'Potential second round presidential runoff election if no candidate obtains an absolute majority in the first round.',
    keyIssues: [
      'TSE real-time electronic tally audit and encryption checks',
      'Head-to-head presidential debate compliance'
    ],
    monitoringMission: 'AEO Latin American Integrity Mission'
  },
  {
    id: 'oth-brazil-gov2',
    date: '2026-10-25',
    title: 'Brazil Gubernatorial Election (Potential Second Round)',
    subtitle: 'Americas · State Governor Runoffs',
    status: 'Scheduled',
    region: 'other',
    type: 'governorship',
    country: 'Brazil',
    location: 'Runoff States in Brazil',
    electoralBody: 'TSE (Tribunal Superior Eleitoral)',
    registeredVoters: 'Runoff State Electorates',
    pollingUnits: 'State Polling Machines',
    description: 'Gubernatorial runoff elections in states where no candidate achieved over 50% valid votes in round one.',
    keyIssues: [
      'State-level electoral tally speed',
      'Police neutrality during runoff polling'
    ],
    monitoringMission: 'AEO Subnational Governance Monitor'
  },
  {
    id: 'oth-canada-ontario',
    date: '2026-10-26',
    title: 'Canada, Ontario Municipal Election',
    subtitle: 'Americas · Local Government',
    status: 'Scheduled',
    region: 'other',
    type: 'local_government',
    country: 'Canada',
    location: '444 Municipalities, Ontario, Canada',
    electoralBody: 'Ontario Municipal Electoral Officers',
    registeredVoters: '10,000,000 voters',
    pollingUnits: '5,000 voting locations',
    description: 'Quadrennial municipal elections to elect Mayors, City Councillors, and School Board Trustees across Ontario.',
    keyIssues: [
      'Internet and phone voting system security audits in participating municipalities',
      'Optical scan tabulator validation'
    ],
    monitoringMission: 'AEO North American Local Democracy Desk'
  },
  {
    id: 'oth-canada-manitoba',
    date: '2026-10-28',
    title: 'Canada, Manitoba Municipal Election',
    subtitle: 'Americas · Local Government',
    status: 'Scheduled',
    region: 'other',
    type: 'local_government',
    country: 'Canada',
    location: '137 Municipalities, Manitoba, Canada',
    electoralBody: 'Manitoba Municipal Authorities',
    registeredVoters: '850,000 voters',
    pollingUnits: '600 polling stations',
    description: 'General municipal elections across Manitoba cities, towns, and rural municipalities.',
    keyIssues: [
      'Voter list accuracy and mail-in ballot tracking',
      'Municipal council ward boundary changes'
    ],
    monitoringMission: 'AEO Grassroots Governance Monitor'
  },
  {
    id: 'oth-canada-pei',
    date: '2026-11-02',
    title: 'Canada, Prince Edward Island Municipal Election',
    subtitle: 'Americas · Local Government',
    status: 'Scheduled',
    region: 'other',
    type: 'local_government',
    country: 'Canada',
    location: 'Prince Edward Island Municipalities, Canada',
    electoralBody: 'Elections PEI & Municipal Officers',
    registeredVoters: '120,000 voters',
    pollingUnits: '100 voting stations',
    description: 'Municipal elections to elect Mayors and Councillors across PEI communities.',
    keyIssues: [
      'Rural municipal voter turnout',
      'Election worker training and paper ballot counting'
    ],
    monitoringMission: 'AEO Small Communities Electoral Desk'
  },
  {
    id: 'oth-philippines-sk',
    date: '2026-11-02',
    title: 'Philippines Barangay & Sangguniang Kabataan Election',
    subtitle: 'Asia · Grassroots & Youth Councils',
    status: 'Scheduled',
    region: 'other',
    type: 'local_government',
    country: 'Philippines',
    location: '42,000+ Barangay Wards, Philippines',
    electoralBody: 'COMELEC (Commission on Elections)',
    registeredVoters: '67,000,000 voters',
    pollingUnits: '170,000 voting precincts',
    description: 'Grassroots elections to elect Barangay Captains, Council Members, and Youth Council (Sangguniang Kabataan) leaders.',
    keyIssues: [
      'Manual ballot counting at precinct level',
      'Prevention of local vote-buying and intimidation'
    ],
    monitoringMission: 'AEO Grassroots Democracy Audit Desk'
  },
  {
    id: 'oth-us-gov',
    date: '2026-11-03',
    title: 'United States Gubernatorial Elections',
    subtitle: 'Americas · State Governors',
    status: 'Scheduled',
    region: 'other',
    type: 'governorship',
    country: 'United States',
    location: '36 US States & 3 Territories',
    electoralBody: 'State Boards of Elections',
    registeredVoters: '120,000,000 voters in gubernatorial states',
    pollingUnits: '70,000 voting precincts',
    description: 'Elections to elect State Governors in 36 US states and 3 territories.',
    keyIssues: [
      'State executive branch power shifts',
      'Electoral machinery oversight laws'
    ],
    monitoringMission: 'AEO Subnational Governance Monitor'
  },
  {
    id: 'oth-1',
    date: '2026-11-03',
    title: 'United States Midterm Elections',
    subtitle: 'Other Continents · Global Reference',
    status: 'Scheduled',
    region: 'other',
    type: 'presidential',
    country: 'United States',
    location: 'United States (50 States & Territories)',
    electoralBody: 'State & County Election Boards',
    registeredVoters: '168,000,000 voters',
    pollingUnits: '100,000+ voting precincts',
    lgasCount: '3,143 Counties',
    description: 'United States federal elections held midway through the presidential term to elect all 435 members of the House of Representatives and 33 members of the Senate.',
    keyIssues: [
      'Mail-in ballot reconciliation rules and state audit laws',
      'Electronic voting machine hardware security certification',
      'Congressional district redistricting disputes'
    ],
    monitoringMission: 'AEO Global Comparative Electoral Systems Program'
  },
  {
    id: 'oth-newzealand',
    date: '2026-11-07',
    title: 'New Zealand General Election',
    subtitle: 'Oceania · House of Representatives',
    status: 'Scheduled',
    region: 'other',
    type: 'presidential',
    country: 'New Zealand',
    location: '72 General & Māori Electorates, New Zealand',
    electoralBody: 'Electoral Commission New Zealand',
    registeredVoters: '3,800,000 voters',
    pollingUnits: '2,600 voting places',
    description: 'General election to elect members of the 55th New Zealand Parliament under Mixed Member Proportional (MMP) voting.',
    keyIssues: [
      'MMP party vote threshold allocation and overhang seat math',
      'Advance voting trend tracking'
    ],
    monitoringMission: 'AEO Oceania Electoral Integrity Desk'
  },
  {
    id: 'oth-taiwan',
    date: '2026-11-28',
    title: 'Taiwan Local Elections',
    subtitle: 'Asia · Municipalities & Counties',
    status: 'Scheduled',
    region: 'other',
    type: 'local_government',
    country: 'Taiwan',
    location: 'Special Municipalities, Cities & Counties, Taiwan',
    electoralBody: 'Central Election Commission (CEC Taiwan)',
    registeredVoters: '19,300,000 voters',
    pollingUnits: '17,500 polling stations',
    description: 'Nine-in-one local elections to elect Mayors, County Magistrates, and Local Council Members.',
    keyIssues: [
      'Paper ballot hand counting in public view',
      'Digital campaign transparency and cybersecurity defense'
    ],
    monitoringMission: 'AEO Asia-Pacific Democratic Audit Team'
  },
  {
    id: 'oth-australia-vic',
    date: '2026-11-28',
    title: 'Australia, Victoria State Election',
    subtitle: 'Oceania · Legislative Assembly & Council',
    status: 'Scheduled',
    region: 'other',
    type: 'governorship',
    country: 'Australia',
    location: 'Victoria State, Australia',
    electoralBody: 'Victorian Electoral Commission (VEC)',
    registeredVoters: '4,400,000 voters',
    pollingUnits: '1,800 voting centers',
    description: 'State election for all 88 seats in the Legislative Assembly and 40 seats in the Legislative Council of Victoria.',
    keyIssues: [
      'Compulsory voting turnout verification',
      'Single transferable vote (STV) preference distribution speed'
    ],
    monitoringMission: 'AEO Subnational Electoral Systems Unit'
  },
  {
    id: 'oth-haiti-2',
    date: '2026-12-06',
    title: 'Haiti General Election (Second Round)',
    subtitle: 'Americas · Presidential & Legislative Runoff',
    status: 'Scheduled',
    region: 'other',
    type: 'presidential',
    country: 'Haiti',
    location: 'Nationwide Haiti',
    electoralBody: 'Conseil Électoral Provisoire (CEP)',
    registeredVoters: '6,500,000 voters',
    pollingUnits: '1,500 voting centers',
    description: 'Second round runoff elections for Presidential and Legislative races in Haiti.',
    keyIssues: [
      'Public order during runoff tabulation',
      'International observer access to central tally center'
    ],
    monitoringMission: 'AEO Americas Electoral Integrity Desk'
  },
  {
    id: 'oth-2',
    date: 'Apr 2027',
    title: 'France Presidential Election',
    subtitle: 'Other Continents · European Benchmark',
    status: 'Scheduled',
    region: 'other',
    type: 'presidential',
    country: 'France',
    location: 'France & Overseas Territories',
    electoralBody: 'Conseil Constitutionnel / Ministère de l\'Intérieur',
    registeredVoters: '49,500,000 voters',
    pollingUnits: '35,000 polling stations',
    lgasCount: '101 Departments',
    description: 'Two-round direct popular vote election to elect the President of the French Republic for a five-year term.',
    keyIssues: [
      'Two-round runoff voting system integrity',
      'Foreign election interference and digital disinformation monitoring'
    ],
    monitoringMission: 'AEO Comparative Democratic Research Desk'
  }
];

export const EVENTS: EventItem[] = [
  {
    id: 'evt-1',
    month: 'AUG',
    day: '20',
    title: 'EHII Methodology Briefing',
    description: 'Presentation of the Electoral Health & Integrity Index to partners.',
    location: 'Abuja',
    type: 'Roundtable',
    externalLink: 'https://forms.google.com/',
    links: [
      { label: 'View Our Publications', url: '/publications', external: false },
      { label: 'Submit Partner Cooperation Request', url: 'mailto:aeo@athenacentre.org', external: true }
    ]
  },
  {
    id: 'evt-2',
    month: 'SEP',
    day: '05',
    title: 'Post-Osun Findings Forum',
    description: 'Early observations from the Osun governorship monitoring.',
    location: 'Virtual',
    type: 'Public',
    externalLink: 'https://zoom.us/j/athenaosunfindings',
    links: [
      { label: 'View Our Publications', url: '/publications', external: false },
      { label: 'Submit Partner Cooperation Request', url: 'mailto:aeo@athenacentre.org', external: true }
    ]
  },
  {
    id: 'evt-3',
    month: 'NOV',
    day: '12',
    title: 'Democracy & Data Series',
    description: 'Evidence in election observation — a practitioner workshop.',
    location: 'Lagos',
    type: 'Workshop',
    externalLink: 'https://forms.google.com/',
    links: [
      { label: 'View Our Publications', url: '/publications', external: false },
      { label: 'Submit Partner Cooperation Request', url: 'mailto:aeo@athenacentre.org', external: true }
    ]
  }
];

export const TEAM: TeamMember[] = [
  {
    id: 'team-1',
    initials: 'AE',
    name: 'Observatory Lead',
    role: 'Strategy & methodology'
  },
  {
    id: 'team-2',
    initials: 'DA',
    name: 'Data & Forensics',
    role: 'Audit pipelines'
  },
  {
    id: 'team-3',
    initials: 'FM',
    name: 'Field Monitoring',
    role: 'Real-time observation'
  },
  {
    id: 'team-4',
    initials: 'CR',
    name: 'Communications',
    role: 'AEO Weekly & reports'
  }
];

export const WEEKLY_ISSUES: WeeklyIssue[] = [
  {
    id: 'weekly-custom-64kyo',
    title: 'The AEO Read: Monitoring Nigeria\'s Democratic and Electoral Landscape',
    tag: 'AEO WEEKLY DIGEST',
    date: '15 October 2026',
    summary: 'Monthly evidence-based assessment across five permanent pillars: Accreditation, EC8A Reconciliation, Collation, Dispute Adjudication, and Political Climate.',
    linkText: 'Read Issue',
    author: 'Athena Intelligence Desk',
    pdfUrl: 'ref:pdf_custom-64kyo',
    slug: 'the-aeo-read-monitoring-nigerias-democratic-and-electoral-landscape',
    createdAt: 1729006301964,
    reads: 284,
    downloads: 62
  }
];

export const ANNOUNCEMENTS: AnnouncementItem[] = [];

