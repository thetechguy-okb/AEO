import { useState, useEffect, FormEvent } from 'react';
import { 
  X, Database, Edit3, Trash2, Plus, Save, RotateCcw, 
  BookOpen, Calendar, MapPin, Users, FileText, CheckCircle2, ChevronRight, LogOut, Bell, Search, Loader2,
  ChevronUp, ChevronDown, FileSpreadsheet, UploadCloud, Download, Table, PlusCircle, UserPlus, Check, AlertCircle, Sparkles,
  RefreshCw, ShieldCheck, Award
} from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import { auth, db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { Report, DiaryItem, EventItem, TeamMember, WeeklyIssue, HeroConfig, StatItemConfig, AnnouncementItem, TagType } from '../types';
import { sortItemsByDate, parseFlexibleDate } from '../utils/date';
import { CMSDateField } from './CMSDateField';
import { 
  parseSpreadsheetText, 
  downloadDiaryCSVTemplate, 
  downloadElectionDataCSVTemplate, 
  downloadCSV,
  ParsedSpreadsheet 
} from '../utils/spreadsheet';
import { PartyLogo } from './PartyLogo';
import { INITIAL_STATES } from './LiveDashboard';
import { saveAssetToFirestore, compressImageFile } from '../lib/firebaseAssets';
import { prepareDocumentUrl } from '../utils/url';
import { User, onAuthStateChanged } from 'firebase/auth';
import { RichTextEditor } from './RichTextEditor';
import { DcmCmsManager } from './DcmCmsManager';
import { AdminManagement } from './AdminManagement';
import { ApeaCmsManager } from './ApeaCmsManager';
import { isSuperAdmin } from '../lib/adminSession';

interface CMSPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  isStandalone?: boolean;
  onNavigateHome?: () => void;
  currentUser?: User | null;
}

type TabType = 'publications' | 'apea' | 'dcm_publications' | 'diary' | 'events' | 'team' | 'hero_stats' | 'subscribers' | 'elections' | 'admins';

const DEFAULT_PARTY_NAMES: Record<string, string> = {
  APC: 'All Progressives Congress',
  PDP: "People's Democratic Party",
  LP: 'Labour Party',
  APGA: 'All Progressives Grand Alliance',
  SDP: 'Social Democratic Party',
  NNPP: 'New Nigeria Peoples Party',
  YPP: 'Young Progressives Party',
  ADC: 'African Democratic Congress',
  ADP: 'Action Democratic Party',
  AAC: 'African Action Congress',
  ZLP: 'Zenith Labour Party',
  APM: 'All Allied Peoples Movement',
  APP: 'Action Peoples Party',
  BP: 'Boot Party',
  NRM: 'National Rescue Movement',
  PRP: 'Peoples Redemption Party',
};

const ALL_DEFAULT_PARTIES = ['APC', 'PDP', 'LP', 'APGA', 'SDP', 'NNPP', 'YPP', 'ADC', 'ADP', 'AAC', 'ZLP', 'APM', 'APP', 'BP', 'NRM', 'PRP'];

const FileUploadField = ({ 
  label, 
  accept, 
  value, 
  onChange 
}: { 
  label: string; 
  accept: string; 
  value?: string; 
  onChange: (base64OrUrl: string) => void;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  
  const handleFile = async (file: File) => {
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > 15.0) {
      setFileError(`File is too large (${sizeInMB.toFixed(1)}MB). The maximum allowed size for direct uploads is 15.0MB. Please upload a smaller file.`);
      return;
    }
    
    setFileError(null);
    try {
      if (file.type.startsWith('image/')) {
        const compressed = await compressImageFile(file, 900, 900, 0.85);
        onChange(compressed);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            onChange(e.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.warn('Error reading file:', err);
    }
  };

  return (
    <div className="space-y-1">
      <label className="block text-[10px] font-mono uppercase font-bold text-mut">{label}</label>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
        <div className="md:col-span-8 font-mono">
          <input 
            type="text" 
            value={value || ''} 
            onChange={(e) => {
              setFileError(null);
              onChange(e.target.value);
            }}
            placeholder="Paste URL or drag file →"
            className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-mono"
          />
        </div>
        <div className="md:col-span-4">
          <label 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); }}
            className={`flex items-center justify-center border border-dashed text-[10px] font-mono font-bold uppercase rounded-lg h-10 cursor-pointer transition-colors ${
              isDragging ? 'border-brand-purple bg-purple-50 text-brand-purple' : 'border-line hover:border-mut text-mut hover:bg-slate-50'
            }`}
          >
            <span>Upload File</span>
            <input 
              type="file" 
              accept={accept} 
              onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
              className="hidden" 
            />
          </label>
        </div>
      </div>
      {fileError && (
        <span className="text-[10px] font-mono text-red-600 block bg-red-50 border border-red-100 p-2.5 rounded-lg mt-1 font-bold">
          ⚠️ {fileError}
        </span>
      )}
      {value && value.startsWith('data:') && !fileError && (
        <span className="text-[9px] font-mono text-brand-green block">✓ File uploaded successfully (Base64 encoded)</span>
      )}
    </div>
  );
};

