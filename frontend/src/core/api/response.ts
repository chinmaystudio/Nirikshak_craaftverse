export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function successResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export function errorResponse<T = never>(code: string, message: string, details?: unknown): ApiResponse<T> {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}
