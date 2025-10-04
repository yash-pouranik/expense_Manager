const Expense = require('../models/Expense');
const User = require('../models/User');
const Company = require('../models/Company');

// --- FIXED EXCHANGE RATES ---
const EXCHANGE_RATES = {
    'USD': 1.0,
    'EUR': 0.93,
    'GBP': 0.81,
    'INR': 83.2,
};
function convertCurrency(expenseCurrency, amount, targetCurrency) {
    if (!expenseCurrency || !targetCurrency) {
        console.error("Currency missing:", { expenseCurrency, targetCurrency });
        return amount; // fallback: original amount return
    }

    const source = expenseCurrency.toUpperCase();
    const target = targetCurrency.toUpperCase();

    if (!EXCHANGE_RATES[source] || !EXCHANGE_RATES[target]) {
        console.error(`Currency conversion failed: ${source} → ${target}`);
        return amount; // fallback without conversion
    }

    const amountInUSD = amount / EXCHANGE_RATES[source];
    const convertedAmount = amountInUSD * EXCHANGE_RATES[target];
    return parseFloat(convertedAmount.toFixed(2));
}

exports.getPendingApprovals = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const company = await Company.findById(req.user.company);

        // ✅ FIX: safe default
        const targetCurrency = company?.currency || 'USD';

        let pendingExpenses = [];
        if (req.user.role === 'Admin') {
            pendingExpenses = await Expense.find({ company: company._id, status: 'Pending' })
                .populate('employee', 'username email');
        } else if (req.user.role === 'Manager') {
            const teamEmployees = await User.find({ manager: currentUserId }).select('_id');
            const teamIds = teamEmployees.map(e => e._id);

            pendingExpenses = await Expense.find({ employee: { $in: teamIds }, status: 'Pending' })
                .populate('employee', 'username email');
        }

        for (let expense of pendingExpenses) {
            expense.convertedAmount = convertCurrency(
                expense.currency,
                expense.amount,
                targetCurrency
            );
        }

        res.render('expenses/pending', {
            title: 'Pending Approvals',
            expenses: pendingExpenses || [],
            formatDate: (date) => new Date(date).toLocaleDateString(),
            targetCurrency,
        });
    } catch (err) {
        console.error('Error fetching pending approvals:', err);
        req.flash('error_msg', 'Error while loading approvals.');
        res.redirect('/dashboard');
    }
};



// --- EMPLOYEE ROLE ---

// Show expense submission form
exports.getSubmitExpensePage = (req, res) => {
    const categories = ['Travel', 'Meal', 'Accommodation', 'Office Supplies', 'Software'];

    res.render('expenses/submit', {
        title: 'Submit Expense Claim',
        categories,
        errors: [],
        date: new Date().toISOString().substring(0, 10),
    });
};

// Handle new expense submission
exports.handleSubmitExpense = async (req, res) => {
    const { amount, currency, category, description, date } = req.body;
    const employeeId = req.user._id;
    const companyId = req.user.company;

    let errors = [];
    const categories = ['Travel', 'Meal', 'Accommodation', 'Office Supplies', 'Software'];

    // Validation
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
            date,
        });
    }

    try {
        const employee = await User.findById(employeeId);
        if (!employee || !employee.manager) {
            req.flash('error_msg', 'Your manager is not assigned. Please contact Admin.');
            return res.redirect('/expenses/submit');
        }

        const newExpense = new Expense({
            employee: req.user._id,
            company: companyId,
            amount: parsedAmount,
            currency,
            category,
            description,
            date: new Date(date),
            status: 'Pending',
            currentApprovalStep: 1,
            currentApprover: employee.manager,
            approvalHistory: [],
        });

        await newExpense.save();
        req.flash('success_msg', `Expense claim (${currency} ${parsedAmount}) submitted successfully and is awaiting manager approval.`);
        res.redirect('/expenses/history');
    } catch (err) {
        console.error('Error submitting expense:', err);
        req.flash('error_msg', 'Something went wrong while submitting expense.');
        res.redirect('/expenses/submit');
    }
};

// View employee’s expense history
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
            expenses,
            formatDate: (date) => new Date(date).toLocaleDateString(),
            filterStatus: status,
        });
    } catch (err) {
        console.error('Error fetching expense history:', err);
        req.flash('error_msg', 'Could not retrieve expense history.');
        res.redirect('/dashboard');
    }
};

// --- MANAGER/ADMIN ROLE ---

// View expenses waiting for approval
exports.getPendingApprovals = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const company = await Company.findById(req.user.company);
        const targetCurrency = company?.currency || 'USD';

        let pendingExpenses = [];
        if (req.user.role === 'Admin') {
            pendingExpenses = await Expense.find({ company: company._id, status: 'Pending' })
                .populate('employee', 'username email');
        } else if (req.user.role === 'Manager') {
            const teamEmployees = await User.find({ manager: currentUserId }).select('_id');
            const teamIds = teamEmployees.map(e => e._id);

            pendingExpenses = await Expense.find({ employee: { $in: teamIds }, status: 'Pending' })
                .populate('employee', 'username email');
        }

        for (let expense of pendingExpenses) {
            expense.convertedAmount = convertCurrency(
                expense.currency,
                expense.amount,
                targetCurrency
            );
        }

        res.render('expenses/pending', {
            title: 'Pending Approvals',
            expenses: pendingExpenses || [],
            formatDate: (date) => new Date(date).toLocaleDateString(),
            targetCurrency,
        });
    } catch (err) {
        console.error('Error fetching pending approvals:', err);
        req.flash('error_msg', 'Error while loading approvals.');
        res.redirect('/dashboard');
    }
};

// Approve/Reject an expense
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
            approvedOn: new Date(),
        });

        expense.currentApprovalStep = 0; // mark process complete
        await expense.save();

        req.flash('success_msg', `Expense claim ${expenseId} was successfully ${expense.status}.`);
        res.redirect('/expenses/pending');
    } catch (err) {
        console.error('Error handling approval action:', err);
        req.flash('error_msg', 'Error processing approval action.');
        res.redirect('/expenses/pending');
    }
};
