export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Unauthorized: Please check your credentials.';
    if (error.status === 403) return 'Forbidden: You do not have permission to access this resource.';
    if (error.status === 404) return 'Resource not found.';
    if (error.status === 413) return 'File too large: Maximum size is 10 MB.';
    if (error.status === 422) return 'Validation error: Invalid request payload.';
    if (error.status === 429) return 'Rate limit exceeded: Please wait before trying again.';
    if (error.status >= 500) return 'Server error: The backend encountered an unexpected condition.';
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected network error occurred.';
}
