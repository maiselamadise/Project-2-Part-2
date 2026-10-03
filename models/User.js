const mongoose = require('mongoose');

// Created automatically the first time someone logs in with GitHub.
// No passwords are stored because GitHub handles authentication.
const userSchema = new mongoose.Schema(
  {
    githubId: { type: String, required: true, unique: true },
    username: { type: String, required: true, trim: true },
    displayName: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    avatarUrl: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
