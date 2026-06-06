/**
 * STRICT LANGUAGE SANITIZER PIPELINE - QOOM V5 ENTERPRISE i18N
 * Enforces strict single-language UI isolation.
 */

// Dictionary mapping for strict Arabic translation of common English startup/tech terms that often leak from models
const ENG_TO_ARA_DICT: Record<string, string> = {
  "MarketAgent": "وكيل دراسة السوق",
  "CompetitionAgent": "وكيل تحليل المنافسين",
  "MonetizationAgent": "وكيل نموذج الربح",
  "FeasibilityAgent": "وكيل الجدوى التقنية",
  "ValidationAgent": "وكيل إثبات الفكرة",
  "Orchestrator": "منسق المنظومة",
  "BUILD": "اعتماد التأسيس",
  "PIVOT": "تعديل المسار",
  "KILL": "إيقاف العمل",
  "SaaS": "البرمجيات كخدمة",
  "B2B": "من الشركات إلى الشركات",
  "B2C": "من الشركات إلى المستهلكين",
  "LTV": "القيمة العمرية للعميل",
  "CAC": "تكلفة الاستحواذ على العميل",
  "TAM": "إجمالي السوق المستهدف المتاح",
  "SAM": "السوق المتاح الممكن خدمته",
  "SOM": "السوق الفعلي الذي يمكن الاستحواذ عليه",
  "LTV/CAC": "نسبة القيمة العمرية إلى تكلفة الاستحواذ",
  "ROI": "العائد على الاستثمار",
  "MVP": "المنتج ذو الحد الأدنى من الجدوى",
  "PMF": "ملاءمة المنتج للسوق",
  "Product-Market Fit": "ملاءمة المنتج للسوق",
  "Qoom": "قوم",
  "AI": "الذكاء الاصطناعي",
  "operating system": "نظام التشغيل",
  "Venture": "المشروع الريادي",
  "Score": "درجة التقييم",
  "Vulnerability": "ثغرة أو ضعف استراتيجي",
  "Weakness": "نقطة ضعف",
  "Strength": "نقطة قوة",
  "Risk": "مخاطر هيكلية",
  "Opportunity": "فرصة استثمارية",
  "Pre-flight": "فحص ما قبل التشغيل"
};

// Dictionary mapping for strict English translation of Arabic terms that might leak
const ARA_TO_ENG_DICT: Record<string, string> = {
  "قوم": "Qoom",
  "بناء": "BUILD",
  "تعديل": "PIVOT",
  "إيقاف": "KILL",
  "سوق": "Market",
  "منافسين": "Competition",
  "ربح": "Monetization",
  "جدوى": "Feasibility",
  "تحقق": "Validation",
  "الذكاء الاصطناعي": "AI"
};

/**
 * Replaces technical terms and phrases with strict translations
 */
function translateToArabicStrict(text: string): string {
  let cleaned = text;
  Object.entries(ENG_TO_ARA_DICT).forEach(([eng, ara]) => {
    const regex = new RegExp(`\\b${eng}\\b`, 'gi');
    cleaned = cleaned.replace(regex, ara);
  });
  return cleaned;
}

/**
 * Replaces Arabic words with strict English counterparts
 */
function translateToEnglishStrict(text: string): string {
  let cleaned = text;
  Object.entries(ARA_TO_ENG_DICT).forEach(([ara, eng]) => {
    const regex = new RegExp(ara, 'g');
    cleaned = cleaned.replace(regex, eng);
  });
  return cleaned;
}

/**
 * Completely removes leftover English characters and sentences in Arabic mode, 
 * preserving only Arabic characters, numbers, and basic punctuation.
 */
function removeEnglish(text: string): string {
  // Translate core tech terms first so we don't lose useful information
  let translated = translateToArabicStrict(text);
  
  // Remove remaining English sentences or words (e.g. matching [a-zA-Z])
  // But preserve HTML tags like <br>, <strong>, <li>, <p> etc. so formatting is maintained
  return translated.replace(/[a-zA-Z]+(?![^<>]*>)/g, '').trim();
}

/**
 * Completely removes Arabic script characters in English mode
 */
function removeArabic(text: string): string {
  let translated = translateToEnglishStrict(text);
  
  // Remove Arabic characters matching the Unicode block [\u0600-\u06FF]
  return translated.replace(/[\u0600-\u06FF]+/g, '').trim();
}

/**
 * Scans a rendered text string for script leakage
 * Returns true if mixed script is detected
 */
export function detectMixedLanguage(text: string, lang: 'ar' | 'en'): boolean {
  if (!text) return false;
  
  // Strip HTML tags before scanning to avoid false positives on tag names
  const clean = text.replace(/<[^>]*>/g, '');

  if (lang === 'ar') {
    // Detect if there are English words of 3 or more letters that got leaked
    const hasEnglishWords = /[a-zA-Z]{3,}/.test(clean);
    return hasEnglishWords;
  } else {
    // Detect if there are Arabic script characters
    const hasArabicChars = /[\u0600-\u06FF]/.test(clean);
    return hasArabicChars;
  }
}

/**
 * Enforces language-lock formatting and outputs sanitized text
 */
export function sanitizeUILanguage(text: any, lang: 'ar' | 'en'): string {
  if (text === null || text === undefined) return '';
  
  let stringText = typeof text === 'string' ? text : JSON.stringify(text);

  if (lang === 'ar') {
    // Strict Arabic filter pipeline: Translate tech terms -> remove remaining latin script leaks
    let sanitized = removeEnglish(stringText);
    
    // Quality Gate: Check for strict RTL consistency
    if (detectMixedLanguage(sanitized, 'ar')) {
      return 'تم رصد خطأ في اتساق اللغة. جاري إعادة توليد المخرجات...';
    }
    
    return sanitized;
  } else {
    // Strict English filter pipeline: Translate Arabic leaks -> remove remaining Arabic script
    let sanitized = removeArabic(stringText);
    
    // Quality Gate: Check for strict LTR consistency
    if (detectMixedLanguage(sanitized, 'en')) {
      return 'Language consistency error detected. Regenerating output...';
    }
    
    return sanitized;
  }
}
