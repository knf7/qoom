import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, User, BarChart3, Settings, CreditCard, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';

export default function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useStore();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Render nothing in auth if needed, or keep it consistent
  if (location.pathname === '/auth') return null;

  return (
    <nav className="fixed top-0 left-0 w-full z-50 py-4 px-6 select-none pointer-events-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between w-full pointer-events-auto">
        
        {/* Right Side (placed first in HTML to render on the right in RTL): Logo & Command */}
        <Link to="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-white tracking-widest">قوم</span>
            <div className="w-6 h-6 rounded-md glass flex items-center justify-center text-zinc-400 border border-white/10 text-xs">
              ⌘
            </div>
          </div>
          <span className="text-[9px] font-mono tracking-[0.2em] text-zinc-500 uppercase hidden sm:block">
            Venture Intelligence OS
          </span>
        </Link>

        {/* Center: Navigation Pills */}
        <div className="glass rounded-full p-1 flex items-center border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          {user ? (
            <>
              <Link
                to="/"
                className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isActive('/')
                    ? 'bg-white/10 text-white' 
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                تحليل جديد
              </Link>
              <Link
                to="/copilot"
                className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isActive('/copilot')
                    ? 'bg-white/10 text-white' 
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                مساعد الأفكار (Co-Pilot)
              </Link>
              <Link
                to="/analytics"
                className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isActive('/analytics')
                    ? 'bg-white/10 text-white' 
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                التحليلات العامة
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/"
                className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isActive('/') 
                    ? 'bg-white/10 text-white' 
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                الرئيسية
              </Link>
              <Link
                to="/auth?mode=login"
                className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isActive('/auth') 
                    ? 'bg-white/10 text-white' 
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                تسجيل الدخول
              </Link>
            </>
          )}
        </div>

        {/* Left Side (placed last in HTML to render on the left in RTL): User Actions & Full Projects */}
        <div className="flex items-center gap-3" ref={dropdownRef}>
          {user ? (
            <div className="relative">
              {/* Profile Toggle Avatar */}
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 px-3 py-1.5 glass border border-white/10 hover:border-cyan-500/30 rounded-full transition-all active:scale-95 text-zinc-400 hover:text-white"
              >
                <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-200 ${isProfileOpen ? 'rotate-180 text-cyan-400' : ''}`} />
                
                {/* User scan credits count quick badge */}
                <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                  {user.scanCredits ?? 0}
                </span>

                {/* Avatar Initials */}
                <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[9px] font-bold text-zinc-300">
                  {(() => {
                    const name = user.name || user.email || '';
                    const parts = name.trim().split(' ');
                    if (parts.length >= 2) {
                      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                    }
                    return name[0]?.toUpperCase() || 'ع';
                  })()}
                </div>
              </button>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-0 mt-3 w-72 glass rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)] overflow-hidden z-50 text-right p-5 space-y-4"
                    dir="rtl"
                  >
                    {/* User Details */}
                    <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400">
                        {(() => {
                          const name = user.name || user.email || '';
                          const parts = name.trim().split(' ');
                          if (parts.length >= 2) {
                            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                          }
                          return name[0]?.toUpperCase() || 'ع';
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">{user.name || 'مستخدم قوم'}</div>
                        <div className="text-[10px] text-zinc-500 truncate num-ltr text-right">{user.email}</div>
                      </div>
                    </div>

                    {/* Scan Credits Account (Stripe) */}
                    <div className="p-3 bg-cyan-950/20 border border-cyan-500/10 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-400">رصيد التحليلات المدفوعة:</span>
                        <span className="text-cyan-400 font-bold font-mono">{user.scanCredits ?? 0}</span>
                      </div>
                      <button 
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('/dashboard'); // dashboard can host Stripe payments trigger
                        }}
                        className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CreditCard size={12} />
                        شراء رصيد تحليلات (Stripe)
                      </button>
                    </div>

                    {/* Navigation Links */}
                    <div className="space-y-1">
                      <Link
                        to="/dashboard"
                        onClick={() => setIsProfileOpen(false)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          isActive('/dashboard')
                            ? 'bg-white/10 text-white'
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Settings size={14} className="text-cyan-400" />
                        <span>المشاريع الكاملة (لوحة التحكم)</span>
                      </Link>

                      <Link
                        to="/analytics"
                        onClick={() => setIsProfileOpen(false)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          isActive('/analytics')
                            ? 'bg-white/10 text-white'
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <BarChart3 size={14} className="text-cyan-400" />
                        <span>تحليلات المشاريع العامة</span>
                      </Link>
                    </div>

                    {/* Logout */}
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                        navigate('/auth');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all border-t border-white/5 pt-3"
                    >
                      <LogOut size={14} />
                      <span>تسجيل الخروج</span>
                    </button>

                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="glass px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
              <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">NODE . ONLINE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            </div>
          )}
        </div>
        
      </div>
    </nav>
  );
}
