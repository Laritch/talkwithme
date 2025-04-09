/**
 * ML Model Infrastructure
 *
 * This file provides the foundation for ML models including:
 * - Feature engineering utilities
 * - Model evaluation metrics
 * - Model training pipeline
 * - Prediction serving
 */

// Feature types for different kinds of data
const FEATURE_TYPES = {
  CATEGORICAL: 'categorical',  // For discrete categories (device type, browser, etc.)
  NUMERICAL: 'numerical',      // For continuous values (time, duration, etc.)
  TEMPORAL: 'temporal',        // For time-based features (hour of day, day of week)
  BOOLEAN: 'boolean'           // For true/false features
};

/**
 * Feature definitions for notification optimization
 * These define the inputs that will be used for ML models
 */
export const FEATURES = {
  // User context features
  USER_DEVICE_TYPE: {
    name: 'user_device_type',
    type: FEATURE_TYPES.CATEGORICAL,
    possibleValues: ['desktop', 'mobile', 'tablet'],
    defaultValue: 'desktop'
  },
  USER_BROWSER: {
    name: 'user_browser',
    type: FEATURE_TYPES.CATEGORICAL,
    possibleValues: ['Chrome', 'Firefox', 'Safari', 'Edge', 'IE', 'Opera', 'Other'],
    defaultValue: 'Chrome'
  },
  USER_OS: {
    name: 'user_os',
    type: FEATURE_TYPES.CATEGORICAL,
    possibleValues: ['Windows', 'macOS', 'Linux', 'iOS', 'Android', 'Other'],
    defaultValue: 'Windows'
  },
  USER_LANGUAGE: {
    name: 'user_language',
    type: FEATURE_TYPES.CATEGORICAL,
    possibleValues: ['en', 'es', 'fr', 'de', 'Other'],
    defaultValue: 'en'
  },
  USER_REGION: {
    name: 'user_region',
    type: FEATURE_TYPES.CATEGORICAL,
    possibleValues: ['US', 'EU', 'UK', 'CA', 'AU', 'Other'],
    defaultValue: 'US'
  },

  // Temporal features
  TIME_OF_DAY: {
    name: 'time_of_day',
    type: FEATURE_TYPES.NUMERICAL,
    min: 0,
    max: 24,
    defaultValue: 12
  },
  DAY_OF_WEEK: {
    name: 'day_of_week',
    type: FEATURE_TYPES.CATEGORICAL,
    possibleValues: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    defaultValue: 'Monday'
  },
  IS_BUSINESS_HOURS: {
    name: 'is_business_hours',
    type: FEATURE_TYPES.BOOLEAN,
    defaultValue: true
  },

  // Notification features
  NOTIFICATION_TYPE: {
    name: 'notification_type',
    type: FEATURE_TYPES.CATEGORICAL,
    possibleValues: [
      'compliance_update', 'license_expiry', 'regulatory_change', 'gdpr_update',
      'hipaa_update', 'regional_restriction', 'timezone_conflict', 'system'
    ],
    defaultValue: 'system'
  },
  NOTIFICATION_PRIORITY: {
    name: 'notification_priority',
    type: FEATURE_TYPES.CATEGORICAL,
    possibleValues: ['low', 'medium', 'high', 'critical'],
    defaultValue: 'medium'
  },
  ACTION_REQUIRED: {
    name: 'action_required',
    type: FEATURE_TYPES.BOOLEAN,
    defaultValue: false
  },
  HAS_LINK: {
    name: 'has_link',
    type: FEATURE_TYPES.BOOLEAN,
    defaultValue: true
  },

  // Historical engagement features
  PREVIOUS_VIEW_RATE: {
    name: 'previous_view_rate',
    type: FEATURE_TYPES.NUMERICAL,
    min: 0,
    max: 1,
    defaultValue: 0.5
  },
  PREVIOUS_CLICK_RATE: {
    name: 'previous_click_rate',
    type: FEATURE_TYPES.NUMERICAL,
    min: 0,
    max: 1,
    defaultValue: 0.1
  },
  PREVIOUS_CONVERSION_RATE: {
    name: 'previous_conversion_rate',
    type: FEATURE_TYPES.NUMERICAL,
    min: 0,
    max: 1,
    defaultValue: 0.05
  },
  AVG_RESPONSE_TIME: {
    name: 'avg_response_time',
    type: FEATURE_TYPES.NUMERICAL,
    min: 0,
    max: 86400, // 24 hours in seconds
    defaultValue: 300 // 5 minutes
  }
};

/**
 * Target variables for different ML models
 * These define what we're trying to predict
 */
