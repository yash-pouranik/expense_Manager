const Expense = require('../models/Expense');
const User = require('../models/User');
const Company = require('../models/Company');
// Node-fetch is no longer strictly necessary for the conversion, but kept for context

// --- FIXED EXCHANGE RATES FOR HACKATHON STABILITY ---
// All rates are relative to a common base (USD: 1.0).
const EXCHANGE_RATES = {
    // NOTE: These are mock, approximate rates to guarantee the conversion function works.
    'USD': 1.0,
    'EUR': 0.93, 
    'GBP': 0.81, 
    'INR': 83.2,
};

/**
 * @desc Converts the amount using internal fixed rates, stabilizing the requirement.
 * @param {string} expenseCurrency - The currency of the expense (e.g., 'EUR').
 * @param {number} amount - The original amount.
 * @param {string} targetCurrency - The company's default currency (e.g., 'USD').
 * @returns {number} The converted amount, or null if currency is unknown.
 */
function convertCurrency(expenseCurrency, amount, targetCurrency) {
    const source = expenseCurrency.toUpperCase();
    const target = targetCurrency.toUpperCase();
    
    // Check if currency is supported by our mock rates
    if (!EXCHANGE_RATES[source] || !EXCHANGE_RATES[target]) {
        console.error(`ERROR: Currency conversion failed. Source or Target currency not supported: ${source} to ${target}`);
        return null; 
    }

    // 1. Convert Source Currency amount to the common base (USD)
    const rateToUSD = 1 / EXCHANGE_RATES[source];
    const amountInUSD = amount * rateToUSD;

    // 2. Convert from common base (USD) to Target Currency
    const targetRate = EXCHANGE_RATES[target];
    
    // Final conversion
    const convertedAmount = amountInUSD * targetRate;
    return parseFloat(convertedAmount.toFixed(2));
}


// --- EMPLOYEE ROLE ---

// @desc    Show the expense submission form
// @route   GET /expenses/submit
exports.getSubmitExpensePage = (req, res) => {
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
            employee: employeeId,
            company: companyId,
            amount: parsedAmount,
            currency: currency,
            category: category,
            description: description,
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


// @desc    View employee's expense history (Approved, Rejected)
// @route   GET /expenses/history
exports.getExpenseHistory = async (req, res) => {
    const userId = req.user._id;
    const { status } = req.query;

    try {
        let query = { employee: userId };
        if (status) {
            query.status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
        }

        const expenses = await Expense.find(query)
            .populate('employee', 'username manager')
            .sort({ date: -1 });

        res.render('expenses/history', {
            title: 'My Expense History',
            expenses: expenses,
            formatDate: (date) => new Date(date).toLocaleDateString(),
            filterStatus: status
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
        
        // 1. Explicitly fetch company details for target currency
        const company = await Company.findById(req.user.company);
        const targetCurrency = company?.defaultCurrency || 'USD';

        if (req.user.role === 'Admin') {
            pendingExpenses = await Expense.find({
                company: company._id,
                status: 'Pending',
            }).populate('employee', 'username email');

        } else if (req.user.role === 'Manager') {
            const teamEmployees = await User.find({ manager: currentUserId }).select('_id');
            const teamIds = teamEmployees.map(e => e._id);

            pendingExpenses = await Expense.find({
                employee: { $in: teamIds },
                status: 'Pending'
            }).populate('employee', 'username email');
        }

        // --- STABLE CURRENCY CONVERSION LOGIC ---
        // Iterate over fetched expenses and add the converted amount
        for (let expense of pendingExpenses) {
            expense.convertedAmount = convertCurrency(
                expense.currency,
                expense.amount,
                targetCurrency
            );
        }
        // --- END STABLE CURRENCY CONVERSION LOGIC ---

        res.render('expenses/pending', {
            title: 'Pending Approvals',
            expenses: pendingExpenses || [],
            formatDate: (date) => new Date(date).toLocaleDateString(),
            targetCurrency: targetCurrency
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

        // Mark the expense status
        expense.status = action === 'approve' ? 'Approved' : 'Rejected';

        // Record the action in the history [cite: 35]
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

