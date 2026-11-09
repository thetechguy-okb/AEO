import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  APEA_DATA, 
  ApeaAudit, 
  PUBLIC_REPORTS, 
  REPORT_INFO, 
  APEA_REGIONS, 
  APEA_DATES, 
  APEA_ORDER 
} from '../data/apeaData';
import { useCMS } from '../context/CMSContext';

// Formatter helpers
const fmt = (n: number | string | null | undefined): string => {
  if (n === null || n === undefined || n === '') return '—';
  if (typeof n === 'number') return n.toLocaleString('en-GB');
  return String(n);
};

const pct = (n: number, d: number): string => {
  if (!d) return '—';
  return ((n / d) * 100).toFixed(1) + '%';
};

function assessmentMeta(a: ApeaAudit) {
  const label = a.publicIntegrityCategory || 'Not published';
  if (/significant integrity deficits/i.test(label)) return { badge: 'b-def', banner: 'def', label };
  if (/adequate integrity/i.test(label)) return { badge: 'b-adeq', banner: 'adeq', label };
  if (/high integrity/i.test(label)) return { badge: 'b-high', banner: 'high', label };
  return { badge: 'b-ind', banner: 'ind', label };
}

function isExcludedLabel(s: string | null | undefined): boolean {
  return /excluded|indeterminate|not assessable/i.test(String(s || ''));
}

function bucketClass(s: string | null | undefined): string {
  return isExcludedLabel(s) ? 'excl' : 'alt';
}

function uniq<T>(arr: (T | null | undefined)[]): T[] {
  const valid = arr.filter((v): v is T => v !== null && v !== undefined && String(v).trim() !== '' && String(v) !== '—');
  return Array.from(new Set(valid)).sort((a, b) => String(a).localeCompare(String(b)));
}

interface IssueRowObj {
  lga: string;
  ward: string;
  pu: string;
  code: string;
  bvas: number | string | null;
  ec8a: number | string | null;
  ec8b: number | string | null;
  cls: string;
  status: string | null;
  reason: string | null;
  index: number;
}

