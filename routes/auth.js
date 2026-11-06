const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Account = require('../models/Account');
const jwt = require('jsonwebtoken');

// Register
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, initialDeposit = 0 } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    const user = new User({ fullName, email, password });
    await user.save();

    const account = new Account({ 
      userId: user._id, 
      balance: initialDeposit 
    });
    await account.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '1h' }
    );

    res.status(201).json({
      success: true,
      data: {
        user: { id: user._id, fullName: user.fullName, email: user.email },
        account: { number: account.accountNumber, balance: account.balance },
        token
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const account = await Account.findOne({ userId: user._id });

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '1h' }
    );

    res.json({
      success: true,
      data: {
        user: { id: user._id, fullName: user.fullName, email: user.email },
        account: { number: account.accountNumber, balance: account.balance },
        token
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;