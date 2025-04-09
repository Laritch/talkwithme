import React, { useState, useEffect } from 'react';
import errorHandler from './errorHandler';

/**
 * Minimal Translation Component with Error Diagnostics
 *
 * A simple, self-contained component that demonstrates basic translation
 * with error handling and diagnostics.
 */
const SimpleTrans = () => {
  const [sourceText, setSourceText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('fr');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState('');
  const [diagnostics, setDiagnostics] = useState({
    networkStatus: 'Checking...',
    errorLogs: [],
    endpointTests: null,
    lastAttempt: null
  });
  const [showDiagnostics, setShowDiagnostics] = useState(true);

  // Check network status on load
  useEffect(() => {
    checkNetworkStatus();
  }, []);

  // Simple translation function
  const translate = async () => {
    if (!sourceText.trim()) {
      setError('Please enter text to translate');
      return;
    }

    setIsTranslating(true);
    setError('');
    setDiagnostics(prev => ({
      ...prev,
      lastAttempt: new Date().toISOString()
    }));

    try {
      // This is a mock translation function that doesn't require external APIs
      const result = simulateTranslation(sourceText, targetLanguage);

      // Add a small delay to simulate processing
      setTimeout(() => {
        setTranslatedText(result);
        setIsTranslating(false);
      }, 500);
    } catch (err) {
      const apiError = new errorHandler.ApiError(
        502,
        'Translation failed: ' + err.message,
        err
      );

      errorHandler.logError(apiError, {
        component: 'SimpleTrans',
        action: 'translate',
        sourceText,
        targetLanguage
      });

      setError('Translation failed: ' + err.message);
      setIsTranslating(false);

      // Update error logs in diagnostics
      setDiagnostics(prev => ({
        ...prev,
        errorLogs: errorHandler.getErrorLogs()
      }));
    }
  };

  // Mock translation function
  const simulateTranslation = (text, targetLang) => {
    // Force an error randomly to test error handling
    if (Math.random() < 0.2) {
      throw new Error('502 Bad Gateway');
    }

    // Basic translations dictionary
    const translations = {
      'fr': {
        'Hello': 'Bonjour',
        'World': 'Monde',
        'Welcome': 'Bienvenue',
        'How are you?': 'Comment allez-vous?',
        'Goodbye': 'Au revoir',
        'Thank you': 'Merci',
      },
      'es': {
        'Hello': 'Hola',
        'World': 'Mundo',
        'Welcome': 'Bienvenido',
        'How are you?': 'Cómo estás?',
        'Goodbye': 'Adiós',
        'Thank you': 'Gracias',
      },
      'de': {
        'Hello': 'Hallo',
        'World': 'Welt',
        'Welcome': 'Willkommen',
        'How are you?': 'Wie geht es dir?',
        'Goodbye': 'Auf Wiedersehen',
        'Thank you': 'Danke',
      }
    };

    // Look for exact matches first
    if (translations[targetLang] && translations[targetLang][text]) {
      return translations[targetLang][text];
    }

    // If no exact match, return formatted string
    return `[${targetLang}] ${text}`;
  };

  // Check network connectivity
  const checkNetworkStatus = async () => {
    try {
      const isConnected = await errorHandler.checkNetworkConnectivity();
      setDiagnostics(prev => ({
        ...prev,
        networkStatus: isConnected ? 'Connected' : 'Disconnected'
      }));
    } catch (error) {
      setDiagnostics(prev => ({
        ...prev,
        networkStatus: 'Error checking connection'
      }));
    }
  };

  // Test endpoints
  const testEndpoints = async () => {
    try {
      setDiagnostics(prev => ({
        ...prev,
        endpointTests: 'Testing...'
      }));

      const tests = [
        { name: 'Static Resource', url: '/favicon.ico', method: 'HEAD' },
        { name: 'Main Page', url: '/', method: 'GET' },
        { name: 'Mock Translation API', url: '/api/translate', method: 'OPTIONS' }
      ];

      const results = await Promise.all(tests.map(async test => {
        try {
          const start = Date.now();
          const response = await fetch(test.url, {
            method: test.method,
            cache: 'no-cache'
          });
          const time = Date.now() - start;

          return {
            name: test.name,
            status: response.status,
            ok: response.ok,
            time: `${time}ms`
          };
        } catch (error) {
          return {
            name: test.name,
            status: 'Error',
            ok: false,
            error: error.message
          };
        }
      }));

      setDiagnostics(prev => ({
        ...prev,
        endpointTests: results
      }));

      console.table(results);
    } catch (error) {
      setDiagnostics(prev => ({
        ...prev,
        endpointTests: `Error: ${error.message}`
      }));
    }
  };

  // Restart application
  const restartApp = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();

      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            caches.delete(cacheName);
          });
        });
      }

      setTimeout(() => {
        window.location.reload(true);
      }, 1000);
    } catch (error) {
      setError('Error restarting app: ' + error.message);
    }
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '20px auto',
      padding: '0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Diagnostic Panel */}
      <div style={{
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        padding: '15px 20px',
        marginBottom: '20px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
        border: '1px solid #eee'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#333' }}>
            System Diagnostics
            <button
              style={{
                background: 'none',
                border: 'none',
                fontSize: '16px',
                cursor: 'pointer',
                color: '#666',
                marginLeft: '10px'
              }}
              onClick={() => setShowDiagnostics(!showDiagnostics)}
            >
              {showDiagnostics ? '▼' : '▲'}
            </button>
          </h3>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                marginRight: '8px',
                backgroundColor: diagnostics.networkStatus === 'Connected' ? '#38a169' : '#e53e3e'
              }}
            ></span>
            <span>Network: {diagnostics.networkStatus}</span>
          </div>
        </div>

        {showDiagnostics && (
          <div style={{ marginTop: '15px' }}>
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{
                margin: '0 0 10px 0',
                fontSize: '14px',
                color: '#444',
                borderBottom: '1px solid #eee',
                paddingBottom: '5px'
              }}>
                Error Logs ({diagnostics.errorLogs.length})
              </h4>
              {diagnostics.errorLogs.length === 0 ? (
                <p style={{ fontSize: '14px', color: '#666' }}>No errors logged</p>
              ) : (
                <div style={{
                  maxHeight: '150px',
                  overflowY: 'auto',
                  border: '1px solid #eee',
                  borderRadius: '4px'
                }}>
                  {diagnostics.errorLogs.slice(0, 3).map((log, index) => (
                    <div key={index} style={{
                      padding: '10px',
                      borderBottom: index < 2 ? '1px solid #eee' : 'none'
                    }}>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {log.timestamp}
                      </div>
                      <div style={{
                        fontWeight: '500',
                        marginTop: '4px',
                        color: '#e53e3e'
                      }}>
                        {log.message}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '15px' }}>
              <h4 style={{
                margin: '0 0 10px 0',
                fontSize: '14px',
                color: '#444',
                borderBottom: '1px solid #eee',
                paddingBottom: '5px'
              }}>
                Endpoint Tests
              </h4>
              {!diagnostics.endpointTests ? (
                <button
                  onClick={testEndpoints}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#edf2f7',
                    color: '#4a5568',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Test Endpoints
                </button>
              ) : diagnostics.endpointTests === 'Testing...' ? (
                <p>Testing endpoints...</p>
              ) : Array.isArray(diagnostics.endpointTests) ? (
                <div style={{ fontSize: '14px' }}>
                  {diagnostics.endpointTests.map((test, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '5px 0',
                      borderBottom: index < diagnostics.endpointTests.length - 1 ? '1px solid #eee' : 'none'
                    }}>
                      <span>{test.name}</span>
                      <span style={{
                        color: test.ok ? '#38a169' : '#e53e3e',
                        fontWeight: '500'
                      }}>
                        {test.ok ? `OK (${test.time})` : `Failed: ${test.status}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#e53e3e' }}>{diagnostics.endpointTests}</p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={checkNetworkStatus}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#edf2f7',
                  color: '#4a5568',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Check Network
              </button>
              <button
                onClick={testEndpoints}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#edf2f7',
                  color: '#4a5568',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Test Endpoints
              </button>
              <button
                onClick={() => {
                  errorHandler.clearErrorLogs();
                  setDiagnostics(prev => ({ ...prev, errorLogs: [] }));
                }}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#edf2f7',
                  color: '#4a5568',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Clear Logs
              </button>
              <button
                onClick={restartApp}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#4299e1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Restart App
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Translation Interface */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ marginTop: 0, color: '#4a90e2' }}>Simple Translator</h2>

        {error && (
          <div style={{
            padding: '10px',
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            borderRadius: '4px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Source Text
          </label>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Enter text to translate..."
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              minHeight: '100px',
              fontSize: '16px'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Target Language
          </label>
          <select
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '16px'
            }}
          >
            <option value="fr">French (Français)</option>
            <option value="es">Spanish (Español)</option>
            <option value="de">German (Deutsch)</option>
          </select>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={translate}
            disabled={isTranslating || !sourceText.trim()}
            style={{
              backgroundColor: '#4a90e2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '10px 16px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: isTranslating || !sourceText.trim() ? 'not-allowed' : 'pointer',
              opacity: isTranslating || !sourceText.trim() ? 0.7 : 1
            }}
          >
            {isTranslating ? 'Translating...' : 'Translate'}
          </button>
        </div>

        {translatedText && (
          <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f0f5ff', borderRadius: '4px' }}>
            <h3 style={{ marginTop: 0, fontSize: '16px', color: '#4a5568' }}>Translation Result</h3>
            <div style={{ fontSize: '18px', padding: '8px', backgroundColor: 'white', borderRadius: '4px' }}>
              {translatedText}
            </div>
          </div>
        )}

        <div style={{ marginTop: '24px', fontSize: '14px', color: '#718096' }}>
          <p>
            This is a minimal translation demo that uses pre-defined translations for common phrases.
            Try translating "Hello", "Welcome", "How are you?", "Goodbye", or "Thank you".
          </p>
          <p>
            For testing error handling, the component will randomly generate 502 Bad Gateway errors
            about 20% of the time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimpleTrans;
