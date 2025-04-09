import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import xssClean from 'xss-clean';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import { v4 as uuidv4 } from 'uuid';

/**
 * Configure and return all security middleware
 * @returns {Object} Object containing all security middleware
 */
export const configureSecurityMiddleware = () => {
  // Set security HTTP headers
  const helmetMiddleware = helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "js.stripe.com", "cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "cdn.jsdelivr.net"],
        fontSrc: ["'self'", "fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "res.cloudinary.com", "*.stripe.com", "same-assets.com"],
        connectSrc: ["'self'", "*.stripe.com", "api.paypal.com", "*.paypal.com"],
        frameSrc: ["'self'", "js.stripe.com", "hooks.stripe.com", "*.paypal.com"],
        objectSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false, // Allow loading resources from different origins
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' } // Needed for OAuth popups
  });

  // Rate limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests from this IP, please try again later',
    skipSuccessfulRequests: false, // Count successful responses in rate limiting
  });

  // More strict rate limiting for authentication routes
  const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 login attempts per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many login attempts from this IP, please try again after an hour',
    skipSuccessfulRequests: true, // Don't count successful logins
  });

  // Sanitize data against NoSQL query injection
  const mongoSanitizeMiddleware = mongoSanitize({
    replaceWith: '_',
    allowDots: true, // Allow dots in property names
  });

  // Clean user input to prevent XSS attacks
  const xssMiddleware = xssClean();

  // Prevent HTTP Parameter Pollution attacks
  const hppMiddleware = hpp({
    whitelist: [
      'sort', 'fields', 'page', 'limit', // Common query params
      'startDate', 'endDate', 'status'   // Business-specific params
    ]
  });

  // Add request ID to each request for tracking
  const requestIdMiddleware = (req, res, next) => {
    req.id = uuidv4();
    // Add request ID to response headers
    res.setHeader('X-Request-ID', req.id);
    next();
  };

  // CORS preflight options for sensitive routes
  const corsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Define allowed origins
      const allowedOrigins = [
        'https://example.com',
        'https://www.example.com',
        'http://localhost:3000'
      ];

      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Request-ID'],
    credentials: true,
    maxAge: 86400 // CORS preflight request cache in seconds (24 hours)
  };

  return {
    helmetMiddleware,
    apiLimiter,
    authLimiter,
    mongoSanitizeMiddleware,
    xssMiddleware,
    hppMiddleware,
    requestIdMiddleware,
    corsOptions
  };
};

/**
 * Simple middleware to block access in maintenance mode
 */
export const maintenanceMode = (req, res, next) => {
  if (process.env.MAINTENANCE_MODE === 'true') {
    res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable. We are currently performing maintenance.',
      retryAfter: 3600 // in seconds
    });
  } else {
    next();
  }
};

export default {
  configureSecurityMiddleware,
  maintenanceMode
};
