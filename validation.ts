import { NextApiRequest, NextApiResponse } from 'next';
import { z, ZodError, ZodType } from 'zod';

/**
 * Error response format
 */
export interface ValidationErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details: Record<string, string[]>;
  };
}

/**
 * Validate query parameters
 *
 * @param schema Zod schema to validate against
 * @param query Query parameters to validate
 * @returns Validated data or throws ZodError
 */
export function validateQuery<T>(schema: ZodType<T>, query: NextApiRequest['query']): T {
  return schema.parse(query);
}

/**
 * Validate request body
 *
 * @param schema Zod schema to validate against
 * @param body Request body to validate
 * @returns Validated data or throws ZodError
 */
export function validateBody<T>(schema: ZodType<T>, body: NextApiRequest['body']): T {
  return schema.parse(body);
}

/**
 * Format ZodError for API response
 *
 * @param error ZodError
 * @returns Formatted error response
 */
export function formatZodError(error: ZodError): ValidationErrorResponse {
  const details: Record<string, string[]> = {};

  error.errors.forEach(err => {
    const path = err.path.join('.');
    if (!details[path]) {
      details[path] = [];
    }
    details[path].push(err.message);
  });

  return {
    success: false,
    error: {
      message: 'Validation error',
      code: 'validation_error',
      details,
    },
  };
}

/**
 * Validate API request with schema
 *
 * @param handler API route handler
 * @param bodySchema Schema for request body
 * @param querySchema Schema for query parameters
 * @returns New handler with validation
 */
export function withValidation<B, Q>(
  handler: (
    req: NextApiRequest & { validatedBody?: B; validatedQuery?: Q },
    res: NextApiResponse
  ) => Promise<void> | void,
  bodySchema?: ZodType<B>,
  querySchema?: ZodType<Q>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Validate body if schema provided and request has a body
      if (bodySchema && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
        (req as any).validatedBody = validateBody(bodySchema, req.body);
      }

      // Validate query parameters if schema provided
      if (querySchema) {
        (req as any).validatedQuery = validateQuery(querySchema, req.query);
      }

      // Call the original handler with validated data
      return await handler(req as any, res);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json(formatZodError(error));
      }

      // For any other errors, let the handler deal with it
      return await handler(req, res);
    }
  };
}

/**
 * Higher-order function to create a validated API handler
 *
 * @example
 * ```
 * export default createValidatedHandler({
 *   POST: {
 *     handler: createCourse,
 *     bodySchema: courseCreateSchema,
 *   },
 *   GET: {
 *     handler: getCourses,
 *     querySchema: courseSearchParamsSchema,
 *   },
 * });
 * ```
 */
export function createValidatedHandler<B = any, Q = any>(config: {
  [method: string]: {
    handler: (
      req: NextApiRequest & { validatedBody?: B; validatedQuery?: Q },
      res: NextApiResponse
    ) => Promise<void> | void;
    bodySchema?: ZodType<B>;
    querySchema?: ZodType<Q>;
  };
}) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const method = req.method || 'GET';
    const methodConfig = config[method];

    if (!methodConfig) {
      return res.status(405).json({
        success: false,
        error: {
          message: `Method ${method} Not Allowed`,
          code: 'method_not_allowed',
        },
      });
    }

    const { handler, bodySchema, querySchema } = methodConfig;

    try {
      // Validate body if schema provided and request has a body
      if (bodySchema && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        (req as any).validatedBody = validateBody(bodySchema, req.body);
      }

      // Validate query parameters if schema provided
      if (querySchema) {
        (req as any).validatedQuery = validateQuery(querySchema, req.query);
      }

      // Call the handler with validated data
      return await handler(req as any, res);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json(formatZodError(error));
      }

      // For other errors, return a 500
      console.error('API error:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error',
          code: 'internal_server_error',
        },
      });
    }
  };
}
