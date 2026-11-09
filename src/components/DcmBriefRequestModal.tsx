import React, { useState } from 'react';
import { X, Send, CheckCircle2, AlertCircle, Loader2, ShieldCheck, FileText } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface DcmBriefRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  publicationTitle: string;
  reportingPeriod: string;
}

export const DcmBriefRequestModal: React.FC<DcmBriefRequestModalProps> = ({
  isOpen,
  onClose,
  publicationTitle,
  reportingPeriod
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [sector, setSector] = useState('Civil Society / Non-Governmental');
  const [intendedUse, setIntendedUse] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!organisation.trim()) {
      setError('Please state your organisation or institutional affiliation.');
      return;
    }
    if (!consent) {
      setError('You must accept the data processing terms to receive the brief.');
      return;
    }

    try {
      setSubmitting(true);
      await addDoc(collection(db, 'dcm_brief_requests'), {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        organisation: organisation.trim(),
        sector,
        intendedUse: intendedUse.trim(),
        publicationTitle,
        reportingPeriod,
        requestedAt: new Date().toISOString(),
        timestamp: Date.now(),
        status: 'new'
      });
      setSubmitted(true);
    } catch (err: any) {
      console.error('Error submitting DCM Brief request:', err);
      setError('Failed to submit your request. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setName('');
    setEmail('');
    setOrganisation('');
    setIntendedUse('');
    setConsent(false);
    setSubmitted(false);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/75 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl border border-line shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dcm-request-title"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold tracking-widest text-brand-blue uppercase bg-brand-blue/20 px-2 py-0.5 rounded">
                Official Access
              </span>
              <span className="text-[10px] font-mono text-slate-300">
                AEO Research Directorate
              </span>
            </div>
            <h3 id="dcm-request-title" className="font-display font-bold text-lg sm:text-xl text-white">
              Request Full DCM Brief
            </h3>
            <p className="text-xs text-blue-200 mt-1">
              {publicationTitle} ({reportingPeriod})
            </p>
          </div>
          <button
            onClick={resetAndClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-ink">
          {submitted ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-display font-bold text-xl text-ink">
                Request Registered Successfully
              </h4>
              <p className="text-sm text-ink2 max-w-md mx-auto leading-relaxed">
                Thank you, <strong className="text-ink">{name}</strong>. Your request for the comprehensive Democratic Competitiveness Map Brief has been transmitted to the Athena Election Observatory research desk. The publication file and methodology annex will be delivered to <strong className="text-ink">{email}</strong>.
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="px-6 py-2.5 bg-brand-blue text-white rounded-lg text-sm font-bold hover:bg-brand-blue-dark transition-colors"
                >
                  Return to DCM Map
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-ink2 leading-relaxed">
                The comprehensive DCM Brief provides verified decision records, supporting evidence references, state-level analysis and methodology notes for institutional observers and researchers.
              </p>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-ink block">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Ngozi Adebayo"
                  className="w-full px-3.5 py-2 text-sm border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-ink block">
                  Official Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. n.adebayo@institution.org"
                  className="w-full px-3.5 py-2 text-sm border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-ink block">
                    Organisation / Entity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={organisation}
                    onChange={(e) => setOrganisation(e.target.value)}
                    placeholder="e.g. National Civic Coalition"
                    className="w-full px-3.5 py-2 text-sm border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-ink block">
                    Sector
                  </label>
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue bg-white"
                  >
                    <option value="Civil Society / Non-Governmental">Civil Society / NGO</option>
                    <option value="Media & Journalism">Media & Journalism</option>
                    <option value="Diplomatic & International Mission">Diplomatic Mission</option>
                    <option value="Academic & Policy Research">Academic & Research</option>
                    <option value="Political Party / Candidate Directorate">Political Party / Candidate</option>
                    <option value="Government & Electoral Management">Government & EMB</option>
                    <option value="Legal & Human Rights">Legal & Human Rights</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-ink block">
                  Intended Research Purpose (Optional)
                </label>
                <textarea
                  rows={2}
                  value={intendedUse}
                  onChange={(e) => setIntendedUse(e.target.value)}
                  placeholder="e.g. Academic analysis of pre-election assembly restrictions ahead of 2027"
                  className="w-full px-3.5 py-2 text-sm border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue bg-white"
                />
              </div>

              {/* Consent and Privacy */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
                  />
                  <span className="text-xs text-ink2 leading-relaxed">
                    I confirm this request is for professional or research purposes. I agree to the processing of my contact information in accordance with the{' '}
                    <a 
                      href="/privacy" 
                      onClick={(e) => {
                        e.preventDefault();
                        window.history.pushState({}, '', '/privacy');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                        resetAndClose();
                      }}
                      className="text-brand-blue font-semibold hover:underline"
                    >
                      Athena Centre &amp; AEO Privacy Policy
                    </a>.
                  </span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-line">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="px-4 py-2 border border-line rounded-lg text-xs font-semibold text-ink2 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Request Brief</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default DcmBriefRequestModal;
