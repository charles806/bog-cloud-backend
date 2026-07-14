const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../src/config/db');
const User = require('../src/models/User');

const setAdmin = async () => {
  try {
    await connectDB();

    const email = process.argv[2];
    if (!email) {
      console.error('Usage: npm run set-admin email');
      process.exit(1);
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.error(`User "${email}" not found.`);
      process.exit(1);
    }

    user.role = 'admin';
    await user.save();

    console.log(`User "${email}" is now admin.`);
    console.log('Please set up MFA before logging in.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

setAdmin();