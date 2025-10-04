const mongoose = require('mongoose');

const approvalStepSchema = new mongoose.Schema({
  step: { type: Number, required: true },
  approverRole: { type: String, required: true }
});

const approvalRuleSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  ruleType: { type: String, enum: ['percentage', 'specific', 'hybrid', 'sequential'], default: 'sequential' },
  percentageThreshold: { type: Number }, // e.g. 60
  specificApprovers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  steps: [approvalStepSchema]
}, { timestamps: true });

module.exports = mongoose.model('ApprovalRule', approvalRuleSchema);