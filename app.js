require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');

const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const issueRoutes = require('./routes/issueRoutes');
const memberRoutes = require('./routes/memberRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// View Engine Setup (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body Parser & Form Handling
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Static Assets
app.use(express.static(path.join(__dirname, 'public')));

// Session Configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'library_secret_dev_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// Flash Messages
app.use(flash());

// Global View Locals Middleware
app.use((req, res, next) => {
  res.locals.currentUser = req.session.userId
    ? {
        id: req.session.userId,
        name: req.session.name,
        email: req.session.email,
        role: req.session.role,
      }
    : null;
  res.locals.role = req.session.role || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.warning = req.flash('warning');
  res.locals.path = req.path;
  res.locals.currentYear = new Date().getFullYear();
  next();
});

// Health check route
app.get('/health', (req, res) => {
  const state = mongoose.connection.readyState;
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status: state === 1 ? 'OK' : 'ERROR',
    dbState: states[state] || state,
    host: mongoose.connection.host || null,
    dbName: mongoose.connection.name || null,
    connectionError: connectDB.getConnectionError(),
  });
});

// Root Route
app.get('/', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/dashboard');
  }
  return res.redirect('/books');
});

// Route Mounts
app.use('/', authRoutes);
app.use('/books', bookRoutes);
app.use('/issues', issueRoutes);
app.use('/members', memberRoutes);
app.use('/dashboard', dashboardRoutes);

// Error page view for 404
app.use((req, res) => {
  res.status(404).render('error', {
    title: '404 - Page Not Found',
    statusCode: 404,
    message: 'The page or resource you requested does not exist.',
    currentUser: res.locals.currentUser,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  res.status(500).render('error', {
    title: '500 - Server Error',
    statusCode: 500,
    message: 'An unexpected internal server error occurred. Please try again later.',
    currentUser: res.locals.currentUser,
  });
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Library App] Server listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
