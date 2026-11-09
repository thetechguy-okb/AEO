import { Mail, Globe, MapPin } from 'lucide-react';
import { AthenaLogo } from './AthenaLogo';

export default function Footer() {
  const navigateTo = (to: string) => {
    if (window.location.pathname === to) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.history.pushState({}, '', to);
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-navy-dark text-slate-300 py-16 border-t border-white/5 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          
          {/* Column 1: Observatory description */}
          <div className="lg:col-span-4 space-y-4">
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => navigateTo('/')}
            >
              <AthenaLogo className="w-10 h-10" dark={true} />
              <div className="flex flex-col">
                <span className="font-display font-bold text-sm text-white tracking-tight group-hover:text-brand-blue transition-colors leading-tight">
                  ATHENA ELECTION
                </span>
                <span className="font-display font-semibold text-[10px] tracking-[0.2em] text-brand-blue uppercase leading-tight mt-0.5">
                  OBSERVATORY
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
              An independent, non-partisan research initiatives platform auditing election data benchmarks and measuring overall democratic health indicators across Nigeria and regional partner nations.
            </p>
          </div>

          {/* Column 2: Explore Navigation */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-display font-bold text-white text-xs uppercase tracking-widest">
              Explore
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button 
                  onClick={() => navigateTo('/post-election-audits')} 
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer text-left"
                >
                  Audit Reports
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('/political-landscape-monitor')} 
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer text-left"
                >
                  Political Landscape
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('/democratic-competitiveness-map')} 
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer text-left"
                >
                  Democratic Competitiveness Map
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('/publications/africa-election-watch')} 
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer text-left"
                >
                  Africa Election Watch
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('/elections')} 
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer text-left"
                >
                  Elections &amp; Data
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('/ehii')} 
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer text-left"
                >
                  EHII Index
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('/diary')} 
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer text-left"
                >
                  Diary of Election
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Engage Links */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-display font-bold text-white text-xs uppercase tracking-widest">
              Engage
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button 
                  onClick={() => navigateTo('/aeo-weekly-digest')} 
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer text-left"
                >
                  AEO Weekly
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('/announcements')} 
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer text-left"
                >
                  Press Bulletins
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('/events')} 
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer text-left"
                >
                  Events Hub
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('/subscribe')} 
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer text-left"
                >
                  Subscribe
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('/team')} 
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer text-left"
                >
                  Our Team
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact details */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="font-display font-bold text-white text-xs uppercase tracking-widest">
              Contact &amp; Administration
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-mono">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
                <span>Abuja, Federal Capital Territory, Nigeria</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-brand-purple shrink-0 mt-0.5" />
                <a href="mailto:info.centre@athenacentre.org" className="hover:text-white transition-colors">
                  info.centre@athenacentre.org
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Globe className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                <a href="https://athenacentre.org" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
                  athenacentre.org <span className="text-[9px] opacity-60">↗</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
          <div className="text-center sm:text-left">
            <span>&copy; {new Date().getFullYear()} Athena Election Observatory. All rights reserved.</span>
            <span className="block mt-1 sm:inline sm:mt-0 sm:ml-2 text-slate-600">
              · Powered by Athena Centre for Policy &amp; Leadership.
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
