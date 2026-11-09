import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, FileText, Loader2, Sparkles, BookOpen, Clock, AlertCircle } from 'lucide-react';
import SEO from './SEO';
import { useCMS } from '../context/CMSContext';
import { triggerPdfDownload } from './PublicationsPage';
import { formatReportDate } from '../utils/date';
import { generateSlug, getItemSlug } from '../utils/url';
import FormattedText from './FormattedText';
import DownloadButton from './DownloadButton';

interface ReportReaderProps {
  reportId: string | null;
  onClose: () => void;
}

export default function ReportReader({ reportId, onClose }: ReportReaderProps) {
  const { reports, incrementPublicationStat } = useCMS();
  const [isDownloaded, setIsDownloaded] = useState(false);
  const isDownloadingRef = useRef(false);

  const decodedId = reportId ? decodeURIComponent(reportId) : '';
  const report = reports.find(r => 
    (r.slug && (r.slug === reportId || r.slug === decodedId)) ||
    generateSlug(r.title) === reportId ||
    generateSlug(r.title) === decodedId ||
    r.id === reportId ||
    r.id === decodedId
  );

  // Auto-scroll to top ONCE when navigating to a new report
  useEffect(() => {
    if (reportId) {
      window.scrollTo(0, 0);
      setIsDownloaded(false);
    }
  }, [reportId]);

  // Synchronize canonical URL & increment read stats ONCE per report ID
  useEffect(() => {
    if (report) {
      const canonicalSlug = getItemSlug(report);
      if (canonicalSlug && window.location.pathname !== `/reports/${canonicalSlug}` && window.location.pathname !== `/report/${canonicalSlug}`) {
        window.history.replaceState({}, '', `/reports/${canonicalSlug}`);
      }
      
      // Increment reads
      if (!sessionStorage.getItem(`read_report_${report.id}`)) {
        sessionStorage.setItem(`read_report_${report.id}`, 'true');
        incrementPublicationStat('report', report.id, 'reads');
      }
    }
  }, [report?.id, incrementPublicationStat]);

  if (!reportId) return null;
  if (!report) return null;

  const handleDownloadPDF = () => {
    if (isDownloadingRef.current || isDownloaded) return;
    isDownloadingRef.current = true;
    setIsDownloaded(true);
    incrementPublicationStat('report', report.id, 'downloads');
    triggerPdfDownload(
      report.title,
      report.summary,
      report.authorsList || report.author || 'AEO Research Team',
      report.date,
      report.pdfUrl,
      (report.sections || []).map((s, idx) => `Chapter ${idx + 1}: ${s.title}\n${s.content}`).join('\n\n')
    );
    setTimeout(() => {
      setIsDownloaded(false);
      isDownloadingRef.current = false;
    }, 4000);
  };

  return (
    <div className="bg-white min-h-screen font-sans animate-fade-in">
      <SEO 
        title={report.title}
        description={report.summary || report.sections?.[0]?.content?.substring(0, 160) || 'Forensic audit report by Athena Election Observatory.'}
        canonicalPath={`/reports/${getItemSlug(report)}`}
        ogType="article"
        ogImage={report.image}
      />
      
      {/* Reader Navigation Bar */}
      <div className="bg-white/95 border-b border-line shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <button 
            onClick={onClose}
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink2 hover:text-brand-blue focus:outline-none transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>
              ← Back to {report.tagType === 'africa-election-watch' ? 'Africa Election Watch' : report.tagType === 'tech' ? 'Political Landscape Monitor' : report.tagType === 'dcm' ? 'Democratic Competitiveness Map' : report.tagType === 'brief' ? 'Reports & Briefs' : 'All audit reports'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Document Content */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        
        {/* Document Header Metadata */}
        <div className="border-b border-line pb-6 mb-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-full uppercase ${
                  report.tagType === 'analysis' 
                    ? 'bg-purple-50 text-brand-purple border border-purple-100' 
                    : report.tagType === 'dcm'
                    ? 'bg-blue-50 text-brand-blue border border-blue-100'
                    : report.tagType === 'africa-election-watch'
                    ? 'bg-teal-50 text-teal-700 border border-teal-200'
                    : 'bg-green-50 text-brand-green border border-green-100'
                }`}>
                  {report.tagType === 'africa-election-watch' ? (report.tag || 'Africa Election Watch') : report.tag}
                </span>
                {report.status === 'archived' && (
                  <span className="text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-full uppercase bg-slate-100 text-slate-700 border border-slate-300">
                    Archived
                  </span>
                )}
                {report.status === 'current' && (
                  <span className="text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-full uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Current
                  </span>
                )}
              </div>

              <h1 className="font-display font-bold text-3xl sm:text-4xl text-ink leading-tight tracking-tight">
                {report.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-mut font-sans mt-2">
                {(report.authorsList || report.author) ? (
                  <>
                    <span className="text-ink font-semibold">{report.authorsList || report.author}</span>
                    <span className="text-slate-300">·</span>
                  </>
                ) : null}
                {report.readingTime ? (
                  <>
                    <span className="flex items-center gap-1.5 text-ink2">
                      <Clock className="w-4 h-4 text-mut" />
                      <span>{report.readingTime}</span>
                    </span>
                    <span className="text-slate-300">·</span>
                  </>
                ) : null}
                <span>{formatReportDate(report.date)}</span>
              </div>
            </div>

            {/* Upper Right Action Area on Desktop / Under Metadata on Mobile */}
            {report.pdfUrl && (
              <div className="shrink-0 pt-1 md:pt-2 w-full md:w-auto">
                <DownloadButton
                  fileUrl={report.pdfUrl}
                  buttonLabel={report.downloadButtonLabel || 'Download Report'}
                  onDownload={handleDownloadPDF}
                  isDownloaded={isDownloaded}
                  fullWidthOnMobile={true}
                />
              </div>
            )}
          </div>
        </div>

        {/* Archived Document Notification */}
        {report.status === 'archived' && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-xs sm:text-sm flex items-start gap-3 mb-8">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase tracking-wider font-mono text-xs text-amber-800">
                Archived Publication
              </p>
              <p className="mt-0.5">
                This is a historical DCM update for the reporting period <strong className="font-semibold">{report.reportingPeriod || report.date}</strong>. Historical publications are retained in the observatory archive for comparative research.
              </p>
            </div>
          </div>
        )}

        {/* Dynamic Section Contents */}
        <div className="space-y-8 text-ink text-sm sm:text-base leading-relaxed">
          {(report.sections && report.sections.length > 0) ? (
            report.sections.map((section, idx) => (
              <section key={idx} className="space-y-3">
                <h2 className="font-display font-bold text-xl sm:text-2xl text-ink flex items-center gap-2">
                  {section.title}
                </h2>
                <FormattedText content={section.content} className="text-ink2 pl-0 sm:pl-5" />
              </section>
            ))
          ) : (
            <FormattedText content={(report as any).content || (report as any).body || (report as any).richText || (report as any).html} className="text-ink2" />
          )}
        </div>

        {/* Bottom Download Action */}
        {report.pdfUrl && (
          <div className="mt-12 pt-8 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-mut font-medium">
              {report.downloadSectionTitle || 'Download Official Statement'}
            </div>
            <DownloadButton
              fileUrl={report.pdfUrl}
              buttonLabel={report.downloadButtonLabel || 'Download Report'}
              onDownload={handleDownloadPDF}
              isDownloaded={isDownloaded}
              fullWidthOnMobile={true}
            />
          </div>
        )}

      </article>

    </div>
  );
}
