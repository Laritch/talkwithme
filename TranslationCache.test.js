/**
 * TranslationCache.test.js
 *
 * Unit tests for the TranslationCache module
 */

import { getCachedTranslation, cacheTranslation, clearTranslationCache, getCacheStats } from '../TranslationCache';

// Save and restore the original process.env
const originalEnv = process.env;

describe('TranslationCache', () => {
  beforeEach(() => {
    // Clear the cache before each test
    clearTranslationCache();

    // Mock process.env
    process.env = {
      ...originalEnv,
      REACT_APP_TRANSLATION_CACHE_SIZE: '5'
    };
  });

  afterAll(() => {
    // Restore process.env
    process.env = originalEnv;
  });

  test('should cache and retrieve translations', () => {
    // Cache a translation
    const originalTranslation = {
      text: 'Bonjour',
      confidence: 'high',
      apiUsed: 'google'
    };

    cacheTranslation('Hello', 'fr', 'en', originalTranslation);

    // Retrieve the cached translation
    const cachedTranslation = getCachedTranslation('Hello', 'fr', 'en');

    // Verify
    expect(cachedTranslation).toEqual(originalTranslation);
  });

  test('should return undefined for non-existent cache entries', () => {
    const cachedTranslation = getCachedTranslation('NotInCache', 'fr', 'en');
    expect(cachedTranslation).toBeUndefined();
  });

  test('should clear the cache', () => {
    // Cache a translation
    cacheTranslation('Hello', 'fr', 'en', { text: 'Bonjour' });

    // Verify it's in the cache
    expect(getCachedTranslation('Hello', 'fr', 'en')).toBeDefined();

    // Clear the cache
    clearTranslationCache();

    // Verify it's no longer in the cache
    expect(getCachedTranslation('Hello', 'fr', 'en')).toBeUndefined();
  });

  test('should provide cache statistics', () => {
    // Empty cache
    expect(getCacheStats()).toEqual({
      size: 0,
      maxSize: 5
    });

    // Add some items
    cacheTranslation('Hello', 'fr', 'en', { text: 'Bonjour' });
    cacheTranslation('World', 'fr', 'en', { text: 'Monde' });

    // Check stats
    expect(getCacheStats()).toEqual({
      size: 2,
      maxSize: 5
    });
  });

  test('should respect the cache size limit', () => {
    // Cache max capacity is 5 (see process.env mock)

    // Add 6 items
    cacheTranslation('One', 'fr', 'en', { text: 'Un' });
    cacheTranslation('Two', 'fr', 'en', { text: 'Deux' });
    cacheTranslation('Three', 'fr', 'en', { text: 'Trois' });
    cacheTranslation('Four', 'fr', 'en', { text: 'Quatre' });
    cacheTranslation('Five', 'fr', 'en', { text: 'Cinq' });

    // Access one item to make it recently used
    getCachedTranslation('One', 'fr', 'en');

    // Add a sixth item, should evict the least recently used (probably 'Two')
    cacheTranslation('Six', 'fr', 'en', { text: 'Six' });

    // Verify cache size hasn't exceeded limit
    expect(getCacheStats().size).toBeLessThanOrEqual(5);

    // The most recently accessed item should still be in the cache
    expect(getCachedTranslation('One', 'fr', 'en')).toBeDefined();

    // The new item should be in the cache
    expect(getCachedTranslation('Six', 'fr', 'en')).toBeDefined();
  });

  test('should not cache empty or error results', () => {
    // Try to cache a result with an error
    cacheTranslation('Error', 'fr', 'en', {
      error: 'API failed',
      text: 'Fallback'
    });

    // Try to cache a null result
    cacheTranslation('Null', 'fr', 'en', null);

    // Verify nothing was cached
    expect(getCachedTranslation('Error', 'fr', 'en')).toBeUndefined();
    expect(getCachedTranslation('Null', 'fr', 'en')).toBeUndefined();
    expect(getCacheStats().size).toBe(0);
  });

  test('should handle repeated caching of the same key', () => {
    // Cache a translation
    cacheTranslation('Hello', 'fr', 'en', { text: 'Bonjour1' });

    // Cache a different translation for the same key
    cacheTranslation('Hello', 'fr', 'en', { text: 'Bonjour2' });

    // Verify only the new one is kept
    expect(getCachedTranslation('Hello', 'fr', 'en')).toEqual({ text: 'Bonjour2' });
    expect(getCacheStats().size).toBe(1);
  });
});
