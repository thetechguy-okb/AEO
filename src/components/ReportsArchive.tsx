import React, { useState, useEffect } from 'react';
import { Search, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import { formatReportDate, sortItemsByDate } from '../utils/date';
import { getItemSlug } from '../utils/url';

export default function ReportsArchive() {
  const { reports } = useCMS();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<'all' | 'brief' | 'analysis' | 'tech' | 'dcm' | 'africa-election-watch'>('all');

  useEffect(() => {
    window.scrollTo(0, 0);
    if (window.history.state && window.history.state.tag) {
      setSelectedTag(window.history.state.tag);
    }
  }, []);

  const navigateTo = (to: string) => {
    window.history.pushState({}, '', to);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const filteredReports = sortItemsByDate(
    reports.filter((report) => {
      const matchesSearch = 
        (report.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (report.summary || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      if (selectedTag === 'all') return matchesSearch;
      return matchesSearch && report.tagType === selectedTag;
    }),
    'date',
    'desc'
  );

  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb / Back button */}
        <div className="mb-8">
          <button 
            onClick={() => navigateTo('/')}
            className="inline-flex items-center gap-2 text-xs font-bold font-mono tracking-wider text-brand-blue hover:text-brand-blue-dark transition-colors cursor-pointer uppercase"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>

          {/* Page Header */}
          <div className="max-w-3xl mb-12">
            <span className="eyebrow text-brand-blue font-semibold">Publications Archive</span>
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-ink mt-2 mb-4 leading-tight">
              Reports and Briefs
            </h1>
            <p className="text-ink2 text-base">
              The complete archival registry of election audit reports, technology assessments, democracy briefs, and policy analyses. Every publication rigorously scores electoral processes against primary source evidence.
            </p>
          </div>

          {/* Search and Filter Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
            
            {/* Tag Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedTag('all')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-colors whitespace-nowrap cursor-pointer ${
                  selectedTag === 'all' 
                    ? 'bg-navy text-white' 
                    : 'bg-paper text-ink2 hover:bg-line border border-line'
                }`}
              >
                All Reports ({reports.length})
              </button>
              <button
                onClick={() => setSelectedTag('brief')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-colors whitespace-nowrap cursor-pointer ${
                  selectedTag === 'brief' 
                    ? 'bg-brand-blue text-white' 
                    : 'bg-paper text-ink2 hover:bg-line border border-line'
                }`}
              >
                Reports & Briefs ({reports.filter(r => r.tagType === 'brief').length})
              </button>
              <button
                onClick={() => setSelectedTag('analysis')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-colors whitespace-nowrap cursor-pointer ${
                  selectedTag === 'analysis' 
                    ? 'bg-brand-purple text-white' 
                    : 'bg-paper text-ink2 hover:bg-line border border-line'
                }`}
              >
                Election Analysis ({reports.filter(r => r.tagType === 'analysis').length})
              </button>
              <button
                onClick={() => setSelectedTag('tech')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-colors whitespace-nowrap cursor-pointer ${
                  selectedTag === 'tech' 
                    ? 'bg-brand-green text-white' 
                    : 'bg-paper text-ink2 hover:bg-line border border-line'
                }`}
              >
                Technology Assessment ({reports.filter(r => r.tagType === 'tech').length})
              </button>
              <button
                onClick={() => setSelectedTag('dcm')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-colors whitespace-nowrap cursor-pointer ${
                  selectedTag === 'dcm' 
                    ? 'bg-brand-blue text-white' 
                    : 'bg-paper text-ink2 hover:bg-line border border-line'
                }`}
              >
                Democratic Competitiveness Map ({reports.filter(r => r.tagType === 'dcm').length})
              </button>
              <button
                onClick={() => setSelectedTag('africa-election-watch')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-colors whitespace-nowrap cursor-pointer ${
                  selectedTag === 'africa-election-watch' 
                    ? 'bg-teal-700 text-white' 
                    : 'bg-paper text-ink2 hover:bg-line border border-line'
                }`}
              >
                Africa Election Watch ({reports.filter(r => r.tagType === 'africa-election-watch').length})
              </button>
            </div>

            {/* Search Box */}
            <div className="relative flex-1 sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-mut" />
              </div>
              <input
                type="text"
                placeholder="Search reports by title, region..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-line rounded-lg text-sm bg-white text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>

          </div>

          {/* Reports Grid */}
          {filteredReports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReports.map((report) => (
                <div 
                  key={report.id}
                  onClick={() => navigateTo(`/reports/${getItemSlug(report)}`)}
                  className="bg-white border border-line rounded-xl p-6 shadow-custom hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between group duration-200"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
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
                      <span className="text-xs font-mono font-semibold text-mut flex items-center gap-1.5">
                        {report.readingTime ? (
                          <>
                            <span>{report.readingTime}</span>
                            <span>·</span>
                          </>
                        ) : null}
                        <span>{formatReportDate(report.date)}</span>
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-lg text-ink mb-2 group-hover:text-brand-blue transition-colors">
                      {report.title}
                    </h3>
                    
                    <p className="text-xs text-ink2 mb-6 leading-relaxed">
                      {report.summary}
                    </p>
                  </div>

                  <div className="border-t border-line pt-4 mt-auto">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue font-mono group-hover:translate-x-1 transition-transform">
                        Read more
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                      
                      {(report.reads !== undefined || report.downloads !== undefined) && (
                        <div className="flex items-center gap-3 text-mut text-[11px] font-mono">
                          {report.reads !== undefined && (
                            <span className="flex items-center gap-1" title="Reads">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>{report.reads}</span>
                            </span>
                          )}
                          {report.downloads !== undefined && (
                            <span className="flex items-center gap-1" title="Downloads">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              <span>{report.downloads}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-line border-dashed rounded-2xl p-12 text-center max-w-lg mx-auto">
              <AlertCircle className="w-8 h-8 text-mut mx-auto mb-3" />
              <h4 className="font-display font-bold text-lg text-ink mb-1">No reports match your filters</h4>
              <p className="text-xs text-ink2 mb-4">Try clearing your search query or choosing another tab tag.</p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedTag('all'); }}
                className="text-xs bg-navy hover:bg-navy-dark text-white font-semibold font-mono tracking-wider px-4 py-2 rounded-lg"
              >
                Reset Filters
              </button>
            </div>
          )}

      </div>
    </div>
  );
}
