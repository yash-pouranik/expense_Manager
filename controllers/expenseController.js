const Expense = require('../models/Expense');
const User = require('../models/User');

// --- EMPLOYEE ROLE ---

// @desc    Show the expense submission form
// @route   GET /expenses/submit
exports.getSubmitExpensePage = (req, res) => {
    // Placeholder Categories (Should eventually come from Company model)
    const categories = ['Travel', 'Meal', 'Accommodation', 'Office Supplies', 'Software'];

    res.render('expenses/submit', {
        title: 'Submit Expense Claim',
        categories: categories,
        errors: [], 
        date: new Date().toISOString().substring(0, 10) 
    });
};

// @desc    Handle the submission of a new expense claim
// @route   POST /expenses
exports.handleSubmitExpense = async (req, res) => {
    try {
        const { amount, category, description, date } = req.body;
        
        // Find the user who is submitting the expense to get their manager
        const employee = await User.findById(req.user.id);
        if (!employee || !employee.manager) {
            req.flash('error_msg', 'Your manager is not assigned. Please contact Admin.');
            return res.redirect('/expenses/submit');
        }

        const newExpense = new Expense({
            user: req.user.id,
            company: req.user.company, // Company ID user se lein
            amount,
            category,
            description,
            date,
            
            // --- NEW LOGIC ---
            // Set the first approver to the employee's manager
            currentApprover: employee.manager 
        });

        await newExpense.save();
        req.flash('success_msg', 'Expense submitted for approval.');
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Something went wrong. Could not submit expense.');
        res.redirect('/expenses/submit');
    }
};


// @desc    View employee's expense history
// @route   GET /expenses/history
exports.getExpenseHistory = async (req, res) => {
    const userId = req.user._id;
    let { status } = req.query; 
    
    try {
        let query = { employee: userId };

        if (status) {
            // Normalize status (case-insensitive match)
            const normalized = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
            if (['Pending', 'Approved', 'Rejected'].includes(normalized)) {
                query.status = normalized;
            }
        }

        const expenses = await Expense.find(query)
            .populate('employee', 'username manager') 
            .sort({ date: -1 });

        res.render('expenses/history', { 
            title: 'My Expense History',
            expenses,
            currentFilter: status || 'All',
            formatDate: (date) => new Date(date).toLocaleDateString()
        });
    } catch (err) {
        console.error('Error fetching expense history:', err);
        req.flash('error_msg', 'Could not retrieve expense history.');
        res.redirect('/dashboard');
    }
};


// --- MANAGER/ADMIN ROLE ---

// @desc    View expenses waiting for approval
// @route   GET /expenses/pending
exports.getPendingApprovals = async (req, res) => {
    try {
        let pendingExpenses = [];
        const currentUserId = req.user._id;

        if (req.user.role === 'Admin') {
            pendingExpenses = await Expense.find({ 
                company: req.user.company._id,
                status: 'Pending'
            }).populate('employee', 'username email'); 

        } else if (req.user.role === 'Manager') {
            const teamEmployees = await User.find({ manager: currentUserId }).select('_id');
            const teamIds = teamEmployees.map(e => e._id);

            pendingExpenses = await Expense.find({
                employee: { $in: teamIds },
                status: 'Pending'
            }).populate('employee', 'username email');
        }

        res.render('expenses/pending', { 
            title: 'Pending Approvals',
            expenses: pendingExpenses || [],
            formatDate: (date) => new Date(date).toLocaleDateString()
        });
    } catch (err) {
        console.error('Error fetching pending approvals:', err);
        req.flash('error_msg', 'A database error occurred while loading approvals.');
        res.redirect('/dashboard');
    }
};

// @desc    Approve/Reject an expense with comments
// @route   POST /expenses/action/:id
exports.handleApprovalAction = async (req, res) => {
    const { action, comments } = req.body;
    const expenseId = req.params.id;
    const approverId = req.user._id;
    
    if (!['approve', 'reject'].includes(action)) {
        req.flash('error_msg', 'Invalid approval action.');
        return res.redirect('/expenses/pending');
    }

    try {
        const expense = await Expense.findById(expenseId);
        
        if (!expense) {
            req.flash('error_msg', 'Expense not found.');
            return res.redirect('/expenses/pending');
        }
        
        expense.status = action === 'approve' ? 'Approved' : 'Rejected';
        
        expense.approvalHistory.push({
            approver: approverId,
            step: expense.currentApprovalStep,
            status: expense.status,
            comments,
            approvedOn: new Date()
        });
        
        expense.currentApprovalStep = 0; 
        
        await expense.save();

        req.flash('success_msg', `Expense claim ${expenseId} was successfully ${expense.status}.`);
        res.redirect('/expenses/pending');

    } catch (err) {
        console.error('Error handling approval action:', err);
        req.flash('error_msg', 'Error processing approval action.');
        res.redirect('/expenses/pending');
    }
};

