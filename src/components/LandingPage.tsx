import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Kanban, MessageCircle, Lightbulb, Rocket } from 'lucide-react';
import { cn } from '../lib/utils';

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  const scrollToFeatures = () => {
    const element = document.getElementById('features');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    {
      title: "Ide Konten AI",
      description: "Ratusan ide konten siap pakai dalam hitungan detik untuk semua platform media sosial kamu.",
      icon: Sparkles,
      delay: 0.2
    },
    {
      title: "Projek Ku",
      description: "Kelola semua projek kreatif kamu dalam satu tempat dengan sistem kanban yang simpel.",
      icon: Kanban,
      delay: 0.4
    },
    {
      title: "Tanya Kreavo",
      description: "Asisten AI pintar yang mengerti dunia kreator Indonesia. Brainstorming jadi makin seru.",
      icon: MessageCircle,
      delay: 0.6
    }
  ];

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col items-center select-none relative overflow-y-auto overflow-x-hidden dot-pattern w-full">
      {/* Navbar Container - Adding a wrapper for better flow */}
      <div className="w-full max-w-6xl px-6 pt-4 relative z-50">
        <motion.nav 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex items-center justify-between px-8 py-4 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl sticky top-4 shadow-2xl"
        >
          <div className="flex items-center space-x-3">
            <img 
              src="https://i.ibb.co.com/8n8rgmZ9/Kreavo.png" 
              alt="Kreavo Logo" 
              className="w-[32px] h-[32px] object-contain"
            />
            <span className="text-xl font-extrabold text-white tracking-tight">Kreavo</span>
          </div>
          <div className="hidden md:flex items-center space-x-8 text-sm font-bold uppercase tracking-widest text-gray-500">
            <button className="hover:text-white transition-colors cursor-pointer" onClick={scrollToFeatures}>Fitur</button>
            <button className="hover:text-white transition-colors cursor-pointer" onClick={scrollToFeatures}>Tentang</button>
            <button 
              onClick={onStart}
              className="px-6 py-2.5 bg-brand-cyan text-black font-bold rounded-xl hover:bg-brand-cyan/90 transition-all uppercase tracking-widest text-[11px]"
            >
              Open Kreavo
            </button>
          </div>
        </motion.nav>
      </div>

      {/* Hero Section */}
      <section className="max-w-6xl w-full px-6 pt-12 md:pt-28 pb-20 flex flex-col lg:flex-row items-center lg:items-start gap-12 lg:gap-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex-[1.2] text-center lg:text-left space-y-10"
        >
          <div className="space-y-6">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan text-[10px] md:text-[11px] font-bold uppercase tracking-widest shimmer-badge">
              ✦ Platform AI untuk Kreator Indonesia
            </div>

            <h1 className="text-4xl md:text-7xl lg:text-8xl font-[900] text-white tracking-[-0.04em] leading-[1.1] md:leading-[1]">
              Ubah Idemu<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-cyan to-brand-blue">Jadi Karya Nyata.</span>
            </h1>
            
            <div className="max-w-[480px] mx-auto lg:mx-0">
              <p className="text-gray-500 text-base md:text-lg leading-relaxed">
                Kreavo hadir untuk kreator yang ingin bergerak lebih cepat, lebih cerdas, dan lebih kreatif.
              </p>
            </div>
          </div>

          <div className="flex flex-col space-y-10">
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <motion.button
                onClick={onStart}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="primary-button gradient-border-button !text-white w-full sm:w-auto px-10 py-4 min-h-[56px]"
              >
                Mulai Berkreasi →
              </motion.button>
              <motion.button
                onClick={scrollToFeatures}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="secondary-button w-full sm:w-auto min-h-[56px]"
              >
                Lihat Cara Kerja ↓
              </motion.button>
            </div>

            <motion.div 
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center space-x-2 text-gray-600 cursor-pointer w-fit"
              onClick={scrollToFeatures}
            >
              <span className="text-xs font-bold uppercase tracking-widest">Scroll untuk lihat fitur ↓</span>
            </motion.div>
          </div>
        </motion.div>

        <div id="features" className="flex-1 grid grid-cols-1 gap-6 w-full">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: feature.delay }}
              whileHover={{ y: -4, borderColor: 'rgba(6,182,212,0.3)', boxShadow: '0 0 30px rgba(6,182,212,0.1)' }}
              className="bg-bg-surface border border-white/5 rounded-3xl p-8 text-left group transition-all"
            >
              <div className="flex items-start space-x-5">
                <div className="w-12 h-12 bg-brand-cyan/10 rounded-2xl flex items-center justify-center shrink-0 border border-brand-cyan/20">
                  <feature.icon className="w-6 h-6 text-brand-cyan" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2 tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Section 1: Cara Kerja Kreavo */}
      <section className="max-w-6xl w-full px-6 py-32 space-y-20 relative z-10 border-t border-white/[0.03]">
        <div className="text-center space-y-4">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-white tracking-tight"
          >
            Cara Kerja Kreavo
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 text-lg"
          >
            3 langkah mudah untuk mulai berkreasi
          </motion.p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative">
          {/* Step 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex-1 flex flex-col items-center text-center space-y-6 group"
          >
            <div className="w-20 h-20 bg-brand-cyan/10 rounded-[2.5rem] flex items-center justify-center border border-brand-cyan/20 group-hover:border-brand-cyan/50 transition-all group-hover:rotate-6">
              <Lightbulb className="w-10 h-10 text-brand-cyan" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-white">Tentukan Bidangmu</h3>
              <p className="text-gray-500 text-sm max-w-[240px] leading-relaxed">
                Pilih niche dan topik konten yang kamu kuasai
              </p>
            </div>
          </motion.div>

          {/* Connector 1 */}
          <div className="hidden md:block w-px h-12 bg-gradient-to-b from-brand-cyan/50 to-transparent self-start mt-10 opacity-20" />
          <div className="md:hidden text-brand-cyan/20">↓</div>

          {/* Step 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex-1 flex flex-col items-center text-center space-y-6 group"
          >
            <div className="w-20 h-20 bg-brand-cyan/10 rounded-[2.5rem] flex items-center justify-center border border-brand-cyan/20 group-hover:border-brand-cyan/50 transition-all group-hover:-rotate-6">
              <Sparkles className="w-10 h-10 text-brand-cyan" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-white">Dapatkan Ide dari AI</h3>
              <p className="text-gray-500 text-sm max-w-[240px] leading-relaxed">
                Kreavo generate ratusan ide konten dalam hitungan detik
              </p>
            </div>
          </motion.div>

          {/* Connector 2 */}
          <div className="hidden md:block w-px h-12 bg-gradient-to-b from-brand-cyan/50 to-transparent self-start mt-10 opacity-20" />
          <div className="md:hidden text-brand-cyan/20">↓</div>

          {/* Step 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex-1 flex flex-col items-center text-center space-y-6 group"
          >
            <div className="w-20 h-20 bg-brand-cyan/10 rounded-[2.5rem] flex items-center justify-center border border-brand-cyan/20 group-hover:border-brand-cyan/50 transition-all group-hover:rotate-6">
              <Rocket className="w-10 h-10 text-brand-cyan" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-white">Eksekusi & Kelola</h3>
              <p className="text-gray-500 text-sm max-w-[240px] leading-relaxed">
                Simpan ide terbaik dan kelola proyekmu dalam satu dashboard
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="w-full max-w-6xl border-t border-white/[0.06] py-12 flex flex-col items-center justify-center space-y-2">
        <p className="text-gray-600 text-sm font-medium">
          Dibuat dengan menggunakan Google AI Studio & Gemini
        </p>
        <p className="text-gray-700 text-sm font-bold tracking-widest uppercase">
          #JuaraVibeCoding
        </p>
      </footer>
    </div>
  );
}
