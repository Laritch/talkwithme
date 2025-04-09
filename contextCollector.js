/**
 * Context Collector Service
 *
 * This service collects contextual information about the user's environment,
 * which can be used to enhance analytics and provide better insights.
 */

import { eventTracker } from './eventTracker';
import { DATA_CATEGORIES } from './eventSchema';

class ContextCollector {
  constructor() {
    this.contexts = {};
    this.collectionInterval = null;
    this.sessionStartTime = null;
    this.initialized = false;

    // Track update timestamps per context type
    this.lastUpdated = {
      device: 0,
      viewport: 0,
      network: 0,
      timezone: 0,
      language: 0,
      location: 0
    };

    // Minimum time between updates for each context type (ms)
    this.updateThresholds = {
      device: 24 * 60 * 60 * 1000, // Once per day
      viewport: 60 * 60 * 1000,    // Once per hour
      network: 30 * 60 * 1000,     // Every 30 minutes
      timezone: 6 * 60 * 60 * 1000, // Every 6 hours
      language: 24 * 60 * 60 * 1000, // Once per day
      location: 12 * 60 * 60 * 1000 // Every 12 hours
    };
  }

  /**
   * Initialize context collection
   * @returns {Function} Cleanup function
   */
  initContextCollection() {
    // Don't initialize more than once or on server
    if (this.initialized || typeof window === 'undefined') {
      return () => {};
    }

    this.initialized = true;
    this.sessionStartTime = new Date();

    // Collect initial context
    this.collectUserContext();

    // Set up interval for ongoing collection
    this.collectionInterval = setInterval(() => {
      this.collectUserContext();
    }, 30 * 60 * 1000); // Every 30 minutes

    // Set up event listeners
    window.addEventListener('online', () => this.collectNetworkContext());
    window.addEventListener('offline', () => this.collectNetworkContext());
    window.addEventListener('resize', this.debounce(() => this.collectViewportContext(), 500));
    window.addEventListener('languagechange', () => this.collectLanguageContext());

    // Return cleanup function
    return () => {
      clearInterval(this.collectionInterval);
      window.removeEventListener('online', this.collectNetworkContext);
      window.removeEventListener('offline', this.collectNetworkContext);
      window.removeEventListener('resize', this.debounce);
      window.removeEventListener('languagechange', this.collectLanguageContext);
    };
  }

  /**
   * Collect all user context information
   */
  async collectUserContext() {
    try {
      // Collect various contexts
      await this.collectDeviceContext();
      this.collectViewportContext();
      this.collectTimezoneContext();
      this.collectNetworkContext();
      this.collectLanguageContext();
      this.collectSessionContext();

      // Attempt to collect location if permitted
      try {
        await this.collectLocationContext();
      } catch (error) {
        // Location access might be denied, just continue
        console.debug('Location collection failed, continuing without it:', error);
      }

      // Track context update event with collected data
      eventTracker.track('user_context_updated', this.contexts, DATA_CATEGORIES.FUNCTIONAL);
    } catch (error) {
      console.error('Error collecting user context:', error);
    }
  }

  /**
   * Collect device information
   */
  async collectDeviceContext() {
    // Don't update too frequently
    if (Date.now() - this.lastUpdated.device < this.updateThresholds.device) {
      return;
    }

    const ua = navigator.userAgent;
    this.contexts.deviceType = this.getDeviceType(ua);
    this.contexts.browser = this.getBrowserInfo(ua);
    this.contexts.os = this.getOperatingSystem(ua);
    this.contexts.deviceMemory = navigator.deviceMemory || 'unknown';
    this.contexts.hardwareConcurrency = navigator.hardwareConcurrency || 'unknown';

    this.lastUpdated.device = Date.now();
  }

  /**
   * Collect viewport information
   */
  collectViewportContext() {
    // Don't update too frequently
    if (Date.now() - this.lastUpdated.viewport < this.updateThresholds.viewport) {
      return;
    }

    this.contexts.screenSize = `${window.innerWidth}x${window.innerHeight}`;
    this.contexts.pixelRatio = window.devicePixelRatio || 1;
    this.contexts.colorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    this.contexts.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.lastUpdated.viewport = Date.now();
  }

