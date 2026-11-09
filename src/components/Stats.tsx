import React, { useState } from 'react';
import { Shield, Database, FileSpreadsheet, Globe, HelpCircle } from 'lucide-react';
import { useCMS } from '../context/CMSContext';

const iconMap = {
  Shield: Shield,
  Database: Database,
  FileSpreadsheet: FileSpreadsheet,
  Globe: Globe
};

export default function Stats() {
  const { statsConfig } = useCMS();
  const [activeStat, setActiveStat] = useState<number | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-12 relative z-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statsConfig.map((stat, idx) => {
          const cardStyle: React.CSSProperties = {};
          let cardClass = "text-white rounded-2xl p-5 sm:p-6 shadow-custom transform hover:-translate-y-1 transition-all cursor-pointer relative group overflow-hidden";
          
          if (stat.cardBgType === 'solid') {
            cardStyle.backgroundColor = stat.cardBgSolid || '#1E3A5F';
          } else if (stat.cardBgType === 'gradient') {
            cardStyle.backgroundImage = `linear-gradient(to bottom right, ${stat.cardBgGradFrom || '#2563EB'}, ${stat.cardBgGradTo || '#15304F'})`;
          } else {
            cardClass += ` ${stat.color}`;
          }

          return (
            <div 
              key={stat.id}
              onClick={() => setActiveStat(activeStat === stat.id ? null : stat.id)}
              className={cardClass}
              style={cardStyle}
            >
              <div className="flex items-center justify-between mb-4">
                <span 
                  className={`font-semibold tracking-wider uppercase ${stat.titleFontFamily || 'font-mono'} ${stat.titleFontSize || 'text-xs'}`}
                  style={{ color: stat.titleColor || 'rgba(255,255,255,0.8)' }}
                >
                  {stat.title}
                </span>
              </div>

              <div 
                className={`font-bold tracking-tight mb-1 ${stat.valueFontFamily || 'font-display'} ${stat.valueFontSize || 'text-3xl sm:text-4xl'}`}
                style={{ color: stat.valueColor || '#FFFFFF' }}
              >
                {stat.value}
              </div>

              <div className="text-xs text-white/80 leading-relaxed font-medium">
                {stat.sub}
              </div>

              {/* Click to expand detail box */}
              <div className={`mt-3 pt-3 border-t border-white/10 text-[11px] text-white/90 leading-relaxed transition-all duration-300 ${activeStat === stat.id ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                {stat.detail}
              </div>
              
              <div className="absolute bottom-2 right-3 text-[9px] font-mono opacity-40 group-hover:opacity-100 transition-opacity">
                {activeStat === stat.id ? 'Click to collapse' : 'Click for info'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
