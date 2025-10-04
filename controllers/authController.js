const bcrypt = require('bcrypt');
const passport = require('passport');

// Import Models
const User = require('../models/User');
const Company = require('../models/Company');
const ApprovalRule = require('../models/ApprovalRule');

// --- Helper function for initial setup (called on first signup) ---
async function createInitialCompanyAndAdmin(username, passwordHash) {
    // NOTE: For hackathon speed, we use a placeholder currency (USD).
    const DEFAULT_CURRENCY = 'USD';
    
    // 1. Create the new Company [cite: 11]
    const newCompany = new Company({
        name: `${username}'s Company`,
        defaultCurrency: DEFAULT_CURRENCY
    });
    const company = await newCompany.save();

    // 2. Create the Admin User [cite: 11]
    const adminUser = new User({
        username: username,
        password: passwordHash,
        role: 'Admin', // Admin User is auto-created [cite: 11]
        company: company._id,
        manager: null
    });
    const user = await adminUser.save();

    // 3. Link Admin to Company
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


// @desc    Show the Login Page
// @route   GET /login
exports.getLoginPage = (req, res) => {
    res.render('auth/login', { title: 'Login' });
};

// @desc    Show the Signup Page
// @route   GET /signup
exports.getSignupPage = (req, res) => {
    res.render('auth/signup', { title: 'Signup' });
};

// @desc    Handle User Signup (Initial Admin/Company Creation)
// @route   POST /signup
exports.handleSignup = (req, res) => {
    const { username, password, password2 } = req.body;
    let errors = [];

    if (!username || !password || !password2) {
        errors.push({ msg: 'Please enter all fields' });
    }
    if (password !== password2) {
        errors.push({ msg: 'Passwords do not match' });
    }
    if (errors.length > 0) {
        return res.render('auth/signup', { errors, username, title: 'Signup' });
    } 

    // Validation Passed: Check for existing username
    User.findOne({ username: username }).then(user => {
        if (user) {
            errors.push({ msg: 'Username is already registered' });
            return res.render('auth/signup', { errors, username, title: 'Signup' });
        } else {
            // Create New Admin User and Company
            bcrypt.hash(password, 10, async (err, hash) => {
                if (err) throw err;
                
                try {
                    await createInitialCompanyAndAdmin(username, hash);
                    
                    req.flash('success_msg', 'Company and Admin created successfully! You can now log in.');
                    res.redirect('/login');
                } catch (dbErr) {
                    console.error('DB Error during signup:', dbErr);
                    req.flash('error_msg', 'A database error occurred during signup.');
                    res.redirect('/signup');
                }
            });
        }
    });
};

// @desc    Handle User Login
// @route   POST /login
exports.handleLogin = (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard', 
        failureRedirect: '/login',
        failureFlash: true 
    })(req, res, next);
};

// @desc    Handle User Logout
// @route   GET /logout
exports.handleLogout = (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        req.flash('success_msg', 'You are logged out');
        res.redirect('/login');
    });
};