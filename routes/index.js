
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { ensureAuthenticated } = require('../middleware/auth');

// --- Public Routes ---

// Root Route (The Landing Page)
// @route GET /
// @desc Renders the public landing page.
router.get('/', (req, res) => {
    // The landing page conditionally shows buttons based on if 'res.locals.user' exists.
    res.render('landingpage', { title: 'Welcome' }); 
});


// Login Routes
router.get('/login', authController.getLoginPage);
router.post('/login', authController.handleLogin);

// Signup Routes (Creates the initial Company and Admin)
router.get('/signup', authController.getSignupPage);
router.post('/signup', authController.handleSignup);

// Logout Route
router.get('/logout', authController.handleLogout);

// --- Secured Dashboard ---
// @route GET /dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) => {
    // Renders the role-based dashboard for logged-in users
    res.render('dashboard', { title: 'Dashboard' });
});

module.exports = router;