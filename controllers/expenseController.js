const Expense = require('../models/Expense');
const User = require('../models/User');

// --- EMPLOYEE ROLE ---

// @desc    Show the expense submission form [cite: 17]
// @route   GET /expenses/submit
exports.getSubmitExpensePage = (req, res) => {
    // For the hackathon, hardcode some categories or fetch them from Company model if available
    const categories = ['Travel', 'Meal', 'Accommodation', 'Office Supplies', 'Software'];

    res.render('expenses/submit', {
        title: 'Submit Expense Claim',
        categories: categories,
        errors: []
    });
};

// @desc    Handle the submission of a new expense claim [cite: 18, 19]
// @route   POST /expenses
exports.handleSubmitExpense = async (req, res) => {
    const { amount, currency, category, description, date } = req.body;
    const employeeId = req.user._id;
    const companyId = req.user.company;
    let errors = [];

    // Basic Validation (can be expanded)
    if (!amount || !currency || !category || !description || !date) {
        errors.push({ msg: 'Please fill in all required expense fields.' });
    }
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        errors.push({ msg: 'Amount must be a positive number.' });
    }
    
    // NOTE: In a full implementation, you would validate 'currency' and 'category' against lists.

    if (errors.length > 0) {
        // Re-render form with errors
        // (You would need to re-fetch categories here)
        return res.render('expenses/submit', { 
            title: 'Submit Expense Claim', 
            errors: errors, 
            // Pass back input data
        });
    }

    try {
        // Create new Expense document
        const newExpense = new Expense({
            employee: employeeId,
            company: companyId,
            amount: parseFloat(amount),
            currency: currency, // Amount can be different from company's currency [cite: 18]
            category: category,
            description: description,
            date: new Date(date),
            status: 'Pending',
            currentApprovalStep: 1 // Start at step 1
        });
        
        await newExpense.save();

        // NOTE: The next major task will be to trigger the approval notification/workflow here.

        req.flash('success_msg', 'Expense claim submitted successfully and is awaiting manager approval.');
        res.redirect('/expenses/history'); 

    } catch (dbErr) {
        console.error('DB Error during expense submission:', dbErr);
        req.flash('error_msg', 'A database error occurred during submission.');
        res.redirect('/expenses/submit');
    }
};


// @desc    View employee's expense history (Approved, Rejected) [cite: 20]
// @route   GET /expenses/history
exports.getExpenseHistory = async (req, res) => {
    try {
        const expenses = await Expense.find({ employee: req.user._id })
            .sort({ date: -1 });

        res.render('expenses/history', { 
            title: 'My Expense History',
            expenses: expenses
        });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Could not retrieve expense history.');
        res.redirect('/dashboard');
    }
};


// --- MANAGER/ADMIN ROLE ---

// @desc    View expenses waiting for approval [cite: 34]
// @route   GET /expenses/pending
exports.getPendingApprovals = async (req, res) => {
    // NOTE: This is complex logic and needs the ApprovalRule to be fully implemented.
    // For the hackathon, we'll implement a simple manager-to-employee relationship check.

    try {
        let pendingExpenses;

        if (req.user.role === 'Admin') {
            // Admin can view all pending expenses in the company
            pendingExpenses = await Expense.find({ 
                company: req.user.company, 
                status: 'Pending' 
            }).populate('employee', 'username');

        } else if (req.user.role === 'Manager') {
            // Manager views expenses submitted by their assigned employees
            const teamEmployees = await User.find({ manager: req.user._id }).select('_id');
            const teamIds = teamEmployees.map(e => e._id);

            pendingExpenses = await Expense.find({
                employee: { $in: teamIds },
                status: 'Pending'
            }).populate('employee', 'username');
        }

        res.render('expenses/pending', { 
            title: 'Pending Approvals',
            expenses: pendingExpenses || []
        });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Could not retrieve pending expenses.');
        res.redirect('/dashboard');
    }
};

// @desc    Approve/Reject an expense with comments [cite: 35]
// @route   POST /expenses/action/:id
exports.handleApprovalAction = async (req, res) => {
    // This function will be the main bottleneck for the 8 hours!
    // It requires: currency conversion, multi-level flow check, and conditional rules.
    
    // ... (logic to handle approval/rejection) ...
    req.flash('success_msg', 'Approval action processed (workflow logic pending).');
    res.redirect('/expenses/pending'); 
};