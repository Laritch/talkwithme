import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import './LanguageSelector.css';

/**
 * Language Selector Component
 *
 * A DeepL-inspired dropdown for selecting the application language
 */
const LanguageSelector = () => {
  const { currentLanguage, changeLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get current language data
  const currentLang = languages[currentLanguage] || languages.en;

  return (
    <div className="language-selector" ref={dropdownRef}>
      <button
        className="language-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="language-flag">{currentLang.flag}</span>
        <span className="language-name">{currentLang.name}</span>
        <span className="dropdown-arrow">▼</span>
      </button>

      {isOpen && (
        <div className="language-dropdown">
          <div className="dropdown-header">
            <h3>Select Language</h3>
            <button
              className="close-button"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <ul
            className="language-list"
            role="listbox"
            aria-activedescendant={`lang-${currentLanguage}`}
          >
            {Object.entries(languages).map(([code, lang]) => (
              <li
                key={code}
                id={`lang-${code}`}
                className={`language-option ${code === currentLanguage ? 'active' : ''}`}
                onClick={() => {
                  changeLanguage(code);
                  setIsOpen(false);
                }}
                role="option"
                aria-selected={code === currentLanguage}
              >
                <span className="language-flag">{lang.flag}</span>
                <span className="language-native-name">{lang.nativeName}</span>
                <span className="language-english-name">({lang.name})</span>
                {code === currentLanguage && (
                  <span className="checkmark">✓</span>
                )}
              </li>
            ))}
          </ul>

          <div className="dropdown-footer">
            <span>AI-powered translation</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
