import { useState } from 'react';
import { Search, Calendar, Tag, ArrowUpRight, ArrowLeft, Bell, FileText, AlertTriangle } from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import { formatReportDate, sortItemsByDate } from '../utils/date';

export default function AnnouncementsArchive() {
  const { announcements } = useCMS();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'press' | 'bulletin' | 'statement' | 'alert'>('all');

  const filteredAnnouncements = sortItemsByDate(
    announcements.filter((ann) => {
      const titleText = ann.title || '';
      const summaryText = ann.summary || '';
      const contentText = ann.content || '';
      const matchesSearch = 
        titleText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        summaryText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contentText.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || ann.category === selectedCategory;

      return matchesSearch && matchesCategory;
    }),
    'date',
    'desc'
  );

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'press': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'bulletin': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'statement': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'alert': return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'press': return 'Press Release';
      case 'bulletin': return 'Official Bulletin';
      case 'statement': return 'Public Statement';
      case 'alert': return 'Security/Audit Alert';
      default: return cat;
    }
  };

  const handleBackToHome = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="min-h-screen bg-panel text-ink flex flex-col antialiased">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-navy text-white py-4 border-b border-white/10 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button 
            onClick={handleBackToHome}
            className="flex items-center gap-2 text-xs font-bold font-mono tracking-wider text-blue-100 hover:text-white transition-colors uppercase cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
          <div className="text-[10px] uppercase font-mono tracking-widest text-brand-purple font-bold">
            Athena Election Observatory
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Block */}
        <div className="max-w-3xl mb-12">
          <span className="eyebrow text-brand-purple font-semibold">Observatory Announcements</span>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-ink mt-2 mb-4 leading-tight">
            Official Press &amp; Bulletins
          </h1>
          <p className="text-ink2 text-base leading-relaxed">
            Access our independent public declarations, verified media releases, and alerts regarding electoral administration, integrity index scoring, and compliance audits.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="bg-white border border-line rounded-2xl p-5 mb-8 shadow-custom space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4.5 w-4.5 text-mut" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search statements, titles, key terms..."
                className="block w-full pl-10 pr-3 py-2.5 border border-line rounded-xl text-xs bg-panel text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="md:col-span-7 flex flex-wrap gap-2 md:justify-end">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-colors cursor-pointer ${
                  selectedCategory === 'all' 
                    ? 'bg-navy text-white' 
                    : 'bg-panel text-ink2 hover:bg-line'
                }`}
              >
                All Announcements ({announcements.length})
              </button>
              <button
                onClick={() => setSelectedCategory('press')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-colors cursor-pointer ${
                  selectedCategory === 'press' 
                    ? 'bg-navy text-white' 
                    : 'bg-panel text-ink2 hover:bg-line'
                }`}
              >
                Press Releases ({announcements.filter(a => a.category === 'press').length})
              </button>
              <button
                onClick={() => setSelectedCategory('bulletin')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-colors cursor-pointer ${
                  selectedCategory === 'bulletin' 
                    ? 'bg-navy text-white' 
                    : 'bg-panel text-ink2 hover:bg-line'
                }`}
              >
                Bulletins ({announcements.filter(a => a.category === 'bulletin').length})
              </button>
              <button
                onClick={() => setSelectedCategory('statement')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-colors cursor-pointer ${
                  selectedCategory === 'statement' 
                    ? 'bg-navy text-white' 
                    : 'bg-panel text-ink2 hover:bg-line'
                }`}
              >
                Statements ({announcements.filter(a => a.category === 'statement').length})
              </button>
              <button
                onClick={() => setSelectedCategory('alert')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-colors cursor-pointer ${
                  selectedCategory === 'alert' 
                    ? 'bg-navy text-white' 
                    : 'bg-panel text-ink2 hover:bg-line'
                }`}
              >
                Alerts ({announcements.filter(a => a.category === 'alert').length})
              </button>
            </div>
          </div>
        </div>

        {/* Announcements List / Cards */}
        {filteredAnnouncements.length === 0 ? (
          <div className="bg-white border border-line rounded-2xl p-16 text-center max-w-2xl mx-auto shadow-custom">
            <Bell className="w-10 h-10 text-brand-purple mx-auto mb-4 animate-bounce" />
            <h4 className="font-display font-bold text-lg text-ink mb-2">No announcements as of the moment</h4>
            <p className="text-ink2 text-xs max-w-md mx-auto leading-relaxed">
              There are no official press statements, security alerts, or compliance bulletins matching your selection right now. Please subscribe to our newsletters to be notified of updates.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAnnouncements.map((ann) => (
              <div 
                key={ann.id}
                onClick={() => {
                  window.history.pushState({}, '', `/announcement/${ann.id}`);
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="bg-white border border-line rounded-2xl p-6 sm:p-8 shadow-custom hover:shadow-md transition-all flex flex-col md:flex-row gap-6 items-start relative group cursor-pointer"
              >
                {/* Date stamp */}
                <div className="flex-shrink-0 w-16 text-center border border-line rounded-xl overflow-hidden bg-white shadow-sm self-start md:self-auto">
                  <div className="bg-navy text-white text-[10px] font-mono py-1 font-bold tracking-wider uppercase">
                    {ann.month}
                  </div>
                  <div className="font-display font-bold text-2xl py-2 text-ink">
                    {ann.day}
                  </div>
                </div>

                {/* Main details */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getCategoryColor(ann.category)}`}>
                        {getCategoryLabel(ann.category)}
                      </span>
                      <span className="text-xs text-mut font-mono flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatReportDate(ann.date)}
                      </span>
                    </div>
                    
                    {(ann.reads !== undefined || ann.downloads !== undefined) && (
                      <div className="flex items-center gap-3 text-mut text-[11px] font-mono pr-8">
                        {ann.reads !== undefined && (
                          <span className="flex items-center gap-1" title="Reads">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>{ann.reads}</span>
                          </span>
                        )}
                        {ann.downloads !== undefined && (
                          <span className="flex items-center gap-1" title="Downloads">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>{ann.downloads}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <h3 className="font-display font-bold text-lg sm:text-xl text-ink group-hover:text-brand-blue transition-colors leading-tight">
                    {ann.title}
                  </h3>

                  <p className="text-ink2 text-xs leading-relaxed sm:text-sm">
                    {ann.summary}
                  </p>

                  {ann.content && (
                    <div className="mt-4 p-4 rounded-xl bg-panel border border-line/60 font-mono text-[11px] text-ink2 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                      {ann.content}
                    </div>
                  )}
                </div>

                <div className="absolute top-6 right-6 text-mut group-hover:text-brand-blue transition-colors hidden sm:block">
                  <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 -translate-y-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer copyright */}
      <div className="bg-navy text-white/40 py-6 border-t border-white/5 shrink-0 text-center text-[10px] font-mono">
        © 2026 Athena Election Observatory · Independent Registry Gate
      </div>
    </div>
  );
}
