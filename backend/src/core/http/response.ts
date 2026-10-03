import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export const ApiResponseHelper = {
  success<T>(res: Response, data: T, statusCode = 200): Response {
    return res.status(statusCode).json({
      success: true,
      data,
    });
  },

  created<T>(res: Response, data: T): Response {
    return res.status(201).json({
      success: true,
      data,
    });
  },

  error(res: Response, code: string, message: string, statusCode = 400): Response {
    return res.status(statusCode).json({
      success: false,
      error: { code, message },
    });
  },

  unauthorized(res: Response, message = 'Authentication required'): Response {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message },
    });
  },

  forbidden(res: Response, message = 'Access denied'): Response {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message },
    });
  },

  notFound(res: Response, message = 'Resource not found'): Response {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message },
    });
  },

  validationError(res: Response, message = 'Validation failed'): Response {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message },
    });
  },

  internal(res: Response, message = 'Internal server error'): Response {
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message },
    });
  },
};
