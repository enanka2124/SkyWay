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

// ── Nodemailer transporter (Gmail) ────────────────────────────────────────────
const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ════════════════════════════════════════════════════════════════════════════
// UPI BANK RESOLUTION
// ════════════════════════════════════════════════════════════════════════════
const upiHandleBankMap = {
  'okaxis':    { bank: 'Axis Bank',             icon: '🏦', color: '#8B1A1A' },
  'okhdfcbank':{ bank: 'HDFC Bank',             icon: '🏦', color: '#004C8F' },
  'okicici':   { bank: 'ICICI Bank',            icon: '🏦', color: '#F37F20' },
  'oksbi':     { bank: 'State Bank of India',   icon: '🏦', color: '#22409A' },
  'ybl':       { bank: 'Yes Bank / PhonePe',    icon: '📱', color: '#5f259f' },
  'ibl':       { bank: 'IDFC First Bank',       icon: '🏦', color: '#0033A0' },
  'axl':       { bank: 'Axis Bank (Lite)',      icon: '🏦', color: '#8B1A1A' },
  'paytm':     { bank: 'Paytm Payments Bank',  icon: '💙', color: '#00B9F1' },
  'upi':       { bank: 'BHIM UPI',             icon: '🇮🇳', color: '#138808' },
  'icici':     { bank: 'ICICI Bank',           icon: '🏦', color: '#F37F20' },
  'sbi':       { bank: 'State Bank of India',  icon: '🏦', color: '#22409A' },
  'hdfc':      { bank: 'HDFC Bank',            icon: '🏦', color: '#004C8F' },
  'kotak':     { bank: 'Kotak Mahindra Bank',  icon: '🏦', color: '#EE3124' },
  'bob':       { bank: 'Bank of Baroda',       icon: '🏦', color: '#FF6600' },
  'pnb':       { bank: 'Punjab National Bank', icon: '🏦', color: '#1A237E' },
  'idfcbank':  { bank: 'IDFC FIRST Bank',      icon: '🏦', color: '#0033A0' },
  'airtel':    { bank: 'Airtel Payments Bank', icon: '📡', color: '#E40000' },
  'fbl':       { bank: 'Federal Bank',         icon: '🏦', color: '#005BAC' },
};

function resolveUpiBank(upiId) {
  if (!upiId || typeof upiId !== 'string') return null;
  const handle = upiId.split('@')[1]?.toLowerCase();
  if (!handle) return null;
  if (upiHandleBankMap[handle]) return upiHandleBankMap[handle];
  for (const [key, info] of Object.entries(upiHandleBankMap)) {
    if (handle.includes(key) || key.includes(handle)) return info;
  }
  return { bank: 'Your Bank', icon: '🏦', color: '#6b7280' };
}

