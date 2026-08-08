// Builds a consistent error response shape used across the entire API.
// Every route/service should use this instead of inventing its own error format.

function buildErrorResponse(message, statusCode = 500) {
  return {
    statusCode,
    body: {
      success: false,
      error: message,
    },
  };
}

module.exports = { buildErrorResponse };