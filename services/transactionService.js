const mongoose = require('mongoose');
const Account = require('../models/Account');
const TransactionLog = require('../models/TransactionLog');
const crypto = require('crypto');

// Generate unique transaction ID
const generateTransactionId = () => {
  return 'TXN' + Date.now() + crypto.randomBytes(4).toString('hex').toUpperCase();
};

// Core transfer function with transaction
const transferMoney = async (fromAccountNumber, toAccountNumber, amount) => {
  const session = await mongoose.startSession();
  const transactionId = generateTransactionId();
  
  let fromAccount, toAccount;
  
  try {
    // Start transaction
    session.startTransaction({
      readPreference: 'primary',
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' }
    });

    console.log(`[${new Date().toISOString()}] Transaction ${transactionId} started`);

    // 1. Log pending transaction
    const pendingLog = new TransactionLog({
      transactionId,
      fromAccount: fromAccountNumber,
      toAccount: toAccountNumber,
      amount,
      status: 'pending'
    });
    await pendingLog.save({ session });

    // 2. Find and lock accounts
    fromAccount = await Account.findOne({ accountNumber: fromAccountNumber })
      .session(session);
    
    toAccount = await Account.findOne({ accountNumber: toAccountNumber })
      .session(session);

    // 3. Validate accounts
    if (!fromAccount) {
      throw new Error(`Source account ${fromAccountNumber} not found`);
    }
    
    if (!toAccount) {
      throw new Error(`Destination account ${toAccountNumber} not found`);
    }

    if (!fromAccount.isActive) {
      throw new Error('Source account is deactivated');
    }

    if (!toAccount.isActive) {
      throw new Error('Destination account is deactivated');
    }

    // 4. Check sufficient balance
    if (fromAccount.balance < amount) {
      throw new Error(`Insufficient balance. Available: ${fromAccount.balance}, Required: ${amount}`);
    }

    // Save balances before transaction
    const fromBalanceBefore = fromAccount.balance;
    const toBalanceBefore = toAccount.balance;

    // 5. Perform transfer
    fromAccount.balance -= amount;
    toAccount.balance += amount;
    
    // Increment version for optimistic locking
    fromAccount.version += 1;
    toAccount.version += 1;

    // 6. Save updated accounts
    await fromAccount.save({ session });
    await toAccount.save({ session });

    // 7. Update transaction log with success
    await TransactionLog.updateOne(
      { transactionId },
      {
        status: 'completed',
        completedAt: new Date(),
        metadata: {
          fromBalanceBefore,
          fromBalanceAfter: fromAccount.balance,
          toBalanceBefore,
          toBalanceAfter: toAccount.balance
        }
      },
      { session }
    );

    // 8. Commit transaction
    await session.commitTransaction();
    
    console.log(`[${new Date().toISOString()}] Transaction ${transactionId} completed successfully`);
    
    return {
      success: true,
      transactionId,
      fromAccount: fromAccountNumber,
      toAccount: toAccountNumber,
      amount,
      fromBalance: fromAccount.balance,
      toBalance: toAccount.balance,
      timestamp: new Date()
    };
    
  } catch (error) {
    // Rollback transaction on error
    console.error(`[${new Date().toISOString()}] Transaction ${transactionId} failed:`, error.message);
    
    await session.abortTransaction();
    
    // Update transaction log with failure
    await TransactionLog.updateOne(
      { transactionId },
      {
        status: 'failed',
        failureReason: error.message,
        rolledBackAt: new Date()
      }
    );
    
    throw error;
    
  } finally {
    session.endSession();
  }
};

// Get transaction status
const getTransactionStatus = async (transactionId) => {
  const transaction = await TransactionLog.findOne({ transactionId });
  if (!transaction) {
    throw new Error('Transaction not found');
  }
  return transaction;
};

// Get account transaction history
const getAccountHistory = async (accountNumber, limit = 50) => {
  const transactions = await TransactionLog.find({
    $or: [
      { fromAccount: accountNumber },
      { toAccount: accountNumber }
    ],
    status: { $in: ['completed', 'failed', 'rolled_back'] }
  })
  .sort({ timestamp: -1 })
  .limit(limit);
  
  return transactions;
};

// Manual rollback (for admin)
const manualRollback = async (transactionId) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const transaction = await TransactionLog.findOne({ transactionId }).session(session);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    if (transaction.status !== 'completed') {
      throw new Error(`Cannot rollback transaction with status: ${transaction.status}`);
    }
    
    // Reverse the transaction
    const fromAccount = await Account.findOne({ accountNumber: transaction.fromAccount }).session(session);
    const toAccount = await Account.findOne({ accountNumber: transaction.toAccount }).session(session);
    
    fromAccount.balance += transaction.amount;
    toAccount.balance -= transaction.amount;
    
    await fromAccount.save({ session });
    await toAccount.save({ session });
    
    // Update transaction log
    transaction.status = 'rolled_back';
    transaction.rolledBackAt = new Date();
    await transaction.save({ session });
    
    await session.commitTransaction();
    
    return {
      success: true,
      message: 'Transaction rolled back successfully',
      transactionId
    };
    
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = {
  transferMoney,
  getTransactionStatus,
  getAccountHistory,
  manualRollback,
  generateTransactionId
};