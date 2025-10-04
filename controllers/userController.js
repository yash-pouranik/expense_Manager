const bcrypt = require('bcrypt');
const User = require('../models/User');
const Company = require('../models/Company');

// @desc    Show the form for Admin to create a new Employee or Manager
// @route   GET /users/new
exports.getCreateUserPage = async (req, res) => {
    try {
        // Only fetch managers within the Admin's own company
        const managers = await User.find({ 
            company: req.user.company,
            role: { $in: ['Admin', 'Manager'] } 
        }).select('username role');
        
        res.render('users/new', {
            title: 'Create New User',
            managers: managers,
            errors: []
        });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Could not load user creation form.');
        res.redirect('/dashboard');
    }
};

// @desc    Handle Admin creating a new Employee or Manager
// @route   POST /users
exports.handleCreateUser = async (req, res) => {
    const { username, password, role, managerId } = req.body;
    let errors = [];

    // Basic Validation
    if (!username || !password || !role) {
        errors.push({ msg: 'Please enter username, password, and role.' });
    }
    if (password.length < 6) {
        errors.push({ msg: 'Password must be at least 6 characters.' });
    }
    if (role !== 'Manager' && role !== 'Employee') {
         errors.push({ msg: 'Invalid role selected.' });
    }
    
    // Check if managerId is provided and valid for Employee role
    let manager = null;
    if (role === 'Employee') {
        if (!managerId) {
             errors.push({ msg: 'Employees must be assigned a manager.' });
        } else {
            // Verify the selected manager exists in the company
            manager = await User.findOne({ _id: managerId, company: req.user.company });
            if (!manager) {
                errors.push({ msg: 'Invalid manager selected.' });
            }
        }
    }

    if (errors.length > 0) {
        const managers = await User.find({ 
            company: req.user.company,
            role: { $in: ['Admin', 'Manager'] } 
        }).select('username role');
        
        return res.render('users/new', {
            title: 'Create New User',
            managers: managers,
            errors: errors,
            username,
            selectedRole: role
        });
    }

    // Validation Passed: Check for existing username
    try {
        const existingUser = await User.findOne({ username: username });
        if (existingUser) {
            req.flash('error_msg', 'Username already exists.');
            return res.redirect('/users/new');
        }

        // Hash password and create user
        const passwordHash = await bcrypt.hash(password, 10);
        
        const newUser = new User({
            username: username,
            password: passwordHash,
            role: role, // Assign and change roles [cite: 14]
            company: req.user.company,
            manager: manager ? manager._id : null // Define manager relationships [cite: 15]
        });

        await newUser.save();

        req.flash('success_msg', `${role} user ${username} created successfully.`);
        res.redirect('/users/new'); 

    } catch (dbErr) {
        console.error('DB Error during user creation:', dbErr);
        req.flash('error_msg', 'A database error occurred during user creation.');
        res.redirect('/users/new');
    }
};