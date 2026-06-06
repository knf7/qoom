import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bot, LogOut, BarChart3, LayoutGrid, Terminal, Globe } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useI18n } from '../utils/i18n';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useStore();
  const { t, lang, setLang } = useI18n();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  // Don't show header inside public Passport views to keep formatting completely clean
  if (location.pathname.startsWith('/passport/')) return null;

  return (
    <nav className="fixed top-0 left-0 w-full z-40 border-b border-cardBorder bg-[#0A0A0F]/80 backdrop-blur-premium select-none transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <div className="w-9 h-9 rounded-xl bg-primaryGlow/10 flex items-center justify-center text-primaryGlow border border-primaryGlow/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-float">
            <Bot size={18} />
          </div>
          <span className="font-bold tracking-tight font-display text-lg text-slate-100 flex items-center">
            {t('brand')}<span className="text-primaryGlow">.</span>
          </span>
        </Link>

        {/* Action Panel */}
        <div className="flex items-center gap-4">
          
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cardBg hover:bg-primaryGlow/10 border border-cardBorder hover:border-primaryGlow/30 text-slate-300 hover:text-primaryGlow text-xs font-bold rounded-xl transition-all shadow-sm"
            title={lang === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
          >
            <Globe size={13} className="text-primaryGlow animate-pulse" />
            <span className={lang === 'ar' ? 'font-sans' : 'font-display'}>
              {lang === 'ar' ? 'EN' : 'العربية'}
            </span>
          </button>

          {/* Navigation Routes */}
          {user ? (
            <div className="flex items-center gap-6">
              <Link
                to="/dashboard"
                className={`flex items-center gap-1.5 text-xs font-semibold tracking-wide transition-all duration-200 ${
                  isActive('/dashboard')
                    ? 'text-primaryGlow shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutGrid size={14} />
                {t('navbar.workspace')}
              </Link>

              <Link
                to="/analytics"
                className={`flex items-center gap-1.5 text-xs font-semibold tracking-wide transition-all duration-200 ${
                  isActive('/analytics')
                    ? 'text-primaryGlow shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 size={14} />
                {t('navbar.analytics')}
              </Link>

              <div className="h-4 w-[1px] bg-cardBorder"></div>

              <div className="flex items-center gap-4">
                <span className="text-[10px] bg-primaryGlow/5 border border-primaryGlow/20 text-primaryGlow font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
                  {user.name || user.email.split('@')[0]}
                </span>
                
                <button
                  onClick={handleLogout}
                  className="p-2 bg-cardBg hover:bg-rose-500/10 border border-cardBorder hover:border-rose-500/30 text-slate-400 hover:text-rose-400 rounded-xl transition-all shadow-sm"
                  title={t('navbar.logout')}
                >
                  <LogOut size={14} />
                </button>
              </div>
            </div>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-1.5 px-4 py-2 bg-cardBg hover:bg-primaryGlow/5 border border-cardBorder hover:border-primaryGlow/30 text-slate-200 hover:text-primaryGlow text-xs font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.05)]"
            >
              <Terminal size={12} className="text-primaryGlow" />
              {t('navbar.analyze')}
            </Link>
          )}
        </div>

      </div>
    </nav>
  );
}
