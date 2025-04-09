import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Get an environment variable with error handling
 * @param {string} name - The name of the environment variable
 * @param {string} defaultValue - Optional default value if not found
 * @returns {string} The environment variable value or default
 */
export const getEnvVar = (name, defaultValue = '') => {
  const value = process.env[name];

  if (!value && defaultValue === '') {
    console.warn(`Environment variable ${name} is not set`);
  }

  return value || defaultValue;
};

/**
 * Check if the environment is production
 * @returns {boolean} True if NODE_ENV is 'production'
 */
export const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Check if the environment is development
 * @returns {boolean} True if NODE_ENV is 'development' or not set
 */
export const isDevelopment = () => {
  return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
};

/**
 * Check if the environment is test
 * @returns {boolean} True if NODE_ENV is 'test'
 */
export const isTest = () => {
  return process.env.NODE_ENV === 'test';
};

/**
 * Get the server port
 * @returns {number} The server port
 */
export const getPort = () => {
  return parseInt(process.env.PORT || '3000', 10);
};

/**
 * Get the MongoDB URI
 * @returns {string} The MongoDB URI
 */
export const getMongoURI = () => {
  return process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-system';
};

/**
 * Get the JWT secret
 * @returns {string} The JWT secret
 */
export const getJwtSecret = () => {
  return process.env.JWT_SECRET || 'default_jwt_secret';
};

export default {
  getEnvVar,
  isProduction,
  isDevelopment,
  isTest,
  getPort,
  getMongoURI,
  getJwtSecret
};
