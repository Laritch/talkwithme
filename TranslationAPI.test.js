/**
 * TranslationAPI.test.js
 *
 * Unit tests for the TranslationAPI module
 */

import { translateWithAPI } from '../TranslationAPI';
import { simulateTranslation, fallbackTranslation, CONFIDENCE_LEVELS } from '../FixedTranslation';
import { getCachedTranslation, cacheTranslation } from '../TranslationCache';

// Mock the simulateTranslation and fallbackTranslation functions
jest.mock('../FixedTranslation', () => ({
  simulateTranslation: jest.fn(),
  fallbackTranslation: jest.fn(),
  CONFIDENCE_LEVELS: {
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
  }
}));

// Mock the cache functions
jest.mock('../TranslationCache', () => ({
  getCachedTranslation: jest.fn(),
  cacheTranslation: jest.fn()
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('TranslationAPI', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Reset process.env
    process.env.REACT_APP_GOOGLE_TRANSLATE_API_KEY = '';
    process.env.REACT_APP_MICROSOFT_TRANSLATOR_KEY = '';
    process.env.REACT_APP_LIBRE_TRANSLATE_URL = 'https://libretranslate.com/translate';
    process.env.REACT_APP_ENABLE_TRANSLATION_APIS = 'true';
  });

  describe('translateWithAPI', () => {
    test('should skip translation for empty text', async () => {
      const result = await translateWithAPI('', 'fr', 'en');

      expect(result).toEqual({
        text: '',
        confidence: CONFIDENCE_LEVELS.HIGH,
        fallback: false,
        apiUsed: 'none'
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should skip translation when source and target languages are the same', async () => {
      const result = await translateWithAPI('Hello', 'en', 'en');

      expect(result).toEqual({
        text: 'Hello',
        confidence: CONFIDENCE_LEVELS.HIGH,
        fallback: false,
        apiUsed: 'none'
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should use cache if available', async () => {
      const cachedResult = {
        text: 'Bonjour',
        confidence: CONFIDENCE_LEVELS.HIGH
      };
      getCachedTranslation.mockReturnValueOnce(cachedResult);

      const result = await translateWithAPI('Hello', 'fr', 'en');

      expect(result).toEqual({
        ...cachedResult,
        fromCache: true
      });
      expect(getCachedTranslation).toHaveBeenCalledWith('Hello', 'fr', 'en');
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should use simulateTranslation when real APIs are disabled', async () => {
      process.env.REACT_APP_ENABLE_TRANSLATION_APIS = 'false';

      const mockResult = { result: 'Bonjour', confidence: CONFIDENCE_LEVELS.HIGH };
      simulateTranslation.mockReturnValueOnce(mockResult);

      const result = await translateWithAPI('Hello', 'fr', 'en');

      expect(result).toEqual({
        text: 'Bonjour',
        confidence: CONFIDENCE_LEVELS.HIGH,
        fallback: false,
        apiUsed: 'simulation'
      });
      expect(simulateTranslation).toHaveBeenCalledWith('Hello', 'fr', 'en', expect.any(Object));
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should use Google Translate API as primary when available', async () => {
      process.env.REACT_APP_GOOGLE_TRANSLATE_API_KEY = 'dummy-key';

      // Mock successful Google API response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            translations: [{ translatedText: 'Bonjour' }]
          }
        })
      });

      const result = await translateWithAPI('Hello', 'fr', 'en');

      expect(result).toEqual({
        text: 'Bonjour',
        confidence: CONFIDENCE_LEVELS.HIGH,
        fallback: false,
        apiUsed: 'google'
      });
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('googleapis.com'), expect.any(Object));
      expect(cacheTranslation).toHaveBeenCalled();
    });

    test('should fallback to Microsoft Translator when Google API fails', async () => {
      process.env.REACT_APP_GOOGLE_TRANSLATE_API_KEY = 'dummy-key';
      process.env.REACT_APP_MICROSOFT_TRANSLATOR_KEY = 'dummy-ms-key';

      // Mock failed Google API response
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      });

      // Mock successful Microsoft API response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          { translations: [{ text: 'Bonjour' }] }
        ])
      });

      const result = await translateWithAPI('Hello', 'fr', 'en');

      expect(result).toEqual({
        text: 'Bonjour',
        confidence: CONFIDENCE_LEVELS.HIGH,
        fallback: true,
        apiUsed: 'microsoft',
        error: 'Google API failed'
      });
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(cacheTranslation).toHaveBeenCalled();
    });

    test('should fallback to LibreTranslate when commercial APIs fail', async () => {
      process.env.REACT_APP_GOOGLE_TRANSLATE_API_KEY = 'dummy-key';
      process.env.REACT_APP_MICROSOFT_TRANSLATOR_KEY = 'dummy-ms-key';

      // Mock failed Google API response
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      });

      // Mock failed Microsoft API response
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      // Mock successful LibreTranslate API response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          translatedText: 'Bonjour'
        })
      });

      const result = await translateWithAPI('Hello', 'fr', 'en');

      expect(result).toEqual({
        text: 'Bonjour',
        confidence: CONFIDENCE_LEVELS.MEDIUM,
        fallback: true,
        apiUsed: 'libre',
        error: 'Commercial APIs failed'
      });
      expect(fetch).toHaveBeenCalledTimes(3);
      expect(cacheTranslation).toHaveBeenCalled();
    });

    test('should use local dictionary when all APIs fail', async () => {
      process.env.REACT_APP_GOOGLE_TRANSLATE_API_KEY = 'dummy-key';

      // Mock failed Google API response
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      });

      // Mock failed LibreTranslate API response
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server Error'
      });

      // Mock successful simulation
      const mockResult = { result: 'Bonjour', confidence: CONFIDENCE_LEVELS.MEDIUM };
      simulateTranslation.mockReturnValueOnce(mockResult);

      const result = await translateWithAPI('Hello', 'fr', 'en');

      expect(result).toEqual({
        text: 'Bonjour',
        confidence: CONFIDENCE_LEVELS.MEDIUM,
        fallback: true,
        apiUsed: 'local',
        error: 'All APIs failed'
      });
      expect(simulateTranslation).toHaveBeenCalled();
      expect(cacheTranslation).toHaveBeenCalled();
    });

    test('should use emergency fallback for catastrophic failures', async () => {
      // Make simulateTranslation throw an error
      simulateTranslation.mockImplementation(() => {
        throw new Error('Catastrophic failure');
      });

      // Make fallbackTranslation return something
      fallbackTranslation.mockReturnValueOnce('Bonjour - Hello');

      const result = await translateWithAPI('Hello', 'fr', 'en');

      expect(result).toEqual({
        text: 'Bonjour - Hello',
        confidence: CONFIDENCE_LEVELS.LOW,
        fallback: true,
        apiUsed: 'emergency',
        error: 'Catastrophic failure'
      });
      expect(fallbackTranslation).toHaveBeenCalled();
    });
  });
});
