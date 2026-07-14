const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../src/config/db');
const User = require('../src/models/User');

const removeAdmin = async () => {
  try {
    await connectDB();

    const email = process.argv[2];
    if (!email) {
      console.error('Usage: npm run remove-admin email');
      process.exit(1);
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.error(`User "${email}" not found.`);
      process.exit(1);
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      console.log(`User "${email}" is not an admin.`);
      process.exit(0);
    }

    user.role = 'user';
    await user.save();

    console.log(`Admin privileges removed from "${email}".`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

removeAdmin();