const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const User = require('../models/User');
const { PDFParse } = require('pdf-parse');
const crypto = require('crypto');
const {
  sendRegistrationEmail,
  sendResetPasswordEmail,
  sendRecoveryEmail
} = require('../utils/mailer');

// make sure uploads dir exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const suffix = `${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    cb(null, `id_proof_${suffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF documents are accepted'), false);
    }
  },
});

// wraps multer in a promise for cleaner async/await usage
function runUpload(req, res) {
  return new Promise((resolve, reject) => {
    upload.single('aadhaarCard')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          reject(new Error(`Unexpected field: make sure the file key is 'aadhaarCard'`));
        } else {
          reject(err);
        }
      } else {
        resolve();
      }
    });
  });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    await runUpload(req, res);
  } catch (uploadErr) {
    return res.status(400).json({ success: false, error: uploadErr.message });
  }

  try {
    const { firstName, lastName, email, phone, password, address, city, state, pincode } = req.body;

    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ success: false, error: 'Personal details are missing' });
    }

    const finalPincode = pincode || req.body.pinCode;

    if (!address || !city || !state || !finalPincode) {
      return res.status(400).json({ success: false, error: 'Address details are incomplete' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'ID proof document is required' });
    }

    // basic check: the filename should reference a known ID document type
    try {
      const fileName = (req.file.originalname || '').toLowerCase();
      const idKeywords = ['aadhar', 'aadhaar', 'voter', 'passport'];
      const isFilenameValid = idKeywords.some(keyword => fileName.includes(keyword));

      console.log(`ID verification for ${firstName} ${lastName}: ${fileName} — valid: ${isFilenameValid}`);

      if (!isFilenameValid) {
        return res.status(400).json({ success: false, error: 'Invalid PDF' });
      }
    } catch (err) {
      console.error('ID verification check failed:', err.message);
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const emailConflict = await User.findOne({ email });
    if (emailConflict) {
      if (emailConflict.deletedAt) {
        if (emailConflict.deletedAt > sevenDaysAgo) {
          return res.status(409).json({ success: false, error: 'Account was deleted recently. Please wait 7 days from deletion to re-register.' });
        } else {
          await User.findByIdAndDelete(emailConflict._id);
        }
      } else {
        return res.status(409).json({ success: false, error: 'Email already in use' });
      }
    }

    const phoneConflict = await User.findOne({ phone });
    if (phoneConflict) {
      if (phoneConflict.deletedAt) {
        if (phoneConflict.deletedAt > sevenDaysAgo) {
          return res.status(409).json({ success: false, error: 'Account was deleted recently. Please wait 7 days from deletion to re-register.' });
        } else {
          await User.findByIdAndDelete(phoneConflict._id);
        }
      } else {
        return res.status(409).json({ success: false, error: 'Phone number already registered' });
      }
    }

    const newUser = new User({
      firstName,
      lastName,
      email,
      phone,
      password,
      address: { address, city, state, pincode: finalPincode },
      aadhaarFile: req.file.filename,
    });

    await newUser.save();

    const mailInfo = await sendRegistrationEmail(newUser);

    console.log(`New user registered: ${newUser.firstName} ${newUser.lastName} (${newUser.email})`);

    const userResponse = {
      _id: newUser._id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      phone: newUser.phone,
    };

    res.status(201).json({
      success: true,
      message: 'Congratulations! Welcome aboard.',
      user: userResponse,
      emailSent: !!mailInfo
    });

  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal system failure during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim(), deletedAt: null });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const authResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
    };
    return res.json({ success: true, message: 'Logged in successfully', user: authResponse });

  } catch (error) {
    const isDbError = /buffering timed out|topology was destroyed|not connected|ECONNREFUSED|MongoNetworkError/i.test(error?.message || '');
    const msg = isDbError
      ? 'Service temporarily unavailable. Please try again in a moment.'
      : 'Authentication failed. Please try again.';
    console.error('[auth/login]', error?.message);
    return res.status(503).json({ success: false, error: msg });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email required' });

    const user = await User.findOne({ email, deletedAt: null });
    if (!user) return res.status(404).json({ success: false, error: 'Account not found' });

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendResetPasswordEmail(user, resetUrl);

    res.json({ success: true, message: 'Recovery link dispatched to your inbox.' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error during password recovery' });
  }
});

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ success: false, error: 'New password is required' });

    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
    }

    // the model's pre-save hook will hash the new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful! You can now log in.' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error during password reset' });
  }
});

// POST /api/auth/forgot-email
router.post('/forgot-email', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, error: 'Phone required' });

    const user = await User.findOne({ phone, deletedAt: null });
    if (!user) return res.status(404).json({ success: false, error: 'No account linked to this number' });

    await sendRecoveryEmail(user);

    console.log(`Account recovery requested for phone: ${user.phone}`);

    const [prefix, domain] = user.email.split('@');
    const masked = `${prefix.substring(0, 2)}***@${domain}`;

    res.json({
      success: true,
      message: `Account details sent to your registered email and a notification has been sent to your phone number ${user.phone}.`,
      hint: masked
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error during account recovery' });
  }
});

// GET /api/auth/me — session validation
router.get('/me', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Session expired' });
    }

    const user = await User.findOne({ _id: userId, deletedAt: null });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User session invalid' });
    }

    const meResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
    };
    res.json({ success: true, user: meResponse });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/auth/delete-account
router.delete('/delete-account', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Session expired' });
    }

    const user = await User.findOne({ _id: userId, deletedAt: null });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found or already deleted' });
    }

    user.deletedAt = new Date();
    await user.save();

    res.json({ success: true, message: 'Account deleted successfully. You can re-register after 7 days.' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete account' });
  }
});

module.exports = router;
