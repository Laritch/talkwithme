/**
 * Privacy Controls for Analytics Data Collection
 *
 * This module manages user privacy preferences and ensures data is collected
 * according to those preferences and applicable regulations.
 */

import { DATA_CATEGORIES } from './eventSchema';

// Privacy level settings
export const PRIVACY_LEVELS = {
  FULL: 'full_analytics',          // Collect all analytics data
  MINIMAL: 'minimal_analytics',    // Collect only essential and functional data
  ESSENTIAL: 'essential_only',     // Collect only essential data
  NONE: 'no_analytics'             // Collect no analytics data
};

/**
 * Cookie name for storing privacy preferences
 */
const PRIVACY_COOKIE_NAME = 'analytics_privacy_settings';

/**
 * Fields considered personally identifiable information
 */
const PII_FIELDS = [
  'user_email',
  'user_name',
  'user_phone',
  'ip_address',
  'user_id',
  'full_name',
  'address',
  'social_security_number',
  'credit_card',
  'passport',
  'license_number'
];

/**
 * Privacy Controls class to manage data collection settings
 */
export class PrivacyControls {
  constructor() {
    this.currentLevel = this.getStoredPrivacyLevel() || PRIVACY_LEVELS.MINIMAL;
    this.initialized = false;

    // Initialize once in browser environment
    if (typeof window !== 'undefined' && !this.initialized) {
      this.initialize();
      this.initialized = true;
    }
  }

  /**
   * Initialize privacy controls
   */
  initialize() {
    // Detect and apply region-specific defaults
    this.detectPrivacyRegulation().then(regulation => {
      if (regulation === 'GDPR' && !this.hasExplicitConsent()) {
        // Default to minimal for GDPR regions without explicit consent
        this.setPrivacyLevel(PRIVACY_LEVELS.MINIMAL);
      } else if (regulation === 'CCPA' && !this.hasExplicitConsent()) {
        // Default to minimal for CCPA regions without explicit consent
        this.setPrivacyLevel(PRIVACY_LEVELS.MINIMAL);
      }
    });
  }

  /**
   * Get stored privacy level preference
   * @returns {string|null} The stored privacy level or null
   */
  getStoredPrivacyLevel() {
    if (typeof window === 'undefined') return null;

    try {
      // Try to get from cookie
      const cookieValue = this.getCookie(PRIVACY_COOKIE_NAME);
      if (cookieValue) {
        const settings = JSON.parse(cookieValue);
        return settings.level;
      }

      // Fallback to localStorage
      const storageValue = localStorage.getItem('analytics_privacy_level');
      if (storageValue && Object.values(PRIVACY_LEVELS).includes(storageValue)) {
        return storageValue;
      }
    } catch (error) {
      console.error('Error getting privacy settings:', error);
    }

    return null;
  }

  /**
   * Check if user has given explicit consent
   * @returns {boolean} Whether explicit consent was given
   */
  hasExplicitConsent() {
    if (typeof window === 'undefined') return false;

    try {
      const cookieValue = this.getCookie(PRIVACY_COOKIE_NAME);
      if (cookieValue) {
        const settings = JSON.parse(cookieValue);
        return settings.explicit_consent === true;
      }
    } catch (error) {
      console.error('Error checking explicit consent:', error);
    }

    return false;
  }

  /**
   * Set the privacy level for data collection
   * @param {string} level The privacy level to set
   * @param {boolean} explicitConsent Whether this was an explicit user choice
   */
  setPrivacyLevel(level, explicitConsent = false) {
    if (!Object.values(PRIVACY_LEVELS).includes(level)) {
      throw new Error(`Invalid privacy level: ${level}`);
    }

    this.currentLevel = level;

    // Store in both cookie and localStorage for redundancy
    try {
      // Save to cookie (7 day expiry)
      const settings = {
        level,
        explicit_consent: explicitConsent,
        timestamp: new Date().toISOString()
      };

      this.setCookie(PRIVACY_COOKIE_NAME, JSON.stringify(settings), 7);

      // Save to localStorage as backup
      if (typeof window !== 'undefined') {
        localStorage.setItem('analytics_privacy_level', level);
      }
    } catch (error) {
      console.error('Error saving privacy settings:', error);
    }
  }

  /**
   * Check if a particular data category can be collected
   * @param {string} dataCategory The category of data
   * @returns {boolean} Whether collection is allowed
   */
  canCollectData(dataCategory) {
    switch (this.currentLevel) {
      case PRIVACY_LEVELS.FULL:
        return true;
      case PRIVACY_LEVELS.MINIMAL:
        return [
          DATA_CATEGORIES.ESSENTIAL,
          DATA_CATEGORIES.FUNCTIONAL,
          DATA_CATEGORIES.PERFORMANCE
        ].includes(dataCategory);
      case PRIVACY_LEVELS.ESSENTIAL:
        return dataCategory === DATA_CATEGORIES.ESSENTIAL;
      case PRIVACY_LEVELS.NONE:
        return false;
      default:
        return false;
    }
  }

