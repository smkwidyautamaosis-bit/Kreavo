import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  AreaChart, 
  Area,
  PieChart,
  Pie
} from 'recharts';
import { 
  Lightbulb, 
  FolderKanban, 
  Calendar, 
  Zap, 
  TrendingUp, 
  Clock,
  ChevronRight
} from 'lucide-react';
import { 
  format, 
  subDays, 
  isSameDay, 
  parseISO, 
  isWithinInterval,
  startOfToday,
  differenceInDays
} from 'date-fns';
import { id as indonesianLocale } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { PlatformBadge, PLATFORMS } from './PlatformBadge';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface IdeaHistoryItem {
  id: string;
  title: string;
  niche: string;
  topic: string;
  platform: string;
  createdAt: string;
}

interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  platform: string;
  type: string;
  color: string;
}

const DUMMY_DATA = {
  platformDistribution: [
    { name: 'Instagram', value: 35, color: '#ee2a7b' },
    { name: 'TikTok', value: 25, color: '#00f2ea' },
    { name: 'YouTube', value: 20, color: '#FF0000' },
    { name: 'X', value: 10, color: '#ffffff' },
    { name: 'Lainnya', value: 10, color: '#06B6D4' },
  ],
  weeklyActivity: [
    { name: 'Sen', value: 4 },
    { name: 'Sel', value: 7 },
    { name: 'Rab', value: 5 },
    { name: 'Kam', value: 8 },
    { name: 'Jum', value: 12 },
    { name: 'Sab', value: 10 },
    { name: 'Min', value: 6 },
  ]
};

const COUNT_UP_DURATION = 1500;

const CountUp = ({ end, className }: { end: number, className?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / COUNT_UP_DURATION, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end]);

  return <span className={className}>{count}</span>;
};

