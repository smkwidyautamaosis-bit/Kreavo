import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  Calendar as CalendarIcon, 
  Copy, 
  Check, 
  History, 
  TrendingUp, 
  Lightbulb, 
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { format, parseISO, isAfter, subDays } from 'date-fns';
import { id as indonesianLocale } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { PlatformBadge, PLATFORMS } from './PlatformBadge';
import { useAuth } from '../contexts/AuthContext';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface IdeaHistoryItem {
  id: string;
  title: string;
  niche: string;
  topic: string;
  platform: string;
  createdAt: string;
}

interface IdeaHistoryProps {
  onNavigate?: (section: any) => void;
}

export default function IdeaHistoryPage({ onNavigate }: IdeaHistoryProps) {
  const { user } = useAuth();
  const [history, setHistory] = useState<IdeaHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('Semua');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load history with real-time Firestore listener
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, `users/${user.uid}/ideas`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as IdeaHistoryItem[];
      setHistory(items);
      setLoading(false);
    }, (error) => {
      console.error("Firestore loading error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Delete idea from Firestore
  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/ideas`, id));
    } catch (err) {
      console.error("Error deleting document from Firestore:", err);
      alert("Gagal menghapus data. Periksa koneksi internet kamu.");
    }
  };

  // Copy to clipboard
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Stats calculation
  const stats = useMemo(() => {
    const totalIdeas = history.length;
    const sevenDaysAgo = subDays(new Date(), 7);
    const weeklyIdeas = history.filter(item => {
      try {
        return isAfter(parseISO(item.createdAt), sevenDaysAgo);
      } catch (e) {
        return false;
      }
    }).length;
    
    const nicheCounts = history.reduce((acc, item) => {
      acc[item.niche] = (acc[item.niche] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const popularNiche = Object.entries(nicheCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    return { totalIdeas, weeklyIdeas, popularNiche };
  }, [history]);

  // Filtering
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.niche.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.topic.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPlatform = selectedPlatform === 'Semua' || item.platform === selectedPlatform.toLowerCase();
      return matchesSearch && matchesPlatform;
    });
  }, [history, searchQuery, selectedPlatform]);

  const platformPills = ['Semua', ...PLATFORMS.map(p => p.label)];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-10 h-10 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Memuat riwayat ide...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Riwayat Ide</h1>
          <p className="text-gray-500 mt-1">Semua ide konten yang pernah kamu generate</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Cari ide konten..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-cyan/50 transition-all font-medium"
          />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-bg-surface border border-white/5 rounded-2xl p-6 flex items-center space-x-4">
          <div className="w-12 h-12 bg-brand-cyan/5 rounded-xl flex items-center justify-center border border-brand-cyan/20 shrink-0">
            <Lightbulb className="w-6 h-6 text-brand-cyan" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Ide</p>
            <h3 className="text-2xl font-bold text-white mt-1 leading-none">{stats.totalIdeas}</h3>
          </div>
        </div>
        <div className="bg-bg-surface border border-white/5 rounded-2xl p-6 flex items-center space-x-4">
          <div className="w-12 h-12 bg-purple-500/5 rounded-xl flex items-center justify-center border border-purple-500/20 shrink-0">
            <TrendingUp className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ide Minggu Ini</p>
            <h3 className="text-2xl font-bold text-white mt-1 leading-none">{stats.weeklyIdeas}</h3>
          </div>
        </div>
        <div className="hidden lg:flex bg-bg-surface border border-white/5 rounded-2xl p-6 items-center space-x-4">
          <div className="w-12 h-12 bg-green-500/5 rounded-xl flex items-center justify-center border border-green-500/20 shrink-0">
            <MessageSquare className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Niche Terpopuler</p>
            <h3 className="text-2xl font-bold text-white mt-1 truncate max-w-[150px] leading-none">{stats.popularNiche}</h3>
          </div>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        {platformPills.map(pill => (
          <button 
            key={pill}
            onClick={() => setSelectedPlatform(pill)}
            className={cn(
              "px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
              selectedPlatform === pill 
                ? "bg-brand-cyan text-black border-brand-cyan shadow-lg shadow-brand-cyan/20" 
                : "bg-white/5 text-gray-500 border-white/5 hover:bg-white/10 hover:text-white"
            )}
          >
            {pill}
          </button>
        ))}
      </div>

      {/* Idea Grid / List */}
      <AnimatePresence mode="popLayout">
        {filteredHistory.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredHistory.map((item, idx) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-bg-surface border border-white/5 rounded-2xl p-5 md:p-6 group hover:border-brand-cyan/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <PlatformBadge platform={item.platform} size="sm" />
                    <span className="px-2 py-0.5 rounded-md bg-brand-cyan/10 text-brand-cyan text-[10px] font-bold uppercase tracking-wider border border-brand-cyan/20">
                      {item.niche}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/5 text-gray-500 text-[10px] font-bold uppercase tracking-wider border border-white/5">
                      {item.topic}
                    </span>
                  </div>
                  <h4 className="text-white font-bold text-lg md:text-xl group-hover:text-brand-cyan transition-colors leading-tight">
                    {item.title}
                  </h4>
                  <p className="text-gray-600 text-[11px] font-medium">
                    {(() => {
                      try {
                        return `Disimpan ${format(parseISO(item.createdAt), 'd MMM yyyy, HH:mm', { locale: indonesianLocale })}`;
                      } catch (e) {
                        return "Disimpan";
                      }
                    })()}
                  </p>
                </div>

                <div className="flex items-center space-x-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity border-t border-white/5 md:border-0 pt-4 md:pt-0">
                  <button 
                    onClick={() => onNavigate?.('calendar')}
                    className="flex-1 md:flex-none flex items-center justify-center p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-brand-cyan transition-all"
                  >
                    <CalendarIcon className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="ml-2 md:hidden text-xs font-bold">Jadwal</span>
                  </button>
                  <button 
                    onClick={() => handleCopy(item.title, item.id)}
                    className="flex-1 md:flex-none flex items-center justify-center p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all"
                  >
                    {copiedId === item.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 md:w-5 md:h-5" />}
                    <span className="ml-2 md:hidden text-xs font-bold">Salin</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 md:flex-none flex items-center justify-center p-3 bg-white/5 hover:bg-red-500/20 rounded-xl text-gray-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="ml-2 md:hidden text-xs font-bold">Hapus</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center space-y-6"
          >
            <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center border border-white/5">
              <Lightbulb className="w-12 h-12 text-gray-700" />
            </div>
            <div className="space-y-2 max-w-sm">
              <h3 className="text-xl font-bold text-white">Belum ada ide tersimpan</h3>
              <p className="text-gray-500 text-sm">
                Mulai generate ide di halaman Ide Konten dan klik Simpan Ide untuk menyimpannya di sini.
              </p>
            </div>
            <button 
              onClick={() => onNavigate?.('inspiration')}
              className="flex items-center space-x-2 bg-brand-cyan text-black px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-transform"
            >
              <span>Generate Ide Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
