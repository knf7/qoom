import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Bot, Lock, Mail, User, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useI18n } from '../utils/i18n';
import { apiClient } from '../utils/apiClient';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth, user } = useStore();
  const { t, lang } = useI18n();
  
  // Toggle between 'login' and 'register' modes
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
    const mode = searchParams.get('mode');
    if (mode === 'register') {
      setIsLogin(false);
    }
  }, [user, navigate, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    const payload = isLogin 
      ? { email, password } 
      : { email, password, name: name || undefined };

    try {
      const data = await apiClient(endpoint, {
        method: 'POST',
        data: payload,
      });

      // Save user session in Zustand state
      setAuth(data.user, data.accessToken);

      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture(isLogin ? 'user_logged_in' : 'user_signed_up', {
          email: data.user.email,
          name: data.user.name
        });
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || t('auth.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen grid-bg bg-zinc-950 flex items-center justify-center px-6 overflow-hidden">
      {/* Ambient Cyan Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none bg-cyan-500/10"></div>
      <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] rounded-full blur-[120px] pointer-events-none bg-purple-500/5"></div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-panel rounded-2xl p-8 neon-cyan inner-glow">
          {/* Cyan top-edge accent */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"></div>

          {/* Brand Header */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-4 border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
            >
              <Bot size={28} />
            </motion.div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white glow-text-cyan">
              {isLogin ? t('auth.loginTitle') : t('auth.registerTitle')}
            </h2>
            <p className="text-xs text-zinc-500 mt-1.5 text-center">
              {isLogin ? t('auth.loginSub') : t('auth.registerSub')}
            </p>
          </div>

          {/* Mode Toggle Tabs */}
          <div className="flex mb-6 rounded-xl bg-zinc-900/80 p-1 border border-white/5">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                isLogin
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
              }`}
            >
              {t('auth.loginBtn')}
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                !isLogin
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
              }`}
            >
              {t('auth.registerBtn')}
            </button>
          </div>

          {/* Error Display */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs leading-normal"
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name field (register only) */}
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-400 font-mono">{t('auth.nameLabel')}</label>
                    <div className="relative">
                      <User size={16} className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jane Doe"
                        className="glass-input w-full pl-11 pr-4 rtl:pl-4 rtl:pr-11 bg-zinc-900/80"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-400 font-mono">{t('auth.emailLabel')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="glass-input w-full pl-11 pr-4 rtl:pl-4 rtl:pr-11 bg-zinc-900/80"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-400 font-mono">{t('auth.passwordLabel')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="glass-input w-full pl-11 pr-11 rtl:pl-11 rtl:pr-11 bg-zinc-900/80"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-cyan-400 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 mt-6 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400/50 hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
            >
              {isLoading ? (
                <div className="w-5 h-5 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin"></div>
              ) : isLogin ? (
                t('auth.loginBtn')
              ) : (
                t('auth.registerBtn')
              )}
            </motion.button>
          </form>

          {/* Toggle Form Mode */}
          <div className="text-center mt-8 pt-6 border-t border-white/5 text-xs text-zinc-500">
            {isLogin ? t('auth.toggleToRegister').split('?')[0] + '? ' : t('auth.toggleToLogin').split('؟')[0] + '؟ '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-cyan-400 font-bold hover:text-cyan-300 hover:underline transition-colors duration-200"
            >
              {isLogin ? t('auth.registerBtn') : t('auth.loginBtn')}
            </button>
          </div>

          <div className="text-center mt-4 text-xs text-zinc-500">
            <button className="hover:text-zinc-300 transition-colors" onClick={() => alert('قريباً: استعادة كلمة المرور')}>
              نسيت كلمة المرور؟
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
