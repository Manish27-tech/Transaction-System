require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();

app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Simple test route first
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Routes (will work once files are created)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/audit', require('./routes/audit'));

// Home route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Banking Transaction System',
    status: 'Server is running',
    endpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      transfer: 'POST /api/transactions/transfer',
      balance: 'GET /api/transactions/balance/:accountNumber',
      stats: 'GET /api/audit/stats'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// MongoDB connection
const PORT = process.env.PORT || 5000;

// Check if MongoDB is available
mongoose.connect('mongodb://127.0.0.1:27017/transaction_db')
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📝 Test the server: http://localhost:${PORT}/test`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('\n⚠️  Starting server without MongoDB (limited functionality)');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT} (without DB)`);
      console.log(`📝 Only test route available: http://localhost:${PORT}/test`);
    });
  });