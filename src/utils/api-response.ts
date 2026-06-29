/**
 * API Response Factory
 * Consistent response format for frontend-backend communication.
 */
type ApiError = {
  code: string;
  details?: string;
};

export interface ApiResponse<T> {
  success: boolean;
  status: number;
  message: string;
  data: T | null;
  error?: ApiError;
}

type ApiResponseParams<T> = Omit<ApiResponse<T>, 'data'> & {
  data?: T | null;
};

/**
 * Common HTTP status codes.
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500
} as const;

/**
 * Create a consistent API response.
 */
export const ApiResponse = <T>(params: ApiResponseParams<T>): ApiResponse<T> => ({
  success: params.success,
  status: params.status,
  message: params.message,
  data: params.data ?? null,
  error: params.error
});
