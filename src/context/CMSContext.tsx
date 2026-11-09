import { createContext, useContext, useState, useEffect, ReactNode, Dispatch, SetStateAction, useCallback } from 'react';
import { Report, DiaryItem, EventItem, TeamMember, WeeklyIssue, HeroConfig, StatItemConfig, AnnouncementItem } from '../types';
import { 
  REPORTS as initialReports, 
  DIARY_NATIONAL as initialDiaryNat, 
  DIARY_LOCAL as initialDiaryLoc, 
  DIARY_AFRICA as initialDiaryAfr, 
  DIARY_OTHER as initialDiaryOth, 
  EVENTS as initialEvents, 
  TEAM as initialTeam, 
  WEEKLY_ISSUES as initialWeekly,
  ANNOUNCEMENTS as initialAnnouncements
} from '../data';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, getDoc, runTransaction } from 'firebase/firestore';
import { saveAssetToFirestore, loadAssetFromFirestore, removeUndefined } from '../lib/firebaseAssets';
import { handleFirestoreError, OperationType } from '../lib/firebaseError';
import { sortItemsByDate } from '../utils/date';
import { generateSlug } from '../utils/url';
import { DcmPublication } from '../types/dcm';
import { INITIAL_DCM_PUBLICATIONS } from '../data/dcmInitialData';
import { ApeaAudit, ApeaPublicReportFile, ApeaReportDetail, APEA_DATA, PUBLIC_REPORTS, REPORT_INFO } from '../data/apeaData';

const SUPER_ADMIN_UID = 's39PbuZxqdW1x63i0SsEVE7HqGQ2';

const INITIAL_HERO_CONFIG: HeroConfig = {
  badgeText: "Independent · Non-partisan · Evidence-based",
  title: "Monitoring election integrity across {Nigeria & Africa}.",
  description: "We observe, audit and report on electoral processes — anchored to primary documents and verifiable data, never to rumour. From live monitoring to forensic post-election analysis.",
  exploreButtonText: "Explore the EHII Index",
  auditButtonText: "Audit Reports",
  spotlightBadgeText: "Next election in view",
  spotlightStatusText: "IREV Data",
  spotlightTitle: "Osun State Governorship",
  spotlightDateText: "Saturday, 15 August 2026 · INEC Monitored",
  spotlightTargetDate: "2026-08-15T08:00:00+01:00",
  lgasCount: "30 LGAs + Area Office",
  registeredVoters: "2,339,233 voters",
  pollingUnits: "3,763 PUs",
  spotlightBottomText: "Athena is deploying 1,200 trained field observers to map BVAS compliance and upload forms EC8A to our independent verification pipeline.",
  diaryLinkText: "Open the Diary of Election",
  
  heroBgColor: "#1E3A5F",
  titleFontSize: "text-4xl sm:text-5xl lg:text-6xl",
  titleFontFamily: "font-display",
  titleColor: "#FFFFFF",
  titleHighlightFrom: "#93C5FD",
  titleHighlightTo: "#86EFAC",
  descriptionFontSize: "text-base sm:text-lg",
  descriptionFontFamily: "font-sans",
  descriptionColor: "#DBEAFE"
};

const INITIAL_STATS_CONFIG: StatItemConfig[] = [
  {
    id: 1,
    title: 'States Monitored',
    value: '4+',
    sub: 'Anambra · Ondo · Ekiti · Osun',
    color: 'bg-gradient-to-br from-blue-600 to-navy-dark',
    iconName: 'Shield',
    detail: 'Our state-by-state deployment maps regional irregularities, accreditation compliance, and local collation workflows.',
    cardBgType: 'gradient',
    cardBgSolid: '#1E3A5F',
    cardBgGradFrom: '#2563EB',
    cardBgGradTo: '#15304F',
    titleFontSize: 'text-xs',
    titleFontFamily: 'font-mono',
    titleColor: '#E2E8F0',
    valueFontSize: 'text-3xl sm:text-4xl',
    valueFontFamily: 'font-display',
    valueColor: '#FFFFFF'
  },
  {
    id: 2,
    title: 'Polling Units Audited',
    value: '12,000+',
    sub: 'Across recent off-cycle polls',
    color: 'bg-gradient-to-br from-green-600 to-green-950',
    iconName: 'Database',
    detail: 'Every single audited unit has its Form EC8A manually cross-checked with BVAS machine registers for discrepancy metrics.',
    cardBgType: 'gradient',
    cardBgSolid: '#166534',
    cardBgGradFrom: '#16A34A',
    cardBgGradTo: '#14532D',
    titleFontSize: 'text-xs',
    titleFontFamily: 'font-mono',
    titleColor: '#DCFCE7',
    valueFontSize: 'text-3xl sm:text-4xl',
    valueFontFamily: 'font-display',
    valueColor: '#FFFFFF'
  },
  {
    id: 3,
    title: 'Reports Published',
    value: '10+',
    sub: 'Forensic & analytical',
    color: 'bg-gradient-to-br from-brand-purple to-purple-950',
    iconName: 'FileSpreadsheet',
    detail: 'Includes peer-reviewed technology security whitepapers, post-election litigation reports, and procedural recommendations.',
    cardBgType: 'gradient',
    cardBgSolid: '#6B21A8',
    cardBgGradFrom: '#7C3AED',
    cardBgGradTo: '#3B0764',
    titleFontSize: 'text-xs',
    titleFontFamily: 'font-mono',
    titleColor: '#F3E8FF',
    valueFontSize: 'text-3xl sm:text-4xl',
    valueFontFamily: 'font-display',
    valueColor: '#FFFFFF'
  },
  {
    id: 4,
    title: 'Countries Tracked',
    value: '15',
    sub: 'Nigeria, Africa & beyond',
    color: 'bg-gradient-to-br from-slate-700 to-ink',
    iconName: 'Globe',
    detail: 'We track macro-democratic trends, regional election tribunals, and comparative electoral administration across West Africa.',
    cardBgType: 'gradient',
    cardBgSolid: '#374151',
    cardBgGradFrom: '#4B5563',
    cardBgGradTo: '#111827',
    titleFontSize: 'text-xs',
    titleFontFamily: 'font-mono',
    titleColor: '#F3F4F6',
    valueFontSize: 'text-3xl sm:text-4xl',
    valueFontFamily: 'font-display',
    valueColor: '#FFFFFF'
  }
];

interface CMSContextType {
  reports: Report[];
  diaryNat: DiaryItem[];
  diaryLoc: DiaryItem[];
  diaryAfr: DiaryItem[];
  diaryOth: DiaryItem[];
  events: EventItem[];
  announcements: AnnouncementItem[];
  team: TeamMember[];
  weekly: WeeklyIssue[];
  heroConfig: HeroConfig;
  statsConfig: StatItemConfig[];
  dataLoaded: boolean;
  
  // Update/Add/Delete handlers
  saveReport: (report: Report) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
  
  saveDiaryItem: (category: 'national' | 'local' | 'africa' | 'other', item: DiaryItem) => Promise<void>;
  deleteDiaryItem: (category: 'national' | 'local' | 'africa' | 'other', id: string) => Promise<void>;
  
  saveEvent: (event: EventItem) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  saveAnnouncement: (announcement: AnnouncementItem) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  
  saveTeamMember: (member: TeamMember) => Promise<void>;
  deleteTeamMember: (id: string) => Promise<void>;
  
  saveWeeklyIssue: (issue: WeeklyIssue) => Promise<void>;
  deleteWeeklyIssue: (id: string) => Promise<void>;
  
