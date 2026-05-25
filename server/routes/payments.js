const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const axios = require('axios');

// ════════════════════════════════════════════════════════════════════════════
// IN-MEMORY STORES
// ════════════════════════════════════════════════════════════════════════════

// OTP sessions — keyed by sessionId
const otpStore = new Map();

// Device-based throttle — one active OTP per deviceId
// deviceStore: deviceId → { sessionId, expiresAt }
const deviceStore = new Map();

// Auto-cleanup every 5 min
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of otpStore.entries()) {
    if (val.expiresAt < now) otpStore.delete(key);
  }
  for (const [key, val] of deviceStore.entries()) {
    if (val.expiresAt < now) deviceStore.delete(key);
  }
}, 5 * 60 * 1000);

// ── Nodemailer transporter (Gmail — unlimited free) ───────────────────────────
const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ════════════════════════════════════════════════════════════════════════════
// UPI BANK RESOLUTION
// Maps UPI handle suffixes to bank names, used for realistic display
// ════════════════════════════════════════════════════════════════════════════
const upiHandleBankMap = {
  'okaxis':    { bank: 'Axis Bank',       icon: '🏦', color: '#8B1A1A' },
  'okhdfcbank':{ bank: 'HDFC Bank',       icon: '🏦', color: '#004C8F' },
  'okicici':   { bank: 'ICICI Bank',      icon: '🏦', color: '#F37F20' },
  'oksbi':     { bank: 'State Bank of India', icon: '🏦', color: '#22409A' },
  'ybl':       { bank: 'Yes Bank / PhonePe', icon: '📱', color: '#5f259f' },
  'ibl':       { bank: 'IDFC First Bank', icon: '🏦', color: '#0033A0' },
  'axl':       { bank: 'Axis Bank (Lite)', icon: '🏦', color: '#8B1A1A' },
  'paytm':     { bank: 'Paytm Payments Bank', icon: '💙', color: '#00B9F1' },
  'upi':       { bank: 'BHIM UPI',        icon: '🇮🇳', color: '#138808' },
  'icici':     { bank: 'ICICI Bank',      icon: '🏦', color: '#F37F20' },
  'sbi':       { bank: 'State Bank of India', icon: '🏦', color: '#22409A' },
  'hdfc':      { bank: 'HDFC Bank',       icon: '🏦', color: '#004C8F' },
  'kotak':     { bank: 'Kotak Mahindra Bank', icon: '🏦', color: '#EE3124' },
  'bob':       { bank: 'Bank of Baroda',  icon: '🏦', color: '#FF6600' },
  'pnb':       { bank: 'Punjab National Bank', icon: '🏦', color: '#1A237E' },
  'idfcbank':  { bank: 'IDFC FIRST Bank', icon: '🏦', color: '#0033A0' },
  'airtel':    { bank: 'Airtel Payments Bank', icon: '📡', color: '#E40000' },
  'fbl':       { bank: 'Federal Bank',    icon: '🏦', color: '#005BAC' },
};

function resolveUpiBank(upiId) {
  if (!upiId || typeof upiId !== 'string') return null;
  const handle = upiId.split('@')[1]?.toLowerCase();
  if (!handle) return null;
  // Exact match first
  if (upiHandleBankMap[handle]) return upiHandleBankMap[handle];
  // Partial match
  for (const [key, info] of Object.entries(upiHandleBankMap)) {
    if (handle.includes(key) || key.includes(handle)) return info;
  }
  return { bank: 'Your Bank', icon: '🏦', color: '#6b7280' };
}

