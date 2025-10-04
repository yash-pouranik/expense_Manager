const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    employee: { // Employee who submitted the expense [cite: 17]
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    // Expense details [cite: 18, 19]
    amount: { type: Number, required: true },
    currency: { type: String, required: true }, // Can be different from company's currency [cite: 18]
    category: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },

    // Core for the workflow
    status: { // Viewable status: Approved, Rejected [cite: 20]
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    // The current step in the multi-level approval flow [cite: 23]
    currentApprovalStep: { 
        type: Number,
        default: 1
    },
    // Tracks history and comments [cite: 35]
    approvalHistory: [{
        approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        step: Number,
        status: { type: String, enum: ['Pending', 'Approved', 'Rejected'] },
        comments: String, 
        approvedOn: Date
    }]
    // receiptUrl: String (For OCR/receipt storage feature [cite: 46])
}, { timestamps: true }); // Useful for tracking submission time

module.exports = mongoose.model('Expense', expenseSchema);