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
  { id: 'Instagram', icon: '📸' },
  { id: 'TikTok', icon: '🎵' },
  { id: 'YouTube', icon: '▶️' },
  { id: 'Twitter/X', icon: '𝕏' },
  { id: 'LinkedIn', icon: '💼' },
  { id: 'Blog', icon: '📝' }
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
      await setDoc(doc(db, `users/${user.uid}`, 'profile'), {
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
                      <span className="text-3xl">{platform.icon}</span>
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
