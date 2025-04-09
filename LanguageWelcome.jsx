import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { detectLanguage, LANGUAGES } from '../i18n/TranslationService';
import './LanguageWelcome.css';

/**
 * LanguageWelcome Component
 *
 * Displays a welcome overlay for first-time visitors that:
 * 1. Detects their browser language
 * 2. Offers to continue in that language or English
 * 3. Allows selection of any supported language
 * 4. Provides option to match with experts who speak their language
 */
const LanguageWelcome = ({ onClose }) => {
  const { currentLanguage, changeLanguage, translate } = useLanguage();
  const [detectedLanguage, setDetectedLanguage] = useState('en');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [matchWithExperts, setMatchWithExperts] = useState(true);
  const [isDetecting, setIsDetecting] = useState(true);
  const [translatedWelcomeText, setTranslatedWelcomeText] = useState('');
  const [showTopScroll, setShowTopScroll] = useState(false);
  const [showBottomScroll, setShowBottomScroll] = useState(true);

  const contentRef = useRef(null);
  const expertMatchRef = useRef(null);

  // Detect browser language on component mount
  useEffect(() => {
    const detectBrowserLanguage = async () => {
      try {
        // Get browser language (e.g., "en-US" or "nl-NL")
        const browserLang = navigator.language || navigator.userLanguage;
        const langCode = browserLang.split('-')[0]; // Get the primary language part

        // Check if we support this language
        if (LANGUAGES[langCode]) {
          setDetectedLanguage(langCode);
          setSelectedLanguage(langCode);

          // If not English, translate the welcome text to the detected language
          if (langCode !== 'en') {
            try {
              // Get translation of welcome message in detected language
              const welcomeText = "Welcome to our platform! We've detected your preferred language.";
              const translated = await detectLanguage(welcomeText);
              setTranslatedWelcomeText(translated);
            } catch (error) {
              console.error('Error translating welcome text:', error);
            }
          }
        } else {
          // Default to English if we don't support the detected language
          setDetectedLanguage('en');
          setSelectedLanguage('en');
        }

        setIsDetecting(false);
      } catch (error) {
        console.error('Error detecting browser language:', error);
        setDetectedLanguage('en');
        setSelectedLanguage('en');
        setIsDetecting(false);
      }
    };

    detectBrowserLanguage();
  }, []);

  // Add scroll event listener to show/hide scroll indicators
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = content;

      // Show top scroll indicator if not at the top
      setShowTopScroll(scrollTop > 10);

      // Show bottom scroll indicator if not at the bottom
      setShowBottomScroll(scrollTop + clientHeight < scrollHeight - 10);
    };

    // Initial check
    handleScroll();

    // Add scroll event listener
    content.addEventListener('scroll', handleScroll);

    // Clean up
    return () => {
      content.removeEventListener('scroll', handleScroll);
    };
  }, [showLanguageSelector]);

  // Scroll expert matching option into view when language selector is opened
  useEffect(() => {
    if (showLanguageSelector && expertMatchRef.current) {
      setTimeout(() => {
        expertMatchRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 300);
    }
  }, [showLanguageSelector]);

  // Handle language selection
  const handleLanguageSelect = (langCode) => {
    setSelectedLanguage(langCode);
  };

  // Handle continue button click
  const handleContinue = () => {
    // Change the application language
    changeLanguage(selectedLanguage);

    // Store user preference for matching with experts
    if (matchWithExperts) {
      localStorage.setItem('preferredExpertLanguage', selectedLanguage);
    }

    // Mark as not a first-time visitor anymore
    localStorage.setItem('hasVisited', 'true');

    // Close the overlay
    onClose();
  };

  // Handle skip button click
  const handleSkip = () => {
    // Just close the overlay without changing language
    localStorage.setItem('hasVisited', 'true');
    onClose();
  };

  // Toggle the full language selector
  const toggleLanguageSelector = () => {
    setShowLanguageSelector(!showLanguageSelector);
  };

  // Toggle expert matching preference
  const toggleExpertMatching = () => {
    setMatchWithExperts(!matchWithExperts);
  };

  // Get welcome message based on detected language
  const getWelcomeMessage = () => {
    if (detectedLanguage === 'en' || !translatedWelcomeText) {
      return 'Welcome to our platform! We\'ve detected your preferred language.';
    }
    return translatedWelcomeText;
  };

  // Function to scroll to expert matching section
  const scrollToExpertMatching = () => {
    if (expertMatchRef.current) {
      expertMatchRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  return (
    <div className="language-welcome-overlay">
      <div className="language-welcome-modal">
        <div className="language-welcome-header">
          <span className="language-welcome-globe">🌎</span>
          <h2 className="language-welcome-title">Language Preferences</h2>
        </div>

        <div
          className="language-welcome-content"
          ref={contentRef}
        >
          <div className={`scroll-indicator-top ${showTopScroll ? 'visible' : ''}`}></div>
          <div className={`scroll-indicator-bottom ${showBottomScroll ? 'visible' : ''}`}></div>

          <p className="language-welcome-message">
            {getWelcomeMessage()}
          </p>

          {!isDetecting && (
            <>
              <div className="detected-language">
                <span className="detected-language-flag">
                  {LANGUAGES[detectedLanguage]?.flag}
                </span>
                <div className="detected-language-info">
                  <div className="detected-language-label">We detected your language as</div>
                  <div className="detected-language-name">
                    {LANGUAGES[detectedLanguage]?.name} ({LANGUAGES[detectedLanguage]?.nativeName})
                  </div>
                </div>
              </div>

              <div className="language-options">
                <button
                  className={`language-option-btn ${selectedLanguage === detectedLanguage ? 'primary' : ''}`}
                  onClick={() => handleLanguageSelect(detectedLanguage)}
                >
                  <span className="language-option-flag">
                    {LANGUAGES[detectedLanguage]?.flag}
                  </span>
                  Continue in {LANGUAGES[detectedLanguage]?.name}
                </button>

                {detectedLanguage !== 'en' && (
                  <button
                    className={`language-option-btn ${selectedLanguage === 'en' ? 'primary' : ''}`}
                    onClick={() => handleLanguageSelect('en')}
                  >
                    <span className="language-option-flag">
                      {LANGUAGES['en']?.flag}
                    </span>
                    Continue in English
                  </button>
                )}

                <button
                  className="language-option-btn"
                  onClick={() => {
                    toggleLanguageSelector();
                    // If already showing lang selector, just scroll to expert section
                    if (showLanguageSelector) {
                      scrollToExpertMatching();
                    }
                  }}
                >
                  <span className="language-option-flag">🌐</span>
                  Select another language
                </button>
              </div>

              {showLanguageSelector && (
                <div className="language-selector-section">
                  <div className="language-selector-label">Choose your preferred language:</div>
                  <select
                    className="language-selector"
                    value={selectedLanguage}
                    onChange={(e) => handleLanguageSelect(e.target.value)}
                  >
                    {Object.entries(LANGUAGES).map(([code, lang]) => (
                      <option key={code} value={code}>
                        {lang.flag} {lang.name} ({lang.nativeName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div
                className="expert-match-option"
                tabIndex="0"
                role="group"
                aria-labelledby="expert-match-heading"
                ref={expertMatchRef}
                onClick={() => toggleExpertMatching()}
              >
                <div className="expert-match-checkbox-wrapper">
                  <input
                    type="checkbox"
                    className="expert-match-checkbox"
                    checked={matchWithExperts}
                    onChange={() => toggleExpertMatching()}
                    id="expert-match-checkbox"
                    aria-describedby="expert-match-description"
                  />
                </div>
                <div className="expert-match-info">
                  <label htmlFor="expert-match-checkbox" className="expert-match-title" id="expert-match-heading">
                    Match with experts who speak my language
                  </label>
                  <p className="expert-match-description" id="expert-match-description">
                    We'll prioritize connecting you with experts who are conversant in your preferred language.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="language-welcome-footer">
          <button className="skip-btn" onClick={handleSkip}>
            Skip
          </button>
          <button
            className="continue-btn"
            onClick={handleContinue}
            disabled={isDetecting}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageWelcome;
