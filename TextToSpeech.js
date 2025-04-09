/**
 * TextToSpeech.js
 *
 * This file provides text-to-speech functionality for translated text.
 * It supports both browser-based speech synthesis and cloud-based TTS APIs.
 */

// Get feature flag from environment
const ENABLE_TEXT_TO_SPEECH = process.env.REACT_APP_ENABLE_TEXT_TO_SPEECH !== 'false';

// Voice mapping for different languages
const voiceMapping = {
  'en': { voiceName: 'Daniel', backupName: /en[-_]GB/i },
  'fr': { voiceName: 'Thomas', backupName: /fr[-_]FR/i },
  'es': { voiceName: 'Monica', backupName: /es[-_]ES/i },
  'de': { voiceName: 'Anna', backupName: /de[-_]DE/i },
  'it': { voiceName: 'Alice', backupName: /it[-_]IT/i },
  'ru': { voiceName: 'Milena', backupName: /ru[-_]RU/i },
  'zh': { voiceName: 'Tingting', backupName: /zh[-_]CN/i },
  'ja': { voiceName: 'Kyoko', backupName: /ja[-_]JP/i }
};

// Speech synthesis instance
let speechSynthesis = null;
let availableVoices = [];
let voiceMap = {};

/**
 * Initialize text-to-speech engine and load available voices
 */
export function initTextToSpeech() {
  if (!ENABLE_TEXT_TO_SPEECH) {
    console.log('Text-to-speech is disabled');
    return false;
  }

  if (!window.speechSynthesis) {
    console.warn('Speech synthesis not supported in this browser');
    return false;
  }

  speechSynthesis = window.speechSynthesis;

  // Load available voices
  updateVoices();

  // Chrome needs a special event to get all voices
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = updateVoices;
  }

  return true;
}

/**
 * Update the available voices list
 */
function updateVoices() {
  if (!speechSynthesis) return;

  availableVoices = speechSynthesis.getVoices();

  // Create a map of voices by language for quick lookup
  voiceMap = {};

  availableVoices.forEach(voice => {
    const langCode = voice.lang.split('-')[0];
    if (!voiceMap[langCode]) {
      voiceMap[langCode] = [];
    }
    voiceMap[langCode].push(voice);
  });

  console.log(`Loaded ${availableVoices.length} voices for speech synthesis`);
}

/**
 * Get the best voice for a language
 * @param {string} languageCode - Language code (e.g., 'en', 'fr')
 * @returns {SpeechSynthesisVoice|null} - Best voice or null if none found
 */
export function getBestVoiceForLanguage(languageCode) {
  if (!speechSynthesis || availableVoices.length === 0) {
    return null;
  }

  // Get preferred voice name for this language
  const preferredVoice = voiceMapping[languageCode];

  // First try to find the exact preferred voice by name
  if (preferredVoice && preferredVoice.voiceName) {
    const exactMatch = availableVoices.find(voice =>
      voice.name === preferredVoice.voiceName
    );

    if (exactMatch) {
      return exactMatch;
    }
  }

  // Then try to find a voice by language pattern
  if (preferredVoice && preferredVoice.backupName) {
    const patternMatch = availableVoices.find(voice =>
      preferredVoice.backupName.test(voice.lang)
    );

    if (patternMatch) {
      return patternMatch;
    }
  }

  // Fall back to any voice for this language
  if (voiceMap[languageCode] && voiceMap[languageCode].length > 0) {
    return voiceMap[languageCode][0];
  }

  // Last resort: find any voice that starts with this language code
  const fallbackVoice = availableVoices.find(voice =>
    voice.lang.startsWith(`${languageCode}-`) ||
    voice.lang.startsWith(`${languageCode}_`)
  );

  return fallbackVoice || null;
}

/**
 * Get all available voices for a language
 * @param {string} languageCode - Language code
 * @returns {Array<SpeechSynthesisVoice>} - Available voices
 */
export function getVoicesForLanguage(languageCode) {
  if (!speechSynthesis || availableVoices.length === 0) {
    return [];
  }

  // Get all voices that match this language
  return availableVoices.filter(voice =>
    voice.lang.startsWith(`${languageCode}-`) ||
    voice.lang.startsWith(`${languageCode}_`)
  );
}

/**
 * Get all available voices
 * @returns {Array<SpeechSynthesisVoice>} - All available voices
 */
export function getAllVoices() {
  return availableVoices;
}

/**
 * Speak text using speech synthesis
 * @param {string} text - Text to speak
 * @param {string} languageCode - Language code
 * @param {Object} options - Additional options
 * @returns {Promise<void>} - Promise that resolves when speaking is done or rejects on error
 */
export function speakText(text, languageCode, options = {}) {
  return new Promise((resolve, reject) => {
    if (!ENABLE_TEXT_TO_SPEECH) {
      reject(new Error('Text-to-speech is disabled'));
      return;
    }

    if (!speechSynthesis) {
      reject(new Error('Speech synthesis not available'));
      return;
    }

    if (!text || !text.trim()) {
      reject(new Error('No text to speak'));
      return;
    }

    // Cancel any ongoing speech
    stopSpeaking();

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);

    // Set language
    utterance.lang = languageCode;

    // Set voice if specified or try to find the best one
    if (options.voiceName) {
      const selectedVoice = availableVoices.find(voice => voice.name === options.voiceName);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    } else {
      const bestVoice = getBestVoiceForLanguage(languageCode);
      if (bestVoice) {
        utterance.voice = bestVoice;
      }
    }

    // Set other options
    if (options.rate !== undefined) {
      utterance.rate = Math.max(0.1, Math.min(options.rate, 10));
    }

    if (options.pitch !== undefined) {
      utterance.pitch = Math.max(0, Math.min(options.pitch, 2));
    }

    if (options.volume !== undefined) {
      utterance.volume = Math.max(0, Math.min(options.volume, 1));
    }

    // Set event handlers
    utterance.onend = () => {
      resolve();
    };

    utterance.onerror = (event) => {
      reject(new Error(`Speech synthesis error: ${event.error}`));
    };

    // Start speaking
    speechSynthesis.speak(utterance);
  });
}

/**
 * Stop any ongoing speech
 */
export function stopSpeaking() {
  if (speechSynthesis) {
    speechSynthesis.cancel();
  }
}

/**
 * Check if speech synthesis is currently speaking
 * @returns {boolean} - True if speaking
 */
export function isSpeaking() {
  return speechSynthesis ? speechSynthesis.speaking : false;
}

/**
 * Check if text-to-speech is available in this browser
 * @returns {boolean} - True if available
 */
export function isTextToSpeechAvailable() {
  return ENABLE_TEXT_TO_SPEECH && !!window.speechSynthesis;
}
