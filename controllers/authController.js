const bcrypt = require('bcrypt');
const passport = require('passport');

// Import Models
const User = require('../models/User');
const Company = require('../models/Company');
const ApprovalRule = require('../models/ApprovalRule');

// --- Helper function for initial setup (called on first signup) ---
async function createInitialCompanyAndAdmin(username, email, passwordHash, companyName, defaultCurrency) {
    
    // 1. Create the new Company
    const newCompany = new Company({
        name: companyName, 
        defaultCurrency: defaultCurrency
    });
    const company = await newCompany.save();

    // 2. Create the Admin User
    const adminUser = new User({
        username: username,
        email: email, // <-- ADDED: Include email in the new user creation
        password: passwordHash,
        role: 'Admin',
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
    // FIX: Extract the 'email' field from the request body
    const { username, email, password, password2, companyName, defaultCurrency } = req.body;
    let errors = [];

    // Validation
    if (!username || !email || !password || !password2 || !companyName || !defaultCurrency) {
        errors.push({ msg: 'Please enter all fields.' });
    }
    if (password !== password2) {
        errors.push({ msg: 'Passwords do not match.' });
    }

    if (errors.length > 0) {
        return res.render('auth/signup', { errors, username, email, companyName, defaultCurrency, title: 'Signup' });
    } 

    // Validation Passed: Check for existing username
    User.findOne({ username: username }).then(user => {
        if (user) {
            errors.push({ msg: 'Username is already registered' });
            return res.render('auth/signup', { errors, username, email, companyName, defaultCurrency, title: 'Signup' });
        } else {
            // Create New Admin User and Company
            bcrypt.hash(password, 10, async (err, hash) => {
                if (err) throw err;
                
                try {
                    // FIX: Pass the new 'email' field to the helper function
                    await createInitialCompanyAndAdmin(username, email, hash, companyName, defaultCurrency);
                    
                    req.flash('success_msg', 'Company and Admin created successfully! You can now log in.');
                    res.redirect('/login');
                } catch (dbErr) {
                    console.error('DB Error during signup:', dbErr); 
                    req.flash('error_msg', 'A database error occurred during signup. Please ensure MongoDB is running.');
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