const express = require('express');
const passport = require('passport');
const router = express.Router();

// Starts the GitHub OAuth flow (open in the browser, not via Swagger "Try it out")
router.get('/login', passport.authenticate('github', { scope: ['user:email'] }));

// GitHub redirects back here after the user approves
router.get(
  '/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/auth/failure' }),
  (req, res) => res.redirect('/api-docs')
);

router.get('/auth/failure', (req, res) => {
  res.status(401).json({ success: false, message: 'GitHub login failed' });
});

// Shows who is logged in (handy for the demo video)
router.get('/auth/me', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    const { githubId, username, displayName } = req.user;
    return res.status(200).json({ success: true, loggedIn: true, user: { githubId, username, displayName } });
  }
  return res.status(200).json({ success: true, loggedIn: false });
});

router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((destroyErr) => {
      if (destroyErr) return next(destroyErr);
      res.clearCookie('connect.sid');
      res.status(200).json({ success: true, message: 'Logged out' });
    });
  });
});

module.exports = router;
