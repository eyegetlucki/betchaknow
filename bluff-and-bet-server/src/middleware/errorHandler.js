// ─── src/middleware/errorHandler.js ──────────────────────────────────────────

function errorHandler(err, req, res, next) {
  const status  = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error";

  // Log server errors
  if (status >= 500) console.error("[ERROR]", err);

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

// Wrap async route handlers so they pass errors to errorHandler
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// Quick HTTP error creator
function createError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

module.exports = { errorHandler, asyncHandler, createError };
