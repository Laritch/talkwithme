import React, { useState, useEffect, useRef } from 'react';
import './SpeechToTextInput.css';

/**
 * SpeechToTextInput Component
 *
 * A component that allows users to input text via voice using the Web Speech API.
 * It provides real-time transcription and supports multiple languages.
 */
const SpeechToTextInput = ({
  onTranscriptionComplete,
  language = 'en-US',
  placeholder = 'Speak to input text...',
  buttonText = 'Start Speaking',
  className = '',
  disabled = false
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // References for speech recognition
  const recognitionRef = useRef(null);

  // Check if browser supports Speech Recognition API
  useEffect(() => {
    // Check for browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false);
      setError('Speech recognition is not supported in this browser. Try Chrome, Edge, or Safari.');
      return;
    }

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    // Set language
    recognitionRef.current.lang = language;

    // Set up event handlers
    recognitionRef.current.onstart = () => {
      setIsListening(true);
      setError('');
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      if (interimTranscript) {
        setTranscript(prev => prev + ' ' + interimTranscript.trim());
        setInterimTranscript('');
      }
    };

    recognitionRef.current.onerror = (event) => {
      setIsListening(false);

      switch (event.error) {
        case 'not-allowed':
          setPermissionGranted(false);
          setError('Microphone permission denied. Please allow microphone access.');
          break;
        case 'no-speech':
          setError('No speech was detected. Please try again.');
          break;
        case 'audio-capture':
          setError('No microphone was found. Please check your microphone connection.');
          break;
        case 'network':
          setError('Network error occurred. Please check your internet connection.');
          break;
        default:
          setError(`Error: ${event.error}`);
      }
    };

    recognitionRef.current.onresult = (event) => {
      let finalTranscript = '';
      let currentInterimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          currentInterimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(prev => {
          const newTranscript = prev ? `${prev} ${finalTranscript}` : finalTranscript;
          return newTranscript;
        });
      }

      setInterimTranscript(currentInterimTranscript);
    };

    // Check for microphone permission
    navigator.permissions.query({ name: 'microphone' })
      .then((permissionStatus) => {
        setPermissionGranted(permissionStatus.state === 'granted');

        permissionStatus.onchange = () => {
          setPermissionGranted(permissionStatus.state === 'granted');
        };
      })
      .catch(() => {
        // Permissions API not supported, assume permission will be asked when needed
        setPermissionGranted(true);
      });

    return () => {
      // Clean up
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language]);

  // Update language when prop changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  // Toggle listening state
  const toggleListening = () => {
    if (!isSupported || disabled) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      setInterimTranscript('');
      recognitionRef.current.start();
    }
  };

  // Handle completion and send transcript to parent
  const handleComplete = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }

    if (transcript.trim() || interimTranscript.trim()) {
      const finalTranscript = (transcript + ' ' + interimTranscript).trim();
      onTranscriptionComplete(finalTranscript);
    }
  };

  // Clear transcript
  const clearTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
  };

  return (
    <div className={`speech-to-text-input ${className}`}>
      {!isSupported ? (
        <div className="speech-error">
          <p>Speech recognition is not supported in this browser.</p>
          <p>Please try Chrome, Edge, or Safari.</p>
        </div>
      ) : (
        <>
          <div className="speech-controls">
            <button
              type="button"
              className={`speech-toggle-btn ${isListening ? 'listening' : ''}`}
              onClick={toggleListening}
              disabled={disabled || !permissionGranted}
              aria-label={isListening ? 'Stop listening' : 'Start listening'}
              title={isListening ? 'Stop listening' : 'Start listening'}
            >
              <span className="mic-icon">
                {isListening ? '🔴' : '🎤'}
              </span>
              {isListening ? 'Stop' : buttonText}
            </button>

            {transcript && (
              <>
                <button
                  type="button"
                  className="speech-clear-btn"
                  onClick={clearTranscript}
                  disabled={disabled || isListening}
                  aria-label="Clear transcript"
                  title="Clear transcript"
                >
                  Clear
                </button>

                <button
                  type="button"
                  className="speech-complete-btn"
                  onClick={handleComplete}
                  disabled={disabled}
                  aria-label="Use this transcript"
                  title="Use this transcript"
                >
                  Use This Text
                </button>
              </>
            )}
          </div>

          <div className="transcript-display">
            {transcript && (
              <div className="final-transcript">
                {transcript}
              </div>
            )}

            {interimTranscript && (
              <div className="interim-transcript">
                {interimTranscript}
              </div>
            )}

            {!transcript && !interimTranscript && !isListening && (
              <div className="transcript-placeholder">
                {placeholder}
              </div>
            )}

            {isListening && !transcript && !interimTranscript && (
              <div className="listening-indicator">
                Listening...
              </div>
            )}
          </div>

          {error && (
            <div className="speech-error">
              {error}
            </div>
          )}

          {!permissionGranted && (
            <div className="permission-notice">
              <p>Microphone permission is required for speech recognition.</p>
              <p>Please allow microphone access when prompted.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SpeechToTextInput;
