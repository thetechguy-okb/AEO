import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Users, MapPin, CheckCircle2, AlertCircle, Search, Calendar, Landmark, 
  FileText, ClipboardCheck, Clock, ShieldCheck, BarChart3, Info, CreditCard
} from 'lucide-react';
import SEO from './SEO';
import { PartyLogo } from './PartyLogo';
import { INITIAL_STATES, StateMonitor, PartyVote, LgaPartyStanding, getLgaOthersVotes, getLgaValidVotes } from './LiveDashboard';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface WardStanding {
  wardName: string;
  lgaName: string;
  registeredVoters: number;
  accreditedVoters: number;
  status: 'Ready' | 'Verified' | 'Flagged' | 'Active';
  leadingParty?: string;
  leadingVotes?: number;
  reconciliationRate: string;
  incidentsReported: number;
}

const STATE_WARDS: Record<string, WardStanding[]> = {
  OS: [
    { wardName: "Osogbo Ward I", lgaName: "Osogbo", registeredVoters: 12450, accreditedVoters: 0, status: 'Ready', reconciliationRate: "Pending", incidentsReported: 0 },
    { wardName: "Osogbo Ward II", lgaName: "Osogbo", registeredVoters: 14200, accreditedVoters: 0, status: 'Ready', reconciliationRate: "Pending", incidentsReported: 0 },
    { wardName: "Ede South Ward III", lgaName: "Ede South", registeredVoters: 9800, accreditedVoters: 0, status: 'Active', reconciliationRate: "Pending", incidentsReported: 0 },
    { wardName: "Ede North Ward I", lgaName: "Ede North", registeredVoters: 11150, accreditedVoters: 0, status: 'Ready', reconciliationRate: "Pending", incidentsReported: 0 },
    { wardName: "Ife Central Ward IV", lgaName: "Ife Central", registeredVoters: 15600, accreditedVoters: 0, status: 'Active', reconciliationRate: "Pending", incidentsReported: 0 },
    { wardName: "Ilesa East Ward II", lgaName: "Ilesa East", registeredVoters: 8900, accreditedVoters: 0, status: 'Ready', reconciliationRate: "Pending", incidentsReported: 0 },
    { wardName: "Ila Ward I", lgaName: "Ila", registeredVoters: 7600, accreditedVoters: 0, status: 'Ready', reconciliationRate: "Pending", incidentsReported: 0 }
  ],
  EK: [
    { wardName: "Ado Ward 01", lgaName: "Ado", registeredVoters: 15200, accreditedVoters: 10450, status: 'Verified', leadingParty: "APC", leadingVotes: 6120, reconciliationRate: "100%", incidentsReported: 1 },
    { wardName: "Ado Ward 04", lgaName: "Ado", registeredVoters: 11800, accreditedVoters: 8150, status: 'Verified', leadingParty: "APC", leadingVotes: 4900, reconciliationRate: "100%", incidentsReported: 0 },
    { wardName: "Ikere Ward II", lgaName: "Ikere", registeredVoters: 13400, accreditedVoters: 9200, status: 'Verified', leadingParty: "SDP", leadingVotes: 4320, reconciliationRate: "100%", incidentsReported: 2 },
    { wardName: "Oye Ward I", lgaName: "Oye", registeredVoters: 10500, accreditedVoters: 7400, status: 'Verified', leadingParty: "APC", leadingVotes: 4200, reconciliationRate: "100%", incidentsReported: 0 },
    { wardName: "Ekiti West Ward III", lgaName: "Ekiti West", registeredVoters: 9200, accreditedVoters: 6100, status: 'Verified', leadingParty: "APC", leadingVotes: 3650, reconciliationRate: "100%", incidentsReported: 0 },
    { wardName: "Ekiti East Ward II", lgaName: "Ekiti East", registeredVoters: 14100, accreditedVoters: 8900, status: 'Flagged', leadingParty: "PDP", leadingVotes: 3910, reconciliationRate: "92.5%", incidentsReported: 5 }
  ],
  AN: [
    { wardName: "Awka Ward I", lgaName: "Awka South", registeredVoters: 18100, accreditedVoters: 11200, status: 'Verified', leadingParty: "APGA", leadingVotes: 7200, reconciliationRate: "100%", incidentsReported: 0 },
    { wardName: "Awka Ward IV", lgaName: "Awka South", registeredVoters: 14500, accreditedVoters: 8900, status: 'Verified', leadingParty: "LP", leadingVotes: 4100, reconciliationRate: "100%", incidentsReported: 1 },
    { wardName: "Onitsha Ward II", lgaName: "Onitsha North", registeredVoters: 22000, accreditedVoters: 13400, status: 'Verified', leadingParty: "YPP", leadingVotes: 6100, reconciliationRate: "100%", incidentsReported: 3 },
    { wardName: "Nnewi Ward I", lgaName: "Nnewi North", registeredVoters: 16700, accreditedVoters: 10100, status: 'Verified', leadingParty: "YPP", leadingVotes: 5800, reconciliationRate: "100%", incidentsReported: 0 },
    { wardName: "Ihiala Ward III", lgaName: "Ihiala", registeredVoters: 15400, accreditedVoters: 7800, status: 'Flagged', leadingParty: "APGA", leadingVotes: 3200, reconciliationRate: "88.4%", incidentsReported: 7 },
    { wardName: "Anaocha Ward II", lgaName: "Anaocha", registeredVoters: 12300, accreditedVoters: 8100, status: 'Verified', leadingParty: "LP", leadingVotes: 4950, reconciliationRate: "100%", incidentsReported: 0 }
  ],
  OD: [
    { wardName: "Akure Ward 02", lgaName: "Akure South", registeredVoters: 19500, accreditedVoters: 13100, status: 'Verified', leadingParty: "APC", leadingVotes: 8100, reconciliationRate: "100%", incidentsReported: 0 },
    { wardName: "Akure Ward 07", lgaName: "Akure South", registeredVoters: 16100, accreditedVoters: 10900, status: 'Verified', leadingParty: "APC", leadingVotes: 6700, reconciliationRate: "100%", incidentsReported: 1 },
    { wardName: "Ondo Ward I", lgaName: "Ondo West", registeredVoters: 14200, accreditedVoters: 9500, status: 'Verified', leadingParty: "APC", leadingVotes: 5900, reconciliationRate: "100%", incidentsReported: 0 },
    { wardName: "Owo Ward II", lgaName: "Owo", registeredVoters: 13800, accreditedVoters: 9900, status: 'Verified', leadingParty: "APC", leadingVotes: 7100, reconciliationRate: "100%", incidentsReported: 0 },
    { wardName: "Okitipupa Ward III", lgaName: "Okitipupa", registeredVoters: 15300, accreditedVoters: 9100, status: 'Verified', leadingParty: "PDP", leadingVotes: 4400, reconciliationRate: "100%", incidentsReported: 2 },
    { wardName: "Ilaje Ward IV", lgaName: "Ilaje", registeredVoters: 17400, accreditedVoters: 10200, status: 'Flagged', leadingParty: "APC", leadingVotes: 5100, reconciliationRate: "94.2%", incidentsReported: 4 }
  ]
};

