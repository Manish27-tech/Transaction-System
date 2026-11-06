const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Account = require('../models/Account');

// Get user's accounts
router.get('/my-accounts', authMiddleware, async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.userId });
    res.json({ success: true, data: accounts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Simple stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.userId });
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    
    res.json({
      success: true,
      data: {
        totalBalance,
        accountCount: accounts.length,
        accounts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;