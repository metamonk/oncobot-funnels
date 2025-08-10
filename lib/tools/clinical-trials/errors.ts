/**
 * Consistent error handling for clinical trials tool
 */

export class ClinicalTrialsError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ClinicalTrialsError';
  }
}

export const ErrorCodes = {
  // API errors
  API_ERROR: 'API_ERROR',
  API_TIMEOUT: 'API_TIMEOUT',
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  
  // Search errors
  NO_RESULTS: 'NO_RESULTS',
  INVALID_QUERY: 'INVALID_QUERY',
  INVALID_NCT_ID: 'INVALID_NCT_ID',
  
  // Cache errors
  CACHE_MISS: 'CACHE_MISS',
  CACHE_EXPIRED: 'CACHE_EXPIRED',
  
  // Profile errors
  PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',
  PROFILE_INCOMPLETE: 'PROFILE_INCOMPLETE',
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code: ErrorCode;
  message: string;
  suggestion?: string;
  alternativeActions?: Array<{
    label: string;
    url?: string;
    action?: string;
  }>;
}

/**
 * Error handler utility
 */
export function handleError(error: unknown): ErrorResponse {
  if (error instanceof ClinicalTrialsError) {
    return {
      success: false,
      error: error.message,
      code: error.code as ErrorCode,
      message: getUserFriendlyMessage(error.code as ErrorCode),
      suggestion: getSuggestion(error.code as ErrorCode)
    };
  }
  
  // Handle generic errors
  const message = error instanceof Error ? error.message : 'Unknown error occurred';
  return {
    success: false,
    error: message,
    code: ErrorCodes.INTERNAL_ERROR,
    message: 'An unexpected error occurred while searching for clinical trials.',
    suggestion: 'Please try again or refine your search criteria.'
  };
}

function getUserFriendlyMessage(code: ErrorCode): string {
  const messages: Record<ErrorCode, string> = {
    [ErrorCodes.API_ERROR]: 'Unable to connect to ClinicalTrials.gov.',
    [ErrorCodes.API_TIMEOUT]: 'The search took too long to complete.',
    [ErrorCodes.API_RATE_LIMIT]: 'Too many requests. Please wait a moment.',
    [ErrorCodes.NO_RESULTS]: 'No clinical trials found matching your criteria.',
    [ErrorCodes.INVALID_QUERY]: 'The search query could not be understood.',
    [ErrorCodes.INVALID_NCT_ID]: 'The NCT ID appears to be invalid.',
    [ErrorCodes.CACHE_MISS]: 'Previous search results are no longer available.',
    [ErrorCodes.CACHE_EXPIRED]: 'Your search results have expired.',
    [ErrorCodes.PROFILE_NOT_FOUND]: 'No health profile found.',
    [ErrorCodes.PROFILE_INCOMPLETE]: 'Your health profile is incomplete.',
    [ErrorCodes.INTERNAL_ERROR]: 'An unexpected error occurred.',
    [ErrorCodes.CONFIGURATION_ERROR]: 'The service is not properly configured.'
  };
  return messages[code] || messages[ErrorCodes.INTERNAL_ERROR];
}

function getSuggestion(code: ErrorCode): string | undefined {
  const suggestions: Partial<Record<ErrorCode, string>> = {
    [ErrorCodes.NO_RESULTS]: 'Try broadening your search criteria or removing location filters.',
    [ErrorCodes.INVALID_QUERY]: 'Try rephrasing your query or be more specific.',
    [ErrorCodes.INVALID_NCT_ID]: 'NCT IDs should be in the format NCT followed by 8 digits (e.g., NCT12345678).',
    [ErrorCodes.CACHE_MISS]: 'Please perform a new search.',
    [ErrorCodes.PROFILE_INCOMPLETE]: 'Update your health profile for more personalized results.',
    [ErrorCodes.API_TIMEOUT]: 'Try searching with fewer criteria or a more specific query.'
  };
  return suggestions[code];
}