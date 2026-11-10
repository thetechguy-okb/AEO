import { useState, useEffect } from 'react';
import { Database } from 'lucide-react';
import SEO from './components/SEO';
import { CMSProvider } from './context/CMSContext';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import AdminGuard from './components/AdminGuard';
import Header from './components/Header';
import Hero from './components/Hero';
import Stats from './components/Stats';
import LiveDashboard from './components/LiveDashboard';
import AuditReports from './components/AuditReports';
import AeoWeekly from './components/AeoWeekly';
import Diary from './components/Diary';
import Events from './components/Events';
import Team from './components/Team';
import Subscribe from './components/Subscribe';
import Footer from './components/Footer';
import ReportReader from './components/ReportReader';
import WeeklyReader from './components/WeeklyReader';
import CMSPanel from './components/CMSPanel';
import ReportsArchive from './components/ReportsArchive';
import WeeklyArchive from './components/WeeklyArchive';
import EventsArchive from './components/EventsArchive';
import AnnouncementsArchive from './components/AnnouncementsArchive';
import EhiiIndex from './components/EhiiIndex';
import DiaryPage from './components/DiaryPage';
import PublicationsPage from './components/PublicationsPage';
import EventReader from './components/EventReader';
import AnnouncementReader from './components/AnnouncementReader';
import ElectionDetails from './components/ElectionDetails';
import PastElectionsArchive from './components/PastElectionsArchive';
import { DemocraticCompetitivenessMap } from './components/DemocraticCompetitivenessMap';
import { DemocraticCompetitivenessMapNative } from './components/DemocraticCompetitivenessMapNative';
import DcmPreview from './components/DcmPreview';
import ApeaPage from './components/ApeaPage';

