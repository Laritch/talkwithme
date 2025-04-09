/**
 * A/B Testing Framework for Expert Connect Platform
 *
 * This module provides tools for running multi-variation controlled experiments on:
 * - Notification timing and content
 * - Expert matching algorithms
 * - Expert presentation strategies
 */

// Import required modules
import { eventTracker } from '../analytics';
import { DATA_CATEGORIES } from '../analytics/eventSchema';

// Define experiment types
export const EXPERIMENT_TYPES = {
  TIMING: 'timing_experiment',
  CONTENT: 'content_experiment',
  PRIORITY: 'priority_experiment',
  FREQUENCY: 'frequency_experiment',
  EXPERT_MATCHING: 'expert_matching_experiment',
  EXPERT_PRESENTATION: 'expert_presentation_experiment',
  GEOGRAPHIC_MATCHING: 'geographic_matching_experiment'
};

// Define variations for multi-variation testing
export const VARIATION_TYPES = {
  CONTROL: 'control',      // A - Control group (baseline)
  TREATMENT_1: 'treatment_1', // B - First treatment variation
  TREATMENT_2: 'treatment_2', // C - Second treatment variation
  TREATMENT_3: 'treatment_3'  // D - Third treatment variation
};

/**
 * Class to manage all active experiments
 */
export class ExperimentManager {
  constructor() {
    this.activeExperiments = {};
    this.userAssignments = {}; // Map of user IDs to experiment assignments

    // Default distribution across variations (even split for up to 4 variations)
    this.defaultDistribution = {
      [VARIATION_TYPES.CONTROL]: 0.25,
      [VARIATION_TYPES.TREATMENT_1]: 0.25,
      [VARIATION_TYPES.TREATMENT_2]: 0.25,
      [VARIATION_TYPES.TREATMENT_3]: 0.25
    };
  }

  /**
   * Register a new experiment
   * @param {string} experimentId - Unique identifier for the experiment
   * @param {Object} experiment - Experiment configuration
   * @returns {boolean} - Success indicator
   */
  registerExperiment(experimentId, experiment) {
    if (this.activeExperiments[experimentId]) {
      console.warn(`Experiment ${experimentId} is already registered.`);
      return false;
    }

    // Set defaults if not provided
    const completeExperiment = {
      ...experiment,
      createdAt: new Date().toISOString(),
      distribution: experiment.distribution || this.getDefaultDistribution(experiment.variations),
      status: 'active',
      results: this.initializeExperimentResults(experiment.variations)
    };

    this.activeExperiments[experimentId] = completeExperiment;
    console.log(`Experiment ${experimentId} registered.`);

    return true;
  }

  /**
   * Initialize experiment results structure based on variation count
   * @param {Object} variations - Experiment variations
   * @returns {Object} - Initial results structure
   */
  initializeExperimentResults(variations) {
    const results = {};
    // Create result trackers for each variation
    Object.keys(variations).forEach(variation => {
      results[variation] = {
        impressions: 0,
        views: 0,
        clicks: 0,
        actions: 0,
        conversions: 0,
        revenue: 0
      };
    });
    return results;
  }

  /**
   * Get default distribution based on number of variations
   * @param {Object} variations - Experiment variations
   * @returns {Object} - Default distribution
   */
  getDefaultDistribution(variations) {
    const variationCount = Object.keys(variations).length;
    if (variationCount === 0) return {};

    // Create even distribution
    const distribution = {};
    const weight = 1 / variationCount;

    Object.keys(variations).forEach(variation => {
      distribution[variation] = weight;
    });

    return distribution;
  }

  /**
   * Get an active experiment
   * @param {string} experimentId - Unique identifier for the experiment
   * @returns {Object|null} - Experiment configuration
   */
  getExperiment(experimentId) {
    return this.activeExperiments[experimentId] || null;
  }

  /**
   * Get all active experiments
   * @returns {Object} - Map of experiment IDs to configurations
   */
  getAllExperiments() {
    return this.activeExperiments;
  }

  /**
   * Get experiments by type
   * @param {string} type - Experiment type
   * @returns {Object} - Map of matching experiment IDs to configurations
   */
  getExperimentsByType(type) {
    const filteredExperiments = {};

    Object.entries(this.activeExperiments).forEach(([id, exp]) => {
      if (exp.type === type && exp.status === 'active') {
        filteredExperiments[id] = exp;
      }
    });

    return filteredExperiments;
  }

