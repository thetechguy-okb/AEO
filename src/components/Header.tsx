import { useState } from 'react';
import { Menu, X, ChevronDown, Mail, BookOpen, FileText, Bell, Globe } from 'lucide-react';
import { AthenaLogo } from './AthenaLogo';

interface HeaderProps {
  currentPath?: string;
}

export default function Header({ currentPath }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const path = currentPath || (typeof window !== 'undefined' ? window.location.pathname : '/');

  const isElectionsActive = path === '/elections' || path.startsWith('/election/');
  const isEhiiActive = path === '/ehii';
  const isDiaryActive = path === '/diary';
  const isDcmActive = path === '/democratic-competitiveness-map' || path.startsWith('/dcm') || path === '/publications/democratic-competitiveness-map';
  const isApeaActive = path === '/apea' || path.startsWith('/apea/') || path === '/post-election-audits';
  const isPubsActive = (
    path === '/publications' ||
    path.startsWith('/publications/') ||
    path === '/reports-and-briefs' ||
    path === '/reports-briefs' ||
    path === '/political-landscape-monitor' ||
    path === '/aeo-weekly-digest' ||
    path === '/announcements' ||
    path === '/reports-archive' ||
    path === '/weekly-archive' ||
    path === '/press-bulletins'
  ) && !isDcmActive;
  const isEventsActive = path === '/events' || path.startsWith('/event/');

  const handleScroll = (id: string) => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleBrandClick = () => {
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navigateTo = (to: string, state: any = {}) => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
    window.history.pushState(state, '', to);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const getLinkClass = (isActive: boolean) =>
    `text-sm py-1 transition-all ${
      isActive
        ? 'font-semibold text-white border-b-2 border-brand-blue'
        : 'font-medium text-blue-100 hover:text-white'
    }`;

  const getMobileLinkClass = (isActive: boolean) =>
    `block px-3 py-2.5 rounded-lg text-base transition-colors ${
      isActive
        ? 'font-semibold text-white bg-navy-dark border-l-4 border-brand-blue pl-2.5'
        : 'font-medium text-blue-100 hover:text-white hover:bg-navy-dark'
    }`;

  return (
    <>
      <header className="relative z-40 bg-navy text-white shadow-md border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            {/* Logo/Brand */}
            <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={handleBrandClick}
            >
              <AthenaLogo className="w-12 h-12" dark={true} />
              <div className="flex flex-col">
                <span className="font-display font-bold text-xs sm:text-sm md:text-base tracking-tight text-white group-hover:text-brand-blue transition-colors leading-tight">
                  ATHENA ELECTION
                </span>
                <span className="font-display font-semibold text-[10px] sm:text-xs tracking-[0.22em] text-brand-blue uppercase leading-tight mt-0.5">
                  OBSERVATORY
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {/* 1. Elections */}
              <a 
                href="/elections" 
                onClick={(e) => { e.preventDefault(); navigateTo('/elections'); }}
                className={getLinkClass(isElectionsActive)}
              >
                Elections
              </a>

              {/* 2. EHII Index */}
              <a 
                href="/ehii" 
                onClick={(e) => { e.preventDefault(); navigateTo('/ehii'); }}
                className={getLinkClass(isEhiiActive)}
              >
                EHII Index
              </a>

              {/* 3. Diary of Election */}
              <a 
                href="/diary" 
                onClick={(e) => { e.preventDefault(); navigateTo('/diary'); }}
                className={getLinkClass(isDiaryActive)}
              >
                Diary of Election
              </a>

              {/* 4. DCM */}
              <a 
                href="/democratic-competitiveness-map" 
                onClick={(e) => { e.preventDefault(); navigateTo('/democratic-competitiveness-map'); }}
                className={getLinkClass(isDcmActive)}
              >
                DCM
              </a>

              {/* 5. APEA */}
              <a 
                href="/apea" 
                onClick={(e) => { e.preventDefault(); navigateTo('/apea'); }}
                className={getLinkClass(isApeaActive)}
              >
                APEA
              </a>

              {/* 6. Publications Dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <a 
                  href="/publications"
                  onClick={(e) => { e.preventDefault(); navigateTo('/publications'); }}
                  className={`flex items-center gap-1 ${getLinkClass(isPubsActive)} focus:outline-none cursor-pointer`}
                >
                  <span>Publications</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </a>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-0 w-[30rem] bg-white text-ink border border-line rounded-xl shadow-custom p-3 animate-fade-in z-50">
                    <a 
                      href="/reports-and-briefs" 
                      onClick={(e) => { e.preventDefault(); navigateTo('/reports-and-briefs'); }}
                      className="flex items-start gap-4 p-3.5 rounded-lg hover:bg-paper transition-all"
                    >
                      <FileText className="w-6 h-6 text-brand-blue mt-1 flex-shrink-0" />
                      <div>
                        <span className="block text-base font-bold text-brand-blue leading-snug">Reports and Briefs</span>
                      </div>
                    </a>

                    <a 
                      href="/political-landscape-monitor" 
                      onClick={(e) => { e.preventDefault(); navigateTo('/political-landscape-monitor'); }}
                      className="flex items-start gap-4 p-3.5 rounded-lg hover:bg-paper transition-all"
                    >
                      <BookOpen className="w-6 h-6 text-brand-blue mt-1 flex-shrink-0" />
                      <div>
                        <span className="block text-base font-bold text-brand-blue leading-snug">Political landscape monitor</span>
                      </div>
                    </a>

                    <a 
                      href="/aeo-weekly-digest" 
                      onClick={(e) => { e.preventDefault(); navigateTo('/aeo-weekly-digest'); }}
                      className="flex items-start gap-4 p-3.5 rounded-lg hover:bg-paper transition-all"
                    >
                      <Mail className="w-6 h-6 text-brand-green mt-1 flex-shrink-0" />
                      <div>
                        <span className="block text-base font-bold text-brand-green leading-snug">AEO weekly digest</span>
                      </div>
                    </a>

                    <a 
                      href="/publications/africa-election-watch" 
                      onClick={(e) => { e.preventDefault(); navigateTo('/publications/africa-election-watch'); }}
                      className="flex items-start gap-4 p-3.5 rounded-lg hover:bg-paper transition-all"
                    >
                      <Globe className="w-6 h-6 text-indigo-600 mt-1 flex-shrink-0" />
                      <div>
                        <span className="block text-base font-bold text-indigo-600 leading-snug">Africa Election Watch</span>
                      </div>
                    </a>

                    <a 
                      href="/announcements" 
                      onClick={(e) => { e.preventDefault(); navigateTo('/announcements'); }}
                      className="flex items-start gap-4 p-3.5 rounded-lg hover:bg-paper transition-all"
                    >
                      <Bell className="w-6 h-6 text-amber-500 mt-1 flex-shrink-0" />
                      <div>
                        <span className="block text-base font-bold text-amber-500 leading-snug">Announcements</span>
                      </div>
                    </a>
                  </div>
                )}
              </div>

              {/* 7. Events */}
              <a 
                href="/events" 
                onClick={(e) => { e.preventDefault(); navigateTo('/events'); }}
                className={getLinkClass(isEventsActive)}
              >
                Events
              </a>

              {/* Subscribe button */}
              <a 
                href="#subscribe"
                onClick={(e) => { e.preventDefault(); handleScroll('subscribe'); }}
                className="inline-flex items-center justify-center bg-brand-blue hover:bg-brand-blue-dark text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Subscribe
              </a>
            </nav>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-blue-100 hover:text-white hover:bg-navy-dark focus:outline-none focus:ring-2 focus:ring-brand-blue transition-colors"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 bg-navy px-4 pt-2 pb-6 space-y-2">
            <a 
              href="/elections" 
              onClick={(e) => { e.preventDefault(); navigateTo('/elections'); }}
              className={getMobileLinkClass(isElectionsActive)}
            >
              Elections
            </a>
            <a 
              href="/ehii" 
              onClick={(e) => { e.preventDefault(); navigateTo('/ehii'); }}
              className={getMobileLinkClass(isEhiiActive)}
            >
              EHII Index
            </a>
            <a 
              href="/diary" 
              onClick={(e) => { e.preventDefault(); navigateTo('/diary'); }}
              className={getMobileLinkClass(isDiaryActive)}
            >
              Diary of Election
            </a>
            <a 
              href="/democratic-competitiveness-map" 
              onClick={(e) => { e.preventDefault(); navigateTo('/democratic-competitiveness-map'); }}
              className={getMobileLinkClass(isDcmActive)}
            >
              DCM
            </a>
            <a 
              href="/apea" 
              onClick={(e) => { e.preventDefault(); navigateTo('/apea'); }}
              className={getMobileLinkClass(isApeaActive)}
            >
              APEA
            </a>
            
            <div className="pt-2 pb-1 px-3">
              <span className="text-[10px] font-bold font-mono tracking-wider text-white/40 uppercase">Publications</span>
            </div>
            <a 
              href="/reports-and-briefs" 
              onClick={(e) => { e.preventDefault(); navigateTo('/reports-and-briefs'); }}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-blue-100 hover:text-white hover:bg-navy-dark pl-6"
            >
              Reports and Briefs
            </a>
            <a 
              href="/political-landscape-monitor" 
              onClick={(e) => { e.preventDefault(); navigateTo('/political-landscape-monitor'); }}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-blue-100 hover:text-white hover:bg-navy-dark pl-6"
            >
              Political landscape monitor
            </a>
            <a 
              href="/aeo-weekly-digest" 
              onClick={(e) => { e.preventDefault(); navigateTo('/aeo-weekly-digest'); }}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-blue-100 hover:text-white hover:bg-navy-dark pl-6"
            >
              AEO weekly digest
            </a>
            <a 
              href="/publications/africa-election-watch" 
              onClick={(e) => { e.preventDefault(); navigateTo('/publications/africa-election-watch'); }}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-blue-100 hover:text-white hover:bg-navy-dark pl-6"
            >
              Africa Election Watch
            </a>
            <a 
              href="/announcements" 
              onClick={(e) => { e.preventDefault(); navigateTo('/announcements'); }}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-blue-100 hover:text-white hover:bg-navy-dark pl-6"
            >
              Announcements
            </a>
            <a 
              href="/events" 
              onClick={(e) => { e.preventDefault(); navigateTo('/events'); }}
              className={`block px-3 py-2.5 rounded-lg text-base pt-3 border-t border-white/5 ${getMobileLinkClass(isEventsActive)}`}
            >
              Events
            </a>
            <div className="pt-4 border-t border-white/10">
              <a 
                href="#subscribe"
                onClick={(e) => { e.preventDefault(); handleScroll('subscribe'); }}
                className="w-full inline-flex items-center justify-center bg-brand-blue hover:bg-brand-blue-dark text-white text-sm font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Subscribe to AEO Updates
              </a>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
