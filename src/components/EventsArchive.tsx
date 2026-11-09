import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Tag, Calendar, Search, AlertCircle } from 'lucide-react';
import { useCMS } from '../context/CMSContext';

export default function EventsArchive() {
  const { events } = useCMS();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'briefing' | 'workshop' | 'forum'>('all');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const navigateTo = (to: string) => {
    window.history.pushState({}, '', to);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const filteredEvents = events.filter((evt) => {
    const matchesSearch = 
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.location.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedType === 'all') return matchesSearch;
    return matchesSearch && evt.type.toLowerCase().includes(selectedType);
  });

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

          {/* Page Header */}
          <div className="max-w-3xl mb-12">
            <span className="eyebrow text-brand-blue font-semibold">Observatory Engagements</span>
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-ink mt-2 mb-4 leading-tight">
              Observatory Events &amp; Convenings
            </h1>
            <p className="text-ink2 text-base">
              The full public registry of Athena Election Observatory briefing engagements, technical workshops, and comparative roundtables. Join our live and digital platforms to participate in the democratic conversation.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
            
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-colors whitespace-nowrap cursor-pointer ${
                  selectedType === 'all' 
                    ? 'bg-navy text-white' 
                    : 'bg-paper text-ink2 hover:bg-line border border-line'
                }`}
              >
                All Events ({events.length})
              </button>
              <button
                onClick={() => setSelectedType('briefing')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-colors whitespace-nowrap cursor-pointer ${
                  selectedType === 'briefing' 
                    ? 'bg-brand-blue text-white' 
                    : 'bg-paper text-ink2 hover:bg-line border border-line'
                }`}
              >
                Briefings ({events.filter(e => e.type.toLowerCase().includes('briefing')).length})
              </button>
              <button
                onClick={() => setSelectedType('workshop')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-colors whitespace-nowrap cursor-pointer ${
                  selectedType === 'workshop' 
                    ? 'bg-brand-purple text-white' 
                    : 'bg-paper text-ink2 hover:bg-line border border-line'
                }`}
              >
                Workshops ({events.filter(e => e.type.toLowerCase().includes('workshop')).length})
              </button>
              <button
                onClick={() => setSelectedType('forum')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-colors whitespace-nowrap cursor-pointer ${
                  selectedType === 'forum' 
                    ? 'bg-brand-green text-white' 
                    : 'bg-paper text-ink2 hover:bg-line border border-line'
                }`}
              >
                Forums ({events.filter(e => e.type.toLowerCase().includes('forum')).length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-mut" />
              </div>
              <input
                type="text"
                placeholder="Search events, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-line rounded-lg text-sm bg-white text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>

          </div>

          {/* Events Grid */}
          {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((evt) => (
                <div 
                  key={evt.id}
                  className="bg-white border border-line rounded-xl p-6 shadow-custom hover:shadow-md transition-all flex items-start gap-5 relative group"
                >
                  {/* Date Box */}
                  <div className="flex-shrink-0 w-16 text-center border border-line rounded-xl overflow-hidden bg-white shadow-sm">
                    <div className="bg-navy text-white text-[10px] font-mono py-1 font-bold tracking-wider uppercase">
                      {evt.month}
                    </div>
                    <div className="font-display font-bold text-2xl py-2 text-ink">
                      {evt.day}
                    </div>
                  </div>

                  {/* Event Content */}
                  <div className="space-y-2 flex-1">
                    <span className="text-[9px] font-mono font-bold tracking-widest text-brand-blue uppercase bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {evt.type}
                    </span>
                    <h4 className="font-display font-bold text-base sm:text-lg text-ink group-hover:text-brand-blue transition-colors pt-1">
                      {evt.title}
                    </h4>
                    <p className="text-xs text-ink2 leading-relaxed">
                      {evt.description}
                    </p>

                    {/* Meta location & type */}
                    <div className="pt-3 flex items-center justify-between gap-x-4 gap-y-1.5 text-xs font-mono font-medium text-mut border-t border-line/60 mt-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-brand-blue" />
                        {evt.location}
                      </span>
                      <button
                        onClick={() => {
                          window.history.pushState({}, '', `/event/${evt.id}`);
                          window.dispatchEvent(new PopStateEvent('popstate'));
                        }}
                        className="text-[10px] font-bold font-mono text-brand-blue hover:text-brand-blue-dark transition-colors cursor-pointer uppercase tracking-wider"
                      >
                        Learn More →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-line border-dashed rounded-2xl p-12 text-center max-w-lg mx-auto">
              <AlertCircle className="w-8 h-8 text-mut mx-auto mb-3" />
              <h4 className="font-display font-bold text-lg text-ink mb-1">No events match your criteria</h4>
              <p className="text-xs text-ink2 mb-4">Try clearing your search query or choosing another category.</p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedType('all'); }}
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
