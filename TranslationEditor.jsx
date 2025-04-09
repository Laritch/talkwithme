import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { translateText, LANGUAGES, CONFIDENCE_LEVELS, addToTranslationMemory, getOfflineMode } from '../i18n/TranslationService';
import SpeechToTextInput from './SpeechToTextInput';
import TranslationHistory from './TranslationHistory';
import OfflineManager from './OfflineManager'; // Add import for OfflineManager
import './TranslationEditor.css';

/**
 * TranslationEditor Component
 *
 * Enhanced implementation that allows users to review, edit and correct machine translations
 * with confidence indicators, text-to-speech capabilities, and fallback translations.
 */
const TranslationEditor = () => {
  // Get languages from context but use direct imports for translation functions
  const { currentLanguage } = useLanguage();

  // Basic state management
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState(currentLanguage !== 'en' ? currentLanguage : 'fr');
  const [sourceText, setSourceText] = useState('');
  const [translationResult, setTranslationResult] = useState(null);
  const [userTranslation, setUserTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [status, setStatus] = useState('');

  // Speech-to-text mode
  const [useVoiceInput, setUseVoiceInput] = useState(false);

  // TTS functionality
  const [speaking, setSpeaking] = useState(false);
  const speechSynthRef = useRef(window.speechSynthesis);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');

  // Feedback state and handler functions
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Add state for showing translation history
  const [showHistory, setShowHistory] = useState(false);

  // Add state for showing offline manager
  const [showOfflineManager, setShowOfflineManager] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Check if we're in offline mode
  useEffect(() => {
    setIsOfflineMode(getOfflineMode());

    // Listen for online/offline events
    const handleOnlineStatusChange = () => {
      setIsOfflineMode(getOfflineMode());
    };

    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, []);

  // Get available voices for text-to-speech
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthRef.current.getVoices();
      setAvailableVoices(voices);

      // Try to find voice for target language
      const langCode = targetLanguage.split('-')[0]; // Get base language code
      const matchingVoice = voices.find(voice =>
        voice.lang.toLowerCase().startsWith(langCode.toLowerCase())
      );

      if (matchingVoice) {
        setSelectedVoice(matchingVoice.name);
      }
    };

    // Load voices right away
    loadVoices();

    // Chrome needs this event to get all voices
    if (speechSynthRef.current.onvoiceschanged !== undefined) {
      speechSynthRef.current.onvoiceschanged = loadVoices;
    }

    // Cleanup
    return () => {
      if (speechSynthRef.current.speaking) {
        speechSynthRef.current.cancel();
      }
    };
  }, [targetLanguage]);

  // Handle speech-to-text transcription
  const handleTranscription = (transcript) => {
    setSourceText(transcript);
    setStatus('Speech transcription received');
  };

  // Toggle speech input mode
  const toggleVoiceInput = () => {
    setUseVoiceInput(!useVoiceInput);
  };

  // Generate machine translation
  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      setStatus('Please enter text to translate');
      return;
    }

    setIsTranslating(true);
    setStatus('Translating...');
    setTranslationResult(null);
    setUserTranslation('');

    try {
      // Simple translation approach - direct call to translateText
      console.log(`Translating from ${sourceLanguage} to ${targetLanguage}:`, sourceText);

      const result = await translateText(
        sourceText,
        targetLanguage,
        sourceLanguage
      );

      console.log('Translation result:', result);

      if (!result || result.text === sourceText) {
        setStatus('Translation returned unchanged text. Please try different languages.');
      } else {
        setTranslationResult(result);
        setUserTranslation(result.text);

        // Set status message based on confidence and fallback
        if (result.fallback) {
          setStatus(`Translation completed using fallback system. Original error: ${result.error}`);
        } else if (result.fromMemory) {
          setStatus(`Translation completed using your translation memory with ${result.confidence} confidence`);
        } else {
          const confidenceMsg = result.confidence === CONFIDENCE_LEVELS.HIGH
            ? 'high confidence'
            : result.confidence === CONFIDENCE_LEVELS.MEDIUM
              ? 'medium confidence'
              : 'low confidence';

          setStatus(`Translation completed successfully with ${confidenceMsg}`);
        }
      }
    } catch (error) {
      console.error('Translation failed:', error);
      setStatus('Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  // Reset everything
  const handleReset = () => {
    setSourceText('');
    setTranslationResult(null);
    setUserTranslation('');
    setStatus('');

    // Stop any ongoing speech
    if (speechSynthRef.current.speaking) {
      speechSynthRef.current.cancel();
      setSpeaking(false);
    }
  };

  // Save a correction (enhanced with confidence data)
  const saveCorrection = () => {
    if (!sourceText.trim() || !userTranslation.trim() || (translationResult && userTranslation === translationResult.text)) {
      setStatus('Please make changes to the translation before saving');
      return;
    }

    const newCorrection = {
      id: `correction_${Date.now()}`,
      sourceLanguage,
      targetLanguage,
      sourceText,
      machineTranslation: translationResult?.text || '',
      machineConfidence: translationResult?.confidence || CONFIDENCE_LEVELS.UNKNOWN,
      wasFallback: translationResult?.fallback || false,
      userTranslation,
      timestamp: new Date().toISOString()
    };

    try {
      // Get existing corrections
      const savedCorrections = JSON.parse(localStorage.getItem('translationCorrections')) || [];

      // Add new correction
      const updatedCorrections = [newCorrection, ...savedCorrections];

      // Save back to localStorage
      localStorage.setItem('translationCorrections', JSON.stringify(updatedCorrections));

      setStatus('Correction saved successfully');
    } catch (error) {
      console.error('Failed to save correction:', error);
      setStatus('Failed to save correction');
    }
  };

  // Handle feedback submission
  const handleFeedbackSubmit = () => {
    if (feedbackRating === 0) {
      setStatus('Please select a rating before submitting feedback');
      return;
    }

    try {
      // Create feedback object
      const feedback = {
        id: `feedback_${Date.now()}`,
        sourceLanguage,
        targetLanguage,
        sourceText,
        translation: userTranslation,
        originalTranslation: translationResult?.text || '',
        wasEdited: translationResult?.text !== userTranslation,
        rating: feedbackRating,
        comment: feedbackComment,
        confidence: translationResult?.confidence || CONFIDENCE_LEVELS.UNKNOWN,
        wasFallback: translationResult?.fallback || false,
        fromMemory: translationResult?.fromMemory || false,
        timestamp: new Date().toISOString()
      };

      // Get existing feedback
      const savedFeedback = JSON.parse(localStorage.getItem('translationFeedback')) || [];

      // Add new feedback
      const updatedFeedback = [feedback, ...savedFeedback];

      // Save back to localStorage
      localStorage.setItem('translationFeedback', JSON.stringify(updatedFeedback));

      // Confirm submission
      setFeedbackSubmitted(true);
      setStatus('Thank you for your feedback!');

      // If rating is low and text was modified, add to translation memory
      if (feedbackRating <= 2 && translationResult?.text !== userTranslation) {
        saveCorrection();
      } else if (feedbackRating >= 4) {
        // If rating is high and this wasn't already from memory, consider adding to memory
        if (!translationResult?.fromMemory) {
          const correction = {
            sourceLanguage,
            targetLanguage,
            sourceText,
            machineTranslation: translationResult?.text || '',
            machineConfidence: translationResult?.confidence || CONFIDENCE_LEVELS.UNKNOWN,
            wasFallback: translationResult?.fallback || false,
            userTranslation,
            userRating: feedbackRating,
            timestamp: new Date().toISOString()
          };

          addToTranslationMemory(correction);
        }
      }

      // Close feedback form after 2 seconds
      setTimeout(() => {
        setShowFeedback(false);
        setFeedbackSubmitted(false);
        setFeedbackRating(0);
        setFeedbackComment('');
      }, 2000);
    } catch (error) {
      console.error('Failed to save feedback:', error);
      setStatus('Failed to save feedback');
    }
  };

  // Cancel feedback form
  const handleFeedbackCancel = () => {
    setShowFeedback(false);
    setFeedbackRating(0);
    setFeedbackComment('');
  };

  // Handle using a translation from history
  const handleUseHistoryTranslation = (historyItem) => {
    // Set source language and text
    setSourceLanguage(historyItem.sourceLanguage);
    setSourceText(historyItem.sourceText);

    // Set target language and translations
    setTargetLanguage(historyItem.targetLanguage);
    setTranslationResult(historyItem.result);
    setUserTranslation(historyItem.result.text);

    // Set status message
    setStatus('Loaded translation from history.');

    // Close history modal
    setShowHistory(false);
  };

  // Render star rating component
  const StarRating = ({ rating, onRate }) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? 'active' : ''}`}
            onClick={() => onRate(star)}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  // Text-to-speech function
  const speakTranslation = () => {
    if (!translationResult || !userTranslation || speaking) return;

    // Cancel any ongoing speech
    if (speechSynthRef.current.speaking) {
      speechSynthRef.current.cancel();
    }

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(userTranslation);

    // Set voice if available
    if (selectedVoice) {
      const voice = availableVoices.find(v => v.name === selectedVoice);
      if (voice) {
        utterance.voice = voice;
      }
    }

    // Set language
    utterance.lang = targetLanguage;

    // Start and end events
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => {
      setSpeaking(false);
      setStatus('Text-to-speech failed. Try another browser or language.');
    };

    // Speak
    speechSynthRef.current.speak(utterance);
  };

  // Cancel speech
  const cancelSpeech = () => {
    if (speechSynthRef.current.speaking) {
      speechSynthRef.current.cancel();
      setSpeaking(false);
    }
  };

  // Get confidence level class
  const getConfidenceClass = (confidence) => {
    switch (confidence) {
      case CONFIDENCE_LEVELS.HIGH:
        return 'confidence-high';
      case CONFIDENCE_LEVELS.MEDIUM:
        return 'confidence-medium';
      case CONFIDENCE_LEVELS.LOW:
        return 'confidence-low';
      default:
        return 'confidence-unknown';
    }
  };

  // Toggle offline manager visibility
  const toggleOfflineManager = () => {
    setShowOfflineManager(!showOfflineManager);
  };

  return (
    <div className="translation-editor">
      <h2 className="translation-editor-title">Translation Editor</h2>
      <p className="translation-editor-description">
        Review and correct machine translations to improve quality over time.
      </p>

      {status && (
        <div className={`status-message ${status.includes('fail') || status.includes('Please') ? 'error' : status.includes('fallback') ? 'warning' : 'success'}`}>
          {status}
        </div>
      )}

      {/* Offline mode indicator */}
      {isOfflineMode && (
        <div className="offline-mode-indicator">
          Offline Mode: Working with cached translations
          <button
            className="offline-settings-btn"
            onClick={toggleOfflineManager}
          >
            Settings
          </button>
        </div>
      )}

      {/* Offline manager component */}
      {showOfflineManager && (
        <OfflineManager />
      )}

      <div className="editor-container">
        <div className="language-controls">
          <div className="language-select">
            <label>Source Language</label>
            <select
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
              disabled={isTranslating}
            >
              {Object.entries(LANGUAGES).map(([code, lang]) => (
                <option key={code} value={code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="language-direction">→</div>

          <div className="language-select">
            <label>Target Language</label>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              disabled={isTranslating}
            >
              {Object.entries(LANGUAGES)
                .filter(([code]) => code !== sourceLanguage)
                .map(([code, lang]) => (
                  <option key={code} value={code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Voice selector for TTS */}
          <div className="voice-select">
            <label>Voice</label>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              disabled={availableVoices.length === 0 || isTranslating}
            >
              {availableVoices.length === 0 ? (
                <option value="">No voices available</option>
              ) : (
                <>
                  <option value="">Select a voice</option>
                  {availableVoices
                    .filter(voice => voice.lang.toLowerCase().startsWith(targetLanguage.toLowerCase()))
                    .map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name}
                      </option>
                    ))}
                </>
              )}
            </select>
          </div>

          {/* Speech input toggle */}
          <div className="voice-input-toggle">
            <button
              className={`toggle-voice-btn ${useVoiceInput ? 'active' : ''}`}
              onClick={toggleVoiceInput}
              title={useVoiceInput ? "Switch to text input" : "Switch to voice input"}
            >
              {useVoiceInput ? "🎤 Using Voice" : "⌨️ Using Text"}
            </button>
          </div>

          {/* Button to access translation history */}
          <div className="history-toggle">
            <button
              className="history-btn"
              onClick={() => setShowHistory(true)}
              disabled={isTranslating}
            >
              View Translation History
            </button>
          </div>

          {/* Button to toggle offline manager */}
          <div className="offline-toggle">
            <button
              className="offline-btn"
              onClick={toggleOfflineManager}
              disabled={isTranslating}
            >
              {showOfflineManager ? "Hide Offline Settings" : "Offline Settings"}
            </button>
          </div>
        </div>

        <div className="editor-panels">
          <div className="editor-panel source-panel">
            <div className="panel-header">
              <h3>Source Text ({LANGUAGES[sourceLanguage]?.name})</h3>
            </div>

            {useVoiceInput ? (
              <SpeechToTextInput
                onTranscriptionComplete={handleTranscription}
                language={sourceLanguage === 'en' ? 'en-US' : sourceLanguage}
                placeholder={`Speak in ${LANGUAGES[sourceLanguage]?.name} to translate...`}
                buttonText={`Start Speaking in ${LANGUAGES[sourceLanguage]?.name}`}
                disabled={isTranslating}
                className="voice-input-container"
              />
            ) : (
              <textarea
                className="source-textarea"
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder={`Enter text in ${LANGUAGES[sourceLanguage]?.name} to translate...`}
                dir={LANGUAGES[sourceLanguage]?.dir || 'ltr'}
                disabled={isTranslating}
              />
            )}
          </div>

          <div className="editor-panel translation-panel">
            <div className="panel-header">
              <h3>Translation ({LANGUAGES[targetLanguage]?.name})</h3>

              {/* Add confidence indicator if translation result exists */}
              {translationResult && (
                <div className={`confidence-pill ${getConfidenceClass(translationResult.confidence)}`}>
                  {translationResult.confidence === CONFIDENCE_LEVELS.HIGH ? 'High Confidence' :
                   translationResult.confidence === CONFIDENCE_LEVELS.MEDIUM ? 'Medium Confidence' :
                   'Low Confidence'}
                </div>
              )}
            </div>

            {/* Fallback indicator */}
            {translationResult && translationResult.fallback && (
              <div className="fallback-indicator">
                Using fallback translation. Original translation failed: {translationResult.error}
              </div>
            )}

            {/* From memory indicator */}
            {translationResult && translationResult.fromMemory && (
              <div className="memory-indicator">
                Translation from memory (previously corrected or approved)
              </div>
            )}

            <textarea
              className="translation-textarea"
              value={userTranslation}
              onChange={(e) => setUserTranslation(e.target.value)}
              placeholder={isTranslating ? 'Translating...' : `Translation will appear here (${LANGUAGES[targetLanguage]?.name})`}
              dir={LANGUAGES[targetLanguage]?.dir || 'ltr'}
              disabled={isTranslating || !translationResult}
            />

            {translationResult && translationResult.text !== userTranslation && (
              <div className="diff-indicator">You've modified the machine translation</div>
            )}
          </div>
        </div>

        <div className="translation-actions">
          <button
            className="translate-btn"
            onClick={handleTranslate}
            disabled={isTranslating || !sourceText.trim()}
          >
            {isTranslating ? 'Translating...' : 'Translate'}
          </button>

          <button
            className="reset-btn"
            onClick={handleReset}
            disabled={isTranslating || (!sourceText && !translationResult)}
          >
            Reset
          </button>

          {/* Add TTS button */}
          {translationResult && selectedVoice && (
            <button
              className={`speak-btn ${speaking ? 'speaking' : ''}`}
              onClick={speaking ? cancelSpeech : speakTranslation}
              disabled={isTranslating || !userTranslation}
            >
              {speaking ? 'Stop Speaking' : 'Speak Translation'}
            </button>
          )}

          <button
            className="save-correction-btn"
            onClick={saveCorrection}
            disabled={isTranslating || !translationResult || translationResult.text === userTranslation}
          >
            Save Correction
          </button>

          <button
            className="feedback-btn"
            onClick={() => setShowFeedback(true)}
            disabled={isTranslating}
          >
            Leave Feedback
          </button>
        </div>

        {translationResult && translationResult.text !== userTranslation && (
          <div className="translation-comparison">
            <h3>Translation Comparison</h3>
            <div className="comparison-panels">
              <div className="comparison-panel">
                <h4>
                  Machine Translation
                  {translationResult.fallback && (
                    <span className="fallback-badge">Fallback</span>
                  )}
                  {translationResult.fromMemory && (
                    <span className="memory-badge">From Memory</span>
                  )}
                </h4>
                <div className="comparison-content" dir={LANGUAGES[targetLanguage]?.dir || 'ltr'}>
                  {translationResult.text}
                </div>
                <div className={`confidence-indicator ${getConfidenceClass(translationResult.confidence)}`}>
                  {translationResult.confidence === CONFIDENCE_LEVELS.HIGH ? 'High Confidence' :
                   translationResult.confidence === CONFIDENCE_LEVELS.MEDIUM ? 'Medium Confidence' :
                   'Low Confidence'}
                </div>
              </div>
              <div className="comparison-panel">
                <h4>Your Correction</h4>
                <div className="comparison-content" dir={LANGUAGES[targetLanguage]?.dir || 'ltr'}>
                  {userTranslation}
                </div>
              </div>
            </div>
            <p className="comparison-note">
              Your corrections help improve the translation system over time.
            </p>
          </div>
        )}
      </div>

      {/* Feedback section */}
      {showFeedback && (
        <div className="feedback-section">
          <h3>Feedback</h3>
          <StarRating rating={feedbackRating} onRate={setFeedbackRating} />
          <textarea
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
            placeholder="Leave a comment (optional)"
          />
          <button onClick={handleFeedbackSubmit}>Submit Feedback</button>
          <button onClick={handleFeedbackCancel}>Cancel</button>
          {feedbackSubmitted && <div className="feedback-status">Feedback submitted!</div>}
        </div>
      )}

      {/* Translation History Modal */}
      {showHistory && (
        <TranslationHistory
          onUseTranslation={handleUseHistoryTranslation}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
};

export default TranslationEditor;
