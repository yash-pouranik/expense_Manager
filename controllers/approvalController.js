// controllers/approvalController.js
const Approval = require('../models/Approval');
const Expense = require('../models/Expense');

exports.getPendingApprovals = async (req, res) => {
  try {
    const approvals = await Approval.find({ approver: req.user._id, status: 'pending' })
      .populate('expense');
    res.json(approvals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.approveExpense = async (req, res) => {
  try {
    const { approvalId } = req.params;
    const { comments, action } = req.body; // action = 'approve' | 'reject'

    const approval = await Approval.findById(approvalId).populate('expense');
    if (!approval) return res.status(404).json({ message: 'Approval not found' });

    approval.status = action === 'approve' ? 'approved' : 'rejected';
    approval.comments = comments;
    approval.actedAt = new Date();
    await approval.save();

    // If approved, check if next approver exists
    if (approval.status === 'approved') {
      const nextApproval = await Approval.findOne({
        expense: approval.expense._id,
        level: approval.level + 1
      });
      if (nextApproval) {
        // send notification to next approver (TODO: integrate mail/sms)
      } else {
        // final approval reached
        approval.expense.status = 'approved';
        await approval.expense.save();
      }
    } else {
      // Rejected -> update expense status
      approval.expense.status = 'rejected';
      await approval.expense.save();
    }

    res.json({ message: `Expense ${approval.status}`, approval });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
