const { validateTransfer } = require('../services/transactionService');

const validateTransaction = async (req, res, next) => {
  const { fromAccount, toAccount, amount } = req.body;

  // Basic validation
  if (!fromAccount || !toAccount || !amount) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: fromAccount, toAccount, amount'
    });
  }

  if (amount <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Amount must be greater than 0'
    });
  }

  if (fromAccount === toAccount) {
    return res.status(400).json({
      success: false,
      error: 'Cannot transfer to same account'
    });
  }

  next();
};

module.exports = { validateTransaction };