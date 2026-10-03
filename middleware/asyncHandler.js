// Wraps async route handlers so any rejected promise/thrown error
// is automatically passed to Express's error-handling middleware.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
