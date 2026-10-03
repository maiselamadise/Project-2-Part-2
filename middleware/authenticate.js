// Blocks the request with a 401 unless the user is logged in via GitHub OAuth.
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: 'Unauthorized: you must log in first. Visit /login',
  });
};

module.exports = { isAuthenticated };
