import { Mail, ArrowRight } from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import { formatReportDate, sortItemsByDate } from '../utils/date';

interface AeoWeeklyProps {
  onSelectIssue?: (id: string) => void;
}

export default function AeoWeekly({ onSelectIssue }: AeoWeeklyProps) {
  const { weekly } = useCMS();
  const sortedWeekly = sortItemsByDate(weekly, 'date', 'desc');

  return (
    <section className="py-16 bg-paper border-b border-line" id="weekly">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <span className="eyebrow text-brand-purple font-semibold">Weekly briefing</span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-ink mt-2 mb-4 leading-tight">
            AEO Weekly newsletter &amp; commentary
          </h2>
          <p className="text-ink2 text-base">
            Our weekly briefings and analytical commentary dissecting electoral integrity, democratic governance, and press releases.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedWeekly.map((issue) => {
            return (
              <div 
                key={issue.id}
                onClick={() => onSelectIssue?.(issue.id)}
                className="bg-white border border-line rounded-xl p-6 shadow-custom hover:shadow-md hover:border-brand-purple/40 transition-all flex flex-col justify-between cursor-pointer group hover:-translate-y-0.5 duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-full uppercase ${
                      issue.tag.includes('Newsletter') 
                        ? 'bg-blue-50 text-brand-blue border border-blue-100' 
                        : issue.tag.includes('Analysis')
                        ? 'bg-purple-50 text-brand-purple border border-purple-100'
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {issue.tag}
                    </span>
                    <span className="text-xs font-mono font-semibold text-mut">
                      {formatReportDate(issue.date)}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-base sm:text-lg text-ink mb-3 leading-snug group-hover:text-brand-purple transition-colors">
                    {issue.title}
                  </h3>
                  
                  <p className="text-xs text-ink2 mb-4 leading-relaxed">
                    {issue.summary}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-line flex items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectIssue?.(issue.id);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue font-mono cursor-pointer hover:underline"
                  >
                    <span>Read more</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <button 
            onClick={() => {
              window.history.pushState({}, '', '/weekly-archive');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className="inline-flex items-center gap-2 text-xs font-bold font-mono tracking-wider text-ink bg-paper border border-line px-5 py-3 rounded-lg hover:border-brand-purple hover:text-brand-purple transition-all cursor-pointer uppercase"
          >
            All weekly briefings &rarr;
          </button>
        </div>

      </div>
    </section>
  );
}
