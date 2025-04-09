/**
 * APIMonitoring.js
 *
 * This module monitors the performance and reliability of translation APIs
 * and dynamically adjusts the priority order based on actual usage patterns.
 */

// Storage key for API statistics
const API_STATS_STORAGE_KEY = 'translation_api_statistics';

// Default API priority order
const DEFAULT_API_PRIORITY = ['deepl', 'google', 'amazon', 'microsoft', 'libre'];

// Metrics for each API
let apiMetrics = {
  // Structure:
  // apiName: {
  //   successRate: number (0-1),
  //   avgResponseTime: number (ms),
  //   errorCount: number,
  //   usageCount: number,
  //   lastFailure: timestamp,
  //   consecutiveFailures: number,
  //   availability: number (0-1)
  // }
};

// Current priority order
let currentPriority = [...DEFAULT_API_PRIORITY];

// Initialize metrics from localStorage
function initAPIMonitoring() {
  try {
    const savedMetrics = localStorage.getItem(API_STATS_STORAGE_KEY);
    if (savedMetrics) {
      apiMetrics = JSON.parse(savedMetrics);
      console.log('Loaded API monitoring metrics:', apiMetrics);
    } else {
      resetMetrics();
    }

    // Load custom priority order from environment if available
    const envPriority = process.env.REACT_APP_API_PRIORITY;
    if (envPriority) {
      currentPriority = envPriority.split(',').map(api => api.trim()).filter(api => api);
    }

    // Adjust priority based on stored metrics
    recalculatePriority();

  } catch (error) {
    console.error('Failed to initialize API monitoring:', error);
    resetMetrics();
  }
}

/**
 * Reset API metrics to default values
 */
function resetMetrics() {
  apiMetrics = {};

  // Initialize metrics for each API
  DEFAULT_API_PRIORITY.forEach(api => {
    apiMetrics[api] = {
      successRate: 1,  // Start optimistic
      avgResponseTime: 500, // Assume 500ms initially
      errorCount: 0,
      usageCount: 0,
      lastFailure: null,
      consecutiveFailures: 0,
      availability: 1  // Start optimistic
    };
  });

  // Save to localStorage
  saveMetrics();
}

/**
 * Save current metrics to localStorage
 */
function saveMetrics() {
  try {
    localStorage.setItem(API_STATS_STORAGE_KEY, JSON.stringify(apiMetrics));
  } catch (error) {
    console.error('Failed to save API metrics:', error);
  }
}

/**
 * Record a successful API call
 * @param {string} apiName - Name of the API (e.g., 'google', 'deepl')
 * @param {number} responseTime - Response time in milliseconds
 */
export function recordAPISuccess(apiName, responseTime) {
  if (!apiMetrics[apiName]) {
    initializeAPIMetrics(apiName);
  }

  const metrics = apiMetrics[apiName];

  // Update metrics
  metrics.usageCount += 1;
  metrics.consecutiveFailures = 0;

  // Update average response time using running average
  if (metrics.usageCount > 1) {
    metrics.avgResponseTime = ((metrics.avgResponseTime * (metrics.usageCount - 1)) + responseTime) / metrics.usageCount;
  } else {
    metrics.avgResponseTime = responseTime;
  }

  // Recalculate success rate
  metrics.successRate = (metrics.usageCount - metrics.errorCount) / metrics.usageCount;

  // Gradually increase availability if there have been successes
  if (metrics.availability < 1) {
    metrics.availability = Math.min(1, metrics.availability + 0.1);
  }

  // Save updated metrics
  saveMetrics();

  // Check if we need to recalculate priorities
  if (metrics.usageCount % 10 === 0) {
    recalculatePriority();
  }
}

/**
 * Record a failed API call
 * @param {string} apiName - Name of the API (e.g., 'google', 'deepl')
 * @param {Error} error - The error that occurred
 */
