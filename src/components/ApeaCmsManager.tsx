import React, { useState } from 'react';
import { 
  FileText, Plus, Edit3, Trash2, Download, Upload, CheckCircle2, 
  AlertCircle, ShieldCheck, RefreshCcw, Sparkles, Loader2, Link as LinkIcon
} from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import { ApeaAudit, ApeaPublicReportFile, ApeaReportDetail } from '../data/apeaData';
import { compressImageFile } from '../lib/firebaseAssets';

interface ApeaCmsManagerProps {
  onStatusMsg?: (msg: string, type?: 'success' | 'error') => void;
}

export function ApeaCmsManager({ onStatusMsg }: ApeaCmsManagerProps) {
  const { 
    apeaAudits, 
    apeaPublicReports, 
    apeaReportInfo, 
    saveApeaAudit, 
    deleteApeaAudit, 
    saveApeaReportPdf, 
    saveApeaReportInfo,
    resetApeaData
  } = useCMS();

  const [activeSubTab, setActiveSubTab] = useState<'reports' | 'audits' | 'details'>('reports');
  const [selectedCode, setSelectedCode] = useState<string>('AN');
  const [isEditingAudit, setIsEditingAudit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // PDF Form State
  const activeReportFile = apeaPublicReports[selectedCode] || {
    uri: `/${selectedCode}_APEA_Public_Report.pdf`,
    name: `${selectedCode}_APEA_Public_Report.pdf`,
    label: 'PDF · APAF'
  };
  const [pdfUri, setPdfUri] = useState(activeReportFile.uri);
  const [pdfName, setPdfName] = useState(activeReportFile.name);
  const [pdfLabel, setPdfLabel] = useState(activeReportFile.label);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Sync state when selected audit changes
  React.useEffect(() => {
    const file = apeaPublicReports[selectedCode] || {
      uri: `/${selectedCode}_APEA_Public_Report.pdf`,
      name: `${selectedCode}_APEA_Public_Report.pdf`,
      label: 'PDF · APAF'
    };
    setPdfUri(file.uri);
    setPdfName(file.name);
    setPdfLabel(file.label);
    setPdfError(null);
  }, [selectedCode, apeaPublicReports]);

  // Audit Form State
  const activeAudit = apeaAudits.find(a => a.code === selectedCode) || apeaAudits[0];
  const [auditForm, setAuditForm] = useState<Partial<ApeaAudit>>(activeAudit || {});

  React.useEffect(() => {
    if (activeAudit) {
      setAuditForm(activeAudit);
    }
  }, [selectedCode, apeaAudits]);

  // Report Detail Form State
  const activeDetail = apeaReportInfo[selectedCode] || { findings: [], limitations: [] };
  const [findingsText, setFindingsText] = useState((activeDetail.findings || []).join('\n'));
  const [limitationsText, setLimitationsText] = useState((activeDetail.limitations || []).join('\n'));
  const [materialityLabel, setMaterialityLabel] = useState(activeDetail.materialityLabel || '');
  const [stressTitle, setStressTitle] = useState(activeDetail.stress?.title || '');
  const [stressConclusion, setStressConclusion] = useState(activeDetail.stress?.conclusion || '');

  React.useEffect(() => {
    const d = apeaReportInfo[selectedCode] || { findings: [], limitations: [] };
    setFindingsText((d.findings || []).join('\n'));
    setLimitationsText((d.limitations || []).join('\n'));
    setMaterialityLabel(d.materialityLabel || '');
    setStressTitle(d.stress?.title || '');
    setStressConclusion(d.stress?.conclusion || '');
  }, [selectedCode, apeaReportInfo]);

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    if (onStatusMsg) onStatusMsg(msg, type);
  };

  // PDF Upload Handler
  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > 15.0) {
      setPdfError(`PDF file is too large (${sizeMB.toFixed(1)}MB). Max 15MB for direct upload.`);
      return;
    }
    setPdfError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setPdfUri(result);
        setPdfName(file.name);
        notify(`Selected ${file.name} for ${selectedCode} audit report.`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSavePdfReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfUri) {
      notify('Please provide a PDF file URL or upload a file.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const reportFile: ApeaPublicReportFile = {
        uri: pdfUri,
        name: pdfName || `${selectedCode}_Report.pdf`,
        label: pdfLabel || 'PDF · APAF'
      };
      await saveApeaReportPdf(selectedCode, reportFile);
      notify(`PDF Report for ${selectedCode} saved successfully!`);
    } catch (err: any) {
      notify(`Failed to save PDF report: ${err?.message || 'Database error'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestDownloadPdf = async () => {
    try {
      const res = await fetch(pdfUri);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = pdfName || `${selectedCode}_Report.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      notify(`Downloading ${pdfName}...`);
    } catch (err: any) {
      notify(`Testing download: opening PDF link (${err?.message || 'Direct fetch'})`, 'error');
      window.open(pdfUri, '_blank');
    }
  };

  const handleSaveAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditForm.code || !auditForm.state || !auditForm.title) {
      notify('State code, title, and state name are required.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const code = auditForm.code.toUpperCase().trim();
      const updatedAudit: ApeaAudit = {
        ...activeAudit,
        ...auditForm,
        code,
        year: Number(auditForm.year) || 2025,
        total: Number(auditForm.total) || 0,
        compliant: Number(auditForm.compliant) || 0,
        noncompliant: Number(auditForm.noncompliant) || 0,
        excluded: Number(auditForm.excluded) || 0,
        assessable: Number(auditForm.assessable) || 0,
        materiality: {
          overVotingMagnitude: Number(auditForm.materiality?.overVotingMagnitude) || 0,
          declaredMargin: Number(auditForm.materiality?.declaredMargin) || 0,
          ratioPct: auditForm.materiality?.ratioPct ?? null,
          note: auditForm.materiality?.note || ''
        }
      };

      await saveApeaAudit(updatedAudit);
      setIsEditingAudit(false);
      notify(`State Audit "${updatedAudit.title}" saved successfully!`);
    } catch (err: any) {
      notify(`Failed to save state audit: ${err?.message || 'Database error'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveReportInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const findings = findingsText.split('\n').map(s => s.trim()).filter(Boolean);
      const limitations = limitationsText.split('\n').map(s => s.trim()).filter(Boolean);

      const existingInfo = apeaReportInfo[selectedCode] || {};
      const updatedDetail: ApeaReportDetail = {
        ...existingInfo,
        findings,
        limitations,
        materialityLabel: materialityLabel.trim() || undefined,
        stress: {
          ...existingInfo.stress,
          title: stressTitle.trim() || undefined,
          conclusion: stressConclusion.trim() || undefined
        }
      };

      await saveApeaReportInfo(selectedCode, updatedDetail);
      notify(`Findings & details for ${selectedCode} updated!`);
    } catch (err: any) {
      notify(`Failed to save report details: ${err?.message || 'Database error'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetApeaData = async () => {
    if (window.confirm('Reset all APEA election audits and PDF report links to system defaults?')) {
      setIsSaving(true);
      try {
        await resetApeaData();
        notify('APEA CMS reset to default hardcoded datasets.');
      } catch (err: any) {
        notify(`Reset failed: ${err?.message || 'Database error'}`, 'error');
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-display tracking-tight text-white">APEA Audit &amp; PDF CMS</h2>
            <p className="text-xs text-slate-400 font-mono">Manage election audits, PDF public reports, and forensic findings</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetApeaData}
            disabled={isSaving}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg transition-colors border border-slate-700 flex items-center gap-1.5"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* State Audit Selector Pills */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
        <span className="text-xs font-mono text-slate-500 font-bold px-2">SELECT STATE AUDIT:</span>
        {apeaAudits.map((a) => {
          const isSel = a.code === selectedCode;
          const report = apeaPublicReports[a.code];
          return (
            <button
              key={a.code}
              type="button"
              onClick={() => setSelectedCode(a.code)}
              className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-2 ${
                isSel
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <span>{a.code} ({a.state} {a.year})</span>
              {report?.uri && (
                <span className={`w-2 h-2 rounded-full ${isSel ? 'bg-green-400' : 'bg-green-500'}`} title="PDF Report Attached" />
              )}
            </button>
          );
        })}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          type="button"
          onClick={() => setActiveSubTab('reports')}
          className={`pb-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
            activeSubTab === 'reports'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>PDF Reports Manager</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('audits')}
          className={`pb-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
            activeSubTab === 'audits'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>Audit Metrics &amp; Metadata</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('details')}
          className={`pb-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
            activeSubTab === 'details'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Key Findings &amp; Stress Tests</span>
        </button>
      </div>

      {/* SUB-TAB 1: PDF REPORTS MANAGER */}
      {activeSubTab === 'reports' && (
        <form onSubmit={handleSavePdfReport} className="bg-white p-6 rounded-xl border border-slate-200 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-900 uppercase">
                Attached PDF Report for {activeAudit?.state} ({selectedCode}) {activeAudit?.year}
              </h3>
              <p className="text-xs text-slate-500">
                This PDF file is attached to the &quot;Download Report&quot; buttons on the APEA Observatory dashboard and Publications page.
              </p>
            </div>
            {pdfUri && (
              <button
                type="button"
                onClick={handleTestDownloadPdf}
                className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-mono font-bold rounded-lg border border-green-200 flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Test Download PDF</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">PDF File Path or Web URL</label>
              <input
                type="text"
                value={pdfUri}
                onChange={(e) => setPdfUri(e.target.value)}
                placeholder="/Anambra_2025_APEA_Public_Report.pdf"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-slate-50 font-mono focus:bg-white focus:border-blue-500 transition-colors"
                required
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Local public path (e.g., <code>/Anambra_2025_APEA_Public_Report.pdf</code>) or direct URL.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Download Filename</label>
              <input
                type="text"
                value={pdfName}
                onChange={(e) => setPdfName(e.target.value)}
                placeholder="Anambra_2025_APEA_Public_Report.pdf"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-slate-50 font-mono focus:bg-white focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Display Badge Label</label>
              <input
                type="text"
                value={pdfLabel}
                onChange={(e) => setPdfLabel(e.target.value)}
                placeholder="PDF · APAF Version 4"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-slate-50 font-mono focus:bg-white focus:border-blue-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Upload New PDF File</label>
              <label className="flex items-center justify-center border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-lg h-10 cursor-pointer bg-slate-50 hover:bg-blue-50 text-xs font-mono font-bold text-slate-600 transition-colors">
                <Upload className="w-4 h-4 mr-2 text-blue-600" />
                <span>Choose Local PDF File</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfFileChange}
                  className="hidden"
                />
              </label>
              {pdfError && <span className="text-[10px] font-mono text-red-600 mt-1 block font-bold">{pdfError}</span>}
            </div>
          </div>

          {pdfUri && pdfUri.startsWith('data:') && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs font-mono text-blue-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Base64 encoded PDF loaded successfully into form! Click Save to store in Firestore.</span>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-xs rounded-lg shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              <span>Save PDF Report Attachment</span>
            </button>
          </div>
        </form>
      )}

      {/* SUB-TAB 2: AUDIT METRICS & METADATA */}
      {activeSubTab === 'audits' && (
        <form onSubmit={handleSaveAudit} className="bg-white p-6 rounded-xl border border-slate-200 space-y-6 shadow-sm">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold font-mono text-slate-900 uppercase">
              Audit Data for {activeAudit?.state} ({selectedCode})
            </h3>
            <p className="text-xs text-slate-500">
              Edit quantitative polling unit counts, integrity classification, and materiality values.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">State Code</label>
              <input
                type="text"
                value={auditForm.code || ''}
                onChange={(e) => setAuditForm({ ...auditForm, code: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-slate-50 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">State Name</label>
              <input
                type="text"
                value={auditForm.state || ''}
                onChange={(e) => setAuditForm({ ...auditForm, state: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-slate-50 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Election Year</label>
              <input
                type="number"
                value={auditForm.year || 2025}
                onChange={(e) => setAuditForm({ ...auditForm, year: Number(e.target.value) })}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-slate-50 font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Audit Title</label>
              <input
                type="text"
                value={auditForm.title || ''}
                onChange={(e) => setAuditForm({ ...auditForm, title: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-slate-50 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Methodology</label>
              <input
                type="text"
                value={auditForm.methodology || ''}
                onChange={(e) => setAuditForm({ ...auditForm, methodology: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-slate-50 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1 font-mono">Public Integrity Category</label>
            <select
              value={auditForm.publicIntegrityCategory || ''}
              onChange={(e) => setAuditForm({ ...auditForm, publicIntegrityCategory: e.target.value })}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-slate-50 font-mono"
            >
              <option value="Adequate Integrity — Improvement Required">Adequate Integrity — Improvement Required</option>
              <option value="Adequate Integrity">Adequate Integrity</option>
              <option value="Significant Integrity Deficits — Reconciled Return">Significant Integrity Deficits — Reconciled Return</option>
              <option value="Significant Integrity Deficits — Discrepancies Exceed Margin">Significant Integrity Deficits — Discrepancies Exceed Margin</option>
              <option value="High Integrity">High Integrity</option>
            </select>
          </div>

          {/* Polling Unit Counts */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 font-mono">
            <h4 className="text-xs font-bold text-slate-800 uppercase">Polling Unit Counts</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Total PUs</label>
                <input
                  type="number"
                  value={auditForm.total || 0}
                  onChange={(e) => setAuditForm({ ...auditForm, total: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Assessable PUs</label>
                <input
                  type="number"
                  value={auditForm.assessable || 0}
                  onChange={(e) => setAuditForm({ ...auditForm, assessable: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Compliant PUs</label>
                <input
                  type="number"
                  value={auditForm.compliant || 0}
                  onChange={(e) => setAuditForm({ ...auditForm, compliant: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Non-Compliant PUs</label>
                <input
                  type="number"
                  value={auditForm.noncompliant || 0}
                  onChange={(e) => setAuditForm({ ...auditForm, noncompliant: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Excluded PUs</label>
                <input
                  type="number"
                  value={auditForm.excluded || 0}
                  onChange={(e) => setAuditForm({ ...auditForm, excluded: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded bg-white"
                />
              </div>
            </div>
          </div>

          {/* Materiality Inputs */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 font-mono">
            <h4 className="text-xs font-bold text-slate-800 uppercase">Outcome Materiality</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Over-Voting Magnitude (Votes)</label>
                <input
                  type="number"
                  value={auditForm.materiality?.overVotingMagnitude || 0}
                  onChange={(e) => setAuditForm({
                    ...auditForm,
                    materiality: {
                      ...auditForm.materiality,
                      overVotingMagnitude: Number(e.target.value),
                      declaredMargin: auditForm.materiality?.declaredMargin || 0,
                      ratioPct: auditForm.materiality?.ratioPct ?? null,
                      note: auditForm.materiality?.note || ''
                    }
                  })}
                  className="w-full p-2 border border-slate-300 rounded bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Declared Margin (Votes)</label>
                <input
                  type="number"
                  value={auditForm.materiality?.declaredMargin || 0}
                  onChange={(e) => setAuditForm({
                    ...auditForm,
                    materiality: {
                      ...auditForm.materiality,
                      overVotingMagnitude: auditForm.materiality?.overVotingMagnitude || 0,
                      declaredMargin: Number(e.target.value),
                      ratioPct: auditForm.materiality?.ratioPct ?? null,
                      note: auditForm.materiality?.note || ''
                    }
                  })}
                  className="w-full p-2 border border-slate-300 rounded bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Ratio (% of Margin)</label>
                <input
                  type="number"
                  value={auditForm.materiality?.ratioPct ?? ''}
                  onChange={(e) => setAuditForm({
                    ...auditForm,
                    materiality: {
                      ...auditForm.materiality,
                      overVotingMagnitude: auditForm.materiality?.overVotingMagnitude || 0,
                      declaredMargin: auditForm.materiality?.declaredMargin || 0,
                      ratioPct: e.target.value === '' ? null : Number(e.target.value),
                      note: auditForm.materiality?.note || ''
                    }
                  })}
                  placeholder="e.g. 14"
                  className="w-full p-2 border border-slate-300 rounded bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">Spread Verdict</label>
              <input
                type="text"
                value={auditForm.spreadVerdict || ''}
                onChange={(e) => setAuditForm({ ...auditForm, spreadVerdict: e.target.value })}
                placeholder="e.g. APGA ≥25% in 21 / 21 LGAs (14 required)"
                className="w-full p-2 border border-slate-300 rounded bg-white text-xs"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-xs rounded-lg shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Save State Audit Metrics</span>
            </button>
          </div>
        </form>
      )}

      {/* SUB-TAB 3: KEY FINDINGS & REPORT DETAILS */}
      {activeSubTab === 'details' && (
        <form onSubmit={handleSaveReportInfo} className="bg-white p-6 rounded-xl border border-slate-200 space-y-6 shadow-sm">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold font-mono text-slate-900 uppercase">
              Key Findings &amp; Stress Tests for {activeAudit?.state} ({selectedCode})
            </h3>
            <p className="text-xs text-slate-500">
              Edit the text bullet points displayed on the APEA audit dashboard overview.
            </p>
          </div>

          <div className="space-y-4 font-mono">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Key Audit Findings (One bullet point per line)
              </label>
              <textarea
                value={findingsText}
                onChange={(e) => setFindingsText(e.target.value)}
                rows={5}
                className="w-full text-xs p-3 border border-slate-300 rounded-lg bg-slate-50 font-mono"
                placeholder="93.5% of assessable polling units complied..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Audit Limitations (One item per line)
              </label>
              <textarea
                value={limitationsText}
                onChange={(e) => setLimitationsText(e.target.value)}
                rows={4}
                className="w-full text-xs p-3 border border-slate-300 rounded-lg bg-slate-50 font-mono"
                placeholder="Ballot accounting is not assessable because..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Stress Test Title</label>
                <input
                  type="text"
                  value={stressTitle}
                  onChange={(e) => setStressTitle(e.target.value)}
                  placeholder="Constitutional spread"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-slate-50 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Materiality Label</label>
                <input
                  type="text"
                  value={materialityLabel}
                  onChange={(e) => setMaterialityLabel(e.target.value)}
                  placeholder="Votes recorded in all 368 non-compliant PUs"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-slate-50 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Stress Test Conclusion</label>
              <textarea
                value={stressConclusion}
                onChange={(e) => setStressConclusion(e.target.value)}
                rows={3}
                className="w-full text-xs p-3 border border-slate-300 rounded-lg bg-slate-50 font-mono"
                placeholder="The 25% spread requirement is satisfied with a wide margin..."
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-xs rounded-lg shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Save Findings &amp; Stress Tests</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
