import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check, Filter } from 'lucide-react';
import { cn } from '../lib/utils';

type Category = 'Semua' | 'Hook Video' | 'Caption Jualan' | 'Edukasi' | 'Call to Action';

interface Template {
  id: string;
  category: Category;
  text: string;
}

const TEMPLATES: Template[] = [
  {
    id: 't1',
    category: 'Hook Video',
    text: "Stop scroll! Kalau kamu masih kesulitan dengan [Masalah], video ini khusus buat kamu karena aku akan bongkar rahasia [Solusi]."
  },
  {
    id: 't2',
    category: 'Hook Video',
    text: "Ternyata selama ini kita salah pakai [Produk/Metode]! Ini cara yang benar menurut ahli [Bidang]."
  },
  {
    id: 't3',
    category: 'Edukasi',
    text: "3 Alasan kenapa kamu wajib mulai [Kebiasaan/Tindakan] dari sekarang. Yang nomor 3 paling bikin kaget!"
  },
  {
    id: 't4',
    category: 'Edukasi',
    text: "Mitos vs Fakta soal [Topik]. Kamu masih percaya yang mana? Yuk bahas tuntas!"
  },
  {
    id: 't5',
    category: 'Caption Jualan',
    text: "Sudah coba berbagai macam [Solusi Lama] tapi tetap gagal? Kini saatnya beralih ke [Nama Produk]. Dapatkan promo khusus untuk 10 pembeli pertama!"
  },
  {
    id: 't6',
    category: 'Caption Jualan',
    text: "Bayangkan kamu bisa [Manfaat Utama] hanya dalam waktu [Jangka Waktu]. Dengan [Nama Produk], impian itu jadi nyata. Cek keranjang kuning sekarang!"
  },
  {
    id: 't7',
    category: 'Call to Action',
    text: "Gimana menurut kamu? Tulis pendapatmu di kolom komentar dan jangan lupa tag teman kamu yang butuh info ini!"
  },
  {
    id: 't8',
    category: 'Call to Action',
    text: "Save video ini biar nggak hilang saat kamu butuh, dan follow aku untuk tips seputar [Niche] lainnya setiap hari!"
  },
  {
    id: 't9',
    category: 'Hook Video',
    text: "Ini dia satu rahasia [Topik] yang nggak banyak orang tahu, padahal efeknya luar biasa!"
  },
  {
    id: 't10',
    category: 'Edukasi',
    text: "Step-by-step lengkap cara mencapai [Tujuan] tanpa harus pusing memikirkan [Masalah/Hambatan]."
  }
];

const CATEGORIES: Category[] = ['Semua', 'Hook Video', 'Caption Jualan', 'Edukasi', 'Call to Action'];

export default function ContentTemplates() {
  const [activeCategory, setActiveCategory] = useState<Category>('Semua');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredTemplates = activeCategory === 'Semua' 
    ? TEMPLATES 
    : TEMPLATES.filter(t => t.category === activeCategory);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const renderTemplateText = (text: string) => {
    // Split by brackets, keeping the brackets in the matches
    const parts = text.split(/(\[.*?\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        return (
          <span key={index} className="text-brand-cyan font-bold bg-brand-cyan/10 px-1 rounded mx-[1px]">
            {part}
          </span>
        );
      }
      return <span key={index} className="text-gray-300 leading-relaxed">{part}</span>;
    });
  };

  return (
    <div className="w-full flex flex-col space-y-8 animate-fade-in pb-10">
      {/* Page Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center border border-brand-cyan/20">
            <Copy className="w-5 h-5 text-brand-cyan" />
          </div>
          <span>Template Konten</span>
        </h1>
        <p className="text-gray-400 text-sm md:text-base max-w-2xl leading-relaxed">
          Pustaka referensi teks siap pakai. Tinggal salin, isi bagian yang kosong sesuai kebutuhanmu, dan langsung publikasikan!
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide w-full mask-linear-right">
        <div className="flex items-center space-x-2 px-1">
          <Filter className="w-4 h-4 text-gray-500 mr-2 shrink-0" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300",
                activeCategory === cat
                  ? "bg-brand-cyan text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {filteredTemplates.map((template) => {
            const isCopied = copiedId === template.id;
            
            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                key={template.id}
                className="group relative flex flex-col justify-between p-5 md:p-6 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 hover:border-brand-cyan/30 rounded-2xl transition-all duration-300 shadow-xl"
              >
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                      {template.category}
                    </span>
                  </div>
                  
                  <div className="text-sm">
                    {renderTemplateText(template.text)}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
                  <button
                    onClick={() => handleCopy(template.id, template.text)}
                    className={cn(
                      "flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 w-full sm:w-auto",
                      isCopied 
                        ? "bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/50" 
                        : "bg-black/40 text-gray-400 border border-white/10 hover:text-white hover:border-white/20 group-hover:bg-white/5"
                    )}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Tersalin! ✓</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Teks</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
