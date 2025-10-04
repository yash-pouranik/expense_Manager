const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { ensureAuthenticated } = require('../middleware/auth');

// --- Public Routes ---

// Root redirects to dashboard
router.get('/', (req, res) => {
    res.redirect('/dashboard');
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
router.get('/dashboard', ensureAuthenticated, (req, res) => {
    // Passes through if authenticated
    res.render('dashboard', { title: 'Dashboard' });
});

module.exports = router;