import { useStore } from '../store/useStore';

import arTranslations from '../locales/ar.json';
import enTranslations from '../locales/en.json';

export const translations = {
  ar: arTranslations,
  en: enTranslations,
};

/**
 * Lightweight, state-synced translation helper hook.
 * Sets the document direction (RTL/LTR) globally on the HTML element automatically.
 */
export function useI18n() {
  const lang = useStore((state) => (state as any).lang || 'ar');
  const setStoreLang = useStore((state) => (state as any).setLang);

  const setLang = (newLang: 'ar' | 'en') => {
    if (setStoreLang) {
      setStoreLang(newLang);
    }
    // Update global document layout directions
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  // Safe recursive lookup key mapping helper: t('navbar.workspace')
  const t = (keyPath: string): string => {
    const keys = keyPath.split('.');
    let current: any = (translations as any)[lang];

    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        return keyPath; // Fallback to printing the raw key path if translation missing
      }
    }

    return current as string;
  };

  return { t, lang, setLang };
}