// ════════════════════════════════════════════════════════════════════════════
// BALANCE SIMULATION ENGINE
//
// How it works:
//  - Each payment gets a simulated "virtual bank balance"
//  - The balance is a random multiplier (0.4× – 1.8×) of the payment amount
//  - If the balance < payment amount → INSUFFICIENT FUNDS → payment FAILS
//  - This gives a realistic ~35% chance of failure at the boundary
//
// Test overrides (deterministic):
//  - Card ending 0000 or 1111  → ALWAYS insufficient funds
//  - Card ending 9999          → ALWAYS daily limit exceeded
//  - UPI handle starting with "fail", "broke", or ending "fail" → ALWAYS fail
//  - Amount > ₹5,00,000        → ALWAYS daily limit exceeded
//
// Realistic simulation:
//  - Simulated balance = amount × random(0.55 – 1.85)
//  - If simulated balance >= amount → sufficient → payment succeeds
//  - If simulated balance < amount → insufficient → payment fails
// ════════════════════════════════════════════════════════════════════════════
function simulateBalanceCheck(amount, method, upiId, cardLast4) {
  const amt = Number(amount || 0);

  // ── Deterministic test overrides: card ───────────────────────────────────
  if (cardLast4) {
    const last4 = String(cardLast4).replace(/\D/g, '').slice(-4);
    if (last4 === '0000' || last4 === '1111') {
      console.log(`💳 Test trigger: card ending ${last4} → insufficient_funds`);
      return { sufficient: false, reason: 'insufficient_funds', balance: Math.round(amt * 0.25) };
    }
    if (last4 === '9999') {
      console.log(`💳 Test trigger: card ending ${last4} → daily_limit_exceeded`);
      return { sufficient: false, reason: 'daily_limit_exceeded', balance: 500000 };
    }
  }

  // ── Deterministic test overrides: UPI ────────────────────────────────────
  if (upiId) {
    const username = upiId.split('@')[0].toLowerCase();
    if (username === 'fail' || username === 'broke' || username.endsWith('fail') || username === 'test_fail') {
      console.log(`📱 Test trigger: UPI "${username}" → insufficient_funds`);
      return { sufficient: false, reason: 'insufficient_funds', balance: Math.round(amt * 0.25) };
    }
  }

  // ── Hard limit: very large amounts ───────────────────────────────────────
  if (amt > 500000) {
    return { sufficient: false, reason: 'daily_limit_exceeded', balance: 500000 };
  }

  // ── Realistic stochastic balance simulation ───────────────────────────────
  // Generate a random "available balance" between 55% and 185% of amount.
  // This means ~25% of transactions fail due to insufficient funds naturally.
  const balanceMultiplier = 0.55 + Math.random() * 1.30; // 0.55 – 1.85
  const simulatedBalance = Math.round(amt * balanceMultiplier);

  if (simulatedBalance < amt) {
    console.log(`⚠ Simulated insufficient balance: ₹${simulatedBalance} < ₹${amt}`);
    return { sufficient: false, reason: 'insufficient_funds', balance: simulatedBalance };
  }

  console.log(`✅ Simulated balance sufficient: ₹${simulatedBalance} >= ₹${amt}`);
  return { sufficient: true, balance: simulatedBalance };
}

// ════════════════════════════════════════════════════════════════════════════
// NOTIFICATION CHANNELS
// ════════════════════════════════════════════════════════════════════════════

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
  const num = String(phone).replace(/\D/g, '').replace(/^91/, '').slice(-10);
  console.log(`📱 Attempting SMS to +91${num}: "${message.slice(0, 60)}..."`);
  if (await tryFast2Sms(phone, message)) return;
  if (await tryTextbeltSms(phone, message)) return;
  console.log(`ℹ SMS channels exhausted for +91${num}. OTP available in email.`);
}

// ════════════════════════════════════════════════════════════════════════════
// EMAIL TEMPLATES
// ════════════════════════════════════════════════════════════════════════════

