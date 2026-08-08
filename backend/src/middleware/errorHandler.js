// Centralized Express error handler.
// Must be registered last, after all routes, so it can catch errors
// thrown anywhere in the request pipeline.

const { buildErrorResponse } = require("../utils/errorResponse");

function errorHandler(err, req, res, next) {
  console.error("Unhandled error:", err.message);

  if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
    const { statusCode, body } = buildErrorResponse(
      "External service request timed out",
      504
    );
    return res.status(statusCode).json(body);
  }

  const { statusCode, body } = buildErrorResponse(
    "An unexpected server error occurred",
    err.statusCode || 500
  );
  res.status(statusCode).json(body);
}

module.exports = errorHandler;