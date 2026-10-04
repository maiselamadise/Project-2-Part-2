const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

// Work out the OAuth callback URL.
// - Local dev: GITHUB_CALLBACK_URL (http://localhost:3000/auth/github/callback)
// - Render:    GITHUB_CALLBACK_URL if it is a real public URL; otherwise Render's own
//              RENDER_EXTERNAL_URL, so a leftover localhost value can never be sent to GitHub.
const CALLBACK_PATH = '/auth/github/callback';
const configured = process.env.GITHUB_CALLBACK_URL;
const isLocalhost = (url) => /localhost|127\.0\.0\.1/i.test(url || '');
let callbackURL = configured || CALLBACK_PATH; // relative path resolves to the requesting host
if (process.env.RENDER_EXTERNAL_URL && (!configured || isLocalhost(configured))) {
  callbackURL = process.env.RENDER_EXTERNAL_URL.replace(/\/+$/, '') + CALLBACK_PATH;
}
console.log(`GitHub OAuth callback URL: ${callbackURL}`);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL,
      proxy: true, // behind Render's proxy; keeps the https:// scheme
      scope: ['user:email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // "Create account" on first login, update profile info on later logins
        const user = await User.findOneAndUpdate(
          { githubId: profile.id },
          {
            githubId: profile.id,
            username: profile.username,
            displayName: profile.displayName || '',
            email: (profile.emails && profile.emails[0] && profile.emails[0].value) || '',
            avatarUrl: (profile.photos && profile.photos[0] && profile.photos[0].value) || '',
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Store only the user's _id in the session
passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user || false);
  } catch (err) {
    done(err);
  }
});