  /**
   * End an experiment
   * @param {string} experimentId - Unique identifier for the experiment
   * @returns {boolean} - Success indicator
   */
  endExperiment(experimentId) {
    if (!this.activeExperiments[experimentId]) {
      console.warn(`Experiment ${experimentId} not found.`);
      return false;
    }

    this.activeExperiments[experimentId].status = 'completed';
    this.activeExperiments[experimentId].endedAt = new Date().toISOString();

    console.log(`Experiment ${experimentId} ended.`);
    return true;
  }

  /**
   * Assign a user to a variation for an experiment
   * @param {string} userId - User identifier
   * @param {string} experimentId - Experiment identifier
   * @returns {string} - Assigned variation
   */
  assignUserToVariation(userId, experimentId) {
    if (!this.activeExperiments[experimentId]) {
      console.warn(`Experiment ${experimentId} not found.`);
      return VARIATION_TYPES.CONTROL; // Default to control
    }

    // Check if user is already assigned to this experiment
    if (this.userAssignments[userId] && this.userAssignments[userId][experimentId]) {
      return this.userAssignments[userId][experimentId];
    }

    // New assignment - use consistent hash for the same user+experiment
    const hash = this.hashString(`${userId}-${experimentId}`);
    const normalizedHash = hash / Number.MAX_SAFE_INTEGER; // 0-1 range

    // Determine variation based on distribution
    const distribution = this.activeExperiments[experimentId].distribution;
    let cumulativeProbability = 0;
    let assignedVariation = VARIATION_TYPES.CONTROL; // Default

    for (const [variation, probability] of Object.entries(distribution)) {
      cumulativeProbability += probability;
      if (normalizedHash < cumulativeProbability) {
        assignedVariation = variation;
        break;
      }
    }

    // Store the assignment
    if (!this.userAssignments[userId]) {
      this.userAssignments[userId] = {};
    }
    this.userAssignments[userId][experimentId] = assignedVariation;

    // Track the assignment event
    this.trackExperimentEvent(experimentId, userId, 'assignment', {
      variation: assignedVariation
    });

    return assignedVariation;
  }

  /**
   * Get the variation a user is assigned to for an experiment
   * @param {string} userId - User identifier
   * @param {string} experimentId - Experiment identifier
   * @returns {string|null} - Assigned variation or null if not assigned
   */
  getUserVariation(userId, experimentId) {
    if (!this.userAssignments[userId] || !this.userAssignments[userId][experimentId]) {
      return null;
    }

    return this.userAssignments[userId][experimentId];
  }

  /**
   * Track an experiment event
   * @param {string} experimentId - Experiment identifier
   * @param {string} userId - User identifier
   * @param {string} eventType - Type of event (impression, view, click, etc.)
   * @param {Object} eventData - Additional event data
   */
  trackExperimentEvent(experimentId, userId, eventType, eventData = {}) {
    if (!this.activeExperiments[experimentId]) {
      console.warn(`Experiment ${experimentId} not found for tracking.`);
      return;
    }

    // Get user's variation
    const variation = this.getUserVariation(userId, experimentId) ||
                      this.assignUserToVariation(userId, experimentId);

    // Update experiment results
    if (['impression', 'view', 'click', 'action', 'conversion'].includes(eventType)) {
      if (this.activeExperiments[experimentId].results[variation]) {
        this.activeExperiments[experimentId].results[variation][`${eventType}s`]++;

        // Track revenue if provided
        if (eventType === 'conversion' && eventData.revenue) {
          this.activeExperiments[experimentId].results[variation].revenue +=
            (typeof eventData.revenue === 'number' ? eventData.revenue : 0);
        }
      }
    }

    // Track the event in the analytics system
    eventTracker.track(`experiment_${eventType}`, {
      experiment_id: experimentId,
      experiment_type: this.activeExperiments[experimentId].type,
      user_id: userId,
      variation,
      ...eventData,
      timestamp: new Date().toISOString()
    }, DATA_CATEGORIES.FUNCTIONAL);
  }

