import { Calendar, MapPin, Tag, ArrowUpRight } from 'lucide-react';
import { useCMS } from '../context/CMSContext';

export default function Events() {
  const { events } = useCMS();
  return (
    <section className="py-16 bg-paper border-b border-line" id="events">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <span className="eyebrow text-brand-blue font-semibold">upcoming events</span>
        </div>

        {/* Events Grid */}
        <div className="w-full flex justify-center">
          {events.slice(0, 1).map((evt) => (
            <div 
              key={evt.id}
              className="bg-white border border-line rounded-2xl p-8 sm:p-10 shadow-custom hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center gap-8 relative group max-w-full"
              style={{ width: '1000px', minHeight: '310px' }}
            >
              {/* Date Box */}
              <div className="flex-shrink-0 w-40 sm:w-48 text-center border border-line/80 rounded-2xl overflow-hidden bg-white shadow-xl group-hover:shadow-2xl transition-all duration-300">
                <div 
                  className="bg-navy text-white font-mono py-4 font-bold tracking-wider uppercase text-center"
                  style={{ fontSize: '28px' }}
                >
                  {evt.month}
                </div>
                <div className="font-display font-bold text-6xl sm:text-7xl py-8 text-ink">
                  {evt.day}
                </div>
              </div>

              {/* Event Content */}
              <div className="space-y-4 flex-1">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold font-mono text-brand-blue bg-brand-blue/5 rounded-full uppercase tracking-wider">
                    Featured Event
                  </span>
                </div>
                <h4 
                  className="font-display font-bold text-ink group-hover:text-brand-blue transition-colors leading-tight"
                  style={{ fontSize: '48px' }}
                >
                  {evt.title}
                </h4>
                <p className="text-sm sm:text-base text-ink2 leading-relaxed max-w-4xl">
                  {evt.description}
                </p>

                {/* Meta location & type */}
                <div className="pt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm font-mono font-medium text-mut border-t border-line/60 items-center justify-between">
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-brand-blue" />
                      {evt.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-brand-purple" />
                      {evt.type}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      window.history.pushState({}, '', `/event/${evt.id}`);
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }}
                    className="px-4 py-2 bg-navy hover:bg-navy-dark text-white font-semibold font-mono tracking-wider text-xs rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 group-hover:scale-[1.02] active:scale-95 shadow-sm"
                  >
                    Learn More <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="absolute top-6 right-6 text-mut group-hover:text-brand-blue transition-colors">
                <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
