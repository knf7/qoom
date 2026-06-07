import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useStore } from '../store/useStore';
import Logo from './Logo';

export default function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useStore();

  const isActive = (path: string) => location.pathname === path;

  // Render nothing in auth if needed, or keep it consistent
  if (location.pathname === '/auth') return null;

  return (
    <nav className="fixed top-0 left-0 w-full z-50 py-4 px-6 select-none pointer-events-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between w-full pointer-events-auto">
        
        {/* Left Side: System Status */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full glass border border-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-400">
            ع.م
          </div>
          <div className="glass px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
            <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">NODE . ONLINE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          </div>
        </div>

        {/* Center: Navigation Pills */}
        <div className="glass rounded-full p-1 flex items-center border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isActive('/dashboard') 
                    ? 'bg-white/10 text-white' 
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                المنصة
              </Link>
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
              
              {/* Logout Button */}
              <button
                onClick={() => {
                  logout();
                  navigate('/auth');
                }}
                className="px-3 py-1.5 text-rose-500/50 hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-all ml-2 flex items-center"
                title="تسجيل خروج"
              >
                <LogOut size={16} />
              </button>
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

        {/* Right Side: Logo & Command */}
        <Link to="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
          <span className="text-[9px] font-mono tracking-[0.2em] text-zinc-500 uppercase hidden sm:block">
            Venture Intelligence OS
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-white tracking-widest">قوم</span>
            <div className="w-6 h-6 rounded-md glass flex items-center justify-center text-zinc-400 border border-white/10 text-xs">
              ⌘
            </div>
          </div>
        </Link>
        
      </div>
    </nav>
  );
}
