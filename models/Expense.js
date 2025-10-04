const mongoose = require('mongoose');

const approvalHistorySchema = new mongoose.Schema({
    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['Approved', 'Rejected'] },
    comment: { type: String },
    approvedAt: { type: Date, default: Date.now }
});

const expenseSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },

    // --- NEW FIELDS ---
    // Tracks whose turn it is to approve the expense
    currentApprover: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // A log of everyone who has already approved or rejected
    approvalHistory: [approvalHistorySchema]
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);