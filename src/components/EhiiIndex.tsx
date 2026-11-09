import { ArrowLeft, Award } from 'lucide-react';

export default function EhiiIndex() {
  const navigateToHome = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="py-16 sm:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back to Home */}
        <div className="mb-8">
          <button 
            onClick={navigateToHome}
            className="inline-flex items-center gap-2 text-xs font-bold font-mono tracking-wider text-brand-blue hover:text-brand-blue-dark transition-colors cursor-pointer uppercase"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>

        {/* Heading */}
        <div className="text-center sm:text-left mb-12">
          <div className="flex flex-wrap items-center gap-3 mb-2 justify-center sm:justify-start">
            <span className="eyebrow text-brand-purple font-semibold uppercase tracking-widest text-xs">
              Electoral Honor &amp; Integrity Index
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono tracking-wider bg-amber-50 text-amber-800 border border-amber-200 uppercase animate-pulse">
              Coming Soon
            </span>
          </div>
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-ink mt-3 mb-6 leading-tight">
            EHII Index
          </h1>
          <p className="text-ink2 text-base sm:text-lg max-w-2xl leading-relaxed">
            An independent, data-driven framework scoring sub-national and national elections across Africa. The EHII Index aggregates BVAS compliance, result-form fidelity, and collation speed into a single verifiability score.
          </p>
        </div>

        {/* Empty state / Under construction info */}
        <div className="bg-white border border-line rounded-2xl p-8 sm:p-12 shadow-custom text-center sm:text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-amber-500 text-white font-mono text-[10px] font-bold px-4 py-1 rounded-bl uppercase tracking-wider">
            Coming Soon
          </div>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
              <Award className="w-7 h-7 text-brand-purple" />
            </div>
            <div className="space-y-4">
              <h3 className="font-display font-bold text-xl text-ink">
                Registry Index Under Formulation
              </h3>
              <p className="text-ink2 text-sm leading-relaxed">
                Our strategic research panel is currently aggregating data points from the recent Ekiti, Ondo, and Anambra off-cycle governorship polls. The complete comparative matrix, weighting factors, and methodology whitepapers will be published here upon completion.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="p-4 bg-panel rounded-xl border border-line">
                  <span className="block font-mono text-xs text-mut font-bold uppercase tracking-wider mb-1">
                    Indicator 1
                  </span>
                  <span className="block font-display font-bold text-base text-ink">
                    BVAS Accreditation
                  </span>
                </div>
                <div className="p-4 bg-panel rounded-xl border border-line">
                  <span className="block font-mono text-xs text-mut font-bold uppercase tracking-wider mb-1">
                    Indicator 2
                  </span>
                  <span className="block font-display font-bold text-base text-ink">
                    IReV Upload Speed
                  </span>
                </div>
                <div className="p-4 bg-panel rounded-xl border border-line">
                  <span className="block font-mono text-xs text-mut font-bold uppercase tracking-wider mb-1">
                    Indicator 3
                  </span>
                  <span className="block font-display font-bold text-base text-ink">
                    arithmetic fidelity
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