export const TARGETS = {
  // For timing optimization
  OPTIMAL_SEND_TIME: {
    name: 'optimal_send_time',
    type: FEATURE_TYPES.NUMERICAL,
    min: 0,
    max: 24,
    description: 'The optimal hour of day to send a notification'
  },

  // For priority prediction
  PREDICTED_PRIORITY: {
    name: 'predicted_priority',
    type: FEATURE_TYPES.CATEGORICAL,
    possibleValues: ['low', 'medium', 'high', 'critical'],
    description: 'The predicted importance level of a notification'
  },

  // For engagement prediction
  WILL_VIEW: {
    name: 'will_view',
    type: FEATURE_TYPES.BOOLEAN,
    description: 'Whether user will view the notification'
  },
  WILL_CLICK: {
    name: 'will_click',
    type: FEATURE_TYPES.BOOLEAN,
    description: 'Whether user will click the notification'
  },
  WILL_TAKE_ACTION: {
    name: 'will_take_action',
    type: FEATURE_TYPES.BOOLEAN,
    description: 'Whether user will complete the requested action'
  }
};

/**
 * Model evaluation metrics
 * These define how we measure model performance
 */
export const EVALUATION_METRICS = {
  // For classification models (priority prediction, engagement prediction)
  ACCURACY: {
    name: 'accuracy',
    description: 'Proportion of predictions that are correct',
    higherIsBetter: true,
    range: [0, 1]
  },
  PRECISION: {
    name: 'precision',
    description: 'Proportion of positive predictions that are correct',
    higherIsBetter: true,
    range: [0, 1]
  },
  RECALL: {
    name: 'recall',
    description: 'Proportion of actual positives that are predicted correctly',
    higherIsBetter: true,
    range: [0, 1]
  },
  F1_SCORE: {
    name: 'f1_score',
    description: 'Harmonic mean of precision and recall',
    higherIsBetter: true,
    range: [0, 1]
  },

  // For regression models (timing optimization)
  MEAN_ABSOLUTE_ERROR: {
    name: 'mean_absolute_error',
    description: 'Average absolute difference between predicted and actual values',
    higherIsBetter: false,
    range: [0, Infinity]
  },
  ROOT_MEAN_SQUARE_ERROR: {
    name: 'root_mean_square_error',
    description: 'Square root of the average squared differences',
    higherIsBetter: false,
    range: [0, Infinity]
  }
};

/**
 * Feature engineering functions
 * These transform raw data into model features
 */

/**
 * Extract hour of day from a timestamp
 * @param {string|Date} timestamp - The timestamp to extract from
 * @returns {number} - Hour of day (0-23)
 */
export function extractHourOfDay(timestamp) {
  const date = new Date(timestamp);
  return date.getHours();
}

/**
 * Extract day of week from a timestamp
 * @param {string|Date} timestamp - The timestamp to extract from
 * @returns {string} - Day of week (Monday, Tuesday, etc.)
 */
