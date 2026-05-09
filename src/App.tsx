/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Sidebar, { Section } from './components/Sidebar.tsx';
import InspirationBoard from './components/InspirationBoard.tsx';
import ProjectTracker from './components/ProjectTracker.tsx';
import CreativeAssistant from './components/CreativeAssistant.tsx';
import ContentCalendar from './components/ContentCalendar.tsx';
import IdeaHistory from './components/IdeaHistory.tsx';
import Analytics from './components/Analytics.tsx';
import LandingPage from './components/LandingPage.tsx';
import LoginPage from './components/LoginPage.tsx';
import Settings from './components/Settings.tsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { motion, AnimatePresence } from 'motion/react';
import { Menu } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import OnboardingWizard from './components/OnboardingWizard.tsx';

function AppContent() {
  const { user, loading } = useAuth();
  const [showDashboard, setShowDashboard] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('inspiration');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkOnboarding = async () => {
      if (!user) {
        if (isMounted) setCheckingOnboarding(false);
        return;
      }
      try {
        const profileDoc = await getDoc(doc(db, "users", user.uid, "profile"));
        if (profileDoc.exists() && profileDoc.data().onboardingComplete) {
          if (isMounted) setShowOnboarding(false);
        } else {
          if (isMounted) setShowOnboarding(true);
        }
      } catch (err) {
        console.error("Failed to check onboarding status", err);
        if (isMounted) setShowOnboarding(false);
      } finally {
        if (isMounted) setCheckingOnboarding(false);
      }
    };
    checkOnboarding();
    
    return () => { isMounted = false; };
  }, [user]);

  if (loading || checkingOnboarding) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <motion.img 
          src="https://i.ibb.co.com/8n8rgmZ9/Kreavo.png" 
          alt="Loading..." 
          className="w-16 h-16 object-contain"
          animate={{ 
            scale: [1, 1.15, 1],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const getIndonesianDate = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const d = new Date();
    const dayName = days[d.getDay()];
    const date = d.getDate();
    const monthName = months[d.getMonth()];
    const year = d.getFullYear();
    return `${dayName}, ${date} ${monthName} ${year}`;
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'inspiration':
        return <InspirationBoard />;
      case 'projects':
        return <ProjectTracker />;
      case 'history':
        return <IdeaHistory onNavigate={setActiveSection} />;
      case 'calendar':
        return <ContentCalendar />;
      case 'analytics':
        return <Analytics />;
      case 'assistant':
        return <CreativeAssistant />;
      case 'settings':
        return <Settings />;
      default:
        return <InspirationBoard />;
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark text-gray-400 selection:bg-white/10 selection:text-white font-sans overflow-x-hidden">
      <AnimatePresence mode="wait">
        {showOnboarding ? (
          <OnboardingWizard key="onboarding" onComplete={() => setShowOnboarding(false)} />
        ) : !showDashboard ? (
          <motion.div
            key="landing"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <LandingPage onStart={() => setShowDashboard(true)} />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex min-h-screen"
          >
            <Sidebar 
              activeSection={activeSection} 
              onSectionChange={setActiveSection} 
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
            />
            
            <main className="flex-1 md:ml-[80px] lg:ml-64 transition-all duration-300">
              {/* Mobile Header */}
              <header className="md:hidden flex items-center justify-between px-6 py-4 border-b border-white/5 bg-bg-dark/80 backdrop-blur-xl sticky top-0 z-40">
                <div className="flex items-center space-x-3">
                  <img src="https://i.ibb.co.com/8n8rgmZ9/Kreavo.png" alt="Logo" className="w-8 h-8" />
                  <span className="text-lg font-bold text-white tracking-tighter">Kreavo</span>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 hover:bg-white/5 rounded-xl text-gray-400"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </header>

              <div className="max-w-7xl mx-auto min-h-screen px-6 md:px-8 lg:px-12 py-8 md:py-16">
                {/* Personalized Greeting Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between border-b border-white/[0.06] pb-6 space-y-2 sm:space-y-0">
                  <div>
                    <span className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest font-bold block">
                      SELAMAT DATANG KEMBALI
                    </span>
                    <h1 className="text-base font-semibold text-white mt-1">
                      {user.displayName || 'Kreator'}
                    </h1>
                  </div>
                  <div className="text-sm text-gray-500 font-medium">
                    {getIndonesianDate()}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {renderSection()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
