// routes/approvalRoutes.js
const express = require('express');
const router = express.Router();
const { getPendingApprovals, approveExpense } = require('../controllers/approvalController');
const { isLoggedIn } = require('../middlewares');

router.get('/pending', isLoggedIn, getPendingApprovals);
router.post('/:approvalId/action', isLoggedIn, approveExpense);

module.exports = router;
