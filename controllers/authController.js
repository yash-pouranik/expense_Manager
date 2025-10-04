const bcrypt = require('bcrypt');
const passport = require('passport');

// Import Models
const User = require('../models/User');
const Company = require('../models/Company');
const ApprovalRule = require('../models/ApprovalRule');

// --- Helper function for initial setup (called on first signup) ---
async function createInitialCompanyAndAdmin(username, passwordHash, companyName, defaultCurrency) {
    
    // 1. Create the new Company [cite: 11]
    const newCompany = new Company({ // <-- CORRECTED MODEL NAME
        name: companyName, // Use user-provided name
        defaultCurrency: defaultCurrency // Use user-provided currency
    });
    // CRITICAL: Await the save operation
    const company = await newCompany.save();

    // 2. Create the Admin User [cite: 11]
    const adminUser = new User({
        username: username,
        password: passwordHash,
        role: 'Admin', // Admin User is auto-created [cite: 11]
        company: company._id, // Link to the newly created company ID
        manager: null
    });
    // CRITICAL: Await the save operation
    const user = await adminUser.save();

    // 3. Link Admin to Company (Optional but good practice)
    company.adminUser = user._id;
    await company.save();

    // 4. Create a default Approval Rule for the company
    const defaultRule = new ApprovalRule({
        company: company._id,
        isManagerApprover: true,
        steps: []
    });
    await defaultRule.save();

    return user;
}


// @desc    Show the Login Page
// @route   GET /login
exports.getLoginPage = (req, res) => {
    res.render('auth/login', { title: 'Login' });
};

// @desc    Show the Signup Page
// @route   GET /signup
exports.getSignupPage = (req, res) => {
    res.render('auth/signup', { title: 'Signup' });
};

// @desc    Handle User Signup (Initial Admin/Company Creation)
// @route   POST /signup
exports.handleSignup = (req, res) => {
    const { username, password, password2, companyName, defaultCurrency } = req.body; // Pull new fields
    let errors = [];

    // Validation
    if (!username || !password || !password2 || !companyName || !defaultCurrency) {
        errors.push({ msg: 'Please enter all fields.' });
    }
    if (password !== password2) {
        errors.push({ msg: 'Passwords do not match.' });
    }
    // Note: Add more validation (e.g., password length) if time allows

    if (errors.length > 0) {
        // Re-render signup page with errors and previous inputs
        return res.render('auth/signup', { errors, username, companyName, defaultCurrency, title: 'Signup' });
    } 

    // Validation Passed: Check for existing username
    User.findOne({ username: username }).then(user => {
        if (user) {
            errors.push({ msg: 'Username is already registered' });
            return res.render('auth/signup', { errors, username, companyName, defaultCurrency, title: 'Signup' });
        } else {
            // Create New Admin User and Company
            bcrypt.hash(password, 10, async (err, hash) => {
                if (err) throw err;
                
                try {
                    // Pass new fields to helper
                    await createInitialCompanyAndAdmin(username, hash, companyName, defaultCurrency);
                    
                    req.flash('success_msg', 'Company and Admin created successfully! You can now log in.');
                    res.redirect('/login');
                } catch (dbErr) {
                    // Log to console for debugging
                    console.error('DB Error during signup:', dbErr); 
                    req.flash('error_msg', 'A database error occurred during signup. Please ensure MongoDB is running.');
                    res.redirect('/signup');
                }
            });
        }
    });
};

// @desc    Handle User Login
// @route   POST /login
exports.handleLogin = (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard', 
        failureRedirect: '/login',
        failureFlash: true 
    })(req, res, next);
};

// @desc    Handle User Logout
// @route   GET /logout
exports.handleLogout = (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        req.flash('success_msg', 'You are logged out');
        res.redirect('/login');
    });
};
