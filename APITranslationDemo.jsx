import React, { useState, useEffect } from 'react';
import { translateText, LANGUAGES, getOfflineMode, setOfflineMode, CONFIDENCE_LEVELS, clearTranslationCache, getCacheStats } from '../i18n/TranslationService';
import { initTextToSpeech, speakText, stopSpeaking, isSpeaking, getBestVoiceForLanguage, getVoicesForLanguage, isTextToSpeechAvailable } from '../i18n/TextToSpeech';
import './APITranslationDemo.css';

/**
 * APITranslationDemo component
 *
 * A component that demonstrates the different translation APIs and caching features
 */
const APITranslationDemo = () => {
  // State for form inputs
  const [sourceText, setSourceText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('fr');
  const [isTranslating, setIsTranslating] = useState(false);

  // State for displaying results
  const [translationResult, setTranslationResult] = useState(null);
  const [translationHistory, setTranslationHistory] = useState([]);
  const [translationStats, setTranslationStats] = useState({});

  // Options states
  const [offlineMode, setOfflineModeState] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Text-to-speech states
  const [ttsAvailable, setTtsAvailable] = useState(false);
  const [isSpeakingNow, setIsSpeakingNow] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [speechRate, setSpeechRate] = useState(1);

  // Sample texts for quick testing
  const sampleTexts = [
    'Hello world',
    'How are you doing today?',
    'Thank you for your help',
    'The weather is nice today',
    'I would like to learn more about this platform'
  ];

  // Update offline mode state when component mounts
  useEffect(() => {
    setOfflineModeState(getOfflineMode());
    updateStats();

    // Initialize text-to-speech
    const ttsInit = initTextToSpeech();
    setTtsAvailable(ttsInit);

    // Set up a timer to check if speech is active
    const speechCheckInterval = setInterval(() => {
      setIsSpeakingNow(isSpeaking());
    }, 500);

    return () => {
      // Clean up
      stopSpeaking();
      clearInterval(speechCheckInterval);
    };
  }, []);

  // Update stats regularly
  useEffect(() => {
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, []);

  // Update available voices when target language changes
  useEffect(() => {
    if (ttsAvailable) {
      // Get available voices for the target language
      const voices = getVoicesForLanguage(targetLang);
      setAvailableVoices(voices);

      // Set the best voice as selected voice
      const bestVoice = getBestVoiceForLanguage(targetLang);
      if (bestVoice) {
        setSelectedVoice(bestVoice.name);
      } else {
        setSelectedVoice('');
      }
    }
  }, [targetLang, ttsAvailable]);

  // Update cache and translation statistics
  const updateStats = () => {
    setTranslationStats({
      cache: getCacheStats(),
      history: translationHistory.length
    });
  };

  // Handle form submission
  const handleTranslate = async (e) => {
    if (e) e.preventDefault();

    if (!sourceText.trim()) {
      alert('Please enter text to translate');
      return;
    }

    setIsTranslating(true);
    setTranslationResult(null);

    try {
      // Perform the translation
      const result = await translateText(
        sourceText,
        targetLang,
        sourceLang,
        {
          offlineMode,
          skipCache: forceRefresh // Optional: skip cache if forcing refresh
        }
      );

      // Update the result and history
      setTranslationResult(result);

      // Add to history (at the beginning)
      setTranslationHistory(prev => [
        {
          id: Date.now(),
          sourceText,
          sourceLang,
          targetLang,
          result,
          timestamp: new Date().toISOString()
        },
        ...prev.slice(0, 9) // Keep only the 10 most recent
      ]);

      updateStats();
    } catch (error) {
      console.error('Translation failed:', error);
      alert(`Translation failed: ${error.message}`);
    } finally {
      setIsTranslating(false);
    }
  };

  // Toggle offline mode
  const toggleOfflineMode = () => {
    const newMode = !offlineMode;
    setOfflineModeState(newMode);
    setOfflineMode(newMode);
  };

  // Set a sample text
  const setSampleText = (text) => {
    setSourceText(text);
  };

  // Clear the cache
  const handleClearCache = () => {
    clearTranslationCache();
    updateStats();
    alert('Translation cache has been cleared');
  };

  // Handle text-to-speech playback
  const handleSpeak = async () => {
    if (!translationResult || !translationResult.text) {
      return;
    }

    if (isSpeakingNow) {
      stopSpeaking();
      setIsSpeakingNow(false);
      return;
    }

    try {
      setIsSpeakingNow(true);

      await speakText(translationResult.text, targetLang, {
        voiceName: selectedVoice,
        rate: speechRate
      });

      setIsSpeakingNow(false);
    } catch (error) {
      console.error('Speech synthesis failed:', error);
      setIsSpeakingNow(false);
      alert(`Failed to speak text: ${error.message}`);
    }
  };

  // Get confidence level display
  const getConfidenceDisplay = (confidence) => {
    switch (confidence) {
      case CONFIDENCE_LEVELS.HIGH:
        return <span className="confidence high">High Confidence</span>;
      case CONFIDENCE_LEVELS.MEDIUM:
        return <span className="confidence medium">Medium Confidence</span>;
      case CONFIDENCE_LEVELS.LOW:
        return <span className="confidence low">Low Confidence</span>;
      default:
        return <span className="confidence unknown">Unknown Confidence</span>;
    }
  };

  // Get source display
  const getSourceDisplay = (result) => {
    if (!result) return null;

    let source;
    let color;

    if (result.fromCache) {
      source = "Cache";
      color = "#9c27b0"; // Purple
    } else if (result.fromMemory) {
      source = "Memory";
      color = "#2196f3"; // Blue
    } else if (result.apiUsed === 'deepl') {
      source = "DeepL API";
      color = "#00bcd4"; // Cyan
    } else if (result.apiUsed === 'google') {
      source = "Google Translate API";
      color = "#4caf50"; // Green
    } else if (result.apiUsed === 'amazon') {
      source = "Amazon Translate API";
      color = "#ff9800"; // Orange
    } else if (result.apiUsed === 'microsoft') {
      source = "Microsoft Translator API";
      color = "#3f51b5"; // Indigo
    } else if (result.apiUsed === 'libre') {
      source = "LibreTranslate API";
      color = "#009688"; // Teal
    } else if (result.apiUsed === 'simulation' || result.apiUsed === 'local') {
      source = "Local Dictionary";
      color = "#ff5722"; // Deep Orange
    } else if (result.apiUsed === 'emergency') {
      source = "Emergency Fallback";
      color = "#f44336"; // Red
    } else if (result.apiUsed === 'none') {
      source = "No Translation Needed";
      color = "#607d8b"; // Blue Grey
    } else {
      source = "Unknown Source";
      color = "#9e9e9e"; // Grey
    }

    return <span className="source" style={{ backgroundColor: color }}>{source}</span>;
  };

  return (
    <div className="api-translation-demo">
      <h1>Translation API Demo</h1>

      <div className="options-bar">
        <label>
          <input
            type="checkbox"
            checked={offlineMode}
            onChange={toggleOfflineMode}
          />
          Offline Mode
        </label>

        <label>
          <input
            type="checkbox"
            checked={forceRefresh}
            onChange={() => setForceRefresh(!forceRefresh)}
          />
          Skip Cache
        </label>

        <label>
          <input
            type="checkbox"
            checked={showDetails}
            onChange={() => setShowDetails(!showDetails)}
          />
          Show Details
        </label>

        <button
          type="button"
          className="clear-cache-btn"
          onClick={handleClearCache}
        >
          Clear Cache
        </button>
      </div>

      <div className="sample-texts">
        <h3>Sample Texts:</h3>
        <div className="sample-buttons">
          {sampleTexts.map((text, index) => (
            <button
              key={index}
              onClick={() => setSampleText(text)}
              type="button"
            >
              {text.length > 20 ? text.substring(0, 20) + '...' : text}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleTranslate} className="translation-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="sourceLang">From:</label>
            <select
              id="sourceLang"
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              disabled={isTranslating}
            >
              {Object.entries(LANGUAGES).map(([code, lang]) => (
                <option key={code} value={code}>
                  {lang.name} ({lang.native})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="targetLang">To:</label>
            <select
              id="targetLang"
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              disabled={isTranslating}
            >
              {Object.entries(LANGUAGES).map(([code, lang]) => (
                <option key={code} value={code}>
                  {lang.name} ({lang.native})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="sourceText">Text to Translate:</label>
          <textarea
            id="sourceText"
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            disabled={isTranslating}
            placeholder="Enter text to translate..."
            rows={4}
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={isTranslating || !sourceText.trim()}
          className="translate-btn"
        >
          {isTranslating ? 'Translating...' : 'Translate'}
        </button>
      </form>

      {translationResult && (
        <div className="translation-result">
          <h2>Translation Result</h2>

          <div className="result-badges">
            {getSourceDisplay(translationResult)}
            {getConfidenceDisplay(translationResult.confidence)}
            {translationResult.fallback &&
              <span className="badge fallback">Fallback Method</span>
            }
          </div>

          <div className="result-text">
            <p>{translationResult.text}</p>

            {ttsAvailable && (
              <div className="tts-controls">
                <button
                  className={`tts-button ${isSpeakingNow ? 'speaking' : ''}`}
                  onClick={handleSpeak}
                  disabled={!translationResult.text}
                >
                  {isSpeakingNow ? 'Stop' : 'Speak'}
                  <span className="material-icon">
                    {isSpeakingNow ? '■' : '▶'}
                  </span>
                </button>

                {availableVoices.length > 0 && (
                  <div className="tts-options">
                    <div className="voice-select">
                      <label htmlFor="tts-voice">Voice:</label>
                      <select
                        id="tts-voice"
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        disabled={isSpeakingNow}
                      >
                        <option value="">-- Default --</option>
                        {availableVoices.map(voice => (
                          <option key={voice.name} value={voice.name}>
                            {voice.name} ({voice.lang})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="rate-slider">
                      <label htmlFor="speech-rate">Speed:</label>
                      <input
                        id="speech-rate"
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={speechRate}
                        onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                        disabled={isSpeakingNow}
                      />
                      <span className="rate-value">{speechRate}x</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {showDetails && (
            <div className="result-details">
              <h3>Details</h3>
              <pre>{JSON.stringify(translationResult, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      <div className="stats-panel">
        <h3>Statistics</h3>
        <div className="stats-content">
          <p>Cache Size: {translationStats.cache?.size || 0} / {translationStats.cache?.maxSize || 0}</p>
          <p>Recent Translations: {translationStats.history || 0}</p>
          <p>Text-to-Speech: {ttsAvailable ? 'Available' : 'Not Available'}</p>
        </div>
      </div>

      {translationHistory.length > 0 && (
        <div className="history-panel">
          <h3>Recent Translations</h3>
          <ul className="history-list">
            {translationHistory.map(item => (
              <li key={item.id} className="history-item">
                <div className="history-source">
                  <strong>{LANGUAGES[item.sourceLang]?.name}:</strong> {item.sourceText}
                </div>
                <div className="history-result">
                  <strong>{LANGUAGES[item.targetLang]?.name}:</strong> {item.result.text}
                  {getSourceDisplay(item.result)}
                  {ttsAvailable && (
                    <button
                      className="history-speak-btn"
                      onClick={() => {
                        // Set current result and trigger speaking
                        setTranslationResult(item.result);
                        setTargetLang(item.targetLang);
                        // Let the effect update the voices, then speak
                        setTimeout(() => handleSpeak(), 100);
                      }}
                      disabled={isSpeakingNow}
                    >
                      Speak
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default APITranslationDemo;
