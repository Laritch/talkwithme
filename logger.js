/**
 * Advanced logger utility for structured logging
 *
 * This provides consistent formatting and includes metadata with all logs
 */

/**
 * Log levels and their numerical values
 */
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  HTTP: 3,
  DEBUG: 4
};

// Get current logging level from environment or default to INFO
const getCurrentLogLevel = () => {
  const envLevel = process.env.LOG_LEVEL?.toUpperCase();
  if (envLevel && LOG_LEVELS[envLevel] !== undefined) {
    return LOG_LEVELS[envLevel];
  }
  // Default to INFO in production, DEBUG otherwise
  return process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;
};

// Current log level
let currentLogLevel = getCurrentLogLevel();

/**
 * Set the current logging level
 * @param {string} level - Log level (ERROR, WARN, INFO, HTTP, DEBUG)
 */
export const setLogLevel = (level) => {
  if (LOG_LEVELS[level.toUpperCase()] !== undefined) {
    currentLogLevel = LOG_LEVELS[level.toUpperCase()];
  }
};

/**
 * Format the log message with timestamp and metadata
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 * @returns {Object} Formatted log object
 */
const formatLog = (level, message, meta = {}) => {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    environment: process.env.NODE_ENV || 'development',
    ...meta
  };
};

/**
 * Check if the message should be logged based on current level
 * @param {number} messageLevel - Level of the message to log
 * @returns {boolean} Whether the message should be logged
 */
const shouldLog = (messageLevel) => {
  return messageLevel <= currentLogLevel;
};

/**
 * Log an error message
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 */
export const error = (message, meta = {}) => {
  if (shouldLog(LOG_LEVELS.ERROR)) {
    const formattedMessage = formatLog('ERROR', message, meta);
    // In production, we might send critical errors to an error tracking service
    console.error(JSON.stringify(formattedMessage));
  }
};

/**
 * Log a warning message
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 */
export const warn = (message, meta = {}) => {
  if (shouldLog(LOG_LEVELS.WARN)) {
    console.warn(JSON.stringify(formatLog('WARN', message, meta)));
  }
};

/**
 * Log an info message
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 */
export const info = (message, meta = {}) => {
  if (shouldLog(LOG_LEVELS.INFO)) {
    console.info(JSON.stringify(formatLog('INFO', message, meta)));
  }
};

/**
 * Log HTTP request details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} meta - Additional metadata
 */
export const http = (req, res, meta = {}) => {
  if (shouldLog(LOG_LEVELS.HTTP)) {
    const httpMeta = {
      method: req.method,
      url: req.url,
      ip: req.ip,
      statusCode: res.statusCode,
      responseTime: meta.responseTime,
      userAgent: req.headers['user-agent'],
      userId: req.user?._id,
      requestId: req.id
    };

    console.info(JSON.stringify(formatLog('HTTP', `${req.method} ${req.url}`, httpMeta)));
  }
};

/**
 * Log a debug message
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 */
export const debug = (message, meta = {}) => {
  if (shouldLog(LOG_LEVELS.DEBUG)) {
    console.debug(JSON.stringify(formatLog('DEBUG', message, meta)));
  }
};

/**
 * Create a middleware to log HTTP requests
 * @returns {Function} Express middleware function
 */
export const httpLogger = () => {
  return (req, res, next) => {
    const start = Date.now();

    // Log once the response is finished
    res.on('finish', () => {
      const responseTime = Date.now() - start;
      http(req, res, { responseTime });
    });

    next();
  };
};

export default {
  error,
  warn,
  info,
  http,
  debug,
  httpLogger,
  setLogLevel,
  LOG_LEVELS
};