// ── OTP Email — Professional JusPay style ─────────────────────────────────────
async function sendOtpEmail({ to, firstName, otp, amount, validMins = 10, from: flightFrom, dest: flightTo, airline, bookingType }) {
  if (!to) return;

  const formattedAmount = Number(amount || 0).toLocaleString('en-IN');

  // Build order detail row inside the transaction card
  let orderRowHtml = '';
  if (bookingType === 'hotel' && (flightFrom || airline)) {
    orderRowHtml = `
      <tr>
        <td style="padding:14px 20px;border-top:1px solid #e5e7eb">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:32px;height:32px;background:#eff6ff;border-radius:8px;text-align:center;vertical-align:middle;font-size:17px">🏨</td>
              <td style="padding-left:10px;vertical-align:middle">
                <div style="color:#9ca3af;font-size:10px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px">Hotel Booking</div>
                <div style="color:#111827;font-size:13px;font-weight:600">${airline || flightFrom || 'Hotel'}</div>
                ${flightFrom ? `<div style="color:#6b7280;font-size:11px;margin-top:1px">📍 ${flightFrom}</div>` : ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  } else if (flightFrom && flightTo) {
    orderRowHtml = `
      <tr>
        <td style="padding:14px 20px;border-top:1px solid #e5e7eb">
          <div style="color:#9ca3af;font-size:10px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">Flight Details</div>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="text-align:left;vertical-align:middle">
                <div style="color:#111827;font-size:18px;font-weight:800;letter-spacing:-.02em">${flightFrom}</div>
                <div style="color:#9ca3af;font-size:10px;margin-top:2px">Departure</div>
              </td>
              <td style="text-align:center;vertical-align:middle;padding:0 16px">
                <div style="display:flex;align-items:center;gap:4px">
                  <div style="width:30px;height:1px;background:#d1d5db"></div>
                  <span style="font-size:16px;color:#ea580c">✈</span>
                  <div style="width:30px;height:1px;background:#d1d5db"></div>
                </div>
                ${airline ? `<div style="color:#9ca3af;font-size:10px;margin-top:4px;text-align:center">${airline}</div>` : ''}
              </td>
              <td style="text-align:right;vertical-align:middle">
                <div style="color:#111827;font-size:18px;font-weight:800;letter-spacing:-.02em">${flightTo}</div>
                <div style="color:#9ca3af;font-size:10px;margin-top:2px">Arrival</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>JusPay Payment OTP — SkyWay</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

          <!-- ── JusPay Header ── -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 100%);border-radius:14px 14px 0 0;padding:24px 32px">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:46px;height:46px;background:linear-gradient(135deg,#ff6b35,#f7931e);border-radius:12px;text-align:center;vertical-align:middle">
                          <span style="color:#fff;font-size:24px;font-weight:900;display:block;line-height:46px">J</span>
                        </td>
                        <td style="padding-left:14px;vertical-align:middle">
                          <div style="color:#ffffff;font-size:17px;font-weight:700;letter-spacing:-.01em">JusPay</div>
                          <div style="color:rgba(255,255,255,.5);font-size:11px;margin-top:1px">Secure Payment Gateway · PCI DSS Level 1</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align:middle">
                    <div style="background:rgba(34,208,122,.12);border:1px solid rgba(34,208,122,.3);border-radius:20px;padding:5px 14px;display:inline-block">
                      <span style="color:#22d07a;font-size:11px;font-weight:700">🔒 SECURE OTP</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Orange accent line -->
          <tr><td style="background:linear-gradient(90deg,#ff6b35,#f7931e);height:3px;line-height:3px;font-size:0">&nbsp;</td></tr>

          <!-- ── Main Body ── -->
          <tr>
            <td style="background:#ffffff;padding:36px 32px 28px">

              <!-- Greeting -->
              <p style="margin:0 0 6px;color:#111827;font-size:17px;font-weight:600">Hello, ${firstName || 'Traveller'} 👋</p>
              <p style="margin:0 0 28px;color:#6b7280;font-size:14px;line-height:1.7">
                You requested an OTP to authorise a payment on <strong style="color:#111827">SkyWay Travel</strong>.
                Use this OTP within <strong style="color:#ea580c">${validMins} minutes</strong>.
              </p>

              <!-- Transaction Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid #e5e7eb;border-radius:14px;margin-bottom:28px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.05)">
                <tr>
                  <td style="background:#f9fafb;padding:18px 20px">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <div style="color:#9ca3af;font-size:10px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px">Payment Amount</div>
                          <div style="color:#ea580c;font-size:30px;font-weight:900;letter-spacing:-.03em">&#8377;${formattedAmount}</div>
                        </td>
                        <td align="right" style="vertical-align:top">
                          <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:5px 12px;display:inline-block">
                            <span style="color:#ea580c;font-size:11px;font-weight:700">SkyWay</span>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${orderRowHtml}
              </table>

              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:2px dashed #fed7aa;border-radius:14px;margin-bottom:26px">
                <tr>
                  <td style="padding:30px 20px;text-align:center">
                    <div style="color:#9ca3af;font-size:10px;text-transform:uppercase;letter-spacing:.14em;margin-bottom:14px;font-weight:600">
                      YOUR ONE-TIME PASSWORD
                    </div>
                    <div style="color:#ea580c;font-size:44px;font-weight:900;letter-spacing:16px;font-family:'Courier New',Courier,monospace;line-height:1">
                      ${otp}
                    </div>
                    <div style="margin-top:16px">
                      <span style="background:#ffffff;border:1.5px solid #fed7aa;border-radius:20px;padding:6px 18px;color:#ea580c;font-size:12px;font-weight:700;display:inline-block">
                        &#9201; Valid for ${validMins} minutes only
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:12px;margin-bottom:8px">
                <tr>
                  <td style="padding:16px 20px">
                    <div style="color:#991b1b;font-size:13px;font-weight:700;margin-bottom:8px">&#9888;&#65039; Security Notice</div>
                    <ul style="margin:0;padding-left:18px;color:#7f1d1d;font-size:12px;line-height:2">
                      <li>Never share this OTP with anyone, including SkyWay support</li>
                      <li>JusPay will <strong>NEVER</strong> call, email, or SMS you to ask for this OTP</li>
                      <li>This OTP expires automatically in ${validMins} minutes</li>
                      <li>If you didn&#39;t initiate this payment, please ignore this email</li>
                    </ul>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;border-radius:0 0 14px 14px;padding:18px 32px">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle">
                    <div style="color:#6b7280;font-size:11px">
                      Powered by <strong style="color:#ea580c">JusPay</strong> &middot; PCI DSS Level 1 &middot; RBI Authorised
                    </div>
                    <div style="color:#d1d5db;font-size:10px;margin-top:3px">
                      SkyWay Travel Pvt. Ltd. &middot; Automated message, do not reply
                    </div>
                  </td>
                  <td align="right" style="vertical-align:middle">
                    <div style="color:#d1d5db;font-size:10px">&#128274; 256-bit SSL</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await mailer.sendMail({
    from: `"JusPay · SkyWay Payments" <${process.env.EMAIL_USER}>`,
    to,
    subject: `🔐 ${otp} is your SkyWay OTP — ₹${formattedAmount} (valid ${validMins} min)`,
    html,
  });
  console.log(`✅ OTP email sent → ${to}`);
}