  /**
   * Collect timezone information
   */
  collectTimezoneContext() {
    // Don't update too frequently
    if (Date.now() - this.lastUpdated.timezone < this.updateThresholds.timezone) {
      return;
    }

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      this.contexts.timezone = timezone;

      // Calculate offset from UTC
      const now = new Date();
      const offset = -now.getTimezoneOffset() / 60;
      this.contexts.timezoneOffset = offset >= 0 ? `+${offset}` : `${offset}`;

      this.lastUpdated.timezone = Date.now();
    } catch (error) {
      console.error('Error detecting timezone:', error);
    }
  }

  /**
   * Collect network context information
   */
  collectNetworkContext() {
    // Don't update too frequently
    if (Date.now() - this.lastUpdated.network < this.updateThresholds.network) {
      return;
    }

    this.contexts.online = navigator.onLine;

    // Try to get connection information if available
    if (navigator.connection) {
      this.contexts.connectionType = navigator.connection.effectiveType || 'unknown';
      this.contexts.downlinkSpeed = navigator.connection.downlink || 'unknown';
    }

    this.lastUpdated.network = Date.now();
  }

  /**
   * Collect language and locale information
   */
  collectLanguageContext() {
    // Don't update too frequently
    if (Date.now() - this.lastUpdated.language < this.updateThresholds.language) {
      return;
    }

    this.contexts.language = navigator.language || 'unknown';
    this.contexts.languages = navigator.languages ? navigator.languages.join(',') : 'unknown';

    // Try to get locale information
    try {
      this.contexts.dateFormat = new Intl.DateTimeFormat().resolvedOptions().locale;
      this.contexts.numberFormat = new Intl.NumberFormat().resolvedOptions().locale;
    } catch (error) {
      console.error('Error detecting locale:', error);
    }

    this.lastUpdated.language = Date.now();
  }

  /**
   * Collect session context
   */
  collectSessionContext() {
    // Calculate session duration
    if (this.sessionStartTime) {
      this.contexts.sessionDuration = Math.floor((new Date() - this.sessionStartTime) / 1000);
    } else {
      this.sessionStartTime = new Date();
      this.contexts.sessionDuration = 0;
    }

    // Track page information
    this.contexts.currentPage = window.location.pathname;
    this.contexts.referrer = document.referrer || 'direct';
  }

  /**
   * Collect geolocation information (if permitted)
   * @returns {Promise<void>}
   */
  collectLocationContext() {
    return new Promise((resolve, reject) => {
      // Don't update too frequently
      if (Date.now() - this.lastUpdated.location < this.updateThresholds.location) {
        resolve();
        return;
      }

      // Check if geolocation is available
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not available'));
        return;
      }

      // Get coarse location (low accuracy for privacy)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Round coordinates to 1 decimal place for privacy (≈10km accuracy)
          this.contexts.latitude = Math.round(position.coords.latitude * 10) / 10;
          this.contexts.longitude = Math.round(position.coords.longitude * 10) / 10;
          this.lastUpdated.location = Date.now();
          resolve();
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 24 * 60 * 60 * 1000 // 1 day
        }
      );
    });
  }

  /**
   * Determine the device type from user agent
   * @param {string} ua User agent string
   * @returns {string} Device type
   */
  getDeviceType(ua) {
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  /**
   * Determine the browser information from user agent
   * @param {string} ua User agent string
   * @returns {string} Browser information
   */
  getBrowserInfo(ua) {
    const browsers = [
      { name: 'Edge', regex: /Edg|Edge/i },
      { name: 'Chrome', regex: /Chrome/i },
      { name: 'Firefox', regex: /Firefox/i },
      { name: 'Safari', regex: /Safari/i },
      { name: 'IE', regex: /MSIE|Trident/i },
      { name: 'Opera', regex: /Opera|OPR/i }
    ];

    for (const browser of browsers) {
      if (browser.regex.test(ua)) {
        return browser.name;
      }
    }

    return 'unknown';
  }

  /**
   * Determine the operating system from user agent
   * @param {string} ua User agent string
   * @returns {string} Operating system
   */
  getOperatingSystem(ua) {
    const os = [
      { name: 'iOS', regex: /iPhone|iPad|iPod/i },
      { name: 'Android', regex: /Android/i },
      { name: 'Windows', regex: /Win/i },
      { name: 'macOS', regex: /Mac/i },
      { name: 'Linux', regex: /Linux/i },
      { name: 'UNIX', regex: /X11/i }
    ];

    for (const system of os) {
      if (system.regex.test(ua)) {
        return system.name;
      }
    }

    return 'unknown';
  }

  /**
   * Debounce function to limit frequency of calls
   * @param {Function} func Function to debounce
   * @param {number} wait Wait time in ms
   * @returns {Function} Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Get all collected contexts
   * @returns {Object} The context data
   */
  getContexts() {
    return { ...this.contexts };
  }
}

// Export singleton instance
export const contextCollector = new ContextCollector();
