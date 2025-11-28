/**
 * User-friendly error messages utility
 * Converts technical errors into actionable messages
 */

export const getErrorMessage = (error) => {
  // Handle different error types
  if (!error) {
    return "Something went wrong. Please try again.";
  }

  const errorString = error.message || error.toString();

  // Network errors
  if (errorString.includes('fetch') || errorString.includes('Failed to fetch') || errorString.includes('Network Error')) {
    return "Unable to connect to the server. Please check your internet connection and try again.";
  }

  // Timeout errors
  if (errorString.includes('timeout') || errorString.includes('timed out')) {
    return "The request took too long. Please check your connection and try again in a moment.";
  }

  // Authentication errors
  if (errorString.includes('401') || errorString.includes('Unauthorized')) {
    return "Your session has expired. Please log in again.";
  }

  if (errorString.includes('403') || errorString.includes('Forbidden')) {
    return "You don't have permission to access this. Please contact your instructor.";
  }

  // Not found errors
  if (errorString.includes('404') || errorString.includes('Not found')) {
    return "We couldn't find what you're looking for. It may have been removed or doesn't exist.";
  }

  // Server errors
  if (errorString.includes('500') || errorString.includes('503') || errorString.includes('Server error')) {
    return "The server is having trouble right now. Please try again in a few minutes.";
  }

  // Database errors
  if (errorString.includes('database') || errorString.includes('SQL')) {
    return "There's a problem accessing the data. Please try again or contact support.";
  }

  // Validation errors
  if (errorString.includes('validation') || errorString.includes('invalid')) {
    return errorString; // These are usually user-friendly already
  }

  // Email verification errors
  if (errorString.includes('email') && errorString.includes('verif')) {
    return errorString; // Keep original message for email verification
  }

  // File upload errors
  if (errorString.includes('upload') || errorString.includes('file')) {
    return "There was a problem uploading the file. Make sure it's not too large and try again.";
  }

  // Generic fallback
  return errorString || "Something went wrong. Please try again or contact support if the problem continues.";
};

/**
 * Get a retry suggestion based on error type
 */
export const getRetrySuggestion = (error) => {
  const errorString = error?.message || error?.toString() || "";

  if (errorString.includes('fetch') || errorString.includes('Network')) {
    return {
      canRetry: true,
      message: "Check your internet connection",
      retryDelay: 3000
    };
  }

  if (errorString.includes('500') || errorString.includes('503')) {
    return {
      canRetry: true,
      message: "Try again in a few minutes",
      retryDelay: 60000
    };
  }

  if (errorString.includes('timeout')) {
    return {
      canRetry: true,
      message: "Try again now",
      retryDelay: 5000
    };
  }

  if (errorString.includes('401') || errorString.includes('403')) {
    return {
      canRetry: false,
      message: "Log in again",
      retryDelay: 0
    };
  }

  return {
    canRetry: true,
    message: "Try again",
    retryDelay: 3000
  };
};
