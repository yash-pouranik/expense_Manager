const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const dashboardController = require('../controllers/dashboardController'); // Make sure this is imported
const { ensureAuthenticated } = require('../middleware/auth');

// --- Public Routes ---

// Root Route (The Landing Page)
router.get('/', (req, res) => {
    res.render('landing', { title: 'Welcome' }); 
});

// Login/Signup/Logout routes...
router.get('/login', authController.getLoginPage);
router.post('/login', authController.handleLogin);
router.get('/signup', authController.getSignupPage);
router.post('/signup', authController.handleSignup);
router.get('/logout', authController.handleLogout);


// --- Secured Dashboard ---
// @route GET /dashboard
// CRITICAL FIX: Direct the route to the controller function
router.get('/dashboard', ensureAuthenticated, dashboardController.getDashboard);

module.exports = router;