const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accountNumber: {
    type: String,
    unique: true
  },
  accountType: {
    type: String,
    enum: ['savings', 'current', 'fixed_deposit'],
    default: 'savings'
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate account number before saving
accountSchema.pre('save', async function(next) {
  if (!this.accountNumber) {
    this.accountNumber = 'ACC' + Date.now() + Math.floor(Math.random() * 1000);
  }
  next();
});

module.exports = mongoose.model('Account', accountSchema);