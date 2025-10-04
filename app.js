
// --- DEPENDENCY IMPORTS ---
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const path = require('path');
const expressLayouts = require('express-ejs-layouts'); // <-- NEW IMPORT

// --- APP INITIALIZATION ---
const app = express();
const PORT = process.env.PORT || 5000;

// --- CONFIGURATION IMPORTS (Model/DB) ---
require('./config/mongoose');
require('./config/passport')(passport);

// --- MIDDLEWARE SETUP ---

// 1. EJS View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 2. Express EJS Layouts Setup <-- NEW SETUP
app.use(expressLayouts);
app.set('layout', 'layout'); // Tells the app to use 'views/layout.ejs' as the default master file

// 3. Static Files
app.use(express.static(path.join(__dirname, 'public'))); 

// 4. Body Parser
app.use(express.urlencoded({ extended: true }));

// 5. Session Middleware
// ... (session setup remains the same)
app.use(session({
    secret: process.env.SESSION_SECRET || 'hackathon_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 } 
}));

// 6. Passport (Authentication) Middleware
app.use(passport.initialize());
app.use(passport.session());

// 7. Connect-Flash Middleware
app.use(flash());

// 8. Custom Middleware to set global EJS variables
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    next();
});

// --- ROUTE IMPORTS (Controller) ---
// ... (Route imports remain the same)
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/user'));
app.use('/admin', require('./routes/admin'));
// app.use('/expenses', require('./routes/expense'));

// --- SERVER START ---
app.listen(PORT, console.log(`Server started on port ${PORT}.`));