const OSUN_LGAS_FALLBACK: LgaPartyStanding[] = [
  { lgaName: 'Osogbo', accreditedVoters: 68400, first: { name: 'APC', color: 'bg-emerald-600', fullName: 'All Progressives Congress', votes: 0 }, second: { name: 'A', color: 'bg-purple-600', fullName: 'Accord', votes: 0 }, third: { name: 'ADC', color: 'bg-blue-500', fullName: 'African Democratic Congress', votes: 0 } },
  { lgaName: 'Olorunda', accreditedVoters: 59800, first: { name: 'APC', color: 'bg-emerald-600', fullName: 'All Progressives Congress', votes: 0 }, second: { name: 'A', color: 'bg-purple-600', fullName: 'Accord', votes: 0 }, third: { name: 'ADC', color: 'bg-blue-500', fullName: 'African Democratic Congress', votes: 0 } },
  { lgaName: 'Ede South', accreditedVoters: 45200, first: { name: 'A', color: 'bg-purple-600', fullName: 'Accord', votes: 0 }, second: { name: 'APC', color: 'bg-emerald-600', fullName: 'All Progressives Congress', votes: 0 }, third: { name: 'ADC', color: 'bg-blue-500', fullName: 'African Democratic Congress', votes: 0 } },
  { lgaName: 'Ede North', accreditedVoters: 42600, first: { name: 'A', color: 'bg-purple-600', fullName: 'Accord', votes: 0 }, second: { name: 'APC', color: 'bg-emerald-600', fullName: 'All Progressives Congress', votes: 0 }, third: { name: 'AA', color: 'bg-indigo-500', fullName: 'Action Alliance', votes: 0 } },
  { lgaName: 'Ife Central', accreditedVoters: 82100, first: { name: 'APC', color: 'bg-emerald-600', fullName: 'All Progressives Congress', votes: 0 }, second: { name: 'A', color: 'bg-purple-600', fullName: 'Accord', votes: 0 }, third: { name: 'ADC', color: 'bg-blue-500', fullName: 'African Democratic Congress', votes: 0 } },
  { lgaName: 'Ife East', accreditedVoters: 58200, first: { name: 'APC', color: 'bg-emerald-600', fullName: 'All Progressives Congress', votes: 0 }, second: { name: 'A', color: 'bg-purple-600', fullName: 'Accord', votes: 0 }, third: { name: 'YPP', color: 'bg-emerald-800', fullName: 'Young Progressives Party', votes: 0 } },
  { lgaName: 'Ife North', accreditedVoters: 39400, first: { name: 'APC', color: 'bg-emerald-600', fullName: 'All Progressives Congress', votes: 0 }, second: { name: 'A', color: 'bg-purple-600', fullName: 'Accord', votes: 0 }, third: { name: 'ADC', color: 'bg-blue-500', fullName: 'African Democratic Congress', votes: 0 } },
  { lgaName: 'Ife South', accreditedVoters: 36100, first: { name: 'APC', color: 'bg-emerald-600', fullName: 'All Progressives Congress', votes: 0 }, second: { name: 'A', color: 'bg-purple-600', fullName: 'Accord', votes: 0 }, third: { name: 'ADC', color: 'bg-blue-500', fullName: 'African Democratic Congress', votes: 0 } },
  { lgaName: 'Ilesa East', accreditedVoters: 54300, first: { name: 'APC', color: 'bg-emerald-600', fullName: 'All Progressives Congress', votes: 0 }, second: { name: 'A', color: 'bg-purple-600', fullName: 'Accord', votes: 0 }, third: { name: 'AA', color: 'bg-indigo-500', fullName: 'Action Alliance', votes: 0 } },
  { lgaName: 'Ilesa West', accreditedVoters: 47200, first: { name: 'APC', color: 'bg-emerald-600', fullName: 'All Progressives Congress', votes: 0 }, second: { name: 'A', color: 'bg-purple-600', fullName: 'Accord', votes: 0 }, third: { name: 'ADC', color: 'bg-blue-500', fullName: 'African Democratic Congress', votes: 0 } },
  { lgaName: 'Ila', accreditedVoters: 38100, first: { name: 'APC', color: 'bg-emerald-600', fullName: 'All Progressives Congress', votes: 0 }, second: { name: 'A', color: 'bg-purple-600', fullName: 'Accord', votes: 0 }, third: { name: 'ADC', color: 'bg-blue-500', fullName: 'African Democratic Congress', votes: 0 } },
  { lgaName: 'Ejigbo', accreditedVoters: 49200, first: { name: 'APC', color: 'bg-emerald-600', fullName: 'All Progressives Congress', votes: 0 }, second: { name: 'A', color: 'bg-purple-600', fullName: 'Accord', votes: 0 }, third: { name: 'ADP', color: 'bg-teal-600', fullName: 'Action Democratic Party', votes: 0 } },
  { lgaName: 'Iwo', accreditedVoters: 61500, first: { name: 'APC', color: 'bg-emerald-600', fullName: 'All Progressives Congress', votes: 0 }, second: { name: 'A', color: 'bg-purple-600', fullName: 'Accord', votes: 0 }, third: { name: 'ADC', color: 'bg-blue-500', fullName: 'African Democratic Congress', votes: 0 } },
  { lgaName: 'Irepodun', accreditedVoters: 36400, first: { name: 'APC', color: 'bg-emerald-600', fullName: 'All Progressives Congress', votes: 0 }, second: { name: 'A', color: 'bg-purple-600', fullName: 'Accord', votes: 0 }, third: { name: 'ADC', color: 'bg-blue-500', fullName: 'African Democratic Congress', votes: 0 } },
  { lgaName: 'Boripe', accreditedVoters: 33200, first: { name: 'APC', color: 'bg-emerald-600', fullName: 'All Progressives Congress', votes: 0 }, second: { name: 'A', color: 'bg-purple-600', fullName: 'Accord', votes: 0 }, third: { name: 'ADC', color: 'bg-blue-500', fullName: 'African Democratic Congress', votes: 0 } },
  { lgaName: 'Ayedaade', accreditedVoters: 41800, first: { name: 'A', color: 'bg-purple-600', fullName: 'Accord', votes: 0 }, second: { name: 'APC', color: 'bg-emerald-600', fullName: 'All Progressives Congress', votes: 0 }, third: { name: 'ADC', color: 'bg-blue-500', fullName: 'African Democratic Congress', votes: 0 } },
  { lgaName: 'Ayedire', accreditedVoters: 28900, first: { name: 'APC', color: 'bg-emerald-600', fullName: 'All Progressives Congress', votes: 0 }, second: { name: 'A', color: 'bg-purple-600', fullName: 'Accord', votes: 0 }, third: { name: 'AA', color: 'bg-indigo-500', fullName: 'Action Alliance', votes: 0 } },
  { lgaName: 'Obokun', accreditedVoters: 35900, first: { name: 'A', color: 'bg-purple-600', fullName: 'Accord', votes: 0 }, second: { name: 'APC', color: 'bg-emerald-600', fullName: 'All Progressives Congress', votes: 0 }, third: { name: 'ADC', color: 'bg-blue-500', fullName: 'African Democratic Congress', votes: 0 } },
  { lgaName: 'Egbedore', accreditedVoters: 31400, first: { name: 'A', color: 'bg-purple-600', fullName: 'Accord', votes: 0 }, second: { name: 'APC', color: 'bg-emerald-600', fullName: 'All Progressives Congress', votes: 0 }, third: { name: 'ADC', color: 'bg-blue-500', fullName: 'African Democratic Congress', votes: 0 } },
  { lgaName: 'Atakumosa East', accreditedVoters: 26500, first: { name: 'APC', color: 'bg-emerald-600', fullName: 'All Progressives Congress', votes: 0 }, second: { name: 'A', color: 'bg-purple-600', fullName: 'Accord', votes: 0 }, third: { name: 'ADC', color: 'bg-blue-500', fullName: 'African Democratic Congress', votes: 0 } },
  { lgaName: 'Atakumosa West', accreditedVoters: 29100, first: { name: 'APC', color: 'bg-emerald-600', fullName: 'All Progressives Congress', votes: 0 }, second: { name: 'A', color: 'bg-purple-600', fullName: 'Accord', votes: 0 }, third: { name: 'AA', color: 'bg-indigo-500', fullName: 'Action Alliance', votes: 0 } },
  { lgaName: 'Irewole', accreditedVoters: 43200, first: { name: 'APC', color: 'bg-emerald-600', fullName: 'All Progressives Congress', votes: 0 }, second: { name: 'A', color: 'bg-purple-600', fullName: 'Accord', votes: 0 }, third: { name: 'ADC', color: 'bg-blue-500', fullName: 'African Democratic Congress', votes: 0 } },
  { lgaName: 'Isokan', accreditedVoters: 27800, first: { name: 'APC', color: 'bg-emerald-600', fullName: 'All Progressives Congress', votes: 0 }, second: { name: 'A', color: 'bg-purple-600', fullName: 'Accord', votes: 0 }, third: { name: 'ADC', color: 'bg-blue-500', fullName: 'African Democratic Congress', votes: 0 } },
  { lgaName: 'Odo Otin', accreditedVoters: 37600, first: { name: 'APC', color: 'bg-emerald-600', fullName: 'All Progressives Congress', votes: 0 }, second: { name: 'A', color: 'bg-purple-600', fullName: 'Accord', votes: 0 }, third: { name: 'ADC', color: 'bg-blue-500', fullName: 'African Democratic Congress', votes: 0 } },
  { lgaName: 'Ola Oluwa', accreditedVoters: 24500, first: { name: 'APC', color: 'bg-emerald-600', fullName: 'All Progressives Congress', votes: 0 }, second: { name: 'A', color: 'bg-purple-600', fullName: 'Accord', votes: 0 }, third: { name: 'AA', color: 'bg-indigo-500', fullName: 'Action Alliance', votes: 0 } },
  { lgaName: 'Orolu', accreditedVoters: 29800, first: { name: 'APC', color: 'bg-emerald-600', fullName: 'All Progressives Congress', votes: 0 }, second: { name: 'A', color: 'bg-purple-600', fullName: 'Accord', votes: 0 }, third: { name: 'ADC', color: 'bg-blue-500', fullName: 'African Democratic Congress', votes: 0 } },
  { lgaName: 'Boluwaduro', accreditedVoters: 22100, first: { name: 'APC', color: 'bg-emerald-600', fullName: 'All Progressives Congress', votes: 0 }, second: { name: 'A', color: 'bg-purple-600', fullName: 'Accord', votes: 0 }, third: { name: 'ADC', color: 'bg-blue-500', fullName: 'African Democratic Congress', votes: 0 } },
  { lgaName: 'Ifedayo', accreditedVoters: 18400, first: { name: 'APC', color: 'bg-emerald-600', fullName: 'All Progressives Congress', votes: 0 }, second: { name: 'A', color: 'bg-purple-600', fullName: 'Accord', votes: 0 }, third: { name: 'AA', color: 'bg-indigo-500', fullName: 'Action Alliance', votes: 0 } },
  { lgaName: 'Oriade', accreditedVoters: 38900, first: { name: 'A', color: 'bg-purple-600', fullName: 'Accord', votes: 0 }, second: { name: 'APC', color: 'bg-emerald-600', fullName: 'All Progressives Congress', votes: 0 }, third: { name: 'ADC', color: 'bg-blue-500', fullName: 'African Democratic Congress', votes: 0 } },
  { lgaName: 'Ifelodun', accreditedVoters: 46200, first: { name: 'APC', color: 'bg-emerald-600', fullName: 'All Progressives Congress', votes: 0 }, second: { name: 'A', color: 'bg-purple-600', fullName: 'Accord', votes: 0 }, third: { name: 'ADC', color: 'bg-blue-500', fullName: 'African Democratic Congress', votes: 0 } }
];

