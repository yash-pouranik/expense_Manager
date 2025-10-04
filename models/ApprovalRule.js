// models/Approval.js
const mongoose = require('mongoose');

const approvalSchema = new mongoose.Schema({
  expense: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense', required: true },
  approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  level: { type: Number, required: true }, // step number (1 = manager, 2 = finance, etc.)
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  comments: { type: String },
  actedAt: { type: Date }
});

module.exports = mongoose.model('Approval', approvalSchema);