// ════════════════════════════════════════════════════════════════════════════
// BALANCE SIMULATION ENGINE
// Simulates a bank balance check. In a real system this would call bank APIs.
//
// Logic:
//  - Amounts ≤ ₹1,50,000 → always sufficient (covers 99% of bookings)
//  - UPI IDs ending in "fail" or "broke" → always insufficient (for testing)
//  - Very large amounts (> ₹5,00,000) → insufficient (rare edge case)
// ════════════════════════════════════════════════════════════════════════════
function simulateBalanceCheck(amount, method, upiId, cardLast4) {
  const amt = Number(amount || 0);

  // Test override: UPI IDs that intentionally fail
  if (upiId) {
    const user = upiId.split('@')[0].toLowerCase();
    if (user === 'fail' || user === 'broke' || user.endsWith('fail') || user === 'test_fail') {
      return { sufficient: false, reason: 'insufficient_funds', balance: Math.round(amt * 0.3) };
    }
  }

  // Very high amount → simulate insufficient (> ₹5L)
  if (amt > 500000) {
    return { sufficient: false, reason: 'daily_limit_exceeded', balance: 500000 };
  }

  // Normal amounts → always sufficient for demo
  return { sufficient: true, balance: Math.round(amt * (1.5 + Math.random() * 2)) };
}

// ════════════════════════════════════════════════════════════════════════════
// NOTIFICATION CHANNELS
// ════════════════════════════════════════════════════════════════════════════

function getCarrierGatewayEmails(phone) {
  const num = String(phone).replace(/\D/g, '').replace(/^91/, '').slice(-10);
  if (num.length !== 10) return [];
  return [`${num}@airtelap.com`, `${num}@mms.airtelap.com`];
}

async function tryTextbeltSms(phone, message) {
  const num = String(phone).replace(/\D/g, '');
  const intlNum = num.startsWith('91') ? '+' + num : '+91' + num.slice(-10);
  try {
    const resp = await axios.post('https://textbelt.com/text', {
      phone: intlNum, message, key: 'textbelt',
    }, { timeout: 8000 });
    if (resp.data?.success) {
      console.log(`✅ Textbelt SMS sent to ${intlNum} (quota left: ${resp.data.quotaRemaining})`);
      return true;
    }
    console.log(`⚠ Textbelt: ${resp.data?.error || 'failed'}`);
    return false;
  } catch (err) {
    console.log('⚠ Textbelt error:', err.message);
    return false;
  }
}

async function tryFast2Sms(phone, message) {
  const key = process.env.FAST2SMS_API_KEY;
  if (!key || key === 'your_fast2sms_api_key_here') return false;
  const num = String(phone).replace(/\D/g, '').replace(/^91/, '').slice(-10);
  if (num.length !== 10) return false;
  try {
    const resp = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      { route: 'q', message, language: 'english', flash: 0, numbers: num },
      { headers: { authorization: key, 'Content-Type': 'application/json' }, timeout: 8000 }
    );
    if (resp.data?.return) { console.log(`✅ Fast2SMS sent to +91${num}`); return true; }
    console.log('⚠ Fast2SMS:', JSON.stringify(resp.data));
    return false;
  } catch (err) {
    console.log('⚠ Fast2SMS error:', err.response?.data || err.message);
    return false;
  }
}

async function dispatchSms(phone, message) {
  if (!phone) return;
  if (await tryFast2Sms(phone, message)) return;
  if (await tryTextbeltSms(phone, message)) return;
  const num = String(phone).replace(/\D/g, '').replace(/^91/, '').slice(-10);
  console.log(`ℹ SMS channels exhausted for +91${num}. Email notification was sent.`);
}

