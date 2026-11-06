const mongoose = require('mongoose');

const transactionLogSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  fromAccount: {
    type: String,
    required: true
  },
  toAccount: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'rolled_back'],
    default: 'pending'
  },
  failureReason: {
    type: String
  },
  metadata: {
    fromBalanceBefore: Number,
    fromBalanceAfter: Number,
    toBalanceBefore: Number,
    toBalanceAfter: Number
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  rolledBackAt: Date
});

// Index for faster queries
transactionLogSchema.index({ transactionId: 1 });
transactionLogSchema.index({ fromAccount: 1, timestamp: -1 });
transactionLogSchema.index({ status: 1 });

module.exports = mongoose.model('TransactionLog', transactionLogSchema);