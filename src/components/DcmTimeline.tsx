import React from 'react';
import { DcmPublication, DCM_COLORS, MONTH_NAMES, DcmClassification } from '../types/dcm';

interface DcmTimelineProps {
  stateCode: string;
  stateName: string;
  activePublication: DcmPublication;
  allPublications: DcmPublication[];
  onSelectPublication: (pub: DcmPublication) => void;
}

// Helper to identify baseline / multi-month publications so they are never placed in half-month cells
const isBaselinePub = (p: DcmPublication): boolean => {
  if (p.isBaseline) return true;
  if (p.periodIndex === 0) return true;
  if (
    p.reportingPeriodLabel?.toLowerCase().includes('baseline') ||
    p.title?.toLowerCase().includes('baseline') ||
    p.id?.toLowerCase().includes('baseline')
  ) {
    return true;
  }
  if (p.periodStart && p.periodEnd) {
    const diff = new Date(p.periodEnd).getTime() - new Date(p.periodStart).getTime();
    if (diff > 20 * 24 * 60 * 60 * 1000) return true;
  }
  return false;
};

export const DcmTimeline: React.FC<DcmTimelineProps> = ({
  stateCode,
  stateName,
  activePublication,
  allPublications,
  onSelectPublication
}) => {
  const publishedOnly = allPublications.filter(p => p.status === 'published');
  const targetYear = activePublication.year || 2026;

  // Publications for target year
  const yearPubs = publishedOnly.filter(p => p.year === targetYear);

  // Baseline publication (strictly identified multi-month baseline)
  const baselinePub = yearPubs.find(p => isBaselinePub(p));

  return (
    <div className="space-y-3.5 w-full" aria-label={`Historical classification timeline for ${stateName}`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">
          Classification Timeline ({targetYear})
        </span>
        <span className="text-[11px] text-slate-500 font-mono">
          Select a published period to view the corresponding DCM.
        </span>
      </div>

      {/* Baseline Publication Banner (displayed separately from fortnightly timeline cells) */}
      {baselinePub && (() => {
        const baseRec = baselinePub.classifications[stateCode];
        const baseClass = baseRec?.classification;
        const isSelectedBase = baselinePub.id === activePublication.id;
        const colorMeta = baseClass ? DCM_COLORS[baseClass] : null;

        return (
          <div className="p-3 bg-white rounded-xl border border-slate-300 shadow-xs flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[11px] font-mono font-bold text-brand-blue uppercase tracking-wider block">
                Baseline Publication
              </span>
              <span className="text-xs text-slate-900 font-semibold">
                {baselinePub.reportingPeriodLabel}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onSelectPublication(baselinePub)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                isSelectedBase ? 'ring-2 ring-slate-900 ring-offset-2' : 'hover:opacity-90'
              }`}
              style={{
                backgroundColor: colorMeta ? colorMeta.fill : '#E2E8F0',
                color: colorMeta ? '#FFFFFF' : '#1E293B'
              }}
              title={`${baselinePub.reportingPeriodLabel}: ${stateName} was ${baseClass || 'Data unavailable'}`}
            >
              <span className="w-2 h-2 rounded-full bg-white/90" />
              <span>{baseClass || 'Data unavailable'}</span>
              {isSelectedBase && <span className="text-[11px]">●</span>}
            </button>
          </div>
        );
      })()}

      {/* Grid of 12 Months with explicit period date ranges (1st–15th, 16th–month end) */}
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-300">
        {MONTH_NAMES.map((monthName, mIdx) => {
          const monthNum = mIdx + 1; // 1-12
          const shortMonth = monthName.substring(0, 3);

          // Find standard fortnightly recurring publications ONLY (never baseline)
          const p1Pub = yearPubs.find(p => !isBaselinePub(p) && p.month === monthNum && p.periodIndex === 1);
          const p2Pub = yearPubs.find(p => !isBaselinePub(p) && p.month === monthNum && p.periodIndex === 2);

          const renderPeriodBlock = (pub: DcmPublication | undefined, pIdx: number) => {
            const periodLabel = pIdx === 1 ? '1–15' : '16–End';
            const fullPeriodDate = `${pIdx === 1 ? '1–15' : '16–End'} ${shortMonth}`;

            if (!pub) {
              return (
                <div
                  title={`${monthName} (${pIdx === 1 ? '1st–15th' : '16th–End'}): Unpublished`}
                  className="h-8 rounded border border-dashed border-slate-300 bg-white/90 flex flex-col items-center justify-center cursor-default select-none text-[9px] font-mono font-semibold text-slate-500"
                  aria-label={`${monthName} ${pIdx === 1 ? '1st to 15th' : '16th to end'}: Unpublished period`}
                >
                  <span>{periodLabel}</span>
                </div>
              );
            }

            const stateRec = pub.classifications[stateCode];
            const hasClassification = Boolean(stateRec && stateRec.classification);
            const classification = hasClassification ? stateRec.classification : null;
            const colorMeta = classification ? DCM_COLORS[classification] : null;
            const isSelectedPub = pub.id === activePublication.id;

            return (
              <button
                type="button"
                onClick={() => onSelectPublication(pub)}
                title={`${pub.reportingPeriodLabel}: ${stateName} was ${classification || 'Data unavailable'}. Click to view this map.`}
                className={`h-8 w-full rounded transition-all flex flex-col items-center justify-center cursor-pointer relative group ${
                  isSelectedPub ? 'ring-2 ring-slate-900 ring-offset-2 scale-[1.04] shadow-md z-10' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: colorMeta ? colorMeta.fill : '#E2E8F0' }}
                aria-label={`${pub.reportingPeriodLabel}: ${classification || 'Data unavailable'} — click to view map`}
              >
                <span className="text-[9px] font-mono font-bold text-white drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.7)] leading-tight px-0.5 text-center tracking-tight">
                  {fullPeriodDate}
                </span>

                {/* Micro active dot */}
                {isSelectedPub && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-slate-950 border-2 border-white" />
                )}
              </button>
            );
          };

          return (
            <div key={monthName} className="flex flex-col gap-1 text-center">
              <span className="text-[11px] font-mono text-slate-800 font-bold">
                {shortMonth}
              </span>
              <div className="flex flex-col gap-1">
                {renderPeriodBlock(p1Pub, 1)}
                {renderPeriodBlock(p2Pub, 2)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend footnote */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600 font-mono pt-1 gap-2">
        <div className="flex items-center gap-3">
          <span><strong className="text-slate-800">1–15</strong> = 1st–15th</span>
          <span><strong className="text-slate-800">16–End</strong> = 16th–Month end</span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-2.5 rounded border border-dashed border-slate-400 bg-white inline-block" />
            <span className="text-slate-700">Unpublished</span>
          </span>
        </div>
        <span className="text-slate-500">Select a published period to view the corresponding DCM.</span>
      </div>
    </div>
  );
};

export default DcmTimeline;
