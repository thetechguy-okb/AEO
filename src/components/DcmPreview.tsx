import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { DCM_GEO } from '../data/dcmGeoData';

// Classification Categories and Palette
export const DCM_CAT: Record<string, { name: string; hex: string }> = {
  G: { name: 'Open', hex: '#3e9a62' },
  A: { name: 'Emerging concern', hex: '#f6cd5c' },
  O: { name: 'Constrained', hex: '#e5822a' },
  R: { name: 'Severely constrained', hex: '#8f1d17' },
  X: { name: 'Insufficient evidence', hex: '#c9cdd2' }
};

export const DCM_ORDER = ['G', 'A', 'O', 'R', 'X'];

export const DCM_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Base classifications as shown on the map reference
export const DCM_BASE: Record<string, string> = {
  Borno: 'A',
  Kaduna: 'A',
  Kwara: 'A',
  Kogi: 'A',
  Benue: 'O',
  Enugu: 'O',
  Delta: 'O',
  Anambra: 'O',
  Imo: 'A',
  'Akwa Ibom': 'A'
};

function dcmWith(base: Record<string, string>, ch: Record<string, string>): Record<string, string> {
  const o: Record<string, string> = { ...base };
  for (const k in ch) o[k] = ch[k];
  return o;
}

// 1st July – 30th September 2026 (baseline period)
export const DCM_P1 = { ...DCM_BASE };

// 1st – 15th October 2026 (current publication with Edo, Kano, and Oyo newly classified)
export const DCM_P2 = dcmWith(DCM_P1, {
  Edo: 'O',
  Kano: 'A',
  Oyo: 'O'
});

export interface DcmStateDetail {
  keyFinding?: string;
  confidence?: 'High' | 'Medium' | 'Low' | string;
  direction?: 'newly-classified' | 'deteriorating' | 'improving' | 'stable' | 'insufficient-basis' | string;
  rightOfResponse?: string;
}

export const BASELINE_DETAILS: Record<string, DcmStateDetail> = {
  Kaduna: {
    keyFinding: 'Police confirm using tear gas at the ADC governorship launch; supporters of both main parties allege attacks.',
    confidence: 'Medium',
    direction: 'newly-classified'
  },
  Benue: {
    keyFinding: 'Material restrictions and security concerns affecting political mobilisation across multiple LGAs.',
    confidence: 'High',
    direction: 'newly-classified'
  },
  Delta: {
    keyFinding: 'Verified interference with opposition campaign mobilisation and logistical movement.',
    confidence: 'High',
    direction: 'newly-classified'
  },
  Enugu: {
    keyFinding: 'Contested access to political assembly and documented security incidents affecting party offices.',
    confidence: 'High',
    direction: 'newly-classified'
  },
  Anambra: {
    keyFinding: 'Security concerns and movement restrictions impacting evening and weekend voter mobilisation.',
    confidence: 'Medium',
    direction: 'newly-classified'
  },
  Imo: {
    keyFinding: 'Unresolved disputes and heightened security tension affecting political gatherings in rural constituencies.',
    confidence: 'Medium',
    direction: 'newly-classified'
  },
  Abia: {
    keyFinding: 'Emerging pressure on party campaign signages and localized assembly friction.',
    confidence: 'Medium',
    direction: 'newly-classified'
  },
  Kogi: {
    keyFinding: 'Documented incidents of partisan intimidation and disruption of voter mobilization outings.',
    confidence: 'Medium',
    direction: 'newly-classified'
  },
  Osun: {
    keyFinding: 'Partisan friction and contested administrative neutrality ahead of governorship preparation.',
    confidence: 'Medium',
    direction: 'newly-classified'
  },
  Rivers: {
    keyFinding: 'Intense institutional disputes and threats affecting party coordination structures.',
    confidence: 'High',
    direction: 'newly-classified'
  }
};

export interface DcmPubItem {
  year: number;
  month: number; // 0-indexed: 8 = Sept, 9 = Oct
  half: number;  // 0 = 1st-15th, 1 = 16th-end
  pubTitle?: string;
  label: string;
  short: string;
  cutoff: string;
  method: string;
  revisions: string;
  cls: Record<string, string>;
  details?: Record<string, DcmStateDetail>;
}

export function getStateDetails(
  pub: DcmPubItem,
  prevPub: DcmPubItem | null,
  stateName: string
): {
  classification: string;
  direction: string;
  rawDirection: string;
  confidence: string;
  keyFinding: string;
  rightOfResponse: string;
} {
  const explicit = pub.details?.[stateName];
  const catCode = (pub.cls && pub.cls[stateName]) || 'X';
  const prevCode = prevPub ? ((prevPub.cls && prevPub.cls[stateName]) || 'X') : null;
  const catName = DCM_CAT[catCode]?.name || 'Insufficient evidence';

  let direction = explicit?.direction;
  if (!direction) {
    if (!prevPub || prevCode === null) {
      direction = catCode === 'X' ? 'insufficient-basis' : 'newly-classified';
    } else if (prevCode === 'X' && catCode !== 'X') {
      direction = 'newly-classified';
    } else if (catCode === 'X' && prevCode !== 'X') {
      direction = 'insufficient-basis';
    } else {
      const rank: Record<string, number> = { G: 1, A: 2, O: 3, R: 4, X: 0 };
      const cRank = rank[catCode] || 0;
      const pRank = rank[prevCode] || 0;
      if (cRank > pRank) {
        direction = 'deteriorating';
      } else if (cRank < pRank && cRank > 0) {
        direction = 'improving';
      } else {
        direction = 'stable';
      }
    }
  }

  const directionLabels: Record<string, string> = {
    'newly-classified': 'Newly classified',
    'deteriorating': 'Deteriorating',
    'insufficient-basis': 'Insufficient basis',
    'improving': 'Improving',
    'stable': 'Stable'
  };
  const directionLabel = directionLabels[direction.toLowerCase()] || direction;

  let confidence = explicit?.confidence;
  if (!confidence) {
    if (catCode === 'X') {
      confidence = 'Low';
    } else if (catCode === 'R' || catCode === 'O') {
      confidence = 'High';
    } else {
      confidence = 'Medium';
    }
  }

  let keyFinding = explicit?.keyFinding;
  if (!keyFinding) {
    if (stateName === 'Kaduna') {
      keyFinding = 'Police confirm using tear gas at the ADC governorship launch; supporters of both main parties allege attacks.';
    } else if (catCode === 'X') {
      keyFinding = 'Insufficient verified evidence held by AEO to establish an open or constrained rating.';
    } else if (catCode === 'G') {
      keyFinding = 'Verified open access for political parties, unhindered peaceful campaign assembly, and neutral local administration.';
    } else if (catCode === 'A') {
      keyFinding = 'Emerging friction in campaign venue permitting, localized partisan tension, or administrative restrictions.';
    } else if (catCode === 'O') {
      keyFinding = 'Material obstruction of political gatherings, campaign motorcade disruptions, or interference with opposition visibility.';
    } else if (catCode === 'R') {
      keyFinding = 'Severe systemic suppression, physical violence against campaign secretariats, or prohibition of opposition mobilization.';
    }
  }

  return {
    classification: catName,
    direction: directionLabel,
    rawDirection: direction,
    confidence,
    keyFinding: keyFinding || 'No additional evidence recorded.',
    rightOfResponse: explicit?.rightOfResponse || 'Requested'
  };
}

