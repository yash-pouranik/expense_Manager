require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const path = require('path');

// --- APP INITIALIZATION ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURATION IMPORTS (Model/DB) ---
// 1. Database Connection (Mongoose)
require('./config/mongoose');
// 2. Passport Configuration (Authentication Logic)
require('./config/passport')(passport);

// --- MIDDLEWARE SETUP ---

// 1. EJS View Engine Setup (View)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public'))); // For CSS/JS/Images

// 2. Body Parser (Handles incoming request data)
app.use(express.urlencoded({ extended: true }));

// 3. Session Middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'hackathon_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 } // 8 hours for the hackathon
}));

// 4. Passport (Authentication) Middleware
app.use(passport.initialize());
app.use(passport.session());

// 5. Connect-Flash Middleware
app.use(flash());

// 6. Custom Middleware to set global EJS variables
app.use((req, res, next) => {
    // Flash messages
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    
    // User info (available in all views)
    res.locals.user = req.user || null;
    
    next();
});

// --- ROUTE IMPORTS (Controller) ---
// Routes will now link to Controller functions (e.g., /routes/index.js links to /controllers/authController.js)
app.use('/', require('./routes/index'));        // Public routes (Login, Signup)
app.use('/users', require('./routes/user'));    // Admin/User Management routes
app.use('/expenses', require('./routes/expense')); // Expense Submission/Approval routes

// --- SERVER START ---
app.listen(PORT, console.log(`Server started on port ${PORT}. Use MongoDB database.`));