import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Check } from 'lucide-react';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

interface OnboardingWizardProps {
  onComplete: () => void;
}

const PREDEFINED_NICHES = [
  '🍳 Kuliner', '✈️ Travel', '💻 Teknologi',
  '💪 Fitness', '💄 Beauty', '👗 Fashion',
  '🎮 Gaming', '📚 Edukasi', '🎵 Musik',
  '🏠 Lifestyle', '💰 Bisnis', '🎨 Seni'
];

const PLATFORMS = [
  { id: 'Instagram', icon: <svg viewBox="0 0 24 24" fill="none" stroke="url(#ig-grad)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10"><defs><linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f09433" /><stop offset="25%" stopColor="#e6683c" /><stop offset="50%" stopColor="#dc2743" /><stop offset="75%" stopColor="#cc2366" /><stop offset="100%" stopColor="#bc1888" /></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg> },
  { id: 'TikTok', icon: <svg viewBox="0 0 24 24" className="w-10 h-10" fill="white" style={{ filter: "drop-shadow(2px 2px 0px #EE1D52) drop-shadow(-2px -2px 0px #69C9D0)" }}><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v7.2c0 1.61-.41 3.22-1.3 4.56a7.143 7.143 0 0 1-5.91 3.09c-2.02.04-4.04-.62-5.6-1.92-1.34-1.12-2.24-2.7-2.5-4.42-.29-1.92.1-3.9 1.13-5.51 1.09-1.68 2.71-2.9 4.61-3.32 1.04-.23 2.11-.27 3.16-.14v4.06c-.84-.13-1.72-.08-2.52.26a3.67 3.67 0 0 0-2.07 2.06c-.36.96-.32 2.05.15 2.96.44.86 1.19 1.51 2.09 1.83.91.31 1.94.25 2.8-.18.79-.39 1.42-1.07 1.74-1.9.19-.51.26-1.05.25-1.59V.02z" /></svg> },
  { id: 'YouTube', icon: <svg viewBox="0 0 24 24" fill="#FF0000" className="w-10 h-10"><path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.507 9.388.507 9.388.507s7.517 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg> },
  { id: 'Twitter/X', icon: <svg viewBox="0 0 24 24" fill="#FFFFFF" className="w-10 h-10"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg> },
  { id: 'LinkedIn', icon: <svg viewBox="0 0 24 24" fill="#0A66C2" className="w-10 h-10"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg> },
  { id: 'Blog', icon: <svg viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg> }
];

const STYLES = [
  { id: '😄 Santai & Fun', title: 'Santai & Fun', desc: 'Konten yang ringan, menghibur, dan relatable' },
  { id: '🎓 Edukatif', title: 'Edukatif', desc: 'Berbagi ilmu dan insight yang bermanfaat' },
  { id: '💼 Profesional', title: 'Profesional', desc: 'Konten formal dan berbobot untuk audiens serius' },
  { id: '🎭 Kreatif & Unik', title: 'Kreatif & Unik', desc: 'Eksperimental, out of the box, berani beda' }
];

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 for forward, -1 for backward
  const [isSaving, setIsSaving] = useState(false);

  // Form States
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [customNicheInput, setCustomNicheInput] = useState('');
  const [customNiches, setCustomNiches] = useState<string[]>([]);
  
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>('');

  const nextStep = () => {
    setDirection(1);
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setDirection(-1);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleCustomNicheAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && customNicheInput.trim() !== '') {
      e.preventDefault();
      const val = customNicheInput.trim();
      if (!customNiches.includes(val)) {
        setCustomNiches([...customNiches, val]);
        setSelectedNiches([...selectedNiches, val]);
      }
      setCustomNicheInput('');
    }
  };

  const toggleNiche = (niche: string) => {
    setSelectedNiches((prev) => 
      prev.includes(niche) ? prev.filter((n) => n !== niche) : [...prev, niche]
    );
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) => 
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const handleFinish = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      const allNiches = selectedNiches.map(n => n.replace(/^[^\w\s]+/, '').trim()); // Strip emojis for defaultNiche
      const primaryNiche = allNiches.length > 0 ? allNiches[0] : '';
      const finalStyle = selectedStyle || 'Santai & Fun';

      const onboardingData = {
        niches: selectedNiches,
        platforms: selectedPlatforms,
        contentStyle: finalStyle,
        completedAt: new Date().toISOString()
      };

      const prefData = {
        platforms: selectedPlatforms,
        defaultNiche: primaryNiche,
        languageStyle: finalStyle,
        targetAudience: 'Semua Umur'
      };

      // 1. Save Onboarding data
      await setDoc(doc(db, `users/${user.uid}/onboarding`, 'data'), onboardingData);

      // 2. Save Preferences
      await setDoc(doc(db, `users/${user.uid}/preferences`, 'info'), prefData);
      localStorage.setItem('kreavo_preferences', JSON.stringify(prefData));
      localStorage.setItem('kreavo_default_niche', primaryNiche);

      // 3. Mark Profile onboardingComplete = true
      // Merge with existing profile document if it exists
      await setDoc(doc(db, "users", user.uid), {
        onboardingComplete: true,
        displayName: user.displayName || '',
        updatedAt: new Date().toISOString()
      }, { merge: true });

      onComplete();
    } catch (error) {
      console.error("Error saving onboarding data:", error);
      // Even if it fails, complete it locally so they aren't stuck
      onComplete();
    } finally {
      setIsSaving(false);
    }
  };

  const slideVariants = {
    initial: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.4 }
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -50 : 50,
      opacity: 0,
      transition: { duration: 0.3 }
    })
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0B0B0B] flex flex-col items-center justify-center overflow-hidden font-sans text-gray-400">
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
        {step > 1 ? (
          <button 
            onClick={prevStep} 
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-bold">Kembali</span>
          </button>
        ) : <div />}
        
        <button 
          onClick={handleFinish}
          disabled={isSaving}
          className="text-sm font-bold text-gray-500 hover:text-white transition-colors underline decoration-white/20 underline-offset-4 disabled:opacity-50"
        >
          Lewati semua
        </button>
      </div>

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
        <motion.div 
          className="h-full bg-brand-cyan"
          initial={{ width: '0%' }}
          animate={{ width: `${(step / 4) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Step Indicator */}
      <div className="absolute top-20 text-[10px] font-bold tracking-widest uppercase text-brand-cyan/80 z-50">
        Langkah {step} dari 4
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-2xl px-6 relative h-[600px] flex items-center justify-center">
        <AnimatePresence mode="wait" custom={direction}>
          
          {/* STEP 1: WELCOME */}
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col items-center text-center space-y-8 w-full"
            >
              <img 
                src="https://i.ibb.co.com/8n8rgmZ9/Kreavo.png" 
                alt="Kreavo Logo" 
                className="w-16 h-16 object-contain"
              />
              <div className="space-y-3">
                <h1 className="text-3xl md:text-4xl font-[900] text-white tracking-tight">Selamat Datang di Kreavo! 🎉</h1>
                <p className="text-base text-gray-400 font-medium">Kamu resmi jadi Kreator Kreavo!</p>
              </div>
              <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                Sebelum mulai, yuk kita setup profil kreatormu dalam 4 langkah singkat untuk memberikan pengalaman terbaik.
              </p>
              <button 
                onClick={nextStep}
                className="primary-button w-full max-w-sm h-12 text-sm font-bold"
              >
                Ayo Mulai &rarr;
              </button>
            </motion.div>
          )}

          {/* STEP 2: NICHES */}
          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col items-center text-center space-y-8 w-full"
            >
              <h2 className="text-3xl font-[900] text-white tracking-tight">Kamu kreator di bidang apa?</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-lg">
                {[...PREDEFINED_NICHES, ...customNiches].map((niche, idx) => {
                  const isSelected = selectedNiches.includes(niche);
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleNiche(niche)}
                      className={`py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                        isSelected 
                          ? 'bg-brand-cyan text-black border border-brand-cyan shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                          : 'bg-black/40 border border-white/10 text-gray-400 hover:border-brand-cyan/50 hover:text-white'
                      }`}
                    >
                      {niche}
                    </button>
                  );
                })}
              </div>

              <input
                type="text"
                value={customNicheInput}
                onChange={(e) => setCustomNicheInput(e.target.value)}
                onKeyDown={handleCustomNicheAdd}
                placeholder="Atau ketik niche kamu sendiri & tekan Enter..."
                className="w-full max-w-lg input-glow py-4 px-5 text-sm text-white bg-black/20"
              />

              <div className="flex items-center space-x-4 w-full max-w-lg">
                <button 
                  onClick={nextStep}
                  className="primary-button flex-1 h-12 text-sm font-bold"
                >
                  Lanjut &rarr;
                </button>
                <button 
                  onClick={nextStep}
                  className="px-6 h-12 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm font-bold"
                >
                  Lewati
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: PLATFORMS */}
          {step === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col items-center text-center space-y-8 w-full"
            >
              <h2 className="text-3xl font-[900] text-white tracking-tight">Kamu aktif di platform mana?</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-lg">
                {PLATFORMS.map((platform) => {
                  const isSelected = selectedPlatforms.includes(platform.id);
                  return (
                    <button
                      key={platform.id}
                      onClick={() => togglePlatform(platform.id)}
                      className={`relative flex flex-col items-center justify-center p-6 space-y-3 rounded-2xl border transition-all ${
                        isSelected 
                          ? 'bg-brand-cyan/10 border-brand-cyan shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                          : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-brand-cyan rounded-full flex items-center justify-center text-black">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                      <div>{platform.icon}</div>
                      <span className={`text-sm font-bold ${isSelected ? 'text-white' : ''}`}>{platform.id}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center space-x-4 w-full max-w-lg">
                <button 
                  onClick={nextStep}
                  className="primary-button flex-1 h-12 text-sm font-bold"
                >
                  Lanjut &rarr;
                </button>
                <button 
                  onClick={nextStep}
                  className="px-6 h-12 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm font-bold"
                >
                  Lewati
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: STYLE */}
          {step === 4 && (
            <motion.div
              key="step4"
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col items-center text-center space-y-8 w-full"
            >
              <h2 className="text-3xl font-[900] text-white tracking-tight">Bagaimana gaya konten kamu?</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                {STYLES.map((style) => {
                  const isSelected = selectedStyle === style.title;
                  return (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.title)}
                      className={`relative flex flex-col items-start p-6 text-left rounded-2xl border transition-all ${
                        isSelected 
                          ? 'bg-brand-cyan/5 border-brand-cyan shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                          : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-5 right-5 w-5 h-5 bg-brand-cyan rounded-full flex items-center justify-center text-black">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                      <span className={`text-lg font-bold mb-2 ${isSelected ? 'text-white' : ''}`}>{style.id}</span>
                      <span className="text-xs text-gray-500 leading-relaxed pr-8">{style.desc}</span>
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={handleFinish}
                disabled={isSaving}
                className="primary-button w-full max-w-md h-14 text-sm font-bold tracking-wider relative overflow-hidden group"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin mx-auto" />
                ) : (
                  <>
                    <span className="relative z-10">Selesai & Mulai Kreavo! 🚀</span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
