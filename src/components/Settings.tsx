import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { updateProfile } from 'firebase/auth';
import { 
  User, UserCheck, ShieldAlert, Sliders, Monitor, Bell, Lock, 
  Check, ChevronRight, Download, RefreshCw, Smartphone, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type SettingsTab = 'profile' | 'preferences' | 'display' | 'notifications' | 'privacy';

export default function Settings() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [toast, setToast] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Unsaved changes tracking (isDirty) per tab
  const [isProfileDirty, setIsProfileDirty] = useState(false);
  const [isPrefDirty, setIsPrefDirty] = useState(false);
  const [isDisplayDirty, setIsDisplayDirty] = useState(false);
  const [isNotifDirty, setIsNotifDirty] = useState(false);

  // --- STATE 1: PROFIL ---
  const [profileForm, setProfileForm] = useState({
    displayName: user?.displayName || '',
    bio: '',
    username: ''
  });

  // --- STATE 2: PREFERENSI KONTEN ---
  const [prefForm, setPrefForm] = useState({
    platforms: [] as string[],
    defaultNiche: '',
    languageStyle: 'Santai & Friendly',
    targetAudience: 'Semua Umur'
  });

  // --- STATE 3: TAMPILAN ---
  const [displayForm, setDisplayForm] = useState({
    theme: 'dark',
    fontSize: 'normal' as 'small' | 'normal' | 'large',
    appLanguage: 'Indonesia',
    animations: true
  });

  // --- STATE 4: NOTIFIKASI ---
  const [notifForm, setNotifForm] = useState({
    dailyReminder: true,
    deadlineReminder: true,
    dailyIdeas: true,
    featureUpdates: true
  });

  // --- STATE 5: PRIVASI & AKUN ---
  const [timezone, setTimezone] = useState('WIB (UTC+7)');

  // Helper to trigger toast
  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // --- LOAD INITIAL DATA ---
  useEffect(() => {
    if (!user) return;

    const loadSettings = async () => {
      // 1. Load Profile & Preferences from Firestore (or LocalStorage fallback)
      try {
        const profileDoc = await getDoc(doc(db, `users/${user.uid}/profile`, 'info'));
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          setProfileForm({
            displayName: data.displayName || user.displayName || '',
            bio: data.bio || '',
            username: data.username || ''
          });
        }

        const prefDoc = await getDoc(doc(db, `users/${user.uid}/preferences`, 'info'));
        if (prefDoc.exists()) {
          const data = prefDoc.data();
          setPrefForm({
            platforms: data.platforms || [],
            defaultNiche: data.defaultNiche || '',
            languageStyle: data.languageStyle || 'Santai & Friendly',
            targetAudience: data.targetAudience || 'Semua Umur'
          });
        }
      } catch (e) {
        console.error("Error loading settings from Firestore: ", e);
        // LocalStorage Fallbacks
        const localProfile = localStorage.getItem('kreavo_profile');
        if (localProfile) {
          setProfileForm(JSON.parse(localProfile));
        }
        const localPref = localStorage.getItem('kreavo_preferences');
        if (localPref) {
          setPrefForm(JSON.parse(localPref));
        }
      }

      // 2. Load Tampilan from localStorage
      const localDisplay = localStorage.getItem('kreavo_display_settings');
      if (localDisplay) {
        setDisplayForm(JSON.parse(localDisplay));
      }

      // 3. Load Notifikasi from localStorage
      const localNotif = localStorage.getItem('kreavo_notification_settings');
      if (localNotif) {
        setNotifForm(JSON.parse(localNotif));
      }
    };

    loadSettings();
  }, [user]);

  // --- SAVE PROFIL ---
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!profileForm.displayName.trim()) {
      triggerToast("❌ Nama Tampilan tidak boleh kosong!");
      return;
    }

    setIsSaving(true);
    try {
      // Update local auth profile display name
      await updateProfile(user, { displayName: profileForm.displayName });

      const profileData = {
        displayName: profileForm.displayName,
        bio: profileForm.bio,
        username: profileForm.username,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, `users/${user.uid}/profile`, 'info'), profileData);
      localStorage.setItem('kreavo_profile', JSON.stringify(profileData));
      
      setIsProfileDirty(false);
      triggerToast("✅ Profil berhasil diperbarui!");
    } catch (err) {
      console.error(err);
      triggerToast("❌ Gagal menyimpan profil.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- SAVE PREFERENSI KONTEN ---
  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      await setDoc(doc(db, `users/${user.uid}/preferences`, 'info'), prefForm);
      localStorage.setItem('kreavo_preferences', JSON.stringify(prefForm));
      // Pre-fill the InspirationBoard's default niche directly for easier usage
      localStorage.setItem('kreavo_default_niche', prefForm.defaultNiche);

      setIsPrefDirty(false);
      triggerToast("✅ Preferensi konten berhasil disimpan!");
    } catch (err) {
      console.error(err);
      triggerToast("❌ Gagal menyimpan preferensi.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- SAVE TAMPILAN ---
  const handleSaveDisplay = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('kreavo_display_settings', JSON.stringify(displayForm));
    setIsDisplayDirty(false);
    triggerToast("✅ Pengaturan tampilan berhasil disimpan!");
  };

  // --- SAVE NOTIFIKASI ---
  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('kreavo_notification_settings', JSON.stringify(notifForm));
    setIsNotifDirty(false);
    triggerToast("✅ Preferensi notifikasi berhasil disimpan!");
  };

  // --- EXPORT LOCALSTORAGE DATA ---
  const handleExportData = () => {
    const allData: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('kreavo_') || key === 'kreavo_preferences' || key === 'kreavo_profile')) {
        allData[key] = localStorage.getItem(key);
      }
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "kreavo-data-export.json");
    dlAnchorElem.click();
    triggerToast("📥 Data berhasil diekspor!");
  };

  // --- DANGER ZONE ACTIONS ---
  const handleSignOutAll = async () => {
    localStorage.clear();
    await signOut();
  };

  const handleClearAllLocal = () => {
    const confirmClear = window.confirm("Apakah Anda yakin ingin menghapus semua data lokal Kreavo? Tindakan ini tidak dapat dibatalkan.");
    if (confirmClear) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('kreavo_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      triggerToast("🧹 Semua data lokal berhasil dibersihkan!");
      window.location.reload();
    }
  };

  // Helper details
  const getBrowserName = () => {
    const ua = navigator.userAgent;
    if (ua.includes("Chrome") && !ua.includes("Chromium") && !ua.includes("Edg")) return "Google Chrome";
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Apple Safari";
    if (ua.includes("Firefox")) return "Mozilla Firefox";
    if (ua.includes("Edg")) return "Microsoft Edge";
    return "Browser Aktif";
  };

  const formatLastSignIn = (timeStr?: string) => {
    if (!timeStr) return "Baru saja";
    const d = new Date(timeStr);
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const date = d.getDate();
    const monthName = monthNames[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${date} ${monthName} ${year}, ${hours}:${minutes}`;
  };

  const tabs = [
    { id: 'profile' as SettingsTab, label: 'Profil', icon: '👤' },
    { id: 'preferences' as SettingsTab, label: 'Preferensi Konten', icon: '🎨' },
    { id: 'display' as SettingsTab, label: 'Tampilan', icon: '🖥️' },
    { id: 'notifications' as SettingsTab, label: 'Notifikasi', icon: '🔔' },
    { id: 'privacy' as SettingsTab, label: 'Privasi & Akun', icon: '🔒' }
  ];

  return (
    <div className="space-y-10 md:space-y-12 max-w-5xl mx-auto px-1 md:px-0">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 bg-[#0B0B0B]/95 border border-brand-cyan/20 px-5 py-3.5 rounded-2xl shadow-xl shadow-brand-cyan/5 text-white text-sm font-semibold backdrop-blur-xl z-[100] flex items-center space-x-2"
          >
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        <h2 className="text-3xl md:text-5xl font-[800] text-white tracking-tight title-accent">Pengaturan</h2>
        <p className="text-gray-500 text-base max-w-2xl leading-relaxed">Kelola akun dan preferensi Kreavo kamu</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Vertical Tabs */}
        <div className="w-full lg:w-[240px] shrink-0 card-subtle p-2 space-y-1 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all shrink-0 text-left w-auto lg:w-full border-l-2 ${
                  isActive 
                    ? 'bg-brand-cyan/10 border-brand-cyan text-brand-cyan font-bold shadow-[0_0_15px_rgba(6,182,212,0.05)]' 
                    : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Content Panel */}
        <div className="flex-1 w-full card-subtle p-6 md:p-8 min-h-[450px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* --- TAB 1: PROFIL --- */}
              {activeTab === 'profile' && (
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 pb-6 border-b border-white/5">
                    {user?.photoURL && !avatarError ? (
                      <img 
                        src={user.photoURL} 
                        alt="Profile" 
                        referrerPolicy="no-referrer"
                        onError={() => setAvatarError(true)}
                        className="w-16 h-16 rounded-full border border-white/10 shrink-0 object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-[#06B6D4] flex items-center justify-center text-white font-bold text-2xl shrink-0 border border-white/10">
                        {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <div className="text-center sm:text-left">
                      <h4 className="text-sm font-bold text-white">Foto Profil</h4>
                      <p className="text-xs text-gray-500 mt-1">Foto diambil dari akun Google kamu</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block ml-1">Nama Tampilan</label>
                      <input
                        type="text"
                        value={profileForm.displayName}
                        onChange={(e) => {
                          setProfileForm({ ...profileForm, displayName: e.target.value });
                          setIsProfileDirty(true);
                        }}
                        placeholder="Nama Tampilan Anda"
                        className="w-full input-glow py-3.5 px-4 text-white text-sm"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block ml-1 flex items-center">
                        Email <Lock className="w-3 h-3 ml-1.5 text-gray-600" />
                      </label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full input-glow py-3.5 px-4 text-gray-600 text-sm bg-black/20 border-white/5 cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Bio Singkat</label>
                        <span className="text-[10px] text-gray-600 font-bold">{profileForm.bio.length}/150</span>
                      </div>
                      <textarea
                        value={profileForm.bio}
                        onChange={(e) => {
                          if (e.target.value.length <= 150) {
                            setProfileForm({ ...profileForm, bio: e.target.value });
                            setIsProfileDirty(true);
                          }
                        }}
                        placeholder="Ceritakan sedikit tentang kamu sebagai kreator..."
                        className="w-full input-glow py-3.5 px-4 text-white text-sm h-24 resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block ml-1">Username Kreavo</label>
                      <input
                        type="text"
                        value={profileForm.username}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (!val.startsWith('@') && val.length > 0) val = '@' + val;
                          if (val.length <= 20) {
                            setProfileForm({ ...profileForm, username: val });
                            setIsProfileDirty(true);
                          }
                        }}
                        placeholder="@username"
                        className="w-full input-glow py-3.5 px-4 text-white text-sm"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className={`text-xs font-bold text-brand-cyan flex items-center transition-opacity ${isProfileDirty ? 'opacity-100' : 'opacity-0'}`}>
                      <span className="inline-block w-2 h-2 rounded-full bg-brand-cyan mr-2 animate-pulse" />
                      Ada perubahan belum disimpan
                    </span>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="primary-button w-full sm:w-auto h-12 px-8 text-xs uppercase tracking-widest font-bold ml-auto"
                    >
                      {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                  </div>
                </form>
              )}

              {/* --- TAB 2: PREFERENSI KONTEN --- */}
              {activeTab === 'preferences' && (
                <form onSubmit={handleSavePreferences} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block ml-1">Platform Favorit</label>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {['Instagram', 'TikTok', 'YouTube', 'Twitter/X', 'LinkedIn', 'Blog'].map((platform) => {
                          const isSelected = prefForm.platforms.includes(platform);
                          return (
                            <button
                              type="button"
                              key={platform}
                              onClick={() => {
                                const next = isSelected 
                                  ? prefForm.platforms.filter(p => p !== platform)
                                  : [...prefForm.platforms, platform];
                                setPrefForm({ ...prefForm, platforms: next });
                                setIsPrefDirty(true);
                              }}
                              className={`px-4 py-2.5 rounded-full text-xs font-bold border transition-all duration-300 ${
                                isSelected 
                                  ? 'bg-brand-cyan text-black border-brand-cyan shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                                  : 'bg-black/35 text-gray-400 border-white/5 hover:border-white/10 hover:text-white'
                              }`}
                            >
                              {platform}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block ml-1">Niche Default</label>
                      <input
                        type="text"
                        value={prefForm.defaultNiche}
                        onChange={(e) => {
                          setPrefForm({ ...prefForm, defaultNiche: e.target.value });
                          setIsPrefDirty(true);
                        }}
                        placeholder="contoh: teknologi, kuliner, traveling"
                        className="w-full input-glow py-3.5 px-4 text-white text-sm"
                      />
                      <p className="text-[10px] text-gray-600 ml-1">Bidang konten ini akan pre-fill form Ide Konten kamu secara otomatis.</p>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block ml-1">Gaya Bahasa Konten</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          'Santai & Friendly',
                          'Profesional & Formal',
                          'Humor & Entertaining',
                          'Edukatif & Informatif'
                        ].map((style) => (
                          <label 
                            key={style}
                            className={`flex items-center space-x-3 p-4 rounded-2xl border bg-black/10 cursor-pointer transition-all ${
                              prefForm.languageStyle === style 
                                ? 'border-brand-cyan/20 bg-brand-cyan/5 text-brand-cyan' 
                                : 'border-white/5 text-gray-400 hover:border-white/10'
                            }`}
                          >
                            <input
                              type="radio"
                              name="languageStyle"
                              value={style}
                              checked={prefForm.languageStyle === style}
                              onChange={() => {
                                setPrefForm({ ...prefForm, languageStyle: style });
                                setIsPrefDirty(true);
                              }}
                              className="accent-brand-cyan w-4 h-4"
                            />
                            <span className="text-xs font-semibold">{style}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block ml-1">Target Audiens</label>
                      <select
                        value={prefForm.targetAudience}
                        onChange={(e) => {
                          setPrefForm({ ...prefForm, targetAudience: e.target.value });
                          setIsPrefDirty(true);
                        }}
                        className="w-full input-glow py-3.5 px-4 text-white text-sm bg-bg-dark border-white/5 focus:border-brand-cyan"
                      >
                        <option value="Gen Z (15-25 tahun)">Gen Z (15-25 tahun)</option>
                        <option value="Millennial (26-35 tahun)">Millennial (26-35 tahun)</option>
                        <option value="Dewasa (36-45 tahun)">Dewasa (36-45 tahun)</option>
                        <option value="Semua Umur">Semua Umur</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className={`text-xs font-bold text-brand-cyan flex items-center transition-opacity ${isPrefDirty ? 'opacity-100' : 'opacity-0'}`}>
                      <span className="inline-block w-2 h-2 rounded-full bg-brand-cyan mr-2 animate-pulse" />
                      Ada perubahan belum disimpan
                    </span>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="primary-button w-full sm:w-auto h-12 px-8 text-xs uppercase tracking-widest font-bold ml-auto"
                    >
                      {isSaving ? 'Menyimpan...' : 'Simpan Preferensi'}
                    </button>
                  </div>
                </form>
              )}

              {/* --- TAB 3: TAMPILAN --- */}
              {activeTab === 'display' && (
                <form onSubmit={handleSaveDisplay} className="space-y-6">
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block ml-1">Tema Aplikasi</label>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Dark Mode Card */}
                        <div className="p-5 rounded-2xl border border-brand-cyan bg-brand-cyan/5 flex items-center justify-between cursor-pointer">
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">🌙</span>
                            <span className="text-sm font-semibold text-white">Dark Mode</span>
                          </div>
                          <Check className="w-4 h-4 text-brand-cyan shrink-0" />
                        </div>
                        {/* Light Mode (disabled) */}
                        <div className="p-5 rounded-2xl border border-white/5 bg-black/20 flex items-center justify-between opacity-50 cursor-not-allowed relative overflow-hidden">
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">☀️</span>
                            <span className="text-sm font-semibold text-gray-500">Light Mode</span>
                          </div>
                          <span className="absolute top-2 right-2 text-[8px] bg-white/10 text-gray-400 font-bold uppercase tracking-widest px-1.5 py-0.5 rounded">
                            Soon
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block ml-1">Ukuran Teks</label>
                      <div className="space-y-3 pt-2">
                        <input
                          type="range"
                          min="1"
                          max="3"
                          step="1"
                          value={displayForm.fontSize === 'small' ? '1' : displayForm.fontSize === 'normal' ? '2' : '3'}
                          onChange={(e) => {
                            const val = e.target.value;
                            const size = val === '1' ? 'small' : val === '2' ? 'normal' : 'large';
                            setDisplayForm({ ...displayForm, fontSize: size });
                            setIsDisplayDirty(true);
                          }}
                          className="w-full accent-brand-cyan"
                        />
                        <div className="flex justify-between text-[10px] text-gray-500 font-bold px-1 uppercase tracking-wider">
                          <span>Kecil</span>
                          <span className="text-brand-cyan">Normal</span>
                          <span>Besar</span>
                        </div>
                        {/* Live Preview Card */}
                        <div className="p-4 rounded-xl bg-black/20 border border-white/5 text-center mt-2">
                          <p className={`text-gray-400 font-medium transition-all ${
                            displayForm.fontSize === 'small' ? 'text-xs' : displayForm.fontSize === 'normal' ? 'text-sm' : 'text-base'
                          }`}>
                            Pratinjau: Teks Kreavo akan terlihat seperti ini di layar kamu.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block ml-1">Bahasa Aplikasi</label>
                      <div className="flex space-x-2">
                        {[
                          { key: 'Indonesia', label: '🇮🇩 Indonesia' },
                          { key: 'English', label: '🇬🇧 English' }
                        ].map((lang) => (
                          <button
                            type="button"
                            key={lang.key}
                            onClick={() => {
                              setDisplayForm({ ...displayForm, appLanguage: lang.key });
                              setIsDisplayDirty(true);
                            }}
                            className={`px-5 py-2.5 rounded-full text-xs font-bold border transition-all ${
                              displayForm.appLanguage === lang.key
                                ? 'bg-brand-cyan text-black border-brand-cyan font-bold shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                                : 'bg-black/35 text-gray-400 border-white/5 hover:border-white/10 hover:text-white'
                            }`}
                          >
                            {lang.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-black/10">
                      <div>
                        <h4 className="text-sm font-semibold text-white">Animasi</h4>
                        <p className="text-xs text-gray-500 mt-1">Matikan jika aplikasi terasa lambat</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setDisplayForm({ ...displayForm, animations: !displayForm.animations });
                          setIsDisplayDirty(true);
                        }}
                        className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${
                          displayForm.animations ? 'bg-brand-cyan' : 'bg-white/10'
                        }`}
                      >
                        <div className={`bg-black w-4 h-4 rounded-full shadow-md transform duration-300 ${
                          displayForm.animations ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className={`text-xs font-bold text-brand-cyan flex items-center transition-opacity ${isDisplayDirty ? 'opacity-100' : 'opacity-0'}`}>
                      <span className="inline-block w-2 h-2 rounded-full bg-brand-cyan mr-2 animate-pulse" />
                      Ada perubahan belum disimpan
                    </span>
                    <button
                      type="submit"
                      className="primary-button w-full sm:w-auto h-12 px-8 text-xs uppercase tracking-widest font-bold ml-auto"
                    >
                      Simpan Tampilan
                    </button>
                  </div>
                </form>
              )}

              {/* --- TAB 4: NOTIFIKASI --- */}
              {activeTab === 'notifications' && (
                <form onSubmit={handleSaveNotifications} className="space-y-6">
                  <div className="space-y-4">
                    {[
                      {
                        key: 'dailyReminder',
                        label: 'Pengingat Posting Harian',
                        desc: 'Ingatkan aku untuk posting konten setiap hari'
                      },
                      {
                        key: 'deadlineReminder',
                        label: 'Reminder Deadline Projek',
                        desc: 'Notifikasi H-1 sebelum deadline projek'
                      },
                      {
                        key: 'dailyIdeas',
                        label: 'Ide Konten Harian',
                        desc: 'Kirimi aku 3 ide konten setiap pagi'
                      },
                      {
                        key: 'featureUpdates',
                        label: 'Update Fitur Baru',
                        desc: 'Info tentang fitur terbaru Kreavo'
                      }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-black/10">
                        <div>
                          <h4 className="text-sm font-semibold text-white">{item.label}</h4>
                          <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setNotifForm({ ...notifForm, [item.key]: !notifForm[item.key as keyof typeof notifForm] });
                            setIsNotifDirty(true);
                          }}
                          className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${
                            notifForm[item.key as keyof typeof notifForm] ? 'bg-brand-cyan' : 'bg-white/10'
                          }`}
                        >
                          <div className={`bg-black w-4 h-4 rounded-full shadow-md transform duration-300 ${
                            notifForm[item.key as keyof typeof notifForm] ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                    ))}

                    <div className="p-4 rounded-2xl border border-brand-cyan/10 bg-brand-cyan/5 flex items-start space-x-3 text-brand-cyan text-xs font-semibold leading-relaxed">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <span>ℹ️ Notifikasi browser akan diaktifkan saat kamu menyalakan pengingat pertama kali</span>
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className={`text-xs font-bold text-brand-cyan flex items-center transition-opacity ${isNotifDirty ? 'opacity-100' : 'opacity-0'}`}>
                      <span className="inline-block w-2 h-2 rounded-full bg-brand-cyan mr-2 animate-pulse" />
                      Ada perubahan belum disimpan
                    </span>
                    <button
                      type="submit"
                      className="primary-button w-full sm:w-auto h-12 px-8 text-xs uppercase tracking-widest font-bold ml-auto"
                    >
                      Simpan Preferensi Notifikasi
                    </button>
                  </div>
                </form>
              )}

              {/* --- TAB 5: PRIVASI & AKUN --- */}
              {activeTab === 'privacy' && (
                <div className="space-y-8">
                  {/* Active Session Info */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Sesi Aktif</h4>
                    <div className="p-5 rounded-2xl border border-white/5 bg-black/10 flex items-start space-x-4">
                      <Smartphone className="w-8 h-8 text-brand-cyan shrink-0 mt-1" />
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-white">{getBrowserName()}</span>
                          <span className="text-[10px] text-emerald-400 font-extrabold flex items-center">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
                            Aktif sekarang
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Login terakhir: {formatLastSignIn(user?.metadata.lastSignInTime)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Timezone Dropdown */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block ml-1">Zona Waktu</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full input-glow py-3.5 px-4 text-white text-sm bg-bg-dark border-white/5 focus:border-brand-cyan"
                    >
                      <option value="WIB (UTC+7)">WIB (UTC+7)</option>
                      <option value="WITA (UTC+8)">WITA (UTC+8)</option>
                      <option value="WIT (UTC+9)">WIT (UTC+9)</option>
                    </select>
                  </div>

                  {/* Export Data Button */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Kelola Data Anda</h4>
                    <button
                      onClick={handleExportData}
                      className="flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-gray-300 hover:text-white transition-all text-xs uppercase tracking-widest font-extrabold"
                    >
                      <Download className="w-4 h-4" />
                      <span>Ekspor Semua Data Saya</span>
                    </button>
                  </div>

                  {/* Danger Zone Section */}
                  <div className="pt-6 border-t border-white/5 space-y-4">
                    <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/[0.01] space-y-4">
                      <h4 className="text-sm font-bold text-red-500 flex items-center">
                        <ShieldAlert className="w-5 h-5 mr-2 shrink-0" />
                        Zona Berbahaya
                      </h4>
                      <p className="text-xs text-gray-500">Kelola tindakan sensitif untuk akun dan data Anda.</p>
                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                          onClick={handleSignOutAll}
                          className="flex items-center justify-center space-x-2 px-5 py-3 rounded-xl border border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all text-xs font-bold"
                        >
                          <span>Keluar dari Semua Perangkat</span>
                        </button>
                        <button
                          onClick={handleClearAllLocal}
                          className="flex items-center justify-center space-x-2 px-5 py-3 rounded-xl border border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all text-xs font-bold"
                        >
                          <span>Hapus Semua Data Lokal</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
