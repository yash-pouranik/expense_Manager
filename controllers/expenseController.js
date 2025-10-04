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
    const { amount, currency, category, description, date } = req.body;
    const employeeId = req.user._id;
    const companyId = req.user.company;
    let errors = [];
    
    const categories = ['Travel', 'Meal', 'Accommodation', 'Office Supplies', 'Software'];

    if (!amount || !currency || !category || !description || !date) {
        errors.push({ msg: 'Please fill in all required expense fields.' });
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        errors.push({ msg: 'Amount must be a positive number.' });
    }
    
    if (errors.length > 0) {
        return res.render('expenses/submit', { 
            title: 'Submit Expense Claim', 
            categories,
            errors, 
            amount, 
            currency, 
            selectedCategory: category, 
            description, 
            date 
        });
    }

    try {
        const newExpense = new Expense({
            employee: employeeId,
            company: companyId,
            amount: parsedAmount,
            currency,
            category,
            description,
            date: new Date(date),
            status: 'Pending',
            currentApprovalStep: 1 
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