  /**
   * Get experiment results
   * @param {string} experimentId - Experiment identifier
   * @returns {Object} - Results data
   */
  getExperimentResults(experimentId) {
    if (!this.activeExperiments[experimentId]) {
      console.warn(`Experiment ${experimentId} not found.`);
      return null;
    }

    const experiment = this.activeExperiments[experimentId];
    const results = experiment.results;

    // Calculate metrics for each variation
    const calculatedResults = {};
    Object.entries(results).forEach(([variation, metrics]) => {
      calculatedResults[variation] = {
        ...metrics,
        viewRate: metrics.impressions ? metrics.views / metrics.impressions : 0,
        clickRate: metrics.views ? metrics.clicks / metrics.views : 0,
        actionRate: metrics.clicks ? metrics.actions / metrics.clicks : 0,
        conversionRate: metrics.views ? metrics.conversions / metrics.views : 0,
        revenuePerImpression: metrics.impressions ? metrics.revenue / metrics.impressions : 0
      };
    });

    // Calculate lift compared to control for each treatment
    calculatedResults.lift = {};
    const controlResults = calculatedResults[VARIATION_TYPES.CONTROL];

    Object.entries(calculatedResults).forEach(([variation, metrics]) => {
      // Skip control and non-variation properties
      if (variation === VARIATION_TYPES.CONTROL || variation === 'lift') return;

      // Calculate lift for each metric
      calculatedResults.lift[variation] = {
        viewRate: this.calculateLift(metrics.viewRate, controlResults.viewRate),
        clickRate: this.calculateLift(metrics.clickRate, controlResults.clickRate),
        actionRate: this.calculateLift(metrics.actionRate, controlResults.actionRate),
        conversionRate: this.calculateLift(metrics.conversionRate, controlResults.conversionRate),
        revenuePerImpression: this.calculateLift(metrics.revenuePerImpression, controlResults.revenuePerImpression)
      };
    });

    // Add statistical significance
    calculatedResults.significance = {};
    Object.entries(calculatedResults).forEach(([variation, metrics]) => {
      // Skip control and non-variation properties
      if (variation === VARIATION_TYPES.CONTROL || variation === 'lift' || variation === 'significance') return;

      calculatedResults.significance[variation] = {
        viewRate: this.calculateSignificance(
          controlResults.views, controlResults.impressions,
          metrics.views, metrics.impressions
        ),
        clickRate: this.calculateSignificance(
          controlResults.clicks, controlResults.views,
          metrics.clicks, metrics.views
        ),
        actionRate: this.calculateSignificance(
          controlResults.actions, controlResults.clicks,
          metrics.actions, metrics.clicks
        ),
        conversionRate: this.calculateSignificance(
          controlResults.conversions, controlResults.views,
          metrics.conversions, metrics.views
        )
      };
    });

    return calculatedResults;
  }

  /**
   * Simple method to calculate lift between treatment and control
   * @param {number} treatmentRate - Treatment conversion rate
   * @param {number} controlRate - Control conversion rate
   * @returns {number} - Lift percentage
   */
  calculateLift(treatmentRate, controlRate) {
    if (controlRate === 0) return 0;
    return ((treatmentRate - controlRate) / controlRate) * 100;
  }

  /**
   * Simplified statistical significance calculation
   * In a real implementation, this would use proper statistical tests (z-test, chi-squared, etc.)
   * @param {number} controlSuccesses - Number of successes in control
   * @param {number} controlTotal - Total number in control
   * @param {number} treatmentSuccesses - Number of successes in treatment
   * @param {number} treatmentTotal - Total number in treatment
   * @returns {Object} - Significance data
   */
  calculateSignificance(controlSuccesses, controlTotal, treatmentSuccesses, treatmentTotal) {
    // This is a simplified approach - in reality you'd use a proper statistical test

    // Need minimum sample size to calculate significance
    if (controlTotal < 30 || treatmentTotal < 30) {
      return {
        significant: false,
        pValue: null,
        confidenceLevel: null,
        message: 'Insufficient sample size'
      };
    }

    const controlRate = controlSuccesses / controlTotal;
    const treatmentRate = treatmentSuccesses / treatmentTotal;

    // Calculate standard error (simplified)
    const controlStdError = Math.sqrt((controlRate * (1 - controlRate)) / controlTotal);
    const treatmentStdError = Math.sqrt((treatmentRate * (1 - treatmentRate)) / treatmentTotal);

    // Calculate z-score (simplified)
    const zScore = Math.abs(treatmentRate - controlRate) / Math.sqrt(controlStdError ** 2 + treatmentStdError ** 2);

    // Determine significance
    // z-score > 1.96 is roughly p < 0.05 (95% confidence)
    const significant = zScore > 1.96;

    // Very rough p-value approximation
    let pValue, confidenceLevel;
    if (zScore > 3.29) {
      pValue = 0.001;
      confidenceLevel = 99.9;
    } else if (zScore > 2.58) {
      pValue = 0.01;
      confidenceLevel = 99;
    } else if (zScore > 1.96) {
      pValue = 0.05;
      confidenceLevel = 95;
    } else if (zScore > 1.65) {
      pValue = 0.10;
      confidenceLevel = 90;
    } else {
      pValue = 0.50;
      confidenceLevel = 50;
    }

    return {
      significant,
      pValue,
      confidenceLevel,
      zScore,
      message: significant ?
        `Statistically significant with ${confidenceLevel}% confidence` :
        'Not statistically significant'
    };
  }

