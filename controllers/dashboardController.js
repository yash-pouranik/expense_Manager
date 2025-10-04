const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');
const Expense = require('../models/Expense');

// @desc    Get dashboard data and render view
// @route   GET /dashboard
exports.getDashboard = async (req, res) => {
    // Initialize required variables to ensure EJS does not crash
    let company = {};
    let stats = {
        totalUsers: 0,
        totalManagers: 0,
        totalEmployees: 0,
        pendingApprovals: 0,
        totalExpenses: 0
    };
    let employeeStats = {
        submitted: 0,
        approved: 0,
        rejected: 0
    };
    // --- NEW VARIABLES ---
    // Initialize arrays for the lists of managers and employees
    let managers = [];
    let employees = [];

    if (!req.user || !req.user._id) {
        // Should be caught by ensureAuthenticated middleware, but safe check here.
        return res.redirect('/login');
    }

    try {
        const userId = req.user._id;

        const userDocument = await User.findById(userId)
            .populate('company')
            .exec();
        
        if (!userDocument || !userDocument.company) {
            console.error(`ERROR: User or Company document not found for User ID: ${userId}`);
            req.flash('error_msg', 'Company data is missing. Please ensure your Admin account is linked correctly.');
            return res.render('dashboard', { title: 'Dashboard', company, stats, employeeStats, managers, employees });
        }
        
        company = userDocument.company;
        const companyId = company._id;
        const companyObjectId = new mongoose.Types.ObjectId(companyId);

        // 1. Fetch User Statistics (Aggregation)
        const userStats = await User.aggregate([
            { $match: { company: companyObjectId } },
            { $group: {
                _id: '$role',
                count: { $sum: 1 }
            }}
        ]);

        stats.totalUsers = userStats.reduce((acc, role) => acc + role.count, 0);
        stats.totalManagers = userStats.find(r => r._id === 'Manager')?.count || 0;
        stats.totalEmployees = userStats.find(r => r._id === 'Employee')?.count || 0;

        // --- NEW LOGIC: FETCH FULL LISTS ---
        // Fetch all users with the role 'Manager' for the company
        managers = await User.find({ company: companyObjectId, role: 'Manager' });
        
        // Fetch all users with the role 'Employee' for the company
        employees = await User.find({ company: companyObjectId, role: 'Employee' });
        // --- END OF NEW LOGIC ---

        // 2. Fetch Expense Statistics
        const expenseStats = await Expense.aggregate([
            { $match: { company: companyObjectId } },
            { $group: {
                _id: '$status',
                count: { $sum: 1 }
            }}
        ]);

        stats.totalExpenses = expenseStats.reduce((acc, status) => acc + status.count, 0);
        stats.pendingApprovals = expenseStats.find(s => s._id === 'Pending')?.count || 0;
        
        // 3. Employee Specific Stats (Only if the user is an Employee)
        if (req.user.role === 'Employee') {
            const employeeExpenseStats = await Expense.aggregate([
                { $match: { employee: req.user._id } },
                { $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }}
            ]);

            employeeStats.submitted = employeeExpenseStats.reduce((acc, status) => acc + status.count, 0);
            employeeStats.approved = employeeExpenseStats.find(s => s._id === 'Approved')?.count || 0;
            employeeStats.rejected = employeeExpenseStats.find(s => s._id === 'Rejected')?.count || 0;
        }

        // Render the dashboard with all necessary data
        res.render('dashboard', {
            title: 'Dashboard',
            company,
            stats,
            employeeStats,
            managers,    // Pass managers list to the view
            employees    // Pass employees list to the view
        });

    } catch (err) {
        console.error('Dashboard Data Fetch Error:', err);
        req.flash('error_msg', 'Failed to load dashboard data.');
        res.render('dashboard', { title: 'Dashboard', company, stats, employeeStats, managers, employees });
    }
};