import React, { createContext, useState, useEffect, useContext } from 'react';
import { LANGUAGES, translateText, translateObject, detectLanguage } from './TranslationService';

// Create the context
const LanguageContext = createContext();

/**
 * Language Provider Component
 * Provides language context throughout the application
 */
export const LanguageProvider = ({ children }) => {
  // Get initial language from localStorage or browser settings
  const getInitialLanguage = () => {
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && LANGUAGES[savedLang]) {
      return savedLang;
    }

    // Try to use browser language if supported
    const browserLang = navigator.language.split('-')[0];
    return LANGUAGES[browserLang] ? browserLang : 'en';
  };

  const [currentLanguage, setCurrentLanguage] = useState(getInitialLanguage);
  const [isLoading, setIsLoading] = useState(false);

  // Apply language direction when language changes
  useEffect(() => {
    if (LANGUAGES[currentLanguage]) {
      // Set document direction (RTL/LTR)
      document.documentElement.dir = LANGUAGES[currentLanguage].dir;
      document.documentElement.lang = currentLanguage;

      // Add direction class to body for styling
      if (LANGUAGES[currentLanguage].dir === 'rtl') {
        document.body.classList.add('rtl');
        document.body.classList.remove('ltr');
      } else {
        document.body.classList.add('ltr');
        document.body.classList.remove('rtl');
      }

      // Save preference
      localStorage.setItem('preferredLanguage', currentLanguage);
    }
  }, [currentLanguage]);

  /**
   * Change the current language
   * @param {string} langCode - The language code to change to
   */
  const changeLanguage = (langCode) => {
    if (LANGUAGES[langCode]) {
      setCurrentLanguage(langCode);
    }
  };

  /**
   * Translate a single text string
   * @param {string} text - The text to translate
   * @param {Object} options - Translation options
   * @returns {Promise<string>} - The translated text
   */
  const translate = async (text, options = {}) => {
    if (!text || currentLanguage === 'en') return text;

    const { source = 'auto', placeholders = {} } = options;

    try {
      // Apply any placeholder substitutions after translation
      let processedText = text;

      // Process any placeholders before translation
      if (Object.keys(placeholders).length > 0) {
        // Replace placeholders with special tokens that won't get translated
        const tokens = {};
        Object.entries(placeholders).forEach(([key, value], index) => {
          const token = `__PH${index}__`;
          tokens[token] = value;
          processedText = processedText.replace(new RegExp(`{${key}}`, 'g'), token);
        });

        // Translate the text with tokens
        const translatedWithTokens = await translateText(processedText, currentLanguage, source);

        // Replace tokens with actual values
        let result = translatedWithTokens;
        Object.entries(tokens).forEach(([token, value]) => {
          result = result.replace(new RegExp(token, 'g'), value);
        });

        return result;
      }

      // Simple translation without placeholders
      return await translateText(text, currentLanguage, source);
    } catch (error) {
      console.error('Translation error in LanguageContext:', error);
      return text; // Return original text if translation fails
    }
  };

  /**
   * Translate an entire object's string properties
   * @param {Object} obj - The object to translate
   * @returns {Promise<Object>} - Translated object
   */
  const translateContent = async (obj) => {
    if (!obj || currentLanguage === 'en') return obj;

    try {
      return await translateObject(obj, currentLanguage);
    } catch (error) {
      console.error('Object translation error:', error);
      return obj; // Return original object if translation fails
    }
  };

  // Provide the context value
  const contextValue = {
    currentLanguage,
    changeLanguage,
    translate,
    translateContent,
    detectLanguage,
    languages: LANGUAGES,
    isLoading
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * Custom hook to use the language context
 * @returns {Object} The language context
 */
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