export const DCM_PUBS: DcmPubItem[] = [
  {
    year: 2026,
    month: 5,
    half: 1,
    pubTitle: 'Democratic Competitiveness Map',
    label: '16th – 30th June 2026',
    short: '16th – 30th June 2026',
    cutoff: '30 June 2026',
    method: 'v1.0 (pilot)',
    revisions: 'none',
    cls: DCM_BASE,
    details: BASELINE_DETAILS
  },
  {
    year: 2026,
    month: 8,
    half: 1,
    pubTitle: 'Democratic Competitiveness Map',
    label: '1st July – 30th September 2026',
    short: '1st July – 30th September 2026',
    cutoff: '30 September 2026',
    method: 'v1.0 (pilot)',
    revisions: 'none',
    cls: DCM_P1,
    details: BASELINE_DETAILS
  },
  {
    year: 2026,
    month: 9,
    half: 0,
    pubTitle: 'Democratic Competitiveness Map',
    label: '1st – 15th October 2026',
    short: '1st – 15th October 2026',
    cutoff: '15 October 2026',
    method: 'v1.1',
    revisions: 'none',
    cls: DCM_P2,
    details: {
      ...BASELINE_DETAILS,
      Edo: {
        keyFinding: 'Classification changed following verified incidents affecting campaign access, armed attacks on candidate convoys in Igueben, and threatening rhetoric against political...',
        confidence: 'High',
        direction: 'deteriorating',
        rightOfResponse: 'Requested'
      },
      Kano: {
        keyFinding: 'Classification changed following emerging political assembly friction and aggressive statements against rival mobilization in urban centers.',
        confidence: 'Medium',
        direction: 'newly-classified',
        rightOfResponse: 'Requested'
      },
      Oyo: {
        keyFinding: 'Classification changed following violent disruption of political reception in Ibadan South-West resulting in a confirmed supporter fatality.',
        confidence: 'High',
        direction: 'deteriorating',
        rightOfResponse: 'Requested'
      }
    }
  }
];

// Small state label font size adjustment mapping
export const DCM_SMALL: Record<string, number> = {
  Anambra: 1,
  Imo: 1,
  Abia: 1,
  Ebonyi: 1,
  Lagos: 1,
  Rivers: 1,
  Bayelsa: 1,
  'Akwa Ibom': 1,
  Enugu: 1,
  FCT: 1,
  Ekiti: 1,
  Osun: 1
};

export const SECTORS = [
  { value: 'media', label: 'Media' },
  { value: 'cso', label: 'Civil society organisation' },
  { value: 'research', label: 'Academic or research institution' },
  { value: 'partner', label: 'Development partner or diplomatic mission' },
  { value: 'private', label: 'Private sector' },
  { value: 'party', label: 'Political party, candidate or campaign' },
  { value: 'government', label: 'Government or public institution' },
  { value: 'individual', label: 'Individual or other' }
];

import { useCMS } from '../context/CMSContext';

const CLASS_TO_CODE: Record<string, string> = {
  'Open': 'G',
  'Emerging concern': 'A',
  'Constrained': 'O',
  'Severely constrained': 'R',
  'Insufficient evidence': 'X'
};

export interface DcmPreviewProps {
  isEmbedded?: boolean;
}

