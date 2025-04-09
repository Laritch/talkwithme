import React from 'react';

/**
 * Client-side Error Handler for the Resource Library Application
 * Helps diagnose and resolve 502 Bad Gateway errors and other issues
 */

// Configure error logging
const ENABLE_DETAILED_LOGGING = true;
const MAX_ERROR_LOG_SIZE = 50;

/**
 * Custom error class for API errors with status codes
 */
export class ApiError extends Error {
  /**
   * Create a new API error
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {Error|null} originalError - Original error object if available
   */
  constructor(statusCode, message, originalError = null) {
    super(message);
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.isOperational = true; // Indicates if this is an expected error

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Create a 502 Bad Gateway error
   * @param {string} message - Error message
   * @param {Error} originalError - Original error object
   * @returns {ApiError} - Gateway error
   */
  static badGateway(message = 'Bad Gateway', originalError = null) {
    return new ApiError(502, message, originalError);
  }
}

// Error log storage
let errorLogs = [];

/**
 * Log an error with detailed information
 * @param {Error} error - Error to log
 * @param {Object} context - Additional context information
 */
export const logError = (error, context = {}) => {
  if (!ENABLE_DETAILED_LOGGING) return;

  const errorInfo = {
    timestamp: new Date().toISOString(),
    message: error.message || 'Unknown error',
    stack: error.stack,
    ...context
  };

  // Add specific info for ApiError instances
  if (error instanceof ApiError) {
    errorInfo.statusCode = error.statusCode;
    errorInfo.isOperational = error.isOperational;

    if (error.originalError) {
      errorInfo.originalError = {
        message: error.originalError.message,
        stack: error.originalError.stack
      };
    }
  }

  // Browser info
  errorInfo.userAgent = navigator.userAgent;
  errorInfo.url = window.location.href;
  errorInfo.viewportWidth = window.innerWidth;
  errorInfo.viewportHeight = window.innerHeight;

  // Performance data if available
  if (window.performance) {
    const perfData = window.performance.timing;
    errorInfo.performance = {
      loadTime: perfData.loadEventEnd - perfData.navigationStart,
      domReadyTime: perfData.domComplete - perfData.domLoading,
      networkLatency: perfData.responseEnd - perfData.requestStart
    };
  }

  // Log to console
  console.error('ERROR LOGGED:', errorInfo);

  // Store in memory (limited size)
  errorLogs.unshift(errorInfo);
  if (errorLogs.length > MAX_ERROR_LOG_SIZE) {
    errorLogs = errorLogs.slice(0, MAX_ERROR_LOG_SIZE);
  }

  // Attempt to store in localStorage
  try {
    localStorage.setItem('errorLogs', JSON.stringify(errorLogs));
  } catch (e) {
    console.warn('Could not save error logs to localStorage', e);
  }
};

/**
 * Check if there are network connectivity issues
 * @returns {Promise<boolean>} - True if network is working
 */
export const checkNetworkConnectivity = async () => {
  try {
    // Try to fetch a small resource to check connectivity
    const response = await fetch('/favicon.ico', {
      method: 'HEAD',
      cache: 'no-cache',
      headers: { 'pragma': 'no-cache' }
    });
    return response.ok;
  } catch (error) {
    logError(error, { context: 'Network connectivity check' });
    return false;
  }
};

/**
 * Handle a 502 Bad Gateway error
 * @param {Error} error - The original error
 * @param {Function} retryFn - Function to retry the operation
 * @param {Object} context - Additional context
 */
export const handle502Error = async (error, retryFn, context = {}) => {
  // Create an ApiError if not already one
  const apiError = error instanceof ApiError ?
    error :
    ApiError.badGateway('Server communication error', error);

  // Log the error
  logError(apiError, { ...context, handling: '502 Bad Gateway' });

  // Check network connectivity
  const isNetworkWorking = await checkNetworkConnectivity();

  if (!isNetworkWorking) {
    console.error('Network connectivity issues detected');
    // Could show offline message to user here
    return;
  }

  // Automatically retry after delay if retry function provided
  if (typeof retryFn === 'function') {
    console.log('Retrying operation after delay...');
    setTimeout(() => {
      retryFn();
    }, 2000);
  }
};

/**
 * Clear all error logs
 */
export const clearErrorLogs = () => {
  errorLogs = [];
  try {
    localStorage.removeItem('errorLogs');
  } catch (e) {
    console.warn('Could not clear error logs from localStorage', e);
  }
};

/**
 * Get all recorded error logs
 * @returns {Array} - Array of error logs
 */
export const getErrorLogs = () => {
  return [...errorLogs];
};

/**
 * Global error boundary component for React
 * @param {Object} props - React props
 * @returns {Object} - React component
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logError(error, {
      componentStack: errorInfo.componentStack,
      context: 'React Error Boundary'
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="error-boundary">
          <h2>Something went wrong.</h2>
          <p>The application encountered an unexpected error. Please try refreshing the page.</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Export the error handler functions
export default {
  ApiError,
  logError,
  handle502Error,
  checkNetworkConnectivity,
  getErrorLogs,
  clearErrorLogs,
  ErrorBoundary
};
