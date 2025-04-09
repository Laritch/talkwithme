import React, { useState, useEffect, useRef } from 'react';
import { translateText, translateBatch, LANGUAGES, CONFIDENCE_LEVELS } from './i18n/TranslationService';
import './TranslationTest.css';

const TranslationTest = () => {
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('fr');
  const [sourceText, setSourceText] = useState('');
  const [translationResult, setTranslationResult] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [status, setStatus] = useState('');

  // Text-to-Speech
  const [speaking, setSpeaking] = useState(false);
  const speechSynthRef = useRef(window.speechSynthesis);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');

  // Batch translation
  const [batchMode, setBatchMode] = useState(false);
  const [batchTexts, setBatchTexts] = useState(['']);
  const [batchResults, setBatchResults] = useState([]);

  // Initialize TTS voices
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

    // Clean up
    return () => {
      if (speechSynthRef.current.speaking) {
        speechSynthRef.current.cancel();
      }
    };
  }, [targetLanguage]);

  // Add new batch text field
  const addBatchTextField = () => {
    setBatchTexts([...batchTexts, '']);
  };

  // Remove batch text field
  const removeBatchTextField = (index) => {
    const newBatchTexts = [...batchTexts];
    newBatchTexts.splice(index, 1);
    setBatchTexts(newBatchTexts);

    // Also remove any associated results
    if (batchResults.length > index) {
      const newBatchResults = [...batchResults];
      newBatchResults.splice(index, 1);
      setBatchResults(newBatchResults);
    }
  };

  // Update batch text at specific index
  const updateBatchText = (index, text) => {
    const newBatchTexts = [...batchTexts];
    newBatchTexts[index] = text;
    setBatchTexts(newBatchTexts);
  };

  // Toggle batch mode
  const toggleBatchMode = () => {
    if (!batchMode) {
      // Switching to batch mode
      setBatchMode(true);
      // Initialize with current text if it exists
      if (sourceText) {
        setBatchTexts([sourceText]);
      }
    } else {
      // Switching to single mode
      setBatchMode(false);
      // Take the first batch text if it exists
      if (batchTexts.length > 0 && batchTexts[0]) {
        setSourceText(batchTexts[0]);
      }
    }

    // Clear previous results
    setTranslationResult(null);
    setBatchResults([]);
  };

  // Handle translation (single or batch)
  const handleTranslate = async () => {
    if (batchMode) {
      // Batch translation
      handleBatchTranslate();
    } else {
      // Single translation
      handleSingleTranslate();
    }
  };

  // Handle single translation
  const handleSingleTranslate = async () => {
    if (!sourceText.trim()) {
      setStatus('Please enter text to translate');
      return;
    }

    setIsTranslating(true);
    setStatus('Translating...');

    try {
      console.log('Attempting to translate:', sourceText);
      console.log('From language:', sourceLanguage);
      console.log('To language:', targetLanguage);

      const result = await translateText(sourceText, targetLanguage, sourceLanguage);
      console.log('Translation result:', result);

      setTranslationResult(result);

      // Set status based on confidence and fallback
      if (result.fallback) {
        setStatus(`Translation completed using fallback system. Original error: ${result.error}`);
      } else {
        const confidenceMsg =
          result.confidence === CONFIDENCE_LEVELS.HIGH
            ? 'high confidence'
            : result.confidence === CONFIDENCE_LEVELS.MEDIUM
              ? 'medium confidence'
              : 'low confidence';

        setStatus(`Translation completed with ${confidenceMsg}`);
      }
    } catch (error) {
      console.error('Translation failed:', error);
      setStatus('Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  // Handle batch translation
  const handleBatchTranslate = async () => {
    // Filter out empty texts
    const textsToTranslate = batchTexts.filter(text => text.trim());

    if (textsToTranslate.length === 0) {
      setStatus('Please enter at least one text to translate');
      return;
    }

    setIsTranslating(true);
    setStatus(`Batch translating ${textsToTranslate.length} texts...`);
    setBatchResults([]);

    try {
      const results = await translateBatch(textsToTranslate, targetLanguage, sourceLanguage);

      // Map results back to original indices
      const fullResults = batchTexts.map((text, index) => {
        if (!text.trim()) return null;

        const resultIndex = textsToTranslate.indexOf(text);
        return resultIndex >= 0 ? results[resultIndex] : null;
      });

      setBatchResults(fullResults);

      const successCount = results.filter(r => !r.fallback).length;
      const fallbackCount = results.filter(r => r.fallback).length;

      if (fallbackCount > 0) {
        setStatus(`Batch translation completed: ${successCount} succeeded, ${fallbackCount} used fallback`);
      } else {
        setStatus(`Batch translation completed successfully for ${results.length} texts`);
      }
    } catch (error) {
      console.error('Batch translation failed:', error);
      setStatus('Batch translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setSourceText('');
    setTranslationResult(null);
    setBatchTexts(['']);
    setBatchResults([]);
    setStatus('');

    // Stop any ongoing speech
    if (speechSynthRef.current.speaking) {
      speechSynthRef.current.cancel();
      setSpeaking(false);
    }
  };

  // Text-to-speech
  const speakTranslation = (text) => {
    if (!text || speaking) return;

    // Cancel any ongoing speech
    if (speechSynthRef.current.speaking) {
      speechSynthRef.current.cancel();
    }

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);

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
      setStatus('Speech synthesis failed. Try another browser or language.');
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

  return (
    <div className="translation-test">
      <h1>Translation Tester</h1>
      <p className="description">Test the translation service with various features</p>

      <div className="mode-toggle">
        <button
          className={`mode-btn ${!batchMode ? 'active' : ''}`}
          onClick={() => toggleBatchMode()}
        >
          Single Translation
        </button>
        <button
          className={`mode-btn ${batchMode ? 'active' : ''}`}
          onClick={() => toggleBatchMode()}
        >
          Batch Translation
        </button>
      </div>

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
                  .filter(voice => voice.lang.startsWith(targetLanguage) ||
                           voice.lang.startsWith(targetLanguage.split('-')[0]))
                  .map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name}
                    </option>
                  ))}
              </>
            )}
          </select>
        </div>
      </div>

      {status && (
        <div className={`status-message ${status.includes('fail') ? 'error' : status.includes('fallback') ? 'warning' : 'success'}`}>
          {status}
        </div>
      )}

      {!batchMode ? (
        /* Single translation mode */
        <div className="translation-container">
          <div className="input-panel">
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder={`Enter text in ${LANGUAGES[sourceLanguage]?.name} to translate`}
              disabled={isTranslating}
            />
          </div>

          <div className="output-panel">
            {translationResult ? (
              <div className="translation-result">
                <div className={`confidence-indicator ${getConfidenceClass(translationResult.confidence)}`}>
                  {translationResult.confidence === CONFIDENCE_LEVELS.HIGH ? 'High Confidence' :
                   translationResult.confidence === CONFIDENCE_LEVELS.MEDIUM ? 'Medium Confidence' :
                   'Low Confidence'}
                </div>

                {translationResult.fallback && (
                  <div className="fallback-indicator">
                    Fallback translation (original request failed)
                  </div>
                )}

                <div className="translation-text">
                  {translationResult.text}
                </div>

                {selectedVoice && (
                  <button
                    className={`speak-btn ${speaking ? 'speaking' : ''}`}
                    onClick={speaking ? cancelSpeech : () => speakTranslation(translationResult.text)}
                  >
                    {speaking ? 'Stop Speaking' : 'Speak Translation'}
                  </button>
                )}
              </div>
            ) : (
              <div className="empty-result">
                Translation will appear here
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Batch translation mode */
        <div className="batch-container">
          {batchTexts.map((text, index) => (
            <div className="batch-item" key={index}>
              <div className="batch-input">
                <textarea
                  value={text}
                  onChange={(e) => updateBatchText(index, e.target.value)}
                  placeholder={`Enter text #${index + 1} in ${LANGUAGES[sourceLanguage]?.name}`}
                  disabled={isTranslating}
                />
                <button
                  className="remove-batch-btn"
                  onClick={() => removeBatchTextField(index)}
                  disabled={batchTexts.length <= 1}
                >
                  ✕
                </button>
              </div>

              {batchResults[index] && (
                <div className="batch-result">
                  <div className={`confidence-indicator ${getConfidenceClass(batchResults[index].confidence)}`}>
                    {batchResults[index].confidence === CONFIDENCE_LEVELS.HIGH ? 'High Confidence' :
                     batchResults[index].confidence === CONFIDENCE_LEVELS.MEDIUM ? 'Medium Confidence' :
                     'Low Confidence'}
                  </div>

                  {batchResults[index].fallback && (
                    <div className="fallback-indicator">
                      Fallback translation
                    </div>
                  )}

                  <div className="translation-text">
                    {batchResults[index].text}
                  </div>

                  {selectedVoice && (
                    <button
                      className="speak-btn"
                      onClick={() => speakTranslation(batchResults[index].text)}
                    >
                      Speak
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          <div className="batch-controls">
            <button
              className="add-batch-btn"
              onClick={addBatchTextField}
              disabled={isTranslating}
            >
              + Add Text
            </button>
          </div>
        </div>
      )}

      <div className="action-buttons">
        <button
          className="translate-btn"
          onClick={handleTranslate}
          disabled={isTranslating || (batchMode ? batchTexts.every(t => !t.trim()) : !sourceText.trim())}
        >
          {isTranslating ? 'Translating...' : batchMode ? 'Translate All' : 'Translate'}
        </button>

        <button
          className="reset-btn"
          onClick={handleReset}
          disabled={isTranslating}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default TranslationTest;
