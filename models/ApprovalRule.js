const mongoose = require('mongoose');

const approvalRuleSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  ruleType: { type: String, enum: ['percentage', 'specific', 'hybrid'], required: true },
  percentageThreshold: { type: Number }, // e.g. 60
  specificApprovers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('ApprovalRule', approvalRuleSchema);
