const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');
const Expense = require('../models/Expense');

exports.getDashboard = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('company');
        if (!user || !user.company) {
            req.flash('error_msg', 'Could not load company data.');
            return res.redirect('/login');
        }

        const company = user.company;
        const companyId = company._id;
        let stats = {};
        let employees = [];
        let managers = [];
        let employeeStats = {};

        // Role-specific data fetching
        if (user.role === 'Admin') {
            const userCounts = await User.aggregate([
                { $match: { company: companyId } },
                { $group: { _id: '$role', count: { $sum: 1 } } }
            ]);
            const expenseCounts = await Expense.aggregate([
                { $match: { company: companyId } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]);

            stats.totalUsers = userCounts.reduce((acc, role) => acc + role.count, 0);
            stats.totalManagers = userCounts.find(r => r._id === 'Manager')?.count || 0;
            stats.totalEmployees = userCounts.find(r => r._id === 'Employee')?.count || 0;
            stats.totalExpenses = expenseCounts.reduce((acc, status) => acc + status.count, 0);
            stats.pendingApprovals = expenseCounts.find(s => s._id === 'Pending')?.count || 0;

            employees = await User.find({ company: companyId, role: 'Employee' }).select('username email').lean();
            managers = await User.find({ company: companyId, role: 'Manager' }).select('username email').lean();

        } else if (user.role === 'Manager') {
            const teamEmployees = await User.find({ manager: user._id }).select('_id');
            const teamIds = teamEmployees.map(e => e._id);
            
            stats.pendingApprovals = await Expense.countDocuments({
                employee: { $in: teamIds },
                status: 'Pending',
                currentApprover: user._id
            });

        } else if (user.role === 'Finance' || user.role === 'Director') {
            stats.pendingApprovals = await Expense.countDocuments({
                company: companyId,
                status: 'Pending',
                currentApprover: user._id
            });

        } else if (user.role === 'Employee') {
            const employeeExpenseStats = await Expense.aggregate([
                { $match: { employee: user._id } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]);
            employeeStats.submitted = employeeExpenseStats.reduce((acc, status) => acc + status.count, 0);
            employeeStats.approved = employeeExpenseStats.find(s => s._id === 'Approved')?.count || 0;
            employeeStats.rejected = employeeExpenseStats.find(s => s._id === 'Rejected')?.count || 0;
        }

        res.render('dashboard', {
            title: 'Dashboard',
            user,
            company,
            stats,
            employees,
            managers,
            employeeStats
        });

    } catch (err) {
        console.error('Dashboard Data Fetch Error:', err);
        req.flash('error_msg', 'Failed to load dashboard data.');
        res.redirect('/login');
    }
};