  /**
   * Simple hash function for consistent user assignment
   * @param {string} str - String to hash
   * @returns {number} - Hashed value
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

// Export all the existing experiment classes like TimingExperiment, ContentExperiment, etc.

/**
 * Geographic Matching Experiment - test different geographic prioritization strategies
 */
export class GeographicMatchingExperiment {
  constructor(experimentManager) {
    this.experimentManager = experimentManager;
  }

  /**
   * Create a new geographic matching experiment
   * @param {Object} config - Experiment configuration
   * @returns {string} - Experiment ID
   */
  createExperiment(config) {
    const experimentId = `geo_matching_${Date.now()}`;

    const variations = {
      [VARIATION_TYPES.CONTROL]: {
        strategy: 'standard',
        prioritizeLocal: false,
        localBoostFactor: 0
      }
    };

    // Add treatment variations based on config
    if (config.variations.treatment_1) {
      variations[VARIATION_TYPES.TREATMENT_1] = {
        strategy: 'proximity_boost',
        prioritizeLocal: true,
        localBoostFactor: config.localBoostFactors?.treatment_1 || 0.2
      };
    }

    if (config.variations.treatment_2) {
      variations[VARIATION_TYPES.TREATMENT_2] = {
        strategy: 'region_match',
        prioritizeLocal: true,
        localBoostFactor: config.localBoostFactors?.treatment_2 || 0.3,
        requireRegionMatch: true
      };
    }

    if (config.variations.treatment_3) {
      variations[VARIATION_TYPES.TREATMENT_3] = {
        strategy: 'hybrid',
        prioritizeLocal: true,
        localBoostFactor: config.localBoostFactors?.treatment_3 || 0.25,
        maxDistanceKm: config.maxDistanceKm || 100,
        distanceWeight: config.distanceWeight || 0.4
      };
    }

    const experiment = {
      type: EXPERIMENT_TYPES.GEOGRAPHIC_MATCHING,
      name: config.name || 'Geographic Matching Experiment',
      description: config.description || 'Testing different geographic prioritization strategies',
      variations,
      distribution: config.distribution || null, // Use default if not specified
      targetUserSegment: config.targetUserSegment || 'all',
      targetRegions: config.targetRegions || ['all']
    };

    this.experimentManager.registerExperiment(experimentId, experiment);
    return experimentId;
  }

  /**
   * Get geographic matching configuration for a user
   * @param {string} experimentId - Experiment ID
   * @param {string} userId - User ID
   * @param {Object} locationData - User location data
   * @returns {Object} - Geographic matching configuration
   */
  getGeoMatchingConfig(experimentId, userId, locationData = {}) {
    const experiment = this.experimentManager.getExperiment(experimentId);
    if (!experiment || experiment.status !== 'active') {
      // Return default config if experiment not found or not active
      return {
        strategy: 'standard',
        prioritizeLocal: false,
        localBoostFactor: 0
      };
    }

    // Check if user is in target regions
    if (experiment.targetRegions && experiment.targetRegions.length > 0 &&
        experiment.targetRegions[0] !== 'all') {
      const userRegion = locationData.region || 'unknown';
      if (!experiment.targetRegions.includes(userRegion)) {
        // User not in target regions, return default config
        return {
          strategy: 'standard',
          prioritizeLocal: false,
          localBoostFactor: 0
        };
      }
    }

    // Get user's variation
    const variation = this.experimentManager.getUserVariation(userId, experimentId) ||
                      this.experimentManager.assignUserToVariation(userId, experimentId);

    // Track impression
    this.experimentManager.trackExperimentEvent(experimentId, userId, 'impression', {
      experiment_type: EXPERIMENT_TYPES.GEOGRAPHIC_MATCHING,
      location: locationData
    });

    // Return the configuration for this variation
    return {
      ...experiment.variations[variation],
      _experimentId: experimentId,
      _variation: variation,
      _experimentType: 'geographic_matching_experiment'
    };
  }

