import React, { useState, useMemo, useRef } from 'react';
import { 
  Award, Plus, Trash2, Edit3, CheckCircle2, AlertCircle, 
  Download, UploadCloud, Eye, Save, X, RotateCcw, 
  Check, Filter, ShieldCheck, Sparkles, Layers, FileSpreadsheet,
  AlertTriangle, Calendar, Info
} from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import { 
  DcmPublication, 
  DcmClassification, 
  DcmStateRecord, 
  RightOfResponseStatus,
  NIGERIA_37_JURISDICTIONS, 
  DCM_CLASSIFICATIONS, 
  DCM_DIRECTIONS,
  DCM_CONFIDENCE_LEVELS,
  RIGHT_OF_RESPONSE_OPTIONS,
  DCM_COLORS,
  MONTH_NAMES
} from '../types/dcm';
import { DcmMap } from './DcmMap';
import { INITIAL_DCM_PUBLICATIONS } from '../data/dcmInitialData';

function createBlank37Jurisdictions(): Record<string, DcmStateRecord> {
  const result: Record<string, DcmStateRecord> = {};
  for (const j of NIGERIA_37_JURISDICTIONS) {
    result[j.code] = {
      stateCode: j.code,
      stateName: j.name,
      classification: 'Insufficient evidence',
      direction: 'insufficient-basis',
      confidence: 'Low',
      keyFinding: '',
      classificationRationale: '',
      evidenceSummary: '',
      rightOfResponseStatus: 'Not required'
    };
  }
  return result;
}

