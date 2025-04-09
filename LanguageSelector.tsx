import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  // Get current language
  const currentLanguage = i18n.language;

  // Handle language change
  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    // Save language preference in localStorage
    localStorage.setItem('preferredLanguage', language);
  };

  // Check if there's a saved language preference on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage && savedLanguage !== currentLanguage) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [currentLanguage, i18n]);

  return (
    <div className="language-selector">
      <button
        className={`language-btn ${currentLanguage === 'en' ? 'active' : ''}`}
        onClick={() => changeLanguage('en')}
        aria-label="Switch to English"
      >
        <span className="flag">🇺🇸</span>
        <span className="lang-name">EN</span>
      </button>
      <button
        className={`language-btn ${currentLanguage === 'es' ? 'active' : ''}`}
        onClick={() => changeLanguage('es')}
        aria-label="Switch to Spanish"
      >
        <span className="flag">🇪🇸</span>
        <span className="lang-name">ES</span>
      </button>

      <style jsx>{`
        .language-selector {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .language-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .language-btn:hover {
          background: #f5f5f5;
        }

        .language-btn.active {
          background: #e0e0e0;
          border-color: #c0c0c0;
          font-weight: bold;
        }

        .flag {
          font-size: 1.2rem;
        }

        .lang-name {
          font-size: 0.8rem;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
};

export default LanguageSelector;
