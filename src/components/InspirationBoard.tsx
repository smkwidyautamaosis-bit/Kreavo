import React, { useState } from 'react';
import { Search, Sparkles, Wand2, Lightbulb, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ai, MODELS } from '../lib/gemini';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Idea {
  title: string;
  hook: string;
  format: string;
  tags: string[];
}

export default function InspirationBoard() {
  const { user } = useAuth();
  const [niche, setNiche] = useState(() => localStorage.getItem('kreavo_default_niche') || '');
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [savedTitles, setSavedTitles] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const generateIdeas = async () => {
    if (!niche || !topic) return;
    setIsGenerating(true);
    setIdeas([]);
    setSavedTitles([]);

    try {
      const prompt = `Berikan 4 ide konten menarik untuk niche "${niche}" dengan topik "${topic}".
      Setiap ide harus berisi:
      1. Judul yang mengundang klik (Click-worthy)
      2. Hook awal video/postingan (3 detik pertama)
      3. Format konten (Reels/TikTok, YouTube, Blog, atau Podcast)
      4. 3 Tagar (Hashtags) relevan

      Format jawaban harus dalam bentuk valid JSON array of objects dengan kunci: title, hook, format, tags.
      Gunakan Bahasa Indonesia yang santai tapi profesional seperti konten kreator modern.`;

      const result = await ai.models.generateContent({
        model: MODELS.flash,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
        },
      });

      const data = JSON.parse(result.text || '[]');
      setIdeas(data);
    } catch (error) {
      console.error("Gagal generate ide:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveIdea = async (idea: Idea) => {
    if (!user) return;
    try {
      const platformVal = idea.format.toLowerCase().includes('reels') || idea.format.toLowerCase().includes('tiktok') ? 'tiktok' : 
                          idea.format.toLowerCase().includes('youtube') ? 'youtube' :
                          idea.format.toLowerCase().includes('twitter') || idea.format.toLowerCase().includes('thread') ? 'twitter' :
                          idea.format.toLowerCase().includes('blog') || idea.format.toLowerCase().includes('artikel') ? 'blog' : 'instagram';

      await addDoc(collection(db, `users/${user.uid}/ideas`), {
        title: idea.title,
        niche: niche,
        topic: topic,
        platform: platformVal,
        createdAt: new Date().toISOString(),
        userId: user.uid
      });

      setSavedTitles(prev => [...prev, idea.title]);
      setToast("✅ Ide tersimpan!");
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error(err);
      setToast("Gagal menyimpan data. Periksa koneksi internet kamu.");
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="space-y-10 md:space-y-16 max-w-4xl mx-auto px-1 md:px-0 relative">
      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 bg-[#0B0B0B]/95 border border-brand-cyan/20 px-5 py-3.5 rounded-2xl shadow-xl shadow-brand-cyan/5 text-white text-sm font-semibold backdrop-blur-xl z-[100]"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        <h2 className="text-3xl md:text-5xl font-[800] text-white tracking-tight title-accent">Ide Konten</h2>
        <p className="text-gray-500 text-base md:text-lg max-w-2xl leading-relaxed">Pilih bidang kamu dan tulis apa yang ingin dibahas, lalu biar AI yang kasih ide seru buat kamu.</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-subtle p-6 md:p-8 space-y-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="space-y-2">
            <label className="text-[10px] md:text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Bidang Konten Kamu</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              <input
                placeholder="contoh: memasak, teknologi, traveling"
                className="w-full input-glow py-4 pl-11 pr-4 text-white text-sm min-h-[48px]"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] md:text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Mau bahas apa hari ini?</label>
            <div className="relative">
              <Lightbulb className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              <input
                placeholder="apa yang mau kamu bahas?"
                className="w-full input-glow py-4 pl-11 pr-4 text-white text-sm min-h-[48px]"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button
          onClick={generateIdeas}
          disabled={isGenerating || !niche || !topic}
          className="primary-button w-full h-[52px] text-xs md:text-sm uppercase tracking-widest"
        >
          {isGenerating ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              <span>Generate</span>
            </>
          )}
        </button>
      </motion.div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {ideas.map((idea, index) => (
            <motion.div
              layout
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card-subtle p-6 hover:bg-white/[0.02]"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                  {idea.format}
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleSaveIdea(idea)}
                    disabled={savedTitles.includes(idea.title)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-300 ${
                      savedTitles.includes(idea.title)
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20 border-brand-cyan/20 cursor-pointer'
                    }`}
                  >
                    {savedTitles.includes(idea.title) ? '✓ Tersimpan' : '💾 Simpan Ide'}
                  </button>
                  <TrendingUp className="w-4 h-4 text-gray-700" />
                </div>
              </div>

              <h4 className="text-xl font-bold text-white mb-4 leading-tight">
                {idea.title}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/[0.02] p-4 rounded-lg border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-2 flex items-center tracking-widest">
                    The Hook
                  </p>
                  <p className="text-sm text-gray-400 leading-relaxed italic">"{idea.hook}"</p>
                </div>
                <div className="flex flex-col justify-end items-end space-y-2">
                  <div className="flex flex-wrap justify-end gap-2">
                    {idea.tags.map((tag, i) => (
                      <span key={i} className="text-xs text-gray-600">#{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!isGenerating && ideas.length === 0 && (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
          <p className="text-gray-600 text-sm font-medium">Ready to start? Enter your niche and topic above.</p>
        </div>
      )}
    </div>
  );
}
