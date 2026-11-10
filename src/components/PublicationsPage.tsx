import React, { useState, useEffect, useMemo } from 'react';
import { Search, ArrowLeft, BookOpen, FileText, Mail, Bell, Calendar, ChevronDown, ChevronUp, User, X, Download, Award, MapPin, Users, ArrowRight, ShieldCheck, Globe } from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import { formatReportDate, parseDateValue, sortItemsByDate } from '../utils/date';
import { getItemSlug } from '../utils/url';
import DiaryElectionDetail from './DiaryElectionDetail';
import { DiaryItem } from '../types';
import { DcmPreview } from './DcmPreview';

export const triggerPdfDownload = async (title: string, summary: string, author: string, date: string, pdfUrl?: string, customContent?: string) => {
  if (pdfUrl) {
    if (
      pdfUrl.startsWith('/') ||
      pdfUrl.endsWith('.pdf') ||
      pdfUrl.startsWith('data:') ||
      pdfUrl.startsWith('blob:') ||
      pdfUrl.startsWith('http://') ||
      pdfUrl.startsWith('https://')
    ) {
      try {
        if (pdfUrl.startsWith('/') || pdfUrl.endsWith('.pdf') || pdfUrl.startsWith('http')) {
          const res = await fetch(pdfUrl);
          if (res.ok) {
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = pdfUrl.split('/').pop() || `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
            return;
          }
        }
      } catch (err) {
        console.warn('Fetch PDF blob failed, falling back to anchor click:', err);
      }

      const link = document.createElement('a');
      link.href = pdfUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = pdfUrl.split('/').pop() || `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
  }

  // Fallback for missing/reference-only pdfUrl
  const content = `
ATHENA ELECTION OBSERVATORY (AEO)
OFFICIAL DOCUMENT ARCHIVE
=========================================
TITLE: ${title}
AUTHOR: ${author}
DATE: ${date}
-----------------------------------------

SUMMARY:
${summary}

${customContent ? `CONTENT:\n${customContent}` : ''}

=========================================
Document compiled by Athena Election Observatory.
Verification pipeline: AEO-SECURE-2026-X.
  `.trim();

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

interface UnifiedPublication {
  id: string;
  type: 'audit' | 'assessment' | 'weekly' | 'announcement' | 'dcm' | 'brief' | 'africa-election-watch';
  typeName: string;
  category: string;
  title: string;
  summary: string;
  author: string;
  authorsList: string;
  date: string;
  image: string;
  readTimeOrSize: string;
  readingTime?: string;
  originalItem: any;
  pdfUrl?: string;
  downloadSectionTitle?: string;
  downloadButtonLabel?: string;
  reads?: number;
  downloads?: number;
}

export default function PublicationsPage() {
  const { reports, weekly, announcements, diaryNat, diaryLoc, diaryAfr, diaryOth } = useCMS();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isAuthorsExpanded, setIsAuthorsExpanded] = useState(true);
  const [isDatesExpanded, setIsDatesExpanded] = useState(true);
  const [isTypesExpanded, setIsTypesExpanded] = useState(true);

  const publicationTypes = [
    { value: 'brief', label: 'Reports and Briefs' },
    { value: 'audit', label: 'Post-Election Audits' },
    { value: 'assessment', label: 'Political Landscape Monitor' },
    { value: 'dcm', label: 'Democratic Competitiveness Map (DCM)' },
    { value: 'africa-election-watch', label: 'Africa Election Watch' },
    { value: 'weekly', label: 'AEO Weekly Digest' },
    { value: 'announcement', label: 'Announcements' }
  ];
  
  // State for announcement reader modal & diary detail modal
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<UnifiedPublication | null>(null);
  const [selectedDiaryItem, setSelectedDiaryItem] = useState<DiaryItem | null>(null);

  // Combine all diary items and find the 3 closest elections
  const allDiaryItems = useMemo(() => {
    const nat = (diaryNat || []).map(item => ({
      ...item,
      region: item.region || ('nigeria' as const),
      type: item.type || (item.title.toLowerCase().includes('presidential') ? ('presidential' as const) : ('governorship' as const))
    }));
    const loc = (diaryLoc || []).map(item => ({
      ...item,
      region: item.region || ('nigeria' as const),
      type: item.type || ('local_government' as const)
    }));
    const afr = (diaryAfr || []).map(item => ({
      ...item,
      region: item.region || ('africa' as const),
      type: item.type || ('presidential' as const)
    }));
    const oth = (diaryOth || []).map(item => ({
      ...item,
      region: item.region || ('other' as const),
      type: item.type || ('presidential' as const)
    }));
    return [...nat, ...loc, ...afr, ...oth];
  }, [diaryNat, diaryLoc, diaryAfr, diaryOth]);

  const closestElections = useMemo(() => {
    const statusPriority: Record<string, number> = {
      'Ongoing': 1,
      'In view': 2,
      'Scheduled': 3,
      'Tracking': 4,
      'Provisional': 5,
      'Concluded': 6
    };
    const now = new Date();
    now.setHours(0,0,0,0);
    const todayTime = now.getTime();

    const upcoming = allDiaryItems.filter(item => {
      const ts = parseDateValue(item.date);
      return ts >= todayTime;
    });

    return [...upcoming].sort((a, b) => {
      const pA = statusPriority[a.status] || 99;
      const pB = statusPriority[b.status] || 99;
      if (pA !== pB) return pA - pB;
      return parseDateValue(a.date) - parseDateValue(b.date);
    }).slice(0, 3);
  }, [allDiaryItems]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const navigateTo = (to: string) => {
    window.history.pushState({}, '', to);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Determine current path to set mode
  const currentPath = window.location.pathname;
  let pageMode: 'all' | 'audit' | 'assessment' | 'weekly' | 'announcement' | 'dcm' | 'reports-briefs' | 'africa-election-watch' = 'all';
  if (currentPath === '/reports-and-briefs' || currentPath === '/reports-briefs' || currentPath === '/publications/reports-and-briefs' || currentPath === '/publications/reports-briefs') pageMode = 'reports-briefs';
  else if (currentPath === '/post-election-audits' || currentPath === '/publications/post-election-audits') pageMode = 'audit';
  else if (currentPath === '/political-landscape-monitor' || currentPath === '/publications/political-landscape-monitor') pageMode = 'assessment';
  else if (currentPath === '/democratic-competitiveness-map' || currentPath === '/publications/democratic-competitiveness-map' || currentPath === '/democracy-competitive-index' || currentPath === '/publications/democracy-competitive-index') pageMode = 'dcm';
  else if (currentPath === '/africa-election-watch' || currentPath === '/publications/africa-election-watch') pageMode = 'africa-election-watch';
  else if (currentPath === '/aeo-weekly-digest' || currentPath === '/publications/aeo-weekly-digest') pageMode = 'weekly';
  else if (currentPath === '/announcements' || currentPath === '/publications/announcements') pageMode = 'announcement';

  useEffect(() => {
    if (pageMode === 'dcm') {
      const existingScript = document.querySelector('script[src="https://public.flourish.studio/resources/embed.js"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://public.flourish.studio/resources/embed.js';
        script.async = true;
        document.body.appendChild(script);
      } else if ((window as any).Flourish && typeof (window as any).Flourish.load === 'function') {
        (window as any).Flourish.load();
      }
    }
  }, [pageMode]);

  // Build unified publication items
  const unifiedPublications: UnifiedPublication[] = [];

  // 1. Audit reports (tagType === 'analysis')
  reports.filter(r => r.tagType === 'analysis').forEach(r => {
    unifiedPublications.push({
      id: r.id,
      type: 'audit',
      typeName: 'Post-election audit report',
      category: r.tag || 'ELECTION AUDIT',
      title: r.title,
      summary: r.summary,
      author: r.author || '',
      authorsList: r.authorsList || r.author || '',
      date: formatReportDate(r.date),
      image: r.image || '',
      readTimeOrSize: r.size,
      readingTime: r.readingTime,
      originalItem: r,
      pdfUrl: r.pdfUrl,
      downloadSectionTitle: r.downloadSectionTitle,
      downloadButtonLabel: r.downloadButtonLabel,
      reads: r.reads,
      downloads: r.downloads
});
  });

  // 2. Assessments (tagType === 'tech')
  reports.filter(r => r.tagType === 'tech').forEach(r => {
    let category = r.tag || 'TECHNOLOGY ASSESSMENT';
    if (r.id === 'kaduna-security' && !r.tag) category = 'GOVERNANCE AND LEADERSHIP';
    if (r.id === 'hospitals-reform' && !r.tag) category = 'HEALTH & EDUCATION';

    unifiedPublications.push({
      id: r.id,
      type: 'assessment',
      typeName: 'Political landscape monitor',
      category: category,
      title: r.title,
      summary: r.summary,
      author: r.author || '',
      authorsList: r.authorsList || r.author || '',
      date: formatReportDate(r.date),
      image: r.image || '',
      readTimeOrSize: r.size,
      readingTime: r.readingTime,
      originalItem: r,
      pdfUrl: r.pdfUrl,
      downloadSectionTitle: r.downloadSectionTitle,
      downloadButtonLabel: r.downloadButtonLabel,
      reads: r.reads,
      downloads: r.downloads
});
  });

  // 2.5 DCM reports (tagType === 'dcm')
  reports.filter(r => r.tagType === 'dcm' || r.tagType === ('dci' as any)).forEach(r => {
    unifiedPublications.push({
      id: r.id,
      type: 'dcm',
      typeName: 'Democratic Competitiveness Map (DCM) Report',
      category: r.tag || 'DCM REPORT',
      title: r.title,
      summary: r.summary,
      author: r.author || '',
      authorsList: r.authorsList || r.author || '',
      date: formatReportDate(r.date),
      image: r.image || '',
      readTimeOrSize: r.size,
      readingTime: r.readingTime,
      originalItem: r,
      pdfUrl: r.pdfUrl,
      downloadSectionTitle: r.downloadSectionTitle,
      downloadButtonLabel: r.downloadButtonLabel,
      reads: r.reads,
      downloads: r.downloads
});
  });

  // 2.6 Reports & Briefs (tagType === 'brief')
  reports.filter(r => r.tagType === 'brief').forEach(r => {
    unifiedPublications.push({
      id: r.id,
      type: 'brief',
      typeName: 'Reports & Briefs',
      category: r.tag || 'REPORTS & BRIEFS',
      title: r.title,
      summary: r.summary,
      author: r.author || '',
      authorsList: r.authorsList || r.author || '',
      date: formatReportDate(r.date),
      image: r.image || '',
      readTimeOrSize: r.size,
      readingTime: r.readingTime,
      originalItem: r,
      pdfUrl: r.pdfUrl,
      downloadSectionTitle: r.downloadSectionTitle,
      downloadButtonLabel: r.downloadButtonLabel,
      reads: r.reads,
      downloads: r.downloads
});
  });

  // 2.7 Africa Election Watch (tagType === 'africa-election-watch')
  reports.filter(r => r.tagType === 'africa-election-watch').forEach(r => {
    unifiedPublications.push({
      id: r.id,
      type: 'africa-election-watch',
      typeName: 'Africa Election Watch',
      category: r.tag || 'AFRICA ELECTION WATCH',
      title: r.title,
      summary: r.summary,
      author: r.author || '',
      authorsList: r.authorsList || r.author || '',
      date: formatReportDate(r.date),
      image: r.image || '',
      readTimeOrSize: r.size,
      readingTime: r.readingTime,
      originalItem: r,
      pdfUrl: r.pdfUrl,
      downloadSectionTitle: r.downloadSectionTitle,
      downloadButtonLabel: r.downloadButtonLabel,
      reads: r.reads,
      downloads: r.downloads
});
  });

  // 3. Weekly issues
  weekly.forEach(w => {
    unifiedPublications.push({
      id: w.id,
      type: 'weekly',
      typeName: 'AEO weekly digest',
      category: w.tag || 'AEO WEEKLY DIGEST',
      title: w.title,
      summary: w.summary,
      author: w.author || '',
      authorsList: w.authorsList || w.author || '',
      date: formatReportDate(w.date),
      image: w.image || '',
      readTimeOrSize: w.readingTime || '5 min read',
      readingTime: w.readingTime,
      originalItem: w,
      pdfUrl: w.pdfUrl,
      downloadSectionTitle: w.downloadSectionTitle,
      downloadButtonLabel: w.downloadButtonLabel,
      reads: w.reads,
      downloads: w.downloads
});
  });

  // 4. Announcements
  announcements.forEach(a => {
    unifiedPublications.push({
      id: a.id,
      type: 'announcement',
      typeName: 'Announcement',
      category: a.category === 'press' ? 'PRESS STATEMENT' : a.category === 'bulletin' ? 'OFFICIAL BULLETIN' : a.category === 'statement' ? 'PUBLIC STATEMENT' : 'ALERT',
      title: a.title,
      summary: a.summary,
      author: a.author || '',
      authorsList: a.authorsList || a.author || '',
      date: formatReportDate(a.date),
      image: a.image || '',
      readTimeOrSize: '3 min read',
      readingTime: a.readingTime,
      originalItem: a,
      pdfUrl: a.pdfUrl,
      downloadSectionTitle: a.downloadSectionTitle,
      downloadButtonLabel: a.downloadButtonLabel,
      reads: a.reads,
      downloads: a.downloads
});
  });

  // Scope publications by the current page mode
  const scopedPublications = unifiedPublications.filter(p => {
    if (pageMode === 'all') return true;
    if (pageMode === 'reports-briefs') return p.type === 'brief';
    return p.type === pageMode;
  });

  // Sort publications: descending order by publication/upload date
  const sortedPublications = sortItemsByDate(scopedPublications, 'date', 'desc');

  // Extract year helper
  const getYearFromDate = (dateStr: string) => {
    if (!dateStr || typeof dateStr !== 'string') return 'Other';
    const yearMatch = dateStr.match(/\b(202\d)\b/);
    return yearMatch ? yearMatch[1] : 'Other';
  };

  // Get list of unique authors for the current scoped category
  const allAuthors = Array.from(new Set(sortedPublications.map(p => p.author))).filter(Boolean);

  // Get list of unique years for the current scoped category
  const allYears = Array.from(new Set(sortedPublications.map(p => getYearFromDate(p.date)))).filter(Boolean).sort().reverse();

  // Filter scoped publications based on selection
  const filteredPublications = sortedPublications.filter(p => {
    const titleText = p.title || '';
    const summaryText = p.summary || '';
    const authorsText = p.authorsList || '';
    const matchesSearch = 
      titleText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      summaryText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      authorsText.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAuthor = selectedAuthor === 'all' || p.author === selectedAuthor;
    
    if (pageMode === 'all') {
      const matchesType = selectedType === 'all' || p.type === selectedType;
      return matchesSearch && matchesAuthor && matchesType;
    } else {
      const matchesYear = selectedYear === 'all' || getYearFromDate(p.date) === selectedYear;
      return matchesSearch && matchesAuthor && matchesYear;
    }
  });

  // Count helpers for the current scope
  const getCountByAuthor = (authorName: string) => {
    if (authorName === 'all') return sortedPublications.length;
    return sortedPublications.filter(p => p.author === authorName).length;
  };

  const getCountByYear = (year: string) => {
    if (year === 'all') return sortedPublications.length;
    return sortedPublications.filter(p => getYearFromDate(p.date) === year).length;
  };

  const getCountByType = (type: string) => {
    if (type === 'all') return sortedPublications.length;
    return sortedPublications.filter(p => p.type === type).length;
  };

  const handleItemClick = (pub: UnifiedPublication) => {
    const slug = getItemSlug(pub);
    if (pub.type === 'audit' || pub.type === 'assessment' || pub.type === 'dcm' || pub.type === 'brief' || pub.type === 'africa-election-watch') {
      navigateTo(`/reports/${slug}`);
    } else if (pub.type === 'weekly') {
      navigateTo(`/weekly/${slug}`);
    } else if (pub.type === 'announcement') {
      navigateTo(`/announcement/${slug}`);
    }
  };

  // Page texts depending on the Mode
  const getPageInfo = () => {
    switch (pageMode) {
      case 'reports-briefs':
        return {
          title: "Reports and Briefs",
          description: "Access our full registry of forensic election audits, sub-national tech assessments, and policy research briefs.",
          icon: <FileText className="w-8 h-8 text-brand-blue" />
        };
      case 'audit':
        return {
          title: "Post-Election Audit Reports",
          description: "Explore our archive of comprehensive post-election audits and forensic reviews mapping voter accreditation and official results.",
          icon: <FileText className="w-8 h-8 text-brand-purple" />
        };
      case 'assessment':
        return {
          title: "Political Landscape Monitor",
          description: "Sub-national assessments, tech reviews, and governance research briefs analyzing democratic compliance.",
          icon: <BookOpen className="w-8 h-8 text-brand-blue" />
        };
      case 'dcm':
        return {
          title: "Democratic Competitiveness Map (DCM)",
          description: "*Reporting Period: 1st October to 15th October 2026*\n\nThree months before the 2027 general elections, the space for opposition campaigning is narrowing in a growing number of states. In the first half of October, five more states showed material concerns, and violence against opposition events and party offices spread beyond the South-East.\n\nThis brief sets out where conditions are deteriorating, why it matters, and what each institution can do before campaigns intensify.",
          icon: <Award className="w-8 h-8 text-brand-blue" />
        };
      case 'africa-election-watch':
        return {
          title: "Africa Election Watch",
          description: "Cross-border electoral monitoring, comparative regional research, and democratic health assessments across African nations.",
          icon: <Globe className="w-8 h-8 text-teal-600" />
        };
      case 'weekly':
        return {
          title: "AEO Weekly Digest",
          description: "Our weekly analytical insights, digests, newsletters, and ongoing research updates on electoral processes.",
          icon: <Mail className="w-8 h-8 text-brand-green" />
        };
      case 'announcement':
        return {
          title: "Announcements & Statement Archive",
          description: "Athena Election Observatory's official public declarations, press releases, and rapid-response alerts.",
          icon: <Bell className="w-8 h-8 text-amber-500" />
        };
      default:
        return {
          title: "All Observatory Publications",
          description: "Access our entire registry of forensic audits, technology assessments, weekly newsletters, and press statements.",
          icon: <FileText className="w-8 h-8 text-brand-blue" />
        };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb */}
          <div className="mb-8">
            <button 
              onClick={() => navigateTo('/')}
              className="inline-flex items-center gap-2 text-xs font-bold font-mono tracking-wider text-brand-blue hover:text-brand-blue-dark transition-colors cursor-pointer uppercase"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </div>

          {/* Page Title / Header Block */}
          <div className="border-b border-line pb-8 mb-10">
            <div className="flex items-center gap-3.5 mb-2">
              {pageInfo.icon}
              <span className="text-xs font-mono font-bold tracking-widest text-brand-blue uppercase">
                Athena Observatory
              </span>
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-ink leading-tight">
              {pageInfo.title}
            </h1>
            <div className="text-ink2 text-base mt-3 max-w-3xl leading-relaxed space-y-4">
              {pageInfo.description.split('\n\n').map((para, i) => {
                if (para.startsWith('*') && para.endsWith('*')) {
                  return (
                    <p key={i} className="font-mono text-xs font-bold tracking-wider text-brand-blue uppercase bg-brand-blue/5 border border-brand-blue/20 inline-block px-3 py-1 rounded-md">
                      {para.slice(1, -1)}
                    </p>
                  );
                }
                return <p key={i}>{para}</p>;
              })}
            </div>
          </div>

          {/* Democratic Competitiveness Map (DCM) Section */}
          {pageMode === 'dcm' && (
            <div className="bg-white border border-line rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm mb-12">
              <div className="space-y-2">
                <div className="text-[10px] font-mono font-bold tracking-widest text-brand-blue uppercase">
                  Interactive Map Visualization
                </div>
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-ink">
                  Democratic Competitiveness Map (DCM)
                </h2>
                <p className="text-ink2 text-sm leading-relaxed max-w-3xl">
                  Explore the latest Democratic Competitiveness Map (DCM) update across Nigeria. The map provides a state-level overview of classifications based on traceable evidence gathered during the monitoring cycle.
                </p>
              </div>

              <div className="w-full">
                <DcmPreview isEmbedded={true} />
              </div>

              <div className="text-xs text-mut leading-relaxed italic border-t border-line pt-4">
                Methodology note: Classifications are assigned only where traceable evidence was identified during the monitoring period. Grey indicates insufficient evidence within the review cycle and does not represent a positive or negative finding.
              </div>
            </div>
          )}

          {/* Search Box */}
          <div className="relative max-w-md mb-8">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mut" />
            <input 
              type="text" 
              placeholder={`Search ${pageInfo.title.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-line focus:border-brand-blue focus:ring-1 focus:ring-brand-blue text-sm outline-none bg-white transition-all shadow-sm"
            />
          </div>

          {/* Full DCM Document Content (New Uploaded Document) */}
          {pageMode === 'dcm' && (
            <div className="bg-white border border-line rounded-2xl p-6 sm:p-10 space-y-8 shadow-sm mb-12">
              <div className="space-y-6 text-ink2 text-base leading-relaxed">
                <h3 className="font-display font-bold text-2xl text-ink">What is DCM?</h3>
                <p>
                  The Democratic Competitiveness Map (DCM) is the Athena Election Observatory’s evidence-based system for monitoring the conditions under which legitimate political actors compete across Nigeria’s thirty-six states and the Federal Capital Territory.
                </p>
                <p>
                  A credible election requires more than a credible election day. Political actors must also have a practical opportunity to organise, communicate, move, assemble and compete before voters cast their ballots.
                </p>
                <p>
                  Election integrity examines whether voting, counting and collation reflect the will of voters. The DCM examines the environment in which political actors compete, whether the political actors have a reasonably open and fair opportunity to compete for those votes.
                </p>
                <p>
                  The DCM assesses whether political parties, candidates and other legitimate political actors can organise, communicate, mobilise, move, campaign, access relevant institutions and participate in political competition under conditions of political pluralism, institutional neutrality, legal certainty and practical fairness.
                </p>
              </div>

              <div className="space-y-6 text-ink2 text-base leading-relaxed border-t border-line pt-8">
                <h3 className="font-display font-bold text-2xl text-ink">What does it track?</h3>
                <p>The DCM tracks five dimensions of the political competition environment:</p>
                <ul className="list-disc pl-6 space-y-3">
                  <li><strong className="text-ink">Political Space — Freedom of Association and Movement:</strong> Whether political actors can organise, assemble, move and campaign without unjustified or discriminatory restrictions.</li>
                  <li><strong className="text-ink">Freedom of Speech and Expression:</strong> Whether political actors can communicate, campaign and express political positions without materially restrictive interference.</li>
                  <li><strong className="text-ink">Administrative and Regulatory Neutrality:</strong> Whether administrative, regulatory and legal powers are applied impartially and without creating discriminatory competitive effects.</li>
                  <li><strong className="text-ink">Security Neutrality:</strong> Whether police and security institutions protect lawful political activity and enforce applicable rules impartially across political actors.</li>
                  <li><strong className="text-ink">Political Intimidation and Violence:</strong> Whether threats, coercion or violence materially restrict political actors from participating in political competition.</li>
                </ul>
              </div>

              <div className="space-y-6 text-ink2 text-base leading-relaxed border-t border-line pt-8">
                <h3 className="font-display font-bold text-2xl text-ink">What does it seek to achieve?</h3>
                <p>The DCM is designed to:</p>
                <ul className="list-disc pl-6 space-y-3">
                  <li>Provide an evidence-based picture of political competition conditions across Nigeria before election day.</li>
                  <li>Identify emerging restrictions and pressure points that may affect the ability of political actors to compete.</li>
                  <li>Track changes in competitive conditions over time, including whether conditions improve, deteriorate or remain unchanged.</li>
                  <li>Make the evidence behind each classification transparent and traceable, allowing users to examine the basis for a state’s classification.</li>
                  <li>Highlight areas requiring closer attention from political actors, institutions, civil society, researchers and other stakeholders as elections approach.</li>
                </ul>
              </div>

              <div className="space-y-6 text-ink2 text-base leading-relaxed border-t border-line pt-8">
                <h3 className="font-display font-bold text-2xl text-ink">What is it not?</h3>
                <p>The DCM:</p>
                <ul className="list-disc pl-6 space-y-3">
                  <li>Does not rank states or political parties.</li>
                  <li>Does not assign numerical scores, weights or composite values.</li>
                  <li>Does not measure political popularity, vote share or predict electoral outcomes.</li>
                  <li>Does not assess whether a court reached the correct legal conclusion.</li>
                  <li>Does not treat allegations as established facts without sufficient verification.</li>
                  <li>Is not a general democracy, governance or civil-liberties index.</li>
                  <li>Does not equate limited reporting or lack of evidence with an open political environment.</li>
                  <li>Does not replace AEO’s election-day monitoring or Post-Election Audit workstreams.</li>
                </ul>
                <p className="mt-4">
                  Each colour represents the current state of evidence for a defined reporting period, rather than a permanent judgment about a state. Classifications can change as conditions change, restrictions are remedied, or stronger evidence becomes available.
                </p>
              </div>

              <div className="space-y-6 text-ink2 text-base leading-relaxed border-t border-line pt-8">
                <h3 className="font-display font-bold text-2xl text-ink">How do the colours work?</h3>
                <p>
                  The DCM uses five colour classifications. The colours are evidence-based and time-bound; they are not permanent labels assigned to states.
                </p>

                {/* Responsive Colours Table */}
                <div className="overflow-x-auto my-6 border border-line rounded-xl">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-paper border-b border-line text-ink font-mono text-xs uppercase">
                        <th className="p-4 font-bold">Colour</th>
                        <th className="p-4 font-bold">Classification</th>
                        <th className="p-4 font-bold">What it means</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line text-ink2">
                      <tr className="hover:bg-paper/50">
                        <td className="p-4 font-semibold text-ink flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 inline-block shrink-0"></span>
                          Green
                        </td>
                        <td className="p-4 font-bold text-ink">Open</td>
                        <td className="p-4">Affirmative and sufficiently broad evidence indicates broadly equal practical political access during the reporting period, with political actors able to organise, communicate, mobilise and campaign without verified material or discriminatory restrictions. No verified pattern of material restriction remains at the cut-off date. Absence of adverse reporting or insufficient evidence is not, by itself, grounds for a Green classification.</td>
                      </tr>
                      <tr className="hover:bg-paper/50">
                        <td className="p-4 font-semibold text-ink flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-full bg-amber-400 inline-block shrink-0"></span>
                          Amber
                        </td>
                        <td className="p-4 font-bold text-ink">Emerging Concern</td>
                        <td className="p-4">A material incident or early evidence of unequal treatment requires monitoring, but the evidence does not yet establish a sustained or substantial restrictive pattern.</td>
                      </tr>
                      <tr className="hover:bg-paper/50">
                        <td className="p-4 font-semibold text-ink flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-full bg-orange-500 inline-block shrink-0"></span>
                          Orange
                        </td>
                        <td className="p-4 font-bold text-ink">Constrained</td>
                        <td className="p-4">Multiple verified incidents, an identifiable pattern, or an exceptionally serious and well-documented action materially restricts political competition.</td>
                      </tr>
                      <tr className="hover:bg-paper/50">
                        <td className="p-4 font-semibold text-ink flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-full bg-red-600 inline-block shrink-0"></span>
                          Red
                        </td>
                        <td className="p-4 font-bold text-ink">Severely Constrained</td>
                        <td className="p-4">Serious, sustained or systemic restrictions substantially impair political competition, taking into account their severity, reach, institutional authority and consequences.</td>
                      </tr>
                      <tr className="hover:bg-paper/50">
                        <td className="p-4 font-semibold text-ink flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-full bg-slate-300 inline-block shrink-0"></span>
                          Grey
                        </td>
                        <td className="p-4 font-bold text-ink">Insufficient Evidence</td>
                        <td className="p-4">Available evidence is inadequate to make a responsible classification. Importantly, insufficient evidence does not mean that political competition is open.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            
            {/* Sidebar Filter Panel */}
            <div className="lg:col-span-1 space-y-8">
              
              <div className="border border-line rounded-2xl bg-white p-5 space-y-6 shadow-sm">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-ink border-b border-line pb-2.5">
                  Filters
                </h3>

                {/* Filter by Type (shown when pageMode is 'all') or Filter by Year (shown on subpages) */}
                {pageMode === 'all' ? (
                  <div className="space-y-3">
                    <button 
                      onClick={() => setIsTypesExpanded(!isTypesExpanded)}
                      className="w-full flex items-center justify-between font-semibold text-sm text-ink hover:text-brand-blue transition-colors"
                    >
                      <span>Filter by Type</span>
                      {isTypesExpanded ? <ChevronUp className="w-3.5 h-3.5 text-mut" /> : <ChevronDown className="w-3.5 h-3.5 text-mut" />}
                    </button>

                    {isTypesExpanded && (
                      <div className="space-y-1 pt-1">
                        <button
                          onClick={() => setSelectedType('all')}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            selectedType === 'all' 
                              ? 'bg-brand-blue/5 text-brand-blue font-bold' 
                              : 'text-ink2 hover:bg-paper'
                          }`}
                        >
                          <span>All Types</span>
                          <span className="text-[10px] font-mono text-mut">({getCountByType('all')})</span>
                        </button>

                        {publicationTypes.map(pubType => (
                          <button
                            key={pubType.value}
                            onClick={() => setSelectedType(pubType.value)}
                            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                              selectedType === pubType.value 
                                ? 'bg-brand-blue/5 text-brand-blue font-bold' 
                                : 'text-ink2 hover:bg-paper'
                            }`}
                          >
                            <span>{pubType.label}</span>
                            <span className="text-[10px] font-mono text-mut">({getCountByType(pubType.value)})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button 
                      onClick={() => setIsDatesExpanded(!isDatesExpanded)}
                      className="w-full flex items-center justify-between font-semibold text-sm text-ink hover:text-brand-blue transition-colors"
                    >
                      <span>Filter by Year</span>
                      {isDatesExpanded ? <ChevronUp className="w-3.5 h-3.5 text-mut" /> : <ChevronDown className="w-3.5 h-3.5 text-mut" />}
                    </button>

                    {isDatesExpanded && (
                      <div className="space-y-1 pt-1">
                        <button
                          onClick={() => setSelectedYear('all')}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            selectedYear === 'all' 
                              ? 'bg-brand-blue/5 text-brand-blue font-bold' 
                              : 'text-ink2 hover:bg-paper'
                          }`}
                        >
                          <span>All Years</span>
                          <span className="text-[10px] font-mono text-mut">({getCountByYear('all')})</span>
                        </button>

                        {allYears.map(year => (
                          <button
                            key={year}
                            onClick={() => setSelectedYear(year)}
                            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                              selectedYear === year 
                                ? 'bg-brand-blue/5 text-brand-blue font-bold' 
                                : 'text-ink2 hover:bg-paper'
                            }`}
                          >
                            <span>{year}</span>
                            <span className="text-[10px] font-mono text-mut">({getCountByYear(year)})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Filter by Author */}
                <div className="space-y-3">
                  <button 
                    onClick={() => setIsAuthorsExpanded(!isAuthorsExpanded)}
                    className="w-full flex items-center justify-between font-semibold text-sm text-ink hover:text-brand-blue transition-colors"
                  >
                    <span>Filter by Author</span>
                    {isAuthorsExpanded ? <ChevronUp className="w-3.5 h-3.5 text-mut" /> : <ChevronDown className="w-3.5 h-3.5 text-mut" />}
                  </button>

                  {isAuthorsExpanded && (
                    <div className="space-y-1 pt-1">
                      <button
                        onClick={() => setSelectedAuthor('all')}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          selectedAuthor === 'all' 
                            ? 'bg-brand-blue/5 text-brand-blue font-bold' 
                            : 'text-ink2 hover:bg-paper'
                        }`}
                      >
                        <span>All Authors</span>
                        <span className="text-[10px] font-mono text-mut">({getCountByAuthor('all')})</span>
                      </button>

                      {allAuthors.map(author => (
                        <button
                          key={author}
                          onClick={() => setSelectedAuthor(author)}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            selectedAuthor === author 
                              ? 'bg-brand-blue/5 text-brand-blue font-bold' 
                              : 'text-ink2 hover:bg-paper'
                          }`}
                        >
                          <span className="truncate pr-2">{author}</span>
                          <span className="text-[10px] font-mono text-mut flex-shrink-0">({getCountByAuthor(author)})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Publications List Grid */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Results count bar */}
              <div className="text-xs font-semibold text-ink2 border-b border-line pb-3 flex items-center justify-between">
                <span>{filteredPublications.length} publication{filteredPublications.length !== 1 ? 's' : ''} found</span>
                {((selectedAuthor !== 'all') || (pageMode === 'all' ? selectedType !== 'all' : selectedYear !== 'all') || searchQuery) && (
                  <button 
                    onClick={() => {
                      setSelectedAuthor('all');
                      setSelectedYear('all');
                      setSelectedType('all');
                      setSearchQuery('');
                    }}
                    className="text-[11px] font-mono font-bold text-brand-blue hover:underline uppercase tracking-wider"
                  >
                    Reset filters
                  </button>
                )}
              </div>

              {filteredPublications.length === 0 ? (
                <div className="bg-white border border-line rounded-2xl p-16 text-center space-y-4 shadow-sm">
                  <div className="bg-paper p-4 rounded-full w-14 h-14 mx-auto flex items-center justify-center border border-line">
                    <BookOpen className="w-6 h-6 text-mut" />
                  </div>
                  <div className="max-w-xs mx-auto space-y-1">
                    <h4 className="font-semibold text-ink text-base">No matching publications</h4>
                    <p className="text-xs text-mut">Try adjusting your filters, search terms, or checking other criteria.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredPublications.map((pub) => (
                    <div 
                      key={`${pub.type}-${pub.id}`}
                      onClick={() => handleItemClick(pub)}
                      className="bg-white border border-line rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-brand-blue transition-all flex flex-col md:flex-row items-stretch cursor-pointer group"
                    >
                      {/* Left Side: Thumbnail Image with NO tags on top */}
                      {pub.image ? (
                        <div className="w-full md:w-64 shrink-0 relative bg-paper min-h-[160px] md:min-h-full">
                          <img 
                            src={pub.image} 
                            alt={pub.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        </div>
                      ) : null}

                      {/* Right Side: Title, Summary & Author/Date Footer only */}
                      <div className="p-6 md:p-8 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          
                          {/* Upper Label Category */}
                          <div className="text-[10px] font-mono font-extrabold tracking-widest text-brand-blue uppercase">
                            {pub.category}
                          </div>

                          {/* Beautiful title which highlights on hover */}
                          <h3 
                            className="font-display font-bold text-lg sm:text-xl md:text-2xl text-ink group-hover:text-brand-blue leading-snug transition-colors relative inline-block"
                          >
                            <span className="relative z-10">{pub.title}</span>
                            <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-brand-blue scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"></span>
                          </h3>

                          {/* Summary text */}
                          <p className="text-xs sm:text-sm text-ink2 leading-relaxed line-clamp-3">
                            {pub.summary}
                          </p>
                        </div>

                        {/* Bottom line: Displays author, reading time (if available), and date */}
                        <div className="pt-4 border-t border-line/60 flex items-center justify-between text-xs text-mut font-semibold">
                          <div className="flex items-center gap-2">
                            {pub.authorsList ? (
                              <>
                                <span className="text-ink">{pub.authorsList}</span>
                                <span>·</span>
                              </>
                            ) : null}
                            {pub.readingTime ? (
                              <>
                                <span className="text-ink2">{pub.readingTime}</span>
                                <span>·</span>
                              </>
                            ) : null}
                            <span className="text-ink2">{pub.date}</span>
                          </div>
                          
                          {(pub.reads !== undefined || pub.downloads !== undefined) && (
                            <div className="flex items-center gap-3 text-mut">
                              {pub.reads !== undefined && (
                                <span className="flex items-center gap-1" title="Reads">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  <span>{pub.reads}</span>
                                </span>
                              )}
                              {pub.downloads !== undefined && (
                                <span className="flex items-center gap-1" title="Downloads">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                  <span>{pub.downloads}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

          </div>

        </div>

    </div>
  );
}
