import React, { useState, useMemo, useEffect } from 'react';
import { 
  Award, Calendar, Filter, RotateCcw, AlertTriangle, ShieldCheck, 
  ArrowRight, Info, ChevronRight, FileText, CheckCircle2, AlertCircle, Eye,
  Sparkles, Layers, Download, Check
} from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import { 
  DcmPublication, 
  DcmClassification, 
  DCM_COLORS, 
  DCM_CLASSIFICATIONS,
  NIGERIA_37_JURISDICTIONS,
  MONTH_NAMES 
} from '../types/dcm';
import { compareDcmPublications, sortDcmChronologically } from '../utils/dcmComparison';
import { DcmMap } from './DcmMap';
import { DcmTimeline } from './DcmTimeline';
import { DcmBriefRequestModal } from './DcmBriefRequestModal';
import { INITIAL_DCM_PUBLICATIONS } from '../data/dcmInitialData';

export const DemocraticCompetitivenessMapNative: React.FC = () => {
  const { dcmPublications } = useCMS();

  // Use CMS publications if available, otherwise fallback to initial seed
  const publications: DcmPublication[] = useMemo(() => {
    if (dcmPublications && dcmPublications.length > 0) {
      return dcmPublications.filter(p => p.status === 'published');
    }
    return INITIAL_DCM_PUBLICATIONS.filter(p => p.status === 'published');
  }, [dcmPublications]);

  // Chronologically sorted (descending for latest-first selection)
  const sortedDesc = useMemo(() => {
    return [...publications].sort((a, b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime());
  }, [publications]);

  // Default publication: latest published
  const [selectedPubId, setSelectedPubId] = useState<string>(() => {
    const latest = sortedDesc.find(p => p.isLatest) || sortedDesc[0];
    return latest?.id || INITIAL_DCM_PUBLICATIONS[0].id;
  });

  // Selected state on map (null = "All States" default)
  const [selectedStateCode, setSelectedStateCode] = useState<string | null>(null);

  // Toggle for change highlighting
  const [highlightChanges, setHighlightChanges] = useState<boolean>(false);

  // Modal for Request DCM Brief
  const [isBriefModalOpen, setIsBriefModalOpen] = useState<boolean>(false);

  // Active publication object
  const activePublication = useMemo(() => {
    return publications.find(p => p.id === selectedPubId) || sortedDesc[0] || INITIAL_DCM_PUBLICATIONS[0];
  }, [publications, selectedPubId, sortedDesc]);

  // When publications load or change, ensure valid selection
  useEffect(() => {
    if (!publications.some(p => p.id === selectedPubId) && sortedDesc.length > 0) {
      setSelectedPubId(sortedDesc[0].id);
    }
  }, [publications, selectedPubId, sortedDesc]);

  // Comparison against immediately preceding publication
  const comparison = useMemo(() => {
    return compareDcmPublications(activePublication, publications);
  }, [activePublication, publications]);

  // Set of changed state codes for fast lookup & map rendering
  const changedStateCodes = useMemo(() => {
    return new Set(comparison.changedStates.map(s => s.stateCode));
  }, [comparison]);

  // Available Years
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(publications.map(p => p.year)));
    return years.sort((a, b) => b - a);
  }, [publications]);

  // Available Months for selected Year
  const availableMonths = useMemo(() => {
    const months = Array.from(
      new Set(
        publications
          .filter(p => p.year === activePublication.year)
          .map(p => p.month)
      )
    );
    return months.sort((a, b) => a - b);
  }, [publications, activePublication.year]);

  // Available Periods for selected Year & Month
  const availablePeriods = useMemo(() => {
    return publications
      .filter(p => p.year === activePublication.year && p.month === activePublication.month)
      .sort((a, b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime());
  }, [publications, activePublication.year, activePublication.month]);

  // Handlers for selectors
  const handleYearChange = (year: number) => {
    const pubInYear = publications.find(p => p.year === year);
    if (pubInYear) {
      setSelectedPubId(pubInYear.id);
    }
  };

  const handleMonthChange = (month: number) => {
    const pubInMonth = publications.find(p => p.year === activePublication.year && p.month === month);
    if (pubInMonth) {
      setSelectedPubId(pubInMonth.id);
    }
  };

  const handlePeriodChange = (pubId: string) => {
    setSelectedPubId(pubId);
  };

  // State counts summary for active publication (STRICT DATA INTEGRITY: Never convert missing to Insufficient evidence)
  const { stateCounts, unavailableCount, totalValidAudited } = useMemo(() => {
    const counts: Record<DcmClassification, number> = {
      'Open': 0,
      'Emerging concern': 0,
      'Constrained': 0,
      'Severely constrained': 0,
      'Insufficient evidence': 0
    };
    let unavail = 0;

    for (const j of NIGERIA_37_JURISDICTIONS) {
      const rec = activePublication.classifications[j.code];
      const cls = rec?.classification;
      if (cls && DCM_CLASSIFICATIONS.includes(cls)) {
        counts[cls] = (counts[cls] || 0) + 1;
      } else {
        unavail += 1;
      }
    }

    const totalValid = Object.values(counts).reduce((acc, c) => acc + c, 0);

    return {
      stateCounts: counts,
      unavailableCount: unavail,
      totalValidAudited: totalValid
    };
  }, [activePublication]);

  // Selected state details
  const selectedStateRecord = selectedStateCode ? activePublication.classifications[selectedStateCode] : null;
  const selectedStateMeta = selectedStateCode ? NIGERIA_37_JURISDICTIONS.find(j => j.code === selectedStateCode) : null;

  const scrollToMap = () => {
    const mapEl = document.getElementById('dcm-map-section');
    if (mapEl) {
      mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="py-12 sm:py-16 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

        {/* =================================================================== */}
        {/* 1. DCM INTRODUCTION (APPROVED WORDING & PROMINENT DISCLAIMER)       */}
        {/* =================================================================== */}
        <section className="border-b border-line pb-8 space-y-5" aria-labelledby="dcm-intro-title">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-brand-blue shrink-0" />
            <span className="text-xs font-mono font-bold tracking-widest text-brand-blue uppercase">
              Athena Election Observatory (AEO)
            </span>
          </div>

          <h1 id="dcm-intro-title" className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-ink leading-tight">
            Democratic Competitiveness Map (DCM)
          </h1>

          <div className="bg-white border border-line rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
            <h2 className="font-display font-bold text-xl sm:text-2xl text-ink">
              What is DCM?
            </h2>
            <p className="text-ink2 text-base leading-relaxed">
              The Democratic Competitiveness Map (DCM) is AEO’s state-by-state outlook of the conditions under which political competition occurs in Nigeria. It uses verified evidence to show the extent to which Nigeria’s political and institutional environment allows political actors to freely organise, campaign, and compete for public offices under fair, lawful, and reasonably equal conditions.
            </p>
            <p className="text-ink2 text-base leading-relaxed">
              The documented conditions in a particular state and during a defined reporting period are summarised and represented in a colour map.
            </p>
            <p className="text-ink2 text-base leading-relaxed">
              The DCM does not score or rank the states. Therefore, the colour map is not a numerical score, a political label, or a permanent judgment on a state.
            </p>

            {/* MANDATORY HIGH-VISIBILITY DISCLAIMER BANNER */}
            <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl flex items-center gap-3 text-amber-950 font-display font-bold text-base sm:text-lg shadow-2xs">
              <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
              <span>The DCM does not score or rank states.</span>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* 2. EXPLORE DCM PUBLICATIONS (CONTROLS & SELECTORS)                  */}
        {/* =================================================================== */}
        <section className="bg-white border border-line rounded-2xl p-5 sm:p-6 shadow-sm space-y-5" aria-labelledby="dcm-controls-title">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-blue block">
                Explore DCM Publications
              </span>
              <h2 id="dcm-controls-title" className="text-lg font-bold text-ink mt-0.5">
                Active Publication: {activePublication.title}
              </h2>
            </div>

            {/* Highlight Changes Toggle & Clear Selection Controls */}
            <div className="flex items-center gap-3 flex-wrap">
              {comparison.isBaseline ? (
                <span className="text-xs font-mono text-slate-500 italic bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                  Baseline publication — no earlier publication for comparison
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setHighlightChanges(!highlightChanges)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-2 border cursor-pointer ${
                    highlightChanges
                      ? 'bg-blue-50 text-brand-blue border-blue-300 ring-2 ring-brand-blue/20'
                      : 'bg-white text-ink2 border-line hover:border-slate-400'
                  }`}
                  aria-pressed={highlightChanges}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${highlightChanges ? 'bg-brand-blue animate-pulse' : 'bg-slate-300'}`} />
                  <span>
                    {highlightChanges 
                      ? `Showing ${comparison.totalChanged} changed jurisdiction${comparison.totalChanged !== 1 ? 's' : ''}`
                      : `Highlight ${comparison.totalChanged} changed jurisdiction${comparison.totalChanged !== 1 ? 's' : ''}`
                    }
                  </span>
                  {comparison.totalChanged > 0 && !highlightChanges && (
                    <span className="px-1.5 py-0.2 bg-brand-blue text-white rounded-full text-[10px]">
                      {comparison.totalChanged}
                    </span>
                  )}
                </button>
              )}

              {selectedStateCode && (
                <button
                  type="button"
                  onClick={() => setSelectedStateCode(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear selection (All States)</span>
                </button>
              )}
            </div>
          </div>

          {/* Cascading Filter Selectors: Year | Month | Period | State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Year Selector */}
            <div className="space-y-1.5">
              <label htmlFor="dcm-year-select" className="text-xs font-mono font-bold text-ink2 uppercase tracking-wider block">
                1. Year
              </label>
              <select
                id="dcm-year-select"
                value={activePublication.year}
                onChange={(e) => handleYearChange(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-line rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue text-ink font-medium"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Month Selector */}
            <div className="space-y-1.5">
              <label htmlFor="dcm-month-select" className="text-xs font-mono font-bold text-ink2 uppercase tracking-wider block">
                2. Month
              </label>
              <select
                id="dcm-month-select"
                value={activePublication.month}
                onChange={(e) => handleMonthChange(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-line rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue text-ink font-medium"
              >
                {availableMonths.map(m => (
                  <option key={m} value={m}>{MONTH_NAMES[m - 1]}</option>
                ))}
              </select>
            </div>

            {/* Publication Period Selector */}
            <div className="space-y-1.5">
              <label htmlFor="dcm-period-select" className="text-xs font-mono font-bold text-ink2 uppercase tracking-wider block">
                3. Publication Period
              </label>
              <select
                id="dcm-period-select"
                value={activePublication.id}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-line rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue text-ink font-semibold"
              >
                {availablePeriods.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.reportingPeriodLabel} {p.isBaseline ? '(Baseline Publication)' : p.isLatest ? '★ (Latest)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* State Selector */}
            <div className="space-y-1.5">
              <label htmlFor="dcm-state-select" className="text-xs font-mono font-bold text-ink2 uppercase tracking-wider block">
                4. Focus State
              </label>
              <select
                id="dcm-state-select"
                value={selectedStateCode || ''}
                onChange={(e) => setSelectedStateCode(e.target.value ? e.target.value : null)}
                className="w-full px-3 py-2 text-sm border border-line rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue text-ink font-medium"
              >
                <option value="">All States (Full National View)</option>
                {NIGERIA_37_JURISDICTIONS.map(j => {
                  const stateRec = activePublication.classifications[j.code];
                  const stateClass = stateRec?.classification;
                  return (
                    <option key={j.code} value={j.code}>
                      {j.name} ({stateClass || 'Data unavailable'})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* 3. INTERACTIVE MAP AND CLASSIFICATION LEGEND                        */}
        {/* =================================================================== */}
        <section id="dcm-map-section" className="bg-white border border-line rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm" aria-labelledby="dcm-map-title">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-blue">
                State-by-State Overview
              </span>
              <h3 id="dcm-map-title" className="font-display font-bold text-xl sm:text-2xl text-ink">
                {selectedStateCode ? `${selectedStateMeta?.name} State Selected` : 'National DCM Classification'}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-ink2 bg-slate-100 px-3 py-1 rounded-md border border-slate-200">
                Period: <strong className="text-ink">{activePublication.reportingPeriodLabel}</strong>
              </span>
            </div>
          </div>

          {/* Interactive SVG Map */}
          <div className="w-full bg-paper rounded-2xl border border-line p-4 sm:p-6 flex items-center justify-center">
            <DcmMap
              publication={activePublication}
              selectedStateCode={selectedStateCode}
              onSelectState={(code) => setSelectedStateCode(code)}
              highlightChanges={highlightChanges}
              changedStateCodes={changedStateCodes}
            />
          </div>

          {/* Controlled Classification Legend */}
          <div className="space-y-3 pt-2 border-t border-line">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink">
                DCM Classification Legend
              </span>
              <span className="text-xs text-mut font-mono">
                {totalValidAudited === 37 ? (
                  <strong className="text-ink">37 jurisdictions assessed</strong>
                ) : (
                  <span>
                    <strong className="text-ink">{totalValidAudited} / 37</strong> jurisdictions assessed
                    {unavailableCount > 0 && <span className="text-amber-600 ml-1">({unavailableCount} unavailable)</span>}
                  </span>
                )}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {(Object.keys(DCM_COLORS) as DcmClassification[]).map((cls) => {
                const meta = DCM_COLORS[cls];
                const count = stateCounts[cls] || 0;
                return (
                  <div 
                    key={cls}
                    className="p-3 rounded-xl border border-line bg-paper/60 space-y-1.5 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10"
                          style={{ backgroundColor: meta.fill }}
                        />
                        <span className="text-xs font-bold text-ink">{cls}</span>
                      </div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                        {count}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink2 leading-relaxed pl-5">
                      {meta.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-mut italic pt-1 leading-relaxed">
              Colours represent documented political and institutional conditions during a specific reporting period. They are not scores, rankings, ratings, or permanent political labels.
            </p>
          </div>
        </section>

        {/* =================================================================== */}
        {/* 4. SELECTED-STATE DETAILS / HISTORY                                 */}
        {/* =================================================================== */}
        <section aria-labelledby="dcm-state-section-title">
          {selectedStateRecord && selectedStateMeta ? (
            <div className="bg-white border-2 border-brand-blue/30 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-line pb-4">
                <div>
                  <span className="text-xs font-mono text-brand-blue uppercase font-bold tracking-wider">
                    {selectedStateMeta.zone} Region
                  </span>
                  <h3 id="dcm-state-section-title" className="font-display font-bold text-2xl sm:text-3xl text-ink mt-0.5">
                    {selectedStateMeta.name} State
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedStateCode(null)}
                  className="self-start px-3 py-1.5 rounded-lg text-xs font-mono text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear selection (Return to All States)</span>
                </button>
              </div>

              {/* State Classification & Metadata Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Classification & Rationale */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-xs font-mono font-bold text-mut uppercase tracking-wider block">
                      Classification ({activePublication.reportingPeriodLabel})
                    </span>
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-4 h-4 rounded-full shrink-0 border border-black/10"
                        style={{ backgroundColor: DCM_COLORS[selectedStateRecord.classification]?.fill || '#94A3B8' }}
                      />
                      <span className="font-display font-bold text-xl text-ink">
                        {selectedStateRecord.classification || 'Data unavailable'}
                      </span>
                    </div>
                  </div>

                  {selectedStateRecord.classificationRationale && (
                    <div className="space-y-1.5 p-4 bg-paper rounded-xl border border-line">
                      <span className="text-xs font-mono font-bold text-ink uppercase tracking-wider block">
                        Classification Rationale
                      </span>
                      <p className="text-xs sm:text-sm text-ink2 leading-relaxed">
                        {selectedStateRecord.classificationRationale}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right: Evidence Summary & Right of Response */}
                <div className="space-y-4">
                  {selectedStateRecord.evidenceSummary && selectedStateRecord.evidenceSummary.trim() ? (
                    <div className="space-y-1.5 p-4 bg-paper rounded-xl border border-line">
                      <span className="text-xs font-mono font-bold text-ink uppercase tracking-wider block">
                        Evidence Summary
                      </span>
                      <p className="text-xs sm:text-sm text-ink2 leading-relaxed">
                        {selectedStateRecord.evidenceSummary}
                      </p>
                    </div>
                  ) : null}

                  {selectedStateRecord.rightOfResponseStatus && selectedStateRecord.rightOfResponseStatus !== 'Not required' && (
                    <div className="flex items-center justify-between text-xs font-mono bg-blue-50/70 p-3 rounded-xl border border-blue-100">
                      <span className="text-slate-600 font-semibold">Right of Response:</span>
                      <span className="font-bold text-brand-blue">
                        {selectedStateRecord.rightOfResponseStatus}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Interactive State Historical Timeline */}
              <div className="pt-4 border-t border-line">
                <DcmTimeline
                  stateCode={selectedStateMeta.code}
                  stateName={selectedStateMeta.name}
                  activePublication={activePublication}
                  allPublications={publications}
                  onSelectPublication={(pub) => setSelectedPubId(pub.id)}
                />
              </div>
            </div>
          ) : (
            /* All States (Default Mode) Overview Panel */
            <div className="bg-white border border-line rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
              <div className="border-b border-line pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-mono text-brand-blue uppercase font-bold tracking-wider block">
                    National View
                  </span>
                  <h3 id="dcm-state-section-title" className="font-display font-bold text-xl sm:text-2xl text-ink mt-0.5">
                    All States Overview
                  </h3>
                </div>
                <span className="text-xs font-mono text-mut">
                  Default view: all 37 jurisdictions displayed
                </span>
              </div>

              <p className="text-sm text-ink2 leading-relaxed">
                All States mode is active. Click any state on the map or select a state from the <strong>Focus State</strong> dropdown above to view its classification rationale, evidence summary, and historical timeline.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-950">
                  <div className="text-[11px] font-mono font-bold uppercase text-orange-800">Constrained</div>
                  <div className="font-display font-bold text-xl mt-1">{stateCounts['Constrained']} states</div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
                  <div className="text-[11px] font-mono font-bold uppercase text-amber-800">Emerging concern</div>
                  <div className="font-display font-bold text-xl mt-1">{stateCounts['Emerging concern']} states</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 text-slate-800">
                  <div className="text-[11px] font-mono font-bold uppercase text-slate-700">Insufficient evidence</div>
                  <div className="font-display font-bold text-xl mt-1">{stateCounts['Insufficient evidence']} units</div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                  <div className="text-[11px] font-mono font-bold uppercase text-emerald-800">Open</div>
                  <div className="font-display font-bold text-xl mt-1">{stateCounts['Open']} states</div>
                </div>
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-950">
                  <div className="text-[11px] font-mono font-bold uppercase text-red-800">Severely constrained</div>
                  <div className="font-display font-bold text-xl mt-1">{stateCounts['Severely constrained']} states</div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* =================================================================== */}
        {/* 5. CHANGES SINCE THE PREVIOUS PUBLICATION                           */}
        {/* =================================================================== */}
        <section className="bg-white border border-line rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm" aria-labelledby="dcm-changes-title">
          <div className="border-b border-line pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 id="dcm-changes-title" className="font-display font-bold text-xl sm:text-2xl text-ink">
                Changes Since the Previous Publication
              </h3>
            </div>

            {comparison.hasPrevious && (
              <span className="text-xs font-mono text-mut">
                Compared against: <strong className="text-ink">{comparison.previousPublication?.reportingPeriodLabel}</strong>
              </span>
            )}
          </div>

          {comparison.isBaseline ? (
            <div className="p-6 bg-paper rounded-xl border border-dashed border-line text-center space-y-2">
              <Info className="w-6 h-6 text-brand-blue mx-auto" />
              <p className="text-sm font-semibold text-ink">
                Baseline Publication
              </p>
              <p className="text-xs text-mut max-w-lg mx-auto leading-relaxed">
                This is the initial baseline publication establishing the comparative benchmark for all 36 states and the FCT. No earlier publication exists for historical comparison.
              </p>
            </div>
          ) : comparison.totalChanged === 0 ? (
            <div className="p-6 bg-paper rounded-xl border border-line text-center space-y-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
              <p className="text-sm font-semibold text-ink">
                No Classification Changes in This Window
              </p>
              <p className="text-xs text-mut max-w-lg mx-auto">
                All 37 jurisdictions maintained the classifications assigned in the preceding review cycle ({comparison.previousPublication?.reportingPeriodLabel}).
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs font-mono text-ink2">
                <strong className="text-ink">{comparison.totalChanged} jurisdiction{comparison.totalChanged > 1 ? 's' : ''}</strong> changed classification between <span className="font-bold text-ink">{comparison.previousPublication?.reportingPeriodLabel}</span> and <span className="font-bold text-ink">{activePublication.reportingPeriodLabel}</span>:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {comparison.changedStates.map((change) => {
                  const prevMeta = DCM_COLORS[change.previousClassification] || DCM_COLORS['Insufficient evidence'];
                  const newMeta = DCM_COLORS[change.newClassification] || DCM_COLORS['Insufficient evidence'];
                  const isCurrentSelected = selectedStateCode === change.stateCode;

                  return (
                    <div
                      key={change.stateCode}
                      onClick={() => {
                        setSelectedStateCode(change.stateCode);
                        scrollToMap();
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                        isCurrentSelected 
                          ? 'border-brand-blue bg-blue-50/40 shadow-sm ring-1 ring-brand-blue'
                          : 'border-line bg-paper hover:border-slate-300 hover:bg-white'
                      }`}
                      role="button"
                      tabIndex={0}
                      aria-label={`View ${change.stateName} changes`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display font-bold text-base text-ink">
                          {change.stateName}
                        </span>
                        <span className="text-[10px] font-mono text-brand-blue font-bold uppercase hover:underline">
                          Inspect on Map →
                        </span>
                      </div>

                      {/* Transition Badge: Prev -> Next */}
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span 
                          className="px-2 py-0.5 rounded border text-[11px] font-bold"
                          style={{ 
                            backgroundColor: `${prevMeta.fill}18`, 
                            color: prevMeta.text,
                            borderColor: `${prevMeta.fill}40`
                          }}
                        >
                          {change.previousClassification}
                        </span>
                        <span className="text-slate-400">→</span>
                        <span 
                          className="px-2 py-0.5 rounded border text-[11px] font-bold"
                          style={{ 
                            backgroundColor: `${newMeta.fill}18`, 
                            color: newMeta.text,
                            borderColor: `${newMeta.fill}40`
                          }}
                        >
                          {change.newClassification}
                        </span>
                      </div>

                      {/* Classification Rationale */}
                      {change.rationale && (
                        <p className="text-xs text-ink2 leading-relaxed border-t border-line/60 pt-2 line-clamp-3">
                          {change.rationale}
                        </p>
                      )}

                      {/* Right of response if provided */}
                      {change.rightOfResponseStatus && change.rightOfResponseStatus !== 'Not required' && (
                        <div className="text-[10px] font-mono text-slate-500">
                          Right of response: <span className="font-bold text-ink">{change.rightOfResponseStatus}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* =================================================================== */}
        {/* 6. ABOUT THIS PUBLICATION (METADATA & REVISION NOTE)               */}
        {/* =================================================================== */}
        <section className="bg-white border border-line rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm" aria-labelledby="dcm-about-title">
          <div className="border-b border-line pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-blue block">
                Methodology &amp; Provenance
              </span>
              <h3 id="dcm-about-title" className="font-display font-bold text-xl sm:text-2xl text-ink mt-0.5">
                About This Publication
              </h3>
            </div>

            {activePublication.isLatest && (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 self-start">
                <Check className="w-3.5 h-3.5" />
                <span>Current / Latest Published DCM</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3.5 bg-paper rounded-xl border border-line space-y-1">
              <span className="text-mut block">Reporting Period</span>
              <span className="font-bold text-ink text-sm font-sans block">{activePublication.reportingPeriodLabel}</span>
            </div>

            <div className="p-3.5 bg-paper rounded-xl border border-line space-y-1">
              <span className="text-mut block">Publication Date</span>
              <span className="font-bold text-ink text-sm font-sans block">{activePublication.publicationDate}</span>
            </div>

            <div className="p-3.5 bg-paper rounded-xl border border-line space-y-1">
              <span className="text-mut block">Evidence Cut-off Date</span>
              <span className="font-bold text-ink text-sm font-sans block">{activePublication.evidenceCutoffDate}</span>
            </div>

            <div className="p-3.5 bg-paper rounded-xl border border-line space-y-1">
              <span className="text-mut block">Methodology Version</span>
              <span className="font-bold text-ink text-sm font-sans flex items-center justify-between">
                <span>{activePublication.methodologyVersion}</span>
                {comparison.methodologyChanged && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono">
                    Revised
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Revision Note (Only shown if revisionNote is present) */}
          {activePublication.revisionNote && (
            <div className="p-4 bg-slate-50 border border-line rounded-xl text-xs space-y-1">
              <span className="font-mono font-bold text-ink uppercase tracking-wider block">
                Revision Note
              </span>
              <p className="text-ink2 leading-relaxed font-sans">
                {activePublication.revisionNote}
              </p>
            </div>
          )}
        </section>

        {/* =================================================================== */}
        {/* 7. EXECUTIVE ASSESSMENT                                            */}
        {/* =================================================================== */}
        {activePublication.summary && (
          <section className="bg-white border border-line rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm" aria-labelledby="dcm-assessment-title">
            <div className="border-b border-line pb-4">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-blue block">
                Analytical Summary
              </span>
              <h3 id="dcm-assessment-title" className="font-display font-bold text-xl sm:text-2xl text-ink mt-0.5">
                Executive Assessment
              </h3>
            </div>
            <p className="text-sm sm:text-base text-ink2 leading-relaxed whitespace-pre-line font-sans">
              {activePublication.summary}
            </p>
          </section>
        )}

        {/* =================================================================== */}
        {/* 8. REQUEST THE FULL DCM BRIEF (APPROVED PROMOTIONAL SECTION)        */}
        {/* =================================================================== */}
        <section className="bg-gradient-to-r from-navy via-slate-900 to-navy text-white rounded-2xl p-6 sm:p-10 shadow-lg space-y-5 border border-white/10" aria-labelledby="dcm-brief-title">
          <div className="flex items-center gap-2 text-brand-blue text-xs font-mono font-bold uppercase tracking-widest">
            <FileText className="w-4 h-4" />
            <span>Research &amp; Policy Briefs</span>
          </div>

          <h3 id="dcm-brief-title" className="font-display font-bold text-2xl sm:text-3xl text-white">
            Request the Full DCM Brief
          </h3>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Receive the full DCM Brief, supporting evidence references, state-level analysis and methodology notes.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsBriefModalOpen(true)}
              className="px-6 py-3 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-xl text-sm font-bold font-mono uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <span>Request the Full DCM Brief</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

      </div>

      {/* DCM Brief Request Modal */}
      <DcmBriefRequestModal
        isOpen={isBriefModalOpen}
        onClose={() => setIsBriefModalOpen(false)}
        publicationTitle={activePublication.title}
        reportingPeriod={activePublication.reportingPeriodLabel}
      />
    </div>
  );
};

export default DemocraticCompetitivenessMapNative;