  /**
   * Sanitize event data based on privacy settings
   * @param {Object} eventData The event data to sanitize
   * @returns {Object} Sanitized event data
   */
  sanitizeEventData(eventData) {
    if (!eventData) return {};

    // Always create a copy to avoid modifying the original
    const sanitized = { ...eventData };

    // Always remove PII regardless of settings
    for (const field of PII_FIELDS) {
      if (field in sanitized) {
        delete sanitized[field];
      }

      // Also check for nested objects
      for (const key in sanitized) {
        if (
          sanitized[key] &&
          typeof sanitized[key] === 'object' &&
          field in sanitized[key]
        ) {
          delete sanitized[key][field];
        }
      }
    }

    // Apply additional sanitization based on privacy level
    if (this.currentLevel === PRIVACY_LEVELS.MINIMAL) {
      // Truncate client IPs
      if (sanitized.ip_address) {
        sanitized.ip_address = this.truncateIp(sanitized.ip_address);
      }

      // Hash any remaining identifiers
      if (sanitized.session_id) {
        sanitized.session_id = this.hashValue(sanitized.session_id);
      }

      if (sanitized.device_id) {
        sanitized.device_id = this.hashValue(sanitized.device_id);
      }
    }

    return sanitized;
  }

  /**
   * Hash a value for anonymization
   * @param {string} value The value to hash
   * @returns {string} The hashed value
   */
  hashValue(value) {
    // Simple hash function for illustration
    // In production, use a proper cryptographic hash
    if (!value) return '';

    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return 'hashed_' + Math.abs(hash).toString(16);
  }

  /**
   * Truncate IP address for privacy
   * @param {string} ip The IP address to truncate
   * @returns {string} The truncated IP
   */
  truncateIp(ip) {
    if (!ip) return '';

    // IPv4
    if (ip.includes('.')) {
      const parts = ip.split('.');
      return `${parts[0]}.${parts[1]}.0.0`;
    }

    // IPv6
    if (ip.includes(':')) {
      const parts = ip.split(':');
      return `${parts[0]}:${parts[1]}:0:0:0:0:0:0`;
    }

    return ip;
  }

  /**
   * Helper to get cookie value
   * @param {string} name Cookie name
   * @returns {string|null} Cookie value or null
   */
  getCookie(name) {
    if (typeof document === 'undefined') return null;

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  /**
   * Helper to set cookie
   * @param {string} name Cookie name
   * @param {string} value Cookie value
   * @param {number} days Days until expiry
   */
  setCookie(name, value, days) {
    if (typeof document === 'undefined') return;

    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${d.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
  }

  /**
   * Detect applicable privacy regulation based on user region
   * @returns {Promise<string>} The detected regulation
   */
  async detectPrivacyRegulation() {
    // Try to get from store or localStorage
    if (typeof window !== 'undefined') {
      // Check for region in Redux store
      if (
        window.__REDUX_STATE__ &&
        window.__REDUX_STATE__.compliance &&
        window.__REDUX_STATE__.compliance.userRegion
      ) {
        return this.getRegulationForRegion(window.__REDUX_STATE__.compliance.userRegion);
      }

      // Check localStorage
      const storedRegion = localStorage.getItem('user_region');
      if (storedRegion) {
        return this.getRegulationForRegion(storedRegion);
      }
    }

    // If we still don't have it, do a new detection
    try {
      // Import dynamically to avoid issues with server-side rendering
      const { detectUserRegion } = await import('../geoLocation');
      const region = await detectUserRegion();
      return this.getRegulationForRegion(region);
    } catch (error) {
      console.error('Error detecting user region:', error);
      return 'UNKNOWN';
    }
  }

  /**
   * Map region to applicable regulation
   * @param {string} region The user's region code
   * @returns {string} The applicable regulation
   */
  getRegulationForRegion(region) {
    if (!region) return 'UNKNOWN';

    // EU and UK regions fall under GDPR
    if (['EU', 'DE', 'FR', 'ES', 'IT', 'UK', 'NL', 'BE', 'DK', 'SE', 'FI', 'PT', 'GR', 'AT'].includes(region)) {
      return 'GDPR';
    }

    // California falls under CCPA
    if (region === 'US-CA') {
      return 'CCPA';
    }

    // Other US states
    if (region === 'US') {
      return 'US_PRIVACY';
    }

    // Canada
    if (region === 'CA') {
      return 'PIPEDA';
    }

    // Australia
    if (region === 'AU') {
      return 'AUSTRALIA_PRIVACY';
    }

    // Default
    return 'GENERAL';
  }
}

// Export singleton instance
export const privacyControls = new PrivacyControls();
