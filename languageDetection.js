/**
 * Utility functions for language detection and localization
 * These functions work with the region detection system to provide appropriate language options
 */

// Default language is English
const DEFAULT_LANGUAGE = 'en';

// Map of region codes to primary and alternative languages
const REGION_LANGUAGE_MAP = {
  // North America
  'US': { primary: 'en', alternatives: ['es'] },
  'CA': { primary: 'en', alternatives: ['fr'] },
  'MX': { primary: 'es', alternatives: ['en'] },

  // Europe
  'UK': { primary: 'en', alternatives: [] },
  'GB': { primary: 'en', alternatives: [] },
  'DE': { primary: 'de', alternatives: ['en'] },
  'FR': { primary: 'fr', alternatives: ['en'] },
  'ES': { primary: 'es', alternatives: ['en', 'ca'] }, // Spanish + Catalan
  'IT': { primary: 'it', alternatives: ['en'] },
  'NL': { primary: 'nl', alternatives: ['en'] },
  'PT': { primary: 'pt', alternatives: ['en'] },
  'EU': { primary: 'en', alternatives: ['fr', 'de', 'es', 'it'] },

  // Asia-Pacific
  'JP': { primary: 'ja', alternatives: ['en'] },
  'KR': { primary: 'ko', alternatives: ['en'] },
  'CN': { primary: 'zh', alternatives: ['en'] },
  'TW': { primary: 'zh-TW', alternatives: ['en'] },
  'IN': { primary: 'en', alternatives: ['hi', 'bn', 'te', 'ta'] },
  'AU': { primary: 'en', alternatives: [] },
  'NZ': { primary: 'en', alternatives: ['mi'] }, // English + Maori

  // South America
  'BR': { primary: 'pt-BR', alternatives: ['en'] },
  'AR': { primary: 'es', alternatives: ['en'] },
  'CL': { primary: 'es', alternatives: ['en'] },

  // Other regions default to English with no alternatives
};

// Available languages with their display names and right-to-left setting
export const AVAILABLE_LANGUAGES = {
  'en': { displayName: 'English', nativeName: 'English', rtl: false },
  'es': { displayName: 'Spanish', nativeName: 'Español', rtl: false },
  'fr': { displayName: 'French', nativeName: 'Français', rtl: false },
  'de': { displayName: 'German', nativeName: 'Deutsch', rtl: false },
  'it': { displayName: 'Italian', nativeName: 'Italiano', rtl: false },
  'nl': { displayName: 'Dutch', nativeName: 'Nederlands', rtl: false },
  'pt': { displayName: 'Portuguese', nativeName: 'Português', rtl: false },
  'pt-BR': { displayName: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', rtl: false },
  'ja': { displayName: 'Japanese', nativeName: '日本語', rtl: false },
  'ko': { displayName: 'Korean', nativeName: '한국어', rtl: false },
  'zh': { displayName: 'Chinese (Simplified)', nativeName: '中文 (简体)', rtl: false },
  'zh-TW': { displayName: 'Chinese (Traditional)', nativeName: '中文 (繁體)', rtl: false },
  'ar': { displayName: 'Arabic', nativeName: 'العربية', rtl: true },
  'hi': { displayName: 'Hindi', nativeName: 'हिन्दी', rtl: false },
  'bn': { displayName: 'Bengali', nativeName: 'বাংলা', rtl: false },
  'te': { displayName: 'Telugu', nativeName: 'తెలుగు', rtl: false },
  'ta': { displayName: 'Tamil', nativeName: 'தமிழ்', rtl: false },
  'mi': { displayName: 'Maori', nativeName: 'Te Reo Māori', rtl: false },
  'ca': { displayName: 'Catalan', nativeName: 'Català', rtl: false },
};

/**
 * Get the preferred language for a given region
 * @param {string} regionCode - The detected region code (e.g., 'US', 'DE')
 * @returns {string} - The preferred language code (e.g., 'en', 'de')
 */
export function getLanguageForRegion(regionCode) {
  if (!regionCode) return DEFAULT_LANGUAGE;

  const regionSettings = REGION_LANGUAGE_MAP[regionCode];
  if (!regionSettings) return DEFAULT_LANGUAGE;

  return regionSettings.primary;
}

/**
 * Get the alternative languages for a given region
 * @param {string} regionCode - The detected region code
 * @returns {Array} - Array of alternative language codes
 */
export function getAlternativeLanguagesForRegion(regionCode) {
  if (!regionCode) return [];

  const regionSettings = REGION_LANGUAGE_MAP[regionCode];
  if (!regionSettings) return [];

  return regionSettings.alternatives;
}

/**
 * Detect the browser's preferred language
 * @returns {string} - The detected language code
 */
export function detectBrowserLanguage() {
  // Use browser's navigator.language if available
  if (typeof window !== 'undefined' && window.navigator) {
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang) {
      // Extract primary language code (e.g., 'en-US' -> 'en')
      const primaryLang = browserLang.split('-')[0];

      // Check if the language is in our available languages
      if (AVAILABLE_LANGUAGES[browserLang]) return browserLang;
      if (AVAILABLE_LANGUAGES[primaryLang]) return primaryLang;
    }
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Get the best language match based on region and browser settings
 * This considers region first, then falls back to browser preferences
 * @param {string} regionCode - The detected region code
 * @returns {string} - The best language match
 */
export function getBestLanguageMatch(regionCode) {
  // Try to get language from region first
  const regionLanguage = getLanguageForRegion(regionCode);
  if (regionLanguage !== DEFAULT_LANGUAGE) {
    return regionLanguage;
  }

  // If region defaults to English, try browser language
  return detectBrowserLanguage();
}

/**
 * Get all available languages for UI display
 * @param {string} regionCode - The detected region code
 * @returns {Array} - Array of language objects with code, displayName, and nativeName
 */
export function getAvailableLanguagesForUI(regionCode) {
  // Primary language based on region
  const primaryLang = getLanguageForRegion(regionCode);

  // Alternative languages for the region
  const altLangs = getAlternativeLanguagesForRegion(regionCode);

  // Always include English if it's not already included
  const langs = [primaryLang, ...altLangs];
  if (!langs.includes('en')) {
    langs.push('en');
  }

  // Map to full language objects
  return langs.filter(code => AVAILABLE_LANGUAGES[code])
    .map(code => ({
      code,
      ...AVAILABLE_LANGUAGES[code]
    }));
}

/**
 * Check if the language requires RTL (right-to-left) text direction
 * @param {string} languageCode - The language code
 * @returns {boolean} - True if the language is RTL
 */
export function isRTLLanguage(languageCode) {
  if (!languageCode || !AVAILABLE_LANGUAGES[languageCode]) {
    return false;
  }

  return AVAILABLE_LANGUAGES[languageCode].rtl;
}

/**
 * Format date according to the locale conventions
 * @param {Date|string} date - The date to format
 * @param {string} languageCode - The language code
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date string
 */
export function formatDate(date, languageCode, options = {}) {
  // Default options for date formatting
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = languageCode === 'zh' ? 'zh-CN' :
                 languageCode === 'zh-TW' ? 'zh-TW' :
                 languageCode;

  try {
    return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj);
  } catch (error) {
    console.error(`Error formatting date for locale ${locale}:`, error);
    return new Intl.DateTimeFormat('en', { ...defaultOptions, ...options }).format(dateObj);
  }
}
