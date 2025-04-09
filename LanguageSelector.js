import React from 'react';
import { useLanguage } from './LanguageProvider';

/**
 * Language selector component
 * Allows users to change the application language
 */
const LanguageSelector = ({ className }) => {
  const { language, changeLanguage, availableLanguages, t } = useLanguage();

  return (
    <div className={`language-selector ${className || ''}`}>
      <label htmlFor="language-select" className="sr-only">{t('languageSelector')}</label>
      <div className="relative">
        <select
          id="language-select"
          value={language}
          onChange={(e) => changeLanguage(e.target.value)}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          {availableLanguages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.nativeName}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;
