const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { ensureAuthenticated, isEmployee, isManagerOrAdmin } = require('../middleware/auth');

// Require authentication for all expense-related actions
router.use(ensureAuthenticated);

// --- Employee Routes (Submission and History) [cite: 16-20, 44] ---

// @route GET /expenses/submit
// @desc Employee: Show expense submission form
router.get('/submit', isEmployee, expenseController.getSubmitExpensePage);

// @route POST /expenses
// @desc Employee: Handle submission of a new expense claim
router.post('/', isEmployee, expenseController.handleSubmitExpense);

// @route GET /expenses/history
// @desc Employee: View their expense history (Approved, Rejected)
router.get('/history', isEmployee, expenseController.getExpenseHistory);


// --- Manager/Admin Approval Routes [cite: 21-35, 44] ---

// @route GET /expenses/pending
// @desc Manager/Admin: View expenses waiting for approval
router.get('/pending', isManagerOrAdmin, expenseController.getPendingApprovals);

// @route POST /expenses/action/:id
// @desc Manager/Admin: Approve/Reject an expense with comments
router.post('/action/:id', isManagerOrAdmin, expenseController.handleApprovalAction);

module.exports = router;