export const DcmPreview: React.FC<DcmPreviewProps> = ({ isEmbedded = false }) => {
  const { dcmPublications } = useCMS();

  // Combine dynamic CMS publications (if available) with fallback prototype publications
  const allPubs: DcmPubItem[] = useMemo(() => {
    if (dcmPublications && dcmPublications.length > 0) {
      // Sort chronologically ascending for timeline
      const sorted = [...dcmPublications].sort((a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime());
      return sorted.map((pub) => {
        const clsMap: Record<string, string> = {};
        const detailsMap: Record<string, DcmStateDetail> = {};
        if (pub.classifications) {
          for (const [code, rec] of Object.entries(pub.classifications)) {
            const stateName = rec.stateName === 'Federal Capital Territory' || code === 'FC' ? 'FCT' : rec.stateName;
            clsMap[stateName] = CLASS_TO_CODE[rec.classification] || 'X';
            detailsMap[stateName] = {
              keyFinding: rec.keyFinding || rec.classificationRationale || rec.evidenceSummary || '',
              confidence: rec.confidence || (rec.classification === 'Insufficient evidence' ? 'Low' : 'Medium'),
              direction: rec.direction || (rec.classification === 'Insufficient evidence' ? 'insufficient-basis' : 'newly-classified')
            };
          }
        }
        return {
          year: Number(pub.year) || 2026,
          month: (Number(pub.month) || 10) - 1,
          half: Number(pub.periodIndex) === 1 ? 0 : 1,
          pubTitle: pub.title || 'Democratic Competitiveness Map',
          label: pub.reportingPeriodLabel || pub.title,
          short: pub.reportingPeriodLabel || pub.title,
          cutoff: pub.evidenceCutoffDate || '',
          method: pub.methodologyVersion || 'v1.1',
          revisions: pub.revisionNote || 'none',
          cls: clsMap,
          details: detailsMap
        };
      });
    }
    return DCM_PUBS;
  }, [dcmPublications]);

  // Publication index state (defaults to latest)
  const [pi, setPi] = useState<number>(() => allPubs.length - 1);

  // Sync index if publications count changes
  React.useEffect(() => {
    if (pi >= allPubs.length) {
      setPi(Math.max(0, allPubs.length - 1));
    }
  }, [allPubs.length, pi]);

  // Selected state on map/dropdown (defaults to null so no state is clicked by default unless specified in URL)
  const [sel, setSel] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const st = params.get('state');
      if (st) return st;
    }
    return null;
  });
  // Hovered state for interactive Flourish tooltip card
  const [hoveredState, setHoveredState] = useState<{
    name: string;
    cx: number;
    cy: number;
  } | null>(null);
  // Highlight changes toggle
  const [showChanges, setShowChanges] = useState<boolean>(false);

  // Zoom & Pan states for two-finger mobile zoom and desktop zoom
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isGestureActive, setIsGestureActive] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [showTwoFingerHint, setShowTwoFingerHint] = useState<boolean>(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const stateInfoRef = useRef<HTMLDivElement | null>(null);
  const hintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search states for searching states on map and aside panel
  const [stateSearchQuery, setStateSearchQuery] = useState<string>('');
  const [mapSearchOpen, setMapSearchOpen] = useState<boolean>(false);
  const [mapSearchQuery, setMapSearchQuery] = useState<string>('');
  // Toggle for state name labels on the map
  const [showMapLabels, setShowMapLabels] = useState<boolean>(true);

  // Automatically scroll to the state info section when a state is clicked or selected
  const selectState = useCallback((stateName: string | null, shouldScroll = true) => {
    setHoveredState(null);
    setSel(stateName);
    if (stateName && shouldScroll) {
      setTimeout(() => {
        if (stateInfoRef.current) {
          const rect = stateInfoRef.current.getBoundingClientRect();
          const windowHeight = window.innerHeight || document.documentElement.clientHeight;
          const isFullyVisible = rect.top >= 20 && rect.bottom <= windowHeight - 20;

          // On mobile / stacked screens, aside is underneath map, so scroll directly to it
          // On desktop, scroll smoothly if not already fully visible
          if (!isFullyVisible || window.innerWidth < 1024) {
            stateInfoRef.current.scrollIntoView({
              behavior: 'smooth',
              block: window.innerWidth < 1024 ? 'start' : 'nearest'
            });
          }
        }
      }, 70);
    }
  }, []);

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

  // Set up native non-passive touch & wheel listeners for the map container
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      // If at zoom 1 and scrolling down without Ctrl/pinch, let page scroll normally
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
        // Two fingers: Pinch-to-zoom and pan on mobile
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
        // One finger: do NOT preventDefault, letting page scroll vertically
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
        // Two fingers active: perform smooth pinch & pan
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
        // If user drags with 1 finger while map is zoomed in, show 2-finger gesture guidance
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

  // Modal dialog states
  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [formDone, setFormDone] = useState<boolean>(false);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fName, setFName] = useState<string>('');
  const [fEmail, setFEmail] = useState<string>('');
  const [fOrg, setFOrg] = useState<string>('');
  const [fSector, setFSector] = useState<string>('');
  const [fUse, setFUse] = useState<string>('');
  const [fConsent, setFConsent] = useState<boolean>(false);
  const [fWebsite, setFWebsite] = useState<string>('');

  const safePi = Math.min(Math.max(0, pi), allPubs.length - 1);
  const activePub = allPubs[safePi] || allPubs[allPubs.length - 1];
  const curCls = activePub.cls;
  const prevPub = safePi > 0 ? allPubs[safePi - 1] : null;
  const prevCls = prevPub ? prevPub.cls : null;

  const getCatCode = (map: Record<string, string> | null, name: string): string => {
    return (map && map[name]) || 'X';
  };

  const kindOf = (a: string, b: string): string => {
    if (a === 'X') return 'First classification';
    if (b === 'X') return 'Returned to insufficient evidence';
    return 'Classification changed';
  };

  // Comparative changes analysis
  // Comparative changes analysis
  const changes = useMemo(() => {
    if (!prevCls) return [];
    const list: Array<{
      name: string;
      kind: string;
      fromCat: string;
      fromHex: string;
      toCat: string;
      toHex: string;
      rationale: string;
      rightOfResponse: string;
    }> = [];

    DCM_GEO.states.forEach((s) => {
      const a = getCatCode(prevCls, s.name);
      const b = getCatCode(curCls, s.name);
      if (a !== b) {
        const details = getStateDetails(activePub, prevPub, s.name);
        list.push({
          name: s.name,
          kind: kindOf(a, b),
          fromCat: DCM_CAT[a]?.name || 'Insufficient evidence',
          fromHex: DCM_CAT[a]?.hex || '#c9cdd2',
          toCat: DCM_CAT[b]?.name || 'Insufficient evidence',
          toHex: DCM_CAT[b]?.hex || '#c9cdd2',
          rationale: details.keyFinding,
          rightOfResponse: details.rightOfResponse || 'Requested'
        });
      }
    });

    return list.sort((x, y) => (x.name < y.name ? -1 : 1));
  }, [prevCls, curCls, activePub, prevPub]);

  // Formatted summary text
  const summaryPeriod = useMemo(() => {
    return activePub.label.replace(/\s*\(.*\)$/, '') === 'Baseline'
      ? 'baseline, 1 July to 13 September 2026'
      : activePub.short;
  }, [activePub]);

  const summaryText = useMemo(() => {
    if (!prevCls) {
      return 'This is the first published map. It sets the baseline classification for all 36 states and the FCT.';
    }
    if (!changes.length) {
      return 'No state changed classification in this publication.';
    }
    const numberWords = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
    const n = changes.length;
    const parts = changes.map((c) => {
      let reason = (c.rationale || '').trim();
      if (reason && reason !== 'No additional evidence recorded.') {
        reason = reason.replace(/^Classification changed following\s+/i, '').replace(/\.+$/, '');
        if (/^[A-Z][a-z]/.test(reason)) {
          reason = reason.charAt(0).toLowerCase() + reason.slice(1);
        }
      } else {
        reason = 'verified evidence in the decision record';
      }
      return c.kind === 'First classification'
        ? `${c.name} received its first classification, ${c.toCat}, after ${reason}.`
        : `${c.name} moved from ${c.fromCat} to ${c.toCat} after ${reason}.`;
    });
    const prefix = n === 1 ? 'One state' : n <= 10 ? `${numberWords[n]} states` : `${n} states`;
    return `${prefix} moved in this publication. ${parts.join(' ')} All other states are unchanged.`;
  }, [prevCls, changes]);

  // Available dropdown options
  const years = useMemo(() => {
    const list: number[] = [];
    allPubs.forEach((p) => {
      if (!list.includes(p.year)) list.push(p.year);
    });
    return list;
  }, [allPubs]);

  const monthsInYear = useMemo(() => {
    const list: number[] = [];
    allPubs.forEach((p) => {
      if (p.year === activePub.year && !list.includes(p.month)) {
        list.push(p.month);
      }
    });
    return list;
  }, [allPubs, activePub.year]);

  const periodOpts = useMemo(() => {
    const list: Array<{ value: number; label: string }> = [];
    allPubs.forEach((p, index) => {
      if (p.year === activePub.year && p.month === activePub.month) {
        list.push({ value: index, label: p.label });
      }
    });
    return list;
  }, [allPubs, activePub.year, activePub.month]);

  // State options sorted alphabetically
  const stateOpts = useMemo(() => {
    return DCM_GEO.states.map((s) => s.name).sort((a, b) => (a < b ? -1 : 1));
  }, []);

  // Search filtering for aside search bar and map search bar
  const filteredStateOptions = useMemo(() => {
    if (!stateSearchQuery.trim()) return stateOpts;
    const q = stateSearchQuery.trim().toLowerCase();
    return stateOpts.filter((name) => name.toLowerCase().includes(q));
  }, [stateOpts, stateSearchQuery]);

  const mapFilteredStates = useMemo(() => {
    if (!mapSearchQuery.trim()) return stateOpts;
    const q = mapSearchQuery.trim().toLowerCase();
    return stateOpts.filter((name) => name.toLowerCase().includes(q));
  }, [stateOpts, mapSearchQuery]);

  // Selected state info
  const selCatCode = sel ? getCatCode(curCls, sel) : 'X';
  const selCatObj = DCM_CAT[selCatCode] || DCM_CAT.X;

  // Trend grid for selected state (12 months x 2 halves)
  const monthTrends = useMemo(() => {
    return DCM_MONTHS.map((mName, m) => {
      const halves = [0, 1].map((h) => {
        let foundIdx = -1;
        allPubs.forEach((p, index) => {
          if (p.year === activePub.year && p.month === m && p.half === h) {
            foundIdx = index;
          }
        });
        const part = h === 0 ? '1st to 15th' : '16th to month-end';
        if (foundIdx < 0 || !sel) {
          return {
            hex: '#f1f2f4',
            disabled: true,
            aria: `${mName} ${activePub.year}, ${part}: no publication`,
            isActive: false,
            pubIdx: -1
          };
        }
        const cCode = getCatCode(allPubs[foundIdx].cls, sel);
        const isActive = foundIdx === safePi;
        return {
          hex: DCM_CAT[cCode]?.hex || '#c9cdd2',
          disabled: false,
          aria: `${mName} ${activePub.year}, ${part}: ${DCM_CAT[cCode]?.name || 'Insufficient evidence'}${isActive ? ' (map shown)' : ''}`,
          isActive,
          pubIdx: foundIdx
        };
      });
      return {
        name: mName,
        abbr: mName.slice(0, 3),
        halves
      };
    });
  }, [allPubs, activePub.year, sel, safePi]);

  // Validation for form submission
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const isEmailValid = emailRegex.test(fEmail.trim());
  const canSubmit = Boolean(fName.trim().length >= 2 && isEmailValid && fSector && fConsent);

  const handleSubmitBrief = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || formSubmitting) return;

    setFormSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch('/api/dcm-brief-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fName.trim(),
          email: fEmail.trim(),
          organisation: fOrg.trim(),
          sector: fSector,
          intendedUse: fUse.trim(),
          consent: fConsent,
          publicationTitle: activePub.pubTitle || 'Democratic Competitiveness Map',
          reportingPeriod: activePub.short || activePub.label,
          selectedState: sel || 'All States',
          submittedAt: new Date().toISOString(),
          website: fWebsite
        })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setFormError(
          data?.error || 'Unable to submit your DCM Brief request right now. Please try again later.'
        );
        return;
      }

      setFormDone(true);
    } catch {
      setFormError('Network error while sending your request. Your entries have been preserved — please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    if (formSubmitting) return;
    const wasDone = formDone;
    setFormOpen(false);
    setFormDone(false);
    setFormError(null);
    if (wasDone) {
      setFName('');
      setFEmail('');
      setFOrg('');
      setFSector('');
      setFUse('');
      setFConsent(false);
      setFWebsite('');
    }
  };

  // Change selector handlers
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const y = Number(e.target.value);
    for (let i = allPubs.length - 1; i >= 0; i--) {
      if (allPubs[i].year === y) {
        setPi(i);
        return;
      }
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const m = Number(e.target.value);
    for (let i = allPubs.length - 1; i >= 0; i--) {
      if (allPubs[i].year === activePub.year && allPubs[i].month === m) {
        setPi(i);
        return;
      }
    }
  };

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPi(Number(e.target.value));
  };

  const handleStateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    selectState(val ? val : null, true);
  };

  // Sort states so selected, highlighted, or hovered state renders on top
  const renderedShapes = useMemo(() => {
    return DCM_GEO.states.map((s) => {
      const c = getCatCode(curCls, s.name);
      const isChanged = Boolean(prevCls && getCatCode(prevCls, s.name) !== c);
      const isSel = s.name === sel;
      const isHovered = !sel && hoveredState?.name === s.name;
      const isHi = isChanged && showChanges;

      let rank = 0;
      if (isHi) rank = 1;
      if (isSel) rank = 2;
      if (isHovered) rank = 3;

      const isBoldWhite = isSel || isHovered || isHi;

      return {
        ...s,
        cCode: c,
        fill: DCM_CAT[c]?.hex || '#c9cdd2',
        opacity: (!sel || isSel) ? 1 : (isHovered ? 1 : 0.35),
        stroke: isBoldWhite ? '#ffffff' : '#1c232b',
        strokeWidth: isBoldWhite ? 3.8 : 0.95,
        isBoldWhite,
        rank,
        title: `${s.name}: ${DCM_CAT[c]?.name || 'Insufficient evidence'}`
      };
    }).sort((a, b) => a.rank - b.rank);
  }, [curCls, prevCls, sel, showChanges, hoveredState]);

  return (
    <div
      style={{
        fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: '#1c232b',
        background: isEmbedded ? 'transparent' : '#f3f4f6',
        minHeight: isEmbedded ? 'auto' : '100vh'
      }}
    >

      {/* Main Container */}
      <div
        style={{
          maxWidth: isEmbedded ? '100%' : '1320px',
          margin: '0 auto',
          padding: isEmbedded ? '0 0 16px' : '32px 24px 56px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        {/* Header Block */}
        {!isEmbedded ? (
          <header style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h1
              style={{
                margin: 0,
                fontSize: '34px',
                lineHeight: 1.15,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#1c232b'
              }}
            >
              Democratic Competitiveness Map
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: '17px',
                lineHeight: 1.5,
                color: '#3d4752',
                maxWidth: '760px'
              }}
            >
              Evidence-based classifications of the practical conditions for political competition in the 36 states and the FCT, published twice a month. Use the panel to view any past map or follow one state through the year.
            </p>
          </header>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              paddingBottom: '4px'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#1f5fa8',
                  textTransform: 'uppercase'
                }}
              >
                Interactive Map Visualization
              </span>
              <h2
                style={{
                  margin: 0,
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#1c232b',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2
                }}
              >
                Democratic Competitiveness Map (DCM)
              </h2>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: '15px',
                  color: '#475569',
                  maxWidth: '840px',
                  lineHeight: 1.55
                }}
              >
                Nigeria’s political competition environment remains uneven, with concerns concentrated around political mobilisation, campaign access and institutional neutrality as the 2027 elections approach.
              </p>
            </div>
            <div>
              <a
                href="/democratic-competitiveness-map"
                onClick={(e) => {
                  e.preventDefault();
                  window.history.pushState({}, '', '/democratic-competitiveness-map');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                  window.scrollTo(0, 0);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  background: '#1f5fa8',
                  color: '#ffffff',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#174880'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#1f5fa8'; }}
              >
                <span>View Full DCM Page</span>
                <span style={{ fontSize: '14px' }}>→</span>
              </a>
            </div>
          </div>
        )}

        {/* What changed in this publication summary card */}
        {!isEmbedded && (
          <section
            aria-label="What changed in this publication"
            style={{
              background: '#ffffff',
              border: '1px solid #d5d9de',
              borderRadius: '6px',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 700,
                color: '#1c232b',
                lineHeight: 1.3
              }}
            >
              What changed in this publication ({summaryPeriod})
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: '15px',
                lineHeight: 1.55,
                color: '#3d4752'
              }}
            >
              {summaryText}
            </p>
          </section>
        )}

        {/* Two Column Layout: Map Section + Aside Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>

          {/* LEFT: Map Section */}
          <section
            aria-label="Map"
            style={{
              flex: '999 1 600px',
              minWidth: 0,
              background: '#ffffff',
              border: '1px solid #d5d9de',
              borderRadius: '6px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>
                Map as published for {activePub.short}
              </h2>
              {sel && (
                <button
                  type="button"
                  onClick={() => selectState(null, false)}
                  style={{
                    font: 'inherit',
                    fontSize: '13px',
                    fontWeight: 600,
                    padding: '4px 10px',
                    border: '1px solid #8a939c',
                    borderRadius: '4px',
                    background: '#ffffff',
                    color: '#1f5fa8',
                    cursor: 'pointer'
                  }}
                >
                  Reset / All states
                </button>
              )}
            </div>

            {/* Classification Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 22px', alignItems: 'center' }}>
              {DCM_ORDER.map((k) => {
                const item = DCM_CAT[k];
                return (
                  <span key={k} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '3px',
                        border: '1px solid #8a939c',
                        background: item.hex,
                        flex: 'none',
                        display: 'inline-block'
                      }}
                    />
                    {item.name}
                  </span>
                );
              })}
            </div>

            <p style={{ margin: 0, fontSize: '14px', color: '#3d4752' }}>
              Insufficient evidence means AEO does not yet hold enough verified evidence to classify the state. It does not mean conditions are open.
            </p>

            {/* Interactive SVG Nigeria Map with Two-Finger Mobile Zoom and Desktop Zoom */}
            <div
              ref={mapContainerRef}
              style={{
                position: 'relative',
                width: '100%',
                overflow: 'hidden',
                borderRadius: '6px',
                background: '#eceef1',
                touchAction: 'pan-y',
                userSelect: 'none'
              }}
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
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  zIndex: 40,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid #d5d9de',
                  borderRadius: '6px',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.12)',
                  padding: '4px'
                }}
              >
                <button
                  type="button"
                  onClick={handleZoomIn}
                  title="Zoom in (or two-finger pinch on mobile, mouse wheel on desktop)"
                  aria-label="Zoom in"
                  style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    background: 'transparent',
                    cursor: zoom >= 4.5 ? 'not-allowed' : 'pointer',
                    opacity: zoom >= 4.5 ? 0.35 : 1,
                    fontSize: '19px',
                    fontWeight: 700,
                    color: '#1c232b',
                    borderRadius: '4px',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  title="Zoom out"
                  aria-label="Zoom out"
                  style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    background: 'transparent',
                    cursor: zoom <= 1 ? 'not-allowed' : 'pointer',
                    opacity: zoom <= 1 ? 0.35 : 1,
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#1c232b',
                    borderRadius: '4px',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  –
                </button>
                {zoom > 1 && (
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    title="Reset map zoom"
                    aria-label="Reset map zoom"
                    style={{
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      background: '#eff6ff',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#1f5fa8',
                      borderRadius: '4px',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#dbeafe'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#eff6ff'; }}
                  >
                    ↺
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowMapLabels((prev) => !prev)}
                  title={showMapLabels ? 'Hide state names on map' : 'Show state names on map'}
                  aria-label={showMapLabels ? 'Hide state names on map' : 'Show state names on map'}
                  style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    background: showMapLabels ? '#eff6ff' : 'transparent',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: showMapLabels ? '#1d4ed8' : '#64748b',
                    borderRadius: '4px',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => { if (!showMapLabels) e.currentTarget.style.background = '#f3f4f6'; }}
                  onMouseLeave={(e) => { if (!showMapLabels) e.currentTarget.style.background = 'transparent'; }}
                >
                  Aa
                </button>
              </div>

              {/* Floating Map Search Button / Popover (Matching screenshot [🔍] icon) */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  zIndex: 45
                }}
              >
                {!mapSearchOpen ? (
                  <button
                    type="button"
                    onClick={() => setMapSearchOpen(true)}
                    title="Search states on map"
                    aria-label="Search states on map"
                    style={{
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(4px)',
                      border: '1px solid #d5d9de',
                      borderRadius: '6px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      cursor: 'pointer',
                      color: '#1c232b',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'; }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </button>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      background: '#ffffff',
                      border: '1px solid #d5d9de',
                      borderRadius: '6px',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.16)',
                      width: '260px',
                      maxWidth: 'calc(100vw - 48px)',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', gap: '6px' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <input
                        autoFocus
                        type="text"
                        value={mapSearchQuery}
                        onChange={(e) => setMapSearchQuery(e.target.value)}
                        placeholder="Search state..."
                        style={{
                          flex: 1,
                          border: 'none',
                          outline: 'none',
                          fontSize: '13px',
                          color: '#1c232b',
                          background: 'transparent'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setMapSearchOpen(false);
                          setMapSearchQuery('');
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '13px', padding: '0 4px' }}
                      >
                        ✕
                      </button>
                    </div>
                    {mapSearchQuery.trim() && (
                      <div style={{ maxHeight: '180px', overflowY: 'auto', borderTop: '1px solid #f1f5f9' }}>
                        {mapFilteredStates.length > 0 ? (
                          mapFilteredStates.map((st) => {
                            const c = getCatCode(curCls, st);
                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => {
                                  selectState(st, true);
                                  setMapSearchOpen(false);
                                  setMapSearchQuery('');
                                }}
                                style={{
                                  width: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '8px 12px',
                                  border: 'none',
                                  borderBottom: '1px solid #f8fafc',
                                  background: sel === st ? '#eff6ff' : 'transparent',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  fontSize: '13px'
                                }}
                              >
                                <span style={{ fontWeight: 600, color: '#1c232b' }}>{st}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#64748b' }}>
                                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: DCM_CAT[c]?.hex || '#c9cdd2' }} />
                                  {DCM_CAT[c]?.name}
                                </span>
                              </button>
                            );
                          })
                        ) : (
                          <div style={{ padding: '8px 12px', fontSize: '12px', color: '#64748b' }}>
                            No match
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Active Zoom Badge */}
              {zoom > 1 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: mapSearchOpen ? '282px' : '52px',
                    zIndex: 40,
                    background: 'rgba(255, 255, 255, 0.92)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid #d5d9de',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#475569',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                    pointerEvents: 'none',
                    transition: 'left 0.2s ease'
                  }}
                >
                  {Math.round(zoom * 100)}%
                </div>
              )}

              {/* Mobile Two-Finger Guidance Toast */}
              {showTwoFingerHint && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 50,
                    background: 'rgba(15, 23, 42, 0.92)',
                    color: '#ffffff',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span>✌️ Use two fingers to pan map</span>
                </div>
              )}

              {/* Transformed Map Layer */}
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: '50% 50%',
                  transition: isGestureActive ? 'none' : 'transform 0.18s cubic-bezier(0.2, 0, 0, 1)',
                  cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default'
                }}
              >
                <svg
                  viewBox="0 0 760 617"
                  role="img"
                  aria-label="Map of Nigeria showing the classification of each state and the FCT for the selected publication"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                >
                  {/* State Paths */}
                  {renderedShapes.map((s) => {
                    return (
                      <path
                        key={s.name}
                        d={s.d}
                        onClick={() => {
                          if (mouseDragRef.current.hasDragged) {
                            mouseDragRef.current.hasDragged = false;
                            return;
                          }
                          const next = s.name === sel ? null : s.name;
                          selectState(next, true);
                        }}
                        onMouseEnter={() => {
                          if (!sel && !mouseDragRef.current.isDown) {
                            setHoveredState({ name: s.name, cx: s.cx, cy: s.cy });
                          }
                        }}
                        onMouseLeave={() => setHoveredState(null)}
                        style={{
                          fill: s.fill,
                          fillOpacity: s.opacity,
                          stroke: s.stroke,
                          strokeWidth: `${s.strokeWidth}px`,
                          strokeLinejoin: 'round',
                          cursor: 'pointer',
                          filter: s.isBoldWhite ? 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.45))' : undefined,
                          transition: 'fill 0.2s ease, fill-opacity 0.2s ease, stroke-width 0.15s ease'
                        }}
                      >
                        <title>{s.title}</title>
                      </path>
                    );
                  })}

                  {/* State Text Labels - Bold and does not increase when zoomed into */}
                  {showMapLabels && DCM_GEO.states.map((s) => {
                    const c = getCatCode(curCls, s.name);
                    const isSmall = Boolean(DCM_SMALL[s.name]);
                    const baseFontSize = isSmall ? 7.5 : 9.5;
                    const fontFill = c === 'R' ? '#ffffff' : '#1c232b';
                    const isSelected = s.name === sel;
                    const labelOpacity = (!sel || isSelected) ? 1 : 0.45;

                    return (
                      <text
                        key={`label-${s.name}`}
                        x={s.cx}
                        y={s.cy}
                        transform={zoom !== 1 ? `translate(${s.cx}, ${s.cy}) scale(${1 / zoom}) translate(${-s.cx}, ${-s.cy})` : undefined}
                        style={{
                          fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                          fontWeight: isSelected ? 800 : 700,
                          fontSize: `${baseFontSize}px`,
                          letterSpacing: '0.025em',
                          fill: fontFill,
                          opacity: labelOpacity,
                          textAnchor: 'middle',
                          dominantBaseline: 'central',
                          pointerEvents: 'none',
                          userSelect: 'none'
                        }}
                      >
                        {s.name.toUpperCase()}
                      </text>
                    );
                  })}
                </svg>
              </div>

              {/* Flourish-style Floating Hover Card (positioned relative to zoomed state coordinates, paused when clicked) */}
              {!sel && hoveredState && (() => {
                const details = getStateDetails(activePub, prevPub, hoveredState.name);
                const cutoffText = activePub.cutoff || '28 September 2026';

                const containerW = mapContainerRef.current?.clientWidth || 760;
                const containerH = mapContainerRef.current?.clientHeight || 617;
                const u = hoveredState.cx / 760;
                const v = hoveredState.cy / 617;
                const visualX = containerW / 2 + (u * containerW - containerW / 2) * zoom + pan.x;
                const visualY = containerH / 2 + (v * containerH - containerH / 2) * zoom + pan.y;

                const isRightSide = visualX > containerW * 0.52;
                const tooltipLeft = isRightSide
                  ? Math.max(12, visualX - 315)
                  : Math.min(containerW - 315, visualX + 15);
                const tooltipTop = Math.max(12, Math.min(containerH - 250, visualY - 60));

                return (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${tooltipLeft}px`,
                      top: `${tooltipTop}px`,
                      pointerEvents: 'none',
                      background: '#ffffff',
                      color: '#1c232b',
                      padding: '18px 20px',
                      borderRadius: '6px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.16), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
                      border: '1px solid #d5d9de',
                      width: '300px',
                      maxWidth: 'calc(100% - 24px)',
                      zIndex: 60,
                      fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                    }}
                  >
                    <div style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: '#1c232b', letterSpacing: '-0.01em' }}>
                      {hoveredState.name}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', lineHeight: 1.45 }}>
                      <div>
                        <strong style={{ color: '#1e293b' }}>DCM Classification: </strong>
                        <span style={{ color: '#334155' }}>{details.classification}</span>
                      </div>

                      <div>
                        <strong style={{ color: '#1e293b' }}>Direction: </strong>
                        <span style={{ color: '#334155' }}>{details.direction}</span>
                      </div>

                      <div>
                        <strong style={{ color: '#1e293b' }}>Confidence: </strong>
                        <span style={{ color: '#334155' }}>{details.confidence}</span>
                      </div>

                      <div>
                        <strong style={{ color: '#1e293b' }}>Key Finding: </strong>
                        <span style={{ color: '#334155' }}>{details.keyFinding}</span>
                      </div>
                    </div>

                    <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>
                      <div>AEO Democratic Competitiveness Map (DCM)</div>
                      <div>Updated: {cutoffText}</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </section>

          {/* RIGHT: Aside Controls & State Trend */}
          <aside
            aria-label="Map controls and state trend"
            style={{
              flex: '1 1 400px',
              minWidth: 0,
              background: '#ffffff',
              border: '1px solid #d5d9de',
              borderRadius: '6px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '26px'
            }}
          >
            {/* View a published map */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                View a published map
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
                {/* Year Select */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                  <label htmlFor="dcm-year" style={{ fontSize: '14px', fontWeight: 600 }}>
                    Year
                  </label>
                  <select
                    id="dcm-year"
                    value={activePub.year}
                    onChange={handleYearChange}
                    style={{
                      font: 'inherit',
                      fontSize: '15px',
                      minHeight: '44px',
                      padding: '6px 8px',
                      border: '1px solid #8a939c',
                      borderRadius: '4px',
                      background: '#ffffff',
                      color: '#1c232b',
                      minWidth: 0
                    }}
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                {/* Month Select */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                  <label htmlFor="dcm-month" style={{ fontSize: '14px', fontWeight: 600 }}>
                    Month
                  </label>
                  <select
                    id="dcm-month"
                    value={activePub.month}
                    onChange={handleMonthChange}
                    style={{
                      font: 'inherit',
                      fontSize: '15px',
                      minHeight: '44px',
                      padding: '6px 8px',
                      border: '1px solid #8a939c',
                      borderRadius: '4px',
                      background: '#ffffff',
                      color: '#1c232b',
                      minWidth: 0
                    }}
                  >
                    {monthsInYear.map((m) => (
                      <option key={m} value={m}>{DCM_MONTHS[m]}</option>
                    ))}
                  </select>
                </div>

                {/* Period Select */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                  <label htmlFor="dcm-period" style={{ fontSize: '14px', fontWeight: 600 }}>
                    Period
                  </label>
                  <select
                    id="dcm-period"
                    value={pi}
                    onChange={handlePeriodChange}
                    style={{
                      font: 'inherit',
                      fontSize: '15px',
                      minHeight: '44px',
                      padding: '6px 8px',
                      border: '1px solid #8a939c',
                      borderRadius: '4px',
                      background: '#ffffff',
                      color: '#1c232b',
                      minWidth: 0
                    }}
                  >
                    {periodOpts.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Follow a State / State Information Section */}
            <div
              ref={stateInfoRef}
              id="dcm-state-info"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                scrollMarginTop: '28px'
              }}
            >
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                Follow a state
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="dcm-state-search" style={{ fontSize: '14px', fontWeight: 600 }}>
                  Search or select state
                </label>

                {/* State Search Input */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }}
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    id="dcm-state-search"
                    type="text"
                    value={stateSearchQuery}
                    onChange={(e) => setStateSearchQuery(e.target.value)}
                    placeholder="Search state (e.g. Kaduna, Edo, Kano)..."
                    style={{
                      width: '100%',
                      font: 'inherit',
                      fontSize: '14px',
                      minHeight: '40px',
                      padding: '8px 32px 8px 36px',
                      border: '1px solid #8a939c',
                      borderRadius: '4px',
                      background: '#ffffff',
                      color: '#1c232b',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#2563eb'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#8a939c'; }}
                  />
                  {stateSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setStateSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#64748b'
                      }}
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Quick match suggestion chips if searching */}
                {stateSearchQuery.trim() && filteredStateOptions.length > 0 && filteredStateOptions.length <= 8 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {filteredStateOptions.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          selectState(st, true);
                          setStateSearchQuery('');
                        }}
                        style={{
                          fontSize: '12px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: sel === st ? '1px solid #2563eb' : '1px solid #cbd5e1',
                          background: sel === st ? '#2563eb' : '#f8fafc',
                          color: sel === st ? '#ffffff' : '#1e293b',
                          cursor: 'pointer',
                          fontWeight: 500
                        }}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                )}

                {/* Dropdown Select */}
                <select
                  id="dcm-state"
                  value={sel || ''}
                  onChange={handleStateSelect}
                  style={{
                    font: 'inherit',
                    fontSize: '15px',
                    minHeight: '44px',
                    padding: '6px 8px',
                    border: '1px solid #8a939c',
                    borderRadius: '4px',
                    background: '#ffffff',
                    color: '#1c232b'
                  }}
                >
                  <option value="">{stateSearchQuery ? `Filtered states (${filteredStateOptions.length})` : 'All states'}</option>
                  {filteredStateOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <span style={{ fontSize: '13px', color: '#3d4752' }}>
                  Search above, choose from the list, or click any state on the map.
                </span>
              </div>

              {!sel && (
                <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.5, color: '#3d4752' }}>
                  Choose a state to see its classification trend for {activePub.year}.
                </p>
              )}

              {sel && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>
                        {sel}
                      </h3>
                      <button
                        type="button"
                        onClick={() => selectState(null, false)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#1f5fa8',
                          fontSize: '13px',
                          cursor: 'pointer',
                          padding: 0,
                          textDecoration: 'underline'
                        }}
                      >
                        Clear selection
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', fontWeight: 600 }}>
                      <span
                        aria-hidden="true"
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '3px',
                          border: '1px solid #8a939c',
                          background: selCatObj.hex,
                          flex: 'none',
                          display: 'inline-block'
                        }}
                      />
                      {selCatObj.name}
                      <span style={{ fontWeight: 400, color: '#3d4752' }}>
                        ({activePub.short})
                      </span>
                    </div>

                    {/* State Evidence & Classification Metadata */}
                    {(() => {
                      const selDetails = getStateDetails(activePub, prevPub, sel);
                      return (
                        <div
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            padding: '12px 14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            fontSize: '13px',
                            lineHeight: 1.45,
                            marginTop: '4px'
                          }}
                        >
                          <div>
                            <strong style={{ color: '#1e293b' }}>Direction: </strong>
                            <span style={{ color: '#334155' }}>{selDetails.direction}</span>
                          </div>
                          <div>
                            <strong style={{ color: '#1e293b' }}>Confidence: </strong>
                            <span style={{ color: '#334155' }}>{selDetails.confidence}</span>
                          </div>
                          <div>
                            <strong style={{ color: '#1e293b' }}>Key Finding: </strong>
                            <span style={{ color: '#334155' }}>{selDetails.keyFinding}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Year Trend Grid */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 600 }}>
                      {activePub.year} trend
                    </span>

                    <div
                      role="group"
                      aria-label={`${activePub.year} classification trend for ${sel}`}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
                        borderRadius: '3px',
                        overflow: 'hidden',
                        border: '1px solid #d5d9de'
                      }}
                    >
                      {monthTrends.map((m, mIdx) => (
                        <div
                          key={m.name}
                          style={{
                            display: 'flex',
                            aspectRatio: '1 / 1',
                            borderRight: mIdx < 11 ? '1px solid #ffffff' : 'none'
                          }}
                        >
                          {m.halves.map((h, hIdx) => (
                            <button
                              key={`${m.name}-${hIdx}`}
                              type="button"
                              disabled={h.disabled}
                              onClick={() => {
                                if (!h.disabled && h.pubIdx >= 0) {
                                  setPi(h.pubIdx);
                                }
                              }}
                              aria-label={h.aria}
                              title={h.aria}
                              style={{
                                flex: '1 1 0',
                                minWidth: 0,
                                padding: 0,
                                margin: 0,
                                border: 'none',
                                borderRight: hIdx === 0 ? '1px solid #ffffff' : 'none',
                                background: h.hex,
                                boxShadow: h.isActive ? 'inset 0 0 0 2px #1f5fa8' : 'none',
                                cursor: h.disabled ? 'default' : 'pointer'
                              }}
                            />
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* Month Abbreviations */}
                    <div
                      aria-hidden="true"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
                        fontSize: '11px',
                        color: '#3d4752',
                        textAlign: 'center'
                      }}
                    >
                      {monthTrends.map((m) => (
                        <span key={m.name}>{m.abbr}</span>
                      ))}
                    </div>

                    <p style={{ margin: '4px 0 0', fontSize: '13px', lineHeight: 1.5, color: '#3d4752' }}>
                      Each month is split in two: the left half is the publication for the 1st to the 15th, the right half the publication for the 16th to month-end. A pale cell means no publication.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Request Brief CTA Button */}
            <button
              type="button"
              onClick={() => {
                setFormOpen(true);
                setFormDone(false);
              }}
              style={{
                font: 'inherit',
                fontSize: '16px',
                fontWeight: 600,
                minHeight: '48px',
                padding: '10px 16px',
                borderRadius: '4px',
                border: 'none',
                background: '#1c232b',
                color: '#ffffff',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              Request the DCM Brief for this period
            </button>

            <p style={{ margin: '-12px 0 0', fontSize: '14px', textAlign: 'center', color: '#3d4752' }}>
              Seen something we may have missed?
              <br />
              <a
                href="https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=wNynuw5quEuIVaAKwkD2XQCOpLjLwJxLukh_kFKHtNRUNk1TODY5NTBINFE3VE5HT0kxSFNQWEtXNy4u"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  marginTop: '4px',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#1f5fa8'
                }}
              >
                Tell us
              </a>
            </p>
          </aside>
        </div>

        {/* DCM Explanatory Section (Standalone DCM Page) */}
        {!isEmbedded && (
          <section
            aria-label="About the Democratic Competitiveness Map"
            className="bg-white border border-line rounded-2xl p-6 sm:p-10 space-y-8 shadow-sm"
          >
            <div className="space-y-6 text-ink2 text-base leading-relaxed">
              <h2 className="font-display font-bold text-2xl text-ink">What is DCM?</h2>
              <p>
                The Democratic Competitiveness Map (DCM) is the Athena Election Observatory’s evidence-based system for monitoring the conditions under which legitimate political actors compete across Nigeria’s thirty-six states and the Federal Capital Territory.
              </p>
              <p>
                A credible election requires more than a credible election day. Political actors must also have a practical opportunity to organise, communicate, move, assemble and compete before voters cast their ballots.
              </p>
              <p>
                Election integrity examines whether voting, counting and collation reflect the will of voters. The DCM examines the environment in which political actors compete, whether the political actors have a reasonably open and fair opportunity to compete for those votes.
              </p>
              <p>
                The DCM assesses whether political parties, candidates and other legitimate political actors can organise, communicate, mobilise, move, campaign, access relevant institutions and participate in political competition under conditions of political pluralism, institutional neutrality, legal certainty and practical fairness.
              </p>
            </div>

            <div className="space-y-6 text-ink2 text-base leading-relaxed border-t border-line pt-8">
              <h2 className="font-display font-bold text-2xl text-ink">What does it track?</h2>
              <p>The DCM tracks five dimensions of the political competition environment:</p>
              <ul className="list-disc pl-6 space-y-3">
                <li>
                  <strong className="text-ink">Political Space — Freedom of Association and Movement:</strong> Whether political actors can organise, assemble, move and campaign without unjustified or discriminatory restrictions.
                </li>
                <li>
                  <strong className="text-ink">Freedom of Speech and Expression:</strong> Whether political actors can communicate, campaign and express political positions without materially restrictive interference.
                </li>
                <li>
                  <strong className="text-ink">Administrative and Regulatory Neutrality:</strong> Whether administrative, regulatory and legal powers are applied impartially and without creating discriminatory competitive effects.
                </li>
                <li>
                  <strong className="text-ink">Security Neutrality:</strong> Whether police and security institutions protect lawful political activity and enforce applicable rules impartially across political actors.
                </li>
                <li>
                  <strong className="text-ink">Political Intimidation and Violence:</strong> Whether threats, coercion or violence materially restrict political actors from participating in political competition.
                </li>
              </ul>
            </div>

            <div className="space-y-6 text-ink2 text-base leading-relaxed border-t border-line pt-8">
              <h2 className="font-display font-bold text-2xl text-ink">What does it seek to achieve?</h2>
              <p>The DCM is designed to:</p>
              <ul className="list-disc pl-6 space-y-3">
                <li>Provide an evidence-based picture of political competition conditions across Nigeria before election day.</li>
                <li>Identify emerging restrictions and pressure points that may affect the ability of political actors to compete.</li>
                <li>Track changes in competitive conditions over time, including whether conditions improve, deteriorate or remain unchanged.</li>
                <li>Make the evidence behind each classification transparent and traceable, allowing users to examine the basis for a state’s classification.</li>
                <li>Highlight areas requiring closer attention from political actors, institutions, civil society, researchers and other stakeholders as elections approach.</li>
              </ul>
            </div>

            <div className="space-y-6 text-ink2 text-base leading-relaxed border-t border-line pt-8">
              <h2 className="font-display font-bold text-2xl text-ink">What is it not?</h2>
              <p>The DCM:</p>
              <ul className="list-disc pl-6 space-y-3">
                <li>Does not rank states or political parties.</li>
                <li>Does not assign numerical scores, weights or composite values.</li>
                <li>Does not measure political popularity, vote share or predict electoral outcomes.</li>
                <li>Does not assess whether a court reached the correct legal conclusion.</li>
                <li>Does not treat allegations as established facts without sufficient verification.</li>
                <li>Is not a general democracy, governance or civil-liberties index.</li>
                <li>Does not equate limited reporting or lack of evidence with an open political environment.</li>
                <li>Does not replace AEO’s election-day monitoring or Post-Election Audit workstreams.</li>
              </ul>
              <p className="mt-4">
                Each colour represents the current state of evidence for a defined reporting period, rather than a permanent judgment about a state. Classifications can change as conditions change, restrictions are remedied, or stronger evidence becomes available.
              </p>
            </div>

            <div className="space-y-6 text-ink2 text-base leading-relaxed border-t border-line pt-8">
              <h2 className="font-display font-bold text-2xl text-ink">How do the colours work?</h2>
              <p>
                The DCM uses five colour classifications. The colours are evidence-based and time-bound; they are not permanent labels assigned to states.
              </p>

              {/* Responsive Colours Table */}
              <div className="overflow-x-auto my-6 border border-line rounded-xl">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-paper border-b border-line text-ink font-mono text-xs uppercase">
                      <th className="p-4 font-bold">Colour</th>
                      <th className="p-4 font-bold">Classification</th>
                      <th className="p-4 font-bold">What it means</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-ink2">
                    <tr className="hover:bg-paper/50">
                      <td className="p-4 font-semibold text-ink align-top whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                          Green
                        </span>
                      </td>
                      <td className="p-4 font-bold text-ink align-top">Open</td>
                      <td className="p-4">
                        Affirmative and sufficiently broad evidence indicates broadly equal practical political access during the reporting period, with political actors able to organise, communicate, mobilise and campaign without verified material or discriminatory restrictions. No verified pattern of material restriction remains at the cut-off date. Absence of adverse reporting or insufficient evidence is not, by itself, grounds for a Green classification.
                      </td>
                    </tr>
                    <tr className="hover:bg-paper/50">
                      <td className="p-4 font-semibold text-ink align-top whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-full bg-amber-400 inline-block shrink-0" />
                          Amber
                        </span>
                      </td>
                      <td className="p-4 font-bold text-ink align-top">Emerging Concern</td>
                      <td className="p-4">
                        A material incident or early evidence of unequal treatment requires monitoring, but the evidence does not yet establish a sustained or substantial restrictive pattern.
                      </td>
                    </tr>
                    <tr className="hover:bg-paper/50">
                      <td className="p-4 font-semibold text-ink align-top whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-full bg-orange-500 inline-block shrink-0" />
                          Orange
                        </span>
                      </td>
                      <td className="p-4 font-bold text-ink align-top">Constrained</td>
                      <td className="p-4">
                        Multiple verified incidents, an identifiable pattern, or an exceptionally serious and well-documented action materially restricts political competition.
                      </td>
                    </tr>
                    <tr className="hover:bg-paper/50">
                      <td className="p-4 font-semibold text-ink align-top whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-full bg-red-600 inline-block shrink-0" />
                          Red
                        </span>
                      </td>
                      <td className="p-4 font-bold text-ink align-top">Severely Constrained</td>
                      <td className="p-4">
                        Serious, sustained or systemic restrictions substantially impair political competition, taking into account their severity, reach, institutional authority and consequences.
                      </td>
                    </tr>
                    <tr className="hover:bg-paper/50">
                      <td className="p-4 font-semibold text-ink align-top whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-full bg-slate-300 inline-block shrink-0" />
                          Grey
                        </span>
                      </td>
                      <td className="p-4 font-bold text-ink align-top">Insufficient Evidence</td>
                      <td className="p-4">
                        Available evidence is inadequate to make a responsible classification. Importantly, insufficient evidence does not mean that political competition is open.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Embedded Mode Footer Banner */}
        {isEmbedded && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '16px 22px',
              background: '#ffffff',
              border: '1px solid #d5d9de',
              borderRadius: '8px',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div style={{ fontSize: '14px', color: '#334155', lineHeight: 1.5 }}>
              <strong style={{ color: '#0f172a' }}>Explore full dataset:</strong> View all historical bi-monthly publications, inspect detailed evidentiary rationales for all 37 jurisdictions, and request official briefs.
            </div>
            <a
              href="/democratic-competitiveness-map"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, '', '/democratic-competitiveness-map');
                window.dispatchEvent(new PopStateEvent('popstate'));
                window.scrollTo(0, 0);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#1f5fa8',
                fontSize: '13px',
                fontWeight: 700,
                textDecoration: 'none',
                cursor: 'pointer'
              }}
            >
              <span>Explore Complete DCM Archive</span>
              <span>→</span>
            </a>
          </div>
        )}

        {/* Modal Dialog: Request the DCM Brief */}
        {formOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(28, 35, 43, 0.55)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              padding: '32px 16px',
              overflowY: 'auto',
              zIndex: 9999,
              boxSizing: 'border-box'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) handleCloseModal();
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="dcm-form-title"
              style={{
                background: '#ffffff',
                borderRadius: '6px',
                width: '100%',
                maxWidth: '580px',
                padding: '28px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              {!formDone ? (
                <form onSubmit={handleSubmitBrief} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <h2 id="dcm-form-title" style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>
                      Request the DCM Brief
                    </h2>
                    <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.5, color: '#3d4752' }}>
                      Publication: {activePub.short}. The brief covers all 36 states and the FCT and is free of charge.
                    </p>
                  </div>

                  {/* Honeypot field for automated spam protection */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '-10000px',
                      width: '1px',
                      height: '1px',
                      overflow: 'hidden'
                    }}
                    aria-hidden="true"
                  >
                    <label htmlFor="dcm-f-website">Website</label>
                    <input
                      id="dcm-f-website"
                      name="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={fWebsite}
                      onChange={(e) => setFWebsite(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label htmlFor="dcm-f-name" style={{ fontSize: '14px', fontWeight: 600 }}>
                      Full name <span style={{ color: '#8f1d17' }}>*</span>
                    </label>
                    <input
                      id="dcm-f-name"
                      type="text"
                      required
                      disabled={formSubmitting}
                      autoComplete="name"
                      value={fName}
                      onChange={(e) => setFName(e.target.value)}
                      placeholder="e.g. Amina Bello"
                      style={{
                        font: 'inherit',
                        fontSize: '15px',
                        minHeight: '44px',
                        padding: '6px 10px',
                        border: '1px solid #8a939c',
                        borderRadius: '4px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label htmlFor="dcm-f-email" style={{ fontSize: '14px', fontWeight: 600 }}>
                      Email address <span style={{ color: '#8f1d17' }}>*</span>
                    </label>
                    <input
                      id="dcm-f-email"
                      type="email"
                      required
                      disabled={formSubmitting}
                      autoComplete="email"
                      value={fEmail}
                      onChange={(e) => setFEmail(e.target.value)}
                      placeholder="name@organisation.org"
                      style={{
                        font: 'inherit',
                        fontSize: '15px',
                        minHeight: '44px',
                        padding: '6px 10px',
                        border: '1px solid #8a939c',
                        borderRadius: '4px',
                        boxSizing: 'border-box'
                      }}
                    />
                    <span style={{ fontSize: '13px', color: '#3d4752' }}>
                      The AEO team will contact you at this address regarding your request.
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label htmlFor="dcm-f-org" style={{ fontSize: '14px', fontWeight: 600 }}>
                      Organisation (optional)
                    </label>
                    <input
                      id="dcm-f-org"
                      type="text"
                      disabled={formSubmitting}
                      autoComplete="organization"
                      value={fOrg}
                      onChange={(e) => setFOrg(e.target.value)}
                      placeholder="e.g. Centre for Democracy"
                      style={{
                        font: 'inherit',
                        fontSize: '15px',
                        minHeight: '44px',
                        padding: '6px 10px',
                        border: '1px solid #8a939c',
                        borderRadius: '4px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label htmlFor="dcm-f-sector" style={{ fontSize: '14px', fontWeight: 600 }}>
                      Which best describes you? <span style={{ color: '#8f1d17' }}>*</span>
                    </label>
                    <select
                      id="dcm-f-sector"
                      required
                      disabled={formSubmitting}
                      value={fSector}
                      onChange={(e) => setFSector(e.target.value)}
                      style={{
                        font: 'inherit',
                        fontSize: '15px',
                        minHeight: '44px',
                        padding: '6px 8px',
                        border: '1px solid #8a939c',
                        borderRadius: '4px',
                        background: '#ffffff',
                        color: '#1c232b'
                      }}
                    >
                      <option value="">Select one</option>
                      {SECTORS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label htmlFor="dcm-f-use" style={{ fontSize: '14px', fontWeight: 600 }}>
                      How will you use the brief? (optional)
                    </label>
                    <textarea
                      id="dcm-f-use"
                      rows={3}
                      disabled={formSubmitting}
                      value={fUse}
                      onChange={(e) => setFUse(e.target.value)}
                      placeholder="e.g. Research, civic voter awareness, news reporting..."
                      style={{
                        font: 'inherit',
                        fontSize: '15px',
                        padding: '8px 10px',
                        border: '1px solid #8a939c',
                        borderRadius: '4px',
                        boxSizing: 'border-box',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      fontSize: '14px',
                      lineHeight: 1.5,
                      cursor: formSubmitting ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      disabled={formSubmitting}
                      checked={fConsent}
                      onChange={(e) => setFConsent(e.target.checked)}
                      style={{ width: '18px', height: '18px', margin: '2px 0 0', flex: 'none' }}
                    />
                    <span>
                      I agree that AEO may use these details to review my request and contact me regarding the brief, as set out in the privacy notice.
                    </span>
                  </label>

                  {formError && (
                    <div
                      role="alert"
                      style={{
                        padding: '12px 14px',
                        borderRadius: '4px',
                        border: '1px solid #fecaca',
                        background: '#fef2f2',
                        color: '#991b1b',
                        fontSize: '14px',
                        lineHeight: 1.5
                      }}
                    >
                      {formError}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                    <button
                      type="button"
                      disabled={formSubmitting}
                      onClick={handleCloseModal}
                      style={{
                        font: 'inherit',
                        fontSize: '15px',
                        minHeight: '44px',
                        padding: '8px 18px',
                        borderRadius: '4px',
                        border: '1px solid #8a939c',
                        background: '#ffffff',
                        color: '#1c232b',
                        cursor: formSubmitting ? 'not-allowed' : 'pointer',
                        opacity: formSubmitting ? 0.65 : 1
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!canSubmit || formSubmitting}
                      style={{
                        font: 'inherit',
                        fontSize: '15px',
                        fontWeight: 600,
                        minHeight: '44px',
                        padding: '8px 18px',
                        borderRadius: '4px',
                        border: 'none',
                        background: canSubmit && !formSubmitting ? '#1c232b' : '#8a939c',
                        color: '#ffffff',
                        cursor: canSubmit && !formSubmitting ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {formSubmitting ? 'Sending request...' : 'Request the brief'}
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h2 id="dcm-form-title" style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>
                    Request received
                  </h2>
                  <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.5 }}>
                    Thank you. Your DCM Brief request has been received. The AEO team will contact you using the email address provided.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      style={{
                        font: 'inherit',
                        fontSize: '15px',
                        fontWeight: 600,
                        minHeight: '44px',
                        padding: '8px 18px',
                        borderRadius: '4px',
                        border: 'none',
                        background: '#1c232b',
                        color: '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DcmPreview;
