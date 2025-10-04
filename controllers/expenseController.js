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
        // Pass empty object for form data on initial load
        errors: [], 
        date: new Date().toISOString().substring(0, 10) 
    });
};

// @desc    Handle the submission of a new expense claim
// @route   POST /expenses
exports.handleSubmitExpense = async (req, res) => {
    // Extract data from the form (req.body)
    const { amount, currency, category, description, date } = req.body;
    const employeeId = req.user._id;
    const companyId = req.user.company;
    let errors = [];
    
    // Fetch categories again for re-render if validation fails
    const categories = ['Travel', 'Meal', 'Accommodation', 'Office Supplies', 'Software'];

    // Basic Validation [cite: 18-19]
    if (!amount || !currency || !category || !description || !date) {
        errors.push({ msg: 'Please fill in all required expense fields.' });
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        errors.push({ msg: 'Amount must be a positive number.' });
    }
    
    // If validation fails, re-render the form with errors and previous inputs
    if (errors.length > 0) {
        return res.render('expenses/submit', { 
            title: 'Submit Expense Claim', 
            categories: categories,
            errors: errors, 
            amount, 
            currency, 
            selectedCategory: category, 
            description, 
            date 
        });
    }

    try {
        // Create new Expense document
        const newExpense = new Expense({
            employee: employeeId,
            company: companyId,
            amount: parsedAmount,
            currency: currency,
            category: category,
            description: description,
            date: new Date(date),
            status: 'Pending',
            currentApprovalStep: 1 // Start the workflow at step 1
        });
        
        await newExpense.save();

        req.flash('success_msg', `Expense claim (${currency} ${parsedAmount}) submitted successfully and is awaiting manager approval.`);
        res.redirect('/expenses/history'); 

    } catch (dbErr) {
        console.error('DB Error during expense submission:', dbErr);
        req.flash('error_msg', 'A database error occurred during submission. Please check server logs.');
        res.redirect('/expenses/submit');
    }
};


// @desc    View employee's expense history (Approved, Rejected)
// @route   GET /expenses/history
exports.getExpenseHistory = async (req, res) => {
    const userId = req.user._id;
    
    try {
        // Fetch expenses and populate the employee and company fields for detail display
        const expenses = await Expense.find({ employee: userId })
            .populate('employee', 'username manager') 
            .sort({ date: -1 });

        res.render('expenses/history', { 
            title: 'My Expense History',
            expenses: expenses,
            // Helper function for display purposes in EJS
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
    // Manager/Admin views expenses waiting for approval [cite: 34, 44]

    try {
        let pendingExpenses = [];
        const currentUserId = req.user._id;

        if (req.user.role === 'Admin') {
            // Admin views all pending expenses in the company
            pendingExpenses = await Expense.find({ 
                company: req.user.company._id, // Use company ID if not populated
                status: 'Pending' 
            }).populate('employee', 'username email'); // Show details of the submitter

        } else if (req.user.role === 'Manager') {
            // Manager views expenses submitted by their assigned employees
            // 1. Find all employees managed by the current user
            const teamEmployees = await User.find({ manager: currentUserId }).select('_id');
            const teamIds = teamEmployees.map(e => e._id);

            // 2. Find pending expenses submitted by those employees
            pendingExpenses = await Expense.find({
                employee: { $in: teamIds },
                status: 'Pending'
            }).populate('employee', 'username email');
        }

        res.render('expenses/pending', { 
            title: 'Pending Approvals',
            expenses: pendingExpenses || [],
            // Helper function for display purposes in EJS
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
    // Simple 1-step approval process for the hackathon MVP

    const { action, comments } = req.body; // 'action' will be 'approve' or 'reject'
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
        
        // Mark the expense status
        expense.status = action === 'approve' ? 'Approved' : 'Rejected';
        
        // Record the action in the history [cite: 34]
        expense.approvalHistory.push({
            approver: approverId,
            step: expense.currentApprovalStep,
            status: expense.status,
            comments: comments,
            approvedOn: new Date()
        });
        
        // Set currentApprovalStep to 0 as the process is complete (in this MVP)
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