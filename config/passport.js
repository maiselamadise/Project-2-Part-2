const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
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
