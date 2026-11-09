import React, { useState, useEffect } from 'react';
import { 
  Award, FileText, ArrowRight, AlertCircle, Info, CheckCircle2, 
  ExternalLink, ShieldCheck, Download, Layers
} from 'lucide-react';
import { FlourishMap } from './FlourishMap';
import { DcmBriefRequestModal } from './DcmBriefRequestModal';
import { DemocraticCompetitivenessMapNative } from './DemocraticCompetitivenessMapNative';

export const DemocraticCompetitivenessMap: React.FC = () => {
  // Support hidden preview toggle via URL query (?mode=native or ?preview=native)
  const [showNativePreview, setShowNativePreview] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('mode') === 'native' || params.get('preview') === 'native';
    }
    return false;
  });

  useEffect(() => {
    const handleUrlCheck = () => {
      const params = new URLSearchParams(window.location.search);
      setShowNativePreview(params.get('mode') === 'native' || params.get('preview') === 'native');
    };
    window.addEventListener('popstate', handleUrlCheck);
    return () => window.removeEventListener('popstate', handleUrlCheck);
  }, []);

  // Modal for Request DCM Brief
  const [isBriefModalOpen, setIsBriefModalOpen] = useState<boolean>(false);

  // If hidden preview query param is activated, render the new native implementation
  if (showNativePreview) {
    return <DemocraticCompetitivenessMapNative />;
  }

  return (
    <div className="py-12 sm:py-16 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* 1. Header / Intro Block with Official Approved Content */}
        <div className="border-b border-line pb-8 space-y-4">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-brand-blue shrink-0" />
            <span className="text-xs font-mono font-bold tracking-widest text-brand-blue uppercase">
              Athena Election Observatory (AEO)
            </span>
          </div>

          <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-ink leading-tight">
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
            <div className="p-4 bg-amber-50/80 border-l-4 border-amber-500 rounded-r-xl flex items-center gap-3 text-amber-950 font-display font-bold text-base sm:text-lg">
              <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
              <span>The DCM does not score or rank states.</span>
            </div>
          </div>
        </div>

        {/* 2. Primary Embed Map Container (Flourish Visualization) */}
        <div className="bg-white border border-line rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-blue">
                Interactive State-by-State Visualization
              </span>
              <h3 className="font-display font-bold text-xl sm:text-2xl text-ink">
                Nigeria Political Competition Environment
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-ink2 bg-slate-100 px-3 py-1 rounded-md border border-slate-200">
                Official Embed Version (36 States + FCT)
              </span>
            </div>
          </div>

          {/* Flourish Embed */}
          <div className="w-full bg-paper rounded-2xl border border-line p-2 sm:p-4 overflow-hidden">
            <FlourishMap 
              id="30596006"
              height="h-[650px] sm:h-[800px] lg:h-[880px]"
              title="AEO Democratic Competitiveness Map"
            />
          </div>

          {/* Methodology Notice below map */}
          <div className="p-4 bg-slate-50 rounded-xl border border-line text-xs text-ink2 leading-relaxed space-y-1">
            <span className="font-mono font-bold uppercase tracking-wider text-ink block">
              Methodology &amp; Verification Note
            </span>
            <p>
              Classifications are assigned based on documented evidence during defined reporting cycles. Click on any state within the map to inspect its evidentiary breakdown, incident classifications, and regional context.
            </p>
          </div>
        </div>

        {/* 3. Classification Colours Table & Descriptions */}
        <div className="bg-white border border-line rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-line pb-4">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-blue">
              Analytical Framework
            </span>
            <h3 className="font-display font-bold text-xl sm:text-2xl text-ink">
              How do the colours work?
            </h3>
            <p className="text-ink2 text-sm mt-1">
              The DCM uses five colour classifications. The colours are evidence-based and time-bound; they are not permanent labels assigned to states.
            </p>
          </div>

          <div className="overflow-x-auto border border-line rounded-xl">
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
                  <td className="p-4 font-semibold text-ink flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 inline-block shrink-0"></span>
                    Green
                  </td>
                  <td className="p-4 font-bold text-ink">Open</td>
                  <td className="p-4">Affirmative and sufficiently broad evidence indicates broadly equal practical political access during the reporting period, with political actors able to organise, communicate, mobilise and campaign without verified material or discriminatory restrictions. No verified pattern of material restriction remains at the cut-off date. Absence of adverse reporting or insufficient evidence is not, by itself, grounds for a Green classification.</td>
                </tr>
                <tr className="hover:bg-paper/50">
                  <td className="p-4 font-semibold text-ink flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-amber-400 inline-block shrink-0"></span>
                    Amber
                  </td>
                  <td className="p-4 font-bold text-ink">Emerging Concern</td>
                  <td className="p-4">A material incident or early evidence of unequal treatment requires monitoring, but the evidence does not yet establish a sustained or substantial restrictive pattern.</td>
                </tr>
                <tr className="hover:bg-paper/50">
                  <td className="p-4 font-semibold text-ink flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-orange-500 inline-block shrink-0"></span>
                    Orange
                  </td>
                  <td className="p-4 font-bold text-ink">Constrained</td>
                  <td className="p-4">Multiple verified incidents, an identifiable pattern, or an exceptionally serious and well-documented action materially restricts political competition.</td>
                </tr>
                <tr className="hover:bg-paper/50">
                  <td className="p-4 font-semibold text-ink flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-red-600 inline-block shrink-0"></span>
                    Red
                  </td>
                  <td className="p-4 font-bold text-ink">Severely Constrained</td>
                  <td className="p-4">Serious, sustained or systemic restrictions substantially impair political competition, taking into account their severity, reach, institutional authority and consequences.</td>
                </tr>
                <tr className="hover:bg-paper/50">
                  <td className="p-4 font-semibold text-ink flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-300 inline-block shrink-0"></span>
                    Grey
                  </td>
                  <td className="p-4 font-bold text-ink">Insufficient Evidence</td>
                  <td className="p-4">Available evidence is inadequate to make a responsible classification. Importantly, insufficient evidence does not mean that political competition is open.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Methodology Core Panels: What it tracks, seeks to achieve, is not */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-line rounded-2xl p-6 space-y-4 shadow-sm">
            <h4 className="font-display font-bold text-lg text-ink flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-blue" />
              <span>What does it track?</span>
            </h4>
            <ul className="text-xs text-ink2 space-y-2.5 leading-relaxed list-disc pl-4">
              <li><strong>Political Space:</strong> Freedom of association, movement, and unhindered campaign activity.</li>
              <li><strong>Freedom of Expression:</strong> Uninhibited communication and political positioning.</li>
              <li><strong>Administrative Neutrality:</strong> Impartial regulatory actions and equal venue access.</li>
              <li><strong>Security Neutrality:</strong> Non-partisan law enforcement protection across all actors.</li>
              <li><strong>Absence of Coercion:</strong> Freedom from political intimidation, violence, or reprisal.</li>
            </ul>
          </div>

          <div className="bg-white border border-line rounded-2xl p-6 space-y-4 shadow-sm">
            <h4 className="font-display font-bold text-lg text-ink flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>What does it seek to achieve?</span>
            </h4>
            <ul className="text-xs text-ink2 space-y-2.5 leading-relaxed list-disc pl-4">
              <li>Evidence-based assessment of pre-election environment across Nigeria.</li>
              <li>Early identification of emerging pressure points before election day.</li>
              <li>Tracking longitudinal changes across continuous monitoring windows.</li>
              <li>Complete evidentiary transparency and traceable incident citations.</li>
              <li>Constructive engagement with institutions to safeguard political competition.</li>
            </ul>
          </div>

          <div className="bg-white border border-line rounded-2xl p-6 space-y-4 shadow-sm">
            <h4 className="font-display font-bold text-lg text-ink flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span>What is it not?</span>
            </h4>
            <ul className="text-xs text-ink2 space-y-2.5 leading-relaxed list-disc pl-4">
              <li>Does not rank states or political parties numerically.</li>
              <li>Does not assign numerical scores, weights or composite values.</li>
              <li>Does not measure political popularity or predict election outcomes.</li>
              <li>Does not treat unverified allegations as established facts.</li>
              <li>Does not equate lack of evidence with an open environment.</li>
            </ul>
          </div>
        </div>

        {/* 5. Request DCM Brief CTA */}
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-2xl p-8 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-brand-blue text-xs font-mono font-bold uppercase tracking-widest">
              <FileText className="w-4 h-4" />
              <span>Official Analytical Release</span>
            </div>
            <h3 className="font-display font-bold text-2xl text-white">
              Request Complete DCM Analytical Brief &amp; Evidence Matrix
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Access the complete evidentiary dossier, legal filings, police logs, and primary source citations underlying the 37-jurisdiction classifications.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsBriefModalOpen(true)}
            className="px-6 py-3 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shrink-0 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Request Full Brief</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* DCM Brief Request Modal */}
      <DcmBriefRequestModal
        isOpen={isBriefModalOpen}
        onClose={() => setIsBriefModalOpen(false)}
        publicationTitle="Democratic Competitiveness Map (DCM)"
        reportingPeriod="Current Active Cycle"
      />
    </div>
  );
};

export default DemocraticCompetitivenessMap;
