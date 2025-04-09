/**
 * TranslationService.js
 *
 * This file provides the main translation service interface for the application.
 * It integrates both local translation methods and external API-based translations.
 */

import { simulateTranslation, fallbackTranslation, CONFIDENCE_LEVELS } from './FixedTranslation';
import { translateWithAPI } from './TranslationAPI';
import { getCachedTranslation, cacheTranslation, clearTranslationCache, getCacheStats } from './TranslationCache';

// Translation memory cache
let translationMemory = null;

// Offline mode state
let offlineMode = false;

/**
 * Export confidence levels for use in the application
 */
export { CONFIDENCE_LEVELS };
export { getCacheStats, clearTranslationCache };

/**
 * Supported languages in the application
 */
export const LANGUAGES = {
  'en': { name: 'English', code: 'en', native: 'English' },
  'fr': { name: 'French', code: 'fr', native: 'Français' },
  'es': { name: 'Spanish', code: 'es', native: 'Español' },
  'de': { name: 'German', code: 'de', native: 'Deutsch' },
  'it': { name: 'Italian', code: 'it', native: 'Italiano' },
  'ru': { name: 'Russian', code: 'ru', native: 'Русский' },
  'zh': { name: 'Chinese (Simplified)', code: 'zh', native: '中文' },
  'ja': { name: 'Japanese', code: 'ja', native: '日本語' }
};

/**
 * Set the application offline mode
 * @param {boolean} mode - Whether the app should operate in offline mode
 */
export function setOfflineMode(mode) {
  console.log(`Setting offline mode to: ${mode}`);
  offlineMode = mode;

  // Save preference
  try {
    localStorage.setItem('translation_offline_mode', JSON.stringify(mode));
  } catch (error) {
    console.error('Failed to save offline mode preference:', error);
  }
}

/**
 * Get the current offline mode state
 * @returns {boolean} - Current offline mode state
 */
export function getOfflineMode() {
  // Check localStorage for saved preference
  try {
    const saved = localStorage.getItem('translation_offline_mode');
    if (saved !== null) {
      offlineMode = JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load offline mode preference:', error);
  }

  // Also check network status
  if (!navigator.onLine) {
    offlineMode = true;
  }

  return offlineMode;
}

/**
 * Initialize the translation memory from localStorage
 */
function initTranslationMemory() {
  if (translationMemory !== null) return;

  try {
    const saved = localStorage.getItem('translation_memory');
    translationMemory = saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.error('Failed to load translation memory:', error);
    translationMemory = {};
  }
}

/**
 * Save translation memory to localStorage
 */
function saveTranslationMemory() {
  try {
    localStorage.setItem('translation_memory', JSON.stringify(translationMemory));
  } catch (error) {
    console.error('Failed to save translation memory:', error);
  }
}

/**
 * Add a translation to memory
 * @param {string} sourceText - Source text
 * @param {string} translatedText - Translated text
 * @param {string} sourceLang - Source language
 * @param {string} targetLang - Target language
 * @param {string} confidence - Confidence level
 */
export function addToTranslationMemory(sourceText, translatedText, sourceLang, targetLang, confidence = CONFIDENCE_LEVELS.HIGH) {
  initTranslationMemory();

  // Create memory key
  const key = `${sourceLang}:${targetLang}:${sourceText}`;

  // Add to memory with timestamp
  translationMemory[key] = {
    translation: translatedText,
    confidence,
    timestamp: Date.now()
  };

  // Save to localStorage
  saveTranslationMemory();

  // Also add to the LRU cache for faster access
  cacheTranslation(sourceText, targetLang, sourceLang, {
    text: translatedText,
    confidence,
    fromMemory: true
  });
}

/**
 * Check translation memory for an existing translation
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language
 * @param {string} sourceLang - Source language
 * @returns {Object|null} - Translation from memory or null
 */
function checkTranslationMemory(text, targetLang, sourceLang) {
  initTranslationMemory();

  // Create memory key
  const key = `${sourceLang}:${targetLang}:${text}`;

  // Check if we have this in memory
  if (translationMemory[key]) {
    const memoryEntry = translationMemory[key];

    return {
      text: memoryEntry.translation,
      confidence: memoryEntry.confidence,
      fromMemory: true,
      timestamp: memoryEntry.timestamp
    };
  }

  return null;
}

/**
 * Main translation function that attempts different translation methods
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language
 * @param {string} sourceLang - Source language
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Translation result with metadata
 */
export async function translateText(text, targetLang, sourceLang = 'auto', options = {}) {
  console.log(`Translating: "${text}" from ${sourceLang} to ${targetLang}`);

  // Skip translation if text is empty
  if (!text || !text.trim()) {
    return {
      text,
      confidence: CONFIDENCE_LEVELS.HIGH,
      fallback: false,
      apiUsed: 'none'
    };
  }

  // Skip translation if source and target languages are the same
  if (sourceLang !== 'auto' && targetLang === sourceLang) {
    return {
      text,
      confidence: CONFIDENCE_LEVELS.HIGH,
      fallback: false,
      apiUsed: 'none'
    };
  }

  // First, check the cache for a previously translated text
  if (!options.skipCache) {
    const cachedResult = getCachedTranslation(text, targetLang, sourceLang);
    if (cachedResult) {
      console.log(`Found translation in cache: ${cachedResult.text}`);
      return cachedResult;
    }
  }

  // Check if we should use offline mode
  const useOfflineMode = options.offlineMode !== undefined ? options.offlineMode : getOfflineMode();
  options.offlineMode = useOfflineMode;

  // Then, check translation memory for exact match
  if (!options.skipMemory) {
    const fromMemory = checkTranslationMemory(text, targetLang, sourceLang);
    if (fromMemory) {
      console.log(`Found translation in memory: ${fromMemory.text}`);
      // Cache the result for faster future access
      cacheTranslation(text, targetLang, sourceLang, fromMemory);
      return fromMemory;
    }
  }

  // Use the TranslationAPI module for all API calls and fallbacks
  try {
    console.log('Using TranslationAPI for translation');

    // Pass options to API
    const apiResult = await translateWithAPI(
      text,
      targetLang,
      sourceLang,
      {
        ...options,
        skipCache: true, // We already checked the cache above
      }
    );

    // If the translation is high confidence, add it to memory
    if (apiResult.confidence === CONFIDENCE_LEVELS.HIGH && !apiResult.fallback) {
      addToTranslationMemory(
        text,
        apiResult.text,
        sourceLang,
        targetLang,
        apiResult.confidence
      );
    }

    return apiResult;
  } catch (error) {
    console.error('Translation failed completely:', error);

    // Absolute last resort
    return {
      text: fallbackTranslation(text, targetLang, sourceLang),
      confidence: CONFIDENCE_LEVELS.LOW,
      fallback: true,
      error: error.message || 'All translation methods failed',
      apiUsed: 'emergency'
    };
  }
}

/**
 * Initialize the translation service
 */
export function initTranslationService() {
  // Initialize translation memory
  initTranslationMemory();

  // Set initial offline mode based on network status
  setOfflineMode(!navigator.onLine);

  // Listen for online/offline events
  window.addEventListener('online', () => {
    if (getOfflineMode()) {
      // Only change if the user hasn't manually set offline mode
      const savedPref = localStorage.getItem('translation_offline_mode');
      if (savedPref === null || savedPref === 'true') {
        setOfflineMode(false);
      }
    }
  });

  window.addEventListener('offline', () => {
    setOfflineMode(true);
  });
}
