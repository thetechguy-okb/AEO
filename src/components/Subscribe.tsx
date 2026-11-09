import { useState, FormEvent } from 'react';
import { Mail, Check, AlertCircle, Sparkles, Send } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function Subscribe() {
  const [email, setEmail] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([
    'EHII updates', 'Audit reports', 'AEO Weekly'
  ]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const channelsList = [
    'EHII updates',
    'Audit reports',
    'AEO Weekly',
    'Announcements'
  ];

  const handleToggleChannel = (channel: string) => {
    if (selectedChannels.includes(channel)) {
      setSelectedChannels(selectedChannels.filter(c => c !== channel));
    } else {
      setSelectedChannels([...selectedChannels, channel]);
    }
  };

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please provide your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please provide a valid email address.');
      return;
    }

    if (selectedChannels.length === 0) {
      setError('Please choose at least one update stream channel.');
      return;
    }

    try {
      const subscriberId = 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
      const docRef = doc(db, 'subscribers', subscriberId);
      await setDoc(docRef, {
        email: email.trim().toLowerCase(),
        channels: selectedChannels,
        subscribedAt: new Date().toISOString()
      });

      setSuccess(true);
      setTimeout(() => {
        setEmail('');
        setSuccess(false);
      }, 5000);
    } catch (err: any) {
      console.error('Subscription error:', err);
      setError('Failed to subscribe. Please try again.');
    }
  };

  return (
    <section className="py-16 bg-white border-b border-line" id="subscribe">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-navy text-white rounded-3xl p-8 sm:p-12 shadow-custom text-center relative overflow-hidden border border-navy-dark">
          
          {/* Decorative subtle visual accent circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-blue/25 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-purple/25 rounded-full blur-2xl pointer-events-none"></div>

          {success ? (
            <div className="space-y-6 py-6 animate-fade-in">
              <div className="w-16 h-16 bg-brand-green/20 border-2 border-brand-green text-brand-green rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8" />
              </div>
              <h2 className="font-display font-bold text-3xl text-white">
                You are subscribed!
              </h2>
              <p className="text-blue-100 max-w-lg mx-auto text-sm leading-relaxed">
                Thank you. We have securely recorded <span className="font-mono text-white font-semibold underline">{email}</span> for:
                <br />
                <span className="inline-block mt-2 font-semibold text-brand-green">
                  {selectedChannels.join(', ')}
                </span>
              </p>
              <p className="text-xs text-blue-300 font-mono">
                Subscription tokens saved. Standby for the next AEO Weekly briefing.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Mail Icon */}
              <div className="w-14 h-14 bg-brand-blue/25 border border-brand-blue/30 text-white rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Mail className="w-6 h-6 text-blue-300 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
                  Subscribe to AEO updates
                </h2>
                <p className="text-blue-200 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                  Get a direct secure email whenever we publish new election analysis, forensic audit reports, and Landscape updates.
                </p>
              </div>

              {/* Form Input */}
              <form onSubmit={handleSubscribe} className="max-w-lg mx-auto space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10">
                  <input
                    type="email"
                    placeholder="Enter your professional email address..."
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    className="flex-grow bg-transparent text-white px-4 py-3 text-sm rounded-lg focus:outline-none placeholder:text-blue-300/60"
                  />
                  <button
                    type="submit"
                    className="bg-brand-blue hover:bg-brand-blue-dark text-white font-semibold text-xs font-mono uppercase tracking-wider px-6 py-3.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    Subscribe
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>

                {error && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/40 border border-rose-900/30 p-2.5 rounded-lg justify-center max-w-sm mx-auto animate-fade-in">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}
              </form>

              {/* Channel Selector Chips */}
              <div className="space-y-2 pt-4 border-t border-white/5">
                <span className="block text-[10px] font-mono font-bold text-blue-300 uppercase tracking-widest mb-2">
                  Select your notification channels:
                </span>
                <div className="flex flex-wrap gap-2 justify-center">
                  {channelsList.map((channel) => {
                    const isSelected = selectedChannels.includes(channel);
                    return (
                      <button
                        key={channel}
                        type="button"
                        onClick={() => handleToggleChannel(channel)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide border cursor-pointer focus:outline-none transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-brand-blue border-brand-blue text-white shadow-md'
                            : 'bg-white/5 border-white/10 hover:bg-white/10 text-blue-200 hover:text-white'
                        }`}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                        {channel}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </section>
  );
}
