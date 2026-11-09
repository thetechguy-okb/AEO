import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { 
  NIGERIA_ACCURATE_STATE_PATHS, 
  NIGERIA_MAP_VIEWBOX, 
  NigeriaStatePathData 
} from '../data/nigeriaSvgPaths';

export type StateGeo = NigeriaStatePathData;

interface NigeriaMapProps {
  selectedStateCode: string;
  onSelectState: (code: string) => void;
  statesMeta: Array<{
    code: string;
    name: string;
    status: string;
    voters: string;
    pollingUnits: string;
    reconciledRate: string;
  }>;
}

export default function NigeriaMap({ selectedStateCode, onSelectState, statesMeta }: NigeriaMapProps) {
  const [hoveredState, setHoveredState] = useState<NigeriaStatePathData | null>(null);

  // Helper to check if a state is actively monitored
  const getActiveMeta = (code: string) => {
    return statesMeta.find((s) => s.code === code);
  };

  return (
    <div className="space-y-4 w-full h-full flex flex-col justify-between" id="nigerian-reconciliation-map-container">
      {/* Dynamic Map SVG */}
      <div className="relative flex-grow flex items-center justify-center min-h-[300px] bg-slate-50/50 rounded-2xl p-2 border border-slate-100 overflow-hidden">
        <svg
          viewBox={NIGERIA_MAP_VIEWBOX}
          className="w-full max-w-[500px] h-auto drop-shadow-md select-none transition-all duration-300"
          id="real-nigeria-svg"
        >
          {/* Subtle grid backdrop */}
          <g className="opacity-15 stroke-slate-200 stroke-[0.5] fill-none">
            <line x1="80" y1="0" x2="80" y2="660" />
            <line x1="200" y1="0" x2="200" y2="660" />
            <line x1="320" y1="0" x2="320" y2="660" />
            <line x1="440" y1="0" x2="440" y2="660" />
            <line x1="560" y1="0" x2="560" y2="660" />
            <line x1="680" y1="0" x2="680" y2="660" />
            <line x1="0" y1="120" x2="800" y2="120" />
            <line x1="0" y1="240" x2="800" y2="240" />
            <line x1="0" y1="360" x2="800" y2="360" />
            <line x1="0" y1="480" x2="800" y2="480" />
            <line x1="0" y1="600" x2="800" y2="600" />
          </g>

          {/* Map States Paths */}
          <g>
            {NIGERIA_ACCURATE_STATE_PATHS.map((st) => {
              const isSelected = selectedStateCode === st.code;
              const activeMeta = getActiveMeta(st.code);
              const isMonitored = !!activeMeta;
              
              // Base colors
              let fillClass = 'fill-slate-100 stroke-slate-300 hover:fill-slate-200';
              
              if (isMonitored) {
                if (isSelected) {
                  fillClass = activeMeta.status === 'Upcoming'
                    ? 'fill-amber-500/80 stroke-amber-600 hover:fill-amber-500 shadow-lg'
                    : 'fill-brand-green/80 stroke-brand-green-hover hover:fill-brand-green shadow-lg';
                } else {
                  fillClass = activeMeta.status === 'Upcoming'
                    ? 'fill-amber-50 hover:fill-amber-100/70 stroke-amber-300'
                    : 'fill-emerald-50 hover:fill-emerald-100/70 stroke-emerald-300';
                }
              }

              return (
                <g key={st.code} className={isMonitored ? "cursor-pointer" : "cursor-default"}>
                  <path
                    d={st.path}
                    className={`${fillClass} stroke-1.5 transition-all duration-300`}
                    onClick={() => isMonitored && onSelectState(st.code)}
                    onMouseEnter={() => setHoveredState(st)}
                    onMouseLeave={() => setHoveredState(null)}
                    style={{
                      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                      transformOrigin: `${st.labelX}px ${st.labelY}px`,
                      filter: isSelected ? 'drop-shadow(0 8px 12px rgba(0,0,0,0.15))' : 'none'
                    }}
                  />
                  
                  {/* Subtle pulsing indicator ring for active selected/monitored states */}
                  {isMonitored && !isSelected && (
                    <circle
                      cx={st.labelX}
                      cy={st.labelY}
                      r="5"
                      className={`animate-ping absolute pointer-events-none fill-none stroke-2 ${
                        activeMeta.status === 'Upcoming' ? 'stroke-amber-400' : 'stroke-brand-green'
                      }`}
                      style={{ opacity: 0.6 }}
                    />
                  )}

                  {/* Text label with full name or state code */}
                  <text
                    x={st.labelX}
                    y={st.labelY + 3}
                    textAnchor="middle"
                    className={`pointer-events-none text-[8.5px] font-sans font-bold select-none ${
                      isSelected 
                        ? 'fill-white' 
                        : isMonitored 
                          ? activeMeta.status === 'Upcoming' ? 'fill-amber-800' : 'fill-emerald-900'
                          : 'fill-slate-500'
                    }`}
                    style={{
                      paintOrder: 'stroke fill',
                      stroke: isSelected ? '#0F172A' : '#FFFFFF',
                      strokeWidth: 2
                    }}
                  >
                    {st.name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Floating current selection context overlay */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm border border-line px-3 py-1.5 rounded-lg shadow-sm pointer-events-none z-10">
          <span className="text-[10px] font-mono font-bold text-mut uppercase tracking-wider block">
            Selected State
          </span>
          <span className="font-display font-black text-navy text-sm flex items-center gap-1.5 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-brand-blue" />
            {NIGERIA_ACCURATE_STATE_PATHS.find(s => s.code === selectedStateCode)?.name || selectedStateCode}
          </span>
        </div>

        {/* Legend */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 bg-white/95 backdrop-blur-sm border border-line p-2 rounded-lg shadow-sm text-[9px] font-mono font-bold text-ink z-10">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-brand-green rounded-full border border-brand-green-hover"></span>
            <span>Audited (Concluded)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full border border-amber-600"></span>
            <span>Active monitoring</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-slate-100 rounded-full border border-slate-300"></span>
            <span>Other States</span>
          </div>
        </div>
      </div>
    </div>
  );
}
