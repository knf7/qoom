import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, Bot, Calendar, Sparkles, CheckSquare, Target } from 'lucide-react';
import { useI18n } from '../utils/i18n';
import DOMPurify from 'dompurify';
import { sanitizeUILanguage } from '../utils/languageSanitizer';
import { apiClient } from '../utils/apiClient';

export default function Passport() {
  const { id: passportId } = useParams<{ id: string }>();
  const { t, lang } = useI18n();

  const [passport, setPassport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



  useEffect(() => {
    fetchPassportDetails();
  }, [passportId]);

  const fetchPassportDetails = async () => {
    try {
      const data = await apiClient(`/passport/${passportId}`);

      setPassport(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
      setLoading(false);
    }
  };

  const getStrategicVerdictColors = (decision: string) => {
    switch (decision) {
      case 'BUILD':
        return {
          text: 'text-emerald-400',
          glowText: 'glow-text-emerald',
          border: 'border-emerald-500/25',
          bg: 'bg-emerald-500/5',
          neon: 'neon-emerald',
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        };
      case 'PIVOT':
        return {
          text: 'text-amber-400',
          glowText: 'glow-text-amber',
          border: 'border-amber-500/25',
          bg: 'bg-amber-500/5',
          neon: 'neon-amber',
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        };
      case 'KILL':
        return {
          text: 'text-rose-400',
          glowText: 'glow-text-rose',
          border: 'border-rose-500/25',
          bg: 'bg-rose-500/5',
          neon: 'neon-rose',
          badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        };
      default:
        return {
          text: 'text-zinc-400',
          glowText: '',
          border: 'border-white/10',
          bg: 'bg-white/5',
          neon: '',
          badge: 'bg-zinc-800 text-zinc-400 border-white/10',
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen grid-bg hero-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin mx-auto mb-6"></div>
          <p className="text-zinc-400 text-sm font-light">{lang === 'ar' ? 'جاري التحقق من التوقيعات الرقمية لجواز الابتكار...' : 'Validating innovation passport key signatures...'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen grid-bg hero-gradient flex items-center justify-center">
        <div className="max-w-xl px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400 mx-auto mb-6 border border-rose-500/20">
            <ShieldAlert size={26} />
          </div>
          <h3 className="text-xl font-bold mb-2 text-white">{lang === 'ar' ? 'جواز السفر غير صالح' : 'Passport Invalid'}</h3>
          <p className="text-sm text-rose-300/80 mb-8 leading-relaxed">{error}</p>
          <Link to="/" className="btn-secondary px-6 py-3 rounded-xl text-xs font-bold">
            {lang === 'ar' ? 'العودة للرئيسية' : 'Return Home'}
          </Link>
        </div>
      </div>
    );
  }

  const colors = getStrategicVerdictColors(passport.decision);

  return (
    <div className="min-h-screen grid-bg hero-gradient">
      <div className="max-w-4xl mx-auto px-6 pt-28 pb-16 relative">

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          {/* Passport Physical Layout */}
          <div className={`glass rounded-[32px] p-8 md:p-12 ${colors.neon} relative overflow-hidden`}>
            {/* Neon Stripe */}
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-500 via-emerald-500 to-cyan-500"></div>
            {/* Inner glow */}
            <div className="inner-glow"></div>

            {/* Badge */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-8 border-b border-white/10">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-cyan-400 text-[10px] uppercase font-extrabold tracking-wider mb-3">
                  <Bot size={14} />
                  <span>{t('passport.verified')}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                  {passport.title}
                </h1>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass">
                <Calendar size={14} className="text-zinc-500" />
                <span className="text-xs text-zinc-400 flex items-center gap-1">
                  <span>{t('passport.issued')}:</span>
                  <span className="num-ltr font-bold text-zinc-300">
                    {new Date(passport.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                  </span>
                </span>
              </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <div>
                  <h3 className="text-xs uppercase font-extrabold text-zinc-500 tracking-wider mb-2 font-mono">
                    {t('passport.executiveVerdict')}
                  </h3>
                  <div className={`inline-block text-lg md:text-xl font-bold px-4 py-2 rounded-xl border ${colors.badge}`}>
                    {t('passport.investorVerdict')}{' '}
                    <span className={`${colors.text} ${colors.glowText} num-ltr font-extrabold`}>{passport.decision}</span>
                  </div>
                </div>

                <div className="glass rounded-xl p-6">
                  <h3 className="text-xs uppercase font-extrabold text-zinc-500 tracking-wider mb-2 flex items-center gap-1.5 font-mono">
                    <Sparkles size={14} className="text-cyan-400" />
                    {t('passport.synthesisTitle')}
                  </h3>
                  <p 
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(sanitizeUILanguage(passport.summary, lang), {
                      USE_PROFILES: { html: true },
                      FORBID_TAGS: ["script", "iframe", "object", "embed", "applet", "base"],
                      FORBID_ATTR: ["onmouseover", "onload", "onerror"]
                    }) }}
                    className="text-xs md:text-sm text-zinc-300 leading-relaxed font-light"
                  />

                <div className="glass rounded-xl p-6">
                  <h3 className="text-xs uppercase font-extrabold text-zinc-500 tracking-wider mb-2 flex items-center gap-1.5 font-mono">
                    <CheckSquare size={14} className="text-cyan-400" />
                    {t('passport.actionTitle')}
                  </h3>
                  <p
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(sanitizeUILanguage(passport.recommendation, lang), {
                      USE_PROFILES: { html: true },
                      FORBID_TAGS: ["script", "iframe", "object", "embed", "applet", "base"],
                      FORBID_ATTR: ["onmouseover", "onload", "onerror"]
                    }) }}
                    className="text-xs text-zinc-400 leading-relaxed"
                  />
                </div>
              </div>

              {/* Side Scorecard */}
              <div className="glass rounded-2xl p-6 h-fit">
                <h3 className="text-xs uppercase font-extrabold text-zinc-500 tracking-wider mb-4 flex items-center gap-1.5 font-mono">
                  <Target size={14} className="text-cyan-400" />
                  {t('passport.metricsTitle')}
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-white/10">
                    <span className="text-xs text-zinc-300 font-medium">{lang === 'ar' ? 'النقاط الموحدة' : 'Aggregated Score'}</span>
                    <span className={`text-xl font-bold font-mono ${colors.text} ${colors.glowText} num-ltr`}>{passport.score}</span>
                  </div>

                  {passport.agentPassportScores.map((score: any) => {
                    const agentDisplayName = t(`landing.agents.${score.agentType}.name`);
                    return (
                      <motion.div
                        key={score.agentType}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex justify-between items-center text-xs glass rounded-lg p-3"
                      >
                        <span className="text-zinc-400">{agentDisplayName}</span>
                        <span className={`font-bold num-ltr px-2 py-0.5 rounded-md ${colors.badge} text-[11px]`}>{score.score}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-white/10 mt-10 gap-4">
              <span className="text-[10px] font-mono text-zinc-600 truncate max-w-xs num-ltr select-all">
                ID: {passport.passportId}
              </span>
              
              <Link
                to="/auth"
                className="btn-primary px-5 py-2.5 rounded-xl text-xs font-bold"
              >
                {t('passport.ctaBtn')}
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