// ── OTP Email ─────────────────────────────────────────────────────────────────
async function sendOtpEmail({ to, firstName, otp, amount, validMins = 10 }) {
  if (!to) return;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{font-family:'Segoe UI',Arial,sans-serif;background:#0f0f1a;color:#e0e0f0;margin:0;padding:0}
    .wrap{max-width:520px;margin:0 auto;padding:2rem 1rem}
    .card{background:linear-gradient(135deg,#1a1a3e,#1e1040);border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.08)}
    .hdr{background:linear-gradient(135deg,#1a1a3e,#2d1b69);padding:2rem;text-align:center;border-bottom:1px solid rgba(255,107,53,.25)}
    .logo{width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#ff6b35,#f7931e);display:inline-flex;align-items:center;justify-content:center;font-size:1.6rem;font-weight:900;color:#fff;margin-bottom:.75rem}
    .body{padding:2rem;text-align:center}
    .otpbox{background:rgba(247,147,30,.08);border:2px dashed rgba(247,147,30,.4);border-radius:14px;padding:1.5rem;margin:1.25rem 0}
    .otpdigits{font-size:2.8rem;font-weight:900;color:#f7931e;letter-spacing:10px}
    .badge{display:inline-block;background:rgba(34,208,122,.12);border:1px solid rgba(34,208,122,.3);border-radius:20px;padding:.3rem 1rem;color:#22d07a;font-weight:700;font-size:.9rem;margin-bottom:1rem}
    .timer{display:inline-block;background:rgba(255,107,53,.1);border:1px solid rgba(255,107,53,.3);border-radius:20px;padding:.3rem 1rem;color:#ff6b35;font-weight:700;font-size:.85rem;margin-top:.5rem}
    .warn{background:rgba(255,107,53,.08);border:1px solid rgba(255,107,53,.2);border-radius:10px;padding:.75rem 1rem;font-size:.8rem;color:rgba(255,255,255,.5);margin-top:1.25rem}
    .ftr{background:rgba(255,255,255,.02);padding:1rem 2rem;text-align:center;font-size:.75rem;color:rgba(255,255,255,.25);border-top:1px solid rgba(255,255,255,.06)}
  </style></head><body><div class="wrap"><div class="card">
    <div class="hdr">
      <div class="logo">J</div>
      <div style="color:#fff;font-size:1.1rem;font-weight:700">JusPay · Bank Authentication</div>
      <div style="color:rgba(255,255,255,.45);font-size:.82rem;margin-top:.3rem">One-Time Password</div>
    </div>
    <div class="body">
      <div style="font-size:1rem;margin-bottom:.5rem">Hello, <strong>${firstName || 'Traveller'}</strong> 👋</div>
      <div style="color:rgba(255,255,255,.5);font-size:.875rem;margin-bottom:1rem">Your SkyWay payment OTP for</div>
      <div class="badge">₹${Number(amount || 0).toLocaleString('en-IN')}</div>
      <div class="otpbox">
        <div style="color:rgba(255,255,255,.4);font-size:.72rem;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:.5rem">Your OTP</div>
        <div class="otpdigits">${otp}</div>
        <div class="timer">⏱ Valid for ${validMins} minutes only</div>
      </div>
      <div class="warn">🔒 Never share this OTP. SkyWay/JusPay will NEVER ask for it.<br>If you didn't initiate this, ignore this email.</div>
    </div>
    <div class="ftr">SkyWay Travel · Powered by JusPay · PCI DSS Level 1<br>Automated message — do not reply.</div>
  </div></div></body></html>`;

  await mailer.sendMail({
    from: `"SkyWay · JusPay OTP" <${process.env.EMAIL_USER}>`,
    to,
    subject: `🔐 ${otp} — SkyWay Payment OTP (valid ${validMins} mins)`,
    html,
  });
  console.log(`✅ OTP email sent → ${to}`);
}

// ── Booking Confirmation Email ─────────────────────────────────────────────────
async function sendConfirmationEmail({ to, firstName, lastName, amount, bookingId, paymentId, method, bookingType, from, to: dest, airline, paidAt }) {
  if (!to) return;
  const label   = bookingType === 'hotel' ? 'Hotel Reservation' : 'Flight Ticket';
  const route   = from && dest ? `${from} → ${dest}` : (airline || 'SkyWay');
  const dateStr = new Date(paidAt || Date.now()).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{font-family:'Segoe UI',Arial,sans-serif;background:#0f0f1a;color:#e0e0f0;margin:0;padding:0}
    .wrap{max-width:560px;margin:0 auto;padding:2rem 1rem}
    .card{background:linear-gradient(135deg,#1a1a3e,#1e1040);border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.08)}
    .hdr{background:linear-gradient(135deg,#1c6bba,#1040a0);padding:2.5rem 2rem 2rem;text-align:center}
    .chk{width:64px;height:64px;border-radius:50%;background:rgba(34,208,122,.18);border:2px solid #22d07a;display:inline-flex;align-items:center;justify-content:center;font-size:1.8rem;margin-bottom:1rem}
    .body{padding:1.75rem 2rem}
    .badge{background:rgba(34,208,122,.12);border:1px solid rgba(34,208,122,.35);border-radius:50px;padding:.35rem 1.1rem;display:inline-block;color:#22d07a;font-weight:700;font-size:.82rem;margin-bottom:1.25rem}
    .ticket{background:rgba(245,166,35,.07);border:1.5px dashed rgba(245,166,35,.4);border-radius:12px;padding:1.1rem;text-align:center;margin:1rem 0 1.5rem}
    .tid{font-size:1.4rem;font-weight:900;color:#f5a623;letter-spacing:3px}
    table{width:100%;border-collapse:collapse}
    td{padding:.55rem 0;border-bottom:1px solid rgba(255,255,255,.06);font-size:.875rem}
    td:last-child{text-align:right;font-weight:600}
    tr:last-child td{border-bottom:none}
    .lbl{color:rgba(255,255,255,.42)}
    .amt{font-size:1.15rem;font-weight:800;color:#f5a623}
    .ftr{background:rgba(255,255,255,.02);padding:1rem 2rem;text-align:center;font-size:.76rem;color:rgba(255,255,255,.25);border-top:1px solid rgba(255,255,255,.06)}
  </style></head><body><div class="wrap"><div class="card">
    <div class="hdr">
      <div class="chk">✓</div>
      <h1 style="margin:0;color:#fff;font-size:1.55rem;font-weight:800">Booking Confirmed!</h1>
      <p style="margin:.5rem 0 0;color:rgba(255,255,255,.65);font-size:.9rem">Your ${label} is all set, ${firstName}! ✈</p>
    </div>
    <div class="body">
      <div class="badge">✓ Transaction Successful</div>
      <div class="ticket">
        <div style="color:rgba(255,255,255,.38);font-size:.7rem;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:.3rem">Booking Reference</div>
        <div class="tid">${bookingId}</div>
      </div>
      <table>
        <tr><td class="lbl">Passenger</td><td>${firstName} ${lastName || ''}</td></tr>
        <tr><td class="lbl">${bookingType === 'hotel' ? 'Destination' : 'Route'}</td><td>${route}</td></tr>
        ${airline && bookingType !== 'hotel' ? `<tr><td class="lbl">Airline</td><td>${airline}</td></tr>` : ''}
        <tr><td class="lbl">Payment Method</td><td>${(method || 'CARD').toUpperCase()}</td></tr>
        <tr><td class="lbl">Transaction ID</td><td style="font-family:monospace;font-size:.8rem">${paymentId}</td></tr>
        <tr><td class="lbl">Date &amp; Time</td><td>${dateStr}</td></tr>
        <tr><td class="lbl">Amount Paid</td><td class="amt">₹${Number(amount).toLocaleString('en-IN')}</td></tr>
      </table>
    </div>
    <div class="ftr">SkyWay Travel · Your Trusted Travel Partner<br>Keep this as your booking confirmation. Have a wonderful trip! 🌟</div>
  </div></div></body></html>`;

  await mailer.sendMail({
    from: `"SkyWay Travel" <${process.env.EMAIL_USER}>`,
    to,
    subject: `✅ Booking Confirmed — ${bookingId} | SkyWay`,
    html,
  });
  console.log(`✅ Confirmation email → ${to}`);
}

// ── Payment Failure Email ──────────────────────────────────────────────────────
async function sendPaymentFailureEmail({ to, firstName, amount, reason, method }) {
  if (!to) return;
  const reasonText = reason === 'insufficient_funds'
    ? 'Insufficient balance in your account'
    : reason === 'daily_limit_exceeded'
    ? 'Daily transaction limit exceeded'
    : 'Transaction declined by bank';

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{font-family:'Segoe UI',Arial,sans-serif;background:#0f0f1a;color:#e0e0f0;margin:0;padding:0}
    .wrap{max-width:520px;margin:0 auto;padding:2rem 1rem}
    .card{background:linear-gradient(135deg,#1a1a3e,#1e1040);border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.08)}
    .hdr{background:linear-gradient(135deg,#3a1a1a,#601020);padding:2rem;text-align:center;border-bottom:1px solid rgba(255,70,70,.25)}
    .body{padding:2rem;text-align:center}
    .warn-box{background:rgba(255,70,70,.08);border:1px solid rgba(255,70,70,.25);border-radius:12px;padding:1.25rem;margin:1rem 0;text-align:left}
    .ftr{background:rgba(255,255,255,.02);padding:1rem 2rem;text-align:center;font-size:.75rem;color:rgba(255,255,255,.25);border-top:1px solid rgba(255,255,255,.06)}
  </style></head><body><div class="wrap"><div class="card">
    <div class="hdr">
      <div style="font-size:2.5rem;margin-bottom:.5rem">✕</div>
      <div style="color:#fff;font-size:1.1rem;font-weight:700">Payment Failed</div>
    </div>
    <div class="body">
      <p>Hello <strong>${firstName || 'User'}</strong>,</p>
      <p style="color:rgba(255,255,255,.6)">Your payment of <strong style="color:#f7931e">₹${Number(amount || 0).toLocaleString('en-IN')}</strong> via ${(method || 'UPI').toUpperCase()} could not be processed.</p>
      <div class="warn-box">
        <div style="color:#ff4646;font-weight:700;margin-bottom:.5rem">❌ Reason: ${reasonText}</div>
        <div style="font-size:.8rem;color:rgba(255,255,255,.4)">No amount has been deducted from your account. Please try again with a different payment method or ensure sufficient funds.</div>
      </div>
      <p style="font-size:.85rem;color:rgba(255,255,255,.5)">If you believe this is an error, please contact your bank or try again.</p>
    </div>
    <div class="ftr">SkyWay Travel · Powered by JusPay · Automated message — do not reply.</div>
  </div></div></body></html>`;

  await mailer.sendMail({
    from: `"SkyWay Travel" <${process.env.EMAIL_USER}>`,
    to,
    subject: `❌ Payment Failed — ₹${Number(amount).toLocaleString('en-IN')} | SkyWay`,
    html,
  });
  console.log(`📧 Payment failure email → ${to}`);
}

// ════════════════════════════════════════════════════════════════════════════
// ROUTES
// ════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/payments/validate-upi
 * Validates UPI ID format and resolves the associated bank.
 * In production this would call the NPCI UPI resolution API.
 */
router.post('/validate-upi', async (req, res) => {
  const { upiId } = req.body;
  if (!upiId) return res.status(400).json({ success: false, error: 'UPI ID required' });

  // Format validation
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  if (!upiRegex.test(upiId)) {
    return res.status(400).json({ success: false, error: 'Invalid UPI ID format' });
  }

  // Simulate NPCI resolution delay (300ms)
  await new Promise(r => setTimeout(r, 300 + Math.random() * 200));

  const bankInfo = resolveUpiBank(upiId);
  if (!bankInfo) {
    return res.status(400).json({ success: false, error: 'UPI ID could not be verified. Please check and try again.' });
  }

  const username = upiId.split('@')[0];
  // Mask the name: "john" → "jo**" etc.
  const maskedName = username.slice(0, 2) + '*'.repeat(Math.max(2, username.length - 2));

  res.json({
    success: true,
    valid: true,
    bank: bankInfo.bank,
    bankIcon: bankInfo.icon,
    bankColor: bankInfo.color,
    handle: upiId.split('@')[1],
    maskedVpa: `${maskedName}@${upiId.split('@')[1]}`,
  });
});

/**
 * POST /api/payments/send-otp
 * One OTP per device: if deviceId has an active session, returns conflict.
 * Generates OTP → sends email (always) + SMS (best-effort free channels)
 */
router.post('/send-otp', async (req, res) => {
  const { email, phone, firstName, amount, method, bookingType, from, to, airline, deviceId } = req.body;
  if (!email && !phone) {
    return res.status(400).json({ success: false, error: 'Email or phone required' });
  }

  // ── One OTP per device enforcement ──────────────────────────────────────
  if (deviceId) {
    const existing = deviceStore.get(deviceId);
    if (existing && existing.expiresAt > Date.now()) {
      // Device already has a pending session — return the existing sessionId
      // so the user can just enter the OTP they already received
      console.log(`⚠ Device ${deviceId} already has active session ${existing.sessionId}`);
      return res.json({
        success: true,
        sessionId: existing.sessionId,
        emailSent: true,
        expiresInMinutes: existing.isUpi ? 5 : 10,
        alreadySent: true,
        message: 'OTP already sent to your registered contact. Please check your email/SMS.',
      });
    }
  }

  const otp = generateOtp();
  const sessionId = 'sess_' + Math.random().toString(36).substr(2, 16);

  // UPI → 5-min session; Card / Net Banking → 10-min session
  const isUpi     = (method || '').toLowerCase() === 'upi';
  const expiryMs  = isUpi ? 5 * 60 * 1000 : 10 * 60 * 1000;
  const expiresAt = Date.now() + expiryMs;

  otpStore.set(sessionId, {
    otp, expiresAt, attempts: 0,
    payload: { email, phone, firstName, amount, method, bookingType, from, to, airline },
  });

  // Track this device
  if (deviceId) {
    deviceStore.set(deviceId, { sessionId, expiresAt, isUpi });
  }

  const validMins = isUpi ? 5 : 10;
  const smsText   = `SkyWay OTP: ${otp} for Rs.${Number(amount || 0).toLocaleString('en-IN')} payment. Valid ${validMins} min. DO NOT share. -JusPay`;

  // ── Send OTP via ALL available free channels ──
  const results = await Promise.allSettled([
    sendOtpEmail({ to: email, firstName, otp, amount, validMins }),
    dispatchSms(phone, smsText),
  ]);

  const emailSent = results[0].status === 'fulfilled';
  if (results[0].status === 'rejected') console.log('OTP email error:', results[0].reason?.message);

  console.log(`🔐 OTP [${otp}] → session ${sessionId} | device:${deviceId || 'unknown'} | method:${method} | expires:${validMins}min | email:${emailSent}`);

  res.json({
    success: true,
    sessionId,
    emailSent,
    expiresInMinutes: validMins,
    message: emailSent ? `OTP sent to ${email}` : 'OTP generated — check your email',
  });
});

/**
 * POST /api/payments/verify-otp
 * Verifies OTP → runs balance check → processes payment OR returns failure
 * Returns { success, paymentStatus: 'captured'|'failed', ... }
 */
router.post('/verify-otp', async (req, res) => {
  const { sessionId, otp: userOtp, upiId, cardLast4 } = req.body;
  if (!sessionId || !userOtp) {
    return res.status(400).json({ success: false, error: 'sessionId and otp required' });
  }

  const session = otpStore.get(sessionId);
  if (!session) {
    return res.status(400).json({ success: false, error: 'OTP session not found or expired. Please resend.' });
  }
  if (Date.now() > session.expiresAt) {
    otpStore.delete(sessionId);
    return res.status(400).json({ success: false, error: 'OTP expired. Please resend.' });
  }

  session.attempts = (session.attempts || 0) + 1;
  if (session.attempts > 5) {
    otpStore.delete(sessionId);
    return res.status(400).json({ success: false, error: 'Too many attempts. Please resend OTP.' });
  }

  if (String(userOtp).trim() !== String(session.otp)) {
    const left = 5 - session.attempts;
    return res.status(400).json({
      success: false,
      error: `Incorrect OTP. ${left} attempt${left !== 1 ? 's' : ''} remaining.`,
    });
  }

  // ✅ OTP correct — run balance check
  const { email, phone, firstName, amount, method, bookingType, from, to, airline } = session.payload;
  otpStore.delete(sessionId);

  // Simulate realistic bank processing delay (1.2–2.5 sec)
  await new Promise(r => setTimeout(r, 1200 + Math.random() * 1300));

  // ── Balance check ──────────────────────────────────────────────────────
  const balanceCheck = simulateBalanceCheck(amount, method, upiId, cardLast4);

  const orderId   = 'order_' + Math.random().toString(36).substr(2, 12).toUpperCase();
  const paymentId = 'pay_'   + Math.random().toString(36).substr(2, 12).toUpperCase();
  const bookingId = (bookingType === 'hotel' ? 'HTL' : 'SKY') + Math.random().toString(36).substr(2, 8).toUpperCase();
  const processedAt = new Date().toISOString();

  if (!balanceCheck.sufficient) {
    // ── PAYMENT FAILED ───────────────────────────────────────────────────
    const failureReason = balanceCheck.reason === 'insufficient_funds'
      ? 'Insufficient balance in your account. No amount has been deducted.'
      : balanceCheck.reason === 'daily_limit_exceeded'
      ? 'Your bank\'s daily transaction limit has been exceeded. Please try again tomorrow or use a different account.'
      : 'Your bank declined the transaction. Please contact your bank.';

    // Send failure notification (background)
    Promise.allSettled([
      sendPaymentFailureEmail({ to: email, firstName, amount, reason: balanceCheck.reason, method }),
      dispatchSms(phone, `SkyWay: Your payment of Rs.${Number(amount).toLocaleString('en-IN')} FAILED. Reason: ${balanceCheck.reason === 'insufficient_funds' ? 'Insufficient funds' : 'Declined by bank'}. No amount deducted. -SkyWay`),
    ]).catch(() => {});

    console.log(`❌ Payment FAILED ${paymentId} | Reason: ${balanceCheck.reason} | ₹${amount}`);

    return res.json({
      success: true,           // OTP was correct (success: false would mean OTP error)
      paymentStatus: 'failed', // Payment itself failed
      orderId, paymentId, bookingId,
      amount, currency: 'INR',
      method: method || 'upi',
      failureReason,
      failureCode: balanceCheck.reason,
      processedAt,
    });
  }

  // ── PAYMENT CAPTURED ─────────────────────────────────────────────────────
  const paidAt = processedAt;

  // Send booking confirmation via ALL channels (background)
  Promise.allSettled([
    sendConfirmationEmail({ to: email, firstName, lastName: '', amount, bookingId, paymentId, method, bookingType, from, to, airline, paidAt }),
    dispatchSms(phone, `SkyWay Booking ${bookingId} CONFIRMED! Amount: Rs.${Number(amount).toLocaleString('en-IN')}. Txn: ${paymentId}. Have a great trip! -SkyWay`),
  ]).then(results => {
    results.forEach((r, i) => {
      if (r.status === 'rejected') console.log(`Confirmation ${i === 0 ? 'email' : 'SMS'} error:`, r.reason?.message);
    });
    console.log(`✅ Payment CAPTURED ${paymentId} | Booking ${bookingId} | ₹${amount}`);
  });

  res.json({
    success: true,
    paymentStatus: 'captured',
    orderId, paymentId, bookingId,
    amount, currency: 'INR',
    method: method || 'card',
    status: 'captured',
    paidAt,
  });
});

/**
 * POST /api/payments — legacy compatibility
 */
router.post('/', async (req, res) => {
  const { amount, currency = 'INR', bookingId, method } = req.body;
  if (!amount || !bookingId) return res.status(400).json({ success: false, error: 'Amount and bookingId required' });
  const orderId   = 'order_' + Math.random().toString(36).substr(2, 12).toUpperCase();
  const paymentId = 'pay_'   + Math.random().toString(36).substr(2, 12).toUpperCase();
  await new Promise(r => setTimeout(r, 1000));
  res.json({ success: true, orderId, paymentId, amount, currency, bookingId, method: method || 'card', status: 'captured', paidAt: new Date().toISOString() });
});

router.post('/verify', (req, res) => {
  const { orderId, paymentId } = req.body;
  if (!orderId || !paymentId) return res.status(400).json({ success: false, error: 'Missing IDs' });
  res.json({ success: true, verified: true });
});

module.exports = router;
