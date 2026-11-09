import { useState, useEffect, MouseEvent } from 'react';
import { ArrowLeft, Calendar, MapPin, Tag, Share2, ExternalLink, Link2, Clock, Users } from 'lucide-react';
import SEO from './SEO';
import { useCMS } from '../context/CMSContext';

interface EventReaderProps {
  eventId: string | null;
  onClose: () => void;
}

export default function EventReader({ eventId, onClose }: EventReaderProps) {
  const { events } = useCMS();
  const [hasShared, setHasShared] = useState(false);

  useEffect(() => {
    if (eventId) {
      window.scrollTo(0, 0);
      setHasShared(false);
    }
  }, [eventId]);

  if (!eventId) return null;

  const evt = events.find(e => e.id === eventId);
  if (!evt) return null;

  const getEventSpecifics = (id: string) => {
    switch (id) {
      case 'evt-1':
        return {
          banner: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=1200',
          fullIntro: 'This briefing convenes local election monitoring consortia, civil society leaders, and technical experts to unpack the scoring algorithms, source validation checks, and data pipeline of the Electoral Health & Integrity Index (EHII). Participants will receive hands-on training on parsing BVAS log exceptions and verifying form EC8A scans.',
          time: '09:00 AM - 04:30 PM (WAT)',
          speakers: [
            { name: 'Uchenna Victor Mgbechi', role: 'Head of Forensics, Athena Election Observatory' },
            { name: 'Dr. Izuchukwu Christiantus Anyanwu', role: 'Electoral Technology Lead' },
            { name: 'Chinaza Igwe', role: 'Legal Compliance Coordinator' }
          ],
          agenda: [
            { time: '09:00 AM', title: 'Registration & Morning Coffee', desc: 'Welcome networking and credentials collection.' },
            { time: '09:30 AM', title: 'Welcome Address & Strategic Overview', desc: 'Opening statement on sub-national monitoring imperatives.' },
            { time: '10:00 AM', title: 'Unpacking the EHII: Formulas & Datasets', desc: 'Step-by-step review of our statistical weighting indexes.' },
            { time: '11:30 AM', title: 'Case Study: Reconciling Ekiti & Anambra Audits', desc: 'Forensic walkthrough of raw form comparisons.' },
            { time: '01:00 PM', title: 'Networking Lunch', desc: 'Catered lunch at the Main Dining Hall.' },
            { time: '02:00 PM', title: 'Roundtable Panel & Open Discussion', desc: 'Addressing the future of digital-first election observation in West Africa.' }
          ],
          links: [
            { label: 'View Our Publications', url: '/publications', external: false },
            { label: 'Submit Partner Cooperation Request', url: 'mailto:aeo@athenacentre.org', external: true }
          ]
        };
      case 'evt-2':
        return {
          banner: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&q=80&w=1200',
          fullIntro: 'Athena Election Observatory hosts a public, digital presentation of our immediate findings following the Osun State Governorship Election. Drawing on verified reports from 1,200 deployed field observers, our forensics team will present initial statistics on BVAS machine startup timelines, local transmission latencies, and physical EC8A posting compliance rates.',
          time: '03:00 PM - 05:00 PM (WAT) · Interactive Zoom Stream',
          speakers: [
            { name: 'Uchenna Victor Mgbechi', role: 'Observatory Lead, Osun Mission' },
            { name: 'Osun State Field Monitors Coordinator', role: 'Regional Oversight' },
            { name: 'Dr. Izuchukwu Christiantus Anyanwu', role: 'Data Integrity Director' }
          ],
          agenda: [
            { time: '03:00 PM', title: 'Introduction & Mission Overview', desc: 'Quick briefing on the 1,200-observer sample methodology.' },
            { time: '03:15 PM', title: 'Live Presentation: Field Findings', desc: 'Direct feedback on BVAS functionality rates and general physical safety.' },
            { time: '03:45 PM', title: 'Forensic Audit Spotlight: Form EC8A uploads', desc: 'Analyzing server-side ingestion delays and image legibility metrics.' },
            { time: '04:15 PM', title: 'Q&A Session', desc: 'Open floor for questions from civil society groups and international observers.' }
          ],
          links: [
            { label: 'View Our Publications', url: '/publications', external: false },
            { label: 'Submit Partner Cooperation Request', url: 'mailto:aeo@athenacentre.org', external: true }
          ]
        };
      case 'evt-3':
        return {
          banner: 'https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?auto=format&fit=crop&q=80&w=1200',
          fullIntro: 'Part of our ongoing capacity-building series, this intensive technical workshop teaches regional civil society coordinators, data journalists, and academic researchers how to leverage open-source datasets to monitor and critique sub-national elections. Attendees will learn clean data collection, GIS mapping of polling units, and automated script-based discrepancy checking.',
          time: '10:00 AM - 05:00 PM (WAT)',
          speakers: [
            { name: 'Dr. Izuchukwu Christiantus Anyanwu', role: 'Data Systems Lead, AEO' },
            { name: 'Lead Analyst, Forensics Division', role: 'Electoral Data Scraping Specialist' }
          ],
          agenda: [
            { time: '10:00 AM', title: 'Module 1: Raw Data Sourcing', desc: 'Methods for extracting raw statistics from public registries legally.' },
            { time: '11:30 AM', title: 'Module 2: Scraping & Structuring Scans', desc: 'Applying text extraction and OCR patterns to tabular PDF results.' },
            { time: '01:00 PM', title: 'Catered Lunch & Peer Setup', desc: 'Environment verification and python packages check.' },
            { time: '02:00 PM', title: 'Module 3: Mapping & D3 Visualizations', desc: 'Plotting voter density and irregularities coordinates with GeoJSON.' },
            { time: '04:00 PM', title: 'Capstone & Collaborative Peer Audit', desc: 'Assembling local datasets into diagnostic sheets.' }
          ],
          links: [
            { label: 'View Our Publications', url: '/publications', external: false },
            { label: 'Submit Partner Cooperation Request', url: 'mailto:aeo@athenacentre.org', external: true }
          ]
        };
      default:
        return {
          banner: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=1200',
          fullIntro: 'This official event hosts researchers and practitioners dedicated to fostering open, non-partisan, and scientifically sound methods of voting process auditing. Join our regional team to explore data-driven oversight pipelines.',
          time: '11:00 AM (WAT)',
          speakers: [
            { name: 'Observatory Secretariat Team', role: 'Democracy & Oversight Support' }
          ],
          agenda: [
            { time: '11:00 AM', title: 'Session Opening & Framework Briefing', desc: 'Summary of goals, resources, and stakeholder rosters.' },
            { time: '12:00 PM', title: 'Open Feedback & Q&A Panel', desc: 'Collaborating on procedural and technological integrity.' }
          ],
          links: [
            { label: 'View Our Publications', url: '/publications', external: false },
            { label: 'Submit Partner Cooperation Request', url: 'mailto:aeo@athenacentre.org', external: true }
          ]
        };
    }
  };

  const defaultDetails = getEventSpecifics(evt.id);
  const activeLinks = (evt.links && evt.links.length > 0) ? evt.links : defaultDetails.links;
  
  const details = {
    ...defaultDetails,
    banner: evt.imageUrl || defaultDetails.banner,
    links: activeLinks
  };

  const handleResourceClick = (e: MouseEvent<HTMLAnchorElement>, url: string, external?: boolean) => {
    if (external || url.startsWith('mailto:') || url.startsWith('http://') || url.startsWith('https://')) {
      return;
    }
    e.preventDefault();
    let cleanPath = url.replace(/^#/, '');
    if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
    
    if (window.location.hash) {
      window.location.hash = cleanPath;
    } else {
      window.history.pushState({}, '', cleanPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    window.scrollTo(0, 0);
  };

  const handleShare = () => {
    setHasShared(true);
    setTimeout(() => setHasShared(false), 3000);
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <SEO 
        title={`${evt.title} | Events`}
        description={evt.description}
        canonicalPath={`/event/${evt.id}`}
        ogType="article"
        ogImage={details.banner}
      />
      
      {/* Reader header navigation */}
      <div className="bg-white/95 border-b border-line shadow-sm sticky top-0 z-40 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <button 
            onClick={onClose}
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink2 hover:text-brand-blue focus:outline-none transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Main Site</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 bg-paper hover:bg-line border border-line text-ink text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{hasShared ? 'Link Copied!' : 'Share Event'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Banner Area */}
        <div className="relative h-64 sm:h-96 w-full rounded-2xl overflow-hidden border border-line bg-slate-900 shadow-md">
          <img 
            src={details.banner} 
            alt={evt.title} 
            className="w-full h-full object-cover opacity-85"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-6 sm:p-10">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider text-brand-blue bg-blue-500/10 border border-brand-blue/30 uppercase">
                {evt.type}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider text-green-300 bg-emerald-500/10 border border-emerald-500/30 uppercase">
                {evt.location}
              </span>
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-5xl text-white tracking-tight leading-tight">
              {evt.title}
            </h1>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8 items-start">
          
          {/* Main details panel */}
          <div className="lg:col-span-8 space-y-8 bg-white border border-line rounded-2xl p-6 sm:p-8 shadow-custom">
            
            {/* Detailed Intro */}
            <div className="space-y-4">
              <h2 className="font-display font-bold text-xl sm:text-2xl text-ink">
                About the Event
              </h2>
              <p className="text-sm sm:text-base text-ink2 leading-relaxed">
                {details.fullIntro}
              </p>
            </div>

            {/* Detailed Agenda */}
            <div className="space-y-6 pt-6 border-t border-line">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-purple" />
                <h2 className="font-display font-bold text-xl sm:text-2xl text-ink">
                  Detailed Schedule &amp; Agenda
                </h2>
              </div>
              <div className="space-y-4">
                {details.agenda.map((item, index) => (
                  <div key={index} className="flex gap-4 items-start pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                    <span className="font-mono font-bold text-xs text-brand-purple bg-purple-50 px-2 py-1 rounded min-w-[85px] text-center">
                      {item.time}
                    </span>
                    <div className="space-y-1">
                      <h4 className="font-sans font-bold text-sm sm:text-base text-ink leading-snug">
                        {item.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-mut leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Speakers List */}
            <div className="space-y-5 pt-6 border-t border-line">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-blue" />
                <h2 className="font-display font-bold text-xl sm:text-2xl text-ink">
                  Event Speakers &amp; Panelists
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {details.speakers.map((speaker, index) => (
                  <div key={index} className="p-4 bg-slate-50 border border-line rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-navy text-white font-display font-bold flex items-center justify-center text-xs shrink-0">
                      {speaker.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-sans font-bold text-xs text-ink leading-tight">{speaker.name}</h4>
                      <p className="text-[11px] text-mut mt-0.5 leading-snug">{speaker.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Sidebar RSVP & Resources */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Quick Details Box */}
            <div className="bg-navy text-white rounded-2xl p-6 border border-navy-dark shadow-md space-y-4">
              <h3 className="font-display font-bold text-lg border-b border-white/10 pb-2">
                Quick Schedule
              </h3>
              <div className="space-y-3.5 text-xs font-mono font-medium text-blue-100">
                <div className="flex gap-2.5 items-center">
                  <Calendar className="w-4 h-4 text-brand-blue" />
                  <span>{evt.day} {evt.month} 2026</span>
                </div>
                <div className="flex gap-2.5 items-center">
                  <Clock className="w-4 h-4 text-brand-blue" />
                  <span>{details.time}</span>
                </div>
                <div className="flex gap-2.5 items-center">
                  <MapPin className="w-4 h-4 text-brand-purple" />
                  <span>{evt.location}</span>
                </div>
                <div className="flex gap-2.5 items-center">
                  <Tag className="w-4 h-4 text-brand-green" />
                  <span>{evt.type} Category</span>
                </div>
              </div>
            </div>

            {/* RSVP Form Card */}
            <div className="bg-white border border-line rounded-2xl p-6 shadow-custom space-y-4">
              <h3 className="font-display font-bold text-base text-ink">
                Secure Your RSVP Spot
              </h3>
              <p className="text-xs text-ink2 leading-relaxed">
                Click below to complete your event registration, receive access credentials, live handouts, and coordinate logs.
              </p>
              <a
                href={evt.externalLink || 'https://forms.google.com/'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-6 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold font-mono tracking-wider text-sm rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] group"
              >
                <span className="text-sm uppercase tracking-wide">Register Now</span>
                <ExternalLink className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>

            {/* Official Resources Card */}
            <div className="bg-white border border-line rounded-2xl p-6 shadow-custom space-y-4">
              <h3 className="font-display font-bold text-base text-ink">
                Official Links &amp; Resources
              </h3>
              <div className="space-y-2.5">
                {details.links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    onClick={(e) => handleResourceClick(e, link.url, link.external)}
                    target={link.external || link.url.startsWith('mailto:') ? '_blank' : '_self'}
                    rel={link.external || link.url.startsWith('mailto:') ? 'noopener noreferrer' : ''}
                    className="flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100/80 border border-line rounded-xl text-xs text-slate-700 hover:text-brand-blue transition-all group cursor-pointer"
                  >
                    <span className="font-medium pr-2 group-hover:underline">{link.label}</span>
                    {link.external ? (
                      <ExternalLink className="w-3.5 h-3.5 text-mut group-hover:text-brand-blue shrink-0" />
                    ) : (
                      <Link2 className="w-3.5 h-3.5 text-mut group-hover:text-brand-blue shrink-0" />
                    )}
                  </a>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
