const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

async function listUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI.trim());
    console.log('Connected to MongoDB');
    const users = await User.find({ deletedAt: null }).limit(10);
    console.log('Users:');
    users.forEach(u => console.log(`- Email: ${u.email}, Phone: ${u.phone}`));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listUsers();