export function extractDayOfWeek(timestamp) {
  const date = new Date(timestamp);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

/**
 * Check if a timestamp is during business hours (9am-5pm local time, Mon-Fri)
 * @param {string|Date} timestamp - The timestamp to check
 * @returns {boolean} - True if within business hours
 */
export function isBusinessHours(timestamp) {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const day = date.getDay(); // 0 is Sunday, 6 is Saturday

  return day >= 1 && day <= 5 && hours >= 9 && hours < 17;
}

/**
 * Normalize a numerical value to a 0-1 range
 * @param {number} value - The value to normalize
 * @param {number} min - Minimum possible value
 * @param {number} max - Maximum possible value
 * @returns {number} - Normalized value (0-1)
 */
export function normalizeValue(value, min, max) {
  if (max === min) return 0.5; // Avoid division by zero
  return (value - min) / (max - min);
}

/**
 * One-hot encode a categorical feature
 * @param {string} value - The categorical value
 * @param {Array<string>} possibleValues - All possible values for this category
 * @returns {Object} - Object with each possible value as a key and 1/0 as values
 */
export function oneHotEncode(value, possibleValues) {
  const encoded = {};
  for (const possibleValue of possibleValues) {
    encoded[possibleValue] = value === possibleValue ? 1 : 0;
  }
  return encoded;
}

/**
 * Engineer all features for a notification event
 * @param {Object} notification - Notification data
 * @param {Object} context - User context data
 * @param {Object} history - User's engagement history
 * @returns {Object} - Engineered features
 */
export function engineerFeatures(notification, context, history) {
  const timestamp = notification.timestamp || new Date().toISOString();

  return {
    // User context features
    [FEATURES.USER_DEVICE_TYPE.name]: context.deviceType || FEATURES.USER_DEVICE_TYPE.defaultValue,
    [FEATURES.USER_BROWSER.name]: context.browser || FEATURES.USER_BROWSER.defaultValue,
    [FEATURES.USER_OS.name]: context.os || FEATURES.USER_OS.defaultValue,
    [FEATURES.USER_LANGUAGE.name]: context.language || FEATURES.USER_LANGUAGE.defaultValue,
    [FEATURES.USER_REGION.name]: context.region || FEATURES.USER_REGION.defaultValue,

    // Temporal features
    [FEATURES.TIME_OF_DAY.name]: extractHourOfDay(timestamp),
    [FEATURES.DAY_OF_WEEK.name]: extractDayOfWeek(timestamp),
    [FEATURES.IS_BUSINESS_HOURS.name]: isBusinessHours(timestamp),

    // Notification features
    [FEATURES.NOTIFICATION_TYPE.name]: notification.type || FEATURES.NOTIFICATION_TYPE.defaultValue,
    [FEATURES.NOTIFICATION_PRIORITY.name]: notification.priority || FEATURES.NOTIFICATION_PRIORITY.defaultValue,
    [FEATURES.ACTION_REQUIRED.name]: notification.actionRequired || FEATURES.ACTION_REQUIRED.defaultValue,
    [FEATURES.HAS_LINK.name]: !!notification.link,

    // Historical engagement features
    [FEATURES.PREVIOUS_VIEW_RATE.name]: history.viewRate || FEATURES.PREVIOUS_VIEW_RATE.defaultValue,
    [FEATURES.PREVIOUS_CLICK_RATE.name]: history.clickRate || FEATURES.PREVIOUS_CLICK_RATE.defaultValue,
    [FEATURES.PREVIOUS_CONVERSION_RATE.name]: history.conversionRate || FEATURES.PREVIOUS_CONVERSION_RATE.defaultValue,
    [FEATURES.AVG_RESPONSE_TIME.name]: history.avgResponseTime || FEATURES.AVG_RESPONSE_TIME.defaultValue
  };
}

/**
 * Base model class with common functionality
 */
export class BaseModel {
  constructor(modelConfig) {
    this.modelConfig = modelConfig;
    this.modelName = modelConfig.name;
    this.targetVariable = modelConfig.targetVariable;
    this.features = modelConfig.features;
    this.trainedModel = null;
  }

  /**
   * Process input for prediction
   * @param {Object} input - Raw input data
   * @returns {Object} - Processed feature vector
   */
  processInput(input) {
    // Default implementation for preprocessing
    const { notification, context, history } = input;
    return engineerFeatures(notification, context, history);
  }

  /**
   * Train the model on data
   * @param {Array} trainingData - Array of training examples
   * @returns {Promise<Object>} - Training results
   */
  async train(trainingData) {
    // To be implemented by specific model subclasses
    throw new Error('train() method must be implemented by subclass');
  }

  /**
   * Make a prediction using the trained model
   * @param {Object} input - Input data
   * @returns {Promise<Object>} - Prediction result
   */
  async predict(input) {
    if (!this.trainedModel) {
      throw new Error('Model must be trained before making predictions');
    }

    // To be implemented by specific model subclasses
    throw new Error('predict() method must be implemented by subclass');
  }

  /**
   * Evaluate model performance on test data
   * @param {Array} testData - Array of test examples
   * @returns {Promise<Object>} - Evaluation metrics
   */
  async evaluate(testData) {
    if (!this.trainedModel) {
      throw new Error('Model must be trained before evaluation');
    }

    // To be implemented by specific model subclasses
    throw new Error('evaluate() method must be implemented by subclass');
  }

  /**
   * Save the trained model
   * @returns {Promise<boolean>} - Success flag
   */
  async saveModel() {
    // In a real implementation, this would save to a file or database
    console.log(`Saving model ${this.modelName}`);
    return true;
  }

  /**
   * Load a saved model
   * @returns {Promise<boolean>} - Success flag
   */
  async loadModel() {
    // In a real implementation, this would load from a file or database
    console.log(`Loading model ${this.modelName}`);
    return false;
  }
}

// Export the whole module
export default {
  FEATURES,
  TARGETS,
  EVALUATION_METRICS,
  FEATURE_TYPES,
  engineerFeatures,
  extractHourOfDay,
  extractDayOfWeek,
  isBusinessHours,
  normalizeValue,
  oneHotEncode,
  BaseModel
};
