// Middleware to ensure user is authenticated (logged in)
exports.ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next(); // User is logged in, continue
    }
    // If not logged in, flash an error and redirect to login
    req.flash('error_msg', 'Please log in to view this resource');
    res.redirect('/login');
};

// Middleware to ensure the user has a specific role (Admin, Manager, or Employee)
exports.ensureRole = (roles = []) => {
    // If a single role is passed, convert it to an array
    if (typeof roles === 'string') {
        roles = [roles];
    }
    
    // Return the middleware function
    return (req, res, next) => {
        // 1. Check if the user is authenticated first
        if (!req.isAuthenticated()) {
            req.flash('error_msg', 'Please log in to view this resource');
            return res.redirect('/login');
        }

        // 2. Check if the authenticated user's role is in the allowed roles list
        const userRole = req.user.role;

        // If no specific roles are required, proceed (shouldn't typically happen)
        if (roles.length === 0) {
            return next();
        }

        // Check if the user's role is included in the required roles
        if (roles.includes(userRole)) {
            return next(); // Role is authorized, continue
        } else {
            // User does not have the required permissions
            req.flash('error_msg', 'You do not have permission to access this page.');
            // Redirect to dashboard or a forbidden page
            return res.redirect('/dashboard');
        }
    };
};

// Convenience middleware functions for specific roles
exports.isAdmin = exports.ensureRole('Admin');
exports.isManagerOrAdmin = exports.ensureRole(['Manager', 'Admin', 'Finance', 'Director']);
exports.isEmployee = exports.ensureRole('Employee');