export default function App() {
  const getInitialPath = () => {
    // 1. Support hash routing (e.g. #/admin or #/weekly/issue-1)
    if (window.location.hash) {
      const hashPath = window.location.hash.substring(1);
      if (hashPath.startsWith('/')) return hashPath;
    }
    // 2. Support search query routing (e.g. ?path=/admin)
    const params = new URLSearchParams(window.location.search);
    const queryPath = params.get('path');
    if (queryPath && queryPath.startsWith('/')) return queryPath;

    // 3. Default to standard pathname
    return window.location.pathname;
  };

  const [path, setPath] = useState(getInitialPath());

  useEffect(() => {
    if (path === '/democracy-competitive-index' || path === '/publications/democracy-competitive-index') {
      window.history.replaceState({}, '', '/democratic-competitiveness-map');
      setPath('/democratic-competitiveness-map');
    }
  }, [path]);

  // Track virtual page views in Google Tag Manager (dataLayer) for SPA routing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push({
        event: 'page_view',
        page_path: path,
        page_location: window.location.href,
        page_title: document.title,
      });
    }
  }, [path]);

  useEffect(() => {
    const handleNavigation = () => {
      setPath(getInitialPath());
    };
    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);
    return () => {
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('hashchange', handleNavigation);
    };
  }, []);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const navigate = (to: string) => {
    if (window.location.hash) {
      window.location.hash = to;
    } else {
      window.history.pushState({}, '', to);
    }
    setPath(to);
    window.scrollTo(0, 0);
  };

  if (path === '/admin') {
    return (
      <AdminGuard 
        onNavigateHome={() => navigate('/')} 
      />
    );
  }

  let content = null;
  let seo = null;

  if (
    path === '/democratic-competitiveness-map' ||
    path === '/publications/democratic-competitiveness-map' ||
    path === '/dcm' ||
    path === '/dcm-preview' ||
    path === '/dcm-internal' ||
    path === '/democratic-competitiveness-map-preview' ||
    path === '/democratic-competitiveness-map/preview'
  ) {
    seo = (
      <SEO 
        title="Democratic Competitiveness Map (DCM) | Athena Election Observatory" 
        description="Evidence-based classifications of the practical conditions for political competition across Nigeria's 36 states and the Federal Capital Territory, updated bi-monthly." 
        canonicalPath="/democratic-competitiveness-map" 
      />
    );
    content = <DcmPreview />;
  } else if (
    path === '/apea' ||
    path.startsWith('/apea/') ||
    path === '/post-election-audits' ||
    path === '/post-election-audit'
  ) {
    seo = (
      <SEO 
        title="APEA — Athena Post-Election Audit | Election Integrity" 
        description="A permanent public record of how Nigeria's elections perform. Reconstructing the evidence chain from accreditation through polling-unit results, collation and final declaration." 
        canonicalPath="/apea" 
      />
    );
    content = <ApeaPage />;
  } else if (
    path === '/publications' ||
    path.startsWith('/publications/') ||
    path === '/reports-and-briefs' ||
    path === '/reports-briefs' ||
    path === '/political-landscape-monitor' ||
    path === '/africa-election-watch' ||
    path === '/aeo-weekly-digest' ||
    path === '/announcements'
  ) {
    if (path === '/reports-and-briefs' || path === '/reports-briefs' || path === '/publications/reports-and-briefs' || path === '/publications/reports-briefs') {
      seo = <SEO title="Reports and Briefs" description="Access our full registry of forensic election audits, sub-national tech assessments, and policy research briefs." canonicalPath="/publications/reports-and-briefs" />;
    } else if (path === '/political-landscape-monitor' || path === '/publications/political-landscape-monitor') {
      seo = <SEO title="Political Landscape Monitor" description="Sub-national technological assessments and electoral health monitoring across Nigerian states." canonicalPath="/publications/political-landscape-monitor" />;
    } else if (path === '/africa-election-watch' || path === '/publications/africa-election-watch') {
      seo = <SEO title="Africa Election Watch" description="Cross-border electoral monitoring, comparative regional research, and democratic health assessments across African nations." canonicalPath="/publications/africa-election-watch" />;
    } else if (path === '/aeo-weekly-digest' || path === '/publications/aeo-weekly-digest') {
      seo = <SEO title="AEO Weekly Digest" description="Weekly intelligence bulletins, electoral timeline updates, and democratic health monitoring." canonicalPath="/publications/aeo-weekly-digest" />;
    } else if (path === '/announcements' || path === '/publications/announcements') {
      seo = <SEO title="Press Bulletins & Announcements" description="Official press statements, bulletins, and observer deployment notices from the Athena Election Observatory." canonicalPath="/publications/announcements" />;
    } else {
      seo = <SEO title="Publications & Research" description="Access our full registry of forensic election audits, sub-national tech assessments, and policy research briefs." canonicalPath="/publications" />;
    }
    content = <PublicationsPage />;
  } else if (path === '/reports-archive') {
    seo = <SEO title="Reports Archive" description="The complete archival registry of election audit reports, technology assessments, and policy research." canonicalPath="/reports-archive" />;
    content = <ReportsArchive />;
  } else if (path === '/weekly-archive') {
    seo = <SEO title="Weekly Digest Archive" description="Comprehensive archive of AEO weekly intelligence bulletins." canonicalPath="/weekly-archive" />;
    content = <WeeklyArchive />;
  } else if (path === '/press-bulletins') {
    seo = <SEO title="Press Bulletins" description="Official press statements, bulletins, and observer deployment notices." canonicalPath="/press-bulletins" />;
    content = <AnnouncementsArchive />;
  } else if (path === '/events') {
    seo = <SEO title="Events" description="Upcoming and past election monitoring briefings, policy dialogues, and electoral technology workshops." canonicalPath="/events" />;
    content = <EventsArchive />;
  } else if (path === '/past-elections') {
    seo = <SEO title="Past Elections Archive" description="Historical election monitoring data, voter turnout records, and electoral audit scorecards." canonicalPath="/past-elections" />;
    content = <PastElectionsArchive />;
  } else if (path === '/elections') {
    seo = <SEO title="Elections & Electoral Data" description="Explore real-time election monitoring, voter turnouts, polling unit statistics, and election results across Nigeria." canonicalPath="/elections" />;
    content = <LiveDashboard isPreview={false} />;
  } else if (path.startsWith('/election/')) {
    const electionCode = path.substring('/election/'.length);
    content = (
      <ElectionDetails 
        electionCode={electionCode}
        onBack={() => navigate('/elections')}
        onOpenReport={(id) => navigate(`/report/${id}`)}
        onOpenWeekly={(id) => navigate(`/weekly/${id}`)}
      />
    );
  } else if (path === '/ehii') {
    seo = <SEO title="Electoral Health & Integrity Index (EHII)" description="Comprehensive assessment scoring election integrity, INEC performance, voter access, and security across Nigerian elections." canonicalPath="/ehii" />;
    content = <EhiiIndex />;
  } else if (path === '/diary') {
    seo = <SEO title="Electoral Diary & Timeline" description="Chronological timeline of electoral events, INEC deadlines, observer deployments, and key legal milestones." canonicalPath="/diary" />;
    content = <DiaryPage />;
  } else if (path === '/team' || path === '/our-team') {
    seo = <SEO title="Our Team" description="Meet the researchers, data analysts, field supervisors, and legal experts behind the Athena Election Observatory." canonicalPath="/team" />;
    content = <Team />;
  } else if (path === '/subscribe') {
    seo = <SEO title="Subscribe" description="Subscribe to receive AEO Weekly intelligence bulletins, audit report releases, and electoral alerts." canonicalPath="/subscribe" />;
    content = <Subscribe />;
  } else if (path.startsWith('/reports/')) {
    const reportId = path.substring('/reports/'.length);
    content = <ReportReader reportId={reportId} onClose={() => navigate('/publications')} />;
  } else if (path.startsWith('/report/')) {
    const reportId = path.substring('/report/'.length);
    content = <ReportReader reportId={reportId} onClose={() => navigate('/publications')} />;
  } else if (path.startsWith('/weekly/')) {
    const weeklyId = path.substring('/weekly/'.length);
    content = <WeeklyReader weeklyId={weeklyId} onClose={() => navigate('/publications')} />;
  } else if (path.startsWith('/announcement/')) {
    const announcementId = path.substring('/announcement/'.length);
    content = <AnnouncementReader announcementId={announcementId} onClose={() => navigate('/publications')} />;
  } else if (path.startsWith('/event/')) {
    const eventId = path.substring('/event/'.length);
    content = <EventReader eventId={eventId} onClose={() => navigate('/')} />;
  } else {
    seo = <SEO title="Athena Election Observatory (AEO) | Election Integrity, Data & Accountability" description="Independent, non-partisan election data, audits and democratic health insights from the Athena Election Observatory, an initiative of the Athena Centre for Policy and Leadership." canonicalPath="/" />;
    content = (
      <>
        <Hero />
        <LiveDashboard isPreview={true} />
        <AuditReports 
          onOpenReport={(id) => navigate(`/report/${id}`)} 
          onOpenWeekly={(id) => navigate(`/weekly/${id}`)} 
        />
        <Events />
        <Subscribe />
      </>
    );
  }

  return (
    <CMSProvider>
      {seo}
      <div className="min-h-screen flex flex-col bg-panel text-ink antialiased selection:bg-brand-blue/20">
        <Header currentPath={path} />
        <main className="flex-grow">
          {content}
        </main>
        <Footer />
      </div>
    </CMSProvider>
  );
}
