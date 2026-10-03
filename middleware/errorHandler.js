// Handles requests to routes that don't exist
const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Centralized error handler - catches errors passed via next(err)
// and errors thrown/rejected inside async route handlers.
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Server Error';

  // Malformed JSON body (body-parser raises a SyntaxError tagged with status 400)
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON in request body';
  }

  // Other client errors raised by Express/body-parser (e.g. 413 payload too large)
  if (err.status >= 400 && err.status < 500 && err.type !== 'entity.parse.failed') {
    statusCode = err.status;
  }

  // Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = `Invalid ID format: ${err.value}`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // Mongoose duplicate key error (e.g., duplicate ISBN)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for field "${field}": ${err.keyValue[field]} already exists`;
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = { notFound, errorHandler };
