/**
 * Event Tracker Service
 *
 * This service handles tracking and batching of analytics events.
 * It ensures events are validated and sent efficiently to the backend.
 */

import { createEvent, DATA_CATEGORIES } from './eventSchema';
import { privacyControls } from './privacyControls';

class EventTracker {
  constructor() {
    this.queue = [];
    this.batchSize = 20;
    this.isSending = false;
    this.sendInterval = null;
    this.sessionId = null;
    this.viewTimestamps = new Map(); // For tracking view durations
    this.initialized = false;

    // Initialize in browser environment only
    if (typeof window !== 'undefined' && !this.initialized) {
      this.initialize();
      this.initialized = true;
    }
  }

  /**
   * Initialize the event tracker
   */
  initialize() {
    // Generate a session ID
    this.sessionId = this.generateSessionId();

    // Set up interval to send queued events
    this.sendInterval = setInterval(() => {
      this.sendBatch();
    }, 30000); // Send every 30 seconds

    // Set up event listeners for page visibility
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }

    // Set up event listener for page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    }

    // Log session start
    this.track('session_start', {
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      referrer: document.referrer || 'direct',
      user_agent: navigator.userAgent,
      screen_size: `${window.innerWidth}x${window.innerHeight}`,
      url: window.location.href
    }, DATA_CATEGORIES.ESSENTIAL);
  }

  /**
   * Handle visibility change events (tab focus/blur)
   */
  handleVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      // Send any queued events immediately when page is hidden
      this.sendBatch(true);
    }
  }

  /**
   * Handle page unload events
   */
  handleBeforeUnload() {
    // Log session end
    this.track('session_end', {
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      duration: this.getSessionDuration()
    }, DATA_CATEGORIES.ESSENTIAL);

    // Force send queued events
    this.sendBatch(true);

    // Clear the interval
    if (this.sendInterval) {
      clearInterval(this.sendInterval);
    }
  }

  /**
   * Generate a unique session ID
   * @returns {string} Session ID
   */
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 12);
  }

  /**
   * Get session duration in seconds
   * @returns {number} Session duration
   */
  getSessionDuration() {
    const sessionStartTime = localStorage.getItem('session_start_time');
    if (!sessionStartTime) {
      localStorage.setItem('session_start_time', Date.now().toString());
      return 0;
    }

    return Math.floor((Date.now() - parseInt(sessionStartTime)) / 1000);
  }

  /**
   * Track an analytics event
   * @param {string} eventName Name of the event to track
   * @param {Object} eventData Data associated with the event
   * @param {string} dataCategory Privacy category (default: functional)
   * @returns {string|null} Event ID if tracked, null if not
   */
  track(eventName, eventData, dataCategory = DATA_CATEGORIES.FUNCTIONAL) {
    // Check if we can collect this data category based on privacy settings
    if (!privacyControls.canCollectData(dataCategory)) {
      return null;
    }

    // Create and validate the event
    const enrichedData = this.enrichEventData(eventName, eventData);
    const event = createEvent(eventName, enrichedData);

    if (!event) {
      // Failed validation
      return null;
    }

    // Sanitize based on privacy settings
    event.data = privacyControls.sanitizeEventData(event.data);

    // Add to queue
    this.queue.push(event);

    // For tracking view durations
    if (eventName.includes('_viewed')) {
      this.viewTimestamps.set(
        eventData.notification_id || eventData.id || `${eventName}_${Date.now()}`,
        Date.now()
      );
    }

    // Send if batch size reached
    if (this.queue.length >= this.batchSize) {
      this.sendBatch();
    }

    return event.id;
  }

  /**
   * Track the time between view and action
   * @param {string} id ID of the item (notification, etc.)
   * @returns {number|null} Time since view in milliseconds
   */
  getTimeSinceView(id) {
    if (!id || !this.viewTimestamps.has(id)) {
      return null;
    }

    return Date.now() - this.viewTimestamps.get(id);
  }

  /**
   * Enrich event data with common metadata
   * @param {string} eventName Event name
   * @param {Object} eventData Event data
   * @returns {Object} Enriched event data
   */
  enrichEventData(eventName, eventData) {
    // Add common metadata to all events
    return {
      ...eventData,
      session_id: this.sessionId,
      app_version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
      page_url: typeof window !== 'undefined' ? window.location.href : 'server',
      timestamp: eventData.timestamp || new Date().toISOString()
    };
  }

  /**
   * Send queued events to the server
   * @param {boolean} force Force sending even if batch is small
   * @returns {Promise<void>}
   */
  async sendBatch(force = false) {
    if ((this.isSending || this.queue.length === 0) && !force) {
      return;
    }

    this.isSending = true;
    const batch = [...this.queue];
    this.queue = [];

    try {
      // Use the Beacon API for more reliable sending during page unload
      if (force && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify({ events: batch })], { type: 'application/json' });
        const success = navigator.sendBeacon('/api/analytics/events', blob);

        if (!success) {
          // Fallback to fetch if beacon fails
          throw new Error('Beacon send failed');
        }
      } else {
        // Use fetch for normal sending
        await fetch('/api/analytics/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events: batch })
        });
      }
    } catch (error) {
      console.error('Failed to send analytics batch:', error);

      // Implement retry with exponential backoff
      this.handleSendError(batch);
    } finally {
      this.isSending = false;
    }
  }

  /**
   * Handle errors when sending events
   * @param {Array} batch The batch of events that failed to send
   */
  handleSendError(batch) {
    // Add back to queue with priority but limit queue size
    const maxQueueSize = 100;
    this.queue = [...batch, ...this.queue].slice(0, maxQueueSize);

    // Implement exponential backoff
    const backoffTime = Math.min(30000, Math.pow(2, this.sendErrorCount) * 1000);
    this.sendErrorCount = (this.sendErrorCount || 0) + 1;

    // Try again after backoff
    setTimeout(() => {
      this.sendBatch();
    }, backoffTime);
  }

  /**
   * Clear all queued events
   */
  clearQueue() {
    this.queue = [];
  }

  /**
   * Get the current queue of events (for debugging)
   * @returns {Array} Queue of events
   */
  getQueue() {
    return [...this.queue];
  }
}

// Export singleton instance
export const eventTracker = new EventTracker();
