import { 
  ArrowLeft, Calendar, MapPin, Users, Landmark, ShieldCheck, CheckCircle2, 
  AlertCircle, ExternalLink, Award, FileText, ChevronRight 
} from 'lucide-react';
import { DiaryItem } from '../types';
import { PartyLogo } from './PartyLogo';

interface DiaryElectionDetailProps {
  item: DiaryItem;
  onBack: () => void;
  onNavigateToElection?: (code: string) => void;
}

export default function DiaryElectionDetail({ 
  item, 
  onBack, 
  onNavigateToElection 
}: DiaryElectionDetailProps) {
  const getStatusBadge = (status: DiaryItem['status']) => {
    switch (status) {
      case 'In view':
        return 'bg-amber-500/10 text-amber-700 border-amber-300 font-bold';
      case 'Scheduled':
        return 'bg-blue-500/10 text-blue-700 border-blue-300 font-bold';
      case 'Provisional':
        return 'bg-purple-500/10 text-brand-purple border-purple-300 font-bold';
      case 'Tracking':
        return 'bg-slate-500/10 text-slate-700 border-slate-300 font-bold';
      case 'Concluded':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-300 font-bold';
    }
  };

  const getRegionLabel = () => {
    if (item.region === 'nigeria') {
      if (item.type === 'presidential') return 'Nigeria · Federal Presidential Poll';
      if (item.type === 'governorship') return 'Nigeria · State Governorship Poll';
      if (item.type === 'local_government') return 'Nigeria · Local Government Area Poll';
      return 'Nigeria · Electoral Poll';
    }
    if (item.region === 'africa') return 'Africa · Continental Election';
    if (item.region === 'other') return 'International · Continental Election';
    return item.subtitle;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Bar Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-brand-blue hover:text-brand-blue-dark bg-blue-50/80 hover:bg-blue-100/80 px-4 py-2 rounded-xl border border-blue-200 transition-all cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Election Diary
        </button>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider border ${getStatusBadge(item.status)}`}>
            Status: {item.status}
          </span>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-3xl border border-line p-6 sm:p-8 shadow-custom relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-brand-blue/5 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-semibold text-brand-blue uppercase tracking-widest">
            <MapPin className="w-4 h-4 text-brand-blue" />
            <span>{getRegionLabel()}</span>
            {item.country && (
              <>
                <span>•</span>
                <span className="text-slate-600">{item.country}</span>
              </>
            )}
          </div>

          <h1 className="font-display font-bold text-2xl sm:text-4xl text-ink leading-tight">
            {item.title}
          </h1>

          <p className="text-sm sm:text-base text-ink2 max-w-4xl leading-relaxed">
            {item.description || item.subtitle}
          </p>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-line/60">
            <div className="bg-paper/80 p-3.5 rounded-2xl border border-line/80 space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-mut block">
                Election Date
              </span>
              <span className="text-sm font-bold text-ink flex items-center gap-1.5 font-mono">
                <Calendar className="w-4 h-4 text-brand-blue" />
                {item.date}
              </span>
            </div>

            <div className="bg-paper/80 p-3.5 rounded-2xl border border-line/80 space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-mut block">
                Electoral Commission
              </span>
              <span className="text-xs font-bold text-ink flex items-center gap-1.5 line-clamp-1">
                <Landmark className="w-4 h-4 text-emerald-600" />
                {item.electoralBody || (item.country === 'Nigeria' ? 'INEC' : 'Electoral Commission')}
              </span>
            </div>

            <div className="bg-paper/80 p-3.5 rounded-2xl border border-line/80 space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-mut block">
                Registered Voters
              </span>
              <span className="text-xs font-bold font-mono text-ink flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-600" />
                {item.registeredVoters || 'N/A'}
              </span>
            </div>

            <div className="bg-paper/80 p-3.5 rounded-2xl border border-line/80 space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-mut block">
                Polling Units / Scope
              </span>
              <span className="text-xs font-bold font-mono text-ink flex items-center gap-1.5 line-clamp-1">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                {item.pollingUnits || item.lgasCount || 'Statewide / Regional'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout: Sitting Executive & Candidates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Sitting Executive & Key Info */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Sitting Executive Card */}
          {item.sittingExecutive ? (
            <div className="bg-white rounded-3xl border border-line p-6 shadow-custom space-y-4">
              <div className="flex items-center justify-between border-b border-line/80 pb-3">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Sitting Executive
                </span>
                <PartyLogo name={item.sittingExecutive.party} className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-bold text-xl text-ink">
                  {item.sittingExecutive.name}
                </h3>
                <p className="text-xs font-medium text-brand-blue bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 inline-block">
                  {item.sittingExecutive.title}
                </p>
              </div>

              <div className="space-y-2 text-xs text-ink2 bg-paper/60 p-4 rounded-2xl border border-line/60">
                <div className="flex justify-between py-1 border-b border-line/40">
                  <span className="text-mut font-medium">Party Affiliation:</span>
                  <strong className="text-ink font-mono">{item.sittingExecutive.party}</strong>
                </div>
                {item.sittingExecutive.assumedOffice && (
                  <div className="flex justify-between py-1 border-b border-line/40">
                    <span className="text-mut font-medium">Assumed Office:</span>
                    <span className="text-ink font-mono">{item.sittingExecutive.assumedOffice}</span>
                  </div>
                )}
                {item.sittingExecutive.termInfo && (
                  <div className="flex justify-between py-1">
                    <span className="text-mut font-medium">Current Tenure:</span>
                    <span className="text-ink font-mono">{item.sittingExecutive.termInfo}</span>
                  </div>
                )}
              </div>

              {item.sittingExecutive.notes && (
                <p className="text-xs text-mut italic bg-amber-50/50 p-3 rounded-xl border border-amber-100 leading-relaxed">
                  "{item.sittingExecutive.notes}"
                </p>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-line p-6 shadow-custom text-center space-y-2">
              <Award className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="font-bold text-sm text-ink">Sitting Executive Info</h4>
              <p className="text-xs text-mut">Incumbent administration details being verified by Athena monitors.</p>
            </div>
          )}

          {/* Observatory Mission Card */}
          <div className="bg-navy text-white rounded-3xl p-6 shadow-custom space-y-4 relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-blue-300 border-b border-blue-800/80 pb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Athena Observatory Mission
            </div>

            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              {item.monitoringMission || 'Athena Election Observatory deploys independent, non-partisan field observers to audit voter accreditation, official result form uploads, and collation pipeline integrity.'}
            </p>

            {item.stateCode && onNavigateToElection && (
              <button
                onClick={() => onNavigateToElection(item.stateCode!)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white text-navy font-mono font-bold text-xs uppercase tracking-wider rounded-2xl hover:bg-blue-50 transition-colors shadow-md cursor-pointer"
              >
                <span>View Live State Election Audit ({item.stateCode})</span>
                <ChevronRight className="w-4 h-4 text-navy" />
              </button>
            )}
          </div>

        </div>

        {/* Right Column: Candidates & Key Integrity Issues */}
        <div className="lg:col-span-7 space-y-6">

          {/* Candidates Matrix */}
          <div className="bg-white rounded-3xl border border-line p-6 shadow-custom space-y-4">
            <div className="flex items-center justify-between border-b border-line/80 pb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-blue" />
                Participants & Key Candidates
              </span>
              <span className="text-[10px] font-mono text-mut">
                {item.participants?.length || 0} Key Flagbearers Listed
              </span>
            </div>

            {item.participants && item.participants.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {item.participants.map((cand, idx) => (
                  <div 
                    key={idx}
                    className="p-4 rounded-2xl bg-paper/60 border border-line hover:border-brand-blue/40 transition-colors space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-ink leading-tight">
                          {cand.name}
                        </h4>
                        <span className="text-[11px] font-mono text-mut block mt-0.5">
                          {cand.role || 'Candidate'}
                        </span>
                      </div>
                      <PartyLogo name={cand.party} className="w-7 h-7" />
                    </div>

                    {cand.platform && (
                      <div className="text-[11px] text-ink2 bg-white/80 p-2.5 rounded-xl border border-line/50 leading-relaxed">
                        <strong className="text-slate-600 block text-[9px] uppercase font-mono tracking-wider mb-0.5">
                          Key Campaign Focus:
                        </strong>
                        {cand.platform}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-mut bg-paper/40 rounded-2xl border border-dashed border-line">
                Candidate registrations undergoing official {item.electoralBody ? item.electoralBody : 'electoral commission'} verification.
              </div>
            )}
          </div>

          {/* Key Integrity & Audit Issues */}
          {item.keyIssues && item.keyIssues.length > 0 && (
            <div className="bg-white rounded-3xl border border-line p-6 shadow-custom space-y-4">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 border-b border-line/80 pb-3">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Key Electoral Issues & Observatory Focus Points
              </span>

              <div className="space-y-2.5">
                {item.keyIssues.map((issue, idx) => (
                  <div 
                    key={idx}
                    className="flex items-start gap-3 p-3 bg-amber-50/40 border border-amber-200/60 rounded-xl text-xs text-ink"
                  >
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