  saveHeroConfig: (config: HeroConfig) => Promise<void>;
  saveStatsConfig: (config: StatItemConfig[]) => Promise<void>;

  dcmPublications: DcmPublication[];
  saveDcmPublication: (pub: DcmPublication) => Promise<void>;
  deleteDcmPublication: (id: string) => Promise<void>;

  apeaAudits: ApeaAudit[];
  apeaPublicReports: Record<string, ApeaPublicReportFile>;
  apeaReportInfo: Record<string, ApeaReportDetail>;
  saveApeaAudit: (audit: ApeaAudit) => Promise<void>;
  deleteApeaAudit: (code: string) => Promise<void>;
  saveApeaReportPdf: (code: string, reportFile: ApeaPublicReportFile) => Promise<void>;
  saveApeaReportInfo: (code: string, detail: ApeaReportDetail) => Promise<void>;
  resetApeaData: () => Promise<void>;

  incrementPublicationStat: (type: 'report' | 'weekly' | 'announcement', id: string, statType: 'reads' | 'downloads') => Promise<void>;
  resetAllData: (confirmationPhrase?: string) => Promise<void>;
  restorePublicationsBackup: () => Promise<{ success: boolean; count: number }>;
  refreshData: () => Promise<void>;
  exportAllDataJson: () => string;
  importDataJson: (jsonStr: string, confirmationPhrase?: string) => Promise<{ success: boolean; message: string }>;
}

const CMSContext = createContext<CMSContextType | undefined>(undefined);

// Helper to apply remote collection updates from Firestore as authoritative source of truth,
// while preserving in-memory base64 PDF/image data for items referencing asset docs until hydration completes.
function applyRemoteCollection<T extends { id: string; pdfUrl?: string; image?: string; date?: string; title?: string }>(
  localItems: T[],
  remoteItems: T[]
): T[] {
  if (!remoteItems || !Array.isArray(remoteItems)) return localItems || [];

  const localMap = new Map((localItems || []).map(item => [item.id, item]));

  const merged = remoteItems.map(remoteItem => {
    const localMatch = localMap.get(remoteItem.id);
    const itemCopy = { ...remoteItem } as any;

    if (itemCopy.title && !itemCopy.slug) {
      itemCopy.slug = generateSlug(itemCopy.title);
    }

    if (itemCopy.pdfUrl && itemCopy.pdfUrl.startsWith('ref:')) {
      if (localMatch && localMatch.pdfUrl && !localMatch.pdfUrl.startsWith('ref:')) {
        itemCopy.pdfUrl = localMatch.pdfUrl;
      }
    }

    if (itemCopy.image && itemCopy.image.startsWith('ref:')) {
      if (localMatch && localMatch.image && !localMatch.image.startsWith('ref:')) {
        itemCopy.image = localMatch.image;
      }
    }

    // Preserve existing local reads & downloads counters if remote item does not define them
    if (typeof itemCopy.reads !== 'number' && typeof (localMatch as any)?.reads === 'number') {
      itemCopy.reads = (localMatch as any).reads;
    }
    if (typeof itemCopy.downloads !== 'number' && typeof (localMatch as any)?.downloads === 'number') {
      itemCopy.downloads = (localMatch as any).downloads;
    }

    return itemCopy as T;
  });

  return sortItemsByDate(merged, 'date', 'desc');
}

// Sanitizes item heavy assets before saving to collection array document
async function sanitizeItemAssets(item: any): Promise<any> {
  if (!item || !item.id) return item;
  const copy = { ...item };
  if (copy.pdfUrl && copy.pdfUrl.startsWith('data:')) {
    const refKey = await saveAssetToFirestore('pdf', copy.id, copy.pdfUrl);
    copy.pdfUrl = refKey;
  }
  if (copy.image && copy.image.startsWith('data:')) {
    const refKey = await saveAssetToFirestore('img', copy.id, copy.image);
    copy.image = refKey;
  }
  return removeUndefined(copy);
}

// Automatic multi-layer backup to protect against data wipe
const saveBackupSnapshot = async (
  currentReports: Report[],
  currentWeekly: WeeklyIssue[],
  currentAnnouncements: AnnouncementItem[]
) => {
  try {
    const payload = {
      reports: currentReports.map(r => ({
        ...r,
        pdfUrl: r.pdfUrl?.startsWith('data:') ? `ref:pdf_${r.id}` : r.pdfUrl,
        image: r.image?.startsWith('data:') ? `ref:img_${r.id}` : r.image
      })),
      weekly: currentWeekly.map(w => ({
        ...w,
        pdfUrl: w.pdfUrl?.startsWith('data:') ? `ref:pdf_${w.id}` : w.pdfUrl,
        image: w.image?.startsWith('data:') ? `ref:img_${w.id}` : w.image
      })),
      announcements: currentAnnouncements,
      backedUpAt: Date.now()
    };

    // 1. Cloud Firestore backup document
    await setDoc(doc(db, 'cms', 'publications_backup'), removeUndefined(payload));

    // 2. Browser LocalStorage backup
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('aeo_publications_backup', JSON.stringify(payload));
      } catch (e) {
        // LocalStorage quota limit ignored
      }
    }
  } catch (err) {
    console.warn('Backup snapshot error:', err);
    handleFirestoreError(err, OperationType.WRITE, 'cms/publications_backup');
  }
};

