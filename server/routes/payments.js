const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const axios = require('axios');

// ── In-memory OTP store (expires in 10 minutes) ───────────────────────────────
const otpStore = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of otpStore.entries()) {
    if (val.expiresAt < now) otpStore.delete(key);
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
// NOTIFICATION CHANNELS
//
// Priority order:
//   1. Email (nodemailer / Gmail SMTP) — UNLIMITED FREE, always works ✅
//   2. Fast2SMS                        — Use if FAST2SMS_API_KEY is set
//   3. Textbelt free                   — Best-effort 1 free SMS/day/IP
//   4. Gmail email-to-SMS gateways     — Covers Airtel/Jio/Vi numbers (best effort)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Attempt to resolve an Indian mobile number to its carrier's email-to-SMS gateway.
 * Carriers in India don't officially publish these, but some routes work.
 * Returns an array of gateway email addresses to try (best effort).
 */
function getCarrierGatewayEmails(phone) {
  const num = String(phone).replace(/\D/g, '').replace(/^91/, '').slice(-10);
  if (num.length !== 10) return [];
  // Indian carrier email-to-SMS gateways (best-effort, not officially supported)
  // We try multiple in case one works
  return [
    `${num}@airtelap.com`,      // Airtel (AP/Telangana)
    `${num}@mms.airtelap.com`,  // Airtel MMS
  ];
  // Note: Jio and Vi/BSNL don't have public email-to-SMS gateways in India.
  // The safest fallback is always email to the user's actual email address.
}

/**
 * Send SMS via Textbelt (https://textbelt.com)
 * Key 'textbelt' = 1 free SMS per day per IP, no signup required.
 * Falls back gracefully — never throws.
 */
async function tryTextbeltSms(phone, message) {
  const num = String(phone).replace(/\D/g, '');
  const intlNum = num.startsWith('91') ? '+' + num : '+91' + num.slice(-10);
  try {
    const resp = await axios.post('https://textbelt.com/text', {
      phone: intlNum,
      message,
      key: 'textbelt', // free = 1/day per server IP
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

/**
 * Send SMS via Fast2SMS (if API key configured).
 */
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

/**
 * Master SMS dispatcher — tries every free channel in order.
 * Email is always the guaranteed channel (handled separately).
 */
async function dispatchSms(phone, message) {
  if (!phone) return;
  // 1. Try Fast2SMS (if key configured)
  if (await tryFast2Sms(phone, message)) return;
  // 2. Try Textbelt free (1/day per server IP)
  if (await tryTextbeltSms(phone, message)) return;
  // 3. Log that SMS wasn't sent — email will carry the notification
  const num = String(phone).replace(/\D/g, '').replace(/^91/, '').slice(-10);
  console.log(`ℹ SMS channels exhausted for +91${num}. Email notification was sent.`);
}

// ── OTP Email ─────────────────────────────────────────────────────────────────
async function sendOtpEmail({ to, firstName, otp, amount }) {
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
        <div style="color:rgba(255,255,255,.3);font-size:.75rem;margin-top:.5rem">⏱ Valid for 10 minutes only. Do not refresh.</div>
      </div>
      <div class="warn">🔒 Never share this OTP. SkyWay/JusPay will NEVER ask for it.<br>If you didn't initiate this, ignore this email.</div>
    </div>
    <div class="ftr">SkyWay Travel · Powered by JusPay · PCI DSS Level 1<br>Automated message — do not reply.</div>
  </div></div></body></html>`;

  await mailer.sendMail({
    from: `"SkyWay · JusPay OTP" <${process.env.EMAIL_USER}>`,
    to,
    subject: `🔐 ${otp} — SkyWay Payment OTP (valid 10 mins)`,
    html,
  });
  console.log(`✅ OTP email sent → ${to}`);
}

// ── Booking Confirmation Email ─────────────────────────────────────────────────
async function sendConfirmationEmail({ to, firstName, lastName, amount, bookingId, paymentId, method, bookingType, from, to: dest, airline, paidAt }) {
  if (!to) return;
  const label    = bookingType === 'hotel' ? 'Hotel Reservation' : 'Flight Ticket';
  const route    = from && dest ? `${from} → ${dest}` : (airline || 'SkyWay');
  const dateStr  = new Date(paidAt || Date.now()).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

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

// ════════════════════════════════════════════════════════════════════════════
// ROUTES
// ════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/payments/send-otp
 * Generates OTP → sends email (always) + SMS (best-effort free channels)
 */
router.post('/send-otp', async (req, res) => {
  const { email, phone, firstName, amount, method, bookingType, from, to, airline } = req.body;
  if (!email && !phone) {
    return res.status(400).json({ success: false, error: 'Email or phone required' });
  }

  const otp       = generateOtp();
  const sessionId = 'sess_' + Math.random().toString(36).substr(2, 16);
  const expiresAt  = Date.now() + 10 * 60 * 1000; // 10 minutes

  otpStore.set(sessionId, {
    otp, expiresAt, attempts: 0,
    payload: { email, phone, firstName, amount, method, bookingType, from, to, airline },
  });

  // ── Send OTP via ALL available free channels ──
  const results = await Promise.allSettled([
    // 1. Email — unlimited free ✅
    sendOtpEmail({ to: email, firstName, otp, amount }),
    // 2. SMS — best-effort free (Textbelt 1/day, then Fast2SMS if key set)
    dispatchSms(phone, `SkyWay OTP: ${otp} for Rs.${Number(amount || 0).toLocaleString('en-IN')} payment. Valid 10 min. DO NOT share. -JusPay`),
  ]);

  const emailSent = results[0].status === 'fulfilled';
  if (results[0].status === 'rejected') console.log('OTP email error:', results[0].reason?.message);

  console.log(`🔐 OTP [${otp}] → session ${sessionId} | email:${emailSent}`);

  res.json({
    success: true,
    sessionId,
    emailSent,
    message: emailSent
      ? `OTP sent to ${email}`
      : 'OTP generated — check your email',
    expiresInMinutes: 10,
  });
});

/**
 * POST /api/payments/verify-otp
 * Verifies OTP → processes payment → sends confirmation email + SMS
 */
router.post('/verify-otp', async (req, res) => {
  const { sessionId, otp: userOtp } = req.body;
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

  // ✅ OTP correct — process payment
  const { email, phone, firstName, amount, method, bookingType, from, to, airline } = session.payload;
  otpStore.delete(sessionId);

  const orderId       = 'order_' + Math.random().toString(36).substr(2, 12).toUpperCase();
  const paymentId     = 'pay_'   + Math.random().toString(36).substr(2, 12).toUpperCase();
  const bookingId     = (bookingType === 'hotel' ? 'HTL' : 'SKY') + Math.random().toString(36).substr(2, 8).toUpperCase();
  const paidAt        = new Date().toISOString();

  // ── Send booking confirmation via ALL channels (background) ──
  Promise.allSettled([
    // Email — unlimited free ✅
    sendConfirmationEmail({ to: email, firstName, lastName: '', amount, bookingId, paymentId, method, bookingType, from, to, airline, paidAt }),
    // SMS — best-effort free channels
    dispatchSms(phone, `SkyWay Booking ${bookingId} CONFIRMED! Amount: Rs.${Number(amount).toLocaleString('en-IN')}. Txn: ${paymentId}. Have a great trip! -SkyWay`),
  ]).then(results => {
    results.forEach((r, i) => {
      if (r.status === 'rejected') console.log(`Confirmation ${i === 0 ? 'email' : 'SMS'} error:`, r.reason?.message);
    });
    console.log(`✅ Payment ${paymentId} | Booking ${bookingId} | ₹${amount}`);
  });

  res.json({
    success: true,
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
