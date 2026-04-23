const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Multer config for Aadhaar PDF
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `aadhaar_${Date.now()}_${Math.random().toString(36).substr(2, 8)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

// In-memory user store (would be a database in production)
const users = [];

// POST /api/auth/register
router.post('/register', upload.single('aadhaarCard'), (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, address, city, state, pincode } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ success: false, error: 'All personal info fields are required' });
    }
    if (!address || !city || !state || !pincode) {
      return res.status(400).json({ success: false, error: 'All address fields are required' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Aadhaar card PDF is required' });
    }

    // Check if email already exists
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists' });
    }

    // Check if phone already exists
    if (users.find(u => u.phone === phone)) {
      return res.status(409).json({ success: false, error: 'An account with this phone number already exists' });
    }

    const userId = 'USR' + Math.random().toString(36).substr(2, 8).toUpperCase();
    const user = {
      userId,
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      password, // In production, hash this!
      address: { address, city, state, pincode },
      aadhaarFile: req.file.filename,
      createdAt: new Date().toISOString(),
    };

    users.push(user);

    // Return user info (without password)
    const { password: _, ...safeUser } = user;
    res.status(201).json({ success: true, message: 'Registration successful', user: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ success: false, error: 'No account found with this email' });
  }
  if (user.password !== password) {
    return res.status(401).json({ success: false, error: 'Incorrect password' });
  }

  const { password: _, ...safeUser } = user;
  res.json({ success: true, message: 'Login successful', user: safeUser });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, error: 'Email is required' });

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ success: false, error: 'No account found with this email' });
  }

  // Simulate sending reset link
  const resetToken = Math.random().toString(36).substr(2, 12).toUpperCase();
  res.json({ success: true, message: `Password reset link sent to ${email}. (Demo token: ${resetToken})` });
});

// POST /api/auth/forgot-email
router.post('/forgot-email', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ success: false, error: 'Phone number is required' });

  const user = users.find(u => u.phone === phone);
  if (!user) {
    return res.status(404).json({ success: false, error: 'No account found with this phone number' });
  }

  // Mask the email for security
  const parts = user.email.split('@');
  const masked = parts[0].substring(0, 2) + '***@' + parts[1];
  res.json({ success: true, message: `Your registered email is: ${masked}` });
});

// GET /api/auth/me — check auth
router.get('/me', (req, res) => {
  // In a real app this would use sessions/JWT — here we rely on client-side state
  res.json({ success: false, error: 'Not implemented — use client-side auth state' });
});

module.exports = router;
