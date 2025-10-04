const mongoose = require('mongoose');

const ruleStepSchema = new mongoose.Schema({
    stepNumber: { type: Number, required: true }, // Defines sequence [cite: 23]
    name: String, // e.g., Manager, Finance, Director [cite: 26, 28, 31]
    
    // List of approvers for this step (Can be role or specific user)
    approvers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    
    // Conditional Approval Fields [cite: 36, 37]
    ruleType: { // Supports: Percentage, Specific, Hybrid [cite: 39, 40, 41]
        type: String,
        enum: ['Sequential', 'Percentage', 'Specific', 'Hybrid'], 
        default: 'Sequential'
    },
    percentageRequired: Number, // e.g., 60% of approvers [cite: 39]
    specificApprover: { // e.g., If CFO approves [cite: 40]
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

const approvalRuleSchema = new mongoose.Schema({
    company: { // Rule is specific to a company
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        unique: true
    },
    // Defines the sequence of approvers [cite: 23-31]
    steps: [ruleStepSchema],
    
    // Flag to check if the employee's manager must approve first [cite: 22]
    isManagerApprover: { 
        type: Boolean,
        default: true
    },
    // Optional: Rule could be based on amount thresholds [cite: 5]
    minAmount: Number,
    maxAmount: Number
});

module.exports = mongoose.model('ApprovalRule', approvalRuleSchema);