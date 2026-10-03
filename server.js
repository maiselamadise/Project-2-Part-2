require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const connectDB = require('./config/db');
require('./config/passport');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const bookRoutes = require('./routes/bookRoutes');
const authorRoutes = require('./routes/authorRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Render sits behind a proxy; needed so secure session cookies work in production
app.set('trust proxy', 1);

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessions (stored in MongoDB so logins survive restarts) + Passport
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Root route - simple info check
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Library API is running',
    endpoints: {
      books: '/api/books',
      authors: '/api/authors',
      docs: '/api-docs',
      login: '/login',
      logout: '/logout',
      health: '/health',
    },
  });
});

// Health check - also reports whether the database connection is up
app.get('/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const database = states[mongoose.connection.readyState] || 'unknown';
  res.status(database === 'connected' ? 200 : 503).json({
    success: database === 'connected',
    status: database === 'connected' ? 'ok' : 'degraded',
    database,
  });
});

// Swagger docs - interactive UI at /api-docs, raw spec at /swagger.json
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/swagger.json', (req, res) => res.status(200).json(swaggerDocument));

// Auth routes (/login, /logout, /auth/github/callback, /auth/me)
app.use('/', authRoutes);

// API Routes
app.use('/api/books', bookRoutes);
app.use('/api/authors', authorRoutes);

// 404 + centralized error handling (must be last)
app.use(notFound);
app.use(errorHandler);

// Connect to MongoDB first, then start accepting requests.
const start = async () => {
  await connectDB();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
  });
};

// Only start the server when run directly (`node server.js`), so the app can be imported elsewhere.
if (require.main === module) {
  start();
}

module.exports = app;
