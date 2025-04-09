/**
 * TranslationService.test.js
 *
 * Unit tests for the TranslationService module
 */

import { translateText, LANGUAGES, CONFIDENCE_LEVELS, addToTranslationMemory, getOfflineMode, setOfflineMode } from '../TranslationService';
import { translateWithAPI } from '../TranslationAPI';
import { getCachedTranslation, cacheTranslation, clearTranslationCache } from '../TranslationCache';

// Mock the API module
jest.mock('../TranslationAPI', () => ({
  translateWithAPI: jest.fn()
}));

// Mock the cache module
jest.mock('../TranslationCache', () => ({
  getCachedTranslation: jest.fn(),
  cacheTranslation: jest.fn(),
  clearTranslationCache: jest.fn(),
  getCacheStats: jest.fn(() => ({ size: 5, maxSize: 200 }))
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key]),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

describe('TranslationService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    localStorageMock.clear();
    setOfflineMode(false);
  });

  describe('translateText', () => {
    test('should skip translation for empty text', async () => {
      const result = await translateText('', 'fr', 'en');
      expect(result).toEqual({
        text: '',
        confidence: CONFIDENCE_LEVELS.HIGH,
        fallback: false,
        apiUsed: 'none'
      });
      expect(translateWithAPI).not.toHaveBeenCalled();
    });

    test('should skip translation when source and target languages are the same', async () => {
      const result = await translateText('Hello', 'en', 'en');
      expect(result).toEqual({
        text: 'Hello',
        confidence: CONFIDENCE_LEVELS.HIGH,
        fallback: false,
        apiUsed: 'none'
      });
      expect(translateWithAPI).not.toHaveBeenCalled();
    });

    test('should return cached translation if available', async () => {
      const cachedResult = {
        text: 'Bonjour',
        confidence: CONFIDENCE_LEVELS.HIGH,
        fromCache: true
      };
      getCachedTranslation.mockReturnValueOnce(cachedResult);

      const result = await translateText('Hello', 'fr', 'en');
      expect(result).toEqual(cachedResult);
      expect(getCachedTranslation).toHaveBeenCalledWith('Hello', 'fr', 'en');
      expect(translateWithAPI).not.toHaveBeenCalled();
    });

    test('should use translateWithAPI for normal translation', async () => {
      const apiResult = {
        text: 'Bonjour',
        confidence: CONFIDENCE_LEVELS.HIGH,
        apiUsed: 'google'
      };
      translateWithAPI.mockResolvedValueOnce(apiResult);

      const result = await translateText('Hello', 'fr', 'en');
      expect(result).toEqual(apiResult);
      expect(translateWithAPI).toHaveBeenCalledWith('Hello', 'fr', 'en', expect.any(Object));
    });

    test('should add high confidence translations to memory', async () => {
      const apiResult = {
        text: 'Bonjour',
        confidence: CONFIDENCE_LEVELS.HIGH,
        apiUsed: 'google',
        fallback: false
      };
      translateWithAPI.mockResolvedValueOnce(apiResult);

      await translateText('Hello', 'fr', 'en');

      // Check that localStorage was called with the correct values
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    test('should handle API failure and use fallback', async () => {
      translateWithAPI.mockRejectedValueOnce(new Error('API failure'));

      const result = await translateText('Hello', 'fr', 'en');

      expect(result).toEqual(expect.objectContaining({
        fallback: true,
        confidence: CONFIDENCE_LEVELS.LOW,
        apiUsed: 'emergency'
      }));
    });
  });

  describe('offline mode', () => {
    test('should enable offline mode when navigator is offline', () => {
      // Set navigator.onLine to false
      Object.defineProperty(navigator, 'onLine', { value: false });

      expect(getOfflineMode()).toBe(true);

      // Reset navigator.onLine
      Object.defineProperty(navigator, 'onLine', { value: true });
    });

    test('should save offline mode preference to localStorage', () => {
      setOfflineMode(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('translation_offline_mode', 'true');

      setOfflineMode(false);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('translation_offline_mode', 'false');
    });

    test('should load offline mode preference from localStorage', () => {
      localStorageMock.getItem.mockReturnValueOnce('true');
      expect(getOfflineMode()).toBe(true);

      localStorageMock.getItem.mockReturnValueOnce('false');
      expect(getOfflineMode()).toBe(false);
    });
  });

  describe('addToTranslationMemory', () => {
    test('should add translations to memory and localStorage', () => {
      addToTranslationMemory('Hello', 'Bonjour', 'en', 'fr');

      expect(localStorageMock.setItem).toHaveBeenCalled();
      expect(cacheTranslation).toHaveBeenCalledWith('Hello', 'fr', 'en', expect.any(Object));
    });
  });

  describe('supported languages', () => {
    test('should export supported languages', () => {
      expect(LANGUAGES).toBeDefined();
      expect(LANGUAGES.en).toBeDefined();
      expect(LANGUAGES.fr).toBeDefined();
      expect(LANGUAGES.es).toBeDefined();
      expect(LANGUAGES.de).toBeDefined();
    });
  });
});
