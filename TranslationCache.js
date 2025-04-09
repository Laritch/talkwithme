/**
 * TranslationCache.js
 *
 * Implements a caching mechanism for translation requests to reduce API calls
 * and improve performance. Uses LRU (Least Recently Used) algorithm for efficient
 * cache management.
 */

// Get cache size from environment or use default
const CACHE_SIZE = parseInt(process.env.REACT_APP_TRANSLATION_CACHE_SIZE || '200', 10);

// Cache storage - implements a simple LRU cache
class TranslationLRUCache {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.cache = new Map();
    this.keyTimestamps = new Map(); // Tracks when each key was last accessed
  }

  /**
   * Get an item from the cache
   * @param {string} key - Cache key
   * @returns {any|undefined} - Cached value or undefined if not found
   */
  get(key) {
    if (!this.cache.has(key)) {
      return undefined;
    }

    // Update timestamp to mark as recently used
    this.keyTimestamps.set(key, Date.now());
    return this.cache.get(key);
  }

  /**
   * Store an item in the cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   */
  set(key, value) {
    // If cache is full, remove least recently used item
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const oldestKey = this.findOldestKey();
      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.keyTimestamps.delete(oldestKey);
      }
    }

    // Add new item
    this.cache.set(key, value);
    this.keyTimestamps.set(key, Date.now());
  }

  /**
   * Find the least recently used key
   * @returns {string|null} - Oldest key or null if cache is empty
   */
  findOldestKey() {
    if (this.keyTimestamps.size === 0) {
      return null;
    }

    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, timestamp] of this.keyTimestamps.entries()) {
      if (timestamp < oldestTime) {
        oldestTime = timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  /**
   * Clear the entire cache
   */
  clear() {
    this.cache.clear();
    this.keyTimestamps.clear();
  }

  /**
   * Get current cache size
   * @returns {number} - Number of items in cache
   */
  size() {
    return this.cache.size;
  }
}

// Create an instance of the cache
const translationCache = new TranslationLRUCache(CACHE_SIZE);

/**
 * Get a translation from the cache
 * @param {string} text - Source text
 * @param {string} targetLang - Target language
 * @param {string} sourceLang - Source language
 * @returns {Object|undefined} - Cached translation or undefined
 */
export function getCachedTranslation(text, targetLang, sourceLang) {
  const cacheKey = `${sourceLang}:${targetLang}:${text}`;
  return translationCache.get(cacheKey);
}

/**
 * Cache a translation result
 * @param {string} text - Source text
 * @param {string} targetLang - Target language
 * @param {string} sourceLang - Source language
 * @param {Object} result - Translation result to cache
 */
export function cacheTranslation(text, targetLang, sourceLang, result) {
  // Only cache successful translations
  if (!result || result.error) {
    return;
  }

  const cacheKey = `${sourceLang}:${targetLang}:${text}`;
  translationCache.set(cacheKey, result);
}

/**
 * Clear the translation cache
 */
export function clearTranslationCache() {
  translationCache.clear();
}

/**
 * Get current cache statistics
 * @returns {Object} - Statistics about the cache
 */
export function getCacheStats() {
  return {
    size: translationCache.size(),
    maxSize: translationCache.maxSize
  };
}
