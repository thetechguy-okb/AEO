import { useState, useEffect, useRef, FormEvent } from 'react';
import { ArrowLeft, Clock, Share2, Mail, Check, AlertCircle } from 'lucide-react';
import SEO from './SEO';
import { useCMS } from '../context/CMSContext';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { triggerPdfDownload } from './PublicationsPage';
import { formatReportDate } from '../utils/date';
import { generateSlug, getItemSlug } from '../utils/url';
import FormattedText from './FormattedText';
import DownloadButton from './DownloadButton';

interface WeeklyReaderProps {
  weeklyId: string | null;
  onClose: () => void;
}

export default function WeeklyReader({ weeklyId, onClose }: WeeklyReaderProps) {
  const { weekly, incrementPublicationStat } = useCMS();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subEmail, setSubEmail] = useState('');
  const [subError, setSubError] = useState('');
  const [hasShared, setHasShared] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const isDownloadingRef = useRef(false);

  const decodedId = weeklyId ? decodeURIComponent(weeklyId) : '';
  const issue = weekly.find(i => 
    (i.slug && (i.slug === weeklyId || i.slug === decodedId)) ||
    generateSlug(i.title) === weeklyId ||
    generateSlug(i.title) === decodedId ||
    i.id === weeklyId ||
    i.id === decodedId
  );

  useEffect(() => {
    if (weeklyId) {
      window.scrollTo(0, 0);
      setIsSubscribed(false);
      setSubEmail('');
      setSubError('');
      setHasShared(false);
    }
  }, [weeklyId]);

  useEffect(() => {
    if (issue) {
      const canonicalSlug = getItemSlug(issue);
      if (canonicalSlug && window.location.pathname !== `/weekly/${canonicalSlug}`) {
        window.history.replaceState({}, '', `/weekly/${canonicalSlug}`);
      }
      
      // Increment reads
      if (!sessionStorage.getItem(`read_weekly_${issue.id}`)) {
        sessionStorage.setItem(`read_weekly_${issue.id}`, 'true');
        incrementPublicationStat('weekly', issue.id, 'reads');
      }
    }
  }, [issue?.id, incrementPublicationStat]);

  if (!weeklyId) return null;
  if (!issue) return null;

  const getFullContent = (id: string) => {
    // If sections are defined on the issue itself (via CMS or data), use those
    // We shouldn't strictly require author or readingTime to show sections.
    if (issue.sections && issue.sections.length > 0) {
      return {
        author: issue.author || issue.authorsList || "Athena Research",
        readingTime: issue.readingTime || "5 min read",
        sections: issue.sections
      };
    }
    
    // Also check for 'content' or 'body' field if it was saved differently
    if ((issue as any).content || (issue as any).body || (issue as any).richText || (issue as any).html) {
      return {
        author: issue.author || issue.authorsList || "Athena Research",
        readingTime: issue.readingTime || "5 min read",
        sections: [
          {
            title: "",
            text: (issue as any).content || (issue as any).body || (issue as any).richText || (issue as any).html
          }
        ]
      };
    }

    switch (id) {
      case 'wk-1':
        return {
          author: "Athena Forensics Division",
          readingTime: "5 min read",
          sections: [
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
          ]
        };
      case 'wk-2':
        return {
          author: "Electoral Policy Research Group",
          readingTime: "8 min read",
          sections: [
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
          ]
        };
      case 'wk-3':
        return {
          author: "AEO Secretariat, Abuja",
          readingTime: "3 min read",
          sections: [
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
          ]
        };
      default:
        return {
          author: issue.author || "",
          readingTime: issue.readingTime || "4 min read",
          sections: []
        };
    }
  };

  const articleDetails = getFullContent(issue.id);

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    setSubError('');
    
    if (!subEmail || !subEmail.includes('@')) {
      setSubError('Please enter a valid email address.');
      return;
    }

    try {
      const subscriberId = 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
      const docRef = doc(db, 'subscribers', subscriberId);
      await setDoc(docRef, {
        email: subEmail.trim().toLowerCase(),
        channels: ['AEO Weekly'],
        subscribedAt: new Date().toISOString()
      });

      setIsSubscribed(true);
    } catch (err: any) {
      console.error('Weekly Reader Subscription error:', err);
      setSubError('Failed to subscribe. Please try again.');
    }
  };

  const handleShare = () => {
    setHasShared(true);
    setTimeout(() => setHasShared(false), 3000);
  };

  const handleDownloadPDF = () => {
    if (isDownloadingRef.current || isDownloaded) return;
    isDownloadingRef.current = true;
    setIsDownloaded(true);
    incrementPublicationStat('weekly', issue.id, 'downloads');
    triggerPdfDownload(
      issue.title,
      issue.summary,
      articleDetails.author,
      formatReportDate(issue.date),
      issue.pdfUrl,
      (articleDetails.sections || []).map((s, idx) => `${s.title}\n${s.text}`).join('\n\n')
    );
    setTimeout(() => {
      setIsDownloaded(false);
      isDownloadingRef.current = false;
    }, 4000);
  };

  return (
    <div className="bg-white min-h-screen font-sans animate-fade-in">
      <SEO 
        title={`${issue.title} | AEO Weekly Digest`}
        description={issue.summary}
        canonicalPath={`/weekly/${getItemSlug(issue)}`}
        ogType="article"
        ogImage={issue.image}
      />
      
      {/* Reader header navigation */}
      <div className="bg-white/95 border-b border-line shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <button 
            onClick={onClose}
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink2 hover:text-brand-purple focus:outline-none transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Weekly brief feed</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 bg-paper hover:bg-line border border-line text-ink text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{hasShared ? 'Copied link!' : 'Share Article'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main layout container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Article content */}
        <article className="lg:col-span-8 space-y-8">
          
          {/* Metadata heading */}
          <div className="space-y-4 border-b border-line pb-6">
            <span className={`text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-full uppercase inline-block ${
              (issue.tag || '').includes('Newsletter') 
                ? 'bg-blue-50 text-brand-blue border border-blue-100' 
                : (issue.tag || '').includes('Analysis')
                ? 'bg-purple-50 text-brand-purple border border-purple-100'
                : 'bg-amber-50 text-amber-700 border border-amber-100'
            }`}>
              {issue.tag || 'Weekly Issue'}
            </span>

            <h1 className="font-display font-bold text-3xl sm:text-4xl text-ink leading-tight">
              {issue.title}
            </h1>

            {/* Author card meta */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono font-medium text-mut pt-2">
              {articleDetails.author ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-full bg-brand-purple/10 text-brand-purple font-display font-bold text-[10px] flex items-center justify-center">
                      AE
                    </span>
                    <span className="text-ink font-semibold">{articleDetails.author}</span>
                  </div>
                  <span className="text-slate-300">|</span>
                </>
              ) : null}
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{articleDetails.readingTime}</span>
              </div>
              <span className="text-slate-300">|</span>
              <span>Published: {formatReportDate(issue.date)}</span>
            </div>

            {/* Mobile Download Action (under metadata, before article body) */}
            {issue.pdfUrl && (
              <div className="pt-2 lg:hidden">
                <DownloadButton
                  fileUrl={issue.pdfUrl}
                  buttonLabel={issue.downloadButtonLabel || 'Download Report'}
                  onDownload={handleDownloadPDF}
                  isDownloaded={isDownloaded}
                  fullWidthOnMobile={true}
                />
              </div>
            )}
          </div>

          {/* Render Sections */}
          <div className="space-y-8 text-ink2 text-sm sm:text-base leading-relaxed">
            {(articleDetails.sections || []).map((sec, idx) => (
              <div key={idx} className="space-y-3">
                {sec.title && (
                  <h2 className="font-display font-bold text-lg sm:text-xl text-ink">
                    {sec.title}
                  </h2>
                )}
                <FormattedText content={sec.text} />
              </div>
            ))}
          </div>

          {/* Bottom Download Action */}
          {issue.pdfUrl && (
            <div className="mt-10 pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-mut font-medium">
                {issue.downloadSectionTitle || 'Download Official Statement'}
              </div>
              <DownloadButton
                fileUrl={issue.pdfUrl}
                buttonLabel={issue.downloadButtonLabel || 'Download Report'}
                onDownload={handleDownloadPDF}
                isDownloaded={isDownloaded}
                fullWidthOnMobile={true}
              />
            </div>
          )}

        </article>

        {/* Sidebar widgets */}
        <aside className="lg:col-span-4 space-y-6">
          
          {/* Desktop Download Action (Top of Sidebar, above AEO Updates Stream) */}
          {issue.pdfUrl && (
            <div className="hidden lg:block">
              <DownloadButton
                fileUrl={issue.pdfUrl}
                buttonLabel={issue.downloadButtonLabel || 'Download Report'}
                onDownload={handleDownloadPDF}
                isDownloaded={isDownloaded}
                className="w-full"
              />
            </div>
          )}

          {/* Subscribe widget */}
          <div className="bg-paper border border-line rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-sm text-ink uppercase tracking-wider">
              AEO Updates Stream
            </h3>
            <p className="text-xs text-ink2 leading-relaxed">
              Don't miss the next analytical update. Subscribe to get immediate, unedited findings directly in your inbox.
            </p>

            {isSubscribed ? (
              <div className="bg-green-50 border border-green-200 p-4 rounded-xl text-center space-y-2 animate-fade-in">
                <Check className="w-5 h-5 text-brand-green mx-auto" />
                <span className="block text-xs font-semibold text-green-800">Subscription Verified!</span>
                <span className="block text-[10px] text-mut font-mono">{subEmail}</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-3">
                <input
                  type="email"
                  placeholder="name@organization.org"
                  value={subEmail}
                  onChange={(e) => { setSubEmail(e.target.value); setSubError(''); }}
                  className="w-full text-xs p-3 border border-line rounded-lg focus:ring-2 focus:ring-brand-purple bg-white text-ink"
                />
                {subError && (
                  <p className="text-[10px] text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {subError}
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full bg-brand-purple hover:bg-purple-700 text-white font-mono font-bold text-xs uppercase tracking-wider py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  Confirm Subscription
                </button>
              </form>
            )}
          </div>



        </aside>

      </div>

    </div>
  );
}
