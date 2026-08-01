'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

export default function GrievancePage() {
  const { user, loading } = useAuth();
  const [loadingBtn, setLoadingBtn] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/auth/login';
    }
  }, [user, loading]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const handleButtonClick = (btnKey: string, url: string) => {
    setLoadingBtn(btnKey);
    setTimeout(() => {
      window.open(url, '_blank');
      setTimeout(() => {
        setLoadingBtn(null);
      }, 500);
    }, 400);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 animate-gradient">
      {/* Background Animated Floating Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute w-24 h-24 rounded-full bg-white/10 left-[10%] top-[20%] animate-pulse"></div>
        <div className="absolute w-36 h-36 rounded-full bg-white/10 right-[20%] top-[15%] animate-bounce duration-[8000ms]"></div>
        <div className="absolute w-20 h-20 rounded-full bg-white/10 left-[70%] bottom-[20%] animate-pulse"></div>
      </div>

      {/* Top Left Navigation back to main Dashboard */}
      <div className="absolute top-6 left-6 z-20">
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white rounded-xl text-xs font-semibold shadow-lg transition-all transform hover:scale-105"
        >
          <span>←</span> Back to Dashboard
        </a>
      </div>

      {/* Main Glassmorphic Card */}
      <div className="relative z-10 bg-white/20 backdrop-blur-xl rounded-3xl p-10 md:p-14 border border-white/30 shadow-2xl text-center max-w-md w-[90%] transform transition-all hover:translate-y-[-4px]">
        <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight drop-shadow-md">
          Complaint Calling Web App
        </h1>
        <p className="text-white/90 text-sm font-medium mb-10 drop-shadow-sm">
          Prime Classes – Management System
        </p>

        <div className="flex flex-col gap-5">
          {/* Register Complaint Button */}
          <a
            href="/complaint"
            className="w-full py-4 px-6 bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-300 hover:to-emerald-400 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-[1.03] active:scale-[0.98] flex items-center justify-center gap-3"
          >
            <span>📩</span>
            <span>Register Complaint</span>
          </a>

          {/* Start Calling Button */}
          <a
            href="/calling"
            className="w-full py-4 px-6 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 hover:from-pink-600 hover:to-red-600 shadow-xl transition-all transform hover:scale-[1.03] active:scale-[0.98] flex items-center justify-center gap-3 border border-white/20"
          >
            <span className="text-xl animate-bounce">📞</span>
            <span>Start Calling</span>
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-white/80 text-xs font-normal z-10 tracking-wide drop-shadow">
        © 2026 Prime Classes | All Rights Reserved
      </footer>
    </div>
  );
}