// ── Payment Success Confirmation Email ────────────────────────────────────────
async function sendConfirmationEmail({ to, firstName, lastName, amount, bookingId, paymentId, method, bookingType, from, to: dest, airline, paidAt }) {
  if (!to) return;

  const label     = bookingType === 'hotel' ? 'Hotel Reservation' : 'Flight Ticket';
  const isHotel   = bookingType === 'hotel';
  const route     = from && dest ? `${from} → ${dest}` : (airline || 'SkyWay');
  const dateStr   = new Date(paidAt || Date.now()).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' });
  const formattedAmount = Number(amount || 0).toLocaleString('en-IN');
  const methodLabel = (method || 'CARD').toUpperCase();

  // Route / hotel visual block
  let itineraryBlock = '';
  if (!isHotel && from && dest) {
    itineraryBlock = `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:12px;margin-bottom:20px">
        <tr>
          <td style="padding:18px 20px">
            <div style="color:#15803d;font-size:10px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:12px">&#9992; Flight Route</div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle;text-align:left">
                  <div style="color:#111827;font-size:22px;font-weight:800">${from}</div>
                  <div style="color:#6b7280;font-size:11px;margin-top:2px">Departure</div>
                </td>
                <td style="text-align:center;vertical-align:middle;padding:0 20px">
                  <div style="border-top:2px dashed #86efac;position:relative">
                    <span style="position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:#f0fdf4;padding:0 6px;font-size:16px">&#9992;</span>
                  </div>
                  ${airline ? `<div style="color:#16a34a;font-size:10px;margin-top:12px;font-weight:600">${airline}</div>` : ''}
                </td>
                <td style="vertical-align:middle;text-align:right">
                  <div style="color:#111827;font-size:22px;font-weight:800">${dest}</div>
                  <div style="color:#6b7280;font-size:11px;margin-top:2px">Arrival</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;
  } else if (isHotel) {
    itineraryBlock = `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:12px;margin-bottom:20px">
        <tr>
          <td style="padding:16px 20px">
            <div style="color:#1d4ed8;font-size:10px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:6px">&#127968; Hotel Reservation</div>
            <div style="color:#111827;font-size:16px;font-weight:700">${airline || route}</div>
            ${from ? `<div style="color:#6b7280;font-size:12px;margin-top:3px">&#128205; ${from}</div>` : ''}
          </td>
        </tr>
      </table>`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Booking Confirmed — SkyWay</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

          <!-- Header: Success Green -->
          <tr>
            <td style="background:linear-gradient(135deg,#065f46 0%,#059669 100%);border-radius:14px 14px 0 0;padding:36px 32px;text-align:center">
              <!-- Checkmark circle -->
              <div style="width:68px;height:68px;background:rgba(255,255,255,.15);border:2px solid rgba(255,255,255,.4);border-radius:50%;margin:0 auto 16px;display:table;line-height:68px;text-align:center">
                <span style="color:#ffffff;font-size:32px;display:table-cell;vertical-align:middle">&#10003;</span>
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-.02em">Booking Confirmed!</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,.75);font-size:14px">Your ${label} is all set, ${firstName}! &#9992;</p>
            </td>
          </tr>

          <!-- Green-to-white separator -->
          <tr><td style="background:linear-gradient(90deg,#059669,#10b981);height:3px;line-height:3px;font-size:0">&nbsp;</td></tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:36px 32px 28px">

              <!-- Booking Reference Badge -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1.5px solid #e5e7eb;border-radius:12px;margin-bottom:28px">
                <tr>
                  <td style="padding:20px;text-align:center">
                    <div style="color:#9ca3af;font-size:10px;text-transform:uppercase;letter-spacing:.12em;font-weight:600;margin-bottom:10px">Booking Reference</div>
                    <div style="color:#ea580c;font-size:26px;font-weight:900;letter-spacing:4px;font-family:'Courier New',Courier,monospace">${bookingId}</div>
                    <div style="margin-top:10px">
                      <span style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:20px;padding:4px 16px;color:#15803d;font-size:11px;font-weight:700;display:inline-block">
                        &#10003; Payment Successful
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Itinerary block -->
              ${itineraryBlock}

              <!-- Transaction Details Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid #e5e7eb;border-radius:12px;margin-bottom:24px;overflow:hidden">
                <tr><td colspan="2" style="background:#f9fafb;padding:12px 20px;border-bottom:1px solid #e5e7eb">
                  <span style="color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Payment Details</span>
                </td></tr>
                <tr style="border-bottom:1px solid #f3f4f6">
                  <td style="padding:12px 20px;color:#6b7280;font-size:13px">Passenger</td>
                  <td style="padding:12px 20px;color:#111827;font-size:13px;font-weight:600;text-align:right">${firstName} ${lastName || ''}</td>
                </tr>
                <tr style="border-bottom:1px solid #f3f4f6">
                  <td style="padding:12px 20px;color:#6b7280;font-size:13px">${isHotel ? 'Property' : 'Route'}</td>
                  <td style="padding:12px 20px;color:#111827;font-size:13px;font-weight:600;text-align:right">${route}</td>
                </tr>
                ${airline && !isHotel ? `
                <tr style="border-bottom:1px solid #f3f4f6">
                  <td style="padding:12px 20px;color:#6b7280;font-size:13px">Airline</td>
                  <td style="padding:12px 20px;color:#111827;font-size:13px;font-weight:600;text-align:right">${airline}</td>
                </tr>` : ''}
                <tr style="border-bottom:1px solid #f3f4f6">
                  <td style="padding:12px 20px;color:#6b7280;font-size:13px">Payment Method</td>
                  <td style="padding:12px 20px;color:#111827;font-size:13px;font-weight:600;text-align:right">${methodLabel}</td>
                </tr>
                <tr style="border-bottom:1px solid #f3f4f6">
                  <td style="padding:12px 20px;color:#6b7280;font-size:13px">Transaction ID</td>
                  <td style="padding:12px 20px;color:#6b7280;font-size:12px;font-family:'Courier New',monospace;text-align:right">${paymentId}</td>
                </tr>
                <tr style="border-bottom:1px solid #f3f4f6">
                  <td style="padding:12px 20px;color:#6b7280;font-size:13px">Date &amp; Time</td>
                  <td style="padding:12px 20px;color:#111827;font-size:13px;text-align:right">${dateStr}</td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;color:#111827;font-size:14px;font-weight:700;background:#f9fafb">Amount Paid</td>
                  <td style="padding:14px 20px;color:#ea580c;font-size:20px;font-weight:900;background:#f9fafb;text-align:right">&#8377;${formattedAmount}</td>
                </tr>
              </table>

              <!-- Have a great trip message -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:12px;margin-bottom:8px">
                <tr>
                  <td style="padding:16px 20px;text-align:center">
                    <div style="font-size:24px;margin-bottom:8px">&#127748;</div>
                    <div style="color:#15803d;font-size:14px;font-weight:600">Have a wonderful trip, ${firstName}!</div>
                    <div style="color:#6b7280;font-size:12px;margin-top:4px">Keep this email as your booking confirmation receipt.</div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;border-radius:0 0 14px 14px;padding:18px 32px">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle">
                    <div style="color:#6b7280;font-size:11px">
                      <strong style="color:#111827">SkyWay Travel</strong> &middot; Powered by <strong style="color:#ea580c">JusPay</strong>
                    </div>
                    <div style="color:#d1d5db;font-size:10px;margin-top:3px">Automated message, do not reply &middot; support@skyway.in</div>
                  </td>
                  <td align="right" style="vertical-align:middle">
                    <div style="color:#d1d5db;font-size:10px">&#128274; 256-bit SSL</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await mailer.sendMail({
    from: `"SkyWay Travel" <${process.env.EMAIL_USER}>`,
    to,
    subject: `✅ Booking Confirmed — ${bookingId} | SkyWay Travel`,
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

  const formattedAmount = Number(amount || 0).toLocaleString('en-IN');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Payment Failed — SkyWay</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
          <tr>
            <td style="background:linear-gradient(135deg,#7f1d1d 0%,#dc2626 100%);border-radius:14px 14px 0 0;padding:32px;text-align:center">
              <div style="width:60px;height:60px;background:rgba(255,255,255,.12);border:2px solid rgba(255,255,255,.35);border-radius:50%;margin:0 auto 14px;display:table;line-height:60px;text-align:center">
                <span style="color:#fff;font-size:28px;display:table-cell;vertical-align:middle">&#10005;</span>
              </div>
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800">Payment Failed</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,.7);font-size:13px">Your transaction could not be processed</p>
            </td>
          </tr>
          <tr><td style="background:linear-gradient(90deg,#dc2626,#ef4444);height:3px;line-height:3px;font-size:0">&nbsp;</td></tr>
          <tr>
            <td style="background:#ffffff;padding:32px">
              <p style="margin:0 0 20px;color:#374151;font-size:15px">Hello <strong>${firstName || 'User'}</strong>,</p>
              <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.7">
                Your payment of <strong style="color:#ea580c">&#8377;${formattedAmount}</strong> via ${(method || 'UPI').toUpperCase()} on <strong>SkyWay</strong> could not be processed.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:12px;margin-bottom:20px">
                <tr>
                  <td style="padding:18px 20px">
                    <div style="color:#991b1b;font-size:13px;font-weight:700;margin-bottom:8px">&#10060; Reason: ${reasonText}</div>
                    <div style="color:#7f1d1d;font-size:12px;line-height:1.8">
                      No amount has been deducted from your account. Please try again with a different payment method or ensure sufficient funds are available.
                    </div>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:12px;margin-bottom:8px">
                <tr>
                  <td style="padding:14px 20px">
                    <div style="color:#15803d;font-size:13px;font-weight:600">&#10003; No amount has been deducted from your account.</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;border-radius:0 0 14px 14px;padding:16px 32px">
              <div style="color:#6b7280;font-size:11px">
                <strong>SkyWay Travel</strong> &middot; Powered by <strong style="color:#ea580c">JusPay</strong> &middot; Automated message
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await mailer.sendMail({
    from: `"SkyWay Travel" <${process.env.EMAIL_USER}>`,
    to,
    subject: `❌ Payment Failed — ₹${formattedAmount} | SkyWay`,
    html,
  });
  console.log(`📧 Payment failure email → ${to}`);
}

// ════════════════════════════════════════════════════════════════════════════
// ROUTES
// ════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/payments/validate-upi
 */
router.post('/validate-upi', async (req, res) => {
  const { upiId } = req.body;
  if (!upiId) return res.status(400).json({ success: false, error: 'UPI ID required' });

  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  if (!upiRegex.test(upiId)) {
    return res.status(400).json({ success: false, error: 'Invalid UPI ID format' });
  }

  await new Promise(r => setTimeout(r, 300 + Math.random() * 200));

  const bankInfo = resolveUpiBank(upiId);
  if (!bankInfo) {
    return res.status(400).json({ success: false, error: 'UPI ID could not be verified.' });
  }

  const username = upiId.split('@')[0];
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
 *
 * Sends OTP via:
 *  1. Email (always)
 *  2. SMS to the registered phone number (best-effort — requires Fast2SMS or Textbelt key)
 *
 * The OTP email now includes the flight/hotel booking details.
 */
router.post('/send-otp', async (req, res) => {
  const { email, phone, firstName, amount, method, bookingType, from, to, airline, deviceId } = req.body;

  if (!email && !phone) {
    return res.status(400).json({ success: false, error: 'Email or phone required' });
  }

  // ── One OTP per device ──────────────────────────────────────────────────
  if (deviceId) {
    const existing = deviceStore.get(deviceId);
    if (existing && existing.expiresAt > Date.now()) {
      console.log(`⚠ Device ${deviceId} already has active session ${existing.sessionId}`);
      return res.json({
        success: true,
        sessionId: existing.sessionId,
        emailSent: true,
        expiresInMinutes: existing.isUpi ? 5 : 10,
        alreadySent: true,
        message: 'OTP already sent. Please check your email and phone.',
      });
    }
  }

  const otp = generateOtp();
  const sessionId = 'sess_' + Math.random().toString(36).substr(2, 16);

  const isUpi    = (method || '').toLowerCase() === 'upi';
  const expiryMs  = isUpi ? 5 * 60 * 1000 : 10 * 60 * 1000;
  const expiresAt = Date.now() + expiryMs;
  const validMins = isUpi ? 5 : 10;

  otpStore.set(sessionId, {
    otp, expiresAt, attempts: 0,
    payload: { email, phone, firstName, amount, method, bookingType, from, to, airline },
  });

  if (deviceId) {
    deviceStore.set(deviceId, { sessionId, expiresAt, isUpi });
  }

  // SMS text
  const smsText = `SkyWay OTP: ${otp} for Rs.${Number(amount || 0).toLocaleString('en-IN')} payment. Valid ${validMins} min. DO NOT share. -JusPay`;

  // Send both email and SMS simultaneously
  const results = await Promise.allSettled([
    // 1. Email — with full order details (use 'dest' alias to avoid 'to' conflict)
    sendOtpEmail({ to: email, firstName, otp, amount, validMins, from, dest: to, airline, bookingType }),
    // 2. SMS to the registered phone number
    dispatchSms(phone, smsText),
  ]);

  const emailSent = results[0].status === 'fulfilled';
  if (results[0].status === 'rejected') {
    console.log('OTP email error:', results[0].reason?.message);
  }

  console.log(`🔐 OTP [${otp}] → session ${sessionId} | device:${deviceId || 'unknown'} | method:${method} | expires:${validMins}min | phone:+91${String(phone || '').slice(-10)} | email:${emailSent}`);

  res.json({
    success: true,
    sessionId,
    emailSent,
    expiresInMinutes: validMins,
    message: emailSent
      ? `OTP sent to ${email}${phone ? ' and your registered phone' : ''}`
      : 'OTP generated — check your email',
  });
});

/**
 * POST /api/payments/verify-otp
 *
 * Verifies OTP → runs realistic balance check → success OR failure.
 *
 * Balance check logic:
 *  - Card ending 0000/1111 → always fails (insufficient funds) [for testing]
 *  - UPI starting with "fail"/"broke" → always fails [for testing]
 *  - Otherwise: stochastic simulation (~25% chance of failure) OR success
 *
 * On SUCCESS: sends booking confirmation email + SMS
 * On FAILURE: sends payment failed notification email + SMS
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

  // Simulate realistic bank processing delay (1.5–3 sec)
  await new Promise(r => setTimeout(r, 1500 + Math.random() * 1500));

  // ── Balance check ──────────────────────────────────────────────────────────
  const balanceCheck = simulateBalanceCheck(amount, method, upiId, cardLast4);

  const orderId   = 'order_' + Math.random().toString(36).substr(2, 12).toUpperCase();
  const paymentId = 'pay_'   + Math.random().toString(36).substr(2, 12).toUpperCase();
  const bookingId = (bookingType === 'hotel' ? 'HTL' : 'SKY') + Math.random().toString(36).substr(2, 8).toUpperCase();
  const processedAt = new Date().toISOString();

  if (!balanceCheck.sufficient) {
    // ── PAYMENT FAILED ─────────────────────────────────────────────────────
    const failureReason = balanceCheck.reason === 'insufficient_funds'
      ? `Insufficient balance in your account. Your available balance (₹${balanceCheck.balance?.toLocaleString('en-IN') || '—'}) is less than the required amount (₹${Number(amount).toLocaleString('en-IN')}). No amount has been deducted.`
      : balanceCheck.reason === 'daily_limit_exceeded'
      ? 'Your bank\'s daily transaction limit has been exceeded. Please try again tomorrow or use a different account.'
      : 'Your bank declined the transaction. Please contact your bank.';

    // Send failure notifications (background)
    Promise.allSettled([
      sendPaymentFailureEmail({ to: email, firstName, amount, reason: balanceCheck.reason, method }),
      dispatchSms(phone, `SkyWay: Payment of Rs.${Number(amount).toLocaleString('en-IN')} FAILED. Reason: ${balanceCheck.reason === 'insufficient_funds' ? 'Insufficient funds' : 'Declined'}. No amount deducted. -SkyWay`),
    ]).catch(() => {});

    console.log(`❌ Payment FAILED ${paymentId} | Reason: ${balanceCheck.reason} | Balance: ₹${balanceCheck.balance} | Required: ₹${amount}`);

    return res.json({
      success: true,             // OTP was correct
      paymentStatus: 'failed',   // but payment itself failed
      orderId, paymentId, bookingId,
      amount, currency: 'INR',
      method: method || 'upi',
      failureReason,
      failureCode: balanceCheck.reason,
      processedAt,
    });
  }

  // ── PAYMENT CAPTURED ────────────────────────────────────────────────────────
  const paidAt = processedAt;

  // Send booking confirmation via ALL channels (background)
  Promise.allSettled([
    sendConfirmationEmail({ to: email, firstName, lastName: '', amount, bookingId, paymentId, method, bookingType, from, to, airline, paidAt }),
    dispatchSms(phone, `SkyWay Booking ${bookingId} CONFIRMED! Amount: Rs.${Number(amount).toLocaleString('en-IN')}. Txn: ${paymentId}. Have a great trip! -SkyWay`),
  ]).then(results => {
    results.forEach((r, i) => {
      if (r.status === 'rejected') console.log(`Notification ${i === 0 ? 'email' : 'SMS'} error:`, r.reason?.message);
    });
    console.log(`✅ Payment CAPTURED ${paymentId} | Booking ${bookingId} | ₹${amount} | Balance was ₹${balanceCheck.balance}`);
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
