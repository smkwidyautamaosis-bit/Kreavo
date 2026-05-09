import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);

    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      setError("Gagal masuk. Coba lagi ya!");
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0B0B0B] flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Decorative Glow background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[500px] h-[350px] md:h-[500px] bg-brand-cyan/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Alert Notification */}
      <div className="absolute top-6 max-w-sm w-full z-50">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mx-auto flex items-center space-x-3 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-2xl backdrop-blur-xl text-red-400 text-sm font-medium shadow-lg shadow-red-500/5"
            >
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md flex flex-col items-center text-center space-y-8 z-10"
      >
        {/* Logo and App Brand */}
        <div className="flex flex-col items-center space-y-4">
          <motion.img 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 150, damping: 15 }}
            src="https://i.ibb.co.com/8n8rgmZ9/Kreavo.png" 
            alt="Kreavo Logo" 
            className="w-16 h-16 object-contain"
          />
          <div>
            <h1 className="text-3xl font-[900] text-white tracking-tight">Kreavo</h1>
            <p className="text-gray-400 text-sm mt-1.5 font-medium">Platform AI untuk Kreator Indonesia</p>
          </div>
        </div>

        {/* Subtle Divider Line */}
        <div className="w-48 h-[1px] bg-white/[0.08]" />

        {/* Sign In Button Area */}
        <div className="flex flex-col items-center space-y-4 w-full">
          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="group flex items-center justify-center w-[280px] h-[48px] bg-white hover:bg-gray-100 text-gray-900 rounded-full font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-white/5 active:scale-[0.98] disabled:opacity-80 disabled:pointer-events-none"
          >
            {isSigningIn ? (
              <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 mr-3 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Masuk dengan Google</span>
              </>
            )}
          </button>

          <p className="max-w-[280px] text-[11px] text-gray-500 leading-relaxed">
            Dengan masuk, kamu menyetujui penggunaan data untuk meningkatkan pengalaman Kreavo
          </p>
        </div>
      </motion.div>

      {/* Footer Tagline */}
      <div className="absolute bottom-6 left-0 right-0 text-center px-4">
        <p className="text-[10px] text-gray-600 font-medium tracking-wide">
          Dibuat dengan Google AI Studio & Gemini <span className="text-gray-500">#JuaraVibeCoding</span>
        </p>
      </div>
    </div>
  );
}
