const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Account = require('../models/Account');

// Simple transfer without complex transactions (for testing)
router.post('/transfer', authMiddleware, async (req, res) => {
  try {
    const { fromAccount, toAccount, amount } = req.body;

    // Validate input
    if (!fromAccount || !toAccount || !amount) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    if (amount <= 0) {
      return res.status(400).json({ success: false, error: 'Amount must be greater than 0' });
    }

    // Find accounts
    const from = await Account.findOne({ accountNumber: fromAccount });
    const to = await Account.findOne({ accountNumber: toAccount });

    if (!from) {
      return res.status(404).json({ success: false, error: 'Source account not found' });
    }

    if (!to) {
      return res.status(404).json({ success: false, error: 'Destination account not found' });
    }

    // Check balance
    if (from.balance < amount) {
      return res.status(400).json({ 
        success: false, 
        error: `Insufficient balance. Available: ${from.balance}, Required: ${amount}` 
      });
    }

    // Perform transfer
    from.balance -= amount;
    to.balance += amount;

    await from.save();
    await to.save();

    res.json({
      success: true,
      message: 'Transfer completed successfully',
      data: {
        fromAccount,
        toAccount,
        amount,
        fromBalance: from.balance,
        toBalance: to.balance,
        transactionId: 'TXN' + Date.now(),
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get balance
router.get('/balance/:accountNumber', authMiddleware, async (req, res) => {
  try {
    const account = await Account.findOne({ accountNumber: req.params.accountNumber });
    
    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }

    res.json({
      success: true,
      data: {
        accountNumber: account.accountNumber,
        balance: account.balance,
        accountType: account.accountType
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;