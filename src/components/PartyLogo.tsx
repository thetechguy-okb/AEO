import { useState, useEffect } from 'react';
import { Paintbrush, Umbrella, Users, Bird, Shield, Leaf, HelpCircle, GraduationCap } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { loadAssetFromFirestore } from '../lib/firebaseAssets';

export function PartyLogo({ name = "", className = "w-8 h-8" }: { name?: string; className?: string }) {
  const party = (name || "").toUpperCase().trim();
  const safePartyId = party.replace(/[\/\s#?\[\]]/gi, '_');
  
  // Custom logo map from CMS & Firestore
  const [customLogos, setCustomLogos] = useState<Record<string, string>>({});

  // Listen to Firestore real-time snapshot
  useEffect(() => {
    // 1. Global party logos map snapshot (manifest or map)
    const unsubMap = onSnapshot(doc(db, 'cms', 'custom_party_logos'), async snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data?.map) {
          setCustomLogos(prev => ({ ...prev, ...data.map }));
        }
        if (data?.keys && Array.isArray(data.keys)) {
          for (const k of data.keys) {
            try {
              const logoData = await loadAssetFromFirestore('logo', k);
              if (logoData) {
                setCustomLogos(prev => ({ ...prev, [k]: logoData }));
              }
            } catch (e) {
              console.warn(`PartyLogo: error loading logo for ${k}:`, e);
            }
          }
        }
      }
    }, err => {
      console.warn("Firestore party logos fallback:", err);
    });

    // 2. Individual party logo document fallback (for large or chunked base64 logos)
    let unsubSingle: (() => void) | undefined;
    if (party && safePartyId) {
      unsubSingle = onSnapshot(doc(db, 'cms', `logo_${safePartyId}`), async snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          let logoVal = data?.dataUrl || data?.logo;
          if (!logoVal && data?.chunksCount) {
            try {
              logoVal = await loadAssetFromFirestore('logo', party);
            } catch (e) {
              console.warn(`PartyLogo: error loading chunked logo for ${party}:`, e);
            }
          }
          if (logoVal) {
            setCustomLogos(prev => ({ ...prev, [party]: logoVal }));
          }
        }
      }, () => {});
    }

    return () => {
      unsubMap();
      if (unsubSingle) unsubSingle();
    };
  }, [party]);

  // Resolve reference keys if customLogos[party] starts with 'ref:'
  useEffect(() => {
    const logoVal = customLogos[party];
    if (logoVal && logoVal.startsWith('ref:')) {
      loadAssetFromFirestore('logo', logoVal).then(resolved => {
        if (resolved) {
          setCustomLogos(prev => ({ ...prev, [party]: resolved }));
        }
      }).catch(err => {
        console.warn(`PartyLogo: could not resolve logo ref ${logoVal}:`, err);
      });
    }
  }, [customLogos[party], party]);

  // 1. If we have a custom user-uploaded logo (base64 or URL), render it
  if (customLogos[party]) {
    return (
      <div className={`relative flex items-center justify-center rounded-lg overflow-hidden border border-slate-200 bg-white shadow-inner shrink-0 ${className}`} title={name}>
        <img 
          src={customLogos[party]} 
          alt={`${party} logo`} 
          className="w-full h-full object-contain p-0.5" 
          referrerPolicy="no-referrer" 
        />
      </div>
    );
  }
  
  // 2. Default designed vector styles based on party acronym
  if (party === 'APC') {
    return (
      <div className={`relative flex items-center justify-center rounded-lg overflow-hidden border border-sky-200 bg-gradient-to-br from-sky-400 via-white to-emerald-500 shadow-inner shrink-0 ${className}`} title="All Progressives Congress (APC)">
        <div className="absolute inset-0 bg-black/[0.03]" />
        <Paintbrush className="w-3.5 h-3.5 text-slate-800 drop-shadow-sm relative z-10" />
      </div>
    );
  }
  
  if (party === 'PDP') {
    return (
      <div className={`relative flex items-center justify-center rounded-lg overflow-hidden border border-rose-200 bg-gradient-to-br from-emerald-500 via-white to-rose-500 shadow-inner shrink-0 ${className}`} title="People's Democratic Party (PDP)">
        <div className="absolute inset-0 bg-black/[0.03]" />
        <Umbrella className="w-3.5 h-3.5 text-emerald-950 drop-shadow-sm relative z-10" />
      </div>
    );
  }
  
  if (party === 'LP') {
    return (
      <div className={`relative flex items-center justify-center rounded-lg overflow-hidden border border-red-200 bg-gradient-to-br from-red-500 via-white to-emerald-500 shadow-inner shrink-0 ${className}`} title="Labour Party (LP)">
        <div className="absolute inset-0 bg-black/[0.03]" />
        <Users className="w-3.5 h-3.5 text-slate-800 drop-shadow-sm relative z-10" />
      </div>
    );
  }
  
  if (party === 'APGA') {
    return (
      <div className={`relative flex items-center justify-center rounded-lg overflow-hidden border border-amber-200 bg-gradient-to-br from-amber-400 to-emerald-600 shadow-inner shrink-0 ${className}`} title="All Progressives Grand Alliance (APGA)">
        <div className="absolute inset-0 bg-black/[0.03]" />
        <Bird className="w-3.5 h-3.5 text-white drop-shadow relative z-10" />
      </div>
    );
  }
  
  if (party === 'SDP') {
    return (
      <div className={`relative flex items-center justify-center rounded-lg overflow-hidden border border-blue-200 bg-gradient-to-br from-blue-500 via-white to-amber-500 shadow-inner shrink-0 ${className}`} title="Social Democratic Party (SDP)">
        <div className="absolute inset-0 bg-black/[0.03]" />
        <Shield className="w-3.5 h-3.5 text-blue-900 drop-shadow-sm relative z-10" />
      </div>
    );
  }
  
  if (party === 'YPP') {
    return (
      <div className={`relative flex items-center justify-center rounded-lg overflow-hidden border border-emerald-200 bg-gradient-to-br from-emerald-400 to-yellow-300 shadow-inner shrink-0 ${className}`} title="Young Progressives Party (YPP)">
        <div className="absolute inset-0 bg-black/[0.03]" />
        <Leaf className="w-3.5 h-3.5 text-emerald-900 drop-shadow-sm relative z-10" />
      </div>
    );
  }

  if (party === 'ADC') {
    return (
      <div className={`relative flex items-center justify-center rounded-lg overflow-hidden border border-indigo-200 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-inner shrink-0 ${className}`} title="African Democratic Congress (ADC)">
        <div className="absolute inset-0 bg-black/[0.03]" />
        <HelpCircle className="w-3.5 h-3.5 text-white drop-shadow relative z-10" />
      </div>
    );
  }

  if (party === 'NNPP') {
    return (
      <div className={`relative flex items-center justify-center rounded-lg overflow-hidden border border-cyan-200 bg-gradient-to-br from-cyan-400 to-blue-600 shadow-inner shrink-0 ${className}`} title="New Nigeria Peoples Party (NNPP)">
        <div className="absolute inset-0 bg-black/[0.03]" />
        <GraduationCap className="w-3.5 h-3.5 text-white drop-shadow relative z-10" />
      </div>
    );
  }

  // General fallback
  return (
    <div className={`relative flex items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300 text-slate-700 font-mono font-bold shadow-inner shrink-0 ${className}`} title={name}>
      <span className="text-[9px]">{party.substring(0, 3)}</span>
    </div>
  );
}
