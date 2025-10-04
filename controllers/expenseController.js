const Expense = require('../models/Expense');
const User = require('../models/User');
const Company = require('../models/Company');
const ApprovalRule = require('../models/ApprovalRule'); // Make sure to require the ApprovalRule model

// --- FIXED EXCHANGE RATES ---
const EXCHANGE_RATES = {
    'USD': 1.0,
    'EUR': 0.93,
    'GBP': 0.81,
    'INR': 83.2,
};

function convertCurrency(expenseCurrency, amount, targetCurrency) {
    if (!expenseCurrency || !targetCurrency || typeof amount !== 'number') {
        return amount;
    }
    const source = expenseCurrency.toUpperCase();
    const target = targetCurrency.toUpperCase();
    if (!EXCHANGE_RATES[source] || !EXCHANGE_RATES[target]) {
        return amount;
    }
    const amountInUSD = amount / EXCHANGE_RATES[source];
    const convertedAmount = amountInUSD * EXCHANGE_RATES[target];
    return parseFloat(convertedAmount.toFixed(2));
}

// --- EMPLOYEE ROLE ---

exports.getSubmitExpensePage = (req, res) => {
    const categories = ['Travel', 'Meal', 'Accommodation', 'Office Supplies', 'Software'];
    res.render('expenses/submit', {
        title: 'Submit Expense Claim',
        categories,
        errors: [],
        date: new Date().toISOString().substring(0, 10),
    });
};

exports.handleSubmitExpense = async (req, res) => {
    const { amount, currency, category, description, date } = req.body;
    const companyId = req.user.company;

    // Validation
    const errors = [];
    if (!amount || !currency || !category || !description || !date) {
        errors.push({ msg: 'Please fill in all required expense fields.' });
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        errors.push({ msg: 'Amount must be a positive number.' });
    }

    if (errors.length > 0) {
        const categories = ['Travel', 'Meal', 'Accommodation', 'Office Supplies', 'Software'];
        return res.render('expenses/submit', {
            title: 'Submit Expense Claim',
            categories, errors, amount, currency, selectedCategory: category, description, date
        });
    }

    try {
        const approvalRule = await ApprovalRule.findOne({ company: companyId });
        if (!approvalRule || !approvalRule.steps || approvalRule.steps.length === 0) {
            req.flash('error_msg', 'No approval workflow is defined. Please contact Admin.');
            return res.redirect('/expenses/submit');
        }

        const firstStep = approvalRule.steps.find(step => step.step === 1);
        if (!firstStep) {
            req.flash('error_msg', 'Workflow is not configured correctly. Please contact Admin.');
            return res.redirect('/expenses/submit');
        }

        let firstApprover;
        if (firstStep.approverRole === 'Manager') {
            const employee = await User.findById(req.user._id);
            if (!employee.manager) {
                 req.flash('error_msg', 'Your manager is not assigned. Please contact Admin.');
                 return res.redirect('/expenses/submit');
            }
            firstApprover = await User.findById(employee.manager);
        } else {
             firstApprover = await User.findOne({ company: companyId, role: firstStep.approverRole });
        }
       
        if (!firstApprover) {
            req.flash('error_msg', `No user found with the role '${firstStep.approverRole}' to start the approval. Please contact Admin.`);
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
            currentApprover: firstApprover._id,
            approvalHistory: [],
        });

        await newExpense.save();
        req.flash('success_msg', `Expense claim (${currency} ${parsedAmount}) submitted and is awaiting approval.`);
        res.redirect('/expenses/history');
    } catch (err) {
        console.error('Error submitting expense:', err);
        req.flash('error_msg', 'Something went wrong while submitting expense.');
        res.redirect('/expenses/submit');
    }
};

exports.getExpenseHistory = async (req, res) => {
    try {
        const query = { employee: req.user._id };
        if (req.query.status) {
            query.status = req.query.status.charAt(0).toUpperCase() + req.query.status.slice(1).toLowerCase();
        }

        const expenses = await Expense.find(query).populate('employee', 'username').sort({ date: -1 });

        res.render('expenses/history', {
            title: 'My Expense History',
            expenses,
            formatDate: (date) => new Date(date).toLocaleDateString(),
            filterStatus: req.query.status,
        });
    } catch (err) {
        console.error('Error fetching expense history:', err);
        req.flash('error_msg', 'Could not retrieve expense history.');
        res.redirect('/dashboard');
    }
};

// --- APPROVER ROLES (ADMIN, MANAGER, FINANCE, DIRECTOR) ---

exports.getPendingApprovals = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const company = await Company.findById(req.user.company);
        const targetCurrency = company?.defaultCurrency || 'USD';

        let pendingExpenses = [];
        const query = { company: company._id, status: 'Pending' };

        if (['Admin', 'Finance', 'Director'].includes(req.user.role)) {
            pendingExpenses = await Expense.find(query).populate('employee', 'username email');
        } 
        else if (req.user.role === 'Manager') {
            query.currentApprover = currentUserId;
            pendingExpenses = await Expense.find(query).populate('employee', 'username email');
        }

        for (const expense of pendingExpenses) {
            expense.convertedAmount = convertCurrency(expense.currency, expense.amount, targetCurrency);
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

        expense.approvalHistory.push({
            approver: approverId,
            status: action === 'approve' ? 'Approved' : 'Rejected',
            comment: comments,
            approvedAt: new Date()
        });
        
        if (action === 'reject') {
            expense.status = 'Rejected';
            expense.currentApprover = null; 
            await expense.save();
            req.flash('success_msg', `Expense claim ${expenseId} was Rejected.`);
            return res.redirect('/expenses/pending');
        }

        const approvalRule = await ApprovalRule.findOne({ company: expense.company });
        const nextStepNumber = expense.currentApprovalStep + 1;
        const nextStep = approvalRule.steps.find(step => step.step === nextStepNumber);

        if (nextStep) {
            const nextApprover = await User.findOne({ company: expense.company, role: nextStep.approverRole });
            if (!nextApprover) {
                req.flash('error_msg', `No user with role '${nextStep.approverRole}' found for the next step. Contact Admin.`);
                return res.redirect('/expenses/pending');
            }
            expense.currentApprovalStep = nextStepNumber;
            expense.currentApprover = nextApprover._id;
        } else {
            expense.status = 'Approved';
            expense.currentApprover = null;
        }

        await expense.save();
        req.flash('success_msg', `Expense claim was successfully processed.`);
        res.redirect('/expenses/pending');

    } catch (err) {
        console.error('Error handling approval action:', err);
        req.flash('error_msg', 'Error processing approval action.');
        res.redirect('/expenses/pending');
    }
};