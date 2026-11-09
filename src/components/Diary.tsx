import { useState, useMemo } from 'react';
import { 
  Calendar, Layers, Landmark, MapPin, Globe, Filter, X, 
  ChevronRight, ArrowRight, ShieldCheck, Search, Users, ChevronDown 
} from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import { DiaryItem } from '../types';
import DiaryElectionDetail from './DiaryElectionDetail';
import { sortItemsByDate, parseDateValue, formatReportDate } from '../utils/date';

export default function Diary() {
  const { diaryNat, diaryLoc, diaryAfr, diaryOth } = useCMS();

  // Selected Diary Item for Full Detail View
  const [selectedItem, setSelectedItem] = useState<DiaryItem | null>(null);

  // Filter States
  const [regionFilter, setRegionFilter] = useState<'all' | 'nigeria' | 'africa' | 'other'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'presidential' | 'governorship' | 'local_government'>('all');
  const [timingFilter, setTimingFilter] = useState<'all' | 'upcoming' | 'concluded' | 'past'>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const getEffectiveStatus = (item: DiaryItem) => {
    const timestamp = (item as any)._timestamp || parseDateValue(item.date);
    if (!timestamp) return item.status || 'Scheduled';

    const now = new Date();
    now.setHours(0,0,0,0);
    const todayTime = now.getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    if (item.status === 'Concluded') return 'Concluded';

    if (timestamp < todayTime) {
      return 'Concluded';
    } else if (timestamp >= todayTime && timestamp < todayTime + dayMs) {
      return 'Ongoing';
    } else {
      return item.status || 'Scheduled';
    }
  };

  // Combine all items and auto-assign region/type if missing
  const allDiaryItems = useMemo(() => {
    const nat = diaryNat.map(item => ({
      ...item,
      region: item.region || 'nigeria' as const,
      type: item.type || (item.title.toLowerCase().includes('presidential') ? 'presidential' as const : 'governorship' as const)
    }));

    const loc = diaryLoc.map(item => ({
      ...item,
      region: item.region || 'nigeria' as const,
      type: item.type || 'local_government' as const
    }));

    const afr = diaryAfr.map(item => ({
      ...item,
      region: item.region || 'africa' as const,
      type: item.type || 'presidential' as const
    }));

    const oth = diaryOth.map(item => ({
      ...item,
      region: item.region || 'other' as const,
      type: item.type || 'presidential' as const
    }));

    const combined = [...nat, ...loc, ...afr, ...oth];
    return combined.map(item => {
      const timestamp = parseDateValue(item.date);
      let y = null;
      if (timestamp > 0) {
        y = new Date(timestamp).getFullYear();
      } else {
        const dStr = String(item.date || '').trim();
        const yMatch = dStr.match(/\d{4}/);
        if (yMatch) {
          y = parseInt(yMatch[0], 10);
        }
      }
      return { ...item, _timestamp: timestamp, _year: y };
    });
  }, [diaryNat, diaryLoc, diaryAfr, diaryOth]);

  // Filtered and Date-Sorted List based on criteria
  const filteredData = useMemo(() => {
    const list = allDiaryItems.filter(item => {
      // 1. Region filter
      if (regionFilter !== 'all' && item.region !== regionFilter) {
        return false;
      }

      // 2. Type filter
      if (typeFilter !== 'all' && item.type !== typeFilter) {
        return false;
      }

      // 3. Timing Filter (Active Calendar / Upcoming / Concluded / Past)
      const now = new Date();
      now.setHours(0,0,0,0);
      const todayTime = now.getTime();
      const itemTimestamp = (item as any)._timestamp || parseDateValue(item.date);
      const isPast = itemTimestamp > 0 && itemTimestamp < todayTime;
      const daysSincePast = isPast ? (todayTime - itemTimestamp) / (1000 * 60 * 60 * 24) : 0;
      
      if (timingFilter === 'upcoming') {
        if (isPast) return false;
      } else if (timingFilter === 'concluded') {
        if (!isPast) return false;
      } else if (timingFilter === 'past') {
        if (!isPast) return false;
      } else {
        // 'all' - Active Calendar view: show upcoming and recently concluded (within 14 days)
        if (isPast && daysSincePast > 14) return false;
      }

      // 3b. Year Filter
      if (yearFilter !== 'all') {
        if (String((item as any)._year) !== yearFilter) {
          return false;
        }
      }

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesSubtitle = item.subtitle.toLowerCase().includes(q);
        const matchesCountry = item.country?.toLowerCase().includes(q);
        const matchesExec = item.sittingExecutive?.name.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSubtitle && !matchesCountry && !matchesExec) {
          return false;
        }
      }

      return true;
    });

    // Always sort by date chronologically
    return sortItemsByDate(list, 'date', 'asc');
  }, [allDiaryItems, regionFilter, typeFilter, timingFilter, yearFilter, searchQuery]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    allDiaryItems.forEach(item => {
      if ((item as any)._year) years.add((item as any)._year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [allDiaryItems]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In view':
        return 'bg-amber-500/10 text-amber-700 border-amber-300';
      case 'Scheduled':
      case 'Upcoming':
        return 'bg-blue-500/10 text-blue-700 border-blue-300';
      case 'Ongoing':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-300 animate-pulse';
      case 'Provisional':
        return 'bg-purple-500/10 text-brand-purple border-purple-300';
      case 'Tracking':
        return 'bg-slate-500/10 text-slate-700 border-slate-300';
      case 'Concluded':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-blue-500/10 text-blue-700 border-blue-300';
    }
  };

  const resetFilters = () => {
    setRegionFilter('all');
    setTypeFilter('all');
    setTimingFilter('all');
    setYearFilter('all');
    setSearchQuery('');
  };

  const activeFiltersCount = 
    (regionFilter !== 'all' ? 1 : 0) + 
    (typeFilter !== 'all' ? 1 : 0) + 
    (timingFilter !== 'all' ? 1 : 0) + (yearFilter !== 'all' ? 1 : 0) +
    (searchQuery.trim() !== '' ? 1 : 0);

  const handleSelectQuickFilter = (region: 'all' | 'nigeria' | 'africa' | 'other', type: 'all' | 'presidential' | 'governorship' | 'local_government' = 'all') => {
    setRegionFilter(region);
    setTypeFilter(type);
  };

  const handleNavigateToElection = (code: string) => {
    window.history.pushState({}, '', `/election/${code}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // If an election is selected, show full election detail view
  if (selectedItem) {
    return (
      <section className="py-8 sm:py-12 bg-panel min-h-screen" id="diary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <DiaryElectionDetail 
            item={selectedItem} 
            onBack={() => setSelectedItem(null)}
            onNavigateToElection={handleNavigateToElection}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 bg-panel border-b border-line" id="diary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-brand-blue bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            <Calendar className="w-3.5 h-3.5 text-brand-blue" />
            Electoral Timelines & Intelligence
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-5xl text-ink leading-tight">
            Diary of Election
          </h2>
          <p className="text-ink2 text-sm sm:text-base leading-relaxed">
            Comprehensive electoral tracking across Nigerian elections (Presidential, Governorship, Local Government), African nations, and international benchmarks. Click any election to view complete candidate lists and sitting executive data.
          </p>
        </div>

        {/* Quick Filter Bar Pills */}
        <div className="flex flex-wrap items-center gap-2 border-b border-line pb-4">
          <button
            onClick={() => handleSelectQuickFilter('all', 'all')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              regionFilter === 'all' && typeFilter === 'all'
                ? 'bg-navy border-navy text-white shadow-sm'
                : 'bg-white hover:bg-paper border-line text-ink2'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            All Elections
          </button>

          <button
            onClick={() => handleSelectQuickFilter('nigeria', 'presidential')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              regionFilter === 'nigeria' && typeFilter === 'presidential'
                ? 'bg-navy border-navy text-white shadow-sm'
                : 'bg-white hover:bg-paper border-line text-ink2'
            }`}
          >
            <Landmark className="w-3.5 h-3.5 text-amber-500" />
            Nigeria: Presidential
          </button>

          <button
            onClick={() => handleSelectQuickFilter('nigeria', 'governorship')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              regionFilter === 'nigeria' && typeFilter === 'governorship'
                ? 'bg-navy border-navy text-white shadow-sm'
                : 'bg-white hover:bg-paper border-line text-ink2'
            }`}
          >
            <Landmark className="w-3.5 h-3.5 text-brand-blue" />
            Nigeria: Governorship
          </button>

          <button
            onClick={() => handleSelectQuickFilter('nigeria', 'local_government')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              regionFilter === 'nigeria' && typeFilter === 'local_government'
                ? 'bg-navy border-navy text-white shadow-sm'
                : 'bg-white hover:bg-paper border-line text-ink2'
            }`}
          >
            <Landmark className="w-3.5 h-3.5 text-emerald-500" />
            Nigeria: Local Government
          </button>

          <button
            onClick={() => handleSelectQuickFilter('africa', 'all')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              regionFilter === 'africa'
                ? 'bg-navy border-navy text-white shadow-sm'
                : 'bg-white hover:bg-paper border-line text-ink2'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-purple-500" />
            Africa
          </button>

          <button
            onClick={() => handleSelectQuickFilter('other', 'all')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              regionFilter === 'other'
                ? 'bg-navy border-navy text-white shadow-sm'
                : 'bg-white hover:bg-paper border-line text-ink2'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            Other Continents
          </button>
        </div>

        {/* Main Grid: Filters Card (Sidebar) + Elections List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: FILTERS Card (Styled exactly as requested) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl border border-line p-5 shadow-custom space-y-5 sticky top-6">
              
              {/* Card Title Header */}
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h3 className="font-display font-bold text-lg sm:text-xl text-ink flex items-center gap-2">
                  <Filter className="w-5 h-5 text-brand-blue" />
                  Filter
                </h3>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="text-[11px] font-mono text-brand-blue hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reset
                  </button>
                )}
              </div>

              {/* Oval Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-paper/80 border border-line rounded-full text-xs text-ink placeholder:text-slate-400 focus:outline-none focus:border-brand-blue shadow-2xs transition-colors"
                />
              </div>

              {/* Status and Year Filters */}
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={timingFilter}
                  onChange={(e) => setTimingFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-paper border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-brand-blue"
                >
                  <option value="all">Active Calendar</option>
                  <option value="upcoming">Upcoming Elections</option>
                  <option value="concluded">Concluded Elections</option>
                  <option value="past">All Past History</option>
                </select>

                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-paper border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-brand-blue"
                >
                  <option value="all">All Years</option>
                  {availableYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Exact Tree List as drawn in Sketch */}
              <div className="space-y-1 pt-1">
                
                {/* 1. All Option */}
                <button
                  onClick={() => {
                    setRegionFilter('all');
                    setTypeFilter('all');
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    regionFilter === 'all' && typeFilter === 'all'
                      ? 'bg-navy text-white shadow-xs'
                      : 'hover:bg-paper text-ink border border-transparent hover:border-line/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 opacity-75" />
                    <span>All Elections</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    regionFilter === 'all' && typeFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {allDiaryItems.length}
                  </span>
                </button>

                {/* 2. Nigeria Parent */}
                <div className="space-y-0.5 pt-1">
                  <button
                    onClick={() => {
                      setRegionFilter('nigeria');
                      setTypeFilter('all');
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      regionFilter === 'nigeria' && typeFilter === 'all'
                        ? 'bg-navy text-white shadow-xs'
                        : 'hover:bg-paper text-ink border border-transparent hover:border-line/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-amber-500" />
                      <span>Nigeria</span>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      regionFilter === 'nigeria' && typeFilter === 'all' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {allDiaryItems.filter(i => i.region === 'nigeria').length}
                    </span>
                  </button>

                  {/* Nigeria Sub-items (Indented) */}
                  <div className="pl-6 space-y-1 border-l-2 border-line/60 ml-5 my-1">
                    
                    {/* Presidential */}
                    <button
                      onClick={() => {
                        setRegionFilter('nigeria');
                        setTypeFilter('presidential');
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        regionFilter === 'nigeria' && typeFilter === 'presidential'
                          ? 'bg-brand-blue text-white shadow-xs font-bold'
                          : 'hover:bg-paper text-ink2 hover:text-ink'
                      }`}
                    >
                      <span>Presidential</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-md ${
                        regionFilter === 'nigeria' && typeFilter === 'presidential' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {allDiaryItems.filter(i => i.region === 'nigeria' && i.type === 'presidential').length}
                      </span>
                    </button>

                    {/* Governorship */}
                    <button
                      onClick={() => {
                        setRegionFilter('nigeria');
                        setTypeFilter('governorship');
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        regionFilter === 'nigeria' && typeFilter === 'governorship'
                          ? 'bg-brand-blue text-white shadow-xs font-bold'
                          : 'hover:bg-paper text-ink2 hover:text-ink'
                      }`}
                    >
                      <span>Governorship</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-md ${
                        regionFilter === 'nigeria' && typeFilter === 'governorship' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {allDiaryItems.filter(i => i.region === 'nigeria' && i.type === 'governorship').length}
                      </span>
                    </button>

                    {/* Local Government */}
                    <button
                      onClick={() => {
                        setRegionFilter('nigeria');
                        setTypeFilter('local_government');
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        regionFilter === 'nigeria' && typeFilter === 'local_government'
                          ? 'bg-brand-blue text-white shadow-xs font-bold'
                          : 'hover:bg-paper text-ink2 hover:text-ink'
                      }`}
                    >
                      <span>Local Government</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-md ${
                        regionFilter === 'nigeria' && typeFilter === 'local_government' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {allDiaryItems.filter(i => i.region === 'nigeria' && i.type === 'local_government').length}
                      </span>
                    </button>

                  </div>
                </div>

                {/* 3. Africa Parent */}
                <button
                  onClick={() => {
                    setRegionFilter('africa');
                    setTypeFilter('all');
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    regionFilter === 'africa'
                      ? 'bg-navy text-white shadow-xs'
                      : 'hover:bg-paper text-ink border border-transparent hover:border-line/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-purple-500" />
                    <span>Africa</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    regionFilter === 'africa' ? 'bg-white/20 text-white' : 'bg-purple-50 text-purple-700'
                  }`}>
                    {allDiaryItems.filter(i => i.region === 'africa').length}
                  </span>
                </button>

                {/* 4. Other Continents Parent */}
                <button
                  onClick={() => {
                    setRegionFilter('other');
                    setTypeFilter('all');
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    regionFilter === 'other'
                      ? 'bg-navy text-white shadow-xs'
                      : 'hover:bg-paper text-ink border border-transparent hover:border-line/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-500" />
                    <span>Other Continents</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    regionFilter === 'other' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {allDiaryItems.filter(i => i.region === 'other').length}
                  </span>
                </button>

              </div>

              {/* Active Filter Counter Footer */}
              <div className="pt-2 border-t border-line text-[11px] font-mono text-mut flex justify-between items-center">
                <span>Showing {filteredData.length} of {allDiaryItems.length} polls</span>
                {activeFiltersCount > 0 && (
                  <span className="text-brand-blue font-bold">Filtered View</span>
                )}
              </div>

            </div>
          </div>

          {/* Right Column: Elections List Container */}
          <div className="lg:col-span-8 space-y-4">
            
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-mut">
                Electoral Calendar List ({filteredData.length})
              </span>
              <span className="text-[11px] text-brand-blue font-mono">
                Click any row to open full election page
              </span>
            </div>

            {filteredData.length > 0 ? (
              <div className="bg-white border border-line rounded-3xl overflow-hidden shadow-custom divide-y divide-line">
                {filteredData.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => {
                      setSelectedItem(item);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="p-5 sm:p-6 hover:bg-blue-50/40 transition-all cursor-pointer group relative"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      
                      {/* Date Badge */}
                      <div className="md:col-span-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-brand-blue uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 group-hover:bg-blue-100 transition-colors">
                          <Calendar className="w-3.5 h-3.5 text-brand-blue" />
                          {formatReportDate(item.date)}
                        </span>
                      </div>

                      {/* Title & Metadata */}
                      <div className="md:col-span-6 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-bold text-base sm:text-lg text-ink group-hover:text-brand-blue transition-colors">
                            {item.title}
                          </h4>
                        </div>
                        <p className="text-xs text-mut font-medium uppercase tracking-wider flex items-center gap-2">
                          <span>{item.subtitle}</span>
                          {item.country && (
                            <>
                              <span>•</span>
                              <span className="text-slate-600 font-bold">{item.country}</span>
                            </>
                          )}
                        </p>
                      </div>

                      {/* Status & Arrow Action */}
                      <div className="md:col-span-3 flex items-center md:justify-end justify-between gap-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider border ${getStatusColor(getEffectiveStatus(item))}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {getEffectiveStatus(item)}
                        </span>

                        <div className="w-8 h-8 rounded-full bg-paper border border-line flex items-center justify-center text-slate-400 group-hover:bg-brand-blue group-hover:text-white group-hover:border-brand-blue transition-all shrink-0">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>

                    </div>

                    {/* Sitting Executive preview bar if present */}
                    {item.sittingExecutive && (
                      <div className="mt-3 pt-3 border-t border-line/50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-mut">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>Incumbent Executive: <strong className="text-ink">{item.sittingExecutive.name}</strong> ({item.sittingExecutive.party})</span>
                        </div>
                        <span className="text-brand-blue font-mono font-bold text-[10px] group-hover:underline flex items-center gap-1">
                          View Participants & Details <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-line p-12 text-center space-y-4 shadow-custom">
                <Filter className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="font-display font-bold text-lg text-ink">No elections match selected filter</h3>
                <p className="text-xs text-mut max-w-sm mx-auto">
                  Try adjusting region, type, or status filters to view upcoming and tracked polls.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-brand-blue text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-brand-blue-dark transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
}
