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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash the password before saving (Mongoose v9: async hooks resolve via Promise, no next() needed)
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Cascade delete bookings and associated files when a User is deleted
UserSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    // 1. Delete all bookings associated with this user
    try {
      const Booking = mongoose.model('Booking');
      await Booking.deleteMany({ userEmail: doc.email });
      console.log(`[CLEANUP] Deleted all bookings for user: ${doc.email}`);
    } catch (err) {
      console.error(`[CLEANUP ERROR] Failed to delete bookings: ${err.message}`);
    }

    // 2. Delete the Aadhaar PDF file from the uploads directory
    if (doc.aadhaarFile) {
      const filePath = path.join(__dirname, '..', 'uploads', doc.aadhaarFile);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`[CLEANUP] Deleted Aadhaar file for: ${doc.email}`);
        } catch (err) {
          console.error(`[CLEANUP ERROR] Could not delete file: ${err.message}`);
        }
      }
    }
  }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
