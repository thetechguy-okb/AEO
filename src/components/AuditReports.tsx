import { ArrowRight, Calendar, AlertCircle } from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import { formatReportDate, sortItemsByDate } from '../utils/date';
import { getItemSlug } from '../utils/url';

interface AuditReportsProps {
  onOpenReport: (id: string) => void;
  onOpenWeekly: (id: string) => void;
}

export default function AuditReports({ onOpenReport, onOpenWeekly }: AuditReportsProps) {
  const { reports, weekly, announcements } = useCMS();

  // Helper functions for categories/tags
  const getCategoryLabel = (cat?: string) => {
    switch (cat) {
      case 'press': return 'Press Release';
      case 'bulletin': return 'Official Bulletin';
      case 'statement': return 'Public Statement';
      case 'alert': return 'Security/Audit Alert';
      default: return cat || 'Announcement';
    }
  };

  const getCategoryColor = (cat?: string) => {
    switch (cat) {
      case 'press': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'bulletin': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'statement': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'alert': return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  // Combine all publication types into a unified list
  const combinedPublications = [
    ...reports.map(r => ({ ...r, unifiedType: 'report' as const })),
    ...weekly.map(w => ({ ...w, unifiedType: 'weekly' as const })),
    ...announcements.map(a => ({ ...a, unifiedType: 'announcement' as const }))
  ];

  // Sort all publications descending by date and take the 3 newest
  const newestPublications = sortItemsByDate<any>(combinedPublications, 'date', 'desc').slice(0, 3);

  const handleAllPublications = () => {
    window.history.pushState({}, '', '/publications');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <section className="py-16 bg-white border-b border-line" id="reports">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-line pb-6">
          <div>
            <span className="eyebrow text-brand-blue font-semibold uppercase tracking-wider block mb-1">Latest publications</span>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-ink">Recent Intelligence & Research</h2>
          </div>
        </div>

        {/* Dynamic 3-Card Display Grid for the 3 Newest Publications */}
        {newestPublications.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newestPublications.map((item) => {
              const imageUrl = item.image || '';
              const slug = getItemSlug(item);

              let tagText = '';
              let tagStyle = '';
              let handleCardClick = () => {};
              let linkText = 'Read publication';

              if (item.unifiedType === 'report') {
                tagText = item.tag || (item.tagType === 'africa-election-watch' ? 'Africa Election Watch' : 'Election Audit');
                tagStyle = item.tagType === 'analysis' 
                  ? 'bg-purple-50 text-brand-purple border-purple-100' 
                  : item.tagType === 'dcm'
                  ? 'bg-blue-50 text-brand-blue border-blue-100'
                  : item.tagType === 'africa-election-watch'
                  ? 'bg-teal-50 text-teal-700 border-teal-200'
                  : 'bg-green-50 text-brand-green border-green-100';
                handleCardClick = () => onOpenReport(slug);
                linkText = 'Read report';
              } else if (item.unifiedType === 'weekly') {
                tagText = item.tag || 'Weekly Briefing';
                tagStyle = 'bg-emerald-50 text-brand-green border-emerald-100';
                handleCardClick = () => onOpenWeekly(slug);
                linkText = 'Read issue';
              } else {
                tagText = getCategoryLabel((item as any).category);
                tagStyle = getCategoryColor((item as any).category);
                handleCardClick = () => {
                  window.history.pushState({}, '', `/announcement/${slug}`);
                  window.dispatchEvent(new PopStateEvent('popstate'));
                };
                linkText = 'Read announcement';
              }

              return (
                <div 
                  key={`${item.unifiedType}-${item.id}`}
                  onClick={handleCardClick}
                  className="bg-white border border-line rounded-xl shadow-custom hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between group overflow-hidden"
                >
                  <div>
                    {imageUrl && (
                      <div className="h-44 w-full overflow-hidden bg-slate-100 relative">
                        <img 
                          src={imageUrl} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                        <span className={`text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-full uppercase border ${tagStyle}`}>
                          {tagText}
                        </span>
                        <span className="text-xs font-mono font-semibold text-mut flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatReportDate(item.date)}
                        </span>
                      </div>

                      <h3 className="font-display font-bold text-base text-ink mb-2 group-hover:text-brand-blue transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                      
                      <p className="text-xs text-ink2 mb-4 leading-relaxed line-clamp-3">
                        {item.summary}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-0 mt-auto">
                    <div className="border-t border-line pt-3 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue font-mono group-hover:translate-x-1 transition-transform">
                        {linkText}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                      
                      {(item.reads !== undefined || item.downloads !== undefined) && (
                        <div className="flex items-center gap-3 text-mut text-[11px] font-mono">
                          {item.reads !== undefined && (
                            <span className="flex items-center gap-1" title="Reads">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>{item.reads}</span>
                            </span>
                          )}
                          {item.downloads !== undefined && (
                            <span className="flex items-center gap-1" title="Downloads">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              <span>{item.downloads}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-paper border border-line border-dashed rounded-2xl p-12 text-center max-w-lg mx-auto">
            <AlertCircle className="w-8 h-8 text-mut mx-auto mb-3" />
            <h4 className="font-display font-bold text-lg text-ink mb-1">No publications available yet</h4>
          </div>
        )}

        <div className="mt-12 text-center">
          <button 
            onClick={handleAllPublications}
            className="inline-flex items-center gap-2 text-xs font-bold font-mono tracking-wider text-ink bg-paper border border-line px-6 py-3.5 rounded-xl hover:border-brand-blue hover:text-brand-blue transition-all cursor-pointer uppercase shadow-sm"
          >
            Explore All Publications →
          </button>
        </div>

      </div>
    </section>
  );
}
