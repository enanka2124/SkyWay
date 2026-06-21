const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  address: {
    address: String,
    city: String,
    state: String,
    pincode: String,
  },
  aadhaarFile: {
    type: String,
    required: true,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  deletedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// When a soft-deleted user is hard-deleted during re-registration cleanup,
// only remove their Aadhaar file — bookings are kept so trip history is preserved.
UserSchema.post('findOneAndDelete', async function (doc) {
  if (doc && doc.aadhaarFile) {
    const filePath = path.join(__dirname, '..', 'uploads', doc.aadhaarFile);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`Deleted Aadhaar file for: ${doc.email}`);
      } catch (err) {
        console.error(`Could not delete Aadhaar file: ${err.message}`);
      }
    }
  }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