interface ElectionDetailsProps {
  electionCode: string;
  onBack: () => void;
  onOpenReport?: (id: string) => void;
  onOpenWeekly?: (id: string) => void;
}

export default function ElectionDetails({ 
  electionCode, 
  onBack,
  onOpenReport,
  onOpenWeekly
}: ElectionDetailsProps) {
  const [states, setStates] = useState<StateMonitor[]>(INITIAL_STATES);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'cms', 'monitored_states'), snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data?.items) {
          let formatted = data.items.map((s: any) => {
            const init = INITIAL_STATES.find(i => i.code === s.code);
            if (!init) return s;

            const initHasValidVotes = init.topParties && init.topParties.some(p => p.votes && p.votes !== 'Pending' && p.votes !== '0');
            const sHasValidVotes = s.topParties && s.topParties.some((p: any) => p.votes && p.votes !== 'Pending' && p.votes !== '0');
            const topParties = sHasValidVotes ? s.topParties : (initHasValidVotes ? init.topParties : (s.topParties || init.topParties));

            if (init.code === 'OS' || init.status === 'INEC Announced Result') {
              return {
                ...s,
                ...init,
                topParties: init.topParties,
                lgaStandings: (init.lgaStandings && init.lgaStandings.length > 0) ? init.lgaStandings : s.lgaStandings,
                validVotes: init.validVotes,
                rejectedVotes: init.rejectedVotes,
                totalVotes: init.totalVotes,
                accreditedVoters: init.accreditedVoters,
                reportedPus: init.reportedPus,
                voterTurnout: init.voterTurnout,
                irevUploadTime: init.irevUploadTime,
                lastPuUploaded: init.lastPuUploaded,
                reconciledRate: init.reconciledRate,
                status: init.status,
                voters: init.voters,
                pvcCollected: init.pvcCollected,
                summary: init.summary,
              };
            }

            return {
              ...init,
              ...s,
              topParties,
              lgaStandings: (init.lgaStandings && init.lgaStandings.length > 0) ? init.lgaStandings : s.lgaStandings,
              validVotes: s.validVotes || init.validVotes,
              rejectedVotes: s.rejectedVotes ?? init.rejectedVotes,
              totalVotes: s.totalVotes || init.totalVotes,
              accreditedVoters: s.accreditedVoters || init.accreditedVoters,
              reportedPus: s.reportedPus || init.reportedPus,
              voterTurnout: s.voterTurnout || init.voterTurnout,
              irevUploadTime: s.irevUploadTime || init.irevUploadTime,
              lastPuUploaded: s.lastPuUploaded || init.lastPuUploaded,
              reconciledRate: s.reconciledRate || init.reconciledRate,
              status: s.status && s.status !== 'Upcoming' ? s.status : init.status,
              numLgas: init.numLgas ?? s.numLgas,
              numWards: init.numWards ?? s.numWards,
            };
          });
          INITIAL_STATES.forEach(init => {
            if (!formatted.some((s: any) => s.code === init.code)) {
              formatted.push(init);
            }
          });
          setStates(formatted);
        }
      }
    }, err => console.warn('ElectionDetails snapshot error:', err));

    return () => unsub();
  }, []);

  const reqNorm = electionCode.toUpperCase().replace(/[^A-Z]/g, '');
  const election = states.find(s => {
    const codeNorm = s.code.toUpperCase().replace(/[^A-Z]/g, '');
    const nameNorm = s.name.toUpperCase().replace(/[^A-Z]/g, '');
    return (
      codeNorm === reqNorm ||
      nameNorm === reqNorm ||
      reqNorm.startsWith(codeNorm) ||
      codeNorm.startsWith(reqNorm) ||
      reqNorm.includes(codeNorm) ||
      reqNorm.includes(nameNorm)
    );
  }) || INITIAL_STATES[0];

  const [activeTab, setActiveTab] = useState<'standings' | 'lgas'>('standings');
  const [lgaSearch, setLgaSearch] = useState('');

  const lgasSource = (election.lgaStandings && election.lgaStandings.length > 0)
    ? election.lgaStandings
    : OSUN_LGAS_FALLBACK;

  const filteredLgas = lgasSource.filter(lga =>
    lga.lgaName.toLowerCase().includes(lgaSearch.toLowerCase())
  );

  // Associated reports mapping
  const associatedReports: Record<string, { type: 'report' | 'weekly' | 'apea'; id: string; label: string }> = {
    EK: { type: 'report', id: 'rep-ekiti-2026', label: 'View Ekiti State Post-Election Forensic Audit' },
    AN: { type: 'apea', id: 'AN', label: 'Athena Post-Election Audit (APEA) — 415 Polling-Unit Forensic Evidence Register' },
    OD: { type: 'apea', id: 'OD', label: 'Athena Post-Election Audit (APEA) — 437 Polling-Unit Forensic Evidence Register' },
    BY: { type: 'apea', id: 'BY', label: 'Athena Post-Election Audit (APEA) — 390 Polling-Unit Forensic Evidence Register' },
    KG: { type: 'apea', id: 'KG', label: 'Athena Post-Election Audit (APEA) — 751 Polling-Unit Forensic Evidence Register' },
    IM: { type: 'apea', id: 'IM', label: 'Athena Post-Election Audit (APEA) — 1,282 Polling-Unit Forensic Evidence Register' },
  };

  const activeReport = associatedReports[election.code as keyof typeof associatedReports];

  // Mock checklist for Upcoming vs Past
  const isNigeria = !election.country || election.country === 'Nigeria';

  const upcomingChecklist = isNigeria ? [
    { label: 'Map collation center physical transit routes', checked: true, desc: 'Identified 30 LGA collation route segments for observer transit tracking.' },
    { label: 'Accredit 1,200 local observer teams with INEC', checked: true, desc: 'Official commission list submitted and verified.' },
    { label: 'Deploy offline-first SMS relay system', checked: true, desc: 'Bypasses standard cellular network packet drops via satellite-linked secondary relays.' },
    { label: 'Train observers on BVAS logs exception counting', checked: false, desc: 'Hands-on practical session scheduled for next week.' },
    { label: 'Establish central observatory war-room in Osogbo', checked: false, desc: 'Equipment and power backup installation in progress.' },
  ] : [
    { label: 'Map collation center physical transit routes', checked: true, desc: 'Identified major collation route segments for observer transit tracking.' },
    { label: 'Accredit local observer teams with Electoral Commission', checked: true, desc: 'Official commission list submitted and verified.' },
    { label: 'Deploy offline-first SMS relay system', checked: true, desc: 'Bypasses standard cellular network packet drops via satellite-linked secondary relays.' },
    { label: 'Train observers on biometric logs exception counting', checked: false, desc: 'Hands-on practical session scheduled for next week.' },
    { label: 'Establish central observatory war-room', checked: false, desc: 'Equipment and power backup installation in progress.' },
  ];

  const pastChecklist = isNigeria ? [
    { label: 'Collect official Form EC8A scans from IReV', checked: true, desc: 'Successfully scraped and archived 100% of accessible polling unit sheet images.' },
    { label: 'Perform OCR and manual transcription validation', checked: true, desc: 'Cross-checked numerical vote tallies between physical duplicates and scans.' },
    { label: 'Audit BVAS hardware logs against accredited tallies', checked: true, desc: 'Flagged discrepancy deviations between biometric scans and manual voter lists.' },
    { label: 'Publish open-source statistical dataset', checked: true, desc: 'Raw verified CSV tallies uploaded to our archives.' },
  ] : [
    { label: 'Collect official result sheet scans from data portal', checked: true, desc: 'Successfully scraped and archived 100% of accessible polling unit sheet images.' },
    { label: 'Perform OCR and manual transcription validation', checked: true, desc: 'Cross-checked numerical vote tallies between physical duplicates and scans.' },
    { label: 'Audit biometric hardware logs against accredited tallies', checked: true, desc: 'Flagged discrepancy deviations between biometric scans and manual voter lists.' },
    { label: 'Publish open-source statistical dataset', checked: true, desc: 'Raw verified CSV tallies uploaded to our archives.' },
  ];

  const getChecklist = () => {
    return election.status === 'Upcoming' ? upcomingChecklist : pastChecklist;
  };

  const handleLinkClick = () => {
    if (!activeReport) return;
    if (activeReport.type === 'apea') {
      window.history.pushState({}, '', `/apea?audit=${activeReport.id}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }
    if (activeReport.type === 'report' && onOpenReport) {
      onOpenReport(activeReport.id);
    } else if (activeReport.type === 'weekly' && onOpenWeekly) {
      onOpenWeekly(activeReport.id);
    }
  };

  const electionObj = election as any;
  const electionTitle = election.name.toLowerCase().includes('election')
    ? election.name
    : `${electionObj.year || '2026'} ${election.name} ${electionObj.type || 'Governorship Election'}`;

  const electionDescription = electionObj.description || 
    `Explore verified election data, registered voters, LGAs, wards, polling units, party standings and electoral analysis for the ${electionTitle}.`;

  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <SEO 
        title={electionTitle}
        description={electionDescription}
        canonicalPath={`/election/${electionCode}`}
        ogImage={`https://aeo.athenacentre.org/og/elections/${electionCode}.jpg`}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Election Identity Banner */}
        <div className="bg-white border border-line rounded-2xl p-6 sm:p-8 shadow-custom overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <button 
                  onClick={onBack}
                  className="inline-flex items-center gap-1 text-xs font-bold font-mono text-brand-blue hover:text-brand-blue-dark transition-colors cursor-pointer uppercase mr-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                <span className="text-xs font-mono font-bold tracking-widest text-brand-blue uppercase bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {election.region} Region
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border text-[10px] font-mono font-bold uppercase tracking-wider border-amber-300 bg-amber-50 text-amber-900 shadow-2xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  Vote Collation In Progress
                </span>
              </div>
              
              <h1 className="font-display font-bold text-3xl sm:text-4xl text-ink leading-tight flex flex-wrap items-baseline gap-2">
                <span>{election.name} State {election.election} Election</span>
                <span className="text-sm font-sans font-normal text-mut">({election.date})</span>
              </h1>
              
              <p className="text-ink2 text-sm max-w-3xl leading-relaxed">
                {election.summary}
              </p>
            </div>

            {/* Calendar Widget Card */}
            <div className="bg-slate-50 border border-line rounded-xl p-4 min-w-[240px] flex items-center gap-3.5 self-start lg:self-auto">
              <div className="p-3 bg-white rounded-lg border border-line text-brand-blue shadow-sm">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[10px] font-mono font-bold text-mut uppercase tracking-wider">Scheduled Date</span>
                <span className="block text-xs font-bold text-ink mt-0.5 leading-snug">{election.date}</span>
              </div>
            </div>
          </div>

          {/* Live Collation / Announced Result Banner */}
          {election.status === 'INEC Announced Result' || election.status === 'Official Announced Result' ? (
            <div className="mt-6 bg-gradient-to-r from-emerald-50 via-emerald-50/90 to-blue-50/50 border border-emerald-300 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2.5 bg-emerald-600 text-white rounded-lg shadow-sm shrink-0 flex items-center justify-center mt-0.5 sm:mt-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold font-mono tracking-wider uppercase text-emerald-950 flex items-center gap-1.5">
                      <span>{isNigeria ? 'INEC Announced Result' : 'Official Announced Result'}</span>
                    </h4>
                    <span className="text-[10px] font-mono font-bold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300">
                      {election.reconciledRate || '98.43%'} {isNigeria ? 'IReV Uploaded' : 'Uploaded'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 mt-0.5 font-sans leading-relaxed">
                    Official Announced Results for {electionTitle} • <strong>{election.reportedPus ? `${election.reportedPus.toLocaleString()} of ${election.pollingUnits}` : '3,704 of 3,763'}</strong> Polling Units Reported ({election.reconciledRate || '98.43%'} {isNigeria ? 'IReV Uploaded' : 'Uploaded'}) • Declared on {election.date || '16 August 2026'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <span className="text-xs font-mono font-bold text-emerald-900 bg-white border border-emerald-300 px-3 py-1.5 rounded-lg shadow-2xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Result Declared
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-6 bg-gradient-to-r from-amber-50 via-amber-50/90 to-blue-50/50 border border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2.5 bg-amber-500 text-white rounded-lg shadow-sm shrink-0 flex items-center justify-center mt-0.5 sm:mt-0">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold font-mono tracking-wider uppercase text-amber-950 flex items-center gap-1.5">
                      <span>Official Vote Collation Ongoing</span>
                    </h4>
                    <span className="text-[10px] font-mono font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                      {election.reconciledRate || '87.48%'} {isNigeria ? 'IReV Uploaded' : 'Uploaded'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 mt-0.5 font-sans leading-relaxed">
                    Results rolling in live across {election.numLgas || 30} LGAs • <strong className="text-amber-950 font-mono">{election.reportedPus ? `${election.reportedPus.toLocaleString()} of ${election.pollingUnits}` : '2,293 of 3,763'}</strong> Polling Units Reported • {isNigeria ? 'IReV ' : ''}Uploaded as of {election.irevUploadTime || 'Aug 15, 2026, 9:30:00 PM'}{election.lastPuUploaded ? ` (Last PU: ${election.lastPuUploaded})` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <span className="text-xs font-mono font-bold text-amber-900 bg-white border border-amber-300 px-3 py-1.5 rounded-lg shadow-2xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  Collation Live
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Core Electoral Metrics Grid - In requested order */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3.5">
          
          {/* Registered Voters */}
          <div className="p-3 bg-white rounded-xl border border-line shadow-sm flex flex-col justify-between">
            <span className="block text-[10px] font-mono font-bold text-mut uppercase tracking-wider">Registered Voters</span>
            <div className="mt-2 flex items-center gap-1.5 font-mono">
              <Users className="w-4 h-4 text-brand-blue" />
              <span className="text-sm font-bold text-ink">{election.voters}</span>
            </div>
          </div>

          {/* PVC Collected (if available) */}
          {election.pvcCollected && (
            <div className="p-3 bg-white rounded-xl border border-line shadow-sm flex flex-col justify-between">
              <span className="block text-[10px] font-mono font-bold text-mut uppercase tracking-wider">{isNigeria ? 'PVC Collected' : 'Cards Collected'}</span>
              <div className="mt-2 flex items-center gap-1.5 font-mono">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-700">{election.pvcCollected}</span>
              </div>
            </div>
          )}

          {/* Polling Units / Reported PUs */}
          <div className="p-3 bg-white rounded-xl border border-line shadow-sm flex flex-col justify-between">
            <span className="block text-[10px] font-mono font-bold text-mut uppercase tracking-wider">Reported PUs</span>
            <div className="mt-2 flex items-center gap-1.5 font-mono">
              <Landmark className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-bold text-ink">
                {election.reportedPus ? `${election.reportedPus}/${election.pollingUnits.replace(/,/g, '')}` : '3704/3763'}
              </span>
            </div>
          </div>

          {/* Accredited Voters */}
          <div className="p-3 bg-white rounded-xl border border-line shadow-sm flex flex-col justify-between">
            <span className="block text-[10px] font-mono font-bold text-mut uppercase tracking-wider">Accredited Voters</span>
            <div className="mt-2 flex items-center gap-1.5 font-mono">
              <Users className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold text-ink">
                {election.accreditedVoters ? election.accreditedVoters.toLocaleString() : (election.status === 'Upcoming' ? 'Pending' : 'N/A')}
              </span>
            </div>
          </div>

          {/* Voter Turnout */}
          <div className="p-3 bg-white rounded-xl border border-line shadow-sm flex flex-col justify-between">
            <span className="block text-[10px] font-mono font-bold text-mut uppercase tracking-wider">Voter Turnout</span>
            <div className="mt-2 flex items-center gap-1.5 font-mono">
              <Users className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-bold text-ink">
                {election.voterTurnout || (election.accreditedVoters ? '43.20%' : (election.status === 'Upcoming' ? 'Pending' : 'N/A'))}
              </span>
            </div>
          </div>

          {/* Valid Votes */}
          <div className="p-3 bg-white rounded-xl border border-line shadow-sm flex flex-col justify-between">
            <span className="block text-[10px] font-mono font-bold text-mut uppercase tracking-wider">Valid Votes</span>
            <div className="mt-2 flex items-center gap-1.5 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-bold text-ink">
                {election.validVotes ? election.validVotes.toLocaleString() : (election.status === 'Upcoming' ? 'Pending' : 'N/A')}
              </span>
            </div>
          </div>

          {/* Rejected Votes */}
          <div className="p-3 bg-white rounded-xl border border-line shadow-sm flex flex-col justify-between">
            <span className="block text-[10px] font-mono font-bold text-mut uppercase tracking-wider">Rejected Votes</span>
            <div className="mt-2 flex items-center gap-1.5 font-mono">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span className="text-sm font-bold text-ink">
                {election.rejectedVotes !== undefined ? election.rejectedVotes.toLocaleString() : (election.status === 'Upcoming' ? 'Pending' : 'N/A')}
              </span>
            </div>
          </div>

          {/* Total Vote Cast */}
          <div className="p-3 bg-white rounded-xl border border-line shadow-sm flex flex-col justify-between">
            <span className="block text-[10px] font-mono font-bold text-mut uppercase tracking-wider">Total Vote Cast</span>
            <div className="mt-2 flex items-center gap-1.5 font-mono">
              <Users className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-bold text-ink">
                {election.totalVotes ? election.totalVotes.toLocaleString() : (election.status === 'Upcoming' ? 'Pending' : 'N/A')}
              </span>
            </div>
          </div>

          {/* LGAs */}
          <div className="p-3 bg-white rounded-xl border border-line shadow-sm flex flex-col justify-between">
            <span className="block text-[10px] font-mono font-bold text-mut uppercase tracking-wider">LGAs / Wards</span>
            <div className="mt-2 flex items-center gap-1.5 font-mono">
              <MapPin className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-bold text-ink">{election.numLgas ?? 30} / {election.numWards ?? 332}</span>
            </div>
          </div>

        </div>

        {/* IREV Upload Rate Alert / Bar */}
        <div className="bg-slate-50 border border-line rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white rounded-lg border border-line text-emerald-600 shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-ink">{isNigeria ? 'IREV upload rate' : 'Result Upload Rate'}</h4>
              <p className="text-[11px] text-mut mt-0.5 leading-normal">
                Data gotten from {isNigeria ? 'INEC IReV' : 'Official Portal'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 min-w-[200px] w-full sm:w-auto">
            <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 whitespace-nowrap">
              {election.reconciledRate} Reconciled
            </span>
            <div className="w-full sm:w-32 bg-slate-200 h-1.5 rounded-full overflow-hidden border border-line/50">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                style={{ width: election.reconciledRate }}
              ></div>
            </div>
          </div>
        </div>

        {/* Associated Forensic Reports Alert */}
        {activeReport && (
          <div className="bg-brand-blue/5 border border-brand-blue/20 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg border border-brand-blue/10 text-brand-blue">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-brand-blue">Audit Report Available</h4>
                <p className="text-[11px] text-ink2 mt-0.5 leading-normal">
                  Our research group published a deep-dive forensic audit of raw results sheets and BVAS verifications for this state.
                </p>
              </div>
            </div>
            <button 
              onClick={handleLinkClick}
              className="px-4 py-2 bg-white border border-brand-blue/20 hover:border-brand-blue text-brand-blue text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all cursor-pointer whitespace-nowrap"
            >
              Read Audit Report
            </button>
          </div>
        )}

        {/* Main Tabbed Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (2/3 width) - Tabbed Panel */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Tabs Selector Navigation */}
            <div className="flex border-b border-line gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('standings')}
                className={`px-4 py-2.5 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'standings'
                    ? 'border-brand-blue text-brand-blue'
                    : 'border-transparent text-mut hover:text-ink hover:border-line'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Standings & Contenders
              </button>
              
              <button
                type="button"
                onClick={() => setActiveTab('lgas')}
                className={`px-4 py-2.5 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'lgas'
                    ? 'border-brand-blue text-brand-blue'
                    : 'border-transparent text-mut hover:text-ink hover:border-line'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                LGA Breakdown
              </button>
            </div>

            {/* TAB CONTENT: STANDINGS */}
            {activeTab === 'standings' && (
              <div className="bg-white border border-line rounded-xl p-6 shadow-sm space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-ink">Electoral Standings & Party Vote Breakdown</h3>
                  <p className="text-xs text-mut mt-0.5">
                    {election.status === 'Upcoming' 
                      ? 'Official political parties and their candidate nominations confirmed for the ballot.'
                      : 'Accredited vote count distribution and overall percentages certified by our audit team.'}
                  </p>
                </div>

                <div className="space-y-4">
                  {election.topParties?.map((party, index) => (
                    <div key={party.name} className="p-4 bg-slate-50 border border-line rounded-xl space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <PartyLogo name={party.name} className="w-9 h-9 rounded-lg border border-line shadow-sm" />
                          <div>
                            <span className="block text-xs font-bold text-ink flex items-center gap-1.5">
                              {party.name} 
                              {index === 0 && election.status !== 'Upcoming' && (
                                <span className="text-[9px] font-mono uppercase bg-emerald-50 text-emerald-700 px-1 py-0.2 rounded border border-emerald-100 font-bold">
                                  Winner
                                </span>
                              )}
                            </span>
                            <span className="block text-[11px] text-mut max-w-sm sm:max-w-md truncate" title={party.fullName}>
                              {party.fullName}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-700 bg-white border border-line px-2 py-1 rounded">
                          {!party.votes || party.votes === 'Registered' || party.votes === 'Pending'
                            ? 'Votes: Pending'
                            : party.votes.toLowerCase().startsWith('votes:')
                            ? party.votes
                            : `Votes: ${party.votes.replace(' votes', '')}`}
                        </span>
                      </div>

                      {party.percentage > 0 && (
                        <div className="space-y-1 pt-2 border-t border-slate-200/50">
                          <div className="flex items-center justify-between text-[10px] font-mono text-mut">
                            <span>Vote Share Percentage</span>
                            <span className="font-bold text-ink">{party.percentage}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${party.color}`} 
                              style={{ width: `${party.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: LGA BREAKDOWN */}
            {activeTab === 'lgas' && (
              <div className="bg-white border border-line rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-ink">Local Government Area (LGA) Tally Review</h3>
                    <p className="text-xs text-mut mt-0.5">Filter and examine primary tallies compiled from local collection offices.</p>
                  </div>
                  
                  {/* LGA Search */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-mut absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search Local Government..."
                      value={lgaSearch}
                      onChange={(e) => setLgaSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 border border-line rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                  {filteredLgas.length > 0 ? (
                    filteredLgas.map((lga) => (
                      <div
                        key={lga.lgaName}
                        className="p-3.5 bg-slate-50 border border-line rounded-xl space-y-3 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex flex-col gap-2.5 border-b border-line/50 pb-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-brand-blue" /> {lga.lgaName} LGA
                            </span>
                            {election.status === 'Upcoming' && (
                              <span className="text-[10px] font-mono font-medium text-mut">
                                Registered Voters: <strong className="text-slate-700">{typeof lga.accreditedVoters === 'number' ? lga.accreditedVoters.toLocaleString() : lga.accreditedVoters}</strong>
                              </span>
                            )}
                          </div>
                          {election.status !== 'Upcoming' && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                              <div className="flex flex-col items-center justify-center p-2 bg-white border border-slate-200 rounded-md shadow-2xs text-center w-full">
                                <span className="text-[9px] font-mono font-semibold uppercase tracking-wider text-slate-500 leading-tight">Accredited Voters</span>
                                <span className="text-[11px] font-mono font-bold text-slate-800 leading-tight mt-0.5">{typeof lga.accreditedVoters === 'number' ? lga.accreditedVoters.toLocaleString() : lga.accreditedVoters}</span>
                              </div>
                              <div className="flex flex-col items-center justify-center p-2 bg-emerald-50/90 border border-emerald-200/80 rounded-md shadow-2xs text-center w-full">
                                <span className="text-[9px] font-mono font-semibold uppercase tracking-wider text-emerald-700/80 leading-tight">Valid Votes</span>
                                <span className="text-[11px] font-mono font-bold text-emerald-900 leading-tight mt-0.5">{lga.validVotes !== undefined ? lga.validVotes.toLocaleString() : getLgaValidVotes(lga).toLocaleString()}</span>
                              </div>
                              <div className="flex flex-col items-center justify-center p-2 bg-rose-50/90 border border-rose-200/80 rounded-md shadow-2xs text-center w-full">
                                <span className="text-[9px] font-mono font-semibold uppercase tracking-wider text-rose-700/80 leading-tight">Rejected Votes</span>
                                <span className="text-[11px] font-mono font-bold text-rose-900 leading-tight mt-0.5">{lga.rejectedVotes !== undefined ? lga.rejectedVotes.toLocaleString() : Math.round((lga.first.votes + lga.second.votes) * 0.015).toLocaleString()}</span>
                              </div>
                              <div className="flex flex-col items-center justify-center p-2 bg-blue-50/90 border border-blue-200/80 rounded-md shadow-2xs text-center w-full">
                                <span className="text-[9px] font-mono font-semibold uppercase tracking-wider text-blue-700/80 leading-tight">Total Votes</span>
                                <span className="text-[11px] font-mono font-bold text-blue-950 leading-tight mt-0.5">{lga.totalVotes !== undefined ? lga.totalVotes.toLocaleString() : (getLgaValidVotes(lga) + Math.round((lga.first.votes + lga.second.votes) * 0.015)).toLocaleString()}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Top 3 Parties & Others results in this LGA */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="p-2 bg-white rounded-lg border border-line text-center space-y-1">
                            <span className="block text-[9px] font-mono font-bold text-mut">{election.status === 'Upcoming' ? 'Contender' : '1st Lead'}</span>
                            <span className={`inline-block text-[10px] font-bold text-white px-1.5 py-0.2 rounded ${lga.first.color}`}>
                              {lga.first.name}
                            </span>
                            <span className="block text-[10px] font-mono font-bold text-ink mt-0.5">
                              {election.status === 'Upcoming' ? 'Nominated' : lga.first.votes.toLocaleString()}
                            </span>
                          </div>

                          <div className="p-2 bg-white rounded-lg border border-line text-center space-y-1">
                            <span className="block text-[9px] font-mono font-bold text-mut">{election.status === 'Upcoming' ? 'Contender' : '2nd Lead'}</span>
                            <span className={`inline-block text-[10px] font-bold text-white px-1.5 py-0.2 rounded ${lga.second.color}`}>
                              {lga.second.name}
                            </span>
                            <span className="block text-[10px] font-mono font-bold text-ink mt-0.5">
                              {election.status === 'Upcoming' ? 'Nominated' : lga.second.votes.toLocaleString()}
                            </span>
                          </div>

                          <div className="p-2 bg-white rounded-lg border border-line text-center space-y-1">
                            <span className="block text-[9px] font-mono font-bold text-mut">{election.status === 'Upcoming' ? 'Contender' : '3rd Lead'}</span>
                            <span className={`inline-block text-[10px] font-bold text-white px-1.5 py-0.2 rounded ${lga.third.color}`}>
                              {lga.third.name}
                            </span>
                            <span className="block text-[10px] font-mono font-bold text-ink mt-0.5">
                              {election.status === 'Upcoming' ? 'Nominated' : lga.third.votes.toLocaleString()}
                            </span>
                          </div>

                          <div className="p-2 bg-white rounded-lg border border-line text-center space-y-1">
                            <span className="block text-[9px] font-mono font-bold text-mut">{election.status === 'Upcoming' ? 'Other Parties' : 'Others'}</span>
                            <span className="inline-block text-[10px] font-bold text-slate-700 bg-slate-200 px-1.5 py-0.2 rounded border border-slate-300">
                              Others
                            </span>
                            <span className="block text-[10px] font-mono font-bold text-ink mt-0.5">
                              {election.status === 'Upcoming' ? 'Nominated' : getLgaOthersVotes(lga).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-xs text-mut font-medium">
                      No Local Government Area matches your search.
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Right Column (1/3 width) - Context & Action Guide */}
          <div className="space-y-6">
            
            {/* Custom Image Card */}
            {election.customImage && (
              <div className="bg-white border border-line rounded-xl p-4 shadow-sm space-y-3">
                <span className="block text-[10px] font-mono font-bold text-mut uppercase tracking-wider">State Visual Map / Media</span>
                <div className="relative rounded-lg overflow-hidden border border-line bg-slate-50 flex items-center justify-center">
                  <img 
                    src={election.customImage} 
                    alt={`${election.name} State custom upload`} 
                    className="w-full h-auto max-h-52 object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            )}

            {/* Quick Action links */}
            <div className="bg-slate-900 text-white rounded-xl p-5 space-y-4 shadow-md">
              <h3 className="text-xs font-mono font-bold text-blue-300 uppercase tracking-wider">Observatory Resources</h3>
              
              <div className="space-y-2.5 text-xs">
                <a 
                  href="/political-landscape-monitor"
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState({}, '', '/political-landscape-monitor');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="block p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Political Landscape Monitor
                </a>

                <a 
                  href="/diary"
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState({}, '', '/diary');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="block p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Electoral Diary Log
                </a>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
