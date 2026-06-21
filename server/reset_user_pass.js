const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

async function resetPass() {
  try {
    await mongoose.connect(process.env.MONGO_URI.trim());
    console.log('Connected to MongoDB');
    const email = 'enankanandi083@gmail.com';
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`User ${email} not found.`);
      process.exit(1);
    }
    user.password = 'password123';
    await user.save();
    console.log(`Successfully updated password for ${email} to 'password123'`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

resetPass();