export default function Analytics() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');
  const [history, setHistory] = useState<IdeaHistoryItem[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAnalyticsData = async () => {
      try {
        const ideasSnap = await getDocs(collection(db, `users/${user.uid}/ideas`));
        const ideasList = ideasSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as IdeaHistoryItem[];
        setHistory(ideasList);

        const calSnap = await getDocs(collection(db, `users/${user.uid}/calendar`));
        const calList = calSnap.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            title: d.title || '',
            platform: d.platform || 'instagram',
            type: d.contentType || d.type || 'Feed Post',
            color: d.color || 'bg-brand-cyan',
            date: d.date || new Date().toISOString()
          };
        }) as CalendarEvent[];
        setCalendarEvents(calList);

        const projSnap = await getDocs(collection(db, `users/${user.uid}/projects`));
        const projList = projSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as any[];
        setProjects(projList);
      } catch (err) {
        console.error("Error loading analytics data from Firestore:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [user]);

  const stats = useMemo(() => {
    const totalIdeas = history.length;
    const activeProjects = projects.filter(p => p.status === 'progress').length;
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const scheduledThisMonth = calendarEvents.filter(e => {
      try {
        const date = parseISO(e.date);
        return isWithinInterval(date, { start: startOfMonth, end: endOfMonth });
      } catch (err) {
        return false;
      }
    }).length;

    // Calculate streak
    const activityDates = new Set([
      ...history.map(h => {
        try {
          return format(parseISO(h.createdAt), 'yyyy-MM-dd');
        } catch (err) {
          return '';
        }
      }).filter(Boolean),
      ...calendarEvents.map(e => {
        try {
          return format(parseISO(e.date), 'yyyy-MM-dd');
        } catch (err) {
          return '';
        }
      }).filter(Boolean)
    ]);

    const sortedDates = Array.from(activityDates).sort((a, b) => b.localeCompare(a));
    let streak = 0;
    let currentDate = startOfToday();

    // If last activity is not today or yesterday, streak is 0
    const lastActivityStr = sortedDates[0];
    if (lastActivityStr) {
      try {
        const lastActivityDate = parseISO(lastActivityStr);
        if (differenceInDays(currentDate, lastActivityDate) > 1) {
          streak = 0;
        } else {
          // Simple streak count
          for (let i = 0; i < 1000; i++) {
            const dateStr = format(subDays(currentDate, i), 'yyyy-MM-dd');
            if (activityDates.has(dateStr)) {
              streak++;
            } else {
              break;
            }
          }
        }
      } catch (err) {
        streak = 0;
      }
    }

    return { totalIdeas, activeProjects, scheduledThisMonth, streak };
  }, [history, calendarEvents, projects]);

  const chartData = useMemo(() => {
    const platformCounts = history.reduce((acc, item) => {
      acc[item.platform] = (acc[item.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const barData = PLATFORMS.map(p => ({
      name: p.label,
      value: platformCounts[p.value] || (history.length === 0 ? Math.floor(Math.random() * 10) + 5 : 0),
      color: p.value === 'instagram' ? '#ee2a7b' : 
             p.value === 'tiktok' ? '#00f2ea' :
             p.value === 'youtube' ? '#FF0000' :
             p.value === 'twitter' ? '#ffffff' :
             p.value === 'linkedin' ? '#0077B5' : '#06B6D4'
    }));

    const weeklyData = Array.from({ length: 7 }).map((_, i) => {
      const day = subDays(new Date(), 6 - i);
      const count = history.filter(h => {
        try {
          return isSameDay(parseISO(h.createdAt), day);
        } catch (err) {
          return false;
        }
      }).length;
      return {
        name: format(day, 'EEE', { locale: indonesianLocale }),
        value: history.length === 0 ? DUMMY_DATA.weeklyActivity[i].value : count
      };
    });

    const pieData = barData.filter(d => d.value > 0);
    if (pieData.length === 0) {
      pieData.push(...DUMMY_DATA.platformDistribution);
    }

    return { barData, weeklyData, pieData };
  }, [history]);

  const recentIdeas = useMemo(() => {
    return [...history]
      .sort((a, b) => {
        try {
          return parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime();
        } catch (err) {
          return 0;
        }
      })
      .slice(0, 5);
  }, [history]);

  const isEmpty = history.length === 0 && calendarEvents.length === 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-10 h-10 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Memuat analitik...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-10 pb-20 animate-in fade-in duration-700 px-1 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Analitik</h1>
          <p className="text-gray-500 text-sm md:text-base">Pantau perkembangan kreativitas kamu</p>
        </div>

        <div className="flex items-center space-x-1 bg-white/5 p-1 rounded-xl border border-white/5 self-start md:self-auto overflow-x-auto max-w-full">
          {[
            { id: '7d', label: '7 Hari' },
            { id: '30d', label: '30 Hari' },
            { id: 'all', label: 'Semua' }
          ].map(p => (
            <button 
              key={p.id}
              onClick={() => setTimeRange(p.id as any)}
              className={cn(
                "px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all whitespace-nowrap",
                timeRange === p.id 
                  ? "bg-brand-cyan text-black shadow-lg shadow-brand-cyan/20" 
                  : "text-gray-500 hover:text-white"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isEmpty && (
        <div className="bg-brand-cyan/10 border border-brand-cyan/20 rounded-2xl p-5 md:p-6 flex items-start md:items-center space-x-4">
          <TrendingUp className="w-5 h-5 text-brand-cyan shrink-0 mt-0.5 md:mt-0" />
          <p className="text-xs md:text-sm text-brand-cyan font-medium">
            📊 Data analitik akan muncul setelah kamu mulai generate ide dan jadwalkan konten.
          </p>
        </div>
      )}

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          icon={<Lightbulb className="w-5 h-5 text-brand-cyan" />}
          label="Total Ide Dibuat"
          value={stats.totalIdeas}
          subtext="ide tersimpan"
          color="cyan"
        />
        <StatCard 
          icon={<FolderKanban className="w-5 h-5 text-purple-500" />}
          label="Projek Aktif"
          value={stats.activeProjects}
          subtext="sedang berjalan"
          color="purple"
        />
        <StatCard 
          icon={<Calendar className="w-5 h-5 text-green-500" />}
          label="Terjadwal"
          value={stats.scheduledThisMonth}
          subtext="di kalender"
          color="green"
        />
        <StatCard 
          icon={<Zap className="w-5 h-5 text-orange-500" />}
          label="Streak"
          value={stats.streak}
          subtext="hari aktif"
          color="orange"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="lg:col-span-6 bg-bg-surface border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 md:space-y-8 h-[350px] md:h-[450px]">
          <div>
            <h3 className="text-base md:text-lg font-bold text-white tracking-tight">Distribusi Platform</h3>
            <p className="text-[10px] md:text-xs text-gray-500 mt-1">Berdasarkan riwayat ide</p>
          </div>
          <div className="h-full pb-16 md:pb-12">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.barData} margin={{ top: 20, right: 30, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 9, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 9 }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={32}>
                  {chartData.barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-bg-surface border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 md:space-y-8 h-[350px] md:h-[450px]">
          <div>
            <h3 className="text-base md:text-lg font-bold text-white tracking-tight">Aktivitas Mingguan</h3>
            <p className="text-[10px] md:text-xs text-gray-500 mt-1">Total ide di-generate</p>
          </div>
          <div className="h-full pb-16 md:pb-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.weeklyData} margin={{ top: 20, right: 10, left: -40, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 9, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#06B6D4" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorVal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-surface border border-white/5 rounded-3xl p-8 space-y-8 min-h-[400px]">
          <h3 className="text-lg font-bold text-white tracking-tight">Platform Terfavorit</h3>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {chartData.pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-4 w-full">
              {chartData.pieData.map((entry: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm font-bold text-gray-400">{entry.name}</span>
                  </div>
                  <span className="text-sm font-black text-white">
                    {Math.round((entry.value / chartData.pieData.reduce((a, b) => a + (b.value || 0), 0)) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-bg-surface border border-white/5 rounded-3xl p-8 space-y-6 min-h-[400px]">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white tracking-tight">Ide Terbaru</h3>
            <button className="text-xs font-bold text-brand-cyan hover:underline flex items-center">
              Lihat semua <ChevronRight className="w-3 h-3 ml-1" />
            </button>
          </div>
          
          <div className="space-y-4">
            {recentIdeas.length > 0 ? (
              recentIdeas.map((idea) => (
                <div key={idea.id} className="flex items-center justify-between group p-1">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <PlatformBadge platform={idea.platform} size="sm" />
                    <span className="text-sm font-bold text-gray-300 truncate group-hover:text-white transition-colors">
                      {idea.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-600 whitespace-nowrap ml-4">
                    {getTimeAgo(idea.createdAt)}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Clock className="w-10 h-10 text-gray-800" />
                <p className="text-sm text-gray-600 font-medium italic">Belum ada riwayat ide</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subtext, color }: { icon: React.ReactNode, label: string, value: number, subtext: string, color: string }) {
  const colorBgs = {
    cyan: 'bg-brand-cyan/10 border-brand-cyan/20',
    purple: 'bg-purple-500/10 border-purple-500/20',
    green: 'bg-green-500/10 border-green-500/20',
    orange: 'bg-orange-500/10 border-orange-500/20',
  };

  return (
    <div className="bg-bg-surface border border-white/5 rounded-2xl p-6 space-y-4 hover:border-white/10 transition-all">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", colorBgs[color as keyof typeof colorBgs])}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</p>
        <div className="flex items-end space-x-2 mt-1">
          <CountUp end={value} className="text-3xl font-black text-white leading-none" />
          <span className="text-[10px] font-bold text-gray-600 mb-0.5">{subtext}</span>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(date: string) {
  try {
    const d = parseISO(date);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - d.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Baru saja';
    if (diffInMinutes < 60) return `${diffInMinutes} mnt lalu`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} jam lalu`;
    return format(d, 'd MMM', { locale: indonesianLocale });
  } catch (err) {
    return 'Baru saja';
  }
}
