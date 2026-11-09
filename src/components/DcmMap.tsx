import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DcmPublication, DCM_COLORS, DcmClassification } from '../types/dcm';
import { 
  NIGERIA_ACCURATE_STATE_PATHS, 
  NIGERIA_MAP_VIEWBOX, 
  NigeriaStatePathData 
} from '../data/nigeriaSvgPaths';

interface DcmMapProps {
  publication: DcmPublication;
  selectedStateCode: string | null;
  onSelectState: (code: string | null) => void;
  highlightChanges: boolean;
  changedStateCodes: Set<string>;
}

export const DcmMap: React.FC<DcmMapProps> = ({
  publication,
  selectedStateCode,
  onSelectState,
  highlightChanges,
  changedStateCodes
}) => {
  const [hoveredState, setHoveredState] = useState<NigeriaStatePathData | null>(null);

  // Zoom & Pan states for mobile two-finger and desktop zoom
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isGestureActive, setIsGestureActive] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [showTwoFingerHint, setShowTwoFingerHint] = useState<boolean>(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const hintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const touchDataRef = useRef<{
    startDist: number;
    startCenter: { x: number; y: number };
    startPan: { x: number; y: number };
    startZoom: number;
    isTwoFinger: boolean;
    singleTouchStart: { x: number; y: number; time: number } | null;
  }>({
    startDist: 0,
    startCenter: { x: 0, y: 0 },
    startPan: { x: 0, y: 0 },
    startZoom: 1,
    isTwoFinger: false,
    singleTouchStart: null
  });

  const mouseDragRef = useRef<{
    isDown: boolean;
    startX: number;
    startY: number;
    startPan: { x: number; y: number };
    hasDragged: boolean;
  }>({
    isDown: false,
    startX: 0,
    startY: 0,
    startPan: { x: 0, y: 0 },
    hasDragged: false
  });

  const clampPan = useCallback((newPan: { x: number; y: number }, currentZoom: number, containerW: number, containerH: number) => {
    if (currentZoom <= 1.02) return { x: 0, y: 0 };
    const maxPanX = (containerW * (currentZoom - 1)) / 2 + 50;
    const maxPanY = (containerH * (currentZoom - 1)) / 2 + 40;
    return {
      x: Math.max(-maxPanX, Math.min(maxPanX, newPan.x)),
      y: Math.max(-maxPanY, Math.min(maxPanY, newPan.y))
    };
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => {
      const next = Math.min(4.5, Number((prev * 1.35).toFixed(2)));
      if (mapContainerRef.current) {
        const rect = mapContainerRef.current.getBoundingClientRect();
        setPan((p) => clampPan(p, next, rect.width, rect.height));
      }
      return next;
    });
  }, [clampPan]);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const next = Math.max(1, Number((prev / 1.35).toFixed(2)));
      if (next <= 1.05) {
        setPan({ x: 0, y: 0 });
        return 1;
      }
      if (mapContainerRef.current) {
        const rect = mapContainerRef.current.getBoundingClientRect();
        setPan((p) => clampPan(p, next, rect.width, rect.height));
      }
      return next;
    });
  }, [clampPan]);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      if (zoom <= 1.01 && e.deltaY > 0 && !e.ctrlKey) {
        return;
      }
      e.preventDefault();
      setIsGestureActive(true);

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;

      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      const nextZoom = Math.min(4.5, Math.max(1, zoom * zoomFactor));

      if (nextZoom <= 1.02) {
        setZoom(1);
        setPan({ x: 0, y: 0 });
      } else {
        const scaleRatio = nextZoom / zoom;
        const nextPanX = mouseX - (mouseX - pan.x) * scaleRatio;
        const nextPanY = mouseY - (mouseY - pan.y) * scaleRatio;
        setZoom(nextZoom);
        setPan(clampPan({ x: nextPanX, y: nextPanY }, nextZoom, rect.width, rect.height));
      }

      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = setTimeout(() => {
        setIsGestureActive(false);
      }, 120);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        setIsGestureActive(true);
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const center = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2
        };
        touchDataRef.current = {
          startDist: dist,
          startCenter: center,
          startPan: { ...pan },
          startZoom: zoom,
          isTwoFinger: true,
          singleTouchStart: null
        };
      } else if (e.touches.length === 1) {
        touchDataRef.current = {
          startDist: 0,
          startCenter: { x: 0, y: 0 },
          startPan: { ...pan },
          startZoom: zoom,
          isTwoFinger: false,
          singleTouchStart: {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
            time: Date.now()
          }
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && touchDataRef.current.isTwoFinger) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const center = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2
        };

        const rect = container.getBoundingClientRect();
        const initialDist = touchDataRef.current.startDist || dist;
        const scaleChange = dist / initialDist;
        const nextZoom = Math.min(4.5, Math.max(1, touchDataRef.current.startZoom * scaleChange));

        const dx = center.x - touchDataRef.current.startCenter.x;
        const dy = center.y - touchDataRef.current.startCenter.y;
        const rawPan = {
          x: touchDataRef.current.startPan.x + dx,
          y: touchDataRef.current.startPan.y + dy
        };

        setZoom(nextZoom);
        setPan(clampPan(rawPan, nextZoom, rect.width, rect.height));
      } else if (e.touches.length === 1 && zoom > 1.1) {
        const st = touchDataRef.current.singleTouchStart;
        if (st) {
          const dx = Math.abs(e.touches[0].clientX - st.x);
          const dy = Math.abs(e.touches[0].clientY - st.y);
          if (dx > 25 && dx > dy) {
            setShowTwoFingerHint(true);
            if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
            hintTimeoutRef.current = setTimeout(() => setShowTwoFingerHint(false), 2000);
          }
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (touchDataRef.current.isTwoFinger && e.touches.length < 2) {
        touchDataRef.current.isTwoFinger = false;
        setIsGestureActive(false);
        if (zoom <= 1.05) {
          setZoom(1);
          setPan({ x: 0, y: 0 });
        }
      }
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);
    container.addEventListener('touchcancel', onTouchEnd);

    return () => {
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [zoom, pan, clampPan]);

  const isAllStatesActive = selectedStateCode === null;

  return (
    <div className="relative w-full flex flex-col items-center justify-center select-none" id="dcm-nigeria-map">
      {/* SVG Map Container: Preserves 800:660 aspect ratio and scales responsively */}
      <div
        ref={mapContainerRef}
        className="relative w-full max-w-[850px] aspect-[800/660] overflow-hidden rounded-lg bg-[#eceef1] select-none"
        style={{ touchAction: 'pan-y' }}
        onMouseDown={(e) => {
          if (zoom > 1) {
            mouseDragRef.current = {
              isDown: true,
              startX: e.clientX,
              startY: e.clientY,
              startPan: { ...pan },
              hasDragged: false
            };
            setIsPanning(true);
            setIsGestureActive(true);
          }
        }}
        onMouseMove={(e) => {
          if (mouseDragRef.current.isDown && zoom > 1) {
            const dx = e.clientX - mouseDragRef.current.startX;
            const dy = e.clientY - mouseDragRef.current.startY;
            if (Math.hypot(dx, dy) > 5) {
              mouseDragRef.current.hasDragged = true;
            }
            const container = mapContainerRef.current;
            if (container) {
              const rect = container.getBoundingClientRect();
              const rawPan = {
                x: mouseDragRef.current.startPan.x + dx,
                y: mouseDragRef.current.startPan.y + dy
              };
              setPan(clampPan(rawPan, zoom, rect.width, rect.height));
            }
          }
        }}
        onMouseUp={() => {
          if (mouseDragRef.current.isDown) {
            mouseDragRef.current.isDown = false;
            setIsPanning(false);
            setIsGestureActive(false);
          }
        }}
        onMouseLeave={() => {
          if (mouseDragRef.current.isDown) {
            mouseDragRef.current.isDown = false;
            setIsPanning(false);
            setIsGestureActive(false);
          }
        }}
        onDoubleClick={(e) => {
          e.preventDefault();
          const container = mapContainerRef.current;
          if (!container) return;
          if (zoom > 1.8) {
            handleResetZoom();
          } else {
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left - rect.width / 2;
            const mouseY = e.clientY - rect.top - rect.height / 2;
            const nextZoom = 2.2;
            const ratio = nextZoom / zoom;
            const nextPanX = mouseX - (mouseX - pan.x) * ratio;
            const nextPanY = mouseY - (mouseY - pan.y) * ratio;
            setZoom(nextZoom);
            setPan(clampPan({ x: nextPanX, y: nextPanY }, nextZoom, rect.width, rect.height));
          }
        }}
      >
        {/* Floating Zoom & Reset Toolbar */}
        <div className="absolute top-3 right-3 z-40 flex flex-col gap-1 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-md shadow-md p-1">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom in (or two-finger pinch on mobile, mouse wheel on desktop)"
            aria-label="Zoom in"
            disabled={zoom >= 4.5}
            className="w-8 h-8 flex items-center justify-center font-bold text-slate-800 hover:bg-slate-100 disabled:opacity-35 disabled:cursor-not-allowed rounded transition-colors text-lg"
          >
            +
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom out"
            aria-label="Zoom out"
            disabled={zoom <= 1}
            className="w-8 h-8 flex items-center justify-center font-bold text-slate-800 hover:bg-slate-100 disabled:opacity-35 disabled:cursor-not-allowed rounded transition-colors text-xl"
          >
            –
          </button>
          {zoom > 1 && (
            <button
              type="button"
              onClick={handleResetZoom}
              title="Reset map zoom"
              aria-label="Reset map zoom"
              className="w-8 h-8 flex items-center justify-center font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors text-sm"
            >
              ↺
            </button>
          )}
        </div>

        {/* Active Zoom Badge */}
        {zoom > 1 && (
          <div className="absolute top-3 left-3 z-40 bg-white/90 backdrop-blur-sm border border-slate-200 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-600 shadow-sm pointer-events-none">
            {Math.round(zoom * 100)}%
          </div>
        )}

        {/* Mobile Two-Finger Guidance Toast */}
        {showTwoFingerHint && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-lg pointer-events-none flex items-center gap-1.5 whitespace-nowrap">
            <span>✌️ Use two fingers to pan map</span>
          </div>
        )}

        {/* Transformed Map Layer */}
        <div
          className="w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '50% 50%',
            transition: isGestureActive ? 'none' : 'transform 0.18s cubic-bezier(0.2, 0, 0, 1)',
            cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default'
          }}
        >
          <svg
            viewBox={NIGERIA_MAP_VIEWBOX}
            className="w-full h-full drop-shadow-sm select-none"
            role="region"
            aria-label={`Nigeria Democratic Competitiveness Map for ${publication.reportingPeriodLabel}`}
          >
            {/* Subtle geographic graticule backdrop */}
            <g className="opacity-15 stroke-slate-300 stroke-[0.5] fill-none" aria-hidden="true">
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

            {/* Map State Paths for All 36 States and FCT */}
            {NIGERIA_ACCURATE_STATE_PATHS.map((st) => {
              const stateRecord = publication.classifications[st.code];
              const hasExplicitClassification = Boolean(stateRecord && stateRecord.classification);
              const classification = hasExplicitClassification ? stateRecord.classification : null;
              const isUnavailable = !hasExplicitClassification || !DCM_COLORS[classification!];
              const colorMeta = !isUnavailable ? DCM_COLORS[classification!] : null;
              
              const isSelected = selectedStateCode === st.code;
              const isHovered = isAllStatesActive && hoveredState?.code === st.code;
              const isChanged = highlightChanges && changedStateCodes.has(st.code);

              // Determine opacity:
              // In "All States" mode -> all states are 1.0 (normal opacity)
              // When a single state is selected -> selected is 1.0, others are 0.40
              const stateOpacity = isAllStatesActive ? 1.0 : isSelected ? 1.0 : 0.40;

              // Small states font size tweak
              const isCompactState = ['LA', 'FC', 'EK', 'OS', 'IM', 'AB', 'AN', 'EB'].includes(st.code);
              const fontSize = isCompactState ? '8.5px' : '10.5px';

              const accessibleLabel = isUnavailable
                ? `${st.name} — Classification data unavailable — Reporting period ${publication.reportingPeriodLabel}`
                : `${st.name} — ${classification} — Reporting period ${publication.reportingPeriodLabel}`;

              return (
                <g
                  key={st.code}
                  onClick={() => {
                    if (mouseDragRef.current.hasDragged) {
                      mouseDragRef.current.hasDragged = false;
                      return;
                    }
                    setHoveredState(null);
                    onSelectState(isSelected ? null : st.code);
                  }}
                  onMouseEnter={() => {
                    if (isAllStatesActive && !mouseDragRef.current.isDown) setHoveredState(st);
                  }}
                  onMouseLeave={() => setHoveredState(null)}
                  className="cursor-pointer transition-all duration-200 outline-none group"
                  tabIndex={0}
                  role="button"
                  aria-label={accessibleLabel}
                  aria-pressed={isSelected}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setHoveredState(null);
                      onSelectState(isSelected ? null : st.code);
                    }
                  }}
                >
                  {/* Real Geographic State Boundary Path */}
                  <path
                    d={st.path}
                    fill={isUnavailable ? '#E2E8F0' : colorMeta!.fill}
                    opacity={stateOpacity}
                    stroke={(isSelected || isHovered) ? '#FFFFFF' : '#1C232B'}
                    strokeWidth={(isSelected || isHovered) ? 3.8 : 0.95}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeDasharray={isUnavailable ? '3,2' : undefined}
                    className="transition-all duration-150 hover:brightness-105"
                    style={{
                      filter: (isSelected || isHovered)
                        ? 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.45))'
                        : undefined
                    }}
                  />

                  {/* State Label with halo outline for maximum legibility */}
                  <text
                    x={st.labelX}
                    y={st.labelY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    opacity={isAllStatesActive ? 0.95 : isSelected || isHovered ? 1.0 : 0.45}
                    transform={zoom !== 1 ? `translate(${st.labelX}, ${st.labelY}) scale(${1 / zoom}) translate(${-st.labelX}, ${-st.labelY})` : undefined}
                    className="pointer-events-none font-sans font-bold select-none transition-opacity tracking-wider uppercase"
                    style={{
                      fontSize,
                      fontWeight: 700,
                      stroke: '#FFFFFF',
                      strokeWidth: `${2 / zoom}px`,
                      paintOrder: 'stroke fill',
                      fill: '#1E293B'
                    }}
                  >
                    {st.name.toUpperCase()}
                  </text>

                  {/* Changed Indicator Icon Badge on map if highlightChanges is enabled */}
                  {isChanged && (
                    <circle
                      cx={st.labelX + 12}
                      cy={st.labelY - 8}
                      r={4}
                      fill="#1E3A5F"
                      stroke="#FFFFFF"
                      strokeWidth={1.5}
                      className="pointer-events-none animate-pulse"
                    />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Flourish-style Floating Hover Card (positioned relative to zoomed state coordinates, paused when clicked) */}
        {isAllStatesActive && hoveredState && (() => {
          const stateRec = publication.classifications[hoveredState.code];
          const classification = stateRec?.classification || 'Insufficient evidence';
          const direction = stateRec?.direction || (classification === 'Insufficient evidence' ? 'insufficient-basis' : 'newly-classified');
          const directionLabel = direction === 'newly-classified' ? 'Newly classified'
            : direction === 'deteriorating' ? 'Deteriorating'
            : direction === 'insufficient-basis' ? 'Insufficient basis'
            : direction === 'improving' ? 'Improving'
            : direction === 'stable' ? 'Stable'
            : direction;
          const confidence = stateRec?.confidence || (classification === 'Insufficient evidence' ? 'Low' : 'Medium');
          const keyFinding = stateRec?.keyFinding || stateRec?.classificationRationale || stateRec?.evidenceSummary || (
            hoveredState.name === 'Kaduna' 
              ? 'Police confirm using tear gas at the ADC governorship launch; supporters of both main parties allege attacks.'
              : classification === 'Insufficient evidence'
                ? 'Insufficient verified evidence held by AEO for classification.'
                : 'Material political competition dynamics documented for reporting period.'
          );
          const updatedDate = publication.evidenceCutoffDate || publication.publicationDate || '28 September 2026';

          const containerW = mapContainerRef.current?.clientWidth || 800;
          const containerH = mapContainerRef.current?.clientHeight || 660;
          const u = hoveredState.labelX / 800;
          const v = hoveredState.labelY / 660;
          const visualX = containerW / 2 + (u * containerW - containerW / 2) * zoom + pan.x;
          const visualY = containerH / 2 + (v * containerH - containerH / 2) * zoom + pan.y;

          const isRightSide = visualX > containerW * 0.52;
          const tooltipLeft = isRightSide
            ? Math.max(12, visualX - 300)
            : Math.min(containerW - 300, visualX + 15);
          const tooltipTop = Math.max(12, Math.min(containerH - 240, visualY - 60));

          return (
            <div
              className="absolute pointer-events-none bg-white text-slate-800 p-4 rounded-md shadow-2xl border border-slate-200 z-50 transition-all w-72 max-w-[90%] font-sans"
              style={{
                left: `${tooltipLeft}px`,
                top: `${tooltipTop}px`
              }}
            >
              <h4 className="font-bold text-lg text-slate-900 mb-2 leading-tight">
                {hoveredState.name}
              </h4>

              <div className="flex flex-col gap-1.5 text-xs leading-snug">
                <div>
                  <strong className="text-slate-900">DCM Classification: </strong>
                  <span className="text-slate-700">{classification}</span>
                </div>

                <div>
                  <strong className="text-slate-900">Direction: </strong>
                  <span className="text-slate-700">{directionLabel}</span>
                </div>

                <div>
                  <strong className="text-slate-900">Confidence: </strong>
                  <span className="text-slate-700">{confidence}</span>
                </div>

                <div>
                  <strong className="text-slate-900">Key Finding: </strong>
                  <span className="text-slate-700">{keyFinding}</span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 leading-normal">
                <div>AEO Democratic Competitiveness Map (DCM)</div>
                <div>Updated: {updatedDate}</div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default DcmMap;
