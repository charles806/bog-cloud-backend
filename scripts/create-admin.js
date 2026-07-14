const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../src/config/db');
const User = require('../src/models/User');

const createAdmin = async () => {
  try {
    await connectDB();

    const email = process.argv[2];
    const password = process.argv[3];
    const firstName = process.argv[4] || 'Admin';
    const lastName = process.argv[5] || 'User';

    if (!email || !password) {
      console.error('Usage: npm run create-admin email password [firstName] [lastName]');
      process.exit(1);
    }

    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`User "${email}" already exists. Updating role to admin.`);
      existing.role = 'admin';
      await existing.save();
      console.log(`User "${email}" is now admin.`);
      console.log(`Please set up MFA before logging in.`);
      process.exit(0);
    }

    const user = await User.create({
      email,
      passwordHash: password,
      firstName,
      lastName,
      accountType: 'individual',
      role: 'admin',
      isActive: true
    });

    console.log(`Admin user created: ${email}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Role: admin`);
    console.log('Please set up MFA before logging in.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

createAdmin();