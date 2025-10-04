const mongoose = require('mongoose');

const approvalHistorySchema = new mongoose.Schema({
    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['Approved', 'Rejected'] },
    comment: { type: String },
    approvedAt: { type: Date, default: Date.now }
});

const expenseSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // 🔑 FIXED
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },

    currentApprover: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvalHistory: [approvalHistorySchema]
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