  /**
   * Apply geographic boosting to expert scores
   * @param {Array} experts - Scored experts
   * @param {Object} geoConfig - Geographic configuration
   * @param {Object} userLocation - User location data
   * @returns {Array} - Experts with geo-adjusted scores
   */
  applyGeographicBoosting(experts, geoConfig, userLocation) {
    if (!experts || !geoConfig || !userLocation) {
      return experts;
    }

    return experts.map(expert => {
      let geoBoost = 0;
      let geoScore = 0;
      const expertLocation = expert.location || {};

      if (geoConfig.strategy === 'standard' || !geoConfig.prioritizeLocal) {
        // No geographic boosting
        geoBoost = 0;
      } else if (geoConfig.strategy === 'proximity_boost') {
        // Simple boost for local experts
        if (expertLocation.region === userLocation.region) {
          geoBoost = geoConfig.localBoostFactor;
        }
      } else if (geoConfig.strategy === 'region_match') {
        // Require region match
        if (expertLocation.region === userLocation.region) {
          geoBoost = geoConfig.localBoostFactor;
        } else if (geoConfig.requireRegionMatch) {
          geoBoost = -0.5; // Penalize non-local experts if requiring region match
        }
      } else if (geoConfig.strategy === 'hybrid') {
        // Calculate distance-based score if coordinates available
        if (userLocation.latitude && userLocation.longitude &&
            expertLocation.latitude && expertLocation.longitude) {
          const distance = this.calculateDistance(
            userLocation.latitude, userLocation.longitude,
            expertLocation.latitude, expertLocation.longitude
          );

          // Score decreases as distance increases, up to maxDistanceKm
          const maxDistance = geoConfig.maxDistanceKm || 100;
          const distanceScore = Math.max(0, 1 - (distance / maxDistance));

          geoScore = distanceScore * geoConfig.distanceWeight;
        }

        // Still give region boost
        if (expertLocation.region === userLocation.region) {
          geoBoost = geoConfig.localBoostFactor;
        }
      }

      // Apply geographic boost to the match score
      const geoAdjustedScore = expert.matchScore * (1 + geoBoost) + geoScore;

      return {
        ...expert,
        matchScore: geoAdjustedScore,
        originalMatchScore: expert.matchScore,
        geoBoostApplied: geoBoost,
        geoScore,
        distanceKm: this.calculateDistance(
          userLocation.latitude, userLocation.longitude,
          expertLocation.latitude, expertLocation.longitude
        )
      };
    });
  }

  /**
   * Calculate distance between two points using Haversine formula
   * @param {number} lat1 - Latitude of point 1
   * @param {number} lon1 - Longitude of point 1
   * @param {number} lat2 - Latitude of point 2
   * @param {number} lon2 - Longitude of point 2
   * @returns {number} - Distance in kilometers
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;

    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return distance;
  }

  /**
   * Convert degrees to radians
   * @param {number} deg - Degrees
   * @returns {number} - Radians
   */
  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  /**
   * Track when user views expert results
   * @param {string} experimentId - Experiment ID
   * @param {string} userId - User ID
   * @param {Object} locationData - User location data
   * @param {Object} data - Additional data
   */
  trackResultsView(experimentId, userId, locationData, data = {}) {
    this.experimentManager.trackExperimentEvent(experimentId, userId, 'view', {
      experiment_type: EXPERIMENT_TYPES.GEOGRAPHIC_MATCHING,
      location: locationData,
      experts_shown: data.expertsShown || 0,
      local_experts_shown: data.localExpertsShown || 0,
      ...data
    });
  }

  /**
   * Track when user selects an expert
   * @param {string} experimentId - Experiment ID
   * @param {string} userId - User ID
   * @param {string} expertId - Expert ID
   * @param {Object} data - Additional data
   */
  trackExpertSelection(experimentId, userId, expertId, data = {}) {
    this.experimentManager.trackExperimentEvent(experimentId, userId, 'click', {
      experiment_type: EXPERIMENT_TYPES.GEOGRAPHIC_MATCHING,
      expert_id: expertId,
      is_local_expert: data.isLocalExpert || false,
      distance_km: data.distanceKm,
      ...data
    });
  }

  /**
   * Track when a session is booked
   * @param {string} experimentId - Experiment ID
   * @param {string} userId - User ID
   * @param {string} expertId - Expert ID
   * @param {Object} data - Additional data
   */
  trackSessionBooked(experimentId, userId, expertId, data = {}) {
    this.experimentManager.trackExperimentEvent(experimentId, userId, 'action', {
      experiment_type: EXPERIMENT_TYPES.GEOGRAPHIC_MATCHING,
      expert_id: expertId,
      is_local_expert: data.isLocalExpert || false,
      booking_type: data.bookingType,
      ...data
    });
  }
}

// Create and export singleton instances
const experimentManager = new ExperimentManager();
const expertMatchingExperiment = new ExpertMatchingExperiment(experimentManager);
const expertPresentationExperiment = new ExpertPresentationExperiment(experimentManager);
const geographicMatchingExperiment = new GeographicMatchingExperiment(experimentManager);

export {
  experimentManager,
  expertMatchingExperiment,
  expertPresentationExperiment,
  geographicMatchingExperiment
};