export default function CMSPanel({ 
  isOpen = false, 
  onClose = () => {}, 
  isStandalone = false, 
  onNavigateHome = () => {},
  currentUser: propUser
}: CMSPanelProps) {
  const {
    reports, diaryNat, diaryLoc, diaryAfr, diaryOth, events, announcements, team, weekly,
    heroConfig, statsConfig,
    saveReport, deleteReport, saveDiaryItem, deleteDiaryItem, saveEvent, deleteEvent,
    saveAnnouncement, deleteAnnouncement,
    saveTeamMember, deleteTeamMember, saveWeeklyIssue, deleteWeeklyIssue,
    saveHeroConfig, saveStatsConfig, resetAllData,
    restorePublicationsBackup, refreshData, exportAllDataJson, importDataJson
  } = useCMS();

  const [activeUser, setActiveUser] = useState<User | null>(propUser || auth.currentUser);

  useEffect(() => {
    if (propUser) {
      setActiveUser(propUser);
    }
  }, [propUser]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setActiveUser(u);
    });
    return () => unsub();
  }, []);

  const effectiveUser = activeUser || auth.currentUser;
  const isOwner = isSuperAdmin(effectiveUser);
  const [activeTab, setActiveTab] = useState<TabType>('publications');
  const [selectedPubType, setSelectedPubType] = useState<'report' | 'assessment' | 'brief' | 'dcm' | 'africa-election-watch' | 'weekly' | 'announcement'>('report');
  const [pubFilter, setPubFilter] = useState<'all' | 'report' | 'assessment' | 'brief' | 'dcm' | 'africa-election-watch' | 'weekly' | 'announcement'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [diaryCategory, setDiaryCategory] = useState<'national' | 'local' | 'africa' | 'other'>('national');
  
  // Local states for visual Hero and Stats editor
  const [localHero, setLocalHero] = useState<HeroConfig>(heroConfig);
  const [localStats, setLocalStats] = useState<StatItemConfig[]>(statsConfig);
  const [expandedStatStyles, setExpandedStatStyles] = useState<number | null>(null);

  // Subscribers states
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [subSearch, setSubSearch] = useState('');

  // ----------------------------------------------------
  // Elections & Parties CMS States
  // ----------------------------------------------------
  const [partyLogos, setPartyLogos] = useState<Record<string, string>>({});
  const [partyFullNames, setPartyFullNames] = useState<Record<string, string>>({});

  const [partyCodeForm, setPartyCodeForm] = useState('');
  const [partyFullNameForm, setPartyFullNameForm] = useState('');
  const [partyLogoForm, setPartyLogoForm] = useState('');
  const [partySearch, setPartySearch] = useState('');

  // Add party to state standing fields
  const [newPartyCode, setNewPartyCode] = useState('');
  const [newPartyFullName, setNewPartyFullName] = useState('');
  const [newPartyVotes, setNewPartyVotes] = useState('');
  const [newPartyPercentage, setNewPartyPercentage] = useState<number>(0);
  const [newPartyColor, setNewPartyColor] = useState('bg-indigo-600');

  const [statesList, setStatesList] = useState<any[]>([
    {
      code: 'OS',
        name: 'Osun',
        region: 'South West',
        election: 'Governorship',
        status: 'Upcoming',
        date: 'Saturday, 15 August 2026',
        voters: '2,339,233',
        pollingUnits: '3,763',
        numLgas: 30,
        numWards: 332,
        reconciledRate: '0%',
        summary: 'Preparing 1,200 ad-hoc observers. Observer accreditation and mapping of local collation center routes are underway.',
        colorClass: 'text-amber-500 border-amber-500 bg-amber-50',
        bgGradient: 'from-amber-100 to-amber-200/50 border-amber-200',
        topParties: [
          { name: 'A', fullName: 'Accord', candidate: 'Ademola Adeleke', votes: 'Pending', percentage: 0, color: 'bg-purple-600' },
          { name: 'AA', fullName: 'Action Alliance', candidate: 'Olanrewaju Farinloye', votes: 'Pending', percentage: 0, color: 'bg-indigo-500' },
          { name: 'AAC', fullName: 'African Action Congress', candidate: 'Olajide Esan', votes: 'Pending', percentage: 0, color: 'bg-orange-600' },
          { name: 'ADC', fullName: 'African Democratic Congress', candidate: 'Najeem Salaam', votes: 'Pending', percentage: 0, color: 'bg-blue-500' },
          { name: 'ADP', fullName: 'Action Democratic Party', candidate: 'Yemisi Opawoye', votes: 'Pending', percentage: 0, color: 'bg-teal-600' },
          { name: 'APC', fullName: 'All Progressives Congress', candidate: 'Bola Oyebamiji', votes: 'Pending', percentage: 0, color: 'bg-emerald-600' },
          { name: 'APM', fullName: 'Allied Peoples Movement', candidate: 'Adewale Adebayo', votes: 'Pending', percentage: 0, color: 'bg-cyan-600' },
          { name: 'APP', fullName: 'Action Peoples Party', candidate: 'Clement Adesuyi', votes: 'Pending', percentage: 0, color: 'bg-purple-600' },
          { name: 'BP', fullName: 'Boot Party', candidate: 'Masilo Adeleke', votes: 'Pending', percentage: 0, color: 'bg-lime-600' },
          { name: 'NNPP', fullName: 'New Nigeria Peoples Party', candidate: 'Taofeek Adeleke', votes: 'Pending', percentage: 0, color: 'bg-sky-600' },
          { name: 'PRP', fullName: 'Peoples Redemption Party', candidate: 'Saliu Oyelami', votes: 'Pending', percentage: 0, color: 'bg-red-700' },
          { name: 'YPP', fullName: 'Young Progressives Party', candidate: 'Olalekan Ogunsakin', votes: 'Pending', percentage: 0, color: 'bg-emerald-800' },
          { name: 'ZLP', fullName: 'Zenith Labour Party', candidate: 'Olufemi Adesuyi', votes: 'Pending', percentage: 0, color: 'bg-teal-600' }
        ]
      },
      {
        code: 'EK',
        name: 'Ekiti',
        region: 'South West',
        election: 'Governorship',
        status: 'Concluded',
        date: 'June 2026',
        voters: '1,019,592',
        accreditedVoters: 373981,
        pollingUnits: '2,445',
        numLgas: 16,
        numWards: 177,
        reconciledRate: '98.2%',
        summary: 'Full audits concluded. High IReV upload fidelity recorded with minor ad-hoc administrative delays in Ekiti East LGA.',
        colorClass: 'text-green-600 border-green-600 bg-green-50',
        bgGradient: 'from-emerald-50 to-emerald-100/50 border-emerald-200',
        topParties: [
          { name: 'APC', fullName: 'All Progressives Congress', votes: '308,958 votes', percentage: 85.4, color: 'bg-emerald-600' },
          { name: 'PDP', fullName: "People's Democratic Party", votes: '39,173 votes', percentage: 10.8, color: 'bg-red-600' },
          { name: 'ADC', fullName: 'African Democratic Congress', votes: '12,223 votes', percentage: 3.4, color: 'bg-blue-500' },
          { name: 'ADP', fullName: 'Action Democratic Party', votes: '1,998 votes', percentage: 0.6, color: 'bg-teal-600' },
          { name: 'A', fullName: 'Accord', votes: '687 votes', percentage: 0.2, color: 'bg-purple-600' },
          { name: 'APGA', fullName: 'All Progressives Grand Alliance', votes: '269 votes', percentage: 0.1, color: 'bg-indigo-600' },
          { name: 'LP', fullName: 'Labour Party', votes: '225 votes', percentage: 0.1, color: 'bg-rose-500' }
        ],
        lgaStandings: []
      },
      {
        code: 'AN',
        name: 'Anambra',
        region: 'South East',
        election: 'Governorship',
        status: 'Concluded',
        date: 'November 2025',
        voters: '2,533,722',
        accreditedVoters: 195500,
        pollingUnits: '5,720',
        numLgas: 21,
        numWards: 326,
        reconciledRate: '100%',
        summary: 'Comprehensive audit report published. Verified 5,720 PUs with specific legal findings on over-accreditation patterns.',
        colorClass: 'text-green-600 border-green-600 bg-green-50',
        bgGradient: 'from-blue-50 to-blue-100/50 border-blue-200',
        topParties: [
          { name: 'APGA', fullName: 'All Progressives Grand Alliance', votes: '112,229 votes', percentage: 56.7, color: 'bg-indigo-600' },
          { name: 'APC', fullName: 'All Progressives Congress', votes: '43,285 votes', percentage: 21.9, color: 'bg-emerald-600' },
          { name: 'PDP', fullName: "People's Democratic Party", votes: '33,074 votes', percentage: 16.7, color: 'bg-red-600' },
          { name: 'YPP', fullName: 'Young Progressives Party', votes: '4,285 votes', percentage: 2.1, color: 'bg-emerald-800' },
          { name: 'LP', fullName: 'Labour Party', votes: '2,110 votes', percentage: 1.1, color: 'bg-rose-500' },
          { name: 'SDP', fullName: 'Social Democratic Party', votes: '1,020 votes', percentage: 0.5, color: 'bg-blue-600' },
          { name: 'ADC', fullName: 'African Democratic Congress', votes: '950 votes', percentage: 0.5, color: 'bg-blue-500' }
        ],
        lgaStandings: []
      },
      {
        code: 'OD',
        name: 'Ondo',
        region: 'South West',
        election: 'Off-cycle Gov.',
        status: 'Concluded',
        date: 'November 2024',
        voters: '2,053,061',
        accreditedVoters: 495800,
        pollingUnits: '3,933',
        numLgas: 18,
        numWards: 203,
        reconciledRate: '99.4%',
        summary: 'All polling unit results parsed. Concluded that results declared reflect the true distribution of primary ballots.',
        colorClass: 'text-green-600 border-green-600 bg-green-50',
        bgGradient: 'from-indigo-50 to-indigo-100/50 border-indigo-200',
        topParties: [
          { name: 'APC', fullName: 'All Progressives Congress', votes: '366,612 votes', percentage: 74.8, color: 'bg-emerald-600' },
          { name: 'PDP', fullName: "People's Democratic Party", votes: '117,845 votes', percentage: 24.1, color: 'bg-red-600' },
          { name: 'LP', fullName: 'Labour Party', votes: '4,743 votes', percentage: 1.0, color: 'bg-rose-500' },
          { name: 'SDP', fullName: 'Social Democratic Party', votes: '3,210 votes', percentage: 0.7, color: 'bg-blue-600' },
          { name: 'APGA', fullName: 'All Progressives Grand Alliance', votes: '1,500 votes', percentage: 0.3, color: 'bg-indigo-600' },
          { name: 'YPP', fullName: 'Young Progressives Party', votes: '1,100 votes', percentage: 0.2, color: 'bg-emerald-800' },
          { name: 'ADC', fullName: 'African Democratic Congress', votes: '900 votes', percentage: 0.2, color: 'bg-blue-500' }
        ],
        lgaStandings: []
      }
  ]);

  useEffect(() => {
    const unsubStates = onSnapshot(doc(db, 'cms', 'monitored_states'), snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data?.items) {
          let formatted = data.items.map((s: any) => {
            if (s.code === 'OS' && (!s.voters || s.voters === '1,955,657')) {
              return {
                ...s,
                voters: '2,339,233'
              };
            }
            return s;
          });
          if (!formatted.some((s: any) => s.code === 'IM')) {
            const imo = INITIAL_STATES.find(s => s.code === 'IM');
            if (imo) {
              formatted = [...formatted, imo];
            }
          }
          setStatesList(formatted);
        }
      }
    }, err => console.warn("CMS Panel states snapshot error:", err));

    const unsubLogos = onSnapshot(doc(db, 'cms', 'custom_party_logos'), snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data?.map) {
          setPartyLogos(prev => ({ ...prev, ...data.map }));
        }
        if (data?.names) {
          setPartyFullNames(prev => ({ ...prev, ...data.names }));
        }
      }
    }, err => console.warn("CMS Panel party logos snapshot error:", err));

    return () => {
      unsubStates();
      unsubLogos();
    };
  }, []);

  const [selectedStateCode, setSelectedStateCode] = useState('OS');
  
  const activeCMSState = statesList.find(s => s.code === selectedStateCode) || statesList[0];

  const handleSavePartyLogo = (e: any) => {
    e.preventDefault();
    if (!partyCodeForm) {
      showStatus('Please enter a party acronym (e.g., APC, PDP, NNPP, AAC).', 'error');
      return;
    }

    const partyKey = partyCodeForm.toUpperCase().trim();
    const updatedLogos = partyLogoForm 
      ? { ...partyLogos, [partyKey]: partyLogoForm }
      : partyLogos;

    const updatedNames = partyFullNameForm.trim() 
      ? { ...partyFullNames, [partyKey]: partyFullNameForm.trim() }
      : partyFullNames;

    setPartyLogos(updatedLogos);
    setPartyFullNames(updatedNames);

    try {
      if (partyLogoForm) {
        saveAssetToFirestore('logo', partyKey, partyLogoForm);
      }
      setDoc(doc(db, 'cms', 'custom_party_logos'), { 
        map: updatedLogos, 
        names: updatedNames,
        keys: Array.from(new Set([...Object.keys(updatedLogos), ...Object.keys(updatedNames)])), 
        updated: Date.now() 
      });
    } catch (e) {
      console.error('Failed to sync party logos to Firestore:', e);
    }
    
    setPartyCodeForm('');
    setPartyFullNameForm('');
    setPartyLogoForm('');
    showStatus(`Political party ${partyKey} registered/updated successfully!`);
  };

  const handleDeletePartyLogo = (partyName: string) => {
    const partyKey = partyName.toUpperCase().trim();
    const updated = { ...partyLogos };
    delete updated[partyKey];
    setPartyLogos(updated);

    try {
      setDoc(doc(db, 'cms', 'custom_party_logos'), { 
        map: updated,
        names: partyFullNames,
        updated: Date.now() 
      });
    } catch (e) {
      console.error('Failed to delete party logo in Firestore:', e);
    }
    showStatus(`Logo for ${partyKey} restored to vector default.`);
  };

  const handleAddPartyToState = (e: any) => {
    e.preventDefault();
    if (!newPartyCode) {
      showStatus('Please select or enter a party acronym.', 'error');
      return;
    }
    const code = newPartyCode.toUpperCase().trim();
    const defaultName = DEFAULT_PARTY_NAMES[code] || `${code} Party`;
    const fullName = newPartyFullName.trim() || partyFullNames[code] || defaultName;
    const votes = newPartyVotes.trim() || 'Pending';
    const percentage = Number(newPartyPercentage) || 0;
    const color = newPartyColor || 'bg-indigo-600';

    const currentParties = activeCMSState.topParties || [];
    const existingIdx = currentParties.findIndex((p: any) => p.name.toUpperCase().trim() === code);
    let updatedParties;
    if (existingIdx >= 0) {
      updatedParties = [...currentParties];
      updatedParties[existingIdx] = { name: code, fullName, votes, percentage, color };
    } else {
      updatedParties = [...currentParties, { name: code, fullName, votes, percentage, color }];
    }

    const updatedStatesList = statesList.map(s => s.code === selectedStateCode ? { ...s, topParties: updatedParties } : s);
    setStatesList(updatedStatesList);

    try {
      setDoc(doc(db, 'cms', 'monitored_states'), { items: updatedStatesList });
    } catch (err) {
      console.error('Failed to sync state parties:', err);
    }

    setNewPartyCode('');
    setNewPartyFullName('');
    setNewPartyVotes('');
    setNewPartyPercentage(0);
    showStatus(`Added ${code} (${fullName}) to ${activeCMSState.name} election standings!`);
  };

  const handleRemovePartyFromState = (partyName: string) => {
    const currentParties = activeCMSState.topParties || [];
    const updatedParties = currentParties.filter((p: any) => p.name.toUpperCase().trim() !== partyName.toUpperCase().trim());
    const updatedStatesList = statesList.map(s => s.code === selectedStateCode ? { ...s, topParties: updatedParties } : s);
    setStatesList(updatedStatesList);
    try {
      setDoc(doc(db, 'cms', 'monitored_states'), { items: updatedStatesList });
    } catch (err) {
      console.error('Failed to sync state parties:', err);
    }
    showStatus(`Removed ${partyName} from ${activeCMSState.name} election standings.`);
  };

  const handleMovePartyInState = (idx: number, direction: 'up' | 'down') => {
    const currentParties = activeCMSState?.topParties || [];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentParties.length) return;

    const updatedParties = [...currentParties];
    const [moved] = updatedParties.splice(idx, 1);
    updatedParties.splice(targetIdx, 0, moved);

    const updatedStatesList = statesList.map(s => s.code === selectedStateCode ? { ...s, topParties: updatedParties } : s);
    setStatesList(updatedStatesList);

    try {
      setDoc(doc(db, 'cms', 'monitored_states'), { items: updatedStatesList });
    } catch (err) {
      console.error('Failed to sync party order:', err);
    }
  };

  const handleSaveStateCMS = (e: any) => {
    e.preventDefault();
    
    const updatedStatesList = statesList.map(s => {
      if (s.code === selectedStateCode) {
        return {
          ...s,
          ...activeCMSState
        };
      }
      return s;
    });

    setStatesList(updatedStatesList);

    try {
      setDoc(doc(db, 'cms', 'monitored_states'), { items: updatedStatesList });
    } catch (e) {
      console.error('Failed to save states to Firestore:', e);
    }
    showStatus(`Standings and stats for ${activeCMSState.name} State updated successfully!`);
  };

  // Sync local states if the context gets reset or updated
  useEffect(() => {
    setLocalHero(heroConfig);
  }, [heroConfig]);

  useEffect(() => {
    setLocalStats(statsConfig);
  }, [statsConfig]);

  // Real-time Firestore subscribers sync
  useEffect(() => {
    if (activeTab === 'subscribers') {
      setSubLoading(true);
      const q = query(collection(db, 'subscribers'), orderBy('subscribedAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setSubscribers(list);
        setSubLoading(false);
      }, (error) => {
        console.error("Error listening to subscribers:", error);
        setSubLoading(false);
      });
      return () => unsubscribe();
    }
  }, [activeTab]);

  // Flash status messages
  const [statusMsg, setStatusMsg] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const triggerConfirm = (message: string, onConfirm: () => void) => {
    setConfirmDialog({ message, onConfirm });
  };

  // ----------------------------------------------------
  // Form States
  // ----------------------------------------------------
  
  // Empty form templates for clean resets
  const EMPTY_REPORT_FORM: Partial<Report> = {
    id: '', tag: 'ELECTION AUDIT', tagType: 'analysis', date: '2026-07-13', size: '1.2 MB', title: '', summary: '', sections: [], author: '', authorsList: '', readingTime: '', image: '', pdfUrl: '',
    downloadSectionTitle: '', downloadButtonLabel: ''
  };

  const EMPTY_WEEKLY_FORM: Partial<WeeklyIssue> = {
    id: '', tag: 'Weekly Analysis', date: 'July 2026', title: '', summary: '', linkText: 'Read full analysis',
    author: '', readingTime: '4 min read', sections: [], image: '', pdfUrl: '',
    downloadSectionTitle: '', downloadButtonLabel: ''
  };

  const EMPTY_EVENT_FORM: Partial<EventItem> = {
    id: '', month: 'JUL', day: '15', title: '', description: '', location: 'Online Webinar', type: 'Briefing', imageUrl: '', externalLink: '', links: []
  };

  const EMPTY_ANNOUNCEMENT_FORM: Partial<AnnouncementItem> = {
    id: '', month: 'JUL', day: '15', date: '15 July 2026', title: '', summary: '', content: '', category: 'press', author: '', authorsList: '', readingTime: '', image: '', pdfUrl: '',
    downloadSectionTitle: '', downloadButtonLabel: ''
  };

  const EMPTY_TEAM_FORM: Partial<TeamMember> = {
    id: '', name: '', role: '', initials: ''
  };

  const EMPTY_DIARY_FORM: Partial<DiaryItem> = {
    id: '',
    date: '',
    title: '',
    subtitle: '',
    status: 'In view',
    region: 'nigeria',
    type: 'governorship',
    country: 'Nigeria',
    location: '',
    electoralBody: 'INEC',
    registeredVoters: '',
    pollingUnits: '',
    lgasCount: '',
    description: '',
    keyIssues: [],
    monitoringMission: 'Athena Field Observers deploying across all LGAs.',
    sittingExecutive: { name: '', title: '', party: '', assumedOffice: '', termInfo: '', notes: '' },
    participants: []
  };

  // 1. Report Form
  const [reportForm, setReportForm] = useState<Partial<Report>>(EMPTY_REPORT_FORM);

  // 2. Diary Form
  const [diaryForm, setDiaryForm] = useState<Partial<DiaryItem>>(EMPTY_DIARY_FORM);
  const [diarySubMode, setDiarySubMode] = useState<'form' | 'spreadsheet'>('form');
  const [diarySpreadsheetText, setDiarySpreadsheetText] = useState('');
  const [diarySpreadsheetParsed, setDiarySpreadsheetParsed] = useState<ParsedSpreadsheet | null>(null);
  const [diarySearchQuery, setDiarySearchQuery] = useState('');

  // Elections spreadsheet submode states
  const [electionsSubMode, setElectionsSubMode] = useState<'manual' | 'spreadsheet'>('manual');
  const [electionsSpreadsheetText, setElectionsSpreadsheetText] = useState('');
  const [electionsSpreadsheetParsed, setElectionsSpreadsheetParsed] = useState<ParsedSpreadsheet | null>(null);

  // 3. Weekly Issue Form
  const [weeklyForm, setWeeklyForm] = useState<Partial<WeeklyIssue>>(EMPTY_WEEKLY_FORM);

  // 4. Event Form
  const [eventForm, setEventForm] = useState<Partial<EventItem>>(EMPTY_EVENT_FORM);

  // Announcement Form
  const [announcementForm, setAnnouncementForm] = useState<Partial<AnnouncementItem>>(EMPTY_ANNOUNCEMENT_FORM);

  // 5. Team Member Form
  const [teamForm, setTeamForm] = useState<Partial<TeamMember>>(EMPTY_TEAM_FORM);

  if (!isStandalone && !isOpen) return null;

  const showStatus = (msg: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg(msg);
    setStatusType(type);
    setTimeout(() => setStatusMsg(''), 4000);
  };

  useEffect(() => {
    const handleStorageError = (e: Event) => {
      const customEvent = e as CustomEvent;
      const message = customEvent.detail?.message || 'Storage quota exceeded.';
      showStatus(message, 'error');
    };
    window.addEventListener('aeo_storage_error', handleStorageError);
    return () => {
      window.removeEventListener('aeo_storage_error', handleStorageError);
    };
  }, []);

  const handleRefreshData = async () => {
    try {
      await refreshData();
      showStatus('All collections refreshed from cloud database.');
    } catch {
      showStatus('Error refreshing data.', 'error');
    }
  };

  const handleRestorePublications = () => {
    triggerConfirm('Restore publications from database backup? This will restore any missing reports, briefs, weekly digests, and associated documents.', async () => {
      const res = await restorePublicationsBackup();
      if (res.success) {
        showStatus(`Restored ${res.count} publications successfully.`);
      } else {
        showStatus('Failed to restore publications.', 'error');
      }
    });
  };

  const handleExportData = () => {
    try {
      const json = exportAllDataJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aeo-cms-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showStatus('Database JSON backup downloaded.');
    } catch {
      showStatus('Failed to export backup.', 'error');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const confirmation = window.prompt("WARNING: Importing a database backup will validate and restore CMS records into production Firestore. Type 'CONFIRM RESTORE DATABASE' to proceed.");
    if (!confirmation || confirmation.trim().toUpperCase() !== 'CONFIRM RESTORE DATABASE') {
      showStatus("Import cancelled or confirmation phrase mismatched.", "error");
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = await importDataJson(content, 'CONFIRM RESTORE DATABASE');
        if (res.success) {
          showStatus(res.message);
        } else {
          showStatus(res.message, 'error');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetData = () => {
    const confirmation = window.prompt("WARNING: To reset general templates (Diaries, Events, Team), type 'CONFIRM RESET DATA' below. All published reports, weekly issues, announcements, and DCM documents will be preserved untouched.");
    if (!confirmation || confirmation.trim().toUpperCase() !== 'CONFIRM RESET DATA') {
      showStatus("Reset cancelled or confirmation phrase mismatched.", "error");
      return;
    }
    resetAllData('CONFIRM RESET DATA')
      .then(() => {
        setEditingId(null);
        showStatus('General templates reset to defaults (publications preserved).');
      })
      .catch((err: any) => {
        showStatus(err?.message || 'Reset failed.', 'error');
      });
  };

  // Helper to generate IDs
  const generateId = () => {
    return 'custom-' + Math.random().toString(36).substring(2, 7);
  };

  // ----------------------------------------------------
  // Form Submission Handlers
  // ----------------------------------------------------

  const handleSaveReport = async (e: FormEvent) => {
    e.preventDefault();
    if (!reportForm.title || !reportForm.summary) {
      showStatus('Please fill out the Title and Summary.', 'error');
      return;
    }

    const finalId = reportForm.id || generateId();
    let defaultTagType: TagType = 'analysis';
    let defaultTag = 'ELECTION AUDIT';

    if (selectedPubType === 'assessment') {
      defaultTagType = 'tech';
      defaultTag = 'POLITICAL LANDSCAPE MONITOR';
    } else if (selectedPubType === 'brief') {
      defaultTagType = 'brief';
      defaultTag = 'REPORTS & BRIEFS';
    } else if (selectedPubType === 'dcm') {
      defaultTagType = 'dcm';
      defaultTag = 'DEMOCRATIC COMPETITIVENESS MAP';
    } else if (selectedPubType === 'africa-election-watch') {
      defaultTagType = 'africa-election-watch';
      defaultTag = 'AFRICA ELECTION WATCH';
    }

    const parsedDate = parseFlexibleDate(reportForm.date || 'July 2026');
    const finalReport: Report = {
      id: finalId,
      title: reportForm.title,
      summary: reportForm.summary,
      tag: reportForm.tag || defaultTag,
      tagType: (reportForm.tagType as TagType) || defaultTagType,
      date: parsedDate.isValid ? parsedDate.displayDate : (reportForm.date || 'July 2026'),
      normalizedDate: reportForm.normalizedDate || parsedDate.normalizedDate,
      datePrecision: reportForm.datePrecision || parsedDate.precision,
      sortValue: reportForm.sortValue || parsedDate.sortValue,
      size: reportForm.size || '1.0 MB',
      sections: reportForm.sections && reportForm.sections.length > 0 
        ? reportForm.sections 
        : [{ title: 'Overview', content: reportForm.summary }],
      author: reportForm.author || '',
      authorsList: reportForm.authorsList || '',
      readingTime: reportForm.readingTime?.trim() || undefined,
      image: reportForm.image || '',
      pdfUrl: prepareDocumentUrl(reportForm.pdfUrl || ''),
      downloadSectionTitle: reportForm.downloadSectionTitle?.trim() || undefined,
      downloadButtonLabel: reportForm.downloadButtonLabel?.trim() || undefined,
      reads: typeof reportForm.reads === 'number' ? reportForm.reads : undefined,
      downloads: typeof reportForm.downloads === 'number' ? reportForm.downloads : undefined
    };

    try {
      await saveReport(finalReport);
      setEditingId(null);
      setReportForm(EMPTY_REPORT_FORM);
      showStatus(`Publication "${finalReport.title}" saved successfully!`);
    } catch (err: any) {
      showStatus(`Failed to save publication: ${err?.message || 'Database error'}`, 'error');
    }
  };

  const handleSaveDiary = async (e: FormEvent) => {
    e.preventDefault();
    if (!diaryForm.title || !diaryForm.date) {
      showStatus('Please enter Title and Date.', 'error');
      return;
    }

    const finalId = diaryForm.id || generateId();
    const parsedDate = parseFlexibleDate(diaryForm.date || '');
    const finalItem: DiaryItem = {
      ...diaryForm,
      id: finalId,
      date: parsedDate.isValid ? parsedDate.displayDate : diaryForm.date,
      normalizedDate: diaryForm.normalizedDate || parsedDate.normalizedDate,
      datePrecision: diaryForm.datePrecision || parsedDate.precision,
      sortValue: diaryForm.sortValue || parsedDate.sortValue,
      title: diaryForm.title,
      subtitle: diaryForm.subtitle || 'Observatory Sync',
      status: diaryForm.status || 'In view',
      region: diaryForm.region || (diaryCategory === 'national' || diaryCategory === 'local' ? 'nigeria' : diaryCategory === 'africa' ? 'africa' : 'other'),
      type: diaryForm.type || 'governorship',
      country: diaryForm.country || 'Nigeria',
      location: diaryForm.location || '',
      electoralBody: diaryForm.electoralBody || 'INEC',
      registeredVoters: diaryForm.registeredVoters || '',
      pollingUnits: diaryForm.pollingUnits || '',
      lgasCount: diaryForm.lgasCount || '',
      description: diaryForm.description || '',
      keyIssues: Array.isArray(diaryForm.keyIssues) ? diaryForm.keyIssues : [],
      monitoringMission: diaryForm.monitoringMission || '',
      sittingExecutive: diaryForm.sittingExecutive || { name: '', title: '', party: '' },
      participants: Array.isArray(diaryForm.participants) ? diaryForm.participants : []
    };

    try {
      await saveDiaryItem(diaryCategory, finalItem);
      setEditingId(null);
      setDiaryForm(EMPTY_DIARY_FORM);
      showStatus(`Electoral timeline "${finalItem.title}" saved successfully!`);
    } catch (err: any) {
      showStatus(`Failed to save diary item: ${err?.message || 'Database error'}`, 'error');
    }
  };

  const handleAddCandidateToDiary = () => {
    const current = diaryForm.participants || [];
    setDiaryForm({
      ...diaryForm,
      participants: [...current, { name: '', party: '', role: 'Candidate', platform: '' }]
    });
  };

  const handleRemoveCandidateFromDiary = (index: number) => {
    const current = diaryForm.participants || [];
    setDiaryForm({
      ...diaryForm,
      participants: current.filter((_, idx) => idx !== index)
    });
  };

  const handleCandidateChange = (index: number, field: string, value: string) => {
    const current = [...(diaryForm.participants || [])];
    if (current[index]) {
      current[index] = { ...current[index], [field]: value };
      setDiaryForm({ ...diaryForm, participants: current });
    }
  };

  const handleProcessDiarySpreadsheet = () => {
    if (!diarySpreadsheetText.trim()) {
      showStatus('Please paste spreadsheet rows or upload a CSV file.', 'error');
      return;
    }
    const parsed = parseSpreadsheetText(diarySpreadsheetText);
    if (parsed.rows.length === 0) {
      showStatus('No valid data rows found in spreadsheet text.', 'error');
      return;
    }
    setDiarySpreadsheetParsed(parsed);
    showStatus(`Parsed ${parsed.rows.length} rows from spreadsheet!`);
  };

  const handleImportDiarySpreadsheetToDB = () => {
    if (!diarySpreadsheetParsed || diarySpreadsheetParsed.rows.length === 0) return;

    let importedCount = 0;
    diarySpreadsheetParsed.rows.forEach(row => {
      const title = row['Title'] || row['Event Title'] || row['Name'] || row['title'] || '';
      const date = row['Date'] || row['Electoral Date'] || row['date'] || '';
      if (!title || !date) return;

      const subtitle = row['Subtitle'] || row['Context'] || row['subtitle'] || 'Electoral Monitored';
      const statusRaw = row['Status'] || row['status'] || 'In view';
      const validStatuses = ['In view', 'Scheduled', 'Provisional', 'Tracking', 'Concluded'];
      const status = validStatuses.includes(statusRaw) ? statusRaw as any : 'In view';

      const catRaw = (row['Category'] || row['category'] || diaryCategory || 'national').toLowerCase();
      const targetCat: 'national' | 'local' | 'africa' | 'other' = 
        catRaw.includes('local') ? 'local' :
        catRaw.includes('africa') ? 'africa' :
        catRaw.includes('other') ? 'other' : 'national';

      const regionRaw = (row['Region'] || row['region'] || 'nigeria').toLowerCase();
      const region = (regionRaw.includes('africa') ? 'africa' : regionRaw.includes('other') ? 'other' : 'nigeria') as any;

      const typeRaw = (row['Type'] || row['type'] || 'governorship').toLowerCase();
      const type = (typeRaw.includes('presid') ? 'presidential' : typeRaw.includes('local') ? 'local_government' : typeRaw.includes('gov') ? 'governorship' : 'other') as any;

      const keyIssuesStr = row['Key Issues'] || row['Key issues'] || row['keyIssues'] || '';
      const keyIssues = keyIssuesStr ? keyIssuesStr.split(/;|\|/).map(s => s.trim()).filter(Boolean) : [];

      const execName = row['Executive Name'] || row['Executive'] || '';
      const execParty = row['Executive Party'] || row['Party'] || '';

      const newItem: DiaryItem = {
        id: generateId(),
        title,
        date,
        subtitle,
        status,
        region,
        type,
        country: row['Country'] || row['country'] || 'Nigeria',
        location: row['Location'] || row['State'] || row['location'] || '',
        electoralBody: row['Electoral Body'] || row['INEC'] || row['electoralBody'] || 'INEC',
        registeredVoters: row['Registered Voters'] || row['Voters'] || row['registeredVoters'] || '',
        pollingUnits: row['Polling Units'] || row['PUs'] || row['pollingUnits'] || '',
        lgasCount: row['LGAs'] || row['LGAs Count'] || row['lgasCount'] || '',
        description: row['Description'] || row['description'] || '',
        keyIssues,
        monitoringMission: row['Monitoring Mission'] || 'Athena Field Observers deployment',
        sittingExecutive: { name: execName, title: 'Governor / Head', party: execParty },
        participants: []
      };

      saveDiaryItem(targetCat, newItem);
      importedCount++;
    });

    showStatus(`Successfully imported ${importedCount} diary records into database!`);
    setDiarySpreadsheetText('');
    setDiarySpreadsheetParsed(null);
    setDiarySubMode('form');
  };

  const handleProcessElectionsSpreadsheet = () => {
    if (!electionsSpreadsheetText.trim()) {
      showStatus('Please paste spreadsheet rows or upload a CSV file.', 'error');
      return;
    }
    const parsed = parseSpreadsheetText(electionsSpreadsheetText);
    if (parsed.rows.length === 0) {
      showStatus('No valid data rows found in spreadsheet.', 'error');
      return;
    }
    setElectionsSpreadsheetParsed(parsed);
    showStatus(`Parsed ${parsed.rows.length} rows of election data!`);
  };

  const handleImportElectionsSpreadsheetToDB = () => {
    if (!electionsSpreadsheetParsed || electionsSpreadsheetParsed.rows.length === 0) return;

    let updatedCount = 0;
    const currentList = [...statesList];

    electionsSpreadsheetParsed.rows.forEach(row => {
      const code = (row['State Code'] || row['Code'] || row['stateCode'] || '').toUpperCase();
      if (!code) return;

      const stateName = row['State Name'] || row['State'] || row['name'] || code;
      const electionTitle = row['Election Title'] || row['Title'] || row['election'] || `${stateName} State Election`;
      const status = row['Status'] || row['status'] || 'Upcoming';
      const date = row['Date'] || row['date'] || '2026';

      const regVoters = row['Registered Voters'] || row['Voters'] || row['voters'] || '0';
      const accVoters = Number(row['Accredited Voters'] || row['accreditedVoters'] || 0);
      const pus = row['Polling Units'] || row['pollingUnits'] || '0';
      const lgas = Number(row['LGAs'] || row['numLgas'] || 0);
      const wards = Number(row['Wards'] || row['numWards'] || 0);
      const valid = Number(row['Valid Votes'] || row['validVotes'] || 0);
      const rejected = Number(row['Rejected Votes'] || row['rejectedVotes'] || 0);
      const total = Number(row['Total Votes'] || row['totalVotes'] || (valid + rejected));
      const reconRate = row['Reconciliation Rate'] || row['reconciledRate'] || '99.0%';

      // Party votes columns
      const partiesToExtract = ['APC', 'PDP', 'LP', 'NNPP', 'APGA', 'SDP', 'YPP', 'ADC', 'AAC', 'ZLP'];
      const partyVotes: { name: string; votesNum: number }[] = [];
      let sumVotes = 0;

      partiesToExtract.forEach(p => {
        const valStr = row[`${p} Votes`] || row[`${p}`] || row[p] || '0';
        const num = parseInt(valStr.replace(/,/g, ''), 10) || 0;
        if (num > 0) {
          partyVotes.push({ name: p, votesNum: num });
          sumVotes += num;
        }
      });

      const denominator = total > 0 ? total : (sumVotes > 0 ? sumVotes : 1);
      const topParties = partyVotes.map(pv => {
        const pct = Number(((pv.votesNum / denominator) * 100).toFixed(1));
        return {
          name: pv.name,
          fullName: partyFullNames[pv.name] || `${pv.name} Party`,
          votes: `${pv.votesNum.toLocaleString()} votes`,
          percentage: pct,
          color: pv.name === 'APC' ? 'bg-emerald-600' : pv.name === 'PDP' ? 'bg-red-600' : pv.name === 'LP' ? 'bg-rose-500' : 'bg-indigo-600'
        };
      });

      const existingIndex = currentList.findIndex(s => s.code === code);
      const updatedStateObj = {
        code,
        name: stateName,
        election: electionTitle,
        status,
        date,
        voters: regVoters,
        accreditedVoters: accVoters,
        pollingUnits: pus,
        numLgas: lgas,
        numWards: wards,
        validVotes: valid,
        rejectedVotes: rejected,
        totalVotes: total,
        reconciledRate: reconRate,
        summary: row['Summary'] || row['summary'] || `Election metrics updated for ${stateName} State.`,
        topParties: topParties.length > 0 ? topParties : (existingIndex >= 0 ? currentList[existingIndex].topParties : []),
        lgaStandings: existingIndex >= 0 ? currentList[existingIndex].lgaStandings : []
      };

      if (existingIndex >= 0) {
        currentList[existingIndex] = { ...currentList[existingIndex], ...updatedStateObj };
      } else {
        currentList.push(updatedStateObj);
      }
      updatedCount++;
    });

    setStatesList(currentList);
    try {
      setDoc(doc(db, 'cms', 'monitored_states'), { items: currentList });
    } catch (e) {
      console.error("Failed to sync updated states to Firestore:", e);
    }

    showStatus(`Updated election data for ${updatedCount} state records!`);
    setElectionsSpreadsheetText('');
    setElectionsSpreadsheetParsed(null);
    setElectionsSubMode('manual');
  };

  const handleSaveWeekly = async (e: FormEvent) => {
    e.preventDefault();
    if (!weeklyForm.title || !weeklyForm.summary) {
      showStatus('Please fill out Title and Summary.', 'error');
      return;
    }

    const finalId = weeklyForm.id || generateId();
    const parsedDate = parseFlexibleDate(weeklyForm.date || 'July 2026');
    const finalIssue: WeeklyIssue = {
      id: finalId,
      tag: weeklyForm.tag || 'Weekly Analysis',
      date: parsedDate.isValid ? parsedDate.displayDate : (weeklyForm.date || 'July 2026'),
      normalizedDate: weeklyForm.normalizedDate || parsedDate.normalizedDate,
      datePrecision: weeklyForm.datePrecision || parsedDate.precision,
      sortValue: weeklyForm.sortValue || parsedDate.sortValue,
      title: weeklyForm.title,
      summary: weeklyForm.summary,
      linkText: weeklyForm.linkText || 'Read full analysis',
      author: weeklyForm.author || '',
      readingTime: weeklyForm.readingTime || '5 min read',
      sections: weeklyForm.sections && weeklyForm.sections.length > 0
        ? weeklyForm.sections
        : [
            { title: 'Core Assessment', text: weeklyForm.summary },
            { title: 'Logistics Breakdown', text: 'This represents a live, custom edited observation sub-paragraph.' }
          ],
      image: weeklyForm.image || '',
      pdfUrl: prepareDocumentUrl(weeklyForm.pdfUrl || ''),
      downloadSectionTitle: weeklyForm.downloadSectionTitle?.trim() || undefined,
      downloadButtonLabel: weeklyForm.downloadButtonLabel?.trim() || undefined,
      reads: typeof weeklyForm.reads === 'number' ? weeklyForm.reads : undefined,
      downloads: typeof weeklyForm.downloads === 'number' ? weeklyForm.downloads : undefined
    };

    try {
      await saveWeeklyIssue(finalIssue);
      setEditingId(null);
      setWeeklyForm(EMPTY_WEEKLY_FORM);
      showStatus(`Weekly briefing "${finalIssue.title}" saved!`);
    } catch (err: any) {
      showStatus(`Failed to save weekly issue: ${err?.message || 'Database error'}`, 'error');
    }
  };

  const handleSaveEvent = async (e: FormEvent) => {
    e.preventDefault();
    if (!eventForm.title) {
      showStatus('Please fill out Event Title.', 'error');
      return;
    }

    const rawEventDate = eventForm.date || `${eventForm.day || '15'} ${eventForm.month || 'AUG'} 2026`;
    const parsedDate = parseFlexibleDate(rawEventDate);

    const finalId = eventForm.id || generateId();
    const finalEvent: EventItem = {
      id: finalId,
      month: eventForm.month ? eventForm.month.toUpperCase() : (parsedDate.isValid ? parsedDate.normalizedDate.substring(5, 7) : 'AUG'),
      day: eventForm.day || (parsedDate.isValid && parsedDate.precision === 'day' ? parsedDate.normalizedDate.substring(8, 10) : '15'),
      date: parsedDate.isValid ? parsedDate.displayDate : rawEventDate,
      normalizedDate: eventForm.normalizedDate || parsedDate.normalizedDate,
      datePrecision: eventForm.datePrecision || parsedDate.precision,
      sortValue: eventForm.sortValue || parsedDate.sortValue,
      title: eventForm.title,
      description: eventForm.description || '',
      location: eventForm.location || 'Online',
      type: eventForm.type || 'Briefing',
      imageUrl: eventForm.imageUrl || '',
      externalLink: eventForm.externalLink || '',
      links: (eventForm.links && eventForm.links.length > 0) ? eventForm.links : [
        { label: 'View Our Publications', url: '/publications', external: false },
        { label: 'Submit Partner Cooperation Request', url: 'mailto:aeo@athenacentre.org', external: true }
      ]
    };

    try {
      await saveEvent(finalEvent);
      setEditingId(null);
      setEventForm({ id: '', month: 'JUL', day: '15', title: '', description: '', location: 'Online Webinar', type: 'Briefing', imageUrl: '', externalLink: '', links: [] });
      showStatus(`Event "${finalEvent.title}" saved!`);
    } catch (err: any) {
      showStatus(`Failed to save event: ${err?.message || 'Database error'}`, 'error');
    }
  };

  const handleSaveAnnouncement = async (e: FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title) {
      showStatus('Please fill out Announcement Title.', 'error');
      return;
    }

    const rawAnnouncementDate = announcementForm.date || `${announcementForm.day || '15'} ${announcementForm.month || 'JUL'} 2026`;
    const parsedDate = parseFlexibleDate(rawAnnouncementDate);

    const finalId = announcementForm.id || generateId();
    const finalAnnouncement: AnnouncementItem = {
      id: finalId,
      month: announcementForm.month ? announcementForm.month.toUpperCase() : (parsedDate.isValid ? parsedDate.normalizedDate.substring(5, 7) : 'JUL'),
      day: announcementForm.day || (parsedDate.isValid && parsedDate.precision === 'day' ? parsedDate.normalizedDate.substring(8, 10) : '15'),
      date: parsedDate.isValid ? parsedDate.displayDate : rawAnnouncementDate,
      normalizedDate: announcementForm.normalizedDate || parsedDate.normalizedDate,
      datePrecision: announcementForm.datePrecision || parsedDate.precision,
      sortValue: announcementForm.sortValue || parsedDate.sortValue,
      title: announcementForm.title,
      summary: announcementForm.summary || '',
      content: announcementForm.content || '',
      category: announcementForm.category || 'press',
      author: announcementForm.author || '',
      authorsList: announcementForm.authorsList || '',
      readingTime: announcementForm.readingTime?.trim() || undefined,
      image: announcementForm.image || '',
      pdfUrl: prepareDocumentUrl(announcementForm.pdfUrl || ''),
      downloadSectionTitle: announcementForm.downloadSectionTitle?.trim() || undefined,
      downloadButtonLabel: announcementForm.downloadButtonLabel?.trim() || undefined,
      reads: typeof announcementForm.reads === 'number' ? announcementForm.reads : undefined,
      downloads: typeof announcementForm.downloads === 'number' ? announcementForm.downloads : undefined
    };

    try {
      await saveAnnouncement(finalAnnouncement);
      setEditingId(null);
      setAnnouncementForm(EMPTY_ANNOUNCEMENT_FORM);
      showStatus(`Announcement "${finalAnnouncement.title}" saved!`);
    } catch (err: any) {
      showStatus(`Failed to save announcement: ${err?.message || 'Database error'}`, 'error');
    }
  };

  const handleSaveTeam = async (e: FormEvent) => {
    e.preventDefault();
    if (!teamForm.name || !teamForm.role) {
      showStatus('Please fill out Member Name and Role.', 'error');
      return;
    }

    const finalId = teamForm.id || generateId();
    const initials = teamForm.initials || teamForm.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const finalMember: TeamMember = {
      id: finalId,
      name: teamForm.name,
      role: teamForm.role,
      initials
    };

    try {
      await saveTeamMember(finalMember);
      setEditingId(null);
      setTeamForm({ id: '', name: '', role: '', initials: '' });
      showStatus(`Team member "${finalMember.name}" saved!`);
    } catch (err: any) {
      showStatus(`Failed to save team member: ${err?.message || 'Database error'}`, 'error');
    }
  };

  // ----------------------------------------------------
  // Dynamic Section Modifiers
  // ----------------------------------------------------
  const addReportSection = () => {
    const sections = [...(reportForm.sections || [])];
    sections.push({ title: 'New Sub-Section', content: 'Enter forensic details here...' });
    setReportForm({ ...reportForm, sections });
  };

  const updateReportSection = (index: number, field: 'title' | 'content', val: string) => {
    const sections = [...(reportForm.sections || [])];
    sections[index] = { ...sections[index], [field]: val };
    setReportForm({ ...reportForm, sections });
  };

  const removeReportSection = (index: number) => {
    const sections = (reportForm.sections || []).filter((_, i) => i !== index);
    setReportForm({ ...reportForm, sections });
  };

  const addWeeklySection = () => {
    const sections = [...(weeklyForm.sections || [])];
    sections.push({ title: 'New Article Chapter', text: 'Enter article text body here...' });
    setWeeklyForm({ ...weeklyForm, sections });
  };

  const updateWeeklySection = (index: number, field: 'title' | 'text', val: string) => {
    const sections = [...(weeklyForm.sections || [])];
    sections[index] = { ...sections[index], [field]: val };
    setWeeklyForm({ ...weeklyForm, sections });
  };

  const removeWeeklySection = (index: number) => {
    const sections = (weeklyForm.sections || []).filter((_, i) => i !== index);
    setWeeklyForm({ ...weeklyForm, sections });
  };

  return (
    <div className={isStandalone 
      ? "min-h-screen bg-slate-50 flex flex-col font-sans text-ink" 
      : "fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex justify-end font-sans text-ink"
    }>
      
      {/* Sliding Panel / Main Container */}
      <div className={isStandalone 
        ? "w-full flex-grow flex flex-col bg-white" 
        : "w-full max-w-4xl bg-white shadow-2xl h-full flex flex-col animate-slide-in"
      }>
        
        {/* Header */}
        <div className="bg-navy text-white px-6 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-brand-purple" />
            <div>
              <h2 className="font-display font-bold text-lg leading-tight flex items-center gap-2">
                <span>Observatory CMS Dashboard</span>
                {isStandalone && (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-brand-purple/20 text-brand-purple border border-brand-purple/30 rounded">Admin Workspace</span>
                )}
              </h2>
              <p className="text-[11px] text-blue-200 font-mono">
                {isStandalone ? 'Full-Screen Content Management Console' : 'Live Content Management Console'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshData}
              title="Refresh all collections from Firestore"
              className="p-1.5 hover:bg-white/10 rounded-lg text-blue-200 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-mono font-medium cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleRestorePublications}
              title="Restore Publications from Database Backup"
              className="p-1.5 hover:bg-emerald-500/20 rounded-lg text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 transition-colors flex items-center gap-1.5 text-xs font-mono font-medium cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Restore Backup</span>
            </button>

            <button
              onClick={handleExportData}
              title="Download full JSON backup of database to your computer"
              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-mono cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export JSON</span>
            </button>

            <label
              title="Import JSON backup from computer"
              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-mono cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import JSON</span>
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </label>
            {isStandalone ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => auth.signOut()}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md hover:scale-[1.02]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
                <button 
                  onClick={onNavigateHome}
                  className="px-3.5 py-1.5 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md hover:scale-[1.02]"
                >
                  <span>Back to Website</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Floating toast notification */}
        {statusMsg && (
          <div className={`border-y px-6 py-2.5 text-xs font-mono flex items-center gap-2 animate-fade-in shrink-0 ${
            statusType === 'error' 
              ? 'bg-red-50 border-red-200 text-red-800' 
              : 'bg-green-50 border-green-200 text-green-800'
          }`}>
            {statusType === 'error' ? (
              <X className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
            )}
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Tab Selection */}
        <div className="bg-paper border-b border-line px-6 py-2 flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('publications'); setEditingId(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer border border-brand-purple/25 ${
              activeTab === 'publications' ? 'bg-navy text-white font-bold' : 'hover:bg-line text-ink2'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-brand-purple" />
            <span>Publications ({reports.length + weekly.length + announcements.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('apea'); setEditingId(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer border border-blue-300 ${
              activeTab === 'apea' ? 'bg-blue-900 text-white font-bold shadow-md' : 'hover:bg-line text-blue-700 font-bold bg-blue-50/50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            <span>APEA Audits &amp; PDFs</span>
          </button>
          <button
            onClick={() => { setActiveTab('dcm_publications'); setEditingId(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer border border-brand-blue/30 ${
              activeTab === 'dcm_publications' ? 'bg-brand-blue text-white font-bold' : 'hover:bg-line text-brand-blue font-bold'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-300" />
            <span>DCM Publications</span>
          </button>
          <button
            onClick={() => { setActiveTab('diary'); setEditingId(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'diary' ? 'bg-navy text-white' : 'hover:bg-line text-ink2'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Electoral Timelines</span>
          </button>
          <button
            onClick={() => { setActiveTab('events'); setEditingId(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'events' ? 'bg-navy text-white' : 'hover:bg-line text-ink2'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Events ({events.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('team'); setEditingId(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'team' ? 'bg-navy text-white' : 'hover:bg-line text-ink2'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team Members ({team.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('hero_stats'); setEditingId(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer border border-brand-purple/20 ${
              activeTab === 'hero_stats' ? 'bg-brand-purple text-white' : 'hover:bg-line text-brand-purple'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-brand-purple" />
            <span className="font-bold">Hero & Stats (Visual CMS)</span>
          </button>
          <button
            onClick={() => { setActiveTab('subscribers'); setEditingId(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer border border-brand-blue/20 ${
              activeTab === 'subscribers' ? 'bg-brand-blue text-white' : 'hover:bg-line text-brand-blue'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-brand-blue" />
            <span className="font-bold">Subscribers ({subscribers.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('elections'); setEditingId(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer border border-indigo-200 ${
              activeTab === 'elections' ? 'bg-indigo-600 text-white' : 'hover:bg-line text-indigo-600'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-bold">Elections & Parties</span>
          </button>
          {isOwner && (
            <button
              onClick={() => { setActiveTab('admins'); setEditingId(null); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer border border-amber-300 ${
                activeTab === 'admins' ? 'bg-navy text-brand-gold font-bold shadow-sm' : 'hover:bg-line text-amber-800 font-bold bg-amber-50/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-brand-gold" />
              <span>Manage Administrators</span>
            </button>
          )}
        </div>

        {/* Tab Contents Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* MANAGE ADMINISTRATORS TAB (Super Administrator Only) */}
          {activeTab === 'admins' && isOwner && effectiveUser && (
            <AdminManagement currentUser={effectiveUser} />
          )}

          {/* APEA AUDITS & PDF REPORTS TAB */}
          {activeTab === 'apea' && (
            <ApeaCmsManager onStatusMsg={showStatus} />
          )}

          {/* DCM PUBLICATIONS TAB (Dedicated Manager) */}
          {activeTab === 'dcm_publications' && (
            <DcmCmsManager />
          )}

          {/* PUBLICATIONS TAB (Unified Point for all publications) */}
          {activeTab === 'publications' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Publication Editor Form */}
              <div className="lg:col-span-7 bg-paper border border-line rounded-2xl p-5 space-y-4">
                
                {/* Header with Type selector */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-sm text-ink uppercase tracking-wider flex items-center gap-1.5">
                      <Plus className="w-4.5 h-4.5 text-brand-blue" />
                      <span>
                         {editingId 
                          ? `Edit ${selectedPubType === 'assessment' ? 'Political Landscape Monitor' : selectedPubType === 'brief' ? 'Report / Brief' : selectedPubType === 'dcm' ? 'DCM Report' : selectedPubType === 'africa-election-watch' ? 'Africa Election Watch' : selectedPubType === 'weekly' ? 'Weekly Digest' : selectedPubType === 'announcement' ? 'Announcement' : 'Post-Election Audit'}` 
                          : `Create ${selectedPubType === 'assessment' ? 'Political Landscape Monitor' : selectedPubType === 'brief' ? 'Report / Brief' : selectedPubType === 'dcm' ? 'DCM Report' : selectedPubType === 'africa-election-watch' ? 'Africa Election Watch' : selectedPubType === 'weekly' ? 'Weekly Digest' : selectedPubType === 'announcement' ? 'Announcement' : 'Post-Election Audit'}`
                        }
                      </span>
                    </h3>
                    {editingId && (
                      <button 
                        onClick={() => {
                          setEditingId(null);
                          setReportForm(EMPTY_REPORT_FORM);
                          setWeeklyForm(EMPTY_WEEKLY_FORM);
                          setAnnouncementForm(EMPTY_ANNOUNCEMENT_FORM);
                        }}
                        className="text-xs text-red-600 hover:underline font-semibold font-mono"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  {/* Single Unified Selector for Publication Type */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase font-bold text-mut">Publication Category / Type</label>
                    <select 
                      disabled={!!editingId}
                      value={selectedPubType} 
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setSelectedPubType(val);
                        if (val === 'assessment') {
                          setReportForm(prev => ({
                            ...prev,
                            tagType: 'tech',
                            tag: prev.tag && prev.tag !== 'ELECTION AUDIT' ? prev.tag : 'POLITICAL LANDSCAPE MONITOR'
                          }));
                        } else if (val === 'brief') {
                          setReportForm(prev => ({
                            ...prev,
                            tagType: 'brief',
                            tag: prev.tag && prev.tag !== 'ELECTION AUDIT' ? prev.tag : 'REPORTS & BRIEFS'
                          }));
                        } else if (val === 'dcm') {
                          setReportForm(prev => ({
                            ...prev,
                            tagType: 'dcm',
                            tag: prev.tag && prev.tag !== 'ELECTION AUDIT' ? prev.tag : 'DEMOCRATIC COMPETITIVENESS MAP'
                          }));
                        } else if (val === 'africa-election-watch') {
                          setReportForm(prev => ({
                            ...prev,
                            tagType: 'africa-election-watch',
                            tag: prev.tag && prev.tag !== 'ELECTION AUDIT' ? prev.tag : 'AFRICA ELECTION WATCH'
                          }));
                        } else if (val === 'report') {
                          setReportForm(prev => ({
                            ...prev,
                            tagType: prev.tagType === 'brief' || prev.tagType === 'tech' || prev.tagType === 'dcm' || prev.tagType === 'africa-election-watch' ? 'analysis' : prev.tagType,
                            tag: prev.tag === 'REPORTS & BRIEFS' || prev.tag === 'POLITICAL LANDSCAPE MONITOR' || prev.tag === 'DEMOCRATIC COMPETITIVENESS MAP' || prev.tag === 'AFRICA ELECTION WATCH' ? 'ELECTION AUDIT' : prev.tag
                          }));
                        }
                      }}
                      className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-semibold font-mono focus:outline-none focus:border-brand-blue"
                    >
                      <option value="report">Post-Election Audit Report</option>
                      <option value="assessment">Political Landscape Monitor</option>
                      <option value="brief">Reports and Briefs (Policy Brief & Research)</option>
                      <option value="dcm">Democratic Competitiveness Map (DCM) Report</option>
                      <option value="africa-election-watch">Africa Election Watch</option>
                      <option value="weekly">AEO Weekly Digest Bulletin</option>
                      <option value="announcement">Official Announcement / Press Bulletin</option>
                    </select>
                    {editingId && (
                      <span className="text-[9px] font-mono text-mut block mt-1">* Publication type cannot be changed while editing an existing item.</span>
                    )}
                  </div>
                </div>

                {/* Sub-form based on selection */}
                <div className="border-t border-line pt-4">
                  {(selectedPubType === 'report' || selectedPubType === 'assessment' || selectedPubType === 'brief' || selectedPubType === 'dcm' || selectedPubType === 'africa-election-watch') && (
                    <form onSubmit={handleSaveReport} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">Report Tag Label</label>
                          <input 
                            type="text" 
                            value={reportForm.tag} 
                            onChange={(e) => setReportForm({ ...reportForm, tag: e.target.value })}
                            placeholder="E.g., OSUN AUDIT"
                            className="w-full text-xs p-2.5 border border-line rounded-lg bg-white focus:outline-none focus:border-brand-blue"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">Tag Type Classification</label>
                          <select 
                            value={reportForm.tagType} 
                            onChange={(e) => {
                              const newTagType = e.target.value as TagType;
                              setReportForm({ 
                                ...reportForm, 
                                tagType: newTagType,
                                tag: newTagType === 'tech' && (!reportForm.tag || reportForm.tag === 'ELECTION AUDIT') ? 'POLITICAL LANDSCAPE MONITOR' : newTagType === 'brief' && (!reportForm.tag || reportForm.tag === 'ELECTION AUDIT') ? 'REPORTS & BRIEFS' : newTagType === 'africa-election-watch' && (!reportForm.tag || reportForm.tag === 'ELECTION AUDIT') ? 'AFRICA ELECTION WATCH' : reportForm.tag
                              });
                              if (newTagType === 'tech') setSelectedPubType('assessment');
                              else if (newTagType === 'brief') setSelectedPubType('brief');
                              else if (newTagType === 'dcm') setSelectedPubType('dcm');
                              else if (newTagType === 'africa-election-watch') setSelectedPubType('africa-election-watch');
                              else setSelectedPubType('report');
                            }}
                            className="w-full text-xs p-2.5 border border-line rounded-lg bg-white focus:outline-none"
                          >
                            <option value="tech">Political Landscape Monitor (Orange theme)</option>
                            <option value="analysis">Post-Election Audit (Purple theme)</option>
                            <option value="brief">Reports and Briefs (Navy/Blue theme)</option>
                            <option value="dcm">Democratic Competitiveness Map (DCM) Report (Blue/Green theme)</option>
                            <option value="africa-election-watch">Africa Election Watch (Teal/Emerald theme)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <CMSDateField
                          label="Publishing Date / Period"
                          value={reportForm.date}
                          onChange={(val, meta) => setReportForm({
                            ...reportForm,
                            date: val,
                            ...(meta ? {
                              normalizedDate: meta.normalizedDate,
                              datePrecision: meta.datePrecision,
                              sortValue: meta.sortValue
                            } : {})
                          })}
                        />
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">Estimated Reading Time</label>
                          <input 
                            type="text" 
                            value={reportForm.readingTime || ''} 
                            onChange={(e) => setReportForm({ ...reportForm, readingTime: e.target.value })}
                            placeholder="E.g., 12 min read"
                            className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-mono focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">PDF Document Size</label>
                          <input 
                            type="text" 
                            value={reportForm.size} 
                            onChange={(e) => setReportForm({ ...reportForm, size: e.target.value })}
                            placeholder="E.g., 1.2 MB"
                            className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-mono focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">Read Counter (Views)</label>
                          <input 
                            type="number" 
                            min="0"
                            value={reportForm.reads !== undefined ? reportForm.reads : 0} 
                            onChange={(e) => setReportForm({ ...reportForm, reads: Math.max(0, parseInt(e.target.value) || 0) })}
                            placeholder="0"
                            className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-mono focus:outline-none focus:border-brand-blue"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">Download Counter</label>
                          <input 
                            type="number" 
                            min="0"
                            value={reportForm.downloads !== undefined ? reportForm.downloads : 0} 
                            onChange={(e) => setReportForm({ ...reportForm, downloads: Math.max(0, parseInt(e.target.value) || 0) })}
                            placeholder="0"
                            className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-mono focus:outline-none focus:border-brand-blue"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase font-bold text-mut">Report Title</label>
                        <input 
                          type="text" 
                          value={reportForm.title} 
                          onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                          placeholder="E.g., Osun 2026: Post-Election Audit on Live Collation Uploads"
                          className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-semibold focus:outline-none focus:border-brand-blue"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase font-bold text-mut">Short Synopsis / Executive Summary</label>
                        <textarea 
                          value={reportForm.summary} 
                          onChange={(e) => setReportForm({ ...reportForm, summary: e.target.value })}
                          placeholder="E.g., In-depth assessment of transmission pipelines and ad-hoc response compliance across 30 LGAs..."
                          className="w-full text-xs p-2.5 border border-line rounded-lg bg-white h-20 resize-none focus:outline-none focus:border-brand-blue"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">Lead Author</label>
                          <input 
                            type="text" 
                            value={reportForm.author || ''} 
                            onChange={(e) => setReportForm({ ...reportForm, author: e.target.value })}
                            placeholder="E.g. Chinaza Igwe"
                            className="w-full text-xs p-2.5 border border-line rounded-lg bg-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">Full Authors List</label>
                          <input 
                            type="text" 
                            value={reportForm.authorsList || ''} 
                            onChange={(e) => setReportForm({ ...reportForm, authorsList: e.target.value })}
                            placeholder="E.g. Chinaza Igwe and Uchenna Mgbechi"
                            className="w-full text-xs p-2.5 border border-line rounded-lg bg-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <FileUploadField 
                        label="Publication Thumbnail Image" 
                        accept="image/*" 
                        value={reportForm.image} 
                        onChange={(val) => setReportForm({ ...reportForm, image: val })} 
                      />

                      <FileUploadField 
                        label="Publication PDF Document (Downloadable)" 
                        accept="application/pdf" 
                        value={reportForm.pdfUrl} 
                        onChange={(val) => setReportForm({ ...reportForm, pdfUrl: val })} 
                      />

                      {/* Download Section Customization Controls */}
                      {(!!reportForm.pdfUrl || !!reportForm.downloadSectionTitle || !!reportForm.downloadButtonLabel) && (
                        <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 space-y-3">
                          <div className="flex items-center gap-1.5 text-blue-900 font-mono text-[11px] font-bold uppercase tracking-wider">
                            <Download className="w-3.5 h-3.5 text-brand-blue" />
                            <span>Download Component Labels (Optional)</span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                            Customise the section title and action button text displayed on the publication page. Leave empty to use the standard defaults (&ldquo;Download Official Statement&rdquo; and &ldquo;Download Report&rdquo;).
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="block text-[10px] font-mono uppercase font-bold text-slate-700">
                                Download Section Title
                              </label>
                              <input 
                                type="text" 
                                value={reportForm.downloadSectionTitle || ''} 
                                onChange={(e) => setReportForm({ ...reportForm, downloadSectionTitle: e.target.value })} 
                                placeholder="Download Official Statement"
                                className="w-full text-xs p-2.5 border border-line rounded-lg bg-white focus:outline-none focus:border-brand-blue transition-colors"
                              />
                              <span className="text-[10px] text-slate-500 font-mono block">
                                E.g. Download the Full Brief
                              </span>
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] font-mono uppercase font-bold text-slate-700">
                                Download Button Label
                              </label>
                              <input 
                                type="text" 
                                value={reportForm.downloadButtonLabel || ''} 
                                onChange={(e) => setReportForm({ ...reportForm, downloadButtonLabel: e.target.value })} 
                                placeholder="Download Report"
                                className="w-full text-xs p-2.5 border border-line rounded-lg bg-white focus:outline-none focus:border-brand-blue transition-colors"
                              />
                              <span className="text-[10px] text-slate-500 font-mono block">
                                E.g. Download the brief (PDF)
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Document Sections Builder */}
                      <div className="border-t border-line pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[11px] font-mono uppercase font-bold text-ink">Extended Article Content ({reportForm.sections?.length || 0} Chapters)</h4>
                          <button 
                            type="button" 
                            onClick={addReportSection}
                            className="text-[10px] font-mono font-bold bg-navy text-white px-2 py-1 rounded hover:bg-navy-dark cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Chapter
                          </button>
                        </div>

                        <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                          {reportForm.sections?.map((sec, sIdx) => (
                            <div key={sIdx} className="bg-white border border-line rounded-xl p-3 space-y-2 relative">
                              <button 
                                type="button" 
                                onClick={() => removeReportSection(sIdx)}
                                className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-[10px] font-mono"
                              >
                                Remove
                              </button>
                              <input 
                                type="text" 
                                value={sec.title} 
                                onChange={(e) => updateReportSection(sIdx, 'title', e.target.value)}
                                placeholder={`Chapter ${sIdx+1} Title`}
                                className="w-11/12 text-xs font-semibold p-1.5 border-b border-line"
                              />
                              <RichTextEditor 
                                value={sec.content || ''} 
                                onChange={(val) => updateReportSection(sIdx, 'content', val)}
                                placeholder="Enter detailed forensic paragraphs here..."
                                minHeight="120px"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-brand-purple hover:bg-purple-700 text-white font-mono font-bold text-xs uppercase tracking-wider py-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Report</span>
                      </button>
                    </form>
                  )}

                  {selectedPubType === 'weekly' && (
                    <form onSubmit={handleSaveWeekly} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">Newsletter Tag</label>
                          <input 
                            type="text" 
                            value={weeklyForm.tag} 
                            onChange={(e) => setWeeklyForm({ ...weeklyForm, tag: e.target.value })}
                            placeholder="E.g., Analysis Bulletin"
                            className="w-full text-xs p-2.5 border border-line rounded-lg bg-white focus:outline-none focus:border-brand-blue"
                          />
                        </div>
                        <CMSDateField
                          label="Publishing Date / Period"
                          value={weeklyForm.date}
                          onChange={(val, meta) => setWeeklyForm({
                            ...weeklyForm,
                            date: val,
                            ...(meta ? {
                              normalizedDate: meta.normalizedDate,
                              datePrecision: meta.datePrecision,
                              sortValue: meta.sortValue
                            } : {})
                          })}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase font-bold text-mut">Weekly Digest Title</label>
                        <input 
                          type="text" 
                          value={weeklyForm.title} 
                          onChange={(e) => setWeeklyForm({ ...weeklyForm, title: e.target.value })}
                          placeholder="E.g., The Osun Trajectory: Accreditation Auditing Metrology"
                          className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-semibold focus:outline-none focus:border-brand-blue"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">Lead Author</label>
                          <input 
                            type="text" 
                            value={weeklyForm.author} 
                            onChange={(e) => setWeeklyForm({ ...weeklyForm, author: e.target.value })}
                            placeholder="E.g. Athena Observatory"
                            className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-semibold focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">Estimated Reading Time</label>
                          <input 
                            type="text" 
                            value={weeklyForm.readingTime} 
                            onChange={(e) => setWeeklyForm({ ...weeklyForm, readingTime: e.target.value })}
                            placeholder="E.g., 4 min read"
                            className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-mono focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">Read Counter (Views)</label>
                          <input 
                            type="number" 
                            min="0"
                            value={weeklyForm.reads !== undefined ? weeklyForm.reads : 0} 
                            onChange={(e) => setWeeklyForm({ ...weeklyForm, reads: Math.max(0, parseInt(e.target.value) || 0) })}
                            placeholder="0"
                            className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-mono focus:outline-none focus:border-brand-blue"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">Download Counter</label>
                          <input 
                            type="number" 
                            min="0"
                            value={weeklyForm.downloads !== undefined ? weeklyForm.downloads : 0} 
                            onChange={(e) => setWeeklyForm({ ...weeklyForm, downloads: Math.max(0, parseInt(e.target.value) || 0) })}
                            placeholder="0"
                            className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-mono focus:outline-none focus:border-brand-blue"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase font-bold text-mut">Teaser Summary / Synopsis</label>
                        <textarea 
                          value={weeklyForm.summary} 
                          onChange={(e) => setWeeklyForm({ ...weeklyForm, summary: e.target.value })}
                          placeholder="E.g., A comprehensive breakdown of pre-election ad-hoc team layouts and operational protocols..."
                          className="w-full text-xs p-2.5 border border-line rounded-lg bg-white h-20 resize-none focus:outline-none focus:border-brand-blue"
                        />
                      </div>

                      <FileUploadField 
                        label="Newsletter Thumbnail Image" 
                        accept="image/*" 
                        value={weeklyForm.image} 
                        onChange={(val) => setWeeklyForm({ ...weeklyForm, image: val })} 
                      />

                      <FileUploadField 
                        label="Newsletter PDF Document (Downloadable)" 
                        accept="application/pdf" 
                        value={weeklyForm.pdfUrl} 
                        onChange={(val) => setWeeklyForm({ ...weeklyForm, pdfUrl: val })} 
                      />

                      {/* Download Section Customization Controls */}
                      {(!!weeklyForm.pdfUrl || !!weeklyForm.downloadSectionTitle || !!weeklyForm.downloadButtonLabel) && (
                        <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 space-y-3">
                          <div className="flex items-center gap-1.5 text-blue-900 font-mono text-[11px] font-bold uppercase tracking-wider">
                            <Download className="w-3.5 h-3.5 text-brand-blue" />
                            <span>Download Component Labels (Optional)</span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                            Customise the section title and action button text displayed on the publication page. Leave empty to use the standard defaults (&ldquo;Download Official Statement&rdquo; and &ldquo;Download Report&rdquo;).
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="block text-[10px] font-mono uppercase font-bold text-slate-700">
                                Download Section Title
                              </label>
                              <input 
                                type="text" 
                                value={weeklyForm.downloadSectionTitle || ''} 
                                onChange={(e) => setWeeklyForm({ ...weeklyForm, downloadSectionTitle: e.target.value })} 
                                placeholder="Download Official Statement"
                                className="w-full text-xs p-2.5 border border-line rounded-lg bg-white focus:outline-none focus:border-brand-blue transition-colors"
                              />
                              <span className="text-[10px] text-slate-500 font-mono block">
                                E.g. Download the Full Brief
                              </span>
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] font-mono uppercase font-bold text-slate-700">
                                Download Button Label
                              </label>
                              <input 
                                type="text" 
                                value={weeklyForm.downloadButtonLabel || ''} 
                                onChange={(e) => setWeeklyForm({ ...weeklyForm, downloadButtonLabel: e.target.value })} 
                                placeholder="Download Report"
                                className="w-full text-xs p-2.5 border border-line rounded-lg bg-white focus:outline-none focus:border-brand-blue transition-colors"
                              />
                              <span className="text-[10px] text-slate-500 font-mono block">
                                E.g. Download the brief (PDF)
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Weekly Sections Builder */}
                      <div className="border-t border-line pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[11px] font-mono uppercase font-bold text-ink">Newsletter Article Sections ({weeklyForm.sections?.length || 0} Blocks)</h4>
                          <button 
                            type="button" 
                            onClick={addWeeklySection}
                            className="text-[10px] font-mono font-bold bg-navy text-white px-2 py-1 rounded hover:bg-navy-dark cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Block
                          </button>
                        </div>

                        <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                          {weeklyForm.sections?.map((sec, sIdx) => (
                            <div key={sIdx} className="bg-white border border-line rounded-xl p-3 space-y-2 relative">
                              <button 
                                type="button" 
                                onClick={() => removeWeeklySection(sIdx)}
                                className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-[10px] font-mono"
                              >
                                Remove
                              </button>
                              <input 
                                type="text" 
                                value={sec.title} 
                                onChange={(e) => updateWeeklySection(sIdx, 'title', e.target.value)}
                                placeholder={`Section ${sIdx+1} Title`}
                                className="w-11/12 text-xs font-semibold p-1.5 border-b border-line"
                              />
                              <RichTextEditor 
                                value={sec.text || ''} 
                                onChange={(val) => updateWeeklySection(sIdx, 'text', val)}
                                placeholder="Enter section article text body paragraphs here..."
                                minHeight="120px"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-brand-purple hover:bg-purple-700 text-white font-mono font-bold text-xs uppercase tracking-wider py-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Weekly Issue</span>
                      </button>
                    </form>
                  )}

                  {selectedPubType === 'announcement' && (
                    <form onSubmit={handleSaveAnnouncement} className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">Month string</label>
                          <input 
                            type="text" 
                            value={announcementForm.month} 
                            onChange={(e) => setAnnouncementForm({ ...announcementForm, month: e.target.value })}
                            placeholder="E.g., JUL"
                            className="w-full text-xs p-2.5 border border-line rounded-lg bg-white uppercase font-mono focus:outline-none focus:border-brand-blue"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">Day string</label>
                          <input 
                            type="text" 
                            value={announcementForm.day} 
                            onChange={(e) => setAnnouncementForm({ ...announcementForm, day: e.target.value })}
                            placeholder="E.g., 15"
                            className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-mono focus:outline-none focus:border-brand-blue"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">Category</label>
                          <select
                            value={announcementForm.category}
                            onChange={(e) => setAnnouncementForm({ ...announcementForm, category: e.target.value as any })}
                            className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-mono focus:outline-none"
                          >
                            <option value="press">Press Release</option>
                            <option value="bulletin">Official Bulletin</option>
                            <option value="statement">Public Statement</option>
                            <option value="alert">Security/Audit Alert</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <CMSDateField
                          label="Publishing Date / Period"
                          value={announcementForm.date}
                          onChange={(val, meta) => setAnnouncementForm({
                            ...announcementForm,
                            date: val,
                            ...(meta ? {
                              normalizedDate: meta.normalizedDate,
                              datePrecision: meta.datePrecision,
                              sortValue: meta.sortValue
                            } : {})
                          })}
                        />
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">Estimated Reading Time</label>
                          <input 
                            type="text" 
                            value={announcementForm.readingTime || ''} 
                            onChange={(e) => setAnnouncementForm({ ...announcementForm, readingTime: e.target.value })}
                            placeholder="E.g., 4 min read"
                            className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-mono focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">Read Counter (Views)</label>
                          <input 
                            type="number" 
                            min="0"
                            value={announcementForm.reads !== undefined ? announcementForm.reads : 0} 
                            onChange={(e) => setAnnouncementForm({ ...announcementForm, reads: Math.max(0, parseInt(e.target.value) || 0) })}
                            placeholder="0"
                            className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-mono focus:outline-none focus:border-brand-blue"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">Download Counter</label>
                          <input 
                            type="number" 
                            min="0"
                            value={announcementForm.downloads !== undefined ? announcementForm.downloads : 0} 
                            onChange={(e) => setAnnouncementForm({ ...announcementForm, downloads: Math.max(0, parseInt(e.target.value) || 0) })}
                            placeholder="0"
                            className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-mono focus:outline-none focus:border-brand-blue"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase font-bold text-mut">Announcement Title</label>
                        <input 
                          type="text" 
                          value={announcementForm.title} 
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                          placeholder="E.g., Official Statement on Osun Result Portal Upload Integrity"
                          className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-semibold focus:outline-none focus:border-brand-blue"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase font-bold text-mut">Summary / Teaser</label>
                        <textarea 
                          value={announcementForm.summary} 
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, summary: e.target.value })}
                          placeholder="E.g., AEO outlines the 4 critical protocols needed to guarantee live transmission audits."
                          className="w-full text-xs p-2.5 border border-line rounded-lg bg-white h-20 resize-none focus:outline-none focus:border-brand-blue"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">Author Name</label>
                          <input 
                            type="text" 
                            value={announcementForm.author || ''} 
                            onChange={(e) => setAnnouncementForm({ ...announcementForm, author: e.target.value })}
                            placeholder="E.g., Athena Secretariat"
                            className="w-full text-xs p-2.5 border border-line rounded-lg bg-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">Full Authors List</label>
                          <input 
                            type="text" 
                            value={announcementForm.authorsList || ''} 
                            onChange={(e) => setAnnouncementForm({ ...announcementForm, authorsList: e.target.value })}
                            placeholder="E.g., Athena Secretariat"
                            className="w-full text-xs p-2.5 border border-line rounded-lg bg-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <FileUploadField 
                        label="Announcement Header Image" 
                        accept="image/*" 
                        value={announcementForm.image} 
                        onChange={(val) => setAnnouncementForm({ ...announcementForm, image: val })} 
                      />

                      <FileUploadField 
                        label="Announcement PDF Document (Downloadable)" 
                        accept="application/pdf" 
                        value={announcementForm.pdfUrl} 
                        onChange={(val) => setAnnouncementForm({ ...announcementForm, pdfUrl: val })} 
                      />

                      {/* Download Section Customization Controls */}
                      {(!!announcementForm.pdfUrl || !!announcementForm.downloadSectionTitle || !!announcementForm.downloadButtonLabel) && (
                        <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 space-y-3">
                          <div className="flex items-center gap-1.5 text-blue-900 font-mono text-[11px] font-bold uppercase tracking-wider">
                            <Download className="w-3.5 h-3.5 text-brand-blue" />
                            <span>Download Component Labels (Optional)</span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                            Customise the section title and action button text displayed on the publication page. Leave empty to use the standard defaults (&ldquo;Download Official Statement&rdquo; and &ldquo;Download Report&rdquo;).
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="block text-[10px] font-mono uppercase font-bold text-slate-700">
                                Download Section Title
                              </label>
                              <input 
                                type="text" 
                                value={announcementForm.downloadSectionTitle || ''} 
                                onChange={(e) => setAnnouncementForm({ ...announcementForm, downloadSectionTitle: e.target.value })} 
                                placeholder="Download Official Statement"
                                className="w-full text-xs p-2.5 border border-line rounded-lg bg-white focus:outline-none focus:border-brand-blue transition-colors"
                              />
                              <span className="text-[10px] text-slate-500 font-mono block">
                                E.g. Download Official Statement
                              </span>
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] font-mono uppercase font-bold text-slate-700">
                                Download Button Label
                              </label>
                              <input 
                                type="text" 
                                value={announcementForm.downloadButtonLabel || ''} 
                                onChange={(e) => setAnnouncementForm({ ...announcementForm, downloadButtonLabel: e.target.value })} 
                                placeholder="Download Report"
                                className="w-full text-xs p-2.5 border border-line rounded-lg bg-white focus:outline-none focus:border-brand-blue transition-colors"
                              />
                              <span className="text-[10px] text-slate-500 font-mono block">
                                E.g. Download Statement (PDF)
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase font-bold text-mut">Full Content (Rich Text / Formatted Document)</label>
                        <RichTextEditor 
                          value={announcementForm.content || ''} 
                          onChange={(val) => setAnnouncementForm({ ...announcementForm, content: val })}
                          placeholder="E.g., Full detailed text of the announcement or statement."
                          minHeight="160px"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-brand-purple hover:bg-purple-700 text-white font-mono font-bold text-xs uppercase tracking-wider py-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Announcement</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Unified Publications Catalog Directory */}
              <div className="lg:col-span-5 space-y-3">
                <h3 className="font-display font-bold text-xs text-mut uppercase tracking-wider">Publications Catalog</h3>
                
                {/* Interactive filter toggle bar */}
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0 overflow-x-auto">
                  {(['all', 'report', 'assessment', 'brief', 'dcm', 'africa-election-watch', 'weekly', 'announcement'] as const).map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setPubFilter(f)}
                      className={`flex-1 text-center py-1.5 px-1.5 rounded-md text-[9px] font-bold font-mono uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                        pubFilter === f
                          ? 'bg-white text-navy shadow-xs border border-slate-200/50'
                          : 'text-mut hover:text-ink'
                      }`}
                    >
                      {f === 'all' ? 'All' : f === 'report' ? 'Audits' : f === 'assessment' ? 'Political Landscape' : f === 'brief' ? 'Briefs' : f === 'dcm' ? 'DCM' : f === 'africa-election-watch' ? 'Africa Watch' : f === 'weekly' ? 'Weekly' : 'Announcements'}
                    </button>
                  ))}
                </div>

                {/* Combined list of publications filtered */}
                <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                  {(() => {
                    const allCombined = [
                      ...reports.map(r => {
                        let unifiedType: 'report' | 'assessment' | 'brief' | 'dcm' | 'africa-election-watch' = 'report';
                        let tagColor = 'text-brand-purple bg-purple-50 border-purple-100';
                        if (r.tagType === 'tech') {
                          unifiedType = 'assessment';
                          tagColor = 'text-amber-600 bg-amber-50 border-amber-100';
                        } else if (r.tagType === 'brief') {
                          unifiedType = 'brief';
                          tagColor = 'text-brand-blue bg-blue-50 border-blue-100';
                        } else if (r.tagType === 'dcm') {
                          unifiedType = 'dcm';
                          tagColor = 'text-brand-blue bg-blue-50 border-blue-100';
                        } else if (r.tagType === 'africa-election-watch') {
                          unifiedType = 'africa-election-watch';
                          tagColor = 'text-teal-700 bg-teal-50 border-teal-200';
                        }
                        return {
                          ...r,
                          unifiedType,
                          tagColor
                        };
                      }),
                      ...weekly.map(w => ({ ...w, unifiedType: 'weekly' as const, tagColor: 'text-brand-blue bg-blue-50 border-blue-100' })),
                      ...announcements.map(a => ({ ...a, unifiedType: 'announcement' as const, tagColor: 'text-emerald-600 bg-emerald-50 border-emerald-100' }))
                    ];
                    const sortedCombined = sortItemsByDate(allCombined, 'date', 'desc');
                    const filtered = sortedCombined.filter(item => pubFilter === 'all' || item.unifiedType === pubFilter);

                    if (filtered.length === 0) {
                      return (
                        <div className="p-8 border border-dashed border-line rounded-xl text-center">
                          <p className="text-xs text-mut font-mono">No publications found.</p>
                        </div>
                      );
                    }

                    return filtered.map(item => (
                      <div key={`${item.unifiedType}-${item.id}`} className="bg-paper border border-line rounded-xl p-3.5 flex items-start justify-between gap-3 shadow-xs hover:border-slate-300 transition-colors">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded border ${item.tagColor}`}>
                              {item.unifiedType === 'report' || item.unifiedType === 'assessment' || item.unifiedType === 'brief' || item.unifiedType === 'dcm' || item.unifiedType === 'africa-election-watch' ? (item as any).tag || 'Report' : item.unifiedType === 'weekly' ? 'Weekly Digest' : `Announcement (${(item as any).category})`}
                            </span>
                            {item.pdfUrl && (
                              <span className="text-[9px] font-mono font-bold text-brand-green bg-green-50 border border-green-100 px-1.5 py-0.5 rounded">
                                PDF Attached
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-xs text-ink leading-snug truncate">{item.title}</h4>
                          <span className="text-[10px] text-mut font-mono flex items-center gap-2 flex-wrap">
                            <span>{item.date} {item.readingTime ? `· ${item.readingTime}` : ''} · {item.unifiedType === 'report' || item.unifiedType === 'assessment' || item.unifiedType === 'brief' || item.unifiedType === 'dcm' || item.unifiedType === 'africa-election-watch' ? (item as any).size || '1.0 MB' : item.unifiedType === 'weekly' ? (item as any).readingTime || '5 min read' : (item as any).author || 'AEO'}</span>
                            <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                              <span title="Reads">👁️ {item.reads || 0} reads</span>
                              <span>·</span>
                              <span title="Downloads">📥 {item.downloads || 0} downloads</span>
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setEditingId(item.id);
                              setSelectedPubType(item.unifiedType);
                              if (item.unifiedType === 'report' || item.unifiedType === 'assessment' || item.unifiedType === 'brief' || item.unifiedType === 'dcm' || item.unifiedType === 'africa-election-watch') {
                                setReportForm(item);
                              } else if (item.unifiedType === 'weekly') {
                                const weeklyItem = { ...item };
                                if (!weeklyItem.sections || weeklyItem.sections.length === 0) {
                                  if (weeklyItem.id === 'wk-1') {
                                    weeklyItem.sections = [
                                      {
                                        title: "1. The Forensic Evidence from Ekiti uploads",
                                        text: "With the concluding declarations in Ekiti, our data forensics team isolated three significant takeaways from the IReV uploads: first, the speed of form submission increased by 14% compared to the previous cycle; second, over 94% of submitted forms were fully legible; third, a critical lag in collation validation was recorded in 2 central LGAs. Here is what we must demand from ad-hoc training before Osun."
                                      },
                                      {
                                        title: "2. The Accreditation-to-Transmission Chain",
                                        text: "Our monitoring of the 2,445 polling units in Ekiti State shows that the BVAS authentication system achieved 98.2% accuracy. However, in the transmission of the primary EC8A result sheets, there were noticeable latency issues. In several remote units, observers reported that the network signals were insufficient, leading to physical transit of the device before successful uploading."
                                      },
                                      {
                                        title: "3. Recommendations to INEC and Civil Society",
                                        text: "To bridge these transparency loopholes before the critical Osun off-cycle election in August 2026, we outline three priority administrative recommendations: Firstly, optimize the IReV portal server capacity to prevent high-traffic timeout buffers. Secondly, ensure standard battery backup packs are deployed to all 3,763 Osun polling units. Lastly, enforce strict public posting of the physical EC8A sheet immediately after counts are reconciled."
                                      }
                                    ];
                                  } else if (weeklyItem.id === 'wk-2') {
                                    weeklyItem.sections = [
                                      {
                                        title: "1. The Structural Deficit of Internal Party Systems",
                                        text: "Without programmatic party definitions and stable funding metrics, democratic structures struggle to hold collation processes accountable. This analytical commentary dissects the legal framework of political party internal democracy and suggests structural reforms to protect general electoral integrity."
                                      },
                                      {
                                        title: "2. Pre-election Litigation as an Administrative Burden",
                                        text: "The sheer volume of court challenges preceding general contestations threatens to paralyze electoral preparations. Administrative timelines are consistently interrupted by sudden judicial mandates, which redirect logistics staff and confuse registered voters regarding valid candidate slots. There is an urgent need to expedite these judicial reviews."
                                      },
                                      {
                                        title: "3. Reclaiming Public Spaces for Fair Contest",
                                        text: "A healthy democracy thrives on competitive balance. When opposition parties face systemic barriers in reserving civic venues, distributing flyers, or obtaining local media visibility, the integrity of the vote is already compromised before the first ballot is cast. Regulatory bodies must protect parity in access to the public square."
                                      }
                                    ];
                                  } else if (weeklyItem.id === 'wk-3') {
                                    weeklyItem.sections = [
                                      {
                                        title: "Official Press Bulletin: Urging Procedural Integrity",
                                        text: "Abuja, Nigeria. The Athena Election Observatory issues a formal statement addressing the delays in polling-unit data synchronization. We urge the Independent National Electoral Commission (INEC) to address server latency concerns to maintain public confidence before the Osun off-cycle election."
                                      },
                                      {
                                        title: "Establishing Technical Contingencies",
                                        text: "Delays in publishing results on public-facing viewing portals are the primary breeding ground for electoral conspiracy theories. To safeguard institutional trust, INEC must provide clear, live status updates on technical hurdles. General silence is almost always interpreted as active interference."
                                      },
                                      {
                                        title: "Formal Call to Action",
                                        text: "We call upon all democratic stakeholders—including regional monitors, international delegations, and political parties—to demand a transparent technical simulation of the result management pipeline at least 14 days before the Osun state polls. This rehearsal must be publicly verifiable."
                                      }
                                    ];
                                  }
                                }
                                setWeeklyForm(weeklyItem);
                              } else if (item.unifiedType === 'announcement') {
                                setAnnouncementForm(item);
                              }
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            title="Edit Publication"
                            className="p-1 hover:bg-line rounded text-ink2 hover:text-brand-purple cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              triggerConfirm(`Delete publication "${item.title}"?`, () => {
                                if (item.unifiedType === 'report' || item.unifiedType === 'assessment' || item.unifiedType === 'brief' || item.unifiedType === 'dcm') {
                                  deleteReport(item.id);
                                } else if (item.unifiedType === 'weekly') {
                                  deleteWeeklyIssue(item.id);
                                } else if (item.unifiedType === 'announcement') {
                                  deleteAnnouncement(item.id);
                                }
                                if (editingId === item.id) {
                                  setEditingId(null);
                                  setReportForm(EMPTY_REPORT_FORM);
                                  setWeeklyForm(EMPTY_WEEKLY_FORM);
                                  setAnnouncementForm(EMPTY_ANNOUNCEMENT_FORM);
                                }
                                showStatus(`Publication deleted.`);
                              });
                            }}
                            title="Delete Publication"
                            className="p-1 hover:bg-line rounded text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

            </div>
          )}

          {/* ELECTORAL TIMELINES / DIARY OF ELECTION TAB */}
          {activeTab === 'diary' && (
            <div className="space-y-6">
              {/* Header Banner & Sub-Mode Switcher */}
              <div className="bg-paper border border-line rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-brand-purple shrink-0" />
                      <h3 className="text-base font-bold font-display text-ink uppercase tracking-wider">Diary of Election CMS & Spreadsheet Engine</h3>
                    </div>
                    <p className="text-xs text-mut mt-1">Manage comprehensive electoral timelines, candidate lists, incumbent details, voter stats, and bulk-import election calendars via spreadsheet.</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setDiarySubMode('form')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5 ${
                        diarySubMode === 'form' 
                          ? 'bg-brand-purple text-white shadow-sm' 
                          : 'bg-white border border-line text-mut hover:text-ink'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Form Editor</span>
                    </button>
                    <button
                      onClick={() => setDiarySubMode('spreadsheet')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5 ${
                        diarySubMode === 'spreadsheet' 
                          ? 'bg-brand-purple text-white shadow-sm' 
                          : 'bg-white border border-line text-mut hover:text-ink'
                      }`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Spreadsheet Import</span>
                    </button>
                    <button
                      onClick={downloadDiaryCSVTemplate}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                      title="Download CSV Spreadsheet Template"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>CSV Template</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* SPREADSHEET BULK IMPORTER MODE */}
              {diarySubMode === 'spreadsheet' && (
                <div className="bg-paper border border-line rounded-2xl p-6 space-y-6">
                  <div className="space-y-2">
                    <h4 className="font-display font-bold text-sm text-ink uppercase tracking-wider flex items-center gap-2">
                      <UploadCloud className="w-4 h-4 text-brand-purple" />
                      <span>Bulk Upload Election Diary Data</span>
                    </h4>
                    <p className="text-xs text-mut leading-relaxed">
                      Copy and paste rows directly from <strong>Microsoft Excel</strong>, <strong>Google Sheets</strong>, or a <strong>CSV/TSV file</strong>. The system will automatically map headers like <code>Title, Date, Subtitle, Status, Category, Country, Location, Electoral Body, Registered Voters, Polling Units, LGAs, Description, Key Issues</code>.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-mono font-bold uppercase text-ink">Paste Spreadsheet Rows or Upload File:</label>
                    <textarea
                      rows={6}
                      value={diarySpreadsheetText}
                      onChange={(e) => setDiarySpreadsheetText(e.target.value)}
                      placeholder={`Title\tDate\tSubtitle\tStatus\tCategory\tCountry\tLocation\tElectoral Body\tRegistered Voters\tPolling Units\nOsun Governorship\t15 Aug 2026\t30 LGAs\tScheduled\tnational\tNigeria\tOsun State\tINEC\t2,339,233\t3,763`}
                      className="w-full text-xs p-3 font-mono border border-line rounded-xl bg-white text-ink focus:outline-none focus:ring-1 focus:ring-brand-purple"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <label className="px-3 py-2 bg-white hover:bg-slate-50 border border-line rounded-lg text-xs font-mono font-semibold text-ink cursor-pointer flex items-center gap-1.5 shadow-sm">
                          <UploadCloud className="w-4 h-4 text-brand-purple" />
                          <span>Choose CSV / TSV File</span>
                          <input
                            type="file"
                            accept=".csv,.tsv,.txt"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (evt) => {
                                  const text = evt.target?.result as string;
                                  if (text) {
                                    setDiarySpreadsheetText(text);
                                    showStatus(`Loaded ${file.name}`);
                                  }
                                };
                                reader.readAsText(file);
                              }
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setDiarySpreadsheetText('');
                            setDiarySpreadsheetParsed(null);
                          }}
                          className="px-3 py-2 text-xs font-mono text-mut hover:text-rose-600 transition-colors"
                        >
                          Clear Text
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleProcessDiarySpreadsheet}
                        className="px-5 py-2.5 bg-brand-purple hover:bg-purple-700 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
                      >
                        <Table className="w-4 h-4" />
                        <span>Parse & Preview Grid</span>
                      </button>
                    </div>
                  </div>

                  {/* PARSED GRID PREVIEW */}
                  {diarySpreadsheetParsed && (
                    <div className="space-y-4 pt-4 border-t border-line">
                      <div className="flex items-center justify-between">
                        <h5 className="font-display font-bold text-xs text-ink uppercase tracking-wider flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Parsed Preview ({diarySpreadsheetParsed.rows.length} Records)</span>
                        </h5>
                        <button
                          onClick={handleImportDiarySpreadsheetToDB}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
                        >
                          <Save className="w-4 h-4" />
                          <span>Import All Rows into Diary Database</span>
                        </button>
                      </div>

                      <div className="overflow-x-auto border border-line rounded-xl bg-white max-h-80 overflow-y-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-paper border-b border-line text-[10px] font-mono font-bold text-mut uppercase">
                              <th className="p-3">#</th>
                              {diarySpreadsheetParsed.headers.map((h, i) => (
                                <th key={i} className="p-3 font-bold text-ink whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line font-sans">
                            {diarySpreadsheetParsed.rows.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-slate-50">
                                <td className="p-3 font-mono text-[10px] text-mut">{rIdx + 1}</td>
                                {diarySpreadsheetParsed.headers.map((h, cIdx) => (
                                  <td key={cIdx} className="p-3 text-ink max-w-xs truncate font-mono text-[11px]">
                                    {row[h] || '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* FORM EDITOR MODE */}
              {diarySubMode === 'form' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Timeline Detailed Form */}
                  <div className="lg:col-span-7 bg-paper border border-line rounded-2xl p-5 space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-line">
                      <h3 className="font-display font-bold text-sm text-ink uppercase tracking-wider flex items-center gap-1.5">
                        <Plus className="w-4.5 h-4.5 text-brand-purple" />
                        <span>{editingId ? 'Edit Electoral Diary Entry' : 'Add Electoral Diary Entry'}</span>
                      </h3>
                      {editingId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setDiaryForm(EMPTY_DIARY_FORM);
                          }}
                          className="text-xs font-mono text-rose-600 hover:underline cursor-pointer"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>

                    <form onSubmit={handleSaveDiary} className="space-y-4">
                      {/* Row 1: Category & Status & Election Type */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">Database Category *</label>
                          <select 
                            value={diaryCategory} 
                            onChange={(e) => setDiaryCategory(e.target.value as any)}
                            className="w-full text-xs p-2.5 border border-line rounded-lg bg-white text-ink font-semibold"
                          >
                            <option value="national">Nigeria — National</option>
                            <option value="local">Local Government councils</option>
                            <option value="africa">Africa Referrals</option>
                            <option value="other">Other Global Countries</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">Timeline Status *</label>
                          <select 
                            value={diaryForm.status || 'In view'} 
                            onChange={(e) => setDiaryForm({ ...diaryForm, status: e.target.value as any })}
                            className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-mono font-semibold"
                          >
                            <option value="In view">In view</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="Provisional">Provisional</option>
                            <option value="Tracking">Tracking</option>
                            <option value="Concluded">Concluded</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">Poll Classification</label>
                          <select 
                            value={diaryForm.type || 'governorship'} 
                            onChange={(e) => setDiaryForm({ ...diaryForm, type: e.target.value as any })}
                            className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-mono"
                          >
                            <option value="presidential">Presidential / General</option>
                            <option value="governorship">Governorship / State</option>
                            <option value="local_government">Local Government Council</option>
                            <option value="other">Other Poll</option>
                          </select>
                        </div>
                      </div>

                      {/* Row 2: Title & Subtitle */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase font-bold text-mut">Electoral Event Title *</label>
                        <input 
                          type="text" 
                          value={diaryForm.title || ''} 
                          onChange={(e) => setDiaryForm({ ...diaryForm, title: e.target.value })}
                          placeholder="E.g., Osun State Governorship Election 2026"
                          className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-bold text-ink"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <CMSDateField
                          label="Election Date / Period *"
                          value={diaryForm.date || ''}
                          required
                          onChange={(val, meta) => setDiaryForm({
                            ...diaryForm,
                            date: val,
                            ...(meta ? {
                              normalizedDate: meta.normalizedDate,
                              datePrecision: meta.datePrecision,
                              sortValue: meta.sortValue
                            } : {})
                          })}
                        />
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">Poll Subtitle / Context</label>
                          <input 
                            type="text" 
                            value={diaryForm.subtitle || ''} 
                            onChange={(e) => setDiaryForm({ ...diaryForm, subtitle: e.target.value })}
                            placeholder="E.g., 30 LGAs + Area Office"
                            className="w-full text-xs p-2.5 border border-line rounded-lg bg-white"
                          />
                        </div>
                      </div>

                      {/* Row 3: Country, Location, Electoral Body & State Code */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-line">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">Country</label>
                          <input 
                            type="text" 
                            value={diaryForm.country || ''} 
                            onChange={(e) => setDiaryForm({ ...diaryForm, country: e.target.value })}
                            placeholder="Nigeria"
                            className="w-full text-xs p-2 border border-line rounded-lg bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">Location / State</label>
                          <input 
                            type="text" 
                            value={diaryForm.location || ''} 
                            onChange={(e) => setDiaryForm({ ...diaryForm, location: e.target.value })}
                            placeholder="Osun State"
                            className="w-full text-xs p-2 border border-line rounded-lg bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">Electoral Body</label>
                          <input 
                            type="text" 
                            value={diaryForm.electoralBody || ''} 
                            onChange={(e) => setDiaryForm({ ...diaryForm, electoralBody: e.target.value })}
                            placeholder="INEC"
                            className="w-full text-xs p-2 border border-line rounded-lg bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">State Code</label>
                          <input 
                            type="text" 
                            value={diaryForm.stateCode || ''} 
                            onChange={(e) => setDiaryForm({ ...diaryForm, stateCode: e.target.value.toUpperCase() })}
                            placeholder="OS"
                            className="w-full text-xs p-2 border border-line rounded-lg bg-white font-mono uppercase"
                          />
                        </div>
                      </div>

                      {/* Row 4: Voter Stats & Logistics */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">Registered Voters</label>
                          <input 
                            type="text" 
                            value={diaryForm.registeredVoters || ''} 
                            onChange={(e) => setDiaryForm({ ...diaryForm, registeredVoters: e.target.value })}
                            placeholder="2,339,233"
                            className="w-full text-xs p-2 border border-line rounded-lg bg-white font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">Polling Units</label>
                          <input 
                            type="text" 
                            value={diaryForm.pollingUnits || ''} 
                            onChange={(e) => setDiaryForm({ ...diaryForm, pollingUnits: e.target.value })}
                            placeholder="3,763"
                            className="w-full text-xs p-2 border border-line rounded-lg bg-white font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase font-bold text-mut">LGAs Count</label>
                          <input 
                            type="text" 
                            value={diaryForm.lgasCount || ''} 
                            onChange={(e) => setDiaryForm({ ...diaryForm, lgasCount: e.target.value })}
                            placeholder="30"
                            className="w-full text-xs p-2 border border-line rounded-lg bg-white font-mono"
                          />
                        </div>
                      </div>

                      {/* Sitting Executive Section */}
                      <div className="p-3.5 bg-slate-50 border border-line rounded-xl space-y-2">
                        <span className="block text-[10px] font-mono uppercase font-bold text-brand-purple">Sitting Executive / Incumbent Details</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="Executive Name (e.g. Ademola Adeleke)"
                            value={diaryForm.sittingExecutive?.name || ''}
                            onChange={(e) => setDiaryForm({
                              ...diaryForm,
                              sittingExecutive: { ...diaryForm.sittingExecutive, name: e.target.value, title: diaryForm.sittingExecutive?.title || 'Governor', party: diaryForm.sittingExecutive?.party || 'PDP' }
                            })}
                            className="text-xs p-2 border border-line rounded-lg bg-white"
                          />
                          <input
                            type="text"
                            placeholder="Official Title (e.g. Governor)"
                            value={diaryForm.sittingExecutive?.title || ''}
                            onChange={(e) => setDiaryForm({
                              ...diaryForm,
                              sittingExecutive: { ...diaryForm.sittingExecutive, title: e.target.value, name: diaryForm.sittingExecutive?.name || '', party: diaryForm.sittingExecutive?.party || 'PDP' }
                            })}
                            className="text-xs p-2 border border-line rounded-lg bg-white"
                          />
                          <input
                            type="text"
                            placeholder="Party (e.g. PDP)"
                            value={diaryForm.sittingExecutive?.party || ''}
                            onChange={(e) => setDiaryForm({
                              ...diaryForm,
                              sittingExecutive: { ...diaryForm.sittingExecutive, party: e.target.value.toUpperCase(), name: diaryForm.sittingExecutive?.name || '', title: diaryForm.sittingExecutive?.title || 'Governor' }
                            })}
                            className="text-xs p-2 border border-line rounded-lg bg-white font-mono uppercase"
                          />
                        </div>
                      </div>

                      {/* Key Issues */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase font-bold text-mut">Key Electoral Issues (Semicolon separated)</label>
                        <input
                          type="text"
                          value={Array.isArray(diaryForm.keyIssues) ? diaryForm.keyIssues.join('; ') : ''}
                          onChange={(e) => setDiaryForm({
                            ...diaryForm,
                            keyIssues: e.target.value.split(/;|\|/).map(s => s.trim()).filter(Boolean)
                          })}
                          placeholder="BVAS Machine Calibration; IReV Server Latency; Security Neutrality"
                          className="w-full text-xs p-2.5 border border-line rounded-lg bg-white"
                        />
                      </div>

                      {/* Participating Candidates Editor */}
                      <div className="space-y-2 pt-2 border-t border-line">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase font-bold text-ink">Participating Candidates & Parties</span>
                          <button
                            type="button"
                            onClick={handleAddCandidateToDiary}
                            className="text-[10px] font-mono font-bold text-brand-purple hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Add Candidate</span>
                          </button>
                        </div>

                        {diaryForm.participants && diaryForm.participants.length > 0 ? (
                          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                            {diaryForm.participants.map((p, pIdx) => (
                              <div key={pIdx} className="p-2 bg-white border border-line rounded-lg grid grid-cols-12 gap-2 items-center">
                                <input
                                  type="text"
                                  placeholder="Candidate Name"
                                  value={p.name}
                                  onChange={(e) => handleCandidateChange(pIdx, 'name', e.target.value)}
                                  className="col-span-4 text-xs p-1.5 border border-line rounded"
                                />
                                <input
                                  type="text"
                                  placeholder="Party (e.g. APC)"
                                  value={p.party}
                                  onChange={(e) => handleCandidateChange(pIdx, 'party', e.target.value.toUpperCase())}
                                  className="col-span-3 text-xs p-1.5 border border-line rounded font-mono uppercase"
                                />
                                <input
                                  type="text"
                                  placeholder="Role / Office"
                                  value={p.role || ''}
                                  onChange={(e) => handleCandidateChange(pIdx, 'role', e.target.value)}
                                  className="col-span-4 text-xs p-1.5 border border-line rounded"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCandidateFromDiary(pIdx)}
                                  className="col-span-1 text-red-500 hover:text-red-700 flex justify-center cursor-pointer"
                                  title="Remove Candidate"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-2.5 bg-slate-50 border border-dashed border-line rounded-lg text-center text-[11px] text-mut">
                            No candidates added yet. Click "+ Add Candidate" above to list key contenders.
                          </div>
                        )}
                      </div>

                      {/* Detailed Description */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase font-bold text-mut">Election Description & Observation Scope</label>
                        <textarea 
                          rows={3} 
                          value={diaryForm.description || ''} 
                          onChange={(e) => setDiaryForm({ ...diaryForm, description: e.target.value })}
                          placeholder="Provide detailed analytical summary for this election..."
                          className="w-full text-xs p-2.5 border border-line rounded-lg bg-white"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-brand-purple hover:bg-purple-700 text-white font-mono font-bold text-xs uppercase tracking-wider py-3 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                      >
                        <Save className="w-4 h-4" />
                        <span>{editingId ? 'Update Diary Record' : 'Save Diary Record to Database'}</span>
                      </button>
                    </form>
                  </div>

                  {/* Timeline Catalog Lists with Search */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="bg-paper border border-line rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display font-bold text-xs text-ink uppercase tracking-wider">Diary Database Catalog</h3>
                        <span className="text-[10px] font-mono font-bold text-brand-purple bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                          {(diaryCategory === 'national' ? diaryNat : diaryCategory === 'local' ? diaryLoc : diaryCategory === 'africa' ? diaryAfr : diaryOth).length} Items
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <select 
                          value={diaryCategory} 
                          onChange={(e) => setDiaryCategory(e.target.value as any)}
                          className="text-xs p-2 bg-white border border-line rounded-lg font-semibold text-ink"
                        >
                          <option value="national">Nigeria — National</option>
                          <option value="local">Local Government</option>
                          <option value="africa">Africa Referrals</option>
                          <option value="other">Other Countries</option>
                        </select>

                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-mut absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            value={diarySearchQuery}
                            onChange={(e) => setDiarySearchQuery(e.target.value)}
                            placeholder="Filter timeline..."
                            className="w-full pl-8 pr-2 py-1.5 text-xs bg-white border border-line rounded-lg text-ink"
                          />
                        </div>
                      </div>

                      <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1 pt-1">
                        {sortItemsByDate<DiaryItem>((diaryCategory === 'national' ? diaryNat : 
                           diaryCategory === 'local' ? diaryLoc :
                           diaryCategory === 'africa' ? diaryAfr : diaryOth), 'date', 'asc')
                          .filter(d => !diarySearchQuery || d.title.toLowerCase().includes(diarySearchQuery.toLowerCase()) || (d.country || '').toLowerCase().includes(diarySearchQuery.toLowerCase()) || d.date.toLowerCase().includes(diarySearchQuery.toLowerCase()))
                          .map(d => (
                            <div key={d.id} className="bg-white border border-line rounded-xl p-3.5 space-y-2 hover:shadow-sm transition-all">
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-mono font-bold text-brand-blue bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{d.date}</span>
                                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                      d.status === 'Concluded' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                      d.status === 'Scheduled' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                      'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                      {d.status}
                                    </span>
                                    {d.country && <span className="text-[9px] font-mono text-mut uppercase">· {d.country}</span>}
                                  </div>
                                  <h4 className="font-semibold text-xs text-ink leading-snug">{d.title}</h4>
                                  <p className="text-[10px] text-mut truncate">{d.subtitle}</p>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => {
                                      setEditingId(d.id);
                                      setDiaryForm(d);
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="p-1 hover:bg-purple-50 rounded text-ink2 hover:text-brand-purple cursor-pointer"
                                    title="Edit Diary Record"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      triggerConfirm(`Delete timeline "${d.title}"?`, () => {
                                        deleteDiaryItem(diaryCategory, d.id);
                                        if (editingId === d.id) {
                                          setEditingId(null);
                                          setDiaryForm(EMPTY_DIARY_FORM);
                                        }
                                        showStatus(`Timeline item deleted.`);
                                      });
                                    }}
                                    className="p-1 hover:bg-rose-50 rounded text-red-500 hover:text-red-700 cursor-pointer"
                                    title="Delete Record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Metadata indicators */}
                              {(d.registeredVoters || d.pollingUnits || d.participants?.length) && (
                                <div className="pt-2 border-t border-line flex items-center gap-3 text-[10px] text-mut font-mono">
                                  {d.registeredVoters && <span>Voters: {d.registeredVoters}</span>}
                                  {d.pollingUnits && <span>PUs: {d.pollingUnits}</span>}
                                  {d.participants && d.participants.length > 0 && <span>Candidates: {d.participants.length}</span>}
                                </div>
                              )}
                            </div>
                          ))}

                        {sortItemsByDate<DiaryItem>((diaryCategory === 'national' ? diaryNat : 
                           diaryCategory === 'local' ? diaryLoc :
                           diaryCategory === 'africa' ? diaryAfr : diaryOth), 'date', 'asc').length === 0 && (
                          <div className="p-8 text-center text-xs text-mut font-mono">
                            No diary records found in this category.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* EVENTS TAB */}
          {activeTab === 'events' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Event Editor */}
              <div className="lg:col-span-7 bg-paper border border-line rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <h3 className="font-display font-bold text-sm text-ink uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-4.5 h-4.5 text-brand-blue" />
                    <span>{editingId ? 'Edit Event Detail' : 'Create Event Row'}</span>
                  </h3>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setEventForm(EMPTY_EVENT_FORM);
                      }}
                      className="text-xs text-red-600 hover:underline font-semibold font-mono cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveEvent} className="space-y-4">
                  <CMSDateField
                    label="Event Date / Period"
                    value={eventForm.date || (eventForm.day && eventForm.month ? `${eventForm.day} ${eventForm.month} 2026` : '')}
                    onChange={(val, meta) => setEventForm({
                      ...eventForm,
                      date: val,
                      ...(meta ? {
                        normalizedDate: meta.normalizedDate,
                        datePrecision: meta.datePrecision,
                        sortValue: meta.sortValue
                      } : {})
                    })}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase font-bold text-mut">Event Location</label>
                      <input 
                        type="text" 
                        value={eventForm.location} 
                        onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                        placeholder="E.g., Abuja Center"
                        className="w-full text-xs p-2.5 border border-line rounded-lg bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase font-bold text-mut">Engagement Type</label>
                      <input 
                        type="text" 
                        value={eventForm.type} 
                        onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                        placeholder="E.g., Workshop / Press Hub"
                        className="w-full text-xs p-2.5 border border-line rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase font-bold text-mut">Event Image URL</label>
                      <input 
                        type="text" 
                        value={eventForm.imageUrl || ''} 
                        onChange={(e) => setEventForm({ ...eventForm, imageUrl: e.target.value })}
                        placeholder="E.g., https://images.unsplash.com/photo-..."
                        className="w-full text-xs p-2.5 border border-line rounded-lg bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase font-bold text-mut">Registration Form Link / External URL</label>
                      <input 
                        type="text" 
                        value={eventForm.externalLink || ''} 
                        onChange={(e) => setEventForm({ ...eventForm, externalLink: e.target.value })}
                        placeholder="E.g., https://forms.google.com/... or Zoom link"
                        className="w-full text-xs p-2.5 border border-line rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase font-bold text-mut">Conference Title</label>
                    <input 
                      type="text" 
                      value={eventForm.title} 
                      onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                      placeholder="E.g., Post-Election Forensic Review"
                      className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase font-bold text-mut">Description Teaser</label>
                    <textarea 
                      value={eventForm.description} 
                      onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                      placeholder="E.g., Live presentation of IReV discrepancy metrics and voter accreditation ratios."
                      className="w-full text-xs p-2.5 border border-line rounded-lg bg-white h-20 resize-none"
                    />
                  </div>

                  {/* Official Links & Resources Manager */}
                  <div className="space-y-2 pt-3 border-t border-line">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-mono uppercase font-bold text-mut">Official Links &amp; Resources</label>
                      <button
                        type="button"
                        onClick={() => {
                          const currentLinks = eventForm.links || [
                            { label: 'View Our Publications', url: '/publications', external: false },
                            { label: 'Submit Partner Cooperation Request', url: 'mailto:aeo@athenacentre.org', external: true }
                          ];
                          setEventForm({
                            ...eventForm,
                            links: [...currentLinks, { label: '', url: '', external: false }]
                          });
                        }}
                        className="text-[10px] font-mono font-bold text-brand-blue hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Link</span>
                      </button>
                    </div>

                    {((eventForm.links && eventForm.links.length > 0) ? eventForm.links : [
                      { label: 'View Our Publications', url: '/publications', external: false },
                      { label: 'Submit Partner Cooperation Request', url: 'mailto:aeo@athenacentre.org', external: true }
                    ]).map((link, lIdx) => (
                      <div key={lIdx} className="p-2.5 bg-slate-50 border border-line rounded-lg space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-mono uppercase text-mut">Link Label</label>
                            <input
                              type="text"
                              value={link.label}
                              onChange={(e) => {
                                const currentLinks = [...(eventForm.links || [
                                  { label: 'View Our Publications', url: '/publications', external: false },
                                  { label: 'Submit Partner Cooperation Request', url: 'mailto:aeo@athenacentre.org', external: true }
                                ])];
                                currentLinks[lIdx] = { ...currentLinks[lIdx], label: e.target.value };
                                setEventForm({ ...eventForm, links: currentLinks });
                              }}
                              placeholder="E.g., View Our Publications"
                              className="w-full text-xs p-1.5 border border-line rounded bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono uppercase text-mut">URL / Route / Mailto</label>
                            <input
                              type="text"
                              value={link.url}
                              onChange={(e) => {
                                const currentLinks = [...(eventForm.links || [
                                  { label: 'View Our Publications', url: '/publications', external: false },
                                  { label: 'Submit Partner Cooperation Request', url: 'mailto:aeo@athenacentre.org', external: true }
                                ])];
                                currentLinks[lIdx] = { ...currentLinks[lIdx], url: e.target.value };
                                setEventForm({ ...eventForm, links: currentLinks });
                              }}
                              placeholder="E.g., /publications or mailto:aeo@athenacentre.org"
                              className="w-full text-xs p-1.5 border border-line rounded bg-white font-mono"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1">
                          <label className="inline-flex items-center gap-1.5 text-[10px] font-mono text-ink2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!link.external}
                              onChange={(e) => {
                                const currentLinks = [...(eventForm.links || [
                                  { label: 'View Our Publications', url: '/publications', external: false },
                                  { label: 'Submit Partner Cooperation Request', url: 'mailto:aeo@athenacentre.org', external: true }
                                ])];
                                currentLinks[lIdx] = { ...currentLinks[lIdx], external: e.target.checked };
                                setEventForm({ ...eventForm, links: currentLinks });
                              }}
                              className="rounded text-brand-blue"
                            />
                            <span>External / New Tab</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const currentLinks = (eventForm.links || [
                                { label: 'View Our Publications', url: '/publications', external: false },
                                { label: 'Submit Partner Cooperation Request', url: 'mailto:aeo@athenacentre.org', external: true }
                              ]).filter((_, i) => i !== lIdx);
                              setEventForm({ ...eventForm, links: currentLinks });
                            }}
                            className="text-[10px] font-mono font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
                          >
                            Remove Link
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-brand-purple hover:bg-purple-700 text-white font-mono font-bold text-xs uppercase tracking-wider py-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Event</span>
                  </button>
                </form>
              </div>

              {/* Event Catalog */}
              <div className="lg:col-span-5 space-y-3">
                <h3 className="font-display font-bold text-xs text-mut uppercase tracking-wider">Events Catalog</h3>
                <div className="space-y-2">
                  {events.map(evt => (
                    <div key={evt.id} className="bg-paper border border-line rounded-xl p-3.5 flex items-start justify-between gap-3 shadow-xs">
                      <div>
                        <span className="text-[10px] font-mono text-brand-blue bg-white px-1.5 py-0.5 rounded border border-line uppercase font-bold block mb-1">{evt.month} {evt.day}</span>
                        <h4 className="font-semibold text-xs text-ink leading-snug">{evt.title}</h4>
                        <span className="text-[10px] text-mut font-mono">{evt.location}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditingId(evt.id);
                            setEventForm(evt);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="p-1 hover:bg-line rounded text-ink2 hover:text-brand-purple cursor-pointer"
                          title="Edit Event"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            triggerConfirm(`Delete event "${evt.title}"?`, () => {
                              deleteEvent(evt.id);
                              if (editingId === evt.id) {
                                setEditingId(null);
                                setEventForm(EMPTY_EVENT_FORM);
                              }
                              showStatus(`Event deleted.`);
                            });
                          }}
                          className="p-1 hover:bg-line rounded text-red-500 hover:text-red-700 cursor-pointer"
                          title="Delete Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TEAM MEMBERS TAB */}
          {activeTab === 'team' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Team Editor */}
              <div className="lg:col-span-7 bg-paper border border-line rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <h3 className="font-display font-bold text-sm text-ink uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-4.5 h-4.5 text-brand-blue" />
                    <span>{editingId ? 'Edit Team Member' : 'Add Team Member'}</span>
                  </h3>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setTeamForm(EMPTY_TEAM_FORM);
                      }}
                      className="text-xs text-red-600 hover:underline font-semibold font-mono cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveTeam} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase font-bold text-mut">Full Name</label>
                      <input 
                        type="text" 
                        value={teamForm.name} 
                        onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                        placeholder="E.g., Dr. Chuka Obi"
                        className="w-full text-xs p-2.5 border border-line rounded-lg bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase font-bold text-mut">Initials / Avatar</label>
                      <input 
                        type="text" 
                        value={teamForm.initials} 
                        onChange={(e) => setTeamForm({ ...teamForm, initials: e.target.value })}
                        placeholder="E.g., CO"
                        maxLength={2}
                        className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase font-bold text-mut">Professional Role</label>
                    <input 
                      type="text" 
                      value={teamForm.role} 
                      onChange={(e) => setTeamForm({ ...teamForm, role: e.target.value })}
                      placeholder="E.g., Lead Legal Observer"
                      className="w-full text-xs p-2.5 border border-line rounded-lg bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-brand-purple hover:bg-purple-700 text-white font-mono font-bold text-xs uppercase tracking-wider py-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Team Member</span>
                  </button>
                </form>
              </div>

              {/* Team list directory */}
              <div className="lg:col-span-5 space-y-3">
                <h3 className="font-display font-bold text-xs text-mut uppercase tracking-wider">Our People</h3>
                <div className="space-y-2">
                  {team.map(member => (
                    <div key={member.id} className="bg-paper border border-line rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded bg-brand-purple text-white text-xs font-bold font-mono flex items-center justify-center">
                          {member.initials}
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs text-ink leading-snug">{member.name}</h4>
                          <span className="text-[10px] text-mut block">{member.role}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditingId(member.id);
                            setTeamForm(member);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="p-1 hover:bg-line rounded text-ink2 hover:text-brand-purple cursor-pointer"
                          title="Edit Team Member"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            triggerConfirm(`Delete team member "${member.name}"?`, () => {
                              deleteTeamMember(member.id);
                              if (editingId === member.id) {
                                setEditingId(null);
                                setTeamForm(EMPTY_TEAM_FORM);
                              }
                              showStatus(`Team member deleted.`);
                            });
                          }}
                          className="p-1 hover:bg-line rounded text-red-500 hover:text-red-700 cursor-pointer"
                          title="Delete Team Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* HERO & STATS TAB (VISUAL SITE CMS EDITOR) */}
          {activeTab === 'hero_stats' && (
            <div className="space-y-6">
              
              {/* Guidance Info Banner */}
              <div className="bg-brand-purple/10 border border-brand-purple/20 rounded-2xl p-4 flex items-start gap-3.5">
                <Database className="w-5 h-5 text-brand-purple shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-display font-bold text-xs text-brand-purple uppercase tracking-wider">Visual Section Editor (Hero & Stats)</h4>
                  <p className="text-xs text-ink/80 leading-relaxed">
                    This editing interface is styled <strong>exactly like the live homepage</strong>. You can modify any text, numbers, countdown deadlines, backgrounds, and icons directly in the live templates. Use curly brackets <code>{'{'}glowing text{'}'}</code> in the main title to wrap words in the animated blue-green gradient highlight! Sizing, fonts, and responsive alignments are preserved.
                  </p>
                </div>
              </div>

              {/* Action Buttons Header */}
              <div className="flex items-center justify-between bg-paper p-4 border border-line rounded-xl">
                <div className="text-xs text-mut font-mono">
                  *Changes take effect across the entire site immediately upon saving.
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setLocalHero(heroConfig);
                      setLocalStats(statsConfig);
                      showStatus('Reset unsaved changes in visual editor.');
                    }}
                    className="px-4 py-2 bg-white hover:bg-slate-50 border border-line rounded-lg text-xs font-semibold text-ink transition-colors cursor-pointer"
                  >
                    Discard Changes
                  </button>
                  <button
                    onClick={() => {
                      saveHeroConfig(localHero);
                      saveStatsConfig(localStats);
                      showStatus('Hero section and live statistics saved successfully!');
                    }}
                    className="px-5 py-2 bg-brand-purple hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-brand-purple/20 transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save All Changes</span>
                  </button>
                </div>
              </div>

              {/* LIVE PREVIEW HERO LAYOUT WITH DIRECT INPUT FIELDS */}
              <div className="bg-navy rounded-3xl p-6 sm:p-8 relative overflow-hidden text-white border border-white/5">
                {/* Decorative ambient blobs */}
                <div className="absolute top-1/4 left-0 w-64 h-64 bg-brand-blue/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-brand-purple/10 rounded-full blur-2xl pointer-events-none"></div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
                  {/* Left Hero Form */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-blue-300 uppercase tracking-wider font-bold">Eyebrow / Badge Text</label>
                      <input 
                        type="text"
                        value={localHero.badgeText}
                        onChange={(e) => setLocalHero({ ...localHero, badgeText: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-brand-blue outline-none px-3.5 py-2 rounded-xl text-xs font-mono tracking-wide text-blue-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-blue-300 uppercase tracking-wider font-bold">Main Title Header (use {'{'}highlight{'}'} for gradient color)</label>
                      <textarea 
                        value={localHero.title}
                        onChange={(e) => setLocalHero({ ...localHero, title: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-brand-blue outline-none p-3 rounded-xl font-display text-sm sm:text-base font-bold leading-relaxed text-white h-20 resize-none"
                        placeholder="Use curly brackets for {highlight}"
                      />
                      {/* Live text highlight render as helper */}
                      <div className="text-[11px] text-blue-200/60 font-medium italic pt-1">
                        Render Preview: "{localHero.title.split(/\{([^}]+)\}/g).map((part, index) => index % 2 === 1 ? <span key={index} className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-green-300 font-bold">{part}</span> : part)}"
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-blue-300 uppercase tracking-wider font-bold">Sub-Description Text</label>
                      <textarea 
                        value={localHero.description}
                        onChange={(e) => setLocalHero({ ...localHero, description: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-brand-blue outline-none p-3 rounded-xl text-xs text-blue-100 leading-relaxed h-24 resize-none"
                      />
                    </div>

                    {/* Collapsible Custom Theme & Fonts Section */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="text-xs font-mono font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                          🎨 Hero Typography & Color Customizer
                        </span>
                      </div>

                      {/* Section Background & Accent Colors */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[9px] font-mono text-blue-200">Hero Section BG</label>
                          <div className="flex items-center gap-1.5">
                            <input 
                              type="color" 
                              value={localHero.heroBgColor || "#1E3A5F"} 
                              onChange={(e) => setLocalHero({ ...localHero, heroBgColor: e.target.value })}
                              className="w-7 h-7 bg-transparent border-0 cursor-pointer p-0 shrink-0"
                            />
                            <input 
                              type="text" 
                              value={localHero.heroBgColor || "#1E3A5F"} 
                              onChange={(e) => setLocalHero({ ...localHero, heroBgColor: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] font-mono text-white text-center"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[9px] font-mono text-blue-200 font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-green-300">Highlight Gradient From</label>
                          <div className="flex items-center gap-1.5">
                            <input 
                              type="color" 
                              value={localHero.titleHighlightFrom || "#93C5FD"} 
                              onChange={(e) => setLocalHero({ ...localHero, titleHighlightFrom: e.target.value })}
                              className="w-7 h-7 bg-transparent border-0 cursor-pointer p-0 shrink-0"
                            />
                            <input 
                              type="text" 
                              value={localHero.titleHighlightFrom || "#93C5FD"} 
                              onChange={(e) => setLocalHero({ ...localHero, titleHighlightFrom: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] font-mono text-white text-center"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[9px] font-mono text-blue-200 font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-green-300">Highlight Gradient To</label>
                          <div className="flex items-center gap-1.5">
                            <input 
                              type="color" 
                              value={localHero.titleHighlightTo || "#86EFAC"} 
                              onChange={(e) => setLocalHero({ ...localHero, titleHighlightTo: e.target.value })}
                              className="w-7 h-7 bg-transparent border-0 cursor-pointer p-0 shrink-0"
                            />
                            <input 
                              type="text" 
                              value={localHero.titleHighlightTo || "#86EFAC"} 
                              onChange={(e) => setLocalHero({ ...localHero, titleHighlightTo: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] font-mono text-white text-center"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Main Title Customizer */}
                      <div className="border-t border-white/5 pt-3 space-y-3">
                        <span className="block text-[10px] font-mono text-blue-300 font-bold uppercase">Main Title Font & Color Settings</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[9px] font-mono text-blue-200">Font Family</label>
                            <select 
                              value={localHero.titleFontFamily || "font-display"}
                              onChange={(e) => setLocalHero({ ...localHero, titleFontFamily: e.target.value })}
                              className="w-full bg-white/10 text-white text-xs rounded p-1.5 border border-white/10 focus:outline-none font-mono"
                            >
                              <option value="font-display">Space Grotesk (Display)</option>
                              <option value="font-sans">Inter (Sans-Serif)</option>
                              <option value="font-mono">IBM Plex Mono (Mono)</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[9px] font-mono text-blue-200">Font Size</label>
                            <select 
                              value={localHero.titleFontSize || "text-4xl sm:text-5xl lg:text-6xl"}
                              onChange={(e) => setLocalHero({ ...localHero, titleFontSize: e.target.value })}
                              className="w-full bg-white/10 text-white text-xs rounded p-1.5 border border-white/10 focus:outline-none font-mono"
                            >
                              <option value="text-3xl sm:text-4xl lg:text-5xl">Small Title (3xl-5xl)</option>
                              <option value="text-4xl sm:text-5xl lg:text-6xl">Medium Title (4xl-6xl)</option>
                              <option value="text-5xl sm:text-6xl lg:text-7xl">Large Title (5xl-7xl)</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[9px] font-mono text-blue-200">Title Base Color</label>
                            <div className="flex items-center gap-1.5">
                              <input 
                                type="color" 
                                value={localHero.titleColor || "#FFFFFF"} 
                                onChange={(e) => setLocalHero({ ...localHero, titleColor: e.target.value })}
                                className="w-7 h-7 bg-transparent border-0 cursor-pointer p-0 shrink-0"
                              />
                              <input 
                                type="text" 
                                value={localHero.titleColor || "#FFFFFF"} 
                                onChange={(e) => setLocalHero({ ...localHero, titleColor: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded px-1.5 py-1 text-[11px] font-mono text-white text-center"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sub-description Customizer */}
                      <div className="border-t border-white/5 pt-3 space-y-3">
                        <span className="block text-[10px] font-mono text-blue-300 font-bold uppercase">Sub-description Font & Color Settings</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[9px] font-mono text-blue-200">Font Family</label>
                            <select 
                              value={localHero.descriptionFontFamily || "font-sans"}
                              onChange={(e) => setLocalHero({ ...localHero, descriptionFontFamily: e.target.value })}
                              className="w-full bg-white/10 text-white text-xs rounded p-1.5 border border-white/10 focus:outline-none font-mono"
                            >
                              <option value="font-sans">Inter (Sans-Serif)</option>
                              <option value="font-display">Space Grotesk (Display)</option>
                              <option value="font-mono">IBM Plex Mono (Mono)</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[9px] font-mono text-blue-200">Font Size</label>
                            <select 
                              value={localHero.descriptionFontSize || "text-base sm:text-lg"}
                              onChange={(e) => setLocalHero({ ...localHero, descriptionFontSize: e.target.value })}
                              className="w-full bg-white/10 text-white text-xs rounded p-1.5 border border-white/10 focus:outline-none font-mono"
                            >
                              <option value="text-xs sm:text-sm">Small Description (xs-sm)</option>
                              <option value="text-sm sm:text-base">Medium Description (sm-base)</option>
                              <option value="text-base sm:text-lg">Large Description (base-lg)</option>
                              <option value="text-lg sm:text-xl">X-Large Description (lg-xl)</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[9px] font-mono text-blue-200">Description Color</label>
                            <div className="flex items-center gap-1.5">
                              <input 
                                type="color" 
                                value={localHero.descriptionColor || "#DBEAFE"} 
                                onChange={(e) => setLocalHero({ ...localHero, descriptionColor: e.target.value })}
                                className="w-7 h-7 bg-transparent border-0 cursor-pointer p-0 shrink-0"
                              />
                              <input 
                                type="text" 
                                value={localHero.descriptionColor || "#DBEAFE"} 
                                onChange={(e) => setLocalHero({ ...localHero, descriptionColor: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded px-1.5 py-1 text-[11px] font-mono text-white text-center"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>


                  </div>

                  {/* Right Spotlight Card Form */}
                  <div className="lg:col-span-5 bg-white/5 border border-white/15 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <label className="block text-[9px] font-mono text-blue-300 uppercase tracking-widest font-bold">Spotlight Badge</label>
                        <input 
                          type="text"
                          value={localHero.spotlightBadgeText}
                          onChange={(e) => setLocalHero({ ...localHero, spotlightBadgeText: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 focus:border-brand-blue outline-none px-2 py-1 rounded text-[10px] font-mono text-blue-300 uppercase"
                        />
                      </div>
                      <div className="space-y-1 flex-1">
                        <label className="block text-[9px] font-mono text-blue-300 uppercase tracking-widest font-bold">Status Badge</label>
                        <input 
                          type="text"
                          value={localHero.spotlightStatusText}
                          onChange={(e) => setLocalHero({ ...localHero, spotlightStatusText: e.target.value })}
                          className="w-full bg-brand-blue/30 text-blue-200 border border-brand-blue/40 px-2 py-1 rounded text-[10px] text-center font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-mono text-blue-300 uppercase tracking-widest font-bold">Spotlight Title</label>
                      <input 
                        type="text"
                        value={localHero.spotlightTitle}
                        onChange={(e) => setLocalHero({ ...localHero, spotlightTitle: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 focus:border-brand-blue outline-none px-2.5 py-1.5 rounded font-display font-bold text-sm text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-mono text-blue-300 uppercase tracking-widest font-bold">Date & INEC Monitor Info</label>
                      <input 
                        type="text"
                        value={localHero.spotlightDateText}
                        onChange={(e) => setLocalHero({ ...localHero, spotlightDateText: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 focus:border-brand-blue outline-none px-2.5 py-1.5 rounded text-xs text-blue-200 font-medium"
                      />
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                      <span className="block text-[9px] font-mono uppercase text-blue-300 font-bold">Live Countdown Setting</span>
                      <div className="space-y-1">
                        <label className="block text-[8px] font-mono text-blue-200/70">Target Date (ISO string deadline):</label>
                        <input 
                          type="text"
                          value={localHero.spotlightTargetDate}
                          onChange={(e) => setLocalHero({ ...localHero, spotlightTargetDate: e.target.value })}
                          className="w-full bg-white/10 border border-white/20 focus:border-brand-blue outline-none px-2 py-1 rounded text-xs text-white font-mono"
                          placeholder="YYYY-MM-DDTHH:MM:SS+01:00"
                        />
                      </div>
                    </div>

                    {/* Specifications */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2 text-[11px]">
                      <span className="block text-[9px] font-mono uppercase text-blue-300 font-bold">Spotlight Specs</span>
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-blue-200 text-[10px]">LGAs:</span>
                          <input 
                            type="text"
                            value={localHero.lgasCount}
                            onChange={(e) => setLocalHero({ ...localHero, lgasCount: e.target.value })}
                            className="bg-white/5 border border-white/10 focus:border-brand-blue outline-none rounded px-2 py-0.5 text-[11px] font-mono text-white text-right w-1/2"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-blue-200 text-[10px]">Registered Voters:</span>
                          <input 
                            type="text"
                            value={localHero.registeredVoters}
                            onChange={(e) => setLocalHero({ ...localHero, registeredVoters: e.target.value })}
                            className="bg-white/5 border border-white/10 focus:border-brand-blue outline-none rounded px-2 py-0.5 text-[11px] font-mono text-white text-right w-1/2"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-blue-200 text-[10px]">Polling Units (PUs):</span>
                          <input 
                            type="text"
                            value={localHero.pollingUnits}
                            onChange={(e) => setLocalHero({ ...localHero, pollingUnits: e.target.value })}
                            className="bg-white/5 border border-white/10 focus:border-brand-blue outline-none rounded px-2 py-0.5 text-[11px] font-mono text-white text-right w-1/2"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 pt-1.5 border-t border-white/5">
                        <label className="block text-[8px] font-mono text-blue-200/70">Specification Detail paragraph:</label>
                        <textarea 
                          value={localHero.spotlightBottomText}
                          onChange={(e) => setLocalHero({ ...localHero, spotlightBottomText: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 focus:border-brand-blue outline-none p-1.5 rounded text-[10px] text-blue-100 leading-normal h-12 resize-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-mono text-blue-300 uppercase tracking-widest font-bold">Bottom Link Text</label>
                      <input 
                        type="text"
                        value={localHero.diaryLinkText}
                        onChange={(e) => setLocalHero({ ...localHero, diaryLinkText: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 focus:border-brand-blue outline-none px-2 py-1 rounded text-xs text-center text-blue-300 font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* LIVE PREVIEW STATS LAYOUT WITH DIRECT INPUT FIELDS */}
              <div className="bg-paper border border-line rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-xs text-ink uppercase tracking-wider">Live Statistics Cards Editor</h3>
                  <span className="text-[10px] text-mut font-mono">Preserves specific card colors, icons, values and expand triggers</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {localStats.map((stat) => (
                    <div 
                      key={stat.id}
                      className={`${stat.color} text-white rounded-2xl p-4 relative group overflow-hidden shadow-md flex flex-col justify-between space-y-4`}
                    >
                      {/* Top metadata info */}
                      <div className="flex items-center justify-between gap-1.5 relative z-10">
                        <input 
                          type="text"
                          value={stat.title}
                          onChange={(e) => {
                            const newStats = [...localStats];
                            const idx = newStats.findIndex(s => s.id === stat.id);
                            newStats[idx] = { ...newStats[idx], title: e.target.value };
                            setLocalStats(newStats);
                          }}
                          className="bg-white/10 border border-white/10 focus:border-white/30 outline-none rounded px-1.5 py-0.5 text-[9px] font-mono tracking-wider font-semibold text-white/95 uppercase w-full"
                          title="Card Title"
                        />
                        <div className="shrink-0">
                          <select 
                            value={stat.iconName}
                            onChange={(e) => {
                              const newStats = [...localStats];
                              const idx = newStats.findIndex(s => s.id === stat.id);
                              newStats[idx] = { ...newStats[idx], iconName: e.target.value as any };
                              setLocalStats(newStats);
                            }}
                            className="bg-black/40 text-white text-[9px] font-mono rounded px-1 py-0.5 border border-white/10 focus:outline-none"
                            title="Select Icon"
                          >
                            <option value="Shield">🛡️ Shield</option>
                            <option value="Database">🗄️ Database</option>
                            <option value="FileSpreadsheet">📊 Sheet</option>
                            <option value="Globe">🌐 Globe</option>
                          </select>
                        </div>
                      </div>

                      {/* Display value */}
                      <div className="relative z-10 space-y-1">
                        <label className="block text-[8px] font-mono text-white/70">Primary Audited Value:</label>
                        <input 
                          type="text"
                          value={stat.value}
                          onChange={(e) => {
                            const newStats = [...localStats];
                            const idx = newStats.findIndex(s => s.id === stat.id);
                            newStats[idx] = { ...newStats[idx], value: e.target.value };
                            setLocalStats(newStats);
                          }}
                          className="bg-white/10 border border-white/10 focus:border-white/30 outline-none rounded px-1.5 py-0.5 font-display font-bold text-lg text-white w-full"
                        />
                      </div>

                      {/* Sub text */}
                      <div className="relative z-10 space-y-1">
                        <label className="block text-[8px] font-mono text-white/70">Sub-title / Scope:</label>
                        <input 
                          type="text"
                          value={stat.sub}
                          onChange={(e) => {
                            const newStats = [...localStats];
                            const idx = newStats.findIndex(s => s.id === stat.id);
                            newStats[idx] = { ...newStats[idx], sub: e.target.value };
                            setLocalStats(newStats);
                          }}
                          className="bg-white/10 border border-white/10 focus:border-white/30 outline-none rounded px-1.5 py-0.5 text-[10px] text-white/90 font-medium w-full"
                        />
                      </div>

                      {/* Detail section */}
                      <div className="relative z-10 space-y-1">
                        <label className="block text-[8px] font-mono text-white/70">Expanded hover/click description text:</label>
                        <textarea 
                          value={stat.detail}
                          onChange={(e) => {
                            const newStats = [...localStats];
                            const idx = newStats.findIndex(s => s.id === stat.id);
                            newStats[idx] = { ...newStats[idx], detail: e.target.value };
                            setLocalStats(newStats);
                          }}
                          className="bg-white/10 border border-white/10 focus:border-white/30 outline-none rounded p-1 text-[10px] text-white/95 leading-normal h-16 w-full resize-none"
                        />
                      </div>

                      {/* Color preset picker dropdown */}
                      <div className="relative z-10 space-y-1 pt-1.5 border-t border-white/10">
                        <label className="block text-[8px] font-mono text-white/70">Card Theme Color Preset:</label>
                        <select
                          value={stat.color}
                          onChange={(e) => {
                            const newStats = [...localStats];
                            const idx = newStats.findIndex(s => s.id === stat.id);
                            newStats[idx] = { ...newStats[idx], color: e.target.value };
                            setLocalStats(newStats);
                          }}
                          className="bg-black/30 text-white text-[9px] rounded p-1 w-full border border-white/10 focus:outline-none font-mono"
                        >
                          <option value="bg-gradient-to-br from-blue-600 to-navy-dark">Slate Blue</option>
                          <option value="bg-gradient-to-br from-green-600 to-green-950">Deep Green</option>
                          <option value="bg-gradient-to-br from-brand-purple to-purple-950">Royal Purple</option>
                          <option value="bg-gradient-to-br from-slate-700 to-ink">Ink Charcoal</option>
                          <option value="bg-gradient-to-br from-amber-600 to-amber-950">Warm Amber</option>
                        </select>
                      </div>

                      {/* Collapsible card style editor */}
                      <button
                        type="button"
                        onClick={() => setExpandedStatStyles(expandedStatStyles === stat.id ? null : stat.id)}
                        className="w-full py-1.5 bg-white/10 hover:bg-white/20 rounded text-[10px] font-mono font-bold tracking-wider uppercase transition-colors text-center cursor-pointer mt-1 border border-white/10 relative z-10"
                      >
                        {expandedStatStyles === stat.id ? 'Hide Style Settings' : '🎨 Customize Card Styles'}
                      </button>

                      {expandedStatStyles === stat.id && (
                        <div className="space-y-3 pt-3 border-t border-white/15 text-[11px] relative z-10 bg-black/25 p-3 rounded-xl">
                          {/* Card Background Setting */}
                          <div className="space-y-1">
                            <label className="block text-[9px] font-mono text-white/80">Background Style:</label>
                            <select
                              value={stat.cardBgType || 'gradient'}
                              onChange={(e) => {
                                const newStats = [...localStats];
                                const idx = newStats.findIndex(s => s.id === stat.id);
                                newStats[idx] = { ...newStats[idx], cardBgType: e.target.value as any };
                                setLocalStats(newStats);
                              }}
                              className="bg-black/40 text-white text-[10px] rounded p-1 w-full border border-white/10 focus:outline-none font-mono"
                            >
                              <option value="gradient">Gradient Background</option>
                              <option value="solid">Solid Background</option>
                            </select>
                          </div>

                          {stat.cardBgType === 'solid' ? (
                            <div className="space-y-1">
                              <label className="block text-[9px] font-mono text-white/80">Solid Color:</label>
                              <div className="flex items-center gap-1.5">
                                <input 
                                  type="color" 
                                  value={stat.cardBgSolid || '#1E3A5F'} 
                                  onChange={(e) => {
                                    const newStats = [...localStats];
                                    const idx = newStats.findIndex(s => s.id === stat.id);
                                    newStats[idx] = { ...newStats[idx], cardBgSolid: e.target.value };
                                    setLocalStats(newStats);
                                  }}
                                  className="w-6 h-6 bg-transparent border-0 cursor-pointer p-0 shrink-0"
                                />
                                <input 
                                  type="text" 
                                  value={stat.cardBgSolid || '#1E3A5F'} 
                                  onChange={(e) => {
                                    const newStats = [...localStats];
                                    const idx = newStats.findIndex(s => s.id === stat.id);
                                    newStats[idx] = { ...newStats[idx], cardBgSolid: e.target.value };
                                    setLocalStats(newStats);
                                  }}
                                  className="w-full bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-mono text-white"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="block text-[8px] font-mono text-white/70">Grad From:</label>
                                <div className="flex items-center gap-1">
                                  <input 
                                    type="color" 
                                    value={stat.cardBgGradFrom || '#2563EB'} 
                                    onChange={(e) => {
                                      const newStats = [...localStats];
                                      const idx = newStats.findIndex(s => s.id === stat.id);
                                      newStats[idx] = { ...newStats[idx], cardBgGradFrom: e.target.value };
                                      setLocalStats(newStats);
                                    }}
                                    className="w-5 h-5 bg-transparent border-0 cursor-pointer p-0 shrink-0"
                                  />
                                  <input 
                                    type="text" 
                                    value={stat.cardBgGradFrom || '#2563EB'} 
                                    onChange={(e) => {
                                      const newStats = [...localStats];
                                      const idx = newStats.findIndex(s => s.id === stat.id);
                                      newStats[idx] = { ...newStats[idx], cardBgGradFrom: e.target.value };
                                      setLocalStats(newStats);
                                    }}
                                    className="w-full bg-black/40 border border-white/10 rounded px-1 text-[9px] font-mono text-white"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[8px] font-mono text-white/70">Grad To:</label>
                                <div className="flex items-center gap-1">
                                  <input 
                                    type="color" 
                                    value={stat.cardBgGradTo || '#15304F'} 
                                    onChange={(e) => {
                                      const newStats = [...localStats];
                                      const idx = newStats.findIndex(s => s.id === stat.id);
                                      newStats[idx] = { ...newStats[idx], cardBgGradTo: e.target.value };
                                      setLocalStats(newStats);
                                    }}
                                    className="w-5 h-5 bg-transparent border-0 cursor-pointer p-0 shrink-0"
                                  />
                                  <input 
                                    type="text" 
                                    value={stat.cardBgGradTo || '#15304F'} 
                                    onChange={(e) => {
                                      const newStats = [...localStats];
                                      const idx = newStats.findIndex(s => s.id === stat.id);
                                      newStats[idx] = { ...newStats[idx], cardBgGradTo: e.target.value };
                                      setLocalStats(newStats);
                                    }}
                                    className="w-full bg-black/40 border border-white/10 rounded px-1 text-[9px] font-mono text-white"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Title Settings */}
                          <div className="space-y-1.5 pt-1.5 border-t border-white/10">
                            <span className="block text-[8px] font-mono uppercase text-white/60 font-bold">Title Text Styles</span>
                            <div className="grid grid-cols-3 gap-1.5">
                              <div>
                                <label className="block text-[7px] text-white/50 uppercase">Font</label>
                                <select
                                  value={stat.titleFontFamily || 'font-mono'}
                                  onChange={(e) => {
                                    const newStats = [...localStats];
                                    const idx = newStats.findIndex(s => s.id === stat.id);
                                    newStats[idx] = { ...newStats[idx], titleFontFamily: e.target.value };
                                    setLocalStats(newStats);
                                  }}
                                  className="bg-black/40 text-white text-[8px] rounded p-0.5 w-full border border-white/10 focus:outline-none"
                                >
                                  <option value="font-mono">Mono</option>
                                  <option value="font-sans">Sans</option>
                                  <option value="font-display">Display</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[7px] text-white/50 uppercase">Size</label>
                                <select
                                  value={stat.titleFontSize || 'text-xs'}
                                  onChange={(e) => {
                                    const newStats = [...localStats];
                                    const idx = newStats.findIndex(s => s.id === stat.id);
                                    newStats[idx] = { ...newStats[idx], titleFontSize: e.target.value };
                                    setLocalStats(newStats);
                                  }}
                                  className="bg-black/40 text-white text-[8px] rounded p-0.5 w-full border border-white/10 focus:outline-none"
                                >
                                  <option value="text-[10px]">Tiny</option>
                                  <option value="text-xs">Small</option>
                                  <option value="text-sm">Medium</option>
                                  <option value="text-base">Large</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[7px] text-white/50 uppercase">Color</label>
                                <div className="flex items-center gap-1">
                                  <input 
                                    type="color" 
                                    value={stat.titleColor || '#E2E8F0'} 
                                    onChange={(e) => {
                                      const newStats = [...localStats];
                                      const idx = newStats.findIndex(s => s.id === stat.id);
                                      newStats[idx] = { ...newStats[idx], titleColor: e.target.value };
                                      setLocalStats(newStats);
                                    }}
                                    className="w-4 h-4 bg-transparent border-0 cursor-pointer p-0 shrink-0"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Value Settings */}
                          <div className="space-y-1.5 pt-1.5 border-t border-white/10">
                            <span className="block text-[8px] font-mono uppercase text-white/60 font-bold">Audited Value Styles</span>
                            <div className="grid grid-cols-3 gap-1.5">
                              <div>
                                <label className="block text-[7px] text-white/50 uppercase">Font</label>
                                <select
                                  value={stat.valueFontFamily || 'font-display'}
                                  onChange={(e) => {
                                    const newStats = [...localStats];
                                    const idx = newStats.findIndex(s => s.id === stat.id);
                                    newStats[idx] = { ...newStats[idx], valueFontFamily: e.target.value };
                                    setLocalStats(newStats);
                                  }}
                                  className="bg-black/40 text-white text-[8px] rounded p-0.5 w-full border border-white/10 focus:outline-none"
                                >
                                  <option value="font-display">Display</option>
                                  <option value="font-sans">Sans</option>
                                  <option value="font-mono">Mono</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[7px] text-white/50 uppercase">Size</label>
                                <select
                                  value={stat.valueFontSize || 'text-3xl sm:text-4xl'}
                                  onChange={(e) => {
                                    const newStats = [...localStats];
                                    const idx = newStats.findIndex(s => s.id === stat.id);
                                    newStats[idx] = { ...newStats[idx], valueFontSize: e.target.value };
                                    setLocalStats(newStats);
                                  }}
                                  className="bg-black/40 text-white text-[8px] rounded p-0.5 w-full border border-white/10 focus:outline-none"
                                >
                                  <option value="text-2xl">2XL</option>
                                  <option value="text-3xl">3XL</option>
                                  <option value="text-4xl">4XL</option>
                                  <option value="text-5xl">5XL</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[7px] text-white/50 uppercase">Color</label>
                                <div className="flex items-center gap-1">
                                  <input 
                                    type="color" 
                                    value={stat.valueColor || '#FFFFFF'} 
                                    onChange={(e) => {
                                      const newStats = [...localStats];
                                      const idx = newStats.findIndex(s => s.id === stat.id);
                                      newStats[idx] = { ...newStats[idx], valueColor: e.target.value };
                                      setLocalStats(newStats);
                                    }}
                                    className="w-4 h-4 bg-transparent border-0 cursor-pointer p-0 shrink-0"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="flex items-center justify-end gap-3 bg-paper p-4 border border-line rounded-xl">
                <button
                  onClick={() => {
                    setLocalHero(heroConfig);
                    setLocalStats(statsConfig);
                    showStatus('Reset unsaved changes in visual editor.');
                  }}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-line rounded-lg text-xs font-semibold text-ink transition-colors cursor-pointer"
                >
                  Discard Changes
                </button>
                <button
                  onClick={() => {
                    saveHeroConfig(localHero);
                    saveStatsConfig(localStats);
                    showStatus('Hero section and live statistics saved successfully!');
                  }}
                  className="px-5 py-2 bg-brand-purple hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-brand-purple/20 transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save All Changes</span>
                </button>
              </div>

            </div>
          )}

          {/* SUBSCRIBERS TAB */}
          {activeTab === 'subscribers' && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="bg-brand-blue/10 border border-brand-blue/20 rounded-2xl p-4 flex items-start gap-3.5">
                <Users className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-display font-bold text-xs text-brand-blue uppercase tracking-wider">Subscribers Database</h4>
                  <p className="text-xs text-ink/80 leading-relaxed">
                    This table displays all verified professional subscriptions received through the <strong>AEO update widgets</strong>.
                    Subscribers are synced in real-time with the secure cloud Firestore database.
                  </p>
                </div>
              </div>

              {/* Controls bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-paper p-4 border border-line rounded-xl">
                <div className="relative flex-grow max-w-md">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-mut" />
                  <input
                    type="text"
                    placeholder="Search subscribers by email..."
                    value={subSearch}
                    onChange={(e) => setSubSearch(e.target.value)}
                    className="w-full bg-white border border-line rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-blue"
                  />
                </div>
                <div className="text-xs text-ink2 font-mono font-semibold self-center">
                  Total Subscribers: {subscribers.length}
                </div>
              </div>

              {/* Table / List of subscribers */}
              <div className="bg-white border border-line rounded-2xl overflow-hidden shadow-sm">
                {subLoading ? (
                  <div className="p-12 text-center text-sm font-mono text-mut flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
                    <span>Loading secure database sync...</span>
                  </div>
                ) : subscribers.length === 0 ? (
                  <div className="p-12 text-center text-sm text-mut leading-relaxed">
                    No active subscribers found in this region database.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-paper border-b border-line text-[10px] font-mono font-bold text-mut uppercase tracking-wider">
                          <th className="px-6 py-4">Email Address</th>
                          <th className="px-6 py-4">Selected Notification Channels</th>
                          <th className="px-6 py-4">Subscribed Date</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line text-xs">
                        {subscribers
                          .filter(sub => sub.email?.toLowerCase().includes(subSearch.toLowerCase()))
                          .map((sub) => (
                            <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-semibold text-ink font-mono">{sub.email}</td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1.5">
                                  {sub.channels && Array.isArray(sub.channels) ? (
                                    sub.channels.map((chan: string, i: number) => (
                                      <span key={i} className="px-2 py-0.5 rounded bg-blue-50 text-brand-blue text-[10px] font-semibold border border-blue-100">
                                        {chan}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-mut italic">No channels</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-mut font-mono">
                                {sub.subscribedAt ? new Date(sub.subscribedAt).toLocaleString() : 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => {
                                    triggerConfirm(`Are you sure you want to remove ${sub.email} from subscribers?`, async () => {
                                      try {
                                        await deleteDoc(doc(db, 'subscribers', sub.id));
                                        showStatus('Subscriber removed from database.');
                                      } catch (err) {
                                        console.error(err);
                                        showStatus('Failed to delete subscriber.');
                                      }
                                    });
                                  }}
                                  className="p-1.5 hover:bg-rose-50 text-mut hover:text-rose-600 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                                  title="Remove Subscriber"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        {subscribers.filter(sub => sub.email?.toLowerCase().includes(subSearch.toLowerCase())).length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-mut italic">
                              No subscribers match your search term.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'elections' && (
            <div className="space-y-6">
              <div className="bg-paper border border-line rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold font-display text-ink uppercase tracking-wider">Elections & Political Parties Data Engine</h3>
                    <p className="text-xs text-mut mt-1">Register political parties, upload logos, customize state election standings, or bulk import election results via spreadsheet.</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setElectionsSubMode('manual')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5 ${
                        electionsSubMode === 'manual' 
                          ? 'bg-indigo-600 text-white shadow-sm' 
                          : 'bg-white border border-line text-mut hover:text-ink'
                      }`}
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>Party & State Registry</span>
                    </button>
                    <button
                      onClick={() => setElectionsSubMode('spreadsheet')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5 ${
                        electionsSubMode === 'spreadsheet' 
                          ? 'bg-indigo-600 text-white shadow-sm' 
                          : 'bg-white border border-line text-mut hover:text-ink'
                      }`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Spreadsheet Bulk Import</span>
                    </button>
                    <button
                      onClick={downloadElectionDataCSVTemplate}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                      title="Download Election CSV Template"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>CSV Template</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* SPREADSHEET BULK UPLOAD MODE */}
              {electionsSubMode === 'spreadsheet' && (
                <div className="bg-paper border border-line rounded-2xl p-6 space-y-6">
                  <div className="space-y-2">
                    <h4 className="font-display font-bold text-sm text-ink uppercase tracking-wider flex items-center gap-2">
                      <UploadCloud className="w-4 h-4 text-indigo-600" />
                      <span>Bulk Upload State Election Results Data</span>
                    </h4>
                    <p className="text-xs text-mut leading-relaxed">
                      Upload or paste election data rows directly from <strong>Excel</strong> or <strong>CSV</strong>. Supported columns: <code>State Code, State Name, Election Title, Status, Date, Registered Voters, Accredited Voters, Polling Units, LGAs, Wards, Valid Votes, Rejected Votes, Total Votes, Reconciliation Rate, APC Votes, PDP Votes, LP Votes, NNPP Votes, SDP Votes</code>.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-mono font-bold uppercase text-ink">Paste Spreadsheet Rows or Upload File:</label>
                    <textarea
                      rows={6}
                      value={electionsSpreadsheetText}
                      onChange={(e) => setElectionsSpreadsheetText(e.target.value)}
                      placeholder={`State Code\tState Name\tElection Title\tStatus\tDate\tRegistered Voters\tAccredited Voters\tPolling Units\tValid Votes\tAPC Votes\tPDP Votes\tLP Votes\nON\tOndo\tOndo Gubernatorial Poll 2024\tConcluded\t16 Nov 2024\t2,053,061\t508,962\t3,933\t489,120\t366612\t117845\t4743`}
                      className="w-full text-xs p-3 font-mono border border-line rounded-xl bg-white text-ink focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <label className="px-3 py-2 bg-white hover:bg-slate-50 border border-line rounded-lg text-xs font-mono font-semibold text-ink cursor-pointer flex items-center gap-1.5 shadow-sm">
                          <UploadCloud className="w-4 h-4 text-indigo-600" />
                          <span>Choose CSV / TSV File</span>
                          <input
                            type="file"
                            accept=".csv,.tsv,.txt"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (evt) => {
                                  const text = evt.target?.result as string;
                                  if (text) {
                                    setElectionsSpreadsheetText(text);
                                    showStatus(`Loaded ${file.name}`);
                                  }
                                };
                                reader.readAsText(file);
                              }
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setElectionsSpreadsheetText('');
                            setElectionsSpreadsheetParsed(null);
                          }}
                          className="px-3 py-2 text-xs font-mono text-mut hover:text-rose-600 transition-colors"
                        >
                          Clear Text
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleProcessElectionsSpreadsheet}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
                      >
                        <Table className="w-4 h-4" />
                        <span>Parse & Preview Results Grid</span>
                      </button>
                    </div>
                  </div>

                  {/* PARSED GRID PREVIEW */}
                  {electionsSpreadsheetParsed && (
                    <div className="space-y-4 pt-4 border-t border-line">
                      <div className="flex items-center justify-between">
                        <h5 className="font-display font-bold text-xs text-ink uppercase tracking-wider flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Parsed Preview ({electionsSpreadsheetParsed.rows.length} State Records)</span>
                        </h5>
                        <button
                          onClick={handleImportElectionsSpreadsheetToDB}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
                        >
                          <Save className="w-4 h-4" />
                          <span>Apply Spreadsheet Data to Live Elections</span>
                        </button>
                      </div>

                      <div className="overflow-x-auto border border-line rounded-xl bg-white max-h-80 overflow-y-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-paper border-b border-line text-[10px] font-mono font-bold text-mut uppercase">
                              <th className="p-3">#</th>
                              {electionsSpreadsheetParsed.headers.map((h, i) => (
                                <th key={i} className="p-3 font-bold text-ink whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line font-sans">
                            {electionsSpreadsheetParsed.rows.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-slate-50">
                                <td className="p-3 font-mono text-[10px] text-mut">{rIdx + 1}</td>
                                {electionsSpreadsheetParsed.headers.map((h, cIdx) => (
                                  <td key={cIdx} className="p-3 text-ink max-w-xs truncate font-mono text-[11px]">
                                    {row[h] || '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MANUAL REGISTRY & STANDINGS MODE */}
              {electionsSubMode === 'manual' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 1. Political Parties & Logo Registry */}
                <div className="lg:col-span-5 bg-paper p-5 border border-line rounded-xl space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-line">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-xs font-bold font-mono uppercase text-ink">Register Party & Logo</h4>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {Array.from(new Set([...ALL_DEFAULT_PARTIES, ...Object.keys(partyLogos), ...Object.keys(partyFullNames)])).length} Parties Total
                    </span>
                  </div>

                  <form onSubmit={handleSavePartyLogo} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase font-bold text-mut">Party Acronym *</label>
                        <input 
                          type="text" 
                          value={partyCodeForm}
                          onChange={(e) => setPartyCodeForm(e.target.value.toUpperCase())}
                          placeholder="e.g. NNPP, AAC, ZLP"
                          className="w-full text-xs p-2.5 border border-line rounded-lg bg-white uppercase font-mono font-bold"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase font-bold text-mut">Full Party Name</label>
                        <input 
                          type="text" 
                          value={partyFullNameForm}
                          onChange={(e) => setPartyFullNameForm(e.target.value)}
                          placeholder="e.g. New Nigeria Peoples Party"
                          className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-sans text-ink"
                        />
                      </div>
                    </div>

                    <FileUploadField 
                      label="Upload Party Logo or Image Emblem" 
                      accept="image/*"
                      value={partyLogoForm}
                      onChange={(val) => setPartyLogoForm(val)}
                    />

                    <button 
                      type="submit" 
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold uppercase text-[10px] rounded-lg tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Save & Register Party
                    </button>
                  </form>

                  <div className="space-y-2 pt-2 border-t border-line">
                    <div className="flex items-center justify-between">
                      <span className="block text-[10px] font-mono uppercase font-bold text-mut">Registered Parties Directory</span>
                      <input 
                        type="text"
                        value={partySearch}
                        onChange={(e) => setPartySearch(e.target.value)}
                        placeholder="Search party..."
                        className="text-[10px] p-1 px-2 border border-line rounded bg-white w-28 font-mono"
                      />
                    </div>

                    <div className="border border-line rounded-lg divide-y divide-line overflow-hidden max-h-[320px] overflow-y-auto bg-white">
                      {Array.from(new Set([...ALL_DEFAULT_PARTIES, ...Object.keys(partyLogos), ...Object.keys(partyFullNames)]))
                        .sort()
                        .filter(p => p.toLowerCase().includes(partySearch.toLowerCase()) || (partyFullNames[p] || DEFAULT_PARTY_NAMES[p] || '').toLowerCase().includes(partySearch.toLowerCase()))
                        .map(party => {
                          const hasCustomLogo = !!partyLogos[party];
                          const fullName = partyFullNames[party] || DEFAULT_PARTY_NAMES[party] || `${party} Political Party`;
                          return (
                            <div key={party} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <PartyLogo name={party} className="w-8 h-8 rounded border border-line shrink-0" />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold font-mono text-ink">{party}</span>
                                    {hasCustomLogo ? (
                                      <span className="text-[8px] bg-indigo-50 text-indigo-700 font-mono px-1.5 py-0.5 rounded border border-indigo-200">
                                        Custom Logo
                                      </span>
                                    ) : (
                                      <span className="text-[8px] bg-slate-100 text-slate-500 font-mono px-1.5 py-0.5 rounded">
                                        Vector Icon
                                      </span>
                                    )}
                                  </div>
                                  <span className="block text-[10px] text-mut truncate max-w-[180px]" title={fullName}>
                                    {fullName}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button 
                                  onClick={() => {
                                    setPartyCodeForm(party);
                                    setPartyFullNameForm(fullName);
                                    if (partyLogos[party]) setPartyLogoForm(partyLogos[party]);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                  className="text-[10px] px-2 py-1 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded font-mono font-semibold cursor-pointer"
                                  title="Edit party details"
                                >
                                  Edit
                                </button>
                                {hasCustomLogo && (
                                  <button 
                                    onClick={() => {
                                      triggerConfirm(`Restore default vector logo for ${party}?`, () => {
                                        handleDeletePartyLogo(party);
                                      });
                                    }}
                                    className="text-[10px] px-1.5 py-1 text-rose-600 hover:underline font-mono cursor-pointer"
                                    title="Restore default icon"
                                  >
                                    Restore
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* 2. Electoral Standings & Core State Stats */}
                <div className="lg:col-span-7 bg-paper p-5 border border-line rounded-xl space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-line">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-xs font-bold font-mono uppercase text-ink">Electoral Standings & Key Metrics</h4>
                    </div>
                    <div>
                      <select 
                        value={selectedStateCode}
                        onChange={(e) => setSelectedStateCode(e.target.value)}
                        className="text-xs p-1.5 border border-line rounded bg-white font-semibold font-mono"
                      >
                        {statesList.map(s => (
                          <option key={s.code} value={s.code}>{s.name} State</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <form onSubmit={handleSaveStateCMS} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase font-bold text-mut">Election Title</label>
                        <input 
                          type="text" 
                          value={activeCMSState.election || ''}
                          onChange={(e) => {
                            const updated = statesList.map(s => s.code === selectedStateCode ? { ...s, election: e.target.value } : s);
                            setStatesList(updated);
                          }}
                          className="w-full text-xs p-2.5 border border-line rounded-lg bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase font-bold text-mut">Status</label>
                        <select 
                          value={activeCMSState.status || ''}
                          onChange={(e) => {
                            const updated = statesList.map(s => s.code === selectedStateCode ? { ...s, status: e.target.value } : s);
                            setStatesList(updated);
                          }}
                          className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-mono"
                        >
                          <option value="Upcoming">Upcoming (Live)</option>
                          <option value="Concluded">Concluded (Past)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase font-bold text-mut">Date / Period</label>
                        <input 
                          type="text" 
                          value={activeCMSState.date || ''}
                          onChange={(e) => {
                            const updated = statesList.map(s => s.code === selectedStateCode ? { ...s, date: e.target.value } : s);
                            setStatesList(updated);
                          }}
                          className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase font-bold text-mut">Total Registered Voters</label>
                        <input 
                          type="text" 
                          value={activeCMSState.voters || ''}
                          onChange={(e) => {
                            const updated = statesList.map(s => s.code === selectedStateCode ? { ...s, voters: e.target.value } : s);
                            setStatesList(updated);
                          }}
                          className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase font-bold text-mut">No. of accredited voters</label>
                        <input 
                          type="number" 
                          value={activeCMSState.accreditedVoters || ''}
                          onChange={(e) => {
                            const updated = statesList.map(s => s.code === selectedStateCode ? { ...s, accreditedVoters: Number(e.target.value) } : s);
                            setStatesList(updated);
                          }}
                          placeholder="Only for Concluded"
                          className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase font-bold text-mut">Polling Units</label>
                        <input 
                          type="text" 
                          value={activeCMSState.pollingUnits || ''}
                          onChange={(e) => {
                            const updated = statesList.map(s => s.code === selectedStateCode ? { ...s, pollingUnits: e.target.value } : s);
                            setStatesList(updated);
                          }}
                          className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase font-bold text-mut">No. of LGAs</label>
                        <input 
                          type="number" 
                          value={activeCMSState.numLgas || ''}
                          onChange={(e) => {
                            const updated = statesList.map(s => s.code === selectedStateCode ? { ...s, numLgas: Number(e.target.value) } : s);
                            setStatesList(updated);
                          }}
                          className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase font-bold text-mut">No. of Wards</label>
                        <input 
                          type="number" 
                          value={activeCMSState.numWards || ''}
                          onChange={(e) => {
                            const updated = statesList.map(s => s.code === selectedStateCode ? { ...s, numWards: Number(e.target.value) } : s);
                            setStatesList(updated);
                          }}
                          className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase font-bold text-mut">Valid Votes</label>
                        <input 
                          type="number" 
                          value={activeCMSState.validVotes || ''}
                          onChange={(e) => {
                            const updated = statesList.map(s => s.code === selectedStateCode ? { ...s, validVotes: Number(e.target.value) } : s);
                            setStatesList(updated);
                          }}
                          className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase font-bold text-mut">Rejected Votes</label>
                        <input 
                          type="number" 
                          value={activeCMSState.rejectedVotes || ''}
                          onChange={(e) => {
                            const updated = statesList.map(s => s.code === selectedStateCode ? { ...s, rejectedVotes: Number(e.target.value) } : s);
                            setStatesList(updated);
                          }}
                          className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase font-bold text-mut">Total Votes</label>
                        <input 
                          type="number" 
                          value={activeCMSState.totalVotes || ''}
                          onChange={(e) => {
                            const updated = statesList.map(s => s.code === selectedStateCode ? { ...s, totalVotes: Number(e.target.value) } : s);
                            setStatesList(updated);
                          }}
                          className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-mono"
                        />
                      </div>
                      <div className="space-y-1 col-span-2">
                        <label className="block text-[10px] font-mono uppercase font-bold text-mut">Reconciliation / Audit Rate</label>
                        <input 
                          type="text" 
                          value={activeCMSState.reconciledRate || ''}
                          onChange={(e) => {
                            const updated = statesList.map(s => s.code === selectedStateCode ? { ...s, reconciledRate: e.target.value } : s);
                            setStatesList(updated);
                          }}
                          className="w-full text-xs p-2.5 border border-line rounded-lg bg-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase font-bold text-mut">Audit / Election Summary</label>
                      <textarea 
                        value={activeCMSState.summary || ''}
                        onChange={(e) => {
                          const updated = statesList.map(s => s.code === selectedStateCode ? { ...s, summary: e.target.value } : s);
                          setStatesList(updated);
                        }}
                        rows={3}
                        className="w-full text-xs p-2.5 border border-line rounded-lg bg-white"
                      />
                    </div>

                    {/* Parties details inside the state */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between border-b border-line pb-1.5">
                        <span className="block text-[10px] font-mono uppercase font-bold text-ink">Participating Parties in {activeCMSState.name} Election</span>
                        <span className="text-[9px] text-mut italic">Ensure percentages sum cleanly</span>
                      </div>

                      <div className="border border-line rounded-lg overflow-hidden divide-y divide-line bg-white">
                        {activeCMSState.topParties && activeCMSState.topParties.map((p: any, idx: number) => (
                          <div key={idx} className="p-3 bg-white grid grid-cols-12 gap-2 items-center text-xs hover:bg-slate-50">
                            <div className="col-span-2 flex items-center gap-1.5 font-mono font-bold">
                              <PartyLogo name={p.name} className="w-5 h-5 shrink-0" />
                              <span className="truncate">{p.name}</span>
                            </div>
                            <div className="col-span-4">
                              <input 
                                type="text"
                                value={p.fullName || ''}
                                onChange={(e) => {
                                  const updatedParties = [...activeCMSState.topParties];
                                  updatedParties[idx] = { ...p, fullName: e.target.value };
                                  const updated = statesList.map(s => s.code === selectedStateCode ? { ...s, topParties: updatedParties } : s);
                                  setStatesList(updated);
                                }}
                                className="w-full text-[11px] p-1 border border-line rounded bg-slate-50 font-sans"
                                placeholder="Full Name"
                              />
                            </div>
                            <div className="col-span-2">
                              <input 
                                type="text"
                                value={p.votes || ''}
                                onChange={(e) => {
                                  const updatedParties = [...activeCMSState.topParties];
                                  updatedParties[idx] = { ...p, votes: e.target.value };
                                  const updated = statesList.map(s => s.code === selectedStateCode ? { ...s, topParties: updatedParties } : s);
                                  setStatesList(updated);
                                }}
                                className="w-full text-[11px] p-1 border border-line rounded bg-slate-50 font-mono"
                                placeholder="e.g. Registered or 12,345"
                              />
                            </div>
                            <div className="col-span-2 flex items-center gap-1 font-mono">
                              <input 
                                type="number"
                                step="0.1"
                                value={p.percentage || 0}
                                onChange={(e) => {
                                  const updatedParties = [...activeCMSState.topParties];
                                  updatedParties[idx] = { ...p, percentage: parseFloat(e.target.value) || 0 };
                                  const updated = statesList.map(s => s.code === selectedStateCode ? { ...s, topParties: updatedParties } : s);
                                  setStatesList(updated);
                                }}
                                className="w-12 text-[11px] p-1 border border-line rounded bg-slate-50 text-right"
                              />
                              <span>%</span>
                            </div>
                            <div className="col-span-2 flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleMovePartyInState(idx, 'up')}
                                disabled={idx === 0}
                                className="p-1 text-slate-400 hover:text-brand-blue disabled:opacity-20 disabled:hover:text-slate-400 rounded transition-colors cursor-pointer disabled:cursor-not-allowed"
                                title="Move Up"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMovePartyInState(idx, 'down')}
                                disabled={idx === activeCMSState.topParties.length - 1}
                                className="p-1 text-slate-400 hover:text-brand-blue disabled:opacity-20 disabled:hover:text-slate-400 rounded transition-colors cursor-pointer disabled:cursor-not-allowed"
                                title="Move Down"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                type="button"
                                onClick={() => {
                                  triggerConfirm(`Remove ${p.name} from ${activeCMSState.name} election standings?`, () => {
                                    handleRemovePartyFromState(p.name);
                                  });
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer ml-1"
                                title={`Remove ${p.name} from state`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add party to state standing form */}
                      <div className="bg-slate-50 p-3 border border-line rounded-lg space-y-2">
                        <span className="block text-[10px] font-mono uppercase font-bold text-indigo-700">Add Party to {activeCMSState.name} Election</span>
                        <div className="grid grid-cols-12 gap-2 text-xs">
                          <div className="col-span-3">
                            <input 
                              type="text" 
                              value={newPartyCode}
                              onChange={(e) => {
                                const val = e.target.value.toUpperCase();
                                setNewPartyCode(val);
                                if (partyFullNames[val] || DEFAULT_PARTY_NAMES[val]) {
                                  setNewPartyFullName(partyFullNames[val] || DEFAULT_PARTY_NAMES[val]);
                                }
                              }}
                              placeholder="Acronym (e.g. NNPP)"
                              className="w-full text-[11px] p-1.5 border border-line rounded bg-white font-mono font-bold uppercase"
                              list="registered-parties-list"
                            />
                            <datalist id="registered-parties-list">
                              {Array.from(new Set([...ALL_DEFAULT_PARTIES, ...Object.keys(partyLogos), ...Object.keys(partyFullNames)])).map(p => (
                                <option key={p} value={p}>{partyFullNames[p] || DEFAULT_PARTY_NAMES[p] || p}</option>
                              ))}
                            </datalist>
                          </div>
                          <div className="col-span-4">
                            <input 
                              type="text" 
                              value={newPartyFullName}
                              onChange={(e) => setNewPartyFullName(e.target.value)}
                              placeholder="Full Party Name"
                              className="w-full text-[11px] p-1.5 border border-line rounded bg-white font-sans"
                            />
                          </div>
                          <div className="col-span-3">
                            <input 
                              type="text" 
                              value={newPartyVotes}
                              onChange={(e) => setNewPartyVotes(e.target.value)}
                              placeholder="Votes (e.g. 5,432 votes)"
                              className="w-full text-[11px] p-1.5 border border-line rounded bg-white font-mono"
                            />
                          </div>
                          <div className="col-span-2 flex items-center justify-end">
                            <button 
                              type="button"
                              onClick={handleAddPartyToState}
                              className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold uppercase text-[10px] rounded transition-colors cursor-pointer"
                            >
                              Add Party
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button 
                        type="submit" 
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold uppercase text-[10px] rounded-lg tracking-wider transition-all shadow cursor-pointer flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save State Standings & Stats
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        </div>

        {/* Footer info line */}
        <div className="bg-paper border-t border-line px-6 py-3 flex items-center justify-between text-[11px] text-mut">
          <span>Athena Election Observatory Core Engine v2.0.4</span>
          <span className="font-mono">Offline-First Local Storage Engine</span>
        </div>

      </div>

      {/* Elegant Custom Confirmation Modal Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white border border-line rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-display font-bold text-lg text-ink">
              Confirm Action
            </h3>
            <p className="text-sm text-ink2 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-xs font-semibold text-mut hover:text-ink bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
