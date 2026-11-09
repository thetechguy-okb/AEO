import { useEffect, useState } from 'react';
import { Calendar, ArrowRight, User } from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import { formatReportDate, sortItemsByDate } from '../utils/date';
import { getItemSlug } from '../utils/url';

export default function Hero() {
  const { heroConfig, reports, weekly, announcements } = useCMS();

  // Combine all publication types into a unified list and get the single newest article
  const combinedPublications = [
    ...reports.map(r => ({ ...r, unifiedType: 'report' as const })),
    ...weekly.map(w => ({ ...w, unifiedType: 'weekly' as const })),
    ...announcements.map(a => ({ ...a, unifiedType: 'announcement' as const }))
  ];

  const latestArticle = sortItemsByDate<any>(combinedPublications, 'date', 'desc')[0];

  const getCategoryText = (item: any) => {
    if (!item) return 'Publication';
    if (item.unifiedType === 'report') {
      return item.tag || 'Election Audit';
    }
    if (item.unifiedType === 'weekly') {
      return item.tag || 'Weekly Briefing';
    }
    return item.category || 'Announcement';
  };

  const handleReadLatest = () => {
    if (!latestArticle) return;
    let targetPath = '';
    if (latestArticle.unifiedType === 'report') {
      targetPath = `/report/${getItemSlug(latestArticle)}`;
    } else if (latestArticle.unifiedType === 'weekly') {
      targetPath = `/weekly/${getItemSlug(latestArticle)}`;
    } else {
      targetPath = `/announcement/${getItemSlug(latestArticle)}`;
    }
    window.history.pushState({}, '', targetPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderTitleWithGradient = (text: string) => {
    const parts = text.split(/\{([^}]+)\}/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <span 
            key={index} 
            className="text-transparent bg-clip-text bg-gradient-to-r"
            style={{ 
              backgroundImage: `linear-gradient(to right, ${heroConfig.titleHighlightFrom || '#93C5FD'}, ${heroConfig.titleHighlightTo || '#86EFAC'})` 
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <section 
      id="about" 
      className="text-white py-12 sm:py-16 md:py-20 border-b border-white/5 relative overflow-hidden"
      style={{ backgroundColor: heroConfig.heroBgColor || '#1E3A5F' }}
    >

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Main Hero Copy */}
          <div className="lg:col-span-7 space-y-6">
            
            <h1 
              className={`${heroConfig.titleFontFamily || 'font-display'} ${heroConfig.titleFontSize || 'text-4xl sm:text-5xl lg:text-6xl'} font-bold tracking-tight leading-none`}
              style={{ color: heroConfig.titleColor || '#FFFFFF' }}
            >
              {renderTitleWithGradient(heroConfig.title)}
            </h1>
            
            <p 
              className={`${heroConfig.descriptionFontFamily || 'font-sans'} ${heroConfig.descriptionFontSize || 'text-base sm:text-lg'} max-w-xl leading-relaxed`}
              style={{ color: heroConfig.descriptionColor || '#DBEAFE' }}
            >
              {heroConfig.description}
            </p>
            
            <div className="flex flex-wrap gap-4 pt-2">
              <button 
                onClick={() => {
                  window.history.pushState({}, '', '/ehii');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="inline-flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-semibold text-sm px-6 py-3 rounded-lg transition-colors cursor-pointer shadow-lg shadow-brand-blue/25"
              >
                {heroConfig.exploreButtonText}
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <button 
                onClick={() => handleScroll('reports')}
                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/20 text-white font-semibold text-sm px-6 py-3 rounded-lg transition-colors cursor-pointer"
              >
                {heroConfig.auditButtonText}
              </button>
            </div>
          </div>

          {/* Latest Article Snapshot Card */}
          <div className="lg:col-span-5">
            {latestArticle ? (
              <div 
                onClick={handleReadLatest}
                className="bg-white/5 border border-white/15 hover:border-white/30 rounded-2xl p-6 sm:p-7 shadow-2xl relative backdrop-blur-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Card Header & Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-mono tracking-widest text-emerald-300 font-bold uppercase flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Latest Article
                    </span>
                    <span className="text-[10px] font-mono bg-blue-500/20 text-blue-200 border border-blue-500/30 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      {getCategoryText(latestArticle)}
                    </span>
                  </div>

                  {/* Featured Image if available */}
                  {latestArticle.image && (
                    <div className="h-40 w-full overflow-hidden rounded-xl mb-4 bg-slate-900/50 border border-white/10 relative">
                      <img 
                        src={latestArticle.image} 
                        alt={latestArticle.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="font-display font-bold text-lg sm:text-xl text-white mb-2 group-hover:text-blue-200 transition-colors line-clamp-2 leading-snug">
                    {latestArticle.title}
                  </h3>

                  {/* Date & Meta */}
                  <div className="text-xs text-blue-200/80 font-medium mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-blue-300" />
                        {formatReportDate(latestArticle.date)}
                      </span>
                      {latestArticle.author && (
                        <span className="flex items-center gap-1 text-[11px]">
                          <User className="w-3.5 h-3.5 text-blue-300" />
                          {latestArticle.author}
                        </span>
                      )}
                    </div>
                    
                    {(latestArticle.reads !== undefined || latestArticle.downloads !== undefined) && (
                      <div className="flex items-center gap-3 text-blue-200/60 text-[11px] font-mono">
                        {latestArticle.reads !== undefined && (
                          <span className="flex items-center gap-1" title="Reads">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>{latestArticle.reads}</span>
                          </span>
                        )}
                        {latestArticle.downloads !== undefined && (
                          <span className="flex items-center gap-1" title="Downloads">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>{latestArticle.downloads}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Summary Excerpt */}
                  <p className="text-xs text-blue-100/80 leading-relaxed mb-6 line-clamp-3">
                    {latestArticle.summary}
                  </p>
                </div>

                {/* Action Button: Read More */}
                <div className="pt-3 border-t border-white/10">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReadLatest();
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-semibold text-xs font-mono uppercase tracking-wider py-3 px-5 rounded-xl transition-all cursor-pointer shadow-lg shadow-brand-blue/20 group-hover:bg-brand-blue-dark"
                  >
                    <span>Read More</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

              </div>
            ) : (
              <div className="bg-white/5 border border-white/15 rounded-2xl p-6 text-center text-blue-200">
                <p className="text-sm">No publications available yet.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
