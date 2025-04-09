import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { ApiError } from '../utils/errorHandler.js';

// Initialize Ajv with all options
const ajv = new Ajv({
  allErrors: true,          // Return all errors, not just the first one
  removeAdditional: true,   // Remove additional properties (not in schema)
  useDefaults: true,        // Apply default values from schema
  coerceTypes: true,        // Convert types if possible (e.g., string to number)
  strict: false             // Don't enforce strict mode for better user experience
});

// Add format validators (email, date, etc.)
addFormats(ajv);

// Add custom formats
ajv.addFormat('phone', /^\+?[1-9]\d{1,14}$/); // Simple international phone format
ajv.addFormat('username', /^[a-zA-Z0-9_]{3,30}$/); // Username format

/**
 * Middleware factory to validate request using specified JSON Schema
 *
 * @param {Object} schema - The JSON Schema for validation
 * @param {string} dataSource - The request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
export const validate = (schema, dataSource = 'body') => {
  return (req, res, next) => {
    const data = req[dataSource];
    const validate = ajv.compile(schema);
    const valid = validate(data);

    if (!valid) {
      // Format validation errors
      const errors = validate.errors.map(error => {
        let path = error.instancePath;
        if (path.startsWith('/')) {
          path = path.substring(1);
        }

        return {
          path: path || error.params.missingProperty || '(root)',
          message: error.message,
          keyword: error.keyword,
          params: error.params
        };
      });

      // Create a validation error with details
      const validationError = ApiError.validationError('Request validation failed');
      validationError.errors = errors;

      return next(validationError);
    }

    return next();
  };
};

/**
 * Common validation schemas for reuse
 */
export const schemas = {
  // User schemas
  registerUser: {
    type: 'object',
    required: ['username', 'email', 'password'],
    properties: {
      username: {
        type: 'string',
        format: 'username',
        minLength: 3,
        maxLength: 30
      },
      email: {
        type: 'string',
        format: 'email',
        maxLength: 255
      },
      password: {
        type: 'string',
        minLength: 6,
        maxLength: 100
      }
    },
    additionalProperties: false
  },

  loginUser: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email'
      },
      password: {
        type: 'string'
      }
    },
    additionalProperties: false
  },

  refreshToken: {
    type: 'object',
    required: ['refreshToken'],
    properties: {
      refreshToken: {
        type: 'string'
      }
    },
    additionalProperties: false
  },

  forgotPassword: {
    type: 'object',
    required: ['email'],
    properties: {
      email: {
        type: 'string',
        format: 'email'
      }
    },
    additionalProperties: false
  },

  resetPassword: {
    type: 'object',
    required: ['password'],
    properties: {
      password: {
        type: 'string',
        minLength: 6,
        maxLength: 100
      },
      confirmPassword: {
        type: 'string',
        minLength: 6,
        maxLength: 100
      }
    },
    additionalProperties: false
  },

  changePassword: {
    type: 'object',
    required: ['currentPassword', 'newPassword'],
    properties: {
      currentPassword: {
        type: 'string'
      },
      newPassword: {
        type: 'string',
        minLength: 6,
        maxLength: 100
      },
      confirmPassword: {
        type: 'string',
        minLength: 6,
        maxLength: 100
      }
    },
    additionalProperties: false
  },

  // Message schemas
  createMessage: {
    type: 'object',
    required: ['content'],
    properties: {
      content: {
        type: 'string',
        minLength: 1,
        maxLength: 5000
      },
      recipient: {
        type: 'string',
        pattern: '^[0-9a-fA-F]{24}$'
      },
      private: {
        type: 'boolean',
        default: false
      },
      attachmentUrl: {
        type: 'string',
        format: 'uri',
        nullable: true
      }
    },
    additionalProperties: false
  },

  // Payment schemas
  processPayment: {
    type: 'object',
    required: ['amount', 'currency', 'paymentMethod'],
    properties: {
      amount: {
        type: 'number',
        minimum: 0.01
      },
      currency: {
        type: 'string',
        enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']
      },
      paymentMethod: {
        type: 'string'
      },
      description: {
        type: 'string',
        nullable: true
      },
      metadata: {
        type: 'object',
        nullable: true
      }
    },
    additionalProperties: false
  },

  // Pagination parameters
  pagination: {
    type: 'object',
    properties: {
      page: {
        type: 'integer',
        minimum: 1,
        default: 1
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 20
      },
      sort: {
        type: 'string',
        nullable: true
      }
    },
    additionalProperties: true
  }
};

export default {
  validate,
  schemas
};
