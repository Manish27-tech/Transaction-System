require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Account = require('./models/Account');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Account.deleteMany({});
    console.log('Cleared existing data');

    // Create test users
    const users = [
      { fullName: 'Alice Johnson', email: 'alice@bank.com', password: 'password123' },
      { fullName: 'Bob Smith', email: 'bob@bank.com', password: 'password123' },
      { fullName: 'Charlie Brown', email: 'charlie@bank.com', password: 'password123' }
    ];

    for (const userData of users) {
      const user = new User(userData);
      await user.save();

      const account = new Account({
        userId: user._id,
        balance: Math.floor(Math.random() * 50000) + 10000,
        accountType: 'savings'
      });
      await account.save();

      user.accountNumber = account.accountNumber;
      await user.save();

      console.log(`Created user: ${user.fullName} with account: ${account.accountNumber}, balance: $${account.balance}`);
    }

    console.log('\n✅ Database seeded successfully!');
    console.log('\nTest credentials:');
    console.log('Alice: alice@bank.com / password123');
    console.log('Bob: bob@bank.com / password123');
    console.log('Charlie: charlie@bank.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();