export function recordAPIFailure(apiName, error) {
  if (!apiMetrics[apiName]) {
    initializeAPIMetrics(apiName);
  }

  const metrics = apiMetrics[apiName];

  // Update metrics
  metrics.errorCount += 1;
  metrics.consecutiveFailures += 1;
  metrics.lastFailure = Date.now();

  // Update success rate
  if (metrics.usageCount > 0) {
    metrics.successRate = (metrics.usageCount - metrics.errorCount) / metrics.usageCount;
  } else {
    metrics.successRate = 0;
  }

  // Adjust availability based on consecutive failures
  // More consecutive failures = steeper decrease in availability
  const availabilityDecrement = Math.min(0.5, metrics.consecutiveFailures * 0.1);
  metrics.availability = Math.max(0, metrics.availability - availabilityDecrement);

  // Save updated metrics
  saveMetrics();

  // If we have consecutive failures, immediately recalculate priorities
  if (metrics.consecutiveFailures >= 2) {
    recalculatePriority();
  }
}

/**
 * Initialize metrics for a new API
 * @param {string} apiName - Name of the API
 */
function initializeAPIMetrics(apiName) {
  apiMetrics[apiName] = {
    successRate: 1,
    avgResponseTime: 500,
    errorCount: 0,
    usageCount: 0,
    lastFailure: null,
    consecutiveFailures: 0,
    availability: 1
  };
}

/**
 * Recalculate API priority order based on performance metrics
 */
function recalculatePriority() {
  // Create a score for each API
  const apiScores = Object.entries(apiMetrics).map(([apiName, metrics]) => {
    // Calculate a combined score based on:
    // - Success rate (most important)
    // - Availability (temporary downtimes)
    // - Response time (speed)

    // Response time score (lower is better)
    const responseTimeScore = Math.max(0, 1 - (metrics.avgResponseTime / 2000));

    // Time since last failure (recover over time)
    let timeSinceFailureScore = 1;
    if (metrics.lastFailure) {
      const hoursSinceFailure = (Date.now() - metrics.lastFailure) / (1000 * 60 * 60);
      timeSinceFailureScore = Math.min(1, hoursSinceFailure / 24); // Recover fully after 24 hours
    }

    // Combined score with weighted components
    const score = (
      (metrics.successRate * 0.5) +
      (metrics.availability * 0.3) +
      (responseTimeScore * 0.1) +
      (timeSinceFailureScore * 0.1)
    );

    return { apiName, score };
  });

  // Sort by score (highest first)
  apiScores.sort((a, b) => b.score - a.score);

  // Update priority order
  currentPriority = apiScores.map(item => item.apiName);

  console.log('Updated API priority order:', currentPriority);
}

/**
 * Get the current API priority order
 * @returns {Array<string>} - Ordered list of API names by priority
 */
export function getAPIPriority() {
  return [...currentPriority];
}

/**
 * Get current API performance metrics for display
 * @returns {Object} - API metrics for reporting
 */
export function getAPIMetrics() {
  return JSON.parse(JSON.stringify(apiMetrics)); // Return a deep copy
}

/**
 * Manually set API priority (for admin override)
 * @param {Array<string>} priorityOrder - New priority order
 */
export function setAPIPriority(priorityOrder) {
  if (Array.isArray(priorityOrder) && priorityOrder.length > 0) {
    currentPriority = [...priorityOrder];
  }
}

/**
 * Check if an API should be temporarily disabled due to failures
 * @param {string} apiName - Name of the API
 * @returns {boolean} - Whether the API should be temporarily skipped
 */
export function shouldSkipAPI(apiName) {
  const metrics = apiMetrics[apiName];

  if (!metrics) return false;

  // Skip if we've had too many consecutive failures
  if (metrics.consecutiveFailures >= 5) return true;

  // Skip if availability is too low
  if (metrics.availability < 0.3) return true;

  return false;
}

/**
 * Reset statistics for a specific API
 * @param {string} apiName - Name of the API to reset
 */
export function resetAPIMetrics(apiName) {
  if (apiMetrics[apiName]) {
    initializeAPIMetrics(apiName);
    saveMetrics();
  }
}

// Initialize monitoring on module load
initAPIMonitoring();
