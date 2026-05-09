import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  CheckCircle2,
  X
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  eachDayOfInterval, 
  isToday,
  isPast,
  parseISO
} from 'date-fns';
import { id as indonesianLocale } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { PlatformBadge, PLATFORMS } from './PlatformBadge';
import { useAuth } from '../contexts/AuthContext';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ContentEvent {
  id: string;
  date: string; // ISO string
  title: string;
  platform: string;
  type: string; // contentType in Firestore
  color: string;
}

const CONTENT_TYPES = [
  'Feed Post', 'Reels/Short', 'Story', 'Thread', 'Video Panjang', 'Artikel'
];

const COLORS = [
  { name: 'Cyan', value: 'bg-brand-cyan', text: 'text-brand-cyan', border: 'border-brand-cyan/20' },
  { name: 'Purple', value: 'bg-purple-500', text: 'text-purple-500', border: 'border-purple-500/20' },
  { name: 'Green', value: 'bg-green-500', text: 'text-green-500', border: 'border-green-500/20' },
  { name: 'Orange', value: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500/20' },
];

export default function ContentCalendar() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<ContentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [newEvent, setNewEvent] = useState({
    title: '',
    platform: 'instagram',
    type: 'Feed Post',
    color: 'bg-brand-cyan'
  });

  // Load persistence from Firestore
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, `users/${user.uid}/calendar`));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          platform: data.platform || 'instagram',
          type: data.contentType || data.type || 'Feed Post',
          color: data.color || 'bg-brand-cyan',
          date: data.date || new Date().toISOString()
        };
      }) as ContentEvent[];
      setEvents(items);
      setLoading(false);
    }, (error) => {
      console.error("Firestore loading error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = useMemo(() => {
    const allDays = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });
    
    if (isMobile) {
      // On mobile, show current week if today is in current month, otherwise show first week
      const targetDay = isSameMonth(new Date(), currentMonth) ? new Date() : monthStart;
      const weekStart = startOfWeek(targetDay);
      const weekEnd = endOfWeek(targetDay);
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }
    
    return allDays;
  }, [startDate, endDate, isMobile, currentMonth, monthStart]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const handleAddEvent = async () => {
    if (!user || !newEvent.title || !selectedDate) return;

    try {
      await addDoc(collection(db, `users/${user.uid}/calendar`), {
        title: newEvent.title,
        platform: newEvent.platform,
        contentType: newEvent.type,
        color: newEvent.color,
        date: selectedDate.toISOString(),
        createdAt: new Date().toISOString(),
        userId: user.uid
      });

      setIsModalOpen(false);
      setNewEvent({
        title: '',
        platform: 'instagram',
        type: 'Feed Post',
        color: 'bg-brand-cyan'
      });
    } catch (err) {
      console.error("Error adding event:", err);
      alert("Gagal menyimpan data. Periksa koneksi internet kamu.");
    }
  };

  const handleDeleteEvent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/calendar`, id));
    } catch (err) {
      console.error("Error deleting event:", err);
      alert("Gagal menghapus data. Periksa koneksi internet kamu.");
    }
  };

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      try {
        return isSameDay(parseISO(event.date), day);
      } catch (e) {
        return false;
      }
    });
  };

  // Stats calculation
  const stats = useMemo(() => {
    const monthEvents = events.filter(e => {
      try {
        return isSameMonth(parseISO(e.date), currentMonth);
      } catch (err) {
        return false;
      }
    });
    const totalContent = monthEvents.length;
    
    const platformCounts = monthEvents.reduce((acc, e) => {
      acc[e.platform] = (acc[e.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topPlatformKey = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topPlatform = PLATFORMS.find(p => p.value === topPlatformKey)?.label || '-';

    const activeDaysCount = new Set(monthEvents.map(e => {
      try {
        return format(parseISO(e.date), 'yyyy-MM-dd');
      } catch (err) {
        return '';
      }
    }).filter(Boolean)).size;

    return { totalContent, topPlatform: topPlatformKey || '-', activeDaysCount };
  }, [events, currentMonth]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-10 h-10 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Memuat kalender...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Kalender Konten</h1>
          <p className="text-gray-500 mt-1">Rencanakan jadwal posting konten kamu</p>
        </div>

        <div className="flex items-center space-x-4 bg-white/5 p-1.5 rounded-xl border border-white/5">
          <button 
            onClick={prevMonth}
            className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-white min-w-[120px] text-center uppercase tracking-widest">
            {format(currentMonth, 'MMMM yyyy', { locale: indonesianLocale })}
          </span>
          <button 
            onClick={nextMonth}
            className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto md:overflow-visible pb-4 md:pb-0 scrollbar-hide px-4 -mx-4 md:px-0 md:mx-0">
        <div className="bg-bg-surface border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 shrink-0 w-[240px] md:w-auto transform transition-transform md:hover:scale-[1.02]">
          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 shrink-0">
            <CalendarIcon className="w-6 h-6 text-brand-cyan" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">Total Bulan Ini</p>
            <h3 className="text-xl md:text-2xl font-bold text-white mt-2 leading-none">{stats.totalContent}</h3>
          </div>
        </div>
        <div className="bg-bg-surface border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 shrink-0 w-[240px] md:w-auto transform transition-transform md:hover:scale-[1.02]">
          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 shrink-0">
            {stats.topPlatform !== '-' ? (
              <PlatformBadge platform={stats.topPlatform} />
            ) : (
              <TrendingUp className="w-6 h-6 text-purple-500" />
            )}
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">Terbanyak</p>
            <h3 className="text-xl md:text-2xl font-bold text-white mt-2 leading-none capitalize">{stats.topPlatform}</h3>
          </div>
        </div>
        <div className="bg-bg-surface border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 shrink-0 w-[240px] md:w-auto transform transition-transform md:hover:scale-[1.02]">
          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 shrink-0">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">Hari Aktif</p>
            <h3 className="text-xl md:text-2xl font-bold text-white mt-2 leading-none">{stats.activeDaysCount} Hari</h3>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl">
        <div className="grid grid-cols-7 border-b border-white/5 bg-white/[0.02]">
          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
            <div key={day} className="py-4 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const dayEvents = getEventsForDay(day);
            const isSelectedMonth = isSameMonth(day, monthStart);
            const isTodayDate = isToday(day);
            const isPastDate = isPast(day) && !isTodayDate;

            return (
              <div 
                key={day.toISOString()}
                className={cn(
                  "min-h-[100px] md:min-h-[140px] p-2 border-r border-b border-white/5 relative group transition-colors hover:bg-white/[0.02] cursor-pointer md:cursor-default",
                  !isSelectedMonth && !isMobile && "opacity-20",
                  idx % 7 === 6 && "border-r-0"
                )}
                onClick={() => {
                  if (isMobile) {
                    setSelectedDate(day);
                    setIsModalOpen(true);
                  }
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "w-7 h-7 flex items-center justify-center text-[10px] md:text-xs font-bold rounded-full",
                    isTodayDate ? "bg-brand-cyan text-black" : "text-gray-500",
                    isPastDate && "opacity-50"
                  )}>
                    {format(day, 'd')}
                  </span>
                  
                  {!isMobile && isSelectedMonth && (
                    <button 
                      onClick={() => {
                        setSelectedDate(day);
                        setIsModalOpen(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-lg text-brand-cyan transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  {dayEvents.slice(0, isMobile ? 1 : 2).map(event => {
                    const colorData = COLORS.find(c => c.value === event.color);
                    return (
                      <div 
                        key={event.id}
                        className={cn(
                          "px-1.5 md:px-2 py-0.5 md:py-1 rounded-md text-[8px] md:text-[10px] font-bold flex items-center justify-between group/tag animate-in fade-in slide-in-from-bottom-1",
                          colorData?.value, "bg-opacity-10", colorData?.text, "border", colorData?.border
                        )}
                        title={`${event.title} (${event.type})`}
                      >
                        <span className="truncate flex items-center space-x-1.5">
                          {!isMobile && <PlatformBadge platform={event.platform} size="sm" />}
                          <span className="truncate">{event.title}</span>
                        </span>
                        {!isMobile && (
                          <button 
                            onClick={(e) => handleDeleteEvent(event.id, e)}
                            className="opacity-0 group-hover/tag:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {dayEvents.length > (isMobile ? 1 : 2) && (
                    <div className="text-[8px] md:text-[10px] text-gray-600 font-bold px-1 md:px-2">
                      +{dayEvents.length - (isMobile ? 1 : 2)} {isMobile ? '' : 'lagi'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Event Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center md:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95, y: 20 }}
              animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
              exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={cn(
                "relative w-full bg-bg-dark border border-white/10 p-8 shadow-2xl overflow-hidden",
                isMobile ? "h-full rounded-t-[2.5rem] mt-20" : "max-w-md rounded-[3rem]"
              )}
            >
              <div className="absolute top-0 right-0 p-6">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Tambah Konten</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    Untuk tanggal {selectedDate && format(selectedDate, 'd MMMM yyyy', { locale: indonesianLocale })}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Judul Konten</label>
                    <input 
                      type="text" 
                      placeholder="Masukkan judul konten..."
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-cyan/50 transition-all font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Platform</label>
                      <div className="relative">
                        <select 
                          value={newEvent.platform}
                          onChange={(e) => setNewEvent({ ...newEvent, platform: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white focus:outline-none focus:border-brand-cyan/50 transition-all font-medium appearance-none"
                        >
                          {PLATFORMS.map(p => (
                            <option key={p.value} value={p.value} className="bg-bg-dark">{p.label}</option>
                          ))}
                        </select>
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <PlatformBadge platform={newEvent.platform} />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Tipe Konten</label>
                      <select 
                        value={newEvent.type}
                        onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-cyan/50 transition-all font-medium appearance-none"
                      >
                        {CONTENT_TYPES.map(type => (
                          <option key={type} value={type} className="bg-bg-dark">{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Warna Tag</label>
                    <div className="flex items-center space-x-3 p-1">
                      {COLORS.map(color => (
                        <button 
                          key={color.value}
                          onClick={() => setNewEvent({ ...newEvent, color: color.value })}
                          className={cn(
                            "w-8 h-8 rounded-full transition-all border-4",
                            color.value,
                            newEvent.color === color.value ? "border-white/20 scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <button 
                    onClick={handleAddEvent}
                    disabled={!newEvent.title}
                    className="w-full py-4 bg-brand-cyan text-black font-extrabold rounded-2xl hover:bg-brand-cyan/90 transition-all shadow-xl shadow-brand-cyan/20 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs"
                  >
                    Simpan ke Kalender
                  </button>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="w-full py-3 bg-white/5 text-gray-400 font-bold rounded-2xl hover:bg-white/10 hover:text-white transition-all text-sm"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