export default function ApeaPage() {
  const { apeaAudits: liveAudits, apeaPublicReports: liveReports, apeaReportInfo: liveInfo } = useCMS();
  const apeaAudits = useMemo(() => (liveAudits && liveAudits.length > 0 ? liveAudits : APEA_DATA), [liveAudits]);
  const apeaPublicReports = useMemo(() => ({ ...PUBLIC_REPORTS, ...liveReports }), [liveReports]);
  const apeaReportInfo = useMemo(() => ({ ...REPORT_INFO, ...liveInfo }), [liveInfo]);
  const [currentView, setCurrentView] = useState<'audit' | 'overview'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const auditParam = params.get('audit');
      if (auditParam && APEA_DATA.some(a => a.code.toLowerCase() === auditParam.toLowerCase())) {
        return 'audit';
      }
    }
    return 'overview';
  });
  const [selectedAuditCode, setSelectedAuditCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const auditParam = params.get('audit');
      if (auditParam && APEA_DATA.some(a => a.code.toLowerCase() === auditParam.toLowerCase())) {
        const found = APEA_DATA.find(a => a.code.toLowerCase() === auditParam.toLowerCase());
        if (found) return found.code;
      }
    }
    return 'AN';
  });
  const [cmpSelection, setCmpSelection] = useState<string[]>([]);
  const [puModalData, setPuModalData] = useState<any[] | null>(null);
  const [methodNotesOpen, setMethodNotesOpen] = useState(false);
  const [activeSecNav, setActiveSecNav] = useState<string>('#s-dash');

  // Evidence Register state
  const [regSearch, setRegSearch] = useState('');
  const [filterLga, setFilterLga] = useState('');
  const [filterWard, setFilterWard] = useState('');
  const [filterCls, setFilterCls] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortField, setSortField] = useState<keyof IssueRowObj | null>(null);
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [regPage, setRegPage] = useState(0);
  const PAGE_SIZE = 12;

  // Geographic accordion state: open LGAs and open Wards
  const [openLgas, setOpenLgas] = useState<Record<string, boolean>>({});
  const [openWards, setOpenWards] = useState<Record<string, boolean>>({});

  // Sync state with URL params on mount and on popstate
  useEffect(() => {
    const handleUrlSync = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const auditParam = params.get('audit');
        const viewParam = params.get('view');
        if (auditParam && apeaAudits.some(a => a.code.toLowerCase() === auditParam.toLowerCase())) {
          const found = apeaAudits.find(a => a.code.toLowerCase() === auditParam.toLowerCase())!;
          setSelectedAuditCode(found.code);
          setCurrentView('audit');
        } else if (viewParam === 'tracker' || viewParam === 'overview') {
          setCurrentView('overview');
        } else if (!auditParam) {
          setCurrentView('overview');
        }
      }
    };

    handleUrlSync();
    window.addEventListener('popstate', handleUrlSync);
    return () => window.removeEventListener('popstate', handleUrlSync);
  }, [apeaAudits]);

  const currentAudit = useMemo(() => {
    return apeaAudits.find(a => a.code === selectedAuditCode) || apeaAudits[0];
  }, [selectedAuditCode, apeaAudits]);

  const val = useCallback((audit: ApeaAudit, r: any[], headerName: string | null | undefined) => {
    if (!headerName) return null;
    const i = audit.pu.headers.indexOf(headerName);
    return i >= 0 ? r[i] : null;
  }, []);

  const puCode = useCallback((audit: ApeaAudit, r: any[]) => {
    return val(audit, r, 'PU code') || val(audit, r, 'Delim') || '—';
  }, [val]);

  const bucket = useCallback((audit: ApeaAudit, r: any[]) => {
    return String(val(audit, r, audit.meta.bucketCol) || '').trim();
  }, [val]);

  const isCompliant = useCallback((audit: ApeaAudit, r: any[]) => {
    return /^compliant$/i.test(bucket(audit, r));
  }, [bucket]);

  // Issue rows: only non-compliant and excluded/indeterminate (pre-decompressed in apeaData.ts)
  const issueRows = useMemo(() => {
    if (!currentAudit || !currentAudit.pu.rows) return [];
    return currentAudit.pu.rows
      .map((r, i) => ({ r, i }))
      .filter(o => !isCompliant(currentAudit, o.r));
  }, [currentAudit, isCompliant]);

  // Open specific audit
  const openAudit = (code: string, targetSection?: string) => {
    setSelectedAuditCode(code);
    setCurrentView('audit');
    if (typeof window !== 'undefined') {
      const newUrl = `/apea?audit=${code}`;
      if (window.location.pathname + window.location.search !== newUrl) {
        window.history.pushState({ audit: code }, '', newUrl);
      }
    }
    setRegSearch('');
    setFilterLga('');
    setFilterWard('');
    setFilterCls('');
    setFilterStatus('');
    setRegPage(0);
    setOpenLgas({});
    setOpenWards({});
    setMethodNotesOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });

    if (targetSection) {
      setTimeout(() => {
        const el = document.getElementById(targetSection.replace('#', ''));
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  };

  const handleBackToOverview = () => {
    setCurrentView('overview');
    if (typeof window !== 'undefined') {
      if (window.location.search) {
        window.history.pushState({}, '', '/apea');
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleDownloadPdf = async (uri: string, filename: string) => {
    try {
      const res = await fetch(uri);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      console.warn('Direct blob download failed, opening link:', err);
      const link = document.createElement('a');
      link.href = uri;
      link.download = filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Toggle comparison selection (max 3)
  const toggleCmp = (code: string) => {
    setCmpSelection(prev => {
      const idx = prev.indexOf(code);
      if (idx >= 0) {
        return prev.filter(c => c !== code);
      } else if (prev.length < 3) {
        return [...prev, code];
      }
      return prev;
    });
  };

  // Setup wall dot matrix for coverage visualization
  const wallDots = useMemo(() => {
    if (currentView !== 'audit' || !currentAudit) return [];
    const C = currentAudit.compliant;
    const N = currentAudit.noncompliant;
    const E = currentAudit.excluded;
    const T = C + N + E;
    const arr: ('c' | 'n' | 'e')[] = new Array(T);
    for (let i = 0; i < T; i++) {
      arr[i] = i < C ? 'c' : (i < C + N ? 'n' : 'e');
    }

    let s = 0x9e3779b9;
    const rnd = () => {
      s |= 0;
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    for (let i = T - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
    return arr;
  }, [currentView, currentAudit]);

  // Bind IntersectionObserver for sticky subnav
  useEffect(() => {
    if (currentView !== 'audit') return;

    const sections = ['s-dash', 's-geo', 's-ev', 's-acc', 's-mat', 's-inec', 's-res']
      .map(id => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSecNav('#' + entry.target.id);
          }
        });
      },
      { rootMargin: '-140px 0px -70% 0px' }
    );

    sections.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, [currentView, currentAudit]);

  // Evidence Register objects
  const issueObjects: IssueRowObj[] = useMemo(() => {
    if (!currentAudit) return [];
    return issueRows.map(o => ({
      lga: String(val(currentAudit, o.r, 'LGA') || '—'),
      ward: String(val(currentAudit, o.r, 'Ward') || '—'),
      pu: String(val(currentAudit, o.r, 'PU') || '—'),
      code: String(puCode(currentAudit, o.r)),
      bvas: val(currentAudit, o.r, 'BVAS'),
      ec8a: val(currentAudit, o.r, 'EC8A TVC'),
      ec8b: val(currentAudit, o.r, 'EC8B TVC'),
      cls: bucket(currentAudit, o.r),
      status: currentAudit.meta.forensicCol ? String(val(currentAudit, o.r, currentAudit.meta.forensicCol) || '') : null,
      reason: currentAudit.meta.reasonCol ? String(val(currentAudit, o.r, currentAudit.meta.reasonCol) || '') : null,
      index: o.i
    }));
  }, [currentAudit, issueRows, val, puCode, bucket]);

  // Available filter dropdown options
  const lgaOptions = useMemo(() => uniq(issueObjects.map(x => x.lga)), [issueObjects]);
  const wardOptions = useMemo(() => uniq(issueObjects.map(x => x.ward)), [issueObjects]);
  const clsOptions = useMemo(() => uniq(issueObjects.map(x => x.cls)), [issueObjects]);
  const statusOptions = useMemo(() => uniq(issueObjects.map(x => x.status)), [issueObjects]);

  // Filtered & sorted issue rows
  const filteredAndSortedRows = useMemo(() => {
    const q = regSearch.toLowerCase().trim();
    let rows = issueObjects.filter(x => {
      const hay = `${x.lga} ${x.ward} ${x.pu} ${x.code} ${x.cls} ${x.reason || ''} ${x.status || ''}`.toLowerCase();
      return (
        (!q || hay.includes(q)) &&
        (!filterLga || x.lga === filterLga) &&
        (!filterWard || x.ward === filterWard) &&
        (!filterCls || x.cls === filterCls) &&
        (!filterStatus || x.status === filterStatus)
      );
    });

    if (sortField) {
      rows = [...rows].sort((a, b) => {
        const valA = a[sortField] ?? '';
        const valB = b[sortField] ?? '';
        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * sortDir;
        }
        return String(valA).localeCompare(String(valB)) * sortDir;
      });
    }

    return rows;
  }, [issueObjects, regSearch, filterLga, filterWard, filterCls, filterStatus, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedRows.length / PAGE_SIZE));
  const pagedRows = useMemo(() => {
    const start = Math.min(regPage, totalPages - 1) * PAGE_SIZE;
    return filteredAndSortedRows.slice(start, start + PAGE_SIZE);
  }, [filteredAndSortedRows, regPage, totalPages]);

  const handleSort = (field: keyof IssueRowObj) => {
    if (sortField === field) {
      setSortDir(prev => (prev === 1 ? -1 : 1));
    } else {
      setSortField(field);
      setSortDir(1);
    }
  };

  // Open PU detail modal (strictly for non-compliant and excluded PUs only)
  const openPuDetail = (rowIndex: number) => {
    if (!currentAudit || !currentAudit.pu.rows) return;
    const r = currentAudit.pu.rows[rowIndex];
    if (!r || isCompliant(currentAudit, r)) return;
    setPuModalData(r);
  };

  // Geographic hierarchy data structure
  const geoHierarchy = useMemo(() => {
    if (!currentAudit) return {};
    const byLga: Record<string, { total: number; nc: number; ex: number; wards: Record<string, { total: number; nc: number; ex: number; pus: { r: any[]; i: number }[] }> }> = {};

    for (const o of issueRows) {
      const l = String(val(currentAudit, o.r, 'LGA') || 'Unknown');
      const w = String(val(currentAudit, o.r, 'Ward') || 'Unknown');

      byLga[l] = byLga[l] || { total: 0, nc: 0, ex: 0, wards: {} };
      byLga[l].total++;
      if (isExcludedLabel(bucket(currentAudit, o.r))) {
        byLga[l].ex++;
      } else {
        byLga[l].nc++;
      }

      byLga[l].wards[w] = byLga[l].wards[w] || { total: 0, nc: 0, ex: 0, pus: [] };
      const wardData = byLga[l].wards[w];
      wardData.total++;
      if (isExcludedLabel(bucket(currentAudit, o.r))) {
        wardData.ex++;
      } else {
        wardData.nc++;
      }
      wardData.pus.push(o);
    }
    return byLga;
  }, [currentAudit, issueRows, val, bucket]);

  const maxLgaIssues = useMemo(() => {
    const totals = Object.values(geoHierarchy).map(x => x.total);
    return Math.max(1, ...totals);
  }, [geoHierarchy]);

  // Featured case open
  const openFeaturedCase = (code: string) => {
    if (!currentAudit || !currentAudit.pu.rows) return;
    const idx = currentAudit.pu.rows.findIndex(r => String(puCode(currentAudit, r)) === String(code));
    if (idx >= 0) {
      openPuDetail(idx);
    }
  };

  // Accountability rows
  const accountabilityData = useMemo(() => {
    if (!currentAudit || !currentAudit.pu.rows) return { headers: [], rows: [] };
    const hs = currentAudit.pu.headers;
    const off = hs.filter(h => /presiding officer|collation officer/i.test(h));
    if (!off.length) return { headers: [], rows: [] };

    const showHeaders = ['LGA', 'Ward', 'PU', 'Delim', 'PU code', currentAudit.meta.reasonCol, ...off]
      .filter((h, i, arr) => h && arr.indexOf(h) === i && hs.includes(h)) as string[];

    const ncRows = issueRows.filter(o => !isExcludedLabel(bucket(currentAudit, o.r)));
    const rows = ncRows.slice(0, 100).map(o => showHeaders.map(h => val(currentAudit, o.r, h)));

    return { headers: showHeaders, rows };
  }, [currentAudit, issueRows, val, bucket]);

  return (
    <div className="apea-root">
      {/* OVERVIEW / TRACKER VIEW */}
      {currentView === 'overview' && (
        <main id="overview">
          {/* APEA Hero Section */}
          <section className="hero">
            <div className="wrap">
              <div className="kick">The Athena Post-Election Audit</div>
              <h1>A permanent public record of how Nigeria&apos;s elections perform.</h1>
              <p className="lede">
                APEA reconstructs the evidence chain from accreditation through the polling-unit result, collation and final declaration — then tests whether the process worked, where it failed, how serious the failures were, whether they could approach the declared outcome, and whether integrity is improving over time.
              </p>
              <ul className="props">
                <li>Every audited election, one standard assessment</li>
                <li>Every non-compliant polling unit, published</li>
                <li>Process integrity and outcome materiality, reported separately</li>
                <li>Comparable across states and cycles</li>
              </ul>
            </div>
          </section>

          {/* Quick Entry Navigation */}
          <section className="sec" style={{ padding: '40px 0 0' }}>
            <div className="wrap">
              <div className="apea-apaf">
                <b>APEA</b> is the public audit product. <b>APAF</b> is the methodology and scoring framework behind it.
              </div>
              <nav className="entry">
                <a 
                  onClick={() => {
                    const el = document.getElementById('tracker');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <b>Audit Tracker</b>
                  <span>All audited elections</span>
                </a>
                <a onClick={() => openAudit('AN')}>
                  <b>Latest Audit</b>
                  <span>Anambra 2025</span>
                </a>
                <a 
                  onClick={() => {
                    const el = document.getElementById('tracker');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <b>Methodology / APAF</b>
                  <span>Assessment framework</span>
                </a>
                <a onClick={() => openAudit('AN', 's-ev')}>
                  <b>Evidence Register</b>
                  <span>Issue-level PU records</span>
                </a>
                <a onClick={() => openAudit('AN', 's-inec')}>
                  <b>INEC Right of Reply</b>
                  <span>Finding → response</span>
                </a>
              </nav>
            </div>
          </section>

          {/* Audit Tracker & Comparison Mode */}
          <section className="sec">
            <div className="wrap">
              <div className="sec-head">
                <div className="kick">Election Integrity Tracker</div>
                <h2>Are Nigeria&apos;s elections getting better or worse?</h2>
                <p>
                  Each audited election carries the same indicators, so performance reads across time, states and cycles rather than through anecdote. Select an election to open its full audit.
                </p>
              </div>

              {/* Five Election Cards */}
              <div className="cards" id="tracker">
                {APEA_ORDER.map(code => {
                  const audit = APEA_DATA.find(a => a.code === code)!;
                  const am = assessmentMeta(audit);
                  const compliantPct = (audit.compliant / audit.total * 100).toFixed(1);
                  const noncompliantPct = (audit.noncompliant / audit.total * 100).toFixed(1);
                  const excludedPct = (audit.excluded / audit.total * 100).toFixed(1);

                  return (
                    <article 
                      key={code} 
                      className="ecard" 
                      onClick={() => openAudit(code)}
                    >
                      <div>
                        <div className="pillrow">
                          <span className="pill slate">{APEA_REGIONS[code]}</span>
                          <span className="pill green">{audit.methodology}</span>
                        </div>
                        <h3>{audit.title}</h3>
                        <span className={`badge ${am.badge}`}>{am.label}</span>
                      </div>

                      <div>
                        <div className="compbar">
                          <i className="c" style={{ width: `${compliantPct}%` }}></i>
                          <i className="n" style={{ width: `${noncompliantPct}%` }}></i>
                          <i className="e" style={{ width: `${excludedPct}%` }}></i>
                        </div>
                        <div className="stats">
                          <div>
                            <div className="v">{fmt(audit.total)}</div>
                            <div className="k">PUs audited</div>
                          </div>
                          <div>
                            <div className="v">{pct(audit.compliant, audit.assessable)}</div>
                            <div className="k">Compliant / assessable</div>
                          </div>
                          <div>
                            <div className="v">{fmt(audit.noncompliant)}</div>
                            <div className="k">Non-compliant</div>
                          </div>
                          <div>
                            <div className="v">
                              {audit.materiality?.ratioPct != null ? `${audit.materiality.ratioPct}%` : 'Not published'}
                            </div>
                            <div className="k">Materiality / margin</div>
                          </div>
                        </div>
                      </div>

                      <div className="go">Open audit →</div>
                    </article>
                  );
                })}
              </div>

              {/* Comparison Mode */}
              <div className="compare-wrap">
                <div className="compare-head">Comparison mode — select 2–3 elections</div>
                <div className="compare-chips">
                  {APEA_ORDER.map(code => {
                    const audit = APEA_DATA.find(a => a.code === code)!;
                    const isSelected = cmpSelection.includes(code);
                    return (
                      <button 
                        key={code} 
                        className={`chip ${isSelected ? 'on' : ''}`}
                        onClick={() => toggleCmp(code)}
                      >
                        {audit.title}
                      </button>
                    );
                  })}
                </div>

                {/* Comparison Table */}
                {cmpSelection.length === 1 && (
                  <p className="cmp-hint">Select one more election to compare.</p>
                )}
                {cmpSelection.length >= 2 && (
                  <div className="cmp-table">
                    <div className="scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Indicator</th>
                            {cmpSelection.map(code => {
                              const a = APEA_DATA.find(x => x.code === code)!;
                              return <th key={code}>{a.title}</th>;
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="cmp-l">PUs audited</td>
                            {cmpSelection.map(code => <td key={code}>{fmt(APEA_DATA.find(x => x.code === code)!.total)}</td>)}
                          </tr>
                          <tr>
                            <td className="cmp-l">Assessable</td>
                            {cmpSelection.map(code => <td key={code}>{fmt(APEA_DATA.find(x => x.code === code)!.assessable)}</td>)}
                          </tr>
                          <tr>
                            <td className="cmp-l">Compliant</td>
                            {cmpSelection.map(code => {
                              const a = APEA_DATA.find(x => x.code === code)!;
                              return <td key={code}>{fmt(a.compliant)} · {pct(a.compliant, a.assessable)}</td>;
                            })}
                          </tr>
                          <tr>
                            <td className="cmp-l">Non-compliant</td>
                            {cmpSelection.map(code => {
                              const a = APEA_DATA.find(x => x.code === code)!;
                              return <td key={code}>{fmt(a.noncompliant)} · {pct(a.noncompliant, a.assessable)}</td>;
                            })}
                          </tr>
                          <tr>
                            <td className="cmp-l">Excluded</td>
                            {cmpSelection.map(code => {
                              const a = APEA_DATA.find(x => x.code === code)!;
                              return <td key={code}>{fmt(a.excluded)} · {pct(a.excluded, a.total)}</td>;
                            })}
                          </tr>
                          <tr>
                            <td className="cmp-l">Integrity assessment</td>
                            {cmpSelection.map(code => <td key={code}>{APEA_DATA.find(x => x.code === code)!.publicIntegrityCategory}</td>)}
                          </tr>
                          <tr>
                            <td className="cmp-l">Methodology</td>
                            {cmpSelection.map(code => <td key={code}>{APEA_DATA.find(x => x.code === code)!.methodology}</td>)}
                          </tr>
                          <tr>
                            <td className="cmp-l">Outcome materiality</td>
                            {cmpSelection.map(code => {
                              const a = APEA_DATA.find(x => x.code === code)!;
                              return (
                                <td key={code}>
                                  {a.materiality?.ratioPct != null
                                    ? `${fmt(a.materiality.overVotingMagnitude)} · ${a.materiality.ratioPct}% of margin`
                                    : 'Not published'}
                                </td>
                              );
                            })}
                          </tr>
                          <tr>
                            <td className="cmp-l">Spread reading</td>
                            {cmpSelection.map(code => <td key={code}>{APEA_DATA.find(x => x.code === code)!.spreadVerdict || 'Not published'}</td>)}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="cmp-note">
                      Figures are drawn from the published audit records. Methodology differences across audit periods remain clearly labelled.
                    </p>
                  </div>
                )}
              </div>

              <p className="cards-note">
                The tracker presents APEA audits for Anambra 2025, Ondo 2024, Bayelsa 2023, Kogi 2023 and Imo 2023. Methodology differences across audit periods are identified where relevant. Compliant polling units are reported at aggregate level, while issue-bearing and excluded records are available for detailed review.
              </p>
            </div>
          </section>

          {/* Three Dimensions Framework */}
          <section className="sec alt">
            <div className="wrap">
              <div className="sec-head">
                <div className="kick">How APEA reads an election</div>
                <h2>One structure, applied every time</h2>
                <p>
                  Three integrity dimensions feed the overall assessment. Outcome materiality is reported separately, so a large winning margin never conceals a poorly run process.
                </p>
              </div>
              <div className="axes">
                <div className="axis">
                  <div className="rn">01</div>
                  <h3>Technology &amp; Evidence</h3>
                  <p>BVAS accreditation baseline, IReV transmission, and the availability and legibility of the statutory records.</p>
                </div>
                <div className="axis">
                  <div className="rn">02</div>
                  <h3>Polling-Unit Compliance</h3>
                  <p>Statutory over-voting under s.51(2), arithmetic integrity within the material band, ballot accounting and excluded records.</p>
                </div>
                <div className="axis">
                  <div className="rn">03</div>
                  <h3>Collation Integrity</h3>
                  <p>EC8A→EC8B alterations, transfer of over-voting, unexplained inflation, and EC8B→EC8C→EC8D reconciliation.</p>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* AUDIT VIEW (7 SECTIONS) */}
      {currentView === 'audit' && currentAudit && (
        <main id="audit">
          {/* Audit Header Card */}
          <section className="ehead">
            <div className="wrap">
              <div className="ecardtop">
                <div className="back" onClick={handleBackToOverview}>
                  ← Back to APEA audits
                </div>
                <div className="pillrow">
                  <span className="pill blue">{APEA_REGIONS[currentAudit.code]}</span>
                  <span className={`pill ${/Full APAF|APAF Version 4/i.test(currentAudit.methodology) ? 'green' : 'blue'}`}>
                    {currentAudit.methodology}
                  </span>
                </div>
                <h1>
                  {currentAudit.state} Governorship Election <small>({APEA_DATES[currentAudit.code]})</small>
                </h1>
                <div className="updline">
                  APEA public audit record · {fmt(currentAudit.total)} polling units
                </div>
                <p className="desc">
                  This page presents the published APEA findings and polling-unit classifications for <b>{currentAudit.title}</b>.
                </p>

                {/* Verdict Banner */}
                <div className={`verdict-banner ${assessmentMeta(currentAudit).banner}`}>
                  <div className="vicon">◉</div>
                  <div>
                    <div className="vl">Election Integrity Assessment</div>
                    <div className="vc">{assessmentMeta(currentAudit).label}</div>
                  </div>
                  <div className="vr">
                    {currentAudit.publicIntegrityNote || 'Outcome materiality is reported separately from process integrity.'}
                  </div>
                </div>

                {/* Top Tiles */}
                <div className="tiles">
                  <div className="tile">
                    <div className="tk">
                      <span className="d" style={{ background: 'var(--blue)' }}></span>
                      PUs audited
                    </div>
                    <div className="tv">{fmt(currentAudit.total)}</div>
                    <div className="tp">audit total</div>
                  </div>
                  <div className="tile">
                    <div className="tk">
                      <span className="d" style={{ background: 'var(--blue)' }}></span>
                      Assessable
                    </div>
                    <div className="tv">{fmt(currentAudit.assessable)}</div>
                    <div className="tp">{pct(currentAudit.assessable, currentAudit.total)} of all</div>
                  </div>
                  <div className="tile">
                    <div className="tk">
                      <span className="d" style={{ background: 'var(--green-bright)' }}></span>
                      Compliant
                    </div>
                    <div className="tv">{fmt(currentAudit.compliant)}</div>
                    <div className="tp">{pct(currentAudit.compliant, currentAudit.assessable)} assessable</div>
                  </div>
                  <div className="tile">
                    <div className="tk">
                      <span className="d" style={{ background: 'var(--amber-bright)' }}></span>
                      Non-compliant
                    </div>
                    <div className="tv">{fmt(currentAudit.noncompliant)}</div>
                    <div className="tp">{pct(currentAudit.noncompliant, currentAudit.assessable)} assessable</div>
                  </div>
                  <div className="tile mut">
                    <div className="tk">
                      <span className="d" style={{ background: 'var(--excl)' }}></span>
                      Excluded
                    </div>
                    <div className="tv">{fmt(currentAudit.excluded)}</div>
                    <div className="tp">{pct(currentAudit.excluded, currentAudit.total)} of all</div>
                  </div>
                </div>

                {/* Coverage Statement */}
                <div className="cov">
                  <div className="cov-h">Evidence coverage statement</div>
                  <div className="cov-grid">
                    {(REPORT_INFO[currentAudit.code]?.coverageSummary || []).map((x, idx) => (
                      <div key={idx}>
                        <span>{x[0]}</span>
                        <b>{x[1]}</b>
                      </div>
                    ))}
                    <div>
                      <span>Assessable</span>
                      <b>{fmt(currentAudit.assessable)}</b>
                    </div>
                    <div>
                      <span>Excluded</span>
                      <b>{fmt(currentAudit.excluded)}</b>
                    </div>
                    <div>
                      <span>Issue PUs</span>
                      <b>{fmt(currentAudit.noncompliant + currentAudit.excluded)}</b>
                    </div>
                    <div>
                      <span>Methodology</span>
                      <b>{currentAudit.methodology}</b>
                    </div>
                  </div>
                  <div className="cov-note">
                    Published audit coverage is summarised here. Compliant PUs remain aggregate-only; detailed drill-down is limited to Non-Compliant and Excluded / Not-Assessable polling units.
                  </div>
                </div>
              </div>

              {/* Polling-Unit Coverage Matrix (Wall of Dots) */}
              <div className="wall-wrap">
                <div className="wall-head">
                  <h2>Polling-Unit Coverage Matrix</h2>
                  <span className="cap">{fmt(currentAudit.total)} polling units audited</span>
                </div>
                <div className="wall" id="wall" aria-hidden="true">
                  {wallDots.map((type, idx) => (
                    <span 
                      key={idx} 
                      className={type === 'c' ? '' : type}
                    />
                  ))}
                </div>
                <div className="legend">
                  <span>
                    <i style={{ background: 'var(--green-bright)' }}></i>
                    Compliant — {fmt(currentAudit.compliant)}
                  </span>
                  <span>
                    <i style={{ background: 'var(--amber-bright)' }}></i>
                    Non-compliant — {fmt(currentAudit.noncompliant)}
                  </span>
                  <span>
                    <i style={{ background: 'var(--excl)' }}></i>
                    Excluded — {fmt(currentAudit.excluded)}
                  </span>
                </div>
                <p className="wall-note">
                  Each cell represents one polling unit; arrangement is proportional, not geographic. Compliant PUs are summary-only and cannot be opened or drilled into.
                </p>
              </div>

              {/* Key Findings & Legal Scope */}
              <div className="findings">
                <div className="fbox">
                  <h3>Key audit findings</h3>
                  <ul>
                    {(REPORT_INFO[currentAudit.code]?.findings || [
                      `${fmt(currentAudit.compliant)} of ${fmt(currentAudit.assessable)} assessable polling units are classified compliant (${pct(currentAudit.compliant, currentAudit.assessable)}).`,
                      `${fmt(currentAudit.noncompliant)} polling units are classified non-compliant; ${fmt(currentAudit.excluded)} are excluded / indeterminate.`
                    ]).map((f, idx) => (
                      <li key={idx}>{f}</li>
                    ))}
                  </ul>
                </div>
                <div className="fbox disc">
                  <div className="dl">Scope &amp; legal status</div>
                  <p>
                    AEO findings are analytical and evidential. This public record reproduces the audit record data and does not determine the legal validity of an election, return or certificate of return.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Sticky Internal Sub-Navigation */}
          <nav className="secnav" id="secnav">
            <div className="wrap">
              {[
                { id: '#s-dash', label: 'Dashboard' },
                { id: '#s-geo', label: 'Geographic' },
                { id: '#s-ev', label: 'Evidence Register' },
                { id: '#s-acc', label: 'Accountability' },
                { id: '#s-mat', label: 'Outcome Materiality' },
                { id: '#s-inec', label: 'INEC Response' },
                { id: '#s-res', label: 'Report & Method' }
              ].map(sec => (
                <a
                  key={sec.id}
                  className={activeSecNav === sec.id ? 'active' : ''}
                  onClick={() => {
                    setActiveSecNav(sec.id);
                    const el = document.getElementById(sec.id.replace('#', ''));
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  {sec.label}
                </a>
              ))}
            </div>
          </nav>

          {/* Seven Internal Sections */}
          <div className="wrap">
            {/* 01 · Dashboard */}
            <section className="block" id="s-dash">
              <div className="blabel">
                <div className="kick">01 · Integrity dashboard</div>
                <h2>Election Integrity Dashboard</h2>
              </div>
              <p className="intro">
                The dashboard presents the published integrity assessment together with the underlying audit indicators. Outcome materiality remains separate from the process-integrity assessment.
              </p>

              <div className="dims">
                {/* Dimension 1: Technology & Evidence */}
                <div className="dim">
                  <h3>Technology &amp; Evidence Integrity</h3>
                  {(REPORT_INFO[currentAudit.code]?.dashboard?.tech || [
                    ['BVAS records', `${fmt(currentAudit.total)} / ${fmt(currentAudit.total)}`, 'ok', 'available'],
                    ['EC8A uploads', `${fmt(currentAudit.total)}`, 'ok', 'reported']
                  ]).map((ind, i) => (
                    <div key={i} className="ind">
                      <span>{ind[0]}</span>
                      <span className="iv">
                        {ind[1]} <span className={`ip ${ind[2]}`}>{ind[3]}</span>
                      </span>
                    </div>
                  ))}
                </div>

                {/* Dimension 2: Polling-Unit Compliance */}
                <div className="dim">
                  <h3>Polling-Unit Compliance</h3>
                  {(REPORT_INFO[currentAudit.code]?.dashboard?.puc || [
                    ['Compliant of assessable', pct(currentAudit.compliant, currentAudit.assessable), 'ok', 'reported'],
                    ['Non-compliant PUs', fmt(currentAudit.noncompliant), 'watch', 'finding'],
                    ['Excluded / indeterminate', fmt(currentAudit.excluded), 'watch', 'excluded']
                  ]).map((ind, i) => (
                    <div key={i} className="ind">
                      <span>{ind[0]}</span>
                      <span className="iv">
                        {ind[1]} <span className={`ip ${ind[2]}`}>{ind[3]}</span>
                      </span>
                    </div>
                  ))}
                </div>

                {/* Dimension 3: Collation Integrity */}
                <div className="dim">
                  <h3>Collation Integrity</h3>
                  {(REPORT_INFO[currentAudit.code]?.dashboard?.coll || [
                    ['Collation records', fmt(currentAudit.collationCount || 0), 'ok', 'available'],
                    ['Spread reading', currentAudit.spreadVerdict ? 'Available' : 'Not published', currentAudit.spreadVerdict ? 'ok' : 'watch', 'status']
                  ]).map((ind, i) => (
                    <div key={i} className="ind">
                      <span>{ind[0]}</span>
                      <span className="iv">
                        {ind[1]} <span className={`ip ${ind[2]}`}>{ind[3]}</span>
                      </span>
                    </div>
                  ))}
                </div>

                {/* Outcome Materiality Card */}
                {currentAudit.materiality?.ratioPct != null ? (
                  <div className="mat-card">
                    <span className="mt">Reported separately</span>
                    <p>
                      <b>Outcome Materiality —</b> {(REPORT_INFO[currentAudit.code]?.materialityLabel || 'Identified discrepancy magnitude').toLowerCase()} is <b>{fmt(currentAudit.materiality.overVotingMagnitude)}</b> against a declared margin of <b>{fmt(currentAudit.materiality.declaredMargin)}</b> ({currentAudit.materiality.ratioPct}% of margin). Full arithmetic below.
                    </p>
                  </div>
                ) : (
                  <div className="mat-card">
                    <span className="mt">Reported separately</span>
                    <p>
                      <b>Outcome Materiality —</b> the complete inputs required for a declared-margin materiality assessment are not available. No value is assigned.
                    </p>
                  </div>
                )}
              </div>

              {/* Failure Drivers (Triggers) */}
              {REPORT_INFO[currentAudit.code]?.triggers && (
                <div className="report-trigger">
                  <h3>What drove non-compliance?</h3>
                  <div className="subtxt">Principal failure types reported in the public audit.</div>
                  <div className="trigger-grid">
                    {REPORT_INFO[currentAudit.code]?.triggers?.map((tr, i) => (
                      <div key={i} className="trigger-item">
                        <b>{fmt(tr[1])}</b>
                        <span>{tr[0]}</span>
                      </div>
                    ))}
                  </div>
                  {REPORT_INFO[currentAudit.code]?.triggerNote && (
                    <p className="geonote">{REPORT_INFO[currentAudit.code]?.triggerNote}</p>
                  )}
                </div>
              )}

              {/* Assessment Categories Thresholds */}
              <div className="thresh">
                <span className="kick">Polling-unit assessment categories</span>
                <div className="trow">
                  <span className="badge b-high">Compliant</span>
                  <span className="def">Compliant polling units are reported in aggregate and are not opened individually.</span>
                </div>
                <div className="trow">
                  <span className="badge b-def">Non-Compliant</span>
                  <span className="def">Issue-bearing polling units available for LGA → Ward → PU drill-down and detailed evidence review.</span>
                </div>
                <div className="trow">
                  <span className="badge b-ind">Excluded</span>
                  <span className="def">Excluded / indeterminate or not-assessable records remain visible as evidence gaps and can be inspected.</span>
                </div>
              </div>
            </section>

            {/* 02 · Geographic Drill-down (Matching image_8ad9ae18.png) */}
            <section className="block" id="s-geo">
              <div className="blabel">
                <div className="kick">02 · Geographic</div>
                <h2>Geographic drill-down</h2>
              </div>
              <p className="intro">
                <b>Only Non-Compliant and Excluded polling units are available for drill-down.</b> Compliant PUs are intentionally omitted. Expand an LGA, then a ward, then select an issue polling unit to review its audit record.
              </p>

              {/* Geographic Insight Cards */}
              {REPORT_INFO[currentAudit.code]?.geo && (
                <div className="geo-insight">
                  <div>
                    <span>HIGHEST CONCENTRATION</span>
                    <b>{REPORT_INFO[currentAudit.code]?.geo?.primary}</b>
                    <p>{REPORT_INFO[currentAudit.code]?.geo?.note}</p>
                  </div>
                  <div>
                    <span>PUBLISHED GEOGRAPHIC READING</span>
                    <b>{REPORT_INFO[currentAudit.code]?.geo?.secondary}</b>
                  </div>
                </div>
              )}

              {/* Geographic Collapsible Table */}
              <div className="geo">
                <div className="scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>LGA · WARD · ISSUE POLLING UNIT</th>
                        <th style={{ textAlign: 'right' }}>NON-COMPLIANT</th>
                        <th style={{ textAlign: 'right' }}>EXCLUDED</th>
                        <th>ISSUE CONCENTRATION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(geoHierarchy)
                        .sort((a, b) => b[1].total - a[1].total)
                        .map(([lgaName, lgaData], lgaIdx) => {
                          const isLgaOpen = !!openLgas[lgaName];
                          const lgaPercent = Math.min(100, Math.round((lgaData.total / maxLgaIssues) * 100));
                          const isHot = lgaIdx < 3;

                          return (
                            <React.Fragment key={lgaName}>
                              {/* LGA Row */}
                              <tr
                                className={`r-lga ${isHot ? 'hot' : ''} ${isLgaOpen ? 'open' : ''}`}
                                onClick={() => {
                                  setOpenLgas(prev => ({ ...prev, [lgaName]: !prev[lgaName] }));
                                }}
                                style={{ cursor: 'pointer' }}
                              >
                                <td className="area">
                                  <span className="tw">▸</span>
                                  {lgaName}
                                </td>
                                <td className="n">{fmt(lgaData.nc)}</td>
                                <td className="share">{fmt(lgaData.ex)} excl.</td>
                                <td>
                                  <span className="mb">
                                    <span className="t">
                                      <span 
                                        className="f" 
                                        style={{ width: `${lgaPercent}%` }}
                                      ></span>
                                    </span>
                                  </span>
                                </td>
                              </tr>

                              {/* Ward Rows (shown if LGA is open) */}
                              {isLgaOpen && Object.entries(lgaData.wards)
                                .sort((a, b) => b[1].total - a[1].total)
                                .map(([wardName, wardData]) => {
                                  const wardKey = `${lgaName}__${wardName}`;
                                  const isWardOpen = !!openWards[wardKey];

                                  return (
                                    <React.Fragment key={wardKey}>
                                      <tr
                                        className={`r-ward ${isWardOpen ? 'open' : ''}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenWards(prev => ({ ...prev, [wardKey]: !prev[wardKey] }));
                                        }}
                                        style={{ cursor: 'pointer' }}
                                      >
                                        <td className="area" style={{ paddingLeft: '34px' }}>
                                          <span className="tw">▸</span>
                                          {wardName}
                                        </td>
                                        <td className="n">{fmt(wardData.nc)}</td>
                                        <td className="share">{fmt(wardData.ex)} excl.</td>
                                        <td></td>
                                      </tr>

                                      {/* Polling Unit Rows (shown if Ward is open) */}
                                      {isWardOpen && wardData.pus.map((item) => {
                                        const code = puCode(currentAudit, item.r);
                                        const puName = val(currentAudit, item.r, 'PU') || code;
                                        const puBucket = bucket(currentAudit, item.r);

                                        return (
                                          <tr
                                            key={item.i}
                                            className="r-pu"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openPuDetail(item.i);
                                            }}
                                            style={{ cursor: 'pointer' }}
                                          >
                                            <td className="area" style={{ paddingLeft: '58px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                                              {puName} · {code} <span style={{ color: 'var(--blue)' }}>›</span>
                                            </td>
                                            <td className="n"></td>
                                            <td className="share"></td>
                                            <td>
                                              <span className={`tc ${bucketClass(puBucket)}`}>{puBucket}</span>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </React.Fragment>
                                  );
                                })}
                            </React.Fragment>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="geonote">
                Counts are drawn from the polling-unit audit register and grouped by LGA and Ward. The view shows geographic concentration rather than GIS boundaries.
              </p>
            </section>

            {/* 03 · Evidence Register (Matching image_d59fd33f.png) */}
            <section className="block" id="s-ev">
              <div className="blabel">
                <div className="kick">03 · Evidence</div>
                <h2>Evidence Register</h2>
              </div>
              <p className="intro">
                The register contains only <b>Non-Compliant and Excluded / Not-Assessable</b> polling units. Search, filter, sort and select any row to review its full audit record.
              </p>

              {/* Featured Case */}
              {REPORT_INFO[currentAudit.code]?.featuredCase && (
                <div className="case-card">
                  <div>
                    <div className="case-k">FEATURED FORENSIC CASE</div>
                    <h3>{REPORT_INFO[currentAudit.code]?.featuredCase?.title}</h3>
                    <p>{REPORT_INFO[currentAudit.code]?.featuredCase?.note}</p>
                    <div className="case-chain">
                      <span>BVAS {fmt(REPORT_INFO[currentAudit.code]?.featuredCase?.bvas)}</span>
                      <span>EC8A {fmt(REPORT_INFO[currentAudit.code]?.featuredCase?.ec8a)}</span>
                      <span>EC8B {fmt(REPORT_INFO[currentAudit.code]?.featuredCase?.ec8b)}</span>
                      <span>{REPORT_INFO[currentAudit.code]?.featuredCase?.delta}</span>
                    </div>
                  </div>
                  <button 
                    className="btn solid" 
                    onClick={() => openFeaturedCase(REPORT_INFO[currentAudit.code]!.featuredCase!.code)}
                  >
                    OPEN PU DETAIL
                  </button>
                </div>
              )}

              {/* Filter Controls */}
              <div className="reg-ctl">
                <input
                  type="text"
                  placeholder="Search LGA, ward, PU, code or finding…"
                  value={regSearch}
                  onChange={(e) => {
                    setRegSearch(e.target.value);
                    setRegPage(0);
                  }}
                />
                <select
                  value={filterLga}
                  onChange={(e) => {
                    setFilterLga(e.target.value);
                    setRegPage(0);
                  }}
                >
                  <option value="">All LGAs</option>
                  {lgaOptions.map(lga => (
                    <option key={lga} value={lga}>{lga}</option>
                  ))}
                </select>

                <select
                  value={filterWard}
                  onChange={(e) => {
                    setFilterWard(e.target.value);
                    setRegPage(0);
                  }}
                >
                  <option value="">All wards</option>
                  {wardOptions.map(ward => (
                    <option key={ward} value={ward}>{ward}</option>
                  ))}
                </select>

                <select
                  value={filterCls}
                  onChange={(e) => {
                    setFilterCls(e.target.value);
                    setRegPage(0);
                  }}
                >
                  <option value="">All classifications</option>
                  {clsOptions.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setRegPage(0);
                  }}
                >
                  <option value="">All forensic statuses</option>
                  {statusOptions.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* Data Table with exactly 8 columns as in image_d59fd33f.png */}
              <div className="data-table">
                <div className="scroll">
                  <table>
                    <thead>
                      <tr>
                        <th className="sort" onClick={() => handleSort('lga')}>LGA</th>
                        <th className="sort" onClick={() => handleSort('ward')}>WARD</th>
                        <th className="sort" onClick={() => handleSort('pu')}>POLLING UNIT</th>
                        <th className="sort n" onClick={() => handleSort('bvas')}>BVAS</th>
                        <th className="sort n" onClick={() => handleSort('ec8a')}>EC8A TVC</th>
                        <th className="sort n" onClick={() => handleSort('ec8b')}>EC8B TVC</th>
                        <th className="sort" onClick={() => handleSort('cls')}>CLASSIFICATION</th>
                        <th>FINDING / REASON</th>
                        <th className="sort" onClick={() => handleSort('status')}>FORENSIC STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedRows.length > 0 ? (
                        pagedRows.map(row => (
                          <tr
                            key={row.index}
                            className="clk"
                            onClick={() => openPuDetail(row.index)}
                          >
                            <td>{row.lga}</td>
                            <td>{row.ward}</td>
                            <td className="code">
                              {row.pu} · {row.code} <span style={{ color: 'var(--blue)' }}>›</span>
                            </td>
                            <td className="n font-mono">{fmt(row.bvas)}</td>
                            <td className="n font-mono">{fmt(row.ec8a)}</td>
                            <td className="n font-mono">{fmt(row.ec8b)}</td>
                            <td>
                              <span className={`tc ${bucketClass(row.cls)}`}>{row.cls}</span>
                            </td>
                            <td>{row.reason || '—'}</td>
                            <td>{row.status || '—'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} style={{ textAlign: 'center', color: 'var(--ink-faint)', padding: '22px' }}>
                            No issue PUs match the current filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              <div className="pager">
                <span>
                  {filteredAndSortedRows.length.toLocaleString('en-GB')} issue polling unit{filteredAndSortedRows.length === 1 ? '' : 's'}
                </span>
                <span>
                  {totalPages > 1 && (
                    <>
                      <button 
                        disabled={regPage === 0} 
                        onClick={() => setRegPage(prev => Math.max(0, prev - 1))}
                      >
                        ‹
                      </button>
                      {' '}Page {regPage + 1} / {totalPages}{' '}
                      <button 
                        disabled={regPage >= totalPages - 1} 
                        onClick={() => setRegPage(prev => Math.min(totalPages - 1, prev + 1))}
                      >
                        ›
                      </button>
                    </>
                  )}
                </span>
              </div>
            </section>

            {/* 04 · Accountability Register */}
            <section className="block" id="s-acc">
              <div className="blabel">
                <div className="kick">04 · Accountability</div>
                <h2>Accountability Register</h2>
              </div>
              <p className="intro">
                Where the audit record identifies a Presiding Officer or Collation Officer in connection with a non-compliant finding, the available record is shown here. The presence of a name does not establish responsibility or intent.
              </p>

              {accountabilityData.rows.length === 0 ? (
                <div className="illus info">
                  <span>ⓘ</span>
                  <div>
                    <b>No public accountability record is available.</b> Non-compliant findings remain available in the Evidence Register.
                  </div>
                </div>
              ) : (
                <>
                  <div className="illus info">
                    <span>ⓘ</span>
                    <div>
                      <b>Publication rule.</b> Names are displayed only where they appear in the available audit record. Their inclusion does not establish responsibility or intent.
                    </div>
                  </div>
                  <div className="data-table">
                    <div className="scroll">
                      <table>
                        <thead>
                          <tr>
                            {accountabilityData.headers.map(h => (
                              <th key={h}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {accountabilityData.rows.map((row, rIdx) => (
                            <tr key={rIdx}>
                              {row.map((val, cIdx) => (
                                <td key={cIdx}>{fmt(val)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <p className="statuses">
                    Showing up to 100 non-compliant records where officer information is available.
                  </p>
                </>
              )}
            </section>

            {/* 05 · Outcome Materiality */}
            <section className="block" id="s-mat">
              <div className="blabel">
                <div className="kick">05 · Materiality</div>
                <h2>Outcome Materiality</h2>
              </div>
              <p className="intro">
                Materiality is kept separate from process integrity. The published report&apos;s discrepancy-to-margin test is shown alongside any compliant-PU stress test and constitutional-spread reading available for the election.
              </p>

              {currentAudit.materiality?.ratioPct == null || currentAudit.materiality?.declaredMargin == null ? (
                <div className="illus info">
                  <span>ⓘ</span>
                  <div>
                    <b>Materiality assessment unavailable.</b> The published audit record does not contain the complete inputs required for a quantitative discrepancy-to-margin assessment.
                  </div>
                </div>
              ) : (
                <div className="matv">
                  <div className="mrow">
                    <div className="ml">
                      <span>Declared margin</span>
                      <b>{fmt(currentAudit.materiality.declaredMargin)}</b>
                    </div>
                    <div className="mtrack">
                      <div className="mf margin" style={{ width: '100%' }}></div>
                    </div>
                  </div>

                  <div className="mrow">
                    <div className="ml">
                      <span>{REPORT_INFO[currentAudit.code]?.materialityLabel || 'Identified discrepancy magnitude'}</span>
                      <b>{fmt(currentAudit.materiality.overVotingMagnitude)}</b>
                    </div>
                    <div className="mtrack">
                      <div 
                        className="mf defect" 
                        style={{ width: `${Math.min(100, currentAudit.materiality.ratioPct || 0)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className={`mconcl ${(currentAudit.materiality.ratioPct || 0) >= 100 ? 'over' : ''}`}>
                    <b>APEA materiality reading:</b> {currentAudit.materiality.ratioPct}% of the declared margin. {currentAudit.materiality.note}
                  </div>
                </div>
              )}

              {/* Stress Test */}
              {REPORT_INFO[currentAudit.code]?.stress && (
                <div className="stress-box">
                  <h3>{REPORT_INFO[currentAudit.code]?.stress?.title || 'Stress test'}</h3>
                  {REPORT_INFO[currentAudit.code]?.stress?.rows && (
                    <div className="stress-grid">
                      {REPORT_INFO[currentAudit.code]?.stress?.rows?.map((sr, idx) => (
                        <div key={idx}>
                          <span>{sr[0]}</span>
                          <b>{sr[1]}</b>
                        </div>
                      ))}
                    </div>
                  )}
                  <p>{REPORT_INFO[currentAudit.code]?.stress?.conclusion}</p>
                </div>
              )}
            </section>

            {/* 06 · INEC Right-of-reply */}
            <section className="block" id="s-inec">
              <div className="blabel">
                <div className="kick">06 · Right of reply</div>
                <h2>INEC right-of-reply</h2>
              </div>
              <p className="intro">
                No structured INEC right-of-reply record is currently published for this audit. The section remains available for responses, supporting documentation and AEO disposition when published.
              </p>
              <div className="rof">
                <div className="step">
                  <div className="sn">Stage 1 · AEO finding</div>
                  <h4>Audit finding</h4>
                  <p>Issue PUs are recorded in the Evidence Register.</p>
                  <span className="rs">Available</span>
                </div>
                <div className="step">
                  <div className="sn">Stage 2 · INEC response</div>
                  <h4>Response</h4>
                  <p>No response published.</p>
                  <span className="rs">Not published</span>
                </div>
                <div className="step">
                  <div className="sn">Stage 3 · Documentation</div>
                  <h4>Supporting documentation</h4>
                  <p>No supporting response document published.</p>
                  <span className="rs">Not published</span>
                </div>
                <div className="step">
                  <div className="sn">Stage 4 · AEO disposition</div>
                  <h4>Disposition</h4>
                  <p>No disposition published.</p>
                  <span className="rs">Not published</span>
                </div>
              </div>
            </section>

            {/* 07 · Report & Method */}
            <section className="block" id="s-res">
              <div className="blabel">
                <div className="kick">07 · Report &amp; method</div>
                <h2>Full report &amp; methodology</h2>
              </div>
              <p className="intro">
                Read the published audit report and review the methodology, evidence coverage and stated limitations applied to this election audit.
              </p>
              <div className="res-grid">
                <div className="res">
                  <h4>Full Audit Report</h4>
                  <p>{currentAudit.title} — the published APEA forensic post-election audit.</p>
                  <div className="ver">
                    {apeaPublicReports[currentAudit.code] ? apeaPublicReports[currentAudit.code].label : 'Public report'}
                  </div>
                  {apeaPublicReports[currentAudit.code] ? (
                    <button 
                      type="button"
                      className="btn solid" 
                      onClick={() => handleDownloadPdf(apeaPublicReports[currentAudit.code].uri, apeaPublicReports[currentAudit.code].name)}
                    >
                      Download report
                    </button>
                  ) : (
                    <button className="btn" disabled title="Public report not yet attached">
                      Report not available
                    </button>
                  )}
                </div>

                <div className="res">
                  <h4>Methodology / APAF</h4>
                  <p>Review the methodology, classification approach and available assessment notes for this audit.</p>
                  <div className="ver">{currentAudit.methodology}</div>
                  <button 
                    className="btn" 
                    onClick={() => setMethodNotesOpen(!methodNotesOpen)}
                  >
                    {methodNotesOpen ? 'Hide methodology notes' : 'View methodology notes'}
                  </button>
                </div>
              </div>

              {/* Methodology Notes Drawer */}
              {methodNotesOpen && (
                <div id="method-notes" className="vh">
                  <div className="vh-h">Methodology notes</div>
                  <div className="illus info">
                    <span>ⓘ</span>
                    <div>
                      <b>{currentAudit.methodology}</b> is the assessment approach stated for this audit. The coverage and limitations below are taken from the published report.
                    </div>
                  </div>

                  {apeaReportInfo[currentAudit.code]?.coverage && (
                    <>
                      <h3 style={{ margin: '16px 0 8px' }}>Published evidence coverage</h3>
                      <div className="report-cover">
                        <table>
                          <thead>
                            <tr>
                              <th>Record</th>
                              <th>Obtained / coverage</th>
                              <th>Note</th>
                            </tr>
                          </thead>
                          <tbody>
                            {REPORT_INFO[currentAudit.code]?.coverage?.map((cov, idx) => (
                              <tr key={idx}>
                                <td>{cov[0]}</td>
                                <td>{cov[1]}</td>
                                <td>{cov[2]}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {REPORT_INFO[currentAudit.code]?.limitations && (
                    <>
                      <h3 style={{ margin: '20px 0 8px' }}>Coverage &amp; limits</h3>
                      <ul className="limit-list">
                        {REPORT_INFO[currentAudit.code]?.limitations?.map((lim, idx) => (
                          <li key={idx}>{lim}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </section>
          </div>
        </main>
      )}

      {/* POLLING-UNIT DETAIL MODAL */}
      {puModalData && (
        <div 
          id="pu-modal" 
          className="modal" 
          onClick={(e) => {
            if (e.target === e.currentTarget) setPuModalData(null);
          }}
        >
          <div className="modal-card">
            <div className="modal-head">
              <h3>Polling-unit detail</h3>
              <button 
                className="modal-x" 
                onClick={() => setPuModalData(null)} 
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div id="pu-body" style={{ padding: '22px 24px' }}>
              <div className="pu-grid">
                {[
                  'LGA',
                  'Ward',
                  'PU',
                  'PU code',
                  'Delim',
                  'Registered',
                  'BVAS',
                  'EC8A TVC',
                  'EC8B TVC',
                  currentAudit?.meta.bucketCol,
                  currentAudit?.meta.forensicCol,
                  currentAudit?.meta.reasonCol,
                  'Legal (Verdict 1)',
                  'Over-voting origin',
                  'Under-voting',
                  'Reduction',
                  'Presiding officer',
                  'Collation officer'
                ]
                  .filter((h, i, arr): h is string => Boolean(h) && arr.indexOf(h) === i && currentAudit?.pu.headers.includes(h))
                  .map(headerName => {
                    const rowVal = val(currentAudit, puModalData, headerName);
                    return (
                      <div key={headerName} className="pu-row">
                        <span>{headerName}</span>
                        <b>{fmt(rowVal)}</b>
                      </div>
                    );
                  })}
              </div>
              <p className="pu-note">
                This detail view is available only for polling units classified as Non-Compliant or Excluded / Not-Assessable. Compliant polling units are reported only at aggregate level.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