export const DcmCmsManager: React.FC = () => {
  const { dcmPublications, saveDcmPublication, deleteDcmPublication } = useCMS();

  const publications = useMemo(() => {
    if (dcmPublications && dcmPublications.length > 0) return dcmPublications;
    return INITIAL_DCM_PUBLICATIONS;
  }, [dcmPublications]);

  const [editingPub, setEditingPub] = useState<Partial<DcmPublication> | null>(null);
  const [classifications, setClassifications] = useState<Record<string, DcmStateRecord>>({});
  const [searchState, setSearchState] = useState('');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [previewSelectedCode, setPreviewSelectedCode] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainListFileInputRef = useRef<HTMLInputElement>(null);
  const [showCsvGuide, setShowCsvGuide] = useState<boolean>(false);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  // Start new publication
  const handleStartNew = () => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;
    const isP1 = now.getDate() <= 15;

    const newId = `dcm-${curYear}-${String(curMonth).padStart(2, '0')}-${isP1 ? '15' : 'end'}`;
    const periodLabel = isP1 
      ? `1st – 15th ${MONTH_NAMES[curMonth - 1]} ${curYear}`
      : `16th – ${new Date(curYear, curMonth, 0).getDate()}th ${MONTH_NAMES[curMonth - 1]} ${curYear}`;

    setEditingPub({
      id: newId,
      title: `Democratic Competitiveness Map: ${periodLabel}`,
      year: curYear,
      month: curMonth,
      periodIndex: isP1 ? 1 : 2,
      periodStart: isP1 ? `${curYear}-${String(curMonth).padStart(2, '0')}-01` : `${curYear}-${String(curMonth).padStart(2, '0')}-16`,
      periodEnd: isP1 ? `${curYear}-${String(curMonth).padStart(2, '0')}-15` : `${curYear}-${String(curMonth).padStart(2, '0')}-${new Date(curYear, curMonth, 0).getDate()}`,
      reportingPeriodLabel: periodLabel,
      publicationDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      evidenceCutoffDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      methodologyVersion: 'Version 1.1',
      revisionNote: '',
      status: 'draft',
      isLatest: true,
      summary: '',
      changesSummary: '',
      supportingDocumentUrl: ''
    });

    setClassifications(createBlank37Jurisdictions());
    setValidationErrors([]);
    setShowLivePreview(false);
  };

  // Start editing existing publication
  const handleEdit = (pub: DcmPublication) => {
    setEditingPub({ ...pub });
    const map = { ...createBlank37Jurisdictions() };
    if (pub.classifications) {
      for (const [code, rec] of Object.entries(pub.classifications)) {
        if (map[code]) {
          map[code] = { ...map[code], ...rec };
        }
      }
    }
    setClassifications(map);
    setValidationErrors([]);
    setShowLivePreview(false);
  };

  // Cancel edit
  const handleCancel = () => {
    setEditingPub(null);
    setClassifications({});
    setValidationErrors([]);
    setShowLivePreview(false);
  };

  // Update classification for a state
  const handleClassificationChange = (stateCode: string, newClass: DcmClassification) => {
    setClassifications(prev => {
      const existing = prev[stateCode] || {
        stateCode,
        stateName: NIGERIA_37_JURISDICTIONS.find(j => j.code === stateCode)?.name || stateCode,
        classification: 'Insufficient evidence' as DcmClassification
      };
      return {
        ...prev,
        [stateCode]: {
          ...existing,
          classification: newClass
        }
      };
    });
  };

  // Update field for a state
  const handleStateFieldChange = (stateCode: string, field: keyof DcmStateRecord, value: string) => {
    setClassifications(prev => {
      const existing = prev[stateCode] || {
        stateCode,
        stateName: NIGERIA_37_JURISDICTIONS.find(j => j.code === stateCode)?.name || stateCode,
        classification: 'Insufficient evidence' as DcmClassification
      };
      return {
        ...prev,
        [stateCode]: {
          ...existing,
          [field]: value
        }
      };
    });
  };

  // Bulk quick-setters
  const handleBulkSetAll = (targetClass: DcmClassification) => {
    setClassifications(prev => {
      const updated: Record<string, DcmStateRecord> = {};
      for (const [code, rec] of Object.entries(prev)) {
        updated[code] = { ...rec, classification: targetClass };
      }
      return updated;
    });
    showStatus(`All 37 jurisdictions set to "${targetClass}".`);
  };

  // Acceptable CSV format generator
  const generateAcceptableCsv = (recordsMap?: Record<string, DcmStateRecord>): string => {
    const headers = ['state_code', 'state_name', 'classification', 'direction', 'confidence', 'key_finding', 'rationale', 'evidence_summary', 'right_of_response'];
    const rows = NIGERIA_37_JURISDICTIONS.map(j => {
      const current = recordsMap?.[j.code] || classifications[j.code];
      const cls = current?.classification || 'Insufficient evidence';
      const dir = current?.direction || (cls === 'Insufficient evidence' ? 'insufficient-basis' : 'newly-classified');
      const conf = current?.confidence || (cls === 'Insufficient evidence' ? 'Low' : 'Medium');
      const keyF = (current?.keyFinding || current?.classificationRationale || '').replace(/"/g, '""');
      const rat = (current?.classificationRationale || '').replace(/"/g, '""');
      const evi = (current?.evidenceSummary || '').replace(/"/g, '""');
      const ror = current?.rightOfResponseStatus || 'Not required';
      return `"${j.code}","${j.name}","${cls}","${dir}","${conf}","${keyF}","${rat}","${evi}","${ror}"`;
    });

    // Prepend UTF-8 BOM (\uFEFF) for seamless compatibility across Excel, Numbers, and Google Sheets
    return '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  };

  // Download acceptable CSV file
  const handleDownloadAcceptableCsv = (customRecords?: Record<string, DcmStateRecord>, filenameSuffix = 'template') => {
    const csvContent = generateAcceptableCsv(customRecords);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedPeriod = editingPub?.reportingPeriodLabel?.replace(/[^a-zA-Z0-9]/g, '_') || filenameSuffix;
    link.download = `dcm_acceptable_format_37_jurisdictions_${sanitizedPeriod}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showStatus('Acceptable DCM CSV format downloaded (includes all 37 Nigerian jurisdictions).');
  };

  // Normalize classification from full name or code (G, A, O, R, X)
  const normalizeClassification = (val: string): DcmClassification | null => {
    if (!val) return null;
    const clean = val.trim().toLowerCase();
    
    // Short codes
    if (clean === 'g') return 'Open';
    if (clean === 'a') return 'Emerging concern';
    if (clean === 'o') return 'Constrained';
    if (clean === 'r') return 'Severely constrained';
    if (clean === 'x') return 'Insufficient evidence';

    // Full names and keywords
    if (clean.includes('open') || clean === 'green') {
      return 'Open';
    }
    if (clean.includes('emerging') || clean.includes('amber') || clean === 'yellow') {
      return 'Emerging concern';
    }
    if (clean.includes('severely') || clean.includes('severe') || clean === 'red') {
      return 'Severely constrained';
    }
    if (clean.includes('constrained') || clean === 'orange') {
      return 'Constrained';
    }
    if (clean.includes('insufficient') || clean.includes('grey') || clean.includes('gray') || clean.includes('none')) {
      return 'Insufficient evidence';
    }

    return null;
  };

  // Normalize direction from CSV input
  const normalizeDirection = (val: string, fallbackCls: DcmClassification): string => {
    if (!val) return fallbackCls === 'Insufficient evidence' ? 'insufficient-basis' : 'newly-classified';
    const clean = val.trim().toLowerCase().replace(/\s+/g, '-');
    if (clean.includes('new')) return 'newly-classified';
    if (clean.includes('deteriorat')) return 'deteriorating';
    if (clean.includes('insuffic') || clean.includes('basis')) return 'insufficient-basis';
    if (clean.includes('improv')) return 'improving';
    if (clean.includes('stable')) return 'stable';
    return clean;
  };

  // Normalize confidence from CSV input
  const normalizeConfidence = (val: string, fallbackCls: DcmClassification): string => {
    if (!val) return fallbackCls === 'Insufficient evidence' ? 'Low' : 'Medium';
    const clean = val.trim().toLowerCase();
    if (clean.startsWith('h')) return 'High';
    if (clean.startsWith('m')) return 'Medium';
    if (clean.startsWith('l')) return 'Low';
    return 'Medium';
  };

  // Parse CSV text with quote and BOM support
  const parseDcmCsv = (text: string): {
    records: Record<string, DcmStateRecord>;
    matchedCount: number;
    unmatchedRows: string[];
  } => {
    const cleanText = text.replace(/^\uFEFF/, '').trim();
    const lines = cleanText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('CSV file has no data rows. Expected a header row followed by state rows.');
    }

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headerCols = parseLine(lines[0]).map(h => h.toLowerCase().replace(/['"]/g, ''));
    const codeIdx = headerCols.findIndex(c => c === 'state_code' || c === 'code' || c.includes('code'));
    const nameIdx = headerCols.findIndex(c => c === 'state_name' || c === 'state' || c === 'name' || c.includes('name'));
    const classIdx = headerCols.findIndex(c => c === 'classification' || c === 'status' || c.includes('class') || c === 'category');
    const dirIdx = headerCols.findIndex(c => c === 'direction' || c === 'trend');
    const confIdx = headerCols.findIndex(c => c === 'confidence' || c === 'certainty');
    const keyFIdx = headerCols.findIndex(c => c === 'key_finding' || c === 'key_findings' || c.includes('finding'));
    const ratIdx = headerCols.findIndex(c => c === 'rationale' || c.includes('rationale') || c.includes('reason'));
    const eviIdx = headerCols.findIndex(c => c === 'evidence_summary' || c.includes('evidence') || c.includes('summary'));
    const rorIdx = headerCols.findIndex(c => c === 'right_of_response' || c.includes('response') || c.includes('ror'));

    if (codeIdx === -1 && nameIdx === -1) {
      throw new Error('CSV must contain at least a "state_code" or "state_name" column.');
    }
    if (classIdx === -1) {
      throw new Error('CSV must contain a "classification" or "status" column.');
    }

    const records = createBlank37Jurisdictions();
    let matchedCount = 0;
    const unmatchedRows: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseLine(lines[i]);
      if (cols.length === 0 || (cols.length === 1 && !cols[0])) continue;

      const rawCode = (codeIdx >= 0 ? cols[codeIdx] : '')?.toUpperCase().replace(/[^A-Z]/g, '');
      const rawName = (nameIdx >= 0 ? cols[nameIdx] : '')?.trim();

      // Normalize common synonyms: FCT, Abuja, Federal Capital Territory
      const match = NIGERIA_37_JURISDICTIONS.find(j => {
        if (rawCode && j.code.toUpperCase() === rawCode) return true;
        if (rawCode === 'FCT' && j.code === 'FC') return true;
        if (rawName) {
          const cleanName = rawName.toLowerCase();
          const target = j.name.toLowerCase();
          if (cleanName === target) return true;
          if (j.code === 'FC' && (cleanName.includes('abuja') || cleanName.includes('federal capital'))) return true;
          if (cleanName.replace(/[^a-z]/g, '') === target.replace(/[^a-z]/g, '')) return true;
        }
        return false;
      });

      if (!match) {
        if (rawCode || rawName) {
          unmatchedRows.push(`Row ${i + 1}: ${rawCode || rawName}`);
        }
        continue;
      }

      const rawClass = classIdx >= 0 ? cols[classIdx] : '';
      const parsedClass = normalizeClassification(rawClass) || 'Insufficient evidence';
      
      const rawDir = (dirIdx >= 0 && cols[dirIdx]) ? cols[dirIdx] : '';
      const parsedDir = normalizeDirection(rawDir, parsedClass);

      const rawConf = (confIdx >= 0 && cols[confIdx]) ? cols[confIdx] : '';
      const parsedConf = normalizeConfidence(rawConf, parsedClass);

      const rawKeyF = (keyFIdx >= 0 && cols[keyFIdx]) ? cols[keyFIdx] : '';
      const rat = (ratIdx >= 0 && cols[ratIdx]) ? cols[ratIdx] : '';
      const evi = (eviIdx >= 0 && cols[eviIdx]) ? cols[eviIdx] : '';
      const rawRor = (rorIdx >= 0 && cols[rorIdx]) ? cols[rorIdx] : '';
      const ror = (RIGHT_OF_RESPONSE_OPTIONS.includes(rawRor as any)) 
        ? (rawRor as RightOfResponseStatus) 
        : 'Not required';

      records[match.code] = {
        stateCode: match.code,
        stateName: match.name,
        classification: parsedClass,
        direction: parsedDir,
        confidence: parsedConf,
        keyFinding: rawKeyF || rat,
        classificationRationale: rat || rawKeyF,
        evidenceSummary: evi,
        rightOfResponseStatus: ror
      };

      matchedCount++;
    }

    return { records, matchedCount, unmatchedRows };
  };

  // Upload CSV inside Publication Editor (updates current 37 jurisdictions)
  const handleUploadCsvInEditor = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const { records, matchedCount, unmatchedRows } = parseDcmCsv(text);

        setClassifications(prev => ({
          ...prev,
          ...records
        }));

        let msg = `CSV uploaded: Successfully populated ${matchedCount}/37 jurisdictions.`;
        if (unmatchedRows.length > 0) {
          msg += ` (${unmatchedRows.length} unrecognized rows skipped)`;
        }
        showStatus(msg);
      } catch (err: any) {
        showStatus(`CSV import error: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Upload CSV from Main List (creates new publication and populates 37 jurisdictions)
  const handleUploadCsvForNewPublication = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const { records, matchedCount } = parseDcmCsv(text);

        const now = new Date();
        const curYear = now.getFullYear();
        const curMonth = now.getMonth() + 1;
        const isP1 = now.getDate() <= 15;

        const newId = `dcm-${curYear}-${String(curMonth).padStart(2, '0')}-${isP1 ? '15' : 'end'}-${Date.now().toString().slice(-4)}`;
        const periodLabel = isP1 
          ? `1st – 15th ${MONTH_NAMES[curMonth - 1]} ${curYear}`
          : `16th – ${new Date(curYear, curMonth, 0).getDate()}th ${MONTH_NAMES[curMonth - 1]} ${curYear}`;

        setEditingPub({
          id: newId,
          title: `Democratic Competitiveness Map: ${periodLabel}`,
          year: curYear,
          month: curMonth,
          periodIndex: isP1 ? 1 : 2,
          periodStart: isP1 ? `${curYear}-${String(curMonth).padStart(2, '0')}-01` : `${curYear}-${String(curMonth).padStart(2, '0')}-16`,
          periodEnd: isP1 ? `${curYear}-${String(curMonth).padStart(2, '0')}-15` : `${curYear}-${String(curMonth).padStart(2, '0')}-${new Date(curYear, curMonth, 0).getDate()}`,
          reportingPeriodLabel: periodLabel,
          publicationDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
          evidenceCutoffDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
          methodologyVersion: 'Version 1.1',
          revisionNote: 'Uploaded via CSV batch import',
          status: 'draft',
          isLatest: true,
          summary: `Imported publication with ${matchedCount} state classifications.`,
          changesSummary: '',
          supportingDocumentUrl: ''
        });

        setClassifications(records);
        setValidationErrors([]);
        setShowLivePreview(false);

        showStatus(`CSV import successful! Created new publication draft with ${matchedCount}/37 jurisdictions populated.`);
      } catch (err: any) {
        showStatus(`CSV upload error: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Strict 37-Jurisdiction Validation Before Publishing
  const validateBeforeSave = (): boolean => {
    const errors: string[] = [];

    if (!editingPub?.title?.trim()) {
      errors.push('Publication title is required.');
    }
    if (!editingPub?.reportingPeriodLabel?.trim()) {
      errors.push('Reporting period label is required.');
    }
    if (!editingPub?.periodStart || !editingPub?.periodEnd) {
      errors.push('Period start and end dates are required.');
    }

    const unclassifiedStates: string[] = [];
    for (const j of NIGERIA_37_JURISDICTIONS) {
      const rec = classifications[j.code];
      if (!rec || !rec.classification || !DCM_CLASSIFICATIONS.includes(rec.classification)) {
        unclassifiedStates.push(`${j.name} (${j.code})`);
      }
    }

    if (unclassifiedStates.length > 0) {
      errors.push(
        `All 37 jurisdictions must have a controlled classification before saving. Missing/unclassified: ${unclassifiedStates.slice(0, 5).join(', ')}${unclassifiedStates.length > 5 ? ` and ${unclassifiedStates.length - 5} more` : ''}.`
      );
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Save publication handler
  const handleSave = async () => {
    if (!validateBeforeSave() || !editingPub) return;

    try {
      const finalPub: DcmPublication = {
        id: editingPub.id || `dcm-${Date.now()}`,
        title: editingPub.title || 'Democratic Competitiveness Map',
        year: Number(editingPub.year) || new Date().getFullYear(),
        month: Number(editingPub.month) || 10,
        periodIndex: Number(editingPub.periodIndex) || 1,
        periodStart: editingPub.periodStart || '2026-10-01',
        periodEnd: editingPub.periodEnd || '2026-10-15',
        reportingPeriodLabel: editingPub.reportingPeriodLabel || '1st – 15th October 2026',
        publicationDate: editingPub.publicationDate || new Date().toLocaleDateString('en-GB'),
        evidenceCutoffDate: editingPub.evidenceCutoffDate || new Date().toLocaleDateString('en-GB'),
        methodologyVersion: editingPub.methodologyVersion || 'Version 1.1',
        revisionNote: editingPub.revisionNote || '',
        status: (editingPub.status as any) || 'published',
        isLatest: Boolean(editingPub.isLatest),
        summary: editingPub.summary || '',
        changesSummary: editingPub.changesSummary || '',
        supportingDocumentUrl: editingPub.supportingDocumentUrl || '',
        classifications: classifications,
        createdAt: editingPub.createdAt || Date.now(),
        updatedAt: Date.now()
      };

      await saveDcmPublication(finalPub);
      showStatus(`Publication "${finalPub.title}" successfully saved.`);
      setEditingPub(null);
      setClassifications({});
      setValidationErrors([]);
    } catch (err: any) {
      showStatus(`Failed to save publication: ${err.message}`, 'error');
    }
  };

  // Delete publication handler
  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete publication "${title}"? This action cannot be undone.`)) {
      try {
        await deleteDcmPublication(id);
        showStatus(`Deleted publication "${title}".`);
      } catch (err: any) {
        showStatus(`Failed to delete: ${err.message}`, 'error');
      }
    }
  };

  // Counts of current classifications in editor
  const counts = useMemo(() => {
    const res: Record<DcmClassification, number> = {
      'Open': 0,
      'Emerging concern': 0,
      'Constrained': 0,
      'Severely constrained': 0,
      'Insufficient evidence': 0
    };
    for (const rec of Object.values(classifications)) {
      if (rec?.classification && res[rec.classification] !== undefined) {
        res[rec.classification]++;
      }
    }
    return res;
  }, [classifications]);

  // Filtered jurisdictions in table editor
  const filteredJurisdictions = useMemo(() => {
    return NIGERIA_37_JURISDICTIONS.filter(j => {
      const matchSearch = j.name.toLowerCase().includes(searchState.toLowerCase()) || 
                          j.code.toLowerCase().includes(searchState.toLowerCase());
      const matchZone = zoneFilter === 'all' || j.zone === zoneFilter;
      const rec = classifications[j.code];
      const matchClass = classFilter === 'all' || (rec && rec.classification === classFilter);
      return matchSearch && matchZone && matchClass;
    });
  }, [searchState, zoneFilter, classFilter, classifications]);

  const uniqueZones = useMemo(() => {
    return Array.from(new Set(NIGERIA_37_JURISDICTIONS.map(j => j.zone)));
  }, []);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {statusMsg && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-semibold transition-all shadow-sm ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* VIEW 1: PUBLICATIONS LIST (When not editing) */}
      {!editingPub ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-brand-blue" />
                <h3 className="font-display font-bold text-xl text-ink">
                  Democratic Competitiveness Map (DCM) Publications
                </h3>
              </div>
              <p className="text-xs text-mut mt-1">
                Manage bi-weekly and baseline DCM publications, 37-jurisdiction classifications, and period timeline history.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <input 
                type="file" 
                ref={mainListFileInputRef}
                accept=".csv,text/csv" 
                onChange={handleUploadCsvForNewPublication} 
                className="hidden" 
              />

              <button
                type="button"
                onClick={() => handleDownloadAcceptableCsv(undefined, 'blank_template')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-xs cursor-pointer shrink-0"
                title="Download standard CSV format with all 37 Nigerian jurisdictions"
              >
                <Download className="w-3.5 h-3.5 text-brand-blue" />
                <span>Download Acceptable CSV Format</span>
              </button>

              <button
                type="button"
                onClick={() => mainListFileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-brand-purple border border-purple-200 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-xs cursor-pointer shrink-0"
                title="Upload a completed CSV to create a new DCM publication with all 37 states"
              >
                <UploadCloud className="w-3.5 h-3.5 text-brand-purple" />
                <span>Upload CSV to New Publication</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCsvGuide(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer shrink-0"
                title="View acceptable CSV headers and permitted values"
              >
                <Info className="w-3.5 h-3.5 text-slate-500" />
                <span>Format Guide</span>
              </button>

              <a
                href="/democratic-competitiveness-map"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Eye className="w-3.5 h-3.5 text-brand-blue" />
                <span>View Live DCM Map</span>
              </a>

              <button
                onClick={handleStartNew}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-xl text-xs font-bold font-mono tracking-wider uppercase transition-all shadow-sm cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>New DCM Publication</span>
              </button>
            </div>
          </div>

          {/* Publications Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {publications.map((pub) => {
              const classCount = pub.classifications ? Object.keys(pub.classifications).length : 0;
              const hasAll37 = classCount === 37;

              return (
                <div 
                  key={pub.id}
                  className="bg-white border border-line rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border ${
                          pub.status === 'published' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {pub.status}
                        </span>
                        {pub.isLatest && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-blue-50 text-brand-blue border border-blue-200 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Latest
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-mut">
                          {pub.methodologyVersion || 'v1.1'}
                        </span>
                      </div>

                      <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                        hasAll37 ? 'bg-emerald-100/60 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {classCount}/37 Classified
                      </span>
                    </div>

                    <h4 className="font-display font-bold text-lg text-ink leading-snug">
                      {pub.title}
                    </h4>

                    <div className="flex items-center gap-2 text-xs text-mut font-mono">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{pub.reportingPeriodLabel}</span>
                    </div>

                    <p className="text-xs text-ink2 line-clamp-2 leading-relaxed">
                      {pub.summary || 'No summary provided.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-line flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-mut">
                      Pub date: {pub.publicationDate}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(pub)}
                        className="px-3 py-1.5 rounded-lg bg-paper hover:bg-line text-ink text-xs font-semibold font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-brand-blue" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDelete(pub.id, pub.title)}
                        className="p-1.5 rounded-lg text-mut hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete publication"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VIEW 2: PUBLICATION EDITOR & 37-JURISDICTION MATRIX */
        <div className="space-y-8 bg-paper border border-line rounded-2xl p-6 shadow-sm">
          {/* Editor Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-brand-blue text-white">
                  DCM Publication Editor
                </span>
                <span className="text-xs font-mono text-mut">
                  {editingPub.id}
                </span>
              </div>
              <h3 className="font-display font-bold text-xl sm:text-2xl text-ink">
                {editingPub.title || 'Untitled DCM Publication'}
              </h3>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowLivePreview(!showLivePreview)}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
                  showLivePreview 
                    ? 'bg-brand-purple text-white border-brand-purple' 
                    : 'bg-white hover:bg-line text-ink border-line'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>{showLivePreview ? 'Hide Live Map Preview' : 'Live Map Preview'}</span>
              </button>

              <button
                type="button"
                onClick={handleCancel}
                className="px-3.5 py-2 rounded-xl text-xs font-mono font-semibold bg-white hover:bg-line text-mut hover:text-ink border border-line transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase bg-brand-green hover:bg-emerald-700 text-white shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Publication</span>
              </button>
            </div>
          </div>

          {/* Validation Errors Box */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-red-800 font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Cannot save publication. Please resolve the following requirement{validationErrors.length > 1 ? 's' : ''}:</span>
              </div>
              <ul className="list-disc list-inside text-xs text-red-700 space-y-1 pl-1">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Section 1: Publication Metadata */}
          <div className="bg-white border border-line rounded-xl p-5 space-y-4">
            <h4 className="font-display font-bold text-sm text-ink uppercase tracking-wider flex items-center gap-2 border-b border-line pb-2">
              <FileSpreadsheet className="w-4 h-4 text-brand-blue" />
              <span>Publication Metadata & Timeline Indexing</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="block text-[10px] font-mono font-bold uppercase text-mut">Publication Title</label>
                <input 
                  type="text"
                  value={editingPub.title || ''}
                  onChange={e => setEditingPub(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Democratic Competitiveness Map: 1st – 15th October 2026"
                  className="w-full text-xs p-2.5 border border-line rounded-lg font-semibold focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold uppercase text-mut">Publication Status</label>
                <select 
                  value={editingPub.status || 'draft'}
                  onChange={e => setEditingPub(p => ({ ...p, status: e.target.value as any }))}
                  className="w-full text-xs p-2.5 border border-line rounded-lg font-semibold font-mono focus:outline-none focus:border-brand-blue bg-white"
                >
                  <option value="draft">Draft (Private in CMS)</option>
                  <option value="published">Published (Visible to Public)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold uppercase text-mut">Reporting Period Label</label>
                <input 
                  type="text"
                  value={editingPub.reportingPeriodLabel || ''}
                  onChange={e => setEditingPub(p => ({ ...p, reportingPeriodLabel: e.target.value }))}
                  placeholder="e.g. 1st – 15th October 2026"
                  className="w-full text-xs p-2.5 border border-line rounded-lg font-semibold focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold uppercase text-mut">Period Start Date</label>
                <input 
                  type="date"
                  value={editingPub.periodStart || ''}
                  onChange={e => setEditingPub(p => ({ ...p, periodStart: e.target.value }))}
                  className="w-full text-xs p-2.5 border border-line rounded-lg font-mono focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold uppercase text-mut">Period End Date</label>
                <input 
                  type="date"
                  value={editingPub.periodEnd || ''}
                  onChange={e => setEditingPub(p => ({ ...p, periodEnd: e.target.value }))}
                  className="w-full text-xs p-2.5 border border-line rounded-lg font-mono focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold uppercase text-mut">Year</label>
                <input 
                  type="number"
                  value={editingPub.year || 2026}
                  onChange={e => setEditingPub(p => ({ ...p, year: Number(e.target.value) }))}
                  className="w-full text-xs p-2.5 border border-line rounded-lg font-mono focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold uppercase text-mut">Month (1-12)</label>
                <select 
                  value={editingPub.month || 10}
                  onChange={e => setEditingPub(p => ({ ...p, month: Number(e.target.value) }))}
                  className="w-full text-xs p-2.5 border border-line rounded-lg font-mono focus:outline-none focus:border-brand-blue bg-white"
                >
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={idx + 1} value={idx + 1}>{m} ({idx + 1})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold uppercase text-mut">Period Index</label>
                <select 
                  value={editingPub.periodIndex || 1}
                  onChange={e => setEditingPub(p => ({ ...p, periodIndex: Number(e.target.value) }))}
                  className="w-full text-xs p-2.5 border border-line rounded-lg font-mono focus:outline-none focus:border-brand-blue bg-white"
                >
                  <option value={1}>P1: 1st – 15th of month</option>
                  <option value={2}>P2: 16th – Month end</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold uppercase text-mut">Methodology Version</label>
                <input 
                  type="text"
                  value={editingPub.methodologyVersion || 'Version 1.1'}
                  onChange={e => setEditingPub(p => ({ ...p, methodologyVersion: e.target.value }))}
                  placeholder="e.g. Version 1.1"
                  className="w-full text-xs p-2.5 border border-line rounded-lg font-mono focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold uppercase text-mut">Publication Date</label>
                <input 
                  type="text"
                  value={editingPub.publicationDate || ''}
                  onChange={e => setEditingPub(p => ({ ...p, publicationDate: e.target.value }))}
                  placeholder="e.g. 16 October 2026"
                  className="w-full text-xs p-2.5 border border-line rounded-lg font-mono focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold uppercase text-mut">Evidence Cut-off Date</label>
                <input 
                  type="text"
                  value={editingPub.evidenceCutoffDate || ''}
                  onChange={e => setEditingPub(p => ({ ...p, evidenceCutoffDate: e.target.value }))}
                  placeholder="e.g. 15 October 2026"
                  className="w-full text-xs p-2.5 border border-line rounded-lg font-mono focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="md:col-span-3 flex items-center gap-2 pt-1">
                <input 
                  type="checkbox"
                  id="isLatest"
                  checked={Boolean(editingPub.isLatest)}
                  onChange={e => setEditingPub(p => ({ ...p, isLatest: e.target.checked }))}
                  className="rounded text-brand-blue focus:ring-brand-blue w-4 h-4 cursor-pointer"
                />
                <label htmlFor="isLatest" className="text-xs font-semibold text-ink cursor-pointer">
                  Mark as Latest Publication (Default view for visitors at /democratic-competitiveness-map)
                </label>
              </div>

              <div className="md:col-span-3 space-y-1">
                <label className="block text-[10px] font-mono font-bold uppercase text-mut">Executive Summary / National Overview</label>
                <textarea 
                  rows={3}
                  value={editingPub.summary || ''}
                  onChange={e => setEditingPub(p => ({ ...p, summary: e.target.value }))}
                  placeholder="Key national findings, regional deterioration, and contextual analysis..."
                  className="w-full text-xs p-2.5 border border-line rounded-lg focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="md:col-span-3 space-y-1">
                <label className="block text-[10px] font-mono font-bold uppercase text-mut">Revision Notes / Methodology Changes (Optional)</label>
                <input 
                  type="text"
                  value={editingPub.revisionNote || ''}
                  onChange={e => setEditingPub(p => ({ ...p, revisionNote: e.target.value }))}
                  placeholder="e.g. Initial baseline benchmark or updated evidence threshold..."
                  className="w-full text-xs p-2.5 border border-line rounded-lg focus:outline-none focus:border-brand-blue"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Live Map Preview (if toggled) */}
          {showLivePreview && (
            <div className="bg-white border-2 border-brand-purple/40 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-purple" />
                  <h4 className="font-display font-bold text-base text-ink">
                    Live Preview: 37-Jurisdiction Nigeria Map
                  </h4>
                </div>
                <span className="text-xs font-mono text-mut">
                  Click on any state in preview to view details
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 bg-paper border border-line rounded-xl p-4">
                  <DcmMap 
                    publication={{
                      id: editingPub.id || 'preview',
                      title: editingPub.title || 'Preview',
                      year: Number(editingPub.year) || 2026,
                      month: Number(editingPub.month) || 10,
                      periodIndex: Number(editingPub.periodIndex) || 1,
                      periodStart: editingPub.periodStart || '2026-10-01',
                      periodEnd: editingPub.periodEnd || '2026-10-15',
                      reportingPeriodLabel: editingPub.reportingPeriodLabel || '',
                      publicationDate: editingPub.publicationDate || '',
                      evidenceCutoffDate: editingPub.evidenceCutoffDate || '',
                      methodologyVersion: editingPub.methodologyVersion || 'Version 1.1',
                      status: 'draft',
                      isLatest: false,
                      summary: editingPub.summary || '',
                      classifications: classifications,
                      createdAt: 0,
                      updatedAt: 0
                    }}
                    selectedStateCode={previewSelectedCode}
                    onSelectState={(code) => {
                      setPreviewSelectedCode(code);
                      if (code) {
                        setTimeout(() => {
                          const el = document.getElementById('dcm-cms-selected-state');
                          if (el && window.innerWidth < 1024) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                          }
                        }, 60);
                      }
                    }}
                    highlightChanges={false}
                    changedStateCodes={new Set<string>()}
                  />
                </div>

                <div 
                  id="dcm-cms-selected-state"
                  className="lg:col-span-4 bg-paper border border-line rounded-xl p-4 space-y-3 scroll-mt-6"
                >
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-mut">
                    Selected State Preview
                  </div>
                  {previewSelectedCode && classifications[previewSelectedCode] ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-display font-bold text-base text-ink">
                          {classifications[previewSelectedCode].stateName}
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded font-bold" style={{
                          backgroundColor: DCM_COLORS[classifications[previewSelectedCode].classification]?.fill + '20',
                          color: DCM_COLORS[classifications[previewSelectedCode].classification]?.text
                        }}>
                          {classifications[previewSelectedCode].classification}
                        </span>
                      </div>
                      <p className="text-xs text-ink2 leading-relaxed">
                        {classifications[previewSelectedCode].classificationRationale || 'No rationale recorded.'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-mut italic">
                      Click any state on the map to preview its info card.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Section 3: 37-Jurisdiction Classification Matrix */}
          <div className="bg-white border border-line rounded-xl p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
              <div>
                <h4 className="font-display font-bold text-base text-ink flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand-blue" />
                  <span>37-Jurisdiction Classification Matrix</span>
                </h4>
                <p className="text-xs text-mut mt-0.5">
                  All 36 states and the FCT. Every jurisdiction must be assigned a controlled DCM classification.
                </p>
              </div>

              {/* Bulk actions & CSV Tools */}
              <div className="flex items-center gap-2 flex-wrap">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept=".csv,text/csv" 
                  onChange={handleUploadCsvInEditor} 
                  className="hidden" 
                />
                
                <button
                  type="button"
                  onClick={() => handleDownloadAcceptableCsv(classifications, 'current_state_matrix')}
                  className="px-3.5 py-2 rounded-xl bg-paper hover:bg-line text-ink text-xs font-mono font-bold flex items-center gap-1.5 border border-line transition-colors cursor-pointer shadow-xs"
                  title="Download acceptable CSV format pre-populated with all 37 jurisdictions"
                >
                  <Download className="w-3.5 h-3.5 text-brand-blue" />
                  <span>Download Acceptable CSV Format</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-brand-purple text-xs font-mono font-bold flex items-center gap-1.5 border border-purple-200 transition-colors cursor-pointer shadow-xs"
                  title="Upload CSV to populate all 37 jurisdictions"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-brand-purple" />
                  <span>Upload CSV to Populate States</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCsvGuide(true)}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
                  title="View format guide and accepted values"
                >
                  <Info className="w-3.5 h-3.5 text-slate-500" />
                  <span>Format Guide</span>
                </button>
              </div>
            </div>

            {/* Classification Summary Statistics Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              {DCM_CLASSIFICATIONS.map(cls => {
                const conf = DCM_COLORS[cls];
                return (
                  <div 
                    key={cls}
                    className="p-2.5 rounded-xl border flex flex-col justify-between"
                    style={{ borderColor: conf.fill + '40', backgroundColor: conf.fill + '08' }}
                  >
                    <span className="text-[10px] font-mono font-bold uppercase truncate" style={{ color: conf.text }}>
                      {cls}
                    </span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-xl font-display font-bold" style={{ color: conf.text }}>
                        {counts[cls]}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleBulkSetAll(cls)}
                        className="text-[9px] font-mono underline hover:opacity-80 cursor-pointer"
                        style={{ color: conf.text }}
                      >
                        Set all
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <input 
                type="text"
                placeholder="Search state or code..."
                value={searchState}
                onChange={e => setSearchState(e.target.value)}
                className="w-full sm:w-64 text-xs p-2 border border-line rounded-lg font-mono focus:outline-none focus:border-brand-blue"
              />

              <select 
                value={zoneFilter}
                onChange={e => setZoneFilter(e.target.value)}
                className="w-full sm:w-44 text-xs p-2 border border-line rounded-lg font-mono focus:outline-none focus:border-brand-blue bg-white"
              >
                <option value="all">All Zones (6)</option>
                {uniqueZones.map(z => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>

              <select 
                value={classFilter}
                onChange={e => setClassFilter(e.target.value)}
                className="w-full sm:w-56 text-xs p-2 border border-line rounded-lg font-mono focus:outline-none focus:border-brand-blue bg-white"
              >
                <option value="all">All Classifications (5)</option>
                {DCM_CLASSIFICATIONS.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>

              <div className="ml-auto text-xs font-mono text-mut">
                Showing {filteredJurisdictions.length} of 37 states
              </div>
            </div>

            {/* 37-Jurisdiction Table */}
            <div className="overflow-x-auto border border-line rounded-xl max-h-[550px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-paper border-b border-line sticky top-0 z-10 font-mono text-[10px] text-mut uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Code / State</th>
                    <th className="py-2.5 px-3">Geopolitical Zone</th>
                    <th className="py-2.5 px-3 min-w-[170px]">Classification</th>
                    <th className="py-2.5 px-3 min-w-[150px]">Direction</th>
                    <th className="py-2.5 px-3 min-w-[110px]">Confidence</th>
                    <th className="py-2.5 px-3 min-w-[240px]">Key Finding / Rationale</th>
                    <th className="py-2.5 px-3 min-w-[160px]">Right of Response</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredJurisdictions.map(j => {
                    const rec = classifications[j.code] || {
                      stateCode: j.code,
                      stateName: j.name,
                      classification: 'Insufficient evidence',
                      direction: 'insufficient-basis',
                      confidence: 'Low',
                      keyFinding: '',
                      classificationRationale: '',
                      evidenceSummary: '',
                      rightOfResponseStatus: 'Not required'
                    };

                    const colorConf = DCM_COLORS[rec.classification];

                    return (
                      <tr key={j.code} className="hover:bg-paper/60 transition-colors">
                        <td className="py-2 px-3 font-semibold whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] bg-line/80 px-1.5 py-0.5 rounded font-bold text-ink2">
                              {j.code}
                            </span>
                            <span className="text-ink">{j.name}</span>
                          </div>
                        </td>

                        <td className="py-2 px-3 text-mut font-mono text-[11px] whitespace-nowrap">
                          {j.zone}
                        </td>

                        <td className="py-2 px-3">
                          <select 
                            value={rec.classification}
                            onChange={e => handleClassificationChange(j.code, e.target.value as DcmClassification)}
                            className="w-full text-xs py-1.5 px-2 border rounded-lg font-semibold font-mono focus:outline-none"
                            style={{
                              borderColor: colorConf?.fill || '#CBD5E1',
                              backgroundColor: (colorConf?.fill || '#64748B') + '15',
                              color: colorConf?.text || '#1E293B'
                            }}
                          >
                            {DCM_CLASSIFICATIONS.map(cls => (
                              <option key={cls} value={cls} className="bg-white text-ink">
                                {cls}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="py-2 px-3">
                          <select 
                            value={rec.direction || (rec.classification === 'Insufficient evidence' ? 'insufficient-basis' : 'newly-classified')}
                            onChange={e => handleStateFieldChange(j.code, 'direction', e.target.value)}
                            className="w-full text-xs py-1.5 px-2 border border-line rounded-lg font-mono focus:outline-none focus:border-brand-blue bg-white"
                          >
                            {DCM_DIRECTIONS.map(d => (
                              <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                          </select>
                        </td>

                        <td className="py-2 px-3">
                          <select 
                            value={rec.confidence || (rec.classification === 'Insufficient evidence' ? 'Low' : 'Medium')}
                            onChange={e => handleStateFieldChange(j.code, 'confidence', e.target.value)}
                            className="w-full text-xs py-1.5 px-2 border border-line rounded-lg font-mono focus:outline-none focus:border-brand-blue bg-white"
                          >
                            {DCM_CONFIDENCE_LEVELS.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </td>

                        <td className="py-2 px-3">
                          <input 
                            type="text"
                            value={rec.keyFinding || rec.classificationRationale || ''}
                            onChange={e => {
                              handleStateFieldChange(j.code, 'keyFinding', e.target.value);
                              handleStateFieldChange(j.code, 'classificationRationale', e.target.value);
                            }}
                            placeholder="Key finding or decision rationale..."
                            className="w-full text-xs p-1.5 border border-line rounded-lg focus:outline-none focus:border-brand-blue bg-white"
                          />
                        </td>

                        <td className="py-2 px-3">
                          <select 
                            value={rec.rightOfResponseStatus || 'Not required'}
                            onChange={e => handleStateFieldChange(j.code, 'rightOfResponseStatus', e.target.value)}
                            className="w-full text-[11px] p-1.5 border border-line rounded-lg font-mono focus:outline-none focus:border-brand-blue bg-white"
                          >
                            {RIGHT_OF_RESPONSE_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-line">
              <div className="text-xs font-mono text-mut">
                Status: <span className="font-bold text-ink">{counts['Open'] + counts['Emerging concern'] + counts['Constrained'] + counts['Severely constrained'] + counts['Insufficient evidence']} / 37</span> States Accounted For
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-xs font-mono font-semibold text-mut hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-6 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-brand-green hover:bg-emerald-700 text-white shadow-sm flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Publication</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Acceptable CSV Format Guide Modal */}
      {showCsvGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-line">
            {/* Modal Header */}
            <div className="p-5 border-b border-line flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-brand-blue">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-ink">
                    Acceptable DCM CSV Format Guide
                  </h3>
                  <p className="text-xs text-mut">
                    Data specification for bulk uploading 37-jurisdiction classifications
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCsvGuide(false)}
                className="p-1.5 text-mut hover:text-ink hover:bg-line rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-ink text-xs">
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-1.5 text-blue-900">
                <div className="font-bold font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5 text-brand-blue">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>37 Jurisdictions Supported</span>
                </div>
                <p className="leading-relaxed">
                  The DCM parser automatically maps all 36 Nigerian States and the Federal Capital Territory (FCT). Rows match either by 2-letter state code (<code className="bg-blue-100 px-1 py-0.5 rounded font-mono font-bold">state_code</code>) or official name (<code className="bg-blue-100 px-1 py-0.5 rounded font-mono font-bold">state_name</code>).
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-mono font-bold text-[11px] uppercase tracking-wider text-mut">
                  Required & Supported CSV Columns
                </h4>
                <div className="border border-line rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-paper border-b border-line text-[10px] font-mono uppercase text-mut">
                      <tr>
                        <th className="py-2.5 px-3">Column Name</th>
                        <th className="py-2.5 px-3">Required?</th>
                        <th className="py-2.5 px-3">Allowed Values / Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line text-xs font-mono">
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-brand-blue">state_code</td>
                        <td className="py-2.5 px-3 text-emerald-700 font-bold">Required*</td>
                        <td className="py-2.5 px-3 text-ink2 font-sans">
                          2-letter state code: e.g. <code className="font-mono bg-paper px-1 rounded">AB</code>, <code className="font-mono bg-paper px-1 rounded">KD</code>, <code className="font-mono bg-paper px-1 rounded">LA</code>, <code className="font-mono bg-paper px-1 rounded">FC</code>. (*Either state_code or state_name is required).
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-brand-blue">state_name</td>
                        <td className="py-2.5 px-3 text-emerald-700 font-bold">Required*</td>
                        <td className="py-2.5 px-3 text-ink2 font-sans">
                          State name: e.g. <code className="font-mono bg-paper px-1 rounded">Abia</code>, <code className="font-mono bg-paper px-1 rounded">Kaduna</code>, <code className="font-mono bg-paper px-1 rounded">Lagos</code>, <code className="font-mono bg-paper px-1 rounded">FCT</code>.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-brand-blue">classification</td>
                        <td className="py-2.5 px-3 text-red-700 font-bold">Required</td>
                        <td className="py-2.5 px-3 text-ink2 font-sans">
                          Accepts full name or single letter code:
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1.5">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#3e9a62]"></span> <strong>Open</strong> or <code className="font-mono">G</code></span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#f6cd5c]"></span> <strong>Emerging concern</strong> or <code className="font-mono">A</code></span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#e5822a]"></span> <strong>Constrained</strong> or <code className="font-mono">O</code></span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#8f1d17]"></span> <strong>Severely constrained</strong> or <code className="font-mono">R</code></span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#c9cdd2]"></span> <strong>Insufficient evidence</strong> or <code className="font-mono">X</code></span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-brand-blue">direction</td>
                        <td className="py-2.5 px-3 text-mut">Optional</td>
                        <td className="py-2.5 px-3 text-ink2 font-sans">
                          Trajectory of competition space: <code className="font-mono bg-paper px-1 rounded">newly-classified</code>, <code className="font-mono bg-paper px-1 rounded">deteriorating</code>, <code className="font-mono bg-paper px-1 rounded">insufficient-basis</code>, <code className="font-mono bg-paper px-1 rounded">improving</code>, <code className="font-mono bg-paper px-1 rounded">stable</code>.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-brand-blue">confidence</td>
                        <td className="py-2.5 px-3 text-mut">Optional</td>
                        <td className="py-2.5 px-3 text-ink2 font-sans">
                          Evidence certainty level: <code className="font-mono bg-paper px-1 rounded">High</code>, <code className="font-mono bg-paper px-1 rounded">Medium</code>, <code className="font-mono bg-paper px-1 rounded">Low</code>.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-brand-blue">key_finding</td>
                        <td className="py-2.5 px-3 text-mut">Optional</td>
                        <td className="py-2.5 px-3 text-ink2 font-sans">
                          Primary observation or incident summary displayed in Flourish hover cards (e.g. tear gas usage, rally denials, assembly access).
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-brand-blue">rationale</td>
                        <td className="py-2.5 px-3 text-mut">Optional</td>
                        <td className="py-2.5 px-3 text-ink2 font-sans">
                          1–3 sentences justifying the assigned classification level.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-brand-blue">evidence_summary</td>
                        <td className="py-2.5 px-3 text-mut">Optional</td>
                        <td className="py-2.5 px-3 text-ink2 font-sans">
                          Summary of incident reports, INEC forms, court rulings, or audit citations.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-brand-blue">right_of_response</td>
                        <td className="py-2.5 px-3 text-mut">Optional</td>
                        <td className="py-2.5 px-3 text-ink2 font-sans">
                          One of: <code className="font-mono text-[10px]">Not required</code>, <code className="font-mono text-[10px]">Requested – Pending</code>, <code className="font-mono text-[10px]">Received & incorporated</code>, <code className="font-mono text-[10px]">Refused / No response</code>.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-paper p-3.5 rounded-xl border border-line space-y-1.5 font-mono text-[11px]">
                <div className="font-bold text-ink text-xs uppercase tracking-wider">Example CSV Snippet:</div>
                <pre className="text-slate-700 whitespace-pre overflow-x-auto p-2 bg-white rounded border border-line">
{`state_code,state_name,classification,direction,confidence,key_finding,rationale,evidence_summary,right_of_response
"KD","Kaduna","Emerging concern","newly-classified","Medium","Police confirm using tear gas at the ADC launch; supporters allege attacks.","Police confirm using tear gas at the ADC launch; supporters allege attacks.","ADC launch incident 28 Sep","Requested"
"BN","Benue","Constrained","deteriorating","High","Systemic access restrictions for opposition observers","Material restrictions across LGAs","Audited in report APEA-2026","Received & incorporated"
"FC","FCT","Open","stable","High","Unimpeded access across all 6 area councils","Full open political competition","Observer report","Not required"`}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-line bg-paper flex items-center justify-between gap-3">
              <span className="text-[11px] font-mono text-mut">
                Click below to download the pre-populated template with all 37 jurisdictions.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCsvGuide(false)}
                  className="px-4 py-2 text-xs font-mono font-semibold text-mut hover:text-ink cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadAcceptableCsv(undefined, 'blank_template')}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase bg-brand-blue hover:bg-brand-blue-dark text-white shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Acceptable CSV Format</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

