import React, { useState } from 'react';
import { Sparkles, MessageCircle, Kanban, Settings, Calendar, History, BarChart2, X, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

export type Section = 'inspiration' | 'projects' | 'history' | 'calendar' | 'assistant' | 'analytics' | 'settings';

interface SidebarProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ activeSection, onSectionChange, isOpen, onClose }: SidebarProps) {
  const { user, signOut } = useAuth();
  const [imgError, setImgError] = useState(false);
  
  const menuItems = [
    { id: 'inspiration' as Section, label: 'Ide Konten', icon: Sparkles },
    { id: 'history' as Section, label: 'Riwayat Ide', icon: History },
    { id: 'projects' as Section, label: 'Projek Ku', icon: Kanban },
    { id: 'calendar' as Section, label: 'Kalender Konten', icon: Calendar },
    { id: 'analytics' as Section, label: 'Analitik', icon: BarChart2 },
    { id: 'assistant' as Section, label: 'Tanya Kreavo', icon: MessageCircle },
  ];

  const sidebarContent = (
    <aside className="w-full h-full flex flex-col p-4 bg-bg-dark border-r border-white/5 md:border-transparent">
      <div className="px-4 py-8 mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white tracking-tighter flex items-center">
          <img 
            src="https://i.ibb.co.com/8n8rgmZ9/Kreavo.png" 
            alt="Kreavo Logo" 
            className="w-[32px] h-[32px] object-contain mr-3"
          />
          <span className="lg:inline md:hidden">Kreavo</span>
        </h1>
        <button 
          onClick={onClose}
          className="md:hidden p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSectionChange(item.id);
                onClose();
              }}
              className={cn(
                "relative w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 group text-sm font-bold",
                isActive 
                  ? "bg-brand-cyan/10 text-brand-cyan shadow-[0_0_20px_rgba(6,182,212,0.1)]" 
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute left-0 w-1 h-5 bg-brand-cyan rounded-full"
                />
              )}
              <item.icon className={cn("w-5 h-5 transition-colors shrink-0", isActive ? "text-brand-cyan" : "text-gray-600 group-hover:text-gray-400")} />
              <span className="lg:inline md:hidden">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4 pt-4 border-t border-white/5">
        <button 
          onClick={() => {
            onSectionChange('settings');
            onClose();
          }}
          className={cn(
            "relative w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 group text-sm font-bold",
            activeSection === 'settings' 
              ? "bg-brand-cyan/10 text-brand-cyan shadow-[0_0_20px_rgba(6,182,212,0.1)]" 
              : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]"
          )}
        >
          {activeSection === 'settings' && (
            <motion.div 
              layoutId="sidebar-active"
              className="absolute left-0 w-1 h-5 bg-brand-cyan rounded-full"
            />
          )}
          <Settings className={cn("w-5 h-5 transition-colors shrink-0", activeSection === 'settings' ? "text-brand-cyan" : "text-gray-600 group-hover:text-gray-400 group-hover:rotate-45")} />
          <span className="lg:inline md:hidden">Pengaturan</span>
        </button>
        
        {user && (
          <div className="flex flex-col space-y-3 p-2 bg-white/[0.02] border border-white/5 rounded-2xl">
            <div className="flex items-center space-x-3 px-2">
              {user.photoURL && !imgError ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || "User"} 
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-8 h-8 rounded-full border border-white/10 shrink-0 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#06B6D4] flex items-center justify-center text-white font-bold text-sm shrink-0 border border-white/10">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0 lg:block md:hidden">
                <p className="text-sm font-bold text-white truncate">{user.displayName}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            
            <button 
              onClick={signOut}
              className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-red-500/60 hover:text-red-400 hover:bg-red-500/5 transition-all text-sm font-bold"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span className="lg:inline md:hidden">Keluar</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-[280px] bg-bg-dark z-[100] md:hidden"
          >
            {sidebarContent}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop/Tablet Sidebar */}
      <div className="hidden md:block fixed inset-y-0 left-0 w-[80px] lg:w-64 bg-bg-dark border-r border-white/5 z-50 transition-all duration-300">
        {sidebarContent}
      </div>
    </>
  );
}
