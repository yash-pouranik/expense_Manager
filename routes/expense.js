const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { ensureAuthenticated, isEmployee, isManagerOrAdmin } = require('../middleware/auth');

// --- Employee Routes [cite: 16-20, 44] ---

// Require authentication for all expense-related actions
router.use(ensureAuthenticated);

// @route GET /expenses/submit
// @desc Employee: Show expense submission form [cite: 17-19]
router.get('/submit', isEmployee, expenseController.getSubmitExpensePage);

// @route POST /expenses
// @desc Employee: Submit a new expense claim [cite: 17-19]
router.post('/', isEmployee, expenseController.handleSubmitExpense);

// @route GET /expenses/history
// @desc Employee: View their expense history (Approved, Rejected) [cite: 20, 44]
router.get('/history', isEmployee, expenseController.getExpenseHistory);


// --- Manager/Admin Approval Routes [cite: 21-35, 44] ---

// @route GET /expenses/pending
// @desc Manager/Admin: View expenses waiting for approval [cite: 34, 44]
router.get('/pending', isManagerOrAdmin, expenseController.getPendingApprovals);

// @route POST /expenses/action/:id
// @desc Manager/Admin: Approve/Reject an expense with comments [cite: 35, 44]
router.post('/action/:id', isManagerOrAdmin, expenseController.handleApprovalAction);


// NOTE: You would add /rules/config routes for the Admin's conditional approval setup later

module.exports = router;