export function CMSProvider({ children }: { children: ReactNode }) {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [diaryNat, setDiaryNat] = useState<DiaryItem[]>(initialDiaryNat);
  const [diaryLoc, setDiaryLoc] = useState<DiaryItem[]>(initialDiaryLoc);
  const [diaryAfr, setDiaryAfr] = useState<DiaryItem[]>(initialDiaryAfr);
  const [diaryOth, setDiaryOth] = useState<DiaryItem[]>(initialDiaryOth);
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(initialAnnouncements);
  const [team, setTeam] = useState<TeamMember[]>(initialTeam);
  const [weekly, setWeekly] = useState<WeeklyIssue[]>(initialWeekly);
  const [heroConfig, setHeroConfig] = useState<HeroConfig>(INITIAL_HERO_CONFIG);
  const [statsConfig, setStatsConfig] = useState<StatItemConfig[]>(INITIAL_STATS_CONFIG);
  const [dcmPublications, setDcmPublications] = useState<DcmPublication[]>(INITIAL_DCM_PUBLICATIONS);
  const [apeaAudits, setApeaAudits] = useState<ApeaAudit[]>(APEA_DATA);
  const [apeaPublicReports, setApeaPublicReports] = useState<Record<string, ApeaPublicReportFile>>(PUBLIC_REPORTS);
  const [apeaReportInfo, setApeaReportInfo] = useState<Record<string, ApeaReportDetail>>(REPORT_INFO);

  // Subscribe to Firestore in Real-Time for global site sync with STRICT 100% READ-ONLY LISTENERS
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];
    let loadedCount = 0;
    const totalDocs = 13;

    const subscribeSafe = <T,>(
      docName: string, 
      setter: Dispatch<SetStateAction<T>>, 
      fallbackVal: T,
      transform?: (data: T) => T
    ) => {
      const docRef = doc(db, 'cms', docName);
      let isFirst = true;
      return onSnapshot(docRef, snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && (data.items !== undefined || data.config !== undefined)) {
            let raw = data.items !== undefined ? data.items : data.config;

            if (Array.isArray(raw)) {
              raw = raw.filter((item: any) => item && item.id);
            }

            const finalVal = transform ? transform(raw as T) : (raw as T);
            if (Array.isArray(finalVal)) {
              setter(localVal => applyRemoteCollection(localVal as any, finalVal as any) as unknown as T);
            } else {
              setter(finalVal);
            }
          }
        } else {
          // Document does NOT exist in Firestore:
          // CRITICAL REQUIREMENT: 100% READ-ONLY! Set local fallback state, NEVER call setDoc or syncToFirestore!
          setter(fallbackVal);
        }
        
        if (isFirst) {
          isFirst = false;
          loadedCount++;
          if (loadedCount >= totalDocs) {
            setDataLoaded(true);
          }
        }
      }, err => {
        console.warn(`Firestore snapshot error for ${docName}:`, err);
        handleFirestoreError(err, OperationType.GET, `cms/${docName}`);
        if (isFirst) {
          isFirst = false;
          loadedCount++;
          if (loadedCount >= totalDocs) {
            setDataLoaded(true);
          }
        }
      });
    };

    unsubscribes.push(subscribeSafe('reports', setReports, initialReports));
    unsubscribes.push(subscribeSafe('diary_nat', setDiaryNat, initialDiaryNat));
    unsubscribes.push(subscribeSafe('diary_loc', setDiaryLoc, initialDiaryLoc));
    unsubscribes.push(subscribeSafe('diary_afr', setDiaryAfr, initialDiaryAfr));
    unsubscribes.push(subscribeSafe('diary_oth', setDiaryOth, initialDiaryOth));
    unsubscribes.push(subscribeSafe('events', setEvents, initialEvents));
    unsubscribes.push(subscribeSafe('announcements', setAnnouncements, initialAnnouncements));
    unsubscribes.push(subscribeSafe('team', setTeam, initialTeam));
    unsubscribes.push(subscribeSafe('weekly', setWeekly, initialWeekly));
    unsubscribes.push(subscribeSafe('hero', setHeroConfig, INITIAL_HERO_CONFIG, (cfg: HeroConfig) => {
      if (cfg.spotlightStatusText === 'Off-Cycle') cfg.spotlightStatusText = 'IREV Data';
      if (cfg.registeredVoters === '1,955,657 voters' || cfg.registeredVoters === '1,955,657') {
        cfg.registeredVoters = '2,339,233 voters';
      }
      return cfg;
    }));
    unsubscribes.push(subscribeSafe('stats', setStatsConfig, INITIAL_STATS_CONFIG));
    unsubscribes.push(subscribeSafe('dcm_publications', setDcmPublications, INITIAL_DCM_PUBLICATIONS));

    // Custom listener for APEA audits document
    const apeaDocRef = doc(db, 'cms', 'apea_audits');
    unsubscribes.push(onSnapshot(apeaDocRef, snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data?.audits && Array.isArray(data.audits)) {
          setApeaAudits(data.audits);
        }
        if (data?.reports && typeof data.reports === 'object') {
          setApeaPublicReports(prev => ({ ...prev, ...data.reports }));
        }
        if (data?.reportInfo && typeof data.reportInfo === 'object') {
          setApeaReportInfo(prev => ({ ...prev, ...data.reportInfo }));
        }
      }
    }, err => {
      console.warn('Firestore snapshot error for apea_audits:', err);
    }));

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);

  // Sync individual PDF and Image documents from Firestore once live data is connected
  useEffect(() => {
    if (!dataLoaded) return;
    let cancelled = false;

    const hydrateAssets = async () => {
      // Hydrate Reports
      for (const r of reports) {
        if (cancelled) return;
        if (r.id && r.pdfUrl && r.pdfUrl.startsWith('ref:')) {
          try {
            const fullPdf = await loadAssetFromFirestore('pdf', r.pdfUrl);
            if (fullPdf && !cancelled) {
              setReports(prev => prev.map(item => item.id === r.id ? { ...item, pdfUrl: fullPdf } : item));
            }
          } catch (e) {
            console.warn(`Could not hydrate PDF for ${r.id}:`, e);
          }
        }
        if (r.id && r.image && r.image.startsWith('ref:')) {
          try {
            const fullImg = await loadAssetFromFirestore('img', r.image);
            if (fullImg && !cancelled) {
              setReports(prev => prev.map(item => item.id === r.id ? { ...item, image: fullImg } : item));
            }
          } catch (e) {
            console.warn(`Could not hydrate image for ${r.id}:`, e);
          }
        }
      }

      // Hydrate Weekly Issues
      for (const w of weekly) {
        if (cancelled) return;
        if (w.id && w.pdfUrl && w.pdfUrl.startsWith('ref:')) {
          try {
            const fullPdf = await loadAssetFromFirestore('pdf', w.pdfUrl);
            if (fullPdf && !cancelled) {
              setWeekly(prev => prev.map(item => item.id === w.id ? { ...item, pdfUrl: fullPdf } : item));
            }
          } catch (e) {
            console.warn(`Could not hydrate weekly PDF for ${w.id}:`, e);
          }
        }
        if (w.id && w.image && w.image.startsWith('ref:')) {
          try {
            const fullImg = await loadAssetFromFirestore('img', w.image);
            if (fullImg && !cancelled) {
              setWeekly(prev => prev.map(item => item.id === w.id ? { ...item, image: fullImg } : item));
            }
          } catch (e) {
            console.warn(`Could not hydrate weekly image for ${w.id}:`, e);
          }
        }
      }

      // Hydrate Announcements
      for (const a of announcements) {
        if (cancelled) return;
        if (a.id && a.pdfUrl && a.pdfUrl.startsWith('ref:')) {
          try {
            const fullPdf = await loadAssetFromFirestore('pdf', a.pdfUrl);
            if (fullPdf && !cancelled) {
              setAnnouncements(prev => prev.map(item => item.id === a.id ? { ...item, pdfUrl: fullPdf } : item));
            }
          } catch (e) {
            console.warn(`Could not hydrate announcement PDF for ${a.id}:`, e);
          }
        }
        if (a.id && a.image && a.image.startsWith('ref:')) {
          try {
            const fullImg = await loadAssetFromFirestore('img', a.image);
            if (fullImg && !cancelled) {
              setAnnouncements(prev => prev.map(item => item.id === a.id ? { ...item, image: fullImg } : item));
            }
          } catch (e) {
            console.warn(`Could not hydrate announcement image for ${a.id}:`, e);
          }
        }
      }
    };

    hydrateAssets();

    return () => {
      cancelled = true;
    };
  }, [
    dataLoaded,
    reports.map(r => r.id + (r.pdfUrl ? r.pdfUrl.substring(0, 8) : '') + (r.image ? r.image.substring(0, 8) : '')).join(','),
    weekly.map(w => w.id + (w.pdfUrl ? w.pdfUrl.substring(0, 8) : '') + (w.image ? w.image.substring(0, 8) : '')).join(','),
    announcements.map(a => a.id + (a.pdfUrl ? a.pdfUrl.substring(0, 8) : '') + (a.image ? a.image.substring(0, 8) : '')).join(',')
  ]);

  // SAFE TRANSACTIONAL MUTATION HANDLERS
  // Reads live authoritative document state directly within runTransaction to prevent race conditions

  const saveReport = async (report: Report) => {
    const path = 'cms/reports';
    try {
      const sanitizedReport = await sanitizeItemAssets({
        ...report,
        slug: report.slug ? generateSlug(report.slug) : generateSlug(report.title),
        createdAt: report.createdAt || Date.now()
      });

      let updatedSorted: Report[] = [];

      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, 'cms', 'reports');
        const sfDoc = await transaction.get(docRef);
        let currentItems: Report[] = sfDoc.exists() && Array.isArray(sfDoc.data()?.items) ? sfDoc.data()!.items : [];

        const existsIndex = currentItems.findIndex(r => r.id === report.id);
        let updatedItems: Report[];
        if (existsIndex > -1) {
          const existing = currentItems[existsIndex];
          const merged: Report = {
            ...existing,
            ...sanitizedReport,
            reads: typeof report.reads === 'number' ? report.reads : (typeof existing.reads === 'number' ? existing.reads : 0),
            downloads: typeof report.downloads === 'number' ? report.downloads : (typeof existing.downloads === 'number' ? existing.downloads : 0),
          };
          updatedItems = [...currentItems];
          updatedItems[existsIndex] = merged;
        } else {
          updatedItems = [{
            ...sanitizedReport,
            reads: typeof report.reads === 'number' ? report.reads : 0,
            downloads: typeof report.downloads === 'number' ? report.downloads : 0,
          }, ...currentItems];
        }

        updatedSorted = sortItemsByDate(updatedItems, 'date', 'desc');
        transaction.set(docRef, removeUndefined({ items: updatedSorted, updatedAt: Date.now() }));
      });

      setReports(updatedSorted);
      await saveBackupSnapshot(updatedSorted, weekly, announcements);
    } catch (err) {
      console.error('Error saving report in transaction:', err);
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const deleteReport = async (id: string) => {
    const path = 'cms/reports';
    try {
      let updatedSorted: Report[] = [];

      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, 'cms', 'reports');
        const sfDoc = await transaction.get(docRef);
        let currentItems: Report[] = sfDoc.exists() && Array.isArray(sfDoc.data()?.items) ? sfDoc.data()!.items : [];

        const next = currentItems.filter(r => r.id !== id);
        updatedSorted = sortItemsByDate(next, 'date', 'desc');
        transaction.set(docRef, removeUndefined({ items: updatedSorted, updatedAt: Date.now() }));
      });

      setReports(updatedSorted);
      await saveBackupSnapshot(updatedSorted, weekly, announcements);
    } catch (err) {
      console.error('Error deleting report in transaction:', err);
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const saveWeeklyIssue = async (issue: WeeklyIssue) => {
    const path = 'cms/weekly';
    try {
      const sanitizedIssue = await sanitizeItemAssets({
        ...issue,
        slug: issue.slug ? generateSlug(issue.slug) : generateSlug(issue.title),
        createdAt: issue.createdAt || Date.now()
      });

      let updatedSorted: WeeklyIssue[] = [];

      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, 'cms', 'weekly');
        const sfDoc = await transaction.get(docRef);
        let currentItems: WeeklyIssue[] = sfDoc.exists() && Array.isArray(sfDoc.data()?.items) ? sfDoc.data()!.items : [];

        const existsIndex = currentItems.findIndex(w => w.id === issue.id);
        let updatedItems: WeeklyIssue[];
        if (existsIndex > -1) {
          const existing = currentItems[existsIndex];
          const merged: WeeklyIssue = {
            ...existing,
            ...sanitizedIssue,
            reads: typeof issue.reads === 'number' ? issue.reads : (typeof existing.reads === 'number' ? existing.reads : 0),
            downloads: typeof issue.downloads === 'number' ? issue.downloads : (typeof existing.downloads === 'number' ? existing.downloads : 0),
          };
          updatedItems = [...currentItems];
          updatedItems[existsIndex] = merged;
        } else {
          updatedItems = [{
            ...sanitizedIssue,
            reads: typeof issue.reads === 'number' ? issue.reads : 0,
            downloads: typeof issue.downloads === 'number' ? issue.downloads : 0,
          }, ...currentItems];
        }

        updatedSorted = sortItemsByDate(updatedItems, 'date', 'desc');
        transaction.set(docRef, removeUndefined({ items: updatedSorted, updatedAt: Date.now() }));
      });

      setWeekly(updatedSorted);
      await saveBackupSnapshot(reports, updatedSorted, announcements);
    } catch (err) {
      console.error('Error saving weekly issue in transaction:', err);
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const deleteWeeklyIssue = async (id: string) => {
    const path = 'cms/weekly';
    try {
      let updatedSorted: WeeklyIssue[] = [];

      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, 'cms', 'weekly');
        const sfDoc = await transaction.get(docRef);
        let currentItems: WeeklyIssue[] = sfDoc.exists() && Array.isArray(sfDoc.data()?.items) ? sfDoc.data()!.items : [];

        const next = currentItems.filter(w => w.id !== id);
        updatedSorted = sortItemsByDate(next, 'date', 'desc');
        transaction.set(docRef, removeUndefined({ items: updatedSorted, updatedAt: Date.now() }));
      });

      setWeekly(updatedSorted);
      await saveBackupSnapshot(reports, updatedSorted, announcements);
    } catch (err) {
      console.error('Error deleting weekly issue in transaction:', err);
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const saveAnnouncement = async (announcement: AnnouncementItem) => {
    const path = 'cms/announcements';
    try {
      const sanitizedAnn = await sanitizeItemAssets({
        ...announcement,
        slug: announcement.slug ? generateSlug(announcement.slug) : generateSlug(announcement.title),
        createdAt: announcement.createdAt || Date.now()
      });

      let updatedSorted: AnnouncementItem[] = [];

      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, 'cms', 'announcements');
        const sfDoc = await transaction.get(docRef);
        let currentItems: AnnouncementItem[] = sfDoc.exists() && Array.isArray(sfDoc.data()?.items) ? sfDoc.data()!.items : [];

        const existsIndex = currentItems.findIndex(a => a.id === announcement.id);
        let updatedItems: AnnouncementItem[];
        if (existsIndex > -1) {
          const existing = currentItems[existsIndex];
          const merged: AnnouncementItem = {
            ...existing,
            ...sanitizedAnn,
            reads: typeof announcement.reads === 'number' ? announcement.reads : (typeof existing.reads === 'number' ? existing.reads : 0),
            downloads: typeof announcement.downloads === 'number' ? announcement.downloads : (typeof existing.downloads === 'number' ? existing.downloads : 0),
          };
          updatedItems = [...currentItems];
          updatedItems[existsIndex] = merged;
        } else {
          updatedItems = [{
            ...sanitizedAnn,
            reads: typeof announcement.reads === 'number' ? announcement.reads : 0,
            downloads: typeof announcement.downloads === 'number' ? announcement.downloads : 0,
          }, ...currentItems];
        }

        updatedSorted = sortItemsByDate(updatedItems, 'date', 'desc');
        transaction.set(docRef, removeUndefined({ items: updatedSorted, updatedAt: Date.now() }));
      });

      setAnnouncements(updatedSorted);
      await saveBackupSnapshot(reports, weekly, updatedSorted);
    } catch (err) {
      console.error('Error saving announcement in transaction:', err);
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    const path = 'cms/announcements';
    try {
      let updatedSorted: AnnouncementItem[] = [];

      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, 'cms', 'announcements');
        const sfDoc = await transaction.get(docRef);
        let currentItems: AnnouncementItem[] = sfDoc.exists() && Array.isArray(sfDoc.data()?.items) ? sfDoc.data()!.items : [];

        const next = currentItems.filter(a => a.id !== id);
        updatedSorted = sortItemsByDate(next, 'date', 'desc');
        transaction.set(docRef, removeUndefined({ items: updatedSorted, updatedAt: Date.now() }));
      });

      setAnnouncements(updatedSorted);
      await saveBackupSnapshot(reports, weekly, updatedSorted);
    } catch (err) {
      console.error('Error deleting announcement in transaction:', err);
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const saveDiaryItem = async (category: 'national' | 'local' | 'africa' | 'other', item: DiaryItem) => {
    const docKey = category === 'national' ? 'diary_nat' : category === 'local' ? 'diary_loc' : category === 'africa' ? 'diary_afr' : 'diary_oth';
    const path = `cms/${docKey}`;
    try {
      let nextSorted: DiaryItem[] = [];

      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, 'cms', docKey);
        const sfDoc = await transaction.get(docRef);
        let current: DiaryItem[] = sfDoc.exists() && Array.isArray(sfDoc.data()?.items) ? sfDoc.data()!.items : [];

        const exists = current.some(d => d.id === item.id);
        const unsorted = exists ? current.map(d => d.id === item.id ? item : d) : [...current, item];
        nextSorted = sortItemsByDate(unsorted, 'date', 'asc');
        transaction.set(docRef, removeUndefined({ items: nextSorted, updatedAt: Date.now() }));
      });

      if (category === 'national') setDiaryNat(nextSorted);
      else if (category === 'local') setDiaryLoc(nextSorted);
      else if (category === 'africa') setDiaryAfr(nextSorted);
      else if (category === 'other') setDiaryOth(nextSorted);
    } catch (err) {
      console.error(`Error saving diary ${category} in transaction:`, err);
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const deleteDiaryItem = async (category: 'national' | 'local' | 'africa' | 'other', id: string) => {
    const docKey = category === 'national' ? 'diary_nat' : category === 'local' ? 'diary_loc' : category === 'africa' ? 'diary_afr' : 'diary_oth';
    const path = `cms/${docKey}`;
    try {
      let nextSorted: DiaryItem[] = [];

      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, 'cms', docKey);
        const sfDoc = await transaction.get(docRef);
        let current: DiaryItem[] = sfDoc.exists() && Array.isArray(sfDoc.data()?.items) ? sfDoc.data()!.items : [];

        const next = current.filter(d => d.id !== id);
        nextSorted = sortItemsByDate(next, 'date', 'asc');
        transaction.set(docRef, removeUndefined({ items: nextSorted, updatedAt: Date.now() }));
      });

      if (category === 'national') setDiaryNat(nextSorted);
      else if (category === 'local') setDiaryLoc(nextSorted);
      else if (category === 'africa') setDiaryAfr(nextSorted);
      else if (category === 'other') setDiaryOth(nextSorted);
    } catch (err) {
      console.error(`Error deleting diary ${category} in transaction:`, err);
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const saveEvent = async (event: EventItem) => {
    const path = 'cms/events';
    try {
      let nextEvents: EventItem[] = [];

      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, 'cms', 'events');
        const sfDoc = await transaction.get(docRef);
        let current: EventItem[] = sfDoc.exists() && Array.isArray(sfDoc.data()?.items) ? sfDoc.data()!.items : [];

        const exists = current.some(e => e.id === event.id);
        nextEvents = exists ? current.map(e => e.id === event.id ? event : e) : [...current, event];
        transaction.set(docRef, removeUndefined({ items: nextEvents, updatedAt: Date.now() }));
      });

      setEvents(nextEvents);
    } catch (err) {
      console.error('Error saving event in transaction:', err);
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const deleteEvent = async (id: string) => {
    const path = 'cms/events';
    try {
      let nextEvents: EventItem[] = [];

      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, 'cms', 'events');
        const sfDoc = await transaction.get(docRef);
        let current: EventItem[] = sfDoc.exists() && Array.isArray(sfDoc.data()?.items) ? sfDoc.data()!.items : [];

        nextEvents = current.filter(e => e.id !== id);
        transaction.set(docRef, removeUndefined({ items: nextEvents, updatedAt: Date.now() }));
      });

      setEvents(nextEvents);
    } catch (err) {
      console.error('Error deleting event in transaction:', err);
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const saveTeamMember = async (member: TeamMember) => {
    const path = 'cms/team';
    try {
      let nextTeam: TeamMember[] = [];

      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, 'cms', 'team');
        const sfDoc = await transaction.get(docRef);
        let current: TeamMember[] = sfDoc.exists() && Array.isArray(sfDoc.data()?.items) ? sfDoc.data()!.items : [];

        const exists = current.some(t => t.id === member.id);
        nextTeam = exists ? current.map(t => t.id === member.id ? member : t) : [...current, member];
        transaction.set(docRef, removeUndefined({ items: nextTeam, updatedAt: Date.now() }));
      });

      setTeam(nextTeam);
    } catch (err) {
      console.error('Error saving team member in transaction:', err);
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const deleteTeamMember = async (id: string) => {
    const path = 'cms/team';
    try {
      let nextTeam: TeamMember[] = [];

      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, 'cms', 'team');
        const sfDoc = await transaction.get(docRef);
        let current: TeamMember[] = sfDoc.exists() && Array.isArray(sfDoc.data()?.items) ? sfDoc.data()!.items : [];

        nextTeam = current.filter(t => t.id !== id);
        transaction.set(docRef, removeUndefined({ items: nextTeam, updatedAt: Date.now() }));
      });

      setTeam(nextTeam);
    } catch (err) {
      console.error('Error deleting team member in transaction:', err);
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const saveHeroConfig = async (config: HeroConfig) => {
    const path = 'cms/hero';
    try {
      await setDoc(doc(db, 'cms', 'hero'), removeUndefined({ config, updatedAt: Date.now() }));
      setHeroConfig(config);
    } catch (err) {
      console.error('Error saving hero config:', err);
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const saveStatsConfig = async (config: StatItemConfig[]) => {
    const path = 'cms/stats';
    try {
      await setDoc(doc(db, 'cms', 'stats'), removeUndefined({ items: config, updatedAt: Date.now() }));
      setStatsConfig(config);
    } catch (err) {
      console.error('Error saving stats config:', err);
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const saveDcmPublication = async (pub: DcmPublication) => {
    const path = 'cms/dcm_publications';
    try {
      const sanitizedPub = await sanitizeItemAssets({
        ...pub,
        updatedAt: Date.now()
      });

      let nextDcm: DcmPublication[] = [];

      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, 'cms', 'dcm_publications');
        const sfDoc = await transaction.get(docRef);
        let current: DcmPublication[] = sfDoc.exists() && Array.isArray(sfDoc.data()?.items) ? sfDoc.data()!.items : [];

        const exists = current.some(p => p.id === pub.id);
        nextDcm = exists ? current.map(p => p.id === pub.id ? sanitizedPub : p) : [sanitizedPub, ...current];
        if (pub.isLatest) {
          nextDcm = nextDcm.map(p => p.id === pub.id ? p : { ...p, isLatest: false });
        }

        nextDcm.sort((a, b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime());
        transaction.set(docRef, removeUndefined({ items: nextDcm, updatedAt: Date.now() }));
      });

      setDcmPublications(nextDcm);
    } catch (err) {
      console.error('Error saving DCM publication in transaction:', err);
      handleFirestoreError(err, OperationType.WRITE, path);
      throw err;
    }
  };

  const deleteDcmPublication = async (id: string) => {
    const path = 'cms/dcm_publications';
    try {
      let nextDcm: DcmPublication[] = [];

      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, 'cms', 'dcm_publications');
        const sfDoc = await transaction.get(docRef);
        let current: DcmPublication[] = sfDoc.exists() && Array.isArray(sfDoc.data()?.items) ? sfDoc.data()!.items : [];

        nextDcm = current.filter(p => p.id !== id);
        transaction.set(docRef, removeUndefined({ items: nextDcm, updatedAt: Date.now() }));
      });

      setDcmPublications(nextDcm);
    } catch (err) {
      console.error('Error deleting DCM publication in transaction:', err);
      handleFirestoreError(err, OperationType.DELETE, path);
      throw err;
    }
  };

  const saveApeaAudit = async (audit: ApeaAudit) => {
    const path = 'cms/apea_audits';
    try {
      let nextAudits: ApeaAudit[] = [];
      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, 'cms', 'apea_audits');
        const sfDoc = await transaction.get(docRef);
        const data = sfDoc.exists() ? sfDoc.data() : {};
        const currentAudits: ApeaAudit[] = Array.isArray(data?.audits) ? data.audits : APEA_DATA;

        const existsIdx = currentAudits.findIndex(a => a.code === audit.code);
        if (existsIdx >= 0) {
          nextAudits = [...currentAudits];
          nextAudits[existsIdx] = audit;
        } else {
          nextAudits = [audit, ...currentAudits];
        }

        const currentReports = data?.reports || apeaPublicReports;
        const currentInfo = data?.reportInfo || apeaReportInfo;

        transaction.set(docRef, removeUndefined({
          audits: nextAudits,
          reports: currentReports,
          reportInfo: currentInfo,
          updatedAt: Date.now()
        }));
      });
      setApeaAudits(nextAudits);
    } catch (err) {
      console.error('Error saving APEA audit in transaction:', err);
      handleFirestoreError(err, OperationType.WRITE, path);
      throw err;
    }
  };

  const deleteApeaAudit = async (code: string) => {
    const path = 'cms/apea_audits';
    try {
      let nextAudits: ApeaAudit[] = [];
      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, 'cms', 'apea_audits');
        const sfDoc = await transaction.get(docRef);
        const data = sfDoc.exists() ? sfDoc.data() : {};
        const currentAudits: ApeaAudit[] = Array.isArray(data?.audits) ? data.audits : APEA_DATA;

        nextAudits = currentAudits.filter(a => a.code !== code);
        const currentReports = data?.reports || apeaPublicReports;
        const currentInfo = data?.reportInfo || apeaReportInfo;

        transaction.set(docRef, removeUndefined({
          audits: nextAudits,
          reports: currentReports,
          reportInfo: currentInfo,
          updatedAt: Date.now()
        }));
      });
      setApeaAudits(nextAudits);
    } catch (err) {
      console.error('Error deleting APEA audit:', err);
      handleFirestoreError(err, OperationType.DELETE, path);
      throw err;
    }
  };

  const saveApeaReportPdf = async (code: string, reportFile: ApeaPublicReportFile) => {
    const path = 'cms/apea_audits';
    try {
      let nextReports: Record<string, ApeaPublicReportFile> = {};
      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, 'cms', 'apea_audits');
        const sfDoc = await transaction.get(docRef);
        const data = sfDoc.exists() ? sfDoc.data() : {};
        const currentReports = data?.reports || apeaPublicReports;

        nextReports = {
          ...currentReports,
          [code]: reportFile
        };

        const currentAudits = data?.audits || apeaAudits;
        const currentInfo = data?.reportInfo || apeaReportInfo;

        transaction.set(docRef, removeUndefined({
          audits: currentAudits,
          reports: nextReports,
          reportInfo: currentInfo,
          updatedAt: Date.now()
        }));
      });
      setApeaPublicReports(nextReports);
    } catch (err) {
      console.error('Error saving APEA report PDF in transaction:', err);
      handleFirestoreError(err, OperationType.WRITE, path);
      throw err;
    }
  };

  const saveApeaReportInfo = async (code: string, detail: ApeaReportDetail) => {
    const path = 'cms/apea_audits';
    try {
      let nextInfo: Record<string, ApeaReportDetail> = {};
      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, 'cms', 'apea_audits');
        const sfDoc = await transaction.get(docRef);
        const data = sfDoc.exists() ? sfDoc.data() : {};
        const currentInfo = data?.reportInfo || apeaReportInfo;

        nextInfo = {
          ...currentInfo,
          [code]: detail
        };

        const currentAudits = data?.audits || apeaAudits;
        const currentReports = data?.reports || apeaPublicReports;

        transaction.set(docRef, removeUndefined({
          audits: currentAudits,
          reports: currentReports,
          reportInfo: nextInfo,
          updatedAt: Date.now()
        }));
      });
      setApeaReportInfo(nextInfo);
    } catch (err) {
      console.error('Error saving APEA report detail in transaction:', err);
      handleFirestoreError(err, OperationType.WRITE, path);
      throw err;
    }
  };

  const resetApeaData = async () => {
    const path = 'cms/apea_audits';
    try {
      await setDoc(doc(db, 'cms', 'apea_audits'), removeUndefined({
        audits: APEA_DATA,
        reports: PUBLIC_REPORTS,
        reportInfo: REPORT_INFO,
        updatedAt: Date.now()
      }));
      setApeaAudits(APEA_DATA);
      setApeaPublicReports(PUBLIC_REPORTS);
      setApeaReportInfo(REPORT_INFO);
    } catch (err) {
      console.error('Error resetting APEA data:', err);
      handleFirestoreError(err, OperationType.WRITE, path);
      throw err;
    }
  };

  // Safe transactional stat incrementation: atomic update inside transaction without full document rewrite or asset loss
  const incrementPublicationStat = async (type: 'report' | 'weekly' | 'announcement', id: string, statType: 'reads' | 'downloads') => {
    // 1. Immediately update in-memory state so session counters increment smoothly in UI
    if (type === 'report') {
      setReports(prev => prev.map(item => item.id === id ? { ...item, [statType]: (typeof item[statType] === 'number' ? item[statType]! : 0) + 1 } : item));
    } else if (type === 'weekly') {
      setWeekly(prev => prev.map(item => item.id === id ? { ...item, [statType]: (typeof item[statType] === 'number' ? item[statType]! : 0) + 1 } : item));
    } else if (type === 'announcement') {
      setAnnouncements(prev => prev.map(item => item.id === id ? { ...item, [statType]: (typeof item[statType] === 'number' ? item[statType]! : 0) + 1 } : item));
    }

    // 2. Persist directly to Firestore via atomic transaction (accessible to all public visitors & researchers)
    const collectionKey = type === 'report' ? 'reports' : type === 'weekly' ? 'weekly' : 'announcements';
    try {
      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, 'cms', collectionKey);
        const sfDoc = await transaction.get(docRef);

        if (!sfDoc.exists()) {
          // Initialize document in Firestore if not yet stored
          let baseList: any[] = [];
          if (type === 'report') baseList = [...reports];
          else if (type === 'weekly') baseList = [...weekly];
          else if (type === 'announcement') baseList = [...announcements];

          const itemIndex = baseList.findIndex((item: any) => item && item.id === id);
          if (itemIndex > -1) {
            const currentVal = typeof baseList[itemIndex][statType] === 'number' ? baseList[itemIndex][statType] : 0;
            baseList[itemIndex] = { ...baseList[itemIndex], [statType]: currentVal + 1 };
          }
          transaction.set(docRef, removeUndefined({ items: baseList, updatedAt: Date.now() }));
          return;
        }

        const data = sfDoc.data();
        const items = Array.isArray(data?.items) ? [...data.items] : [];
        const itemIndex = items.findIndex((item: any) => item && item.id === id);

        if (itemIndex > -1) {
          const item = { ...items[itemIndex] };
          const currentValue = typeof item[statType] === 'number' ? item[statType] : 0;
          item[statType] = currentValue + 1;
          items[itemIndex] = item;
          transaction.update(docRef, { items, updatedAt: Date.now() });
        } else {
          // If the item exists in local state but was not yet pushed to Firestore
          let fallbackItem: any = null;
          if (type === 'report') fallbackItem = reports.find(r => r.id === id);
          else if (type === 'weekly') fallbackItem = weekly.find(w => w.id === id);
          else if (type === 'announcement') fallbackItem = announcements.find(a => a.id === id);

          if (fallbackItem) {
            const currentVal = typeof fallbackItem[statType] === 'number' ? fallbackItem[statType] : 0;
            const newItem = { ...fallbackItem, [statType]: currentVal + 1 };
            items.push(newItem);
            transaction.update(docRef, { items, updatedAt: Date.now() });
          }
        }
      });
    } catch (error) {
      console.warn(`Stat increment skipped in Firestore for ${type} ${id}:`, error);
    }
  };

  // Reset function requiring Super Admin UID and explicit confirmation string, NEVER destroying publication collections!
  const resetAllData = async (confirmationPhrase?: string) => {
    const currentUid = auth.currentUser?.uid;
    if (currentUid !== SUPER_ADMIN_UID) {
      throw new Error("Unauthorized: Only the permanent Super Administrator can reset CMS templates.");
    }

    if (!confirmationPhrase || confirmationPhrase.trim().toUpperCase() !== 'CONFIRM RESET DATA') {
      throw new Error("Confirmation required: Please enter 'CONFIRM RESET DATA' to proceed with resetting general templates.");
    }

    // Reset ONLY non-publication general templates. Publications, DCM, and assets are NEVER wiped!
    setDiaryNat(initialDiaryNat);
    setDiaryLoc(initialDiaryLoc);
    setDiaryAfr(initialDiaryAfr);
    setDiaryOth(initialDiaryOth);
    setEvents(initialEvents);
    setTeam(initialTeam);
    setHeroConfig(INITIAL_HERO_CONFIG);
    setStatsConfig(INITIAL_STATS_CONFIG);

    const safeSync = async (docName: string, payload: any) => {
      try {
        await setDoc(doc(db, 'cms', docName), removeUndefined(payload));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `cms/${docName}`);
      }
    };

    await safeSync('diary_nat', { items: initialDiaryNat, updatedAt: Date.now() });
    await safeSync('diary_loc', { items: initialDiaryLoc, updatedAt: Date.now() });
    await safeSync('diary_afr', { items: initialDiaryAfr, updatedAt: Date.now() });
    await safeSync('diary_oth', { items: initialDiaryOth, updatedAt: Date.now() });
    await safeSync('events', { items: initialEvents, updatedAt: Date.now() });
    await safeSync('team', { items: initialTeam, updatedAt: Date.now() });
    await safeSync('hero', { config: INITIAL_HERO_CONFIG, updatedAt: Date.now() });
    await safeSync('stats', { items: INITIAL_STATS_CONFIG, updatedAt: Date.now() });
  };

  // Restore publications from cloud backup or local storage safely
  const restorePublicationsBackup = async (): Promise<{ success: boolean; count: number }> => {
    try {
      // 1. Try cloud backup
      const backupSnap = await getDoc(doc(db, 'cms', 'publications_backup'));
      let backupData = backupSnap.exists() ? backupSnap.data() : null;

      // 2. Fall back to local storage
      if (!backupData && typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem('aeo_publications_backup');
        if (stored) {
          try {
            backupData = JSON.parse(stored);
          } catch {}
        }
      }

      // 3. Fall back to initial hardcoded restored dataset
      const restoredReports = backupData?.reports || initialReports;
      const restoredWeekly = backupData?.weekly || initialWeekly;
      const restoredAnnouncements = backupData?.announcements || initialAnnouncements;

      if (restoredReports && restoredReports.length > 0) {
        setReports(restoredReports);
        await setDoc(doc(db, 'cms', 'reports'), removeUndefined({ items: restoredReports, updatedAt: Date.now() }));
      }
      if (restoredWeekly && restoredWeekly.length > 0) {
        setWeekly(restoredWeekly);
        await setDoc(doc(db, 'cms', 'weekly'), removeUndefined({ items: restoredWeekly, updatedAt: Date.now() }));
      }
      if (restoredAnnouncements && restoredAnnouncements.length > 0) {
        setAnnouncements(restoredAnnouncements);
        await setDoc(doc(db, 'cms', 'announcements'), removeUndefined({ items: restoredAnnouncements, updatedAt: Date.now() }));
      }

      const total = (restoredReports?.length || 0) + (restoredWeekly?.length || 0) + (restoredAnnouncements?.length || 0);
      return { success: true, count: total };
    } catch (err) {
      console.error('Error restoring publications backup:', err);
      handleFirestoreError(err, OperationType.WRITE, 'cms/reports');
      return { success: false, count: 0 };
    }
  };

  // Explicit refresh from cloud without destroying any data
  const refreshData = async () => {
    try {
      const repSnap = await getDoc(doc(db, 'cms', 'reports'));
      if (repSnap.exists() && Array.isArray(repSnap.data()?.items)) {
        setReports(repSnap.data()?.items);
      }
      const weekSnap = await getDoc(doc(db, 'cms', 'weekly'));
      if (weekSnap.exists() && Array.isArray(weekSnap.data()?.items)) {
        setWeekly(weekSnap.data()?.items);
      }
      const annSnap = await getDoc(doc(db, 'cms', 'announcements'));
      if (annSnap.exists() && Array.isArray(annSnap.data()?.items)) {
        setAnnouncements(annSnap.data()?.items);
      }
      const dNatSnap = await getDoc(doc(db, 'cms', 'diary_nat'));
      if (dNatSnap.exists() && Array.isArray(dNatSnap.data()?.items)) {
        setDiaryNat(dNatSnap.data()?.items);
      }
      const dLocSnap = await getDoc(doc(db, 'cms', 'diary_loc'));
      if (dLocSnap.exists() && Array.isArray(dLocSnap.data()?.items)) {
        setDiaryLoc(dLocSnap.data()?.items);
      }
      const dAfrSnap = await getDoc(doc(db, 'cms', 'diary_afr'));
      if (dAfrSnap.exists() && Array.isArray(dAfrSnap.data()?.items)) {
        setDiaryAfr(dAfrSnap.data()?.items);
      }
      const dOthSnap = await getDoc(doc(db, 'cms', 'diary_oth'));
      if (dOthSnap.exists() && Array.isArray(dOthSnap.data()?.items)) {
        setDiaryOth(dOthSnap.data()?.items);
      }
      const evtSnap = await getDoc(doc(db, 'cms', 'events'));
      if (evtSnap.exists() && Array.isArray(evtSnap.data()?.items)) {
        setEvents(evtSnap.data()?.items);
      }
      const teamSnap = await getDoc(doc(db, 'cms', 'team'));
      if (teamSnap.exists() && Array.isArray(teamSnap.data()?.items)) {
        setTeam(teamSnap.data()?.items);
      }
    } catch (e) {
      console.warn('Error refreshing cloud data:', e);
      handleFirestoreError(e, OperationType.GET, 'cms/all');
    }
  };

  // Export entire CMS data as formatted JSON string
  const exportAllDataJson = useCallback(() => {
    const backupObj = {
      version: 1,
      exportedAt: new Date().toISOString(),
      reports,
      weekly,
      announcements,
      diaryNat,
      diaryLoc,
      diaryAfr,
      diaryOth,
      events,
      team,
      heroConfig,
      statsConfig,
      dcmPublications
    };
    return JSON.stringify(backupObj, null, 2);
  }, [reports, weekly, announcements, diaryNat, diaryLoc, diaryAfr, diaryOth, events, team, heroConfig, statsConfig, dcmPublications]);

  // Import entire CMS data from JSON string with Super Admin UID check, schema validation, and double confirmation
  const importDataJson = async (jsonStr: string, confirmationPhrase?: string): Promise<{ success: boolean; message: string }> => {
    const currentUid = auth.currentUser?.uid;
    if (currentUid !== SUPER_ADMIN_UID) {
      return { success: false, message: 'Unauthorized: Only the Super Administrator can import database backups.' };
    }

    if (!confirmationPhrase || confirmationPhrase.trim().toUpperCase() !== 'CONFIRM RESTORE DATABASE') {
      return { success: false, message: "Confirmation required: Please type 'CONFIRM RESTORE DATABASE' to apply database backup import." };
    }

    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, message: 'Invalid JSON file format.' };
      }

      // Schema verification helpers
      const validateItems = (arr: any[], requiredFields: string[]) => {
        if (!Array.isArray(arr)) return [];
        return arr.filter(item => item && typeof item === 'object' && requiredFields.every(field => item[field] !== undefined));
      };

      let count = 0;
      const validReports = validateItems(parsed.reports, ['id', 'title', 'summary']);
      if (validReports.length > 0) {
        setReports(validReports);
        await setDoc(doc(db, 'cms', 'reports'), removeUndefined({ items: validReports, updatedAt: Date.now() }));
        count += validReports.length;
      }

      const validWeekly = validateItems(parsed.weekly, ['id', 'title', 'summary']);
      if (validWeekly.length > 0) {
        setWeekly(validWeekly);
        await setDoc(doc(db, 'cms', 'weekly'), removeUndefined({ items: validWeekly, updatedAt: Date.now() }));
        count += validWeekly.length;
      }

      const validAnnouncements = validateItems(parsed.announcements, ['id', 'title', 'summary']);
      if (validAnnouncements.length > 0) {
        setAnnouncements(validAnnouncements);
        await setDoc(doc(db, 'cms', 'announcements'), removeUndefined({ items: validAnnouncements, updatedAt: Date.now() }));
        count += validAnnouncements.length;
      }

      const validDNat = validateItems(parsed.diaryNat, ['id', 'title', 'date']);
      if (validDNat.length > 0) {
        setDiaryNat(validDNat);
        await setDoc(doc(db, 'cms', 'diary_nat'), removeUndefined({ items: validDNat, updatedAt: Date.now() }));
      }

      const validDLoc = validateItems(parsed.diaryLoc, ['id', 'title', 'date']);
      if (validDLoc.length > 0) {
        setDiaryLoc(validDLoc);
        await setDoc(doc(db, 'cms', 'diary_loc'), removeUndefined({ items: validDLoc, updatedAt: Date.now() }));
      }

      const validDAfr = validateItems(parsed.diaryAfr, ['id', 'title', 'date']);
      if (validDAfr.length > 0) {
        setDiaryAfr(validDAfr);
        await setDoc(doc(db, 'cms', 'diary_afr'), removeUndefined({ items: validDAfr, updatedAt: Date.now() }));
      }

      const validDOth = validateItems(parsed.diaryOth, ['id', 'title', 'date']);
      if (validDOth.length > 0) {
        setDiaryOth(validDOth);
        await setDoc(doc(db, 'cms', 'diary_oth'), removeUndefined({ items: validDOth, updatedAt: Date.now() }));
      }

      const validEvents = validateItems(parsed.events, ['id', 'title']);
      if (validEvents.length > 0) {
        setEvents(validEvents);
        await setDoc(doc(db, 'cms', 'events'), removeUndefined({ items: validEvents, updatedAt: Date.now() }));
      }

      const validTeam = validateItems(parsed.team, ['id', 'name', 'role']);
      if (validTeam.length > 0) {
        setTeam(validTeam);
        await setDoc(doc(db, 'cms', 'team'), removeUndefined({ items: validTeam, updatedAt: Date.now() }));
      }

      if (parsed.heroConfig && typeof parsed.heroConfig === 'object' && parsed.heroConfig.title) {
        setHeroConfig(parsed.heroConfig);
        await setDoc(doc(db, 'cms', 'hero'), removeUndefined({ config: parsed.heroConfig, updatedAt: Date.now() }));
      }

      const validStats = validateItems(parsed.statsConfig, ['id', 'title', 'value']);
      if (validStats.length > 0) {
        setStatsConfig(validStats);
        await setDoc(doc(db, 'cms', 'stats'), removeUndefined({ items: validStats, updatedAt: Date.now() }));
      }

      const validDcm = validateItems(parsed.dcmPublications, ['id', 'title']);
      if (validDcm.length > 0) {
        setDcmPublications(validDcm);
        await setDoc(doc(db, 'cms', 'dcm_publications'), removeUndefined({ items: validDcm, updatedAt: Date.now() }));
        count += validDcm.length;
      }

      await saveBackupSnapshot(
        validReports.length > 0 ? validReports : reports,
        validWeekly.length > 0 ? validWeekly : weekly,
        validAnnouncements.length > 0 ? validAnnouncements : announcements
      );

      return { success: true, message: `Successfully validated and restored ${count} verified records into production Firestore.` };
    } catch (e: any) {
      console.error('Import error:', e);
      handleFirestoreError(e, OperationType.WRITE, 'cms/all');
      return { success: false, message: e?.message || 'Failed to parse or validate JSON backup file.' };
    }
  };


  return (
    <CMSContext.Provider value={{
      reports,
      diaryNat,
      diaryLoc,
      diaryAfr,
      diaryOth,
      events,
      announcements,
      team,
      weekly,
      heroConfig,
      statsConfig,
      dcmPublications,
      saveDcmPublication,
      deleteDcmPublication,
      apeaAudits,
      apeaPublicReports,
      apeaReportInfo,
      saveApeaAudit,
      deleteApeaAudit,
      saveApeaReportPdf,
      saveApeaReportInfo,
      resetApeaData,
      dataLoaded,
      saveReport,
      deleteReport,
      saveDiaryItem,
      deleteDiaryItem,
      saveEvent,
      deleteEvent,
      saveAnnouncement,
      deleteAnnouncement,
      saveTeamMember,
      deleteTeamMember,
      saveWeeklyIssue,
      deleteWeeklyIssue,
      saveHeroConfig,
      saveStatsConfig,
      incrementPublicationStat,
      resetAllData,
      restorePublicationsBackup,
      refreshData,
      exportAllDataJson,
      importDataJson
    }}>
      {children}
    </CMSContext.Provider>
  );
}

export function useCMS() {
  const context = useContext(CMSContext);
  if (!context) {
    throw new Error('useCMS must be used within a CMSProvider');
  }
  return context;
}
