const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const axios = require('axios');
const Razorpay = require('razorpay');
const Booking = require('../models/Booking');

let razorpayInstance = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log('Razorpay gateway is active.');
} else {
  console.log('Razorpay keys not found. Running in simulator mode.');
}

// in-memory stores
const otpStore = new Map();
const deviceStore = new Map();
const orderStatusStore = new Map();

// clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of otpStore.entries()) {
    if (val.expiresAt < now) otpStore.delete(key);
  }
  for (const [key, val] of deviceStore.entries()) {
    if (val.expiresAt < now) deviceStore.delete(key);
  }
  for (const [key, val] of orderStatusStore.entries()) {
    if (val.expiresAt < now) orderStatusStore.delete(key);
  }
}, 5 * 60 * 1000);

// nodemailer transporter — uses Gmail if credentials are set, otherwise falls back to Ethereal
let mailer = null;
let isDevMailer = false;

async function getMailer() {
  if (mailer) return mailer;

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'your-app-password') {
    mailer = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER.trim(), pass: process.env.EMAIL_PASS.replace(/\s+/g, '') },
    });
    try {
      await mailer.verify();
      console.log('Mailer ready:', process.env.EMAIL_USER);
      isDevMailer = false;
      return mailer;
    } catch (err) {
      console.log('Gmail auth failed:', err.message);
      mailer = null;
    }
  }

  // fall back to Ethereal for local development
  try {
    const testAccount = await nodemailer.createTestAccount();
    mailer = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    isDevMailer = true;
    console.log('Using Ethereal test mailer (no Gmail configured)');
    console.log(`Ethereal inbox: https://ethereal.email/login`);
    console.log(`User: ${testAccount.user} / Pass: ${testAccount.pass}`);
    return mailer;
  } catch (err) {
    console.log('Ethereal fallback failed:', err.message);
    isDevMailer = true;
    return null;
  }
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

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

// simulates a bank balance check against the payment amount.
// deterministic overrides for testing:
//   card ending 0000/1111 → insufficient funds
//   card ending 9999      → daily limit exceeded
//   UPI handle "fail"/"broke" → insufficient funds
//   amount > 5,00,000     → daily limit exceeded
function simulateBalanceCheck(amount, method, upiId, cardLast4) {
  const amt = Number(amount || 0);

  if (cardLast4) {
    const last4 = String(cardLast4).replace(/\D/g, '').slice(-4);
    if (last4 === '0000' || last4 === '1111') {
      console.log(`Test trigger: card ending ${last4} → insufficient_funds`);
      return { sufficient: false, reason: 'insufficient_funds', balance: Math.round(amt * 0.25) };
    }
    if (last4 === '9999') {
      console.log(`Test trigger: card ending ${last4} → daily_limit_exceeded`);
      return { sufficient: false, reason: 'daily_limit_exceeded', balance: 500000 };
    }
  }

  if (upiId) {
    const username = upiId.split('@')[0].toLowerCase();
    if (username === 'fail' || username === 'broke' || username.endsWith('fail') || username === 'test_fail') {
      console.log(`Test trigger: UPI "${username}" → insufficient_funds`);
      return { sufficient: false, reason: 'insufficient_funds', balance: Math.round(amt * 0.25) };
    }
  }

  if (amt > 500000) {
    return { sufficient: false, reason: 'daily_limit_exceeded', balance: 500000 };
  }

  return { sufficient: true, balance: amt * 10 };
}

async function tryTextbeltSms(phone, message) {
  const num = String(phone).replace(/\D/g, '');
  const intlNum = num.startsWith('91') ? '+' + num : '+91' + num.slice(-10);
  try {
    const resp = await axios.post('https://textbelt.com/text', {
      phone: intlNum, message, key: 'textbelt',
    }, { timeout: 8000 });
    if (resp.data?.success) {
      console.log(`Textbelt SMS sent to ${intlNum} (quota left: ${resp.data.quotaRemaining})`);
      return true;
    }
    console.log(`Textbelt: ${resp.data?.error || 'failed'}`);
    return false;
  } catch (err) {
    console.log('Textbelt error:', err.message);
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
    if (resp.data?.return) { console.log(`Fast2SMS sent to +91${num}`); return true; }
    console.log('Fast2SMS:', JSON.stringify(resp.data));
    return false;
  } catch (err) {
    console.log('Fast2SMS error:', err.response?.data || err.message);
    return false;
  }
}

async function dispatchSms(phone, message) {
  if (!phone) return;
  const num = String(phone).replace(/\D/g, '').replace(/^91/, '').slice(-10);
  console.log(`Attempting SMS to +91${num}: "${message.slice(0, 60)}..."`);
  if (await tryFast2Sms(phone, message)) return;
  if (await tryTextbeltSms(phone, message)) return;
  console.log(`SMS channels exhausted for +91${num}. OTP available in email.`);
}

async function sendOtpEmail({ to, firstName, otp, amount, validMins = 10, from: flightFrom, dest: flightTo, airline, bookingType }) {
  if (!to) return;

  const formattedAmount = Number(amount || 0).toLocaleString('en-IN');

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
  <title>Razorpay Payment OTP — SkyWay</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

          <tr>
            <td style="background:linear-gradient(135deg,#0b2d63 0%,#312e81 100%);border-radius:14px 14px 0 0;padding:24px 32px">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:46px;height:46px;background:linear-gradient(135deg,#0b2d63,#3399cc);border-radius:12px;text-align:center;vertical-align:middle">
                          <span style="color:#fff;font-size:24px;font-weight:900;display:block;line-height:46px">R</span>
                        </td>
                        <td style="padding-left:14px;vertical-align:middle">
                          <div style="color:#ffffff;font-size:17px;font-weight:700;letter-spacing:-.01em">Razorpay</div>
                          <div style="color:rgba(255,255,255,.5);font-size:11px;margin-top:1px">Secure Payment Gateway · PCI-DSS Compliant</div>
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

          <tr><td style="background:linear-gradient(90deg,#ff6b35,#f7931e);height:3px;line-height:3px;font-size:0">&nbsp;</td></tr>

          <tr>
            <td style="background:#ffffff;padding:36px 32px 28px">

              <p style="margin:0 0 6px;color:#111827;font-size:17px;font-weight:600">Hello, ${firstName || 'Traveller'} 👋</p>
              <p style="margin:0 0 28px;color:#6b7280;font-size:14px;line-height:1.7">
                You requested an OTP to authorise a payment on <strong style="color:#111827">SkyWay Travel</strong>.
                Use this OTP within <strong style="color:#ea580c">${validMins} minutes</strong>.
              </p>

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

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:12px;margin-bottom:8px">
                <tr>
                  <td style="padding:16px 20px">
                    <div style="color:#991b1b;font-size:13px;font-weight:700;margin-bottom:8px">&#9888;&#65039; Security Notice</div>
                    <ul style="margin:0;padding-left:18px;color:#7f1d1d;font-size:12px;line-height:2">
                      <li>Never share this OTP with anyone, including SkyWay support</li>
                      <li>Razorpay will <strong>NEVER</strong> call, email, or SMS you to ask for this OTP</li>
                      <li>This OTP expires automatically in ${validMins} minutes</li>
                      <li>If you didn&#39;t initiate this payment, please ignore this email</li>
                    </ul>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;border-radius:0 0 14px 14px;padding:18px 32px">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle">
                    <div style="color:#6b7280;font-size:11px">
                      Powered by <strong style="color:#3399cc">Razorpay</strong> &middot; PCI-DSS Compliant &middot; RBI Authorised
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

  const transport = await getMailer();
  if (!transport) {
    console.log(`No mailer available — OTP [${otp}] for ${to} logged to console only`);
    return;
  }

  const info = await transport.sendMail({
    from: `"Razorpay · SkyWay Payments" <${process.env.EMAIL_USER || 'otp@skyway.test'}>`,
    to,
    subject: `🔐 ${otp} is your SkyWay OTP — ₹${formattedAmount} (valid ${validMins} min)`,
    html,
  });
  console.log(`OTP email sent → ${to}`);

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`View OTP email: ${previewUrl}`);
  }
}

async function sendConfirmationEmail({ to, firstName, lastName, amount, bookingId, paymentId, method, bookingType, from, to: dest, airline, paidAt, newBalance, bank }) {
  if (!to) return;

  const label   = bookingType === 'hotel' ? 'Hotel Reservation' : 'Flight Ticket';
  const isHotel = bookingType === 'hotel';
  const route   = from && dest ? `${from} → ${dest}` : (airline || 'SkyWay');
  const dateStr = new Date(paidAt || Date.now()).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' });
  const formattedAmount = Number(amount || 0).toLocaleString('en-IN');
  const methodLabel = (method || 'CARD').toUpperCase();

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

          <tr>
            <td style="background:linear-gradient(135deg,#065f46 0%,#059669 100%);border-radius:14px 14px 0 0;padding:36px 32px;text-align:center">
              <div style="width:68px;height:68px;background:rgba(255,255,255,.15);border:2px solid rgba(255,255,255,.4);border-radius:50%;margin:0 auto 16px;display:table;line-height:68px;text-align:center">
                <span style="color:#ffffff;font-size:32px;display:table-cell;vertical-align:middle">&#10003;</span>
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-.02em">Booking Confirmed!</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,.75);font-size:14px">Your ${label} is all set, ${firstName}! &#9992;</p>
            </td>
          </tr>

          <tr><td style="background:linear-gradient(90deg,#059669,#10b981);height:3px;line-height:3px;font-size:0">&nbsp;</td></tr>

          <tr>
            <td style="background:#ffffff;padding:36px 32px 28px">

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

              ${itineraryBlock}

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
                ${bank ? `
                <tr style="border-bottom:1px solid #f3f4f6">
                  <td style="padding:12px 20px;color:#6b7280;font-size:13px">Debited From</td>
                  <td style="padding:12px 20px;color:#111827;font-size:13px;font-weight:600;text-align:right">${bank}</td>
                </tr>` : ''}
                <tr style="border-bottom:1px solid #f3f4f6">
                  <td style="padding:12px 20px;color:#6b7280;font-size:13px">Transaction ID</td>
                  <td style="padding:12px 20px;color:#6b7280;font-size:12px;font-family:'Courier New',monospace;text-align:right">${paymentId}</td>
                </tr>
                <tr style="border-bottom:1px solid #f3f4f6">
                  <td style="padding:12px 20px;color:#6b7280;font-size:13px">Date &amp; Time</td>
                  <td style="padding:12px 20px;color:#111827;font-size:13px;text-align:right">${dateStr}</td>
                </tr>
                ${newBalance !== undefined ? `
                <tr style="border-bottom:1px solid #f3f4f6">
                  <td style="padding:12px 20px;color:#6b7280;font-size:13px">Remaining Balance</td>
                  <td style="padding:12px 20px;color:#16a34a;font-size:13.5px;font-weight:700;text-align:right">&#8377;${newBalance.toLocaleString('en-IN')}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding:14px 20px;color:#111827;font-size:14px;font-weight:700;background:#f9fafb">Amount Paid</td>
                  <td style="padding:14px 20px;color:#ea580c;font-size:20px;font-weight:900;background:#f9fafb;text-align:right">&#8377;${formattedAmount}</td>
                </tr>
              </table>

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

          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;border-radius:0 0 14px 14px;padding:18px 32px">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle">
                    <div style="color:#6b7280;font-size:11px">
                       <strong style="color:#111827">SkyWay Travel</strong> &middot; Powered by <strong style="color:#3399cc">Razorpay</strong>
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

  const transport = await getMailer();
  if (!transport) { console.log('No mailer — confirmation email skipped'); return; }

  const info = await transport.sendMail({
    from: `"SkyWay Travel" <${process.env.EMAIL_USER || 'bookings@skyway.test'}>`,
    to,
    subject: `✅ Booking Confirmed — ${bookingId} | SkyWay Travel`,
    html,
  });
  console.log(`Confirmation email sent → ${to}`);
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) console.log(`View confirmation email: ${previewUrl}`);
}

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
                 <strong>SkyWay Travel</strong> &middot; Powered by <strong style="color:#3399cc">Razorpay</strong> &middot; Automated message
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const transport = await getMailer();
  if (!transport) { console.log('No mailer — failure email skipped'); return; }

  const info = await transport.sendMail({
    from: `"SkyWay Travel" <${process.env.EMAIL_USER || 'bookings@skyway.test'}>`,
    to,
    subject: `❌ Payment Failed — ₹${formattedAmount} | SkyWay`,
    html,
  });
  console.log(`Payment failure email sent → ${to}`);
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) console.log(`View failure email: ${previewUrl}`);
}

// POST /api/payments/validate-upi
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

// POST /api/payments/send-otp
router.post('/send-otp', async (req, res) => {
  const { email, phone, firstName, amount, method, bookingType, from, to, airline, deviceId } = req.body;

  if (!email && !phone) {
    return res.status(400).json({ success: false, error: 'Email or phone required' });
  }

  // one active OTP per device
  if (deviceId) {
    const existing = deviceStore.get(deviceId);
    if (existing && existing.expiresAt > Date.now()) {
      console.log(`Device ${deviceId} already has active session ${existing.sessionId}`);
      return res.json({
        success: true,
        sessionId: existing.sessionId,
        orderId: existing.orderId,
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

  const orderId   = 'order_' + Math.random().toString(36).substr(2, 12).toUpperCase();
  const paymentId = 'pay_'   + Math.random().toString(36).substr(2, 12).toUpperCase();
  const bookingId = req.body.bookingId || ((bookingType === 'hotel' ? 'HTL' : 'SKY') + Math.random().toString(36).substr(2, 8).toUpperCase());

  otpStore.set(sessionId, {
    otp, expiresAt, attempts: 0,
    payload: { email, phone, firstName, amount, method, bookingType, from, to, airline, orderId, paymentId, bookingId, deviceId },
  });

  if (deviceId) {
    deviceStore.set(deviceId, { sessionId, expiresAt, isUpi, orderId });
  }

  const captureAt = Date.now() + 15000;
  orderStatusStore.set(orderId, {
    status: 'pending',
    captureAt,
    expiresAt: Date.now() + 30 * 60 * 1000,
    amount,
    method,
    sessionId,
    paymentId,
    bookingId,
    payload: { email, phone, firstName, amount, method, bookingType, from, to, airline }
  });

  const smsText = `SkyWay OTP: ${otp} for Rs.${Number(amount || 0).toLocaleString('en-IN')} payment. Valid ${validMins} min. DO NOT share. -Razorpay`;

  let emailSent = false;
  if (!isUpi) {
    const results = await Promise.allSettled([
      sendOtpEmail({ to: email, firstName, otp, amount, validMins, from, dest: to, airline, bookingType }),
      dispatchSms(phone, smsText),
    ]);
    emailSent = results[0].status === 'fulfilled';
    if (results[0].status === 'rejected') {
      console.log('OTP email error:', results[0].reason?.message);
    }
  } else {
    emailSent = true;
  }

  await getMailer();

  console.log(`OTP [${otp}] → session ${sessionId} | order: ${orderId} | device: ${deviceId || 'unknown'} | method: ${method} | expires: ${validMins}min`);

  res.json({
    success: true,
    sessionId,
    orderId,
    emailSent,
    smsSent: false,
    expiresInMinutes: validMins,
    ...(isDevMailer ? { devOtp: otp, isDevMode: true } : {}),
    message: emailSent
      ? (isDevMailer
        ? 'OTP sent to Ethereal test inbox (check server console for preview link)'
        : `OTP sent to ${email}${phone ? ' and your registered phone' : ''}`)
      : 'OTP generated — check server console',
  });
});

// POST /api/payments/verify-otp
router.post('/verify-otp', async (req, res) => {
  const { sessionId, otp: userOtp, upiId, cardLast4, bank } = req.body;

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

  const isUpi = (session.payload.method || '').toLowerCase() === 'upi';

  if (isUpi) {
    if (!/^\d{4,6}$/.test(userOtp)) {
      return res.status(400).json({ success: false, error: 'Invalid UPI PIN. Must be 4 or 6 digits.' });
    }
  } else {
    if (String(userOtp).trim() !== String(session.otp)) {
      const left = 5 - session.attempts;
      return res.status(400).json({
        success: false,
        error: `Incorrect OTP. ${left} attempt${left !== 1 ? 's' : ''} remaining.`,
      });
    }
  }

  const { email, phone, firstName, amount, method, bookingType, from, to, airline, orderId, paymentId, bookingId } = session.payload;
  otpStore.delete(sessionId);

  await new Promise(r => setTimeout(r, 1500 + Math.random() * 1500));

  const balanceCheck = simulateBalanceCheck(amount, method, upiId, cardLast4);
  const processedAt = new Date().toISOString();

  if (!balanceCheck.sufficient) {
    const failureReason = balanceCheck.reason === 'insufficient_funds'
      ? `Insufficient balance in your account. Your available balance (₹${balanceCheck.balance?.toLocaleString('en-IN') || '—'}) is less than the required amount (₹${Number(amount).toLocaleString('en-IN')}). No amount has been deducted.`
      : balanceCheck.reason === 'daily_limit_exceeded'
      ? 'Your bank\'s daily transaction limit has been exceeded. Please try again tomorrow or use a different account.'
      : 'Your bank declined the transaction. Please contact your bank.';

    const existingOrder = orderStatusStore.get(orderId);
    if (existingOrder) {
      existingOrder.status = 'failed';
      existingOrder.failureCode = balanceCheck.reason;
      existingOrder.failureReason = failureReason;
    } else {
      orderStatusStore.set(orderId, {
        status: 'failed',
        failureCode: balanceCheck.reason,
        failureReason,
        amount,
        method,
        paymentId,
        bookingId,
      });
    }

    Promise.allSettled([
      sendPaymentFailureEmail({ to: email, firstName, amount, reason: balanceCheck.reason, method }),
      dispatchSms(phone, `SkyWay: Payment of Rs.${Number(amount).toLocaleString('en-IN')} FAILED. Reason: ${balanceCheck.reason === 'insufficient_funds' ? 'Insufficient funds' : 'Declined'}. No amount deducted. -SkyWay`),
    ]).catch(() => {});

    await Booking.findOneAndUpdate(
      { ticketId: bookingId },
      { paymentStatus: 'failed', paymentMethod: method || 'upi', paymentId }
    ).catch(err => console.error('Error updating failed booking status:', err));

    console.log(`Payment failed ${paymentId} | reason: ${balanceCheck.reason} | balance: ${balanceCheck.balance} | required: ${amount}`);

    return res.json({
      success: true,
      paymentStatus: 'failed',
      orderId, paymentId, bookingId,
      amount, currency: 'INR',
      method: method || 'upi',
      failureReason,
      failureCode: balanceCheck.reason,
      processedAt,
    });
  }

  const paidAt = processedAt;
  const resolvedBank = bank || (upiId ? resolveUpiBank(upiId)?.bank : (cardLast4 ? 'Card Ending ' + cardLast4 : 'Bank Account'));
  const simulatedStartBalance = balanceCheck.balance || Math.round(Number(amount) * (1.5 + Math.random()));
  const newBalance = simulatedStartBalance - Number(amount);

  const existingOrder = orderStatusStore.get(orderId);
  if (existingOrder) {
    existingOrder.status = 'captured';
    existingOrder.paidAt = paidAt;
    existingOrder.bank = resolvedBank;
    existingOrder.newBalance = newBalance;
  } else {
    orderStatusStore.set(orderId, {
      status: 'captured',
      paidAt,
      bank: resolvedBank,
      newBalance,
      amount,
      method,
      paymentId,
      bookingId,
    });
  }

  await Booking.findOneAndUpdate(
    { ticketId: bookingId },
    { paymentStatus: 'completed', paymentMethod: method || 'card', paymentId }
  ).catch(err => console.error('Error updating captured booking status:', err));

  Promise.allSettled([
    sendConfirmationEmail({ to: email, firstName, lastName: '', amount, bookingId, paymentId, method, bookingType, from, to, airline, paidAt, newBalance, bank: resolvedBank }),
    dispatchSms(phone, `SkyWay Booking ${bookingId} CONFIRMED! Amount: Rs.${Number(amount).toLocaleString('en-IN')}. Txn: ${paymentId}. Debited from ${resolvedBank}. Have a great trip! -SkyWay`),
  ]).then(results => {
    results.forEach((r, i) => {
      if (r.status === 'rejected') console.log(`Notification ${i === 0 ? 'email' : 'SMS'} error:`, r.reason?.message);
    });
    console.log(`Payment captured ${paymentId} | booking ${bookingId} | ₹${amount} | remaining: ₹${newBalance} | debited: ${resolvedBank}`);
  });

  res.json({
    success: true,
    paymentStatus: 'captured',
    orderId, paymentId, bookingId,
    amount, currency: 'INR',
    method: method || 'card',
    status: 'captured',
    paidAt,
    newBalance,
    bank: resolvedBank,
  });
});

// POST /api/payments — legacy compatibility
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

// GET /api/payments/status/:orderId
router.get('/status/:orderId', async (req, res) => {
  const order = orderStatusStore.get(req.params.orderId);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  // auto-capture non-UPI orders after the capture window elapses
  if (order.status === 'pending' && Date.now() >= order.captureAt && order.method !== 'upi') {
    const { amount, method, paymentId, bookingId, payload } = order;
    const { email, phone, firstName, bookingType, from, to, airline } = payload || {};

    const upiIdToCheck = payload.upiId || 'user@upi';
    const balanceCheck = simulateBalanceCheck(amount, method, upiIdToCheck, null);

    if (!balanceCheck.sufficient) {
      order.status = 'failed';
      order.failureCode = balanceCheck.reason;
      order.failureReason = balanceCheck.reason === 'insufficient_funds'
        ? `Insufficient balance in your account. Your available balance (₹${balanceCheck.balance?.toLocaleString('en-IN') || '—'}) is less than the required amount (₹${Number(amount).toLocaleString('en-IN')}). No amount has been deducted.`
        : 'Your bank declined the transaction. Please contact your bank.';

      Promise.allSettled([
        sendPaymentFailureEmail({ to: email, firstName, amount, reason: balanceCheck.reason, method }),
        dispatchSms(phone, `SkyWay: Payment of Rs.${Number(amount).toLocaleString('en-IN')} FAILED. Reason: ${balanceCheck.reason === 'insufficient_funds' ? 'Insufficient funds' : 'Declined'}. No amount deducted. -SkyWay`),
      ]).catch(() => {});

      await Booking.findOneAndUpdate(
        { ticketId: bookingId },
        { paymentStatus: 'failed', paymentMethod: method || 'card', paymentId }
      ).catch(err => console.error('Error auto-updating failed booking:', err));

      console.log(`[auto-capture] Payment failed ${paymentId} | reason: ${balanceCheck.reason}`);
    } else {
      order.status = 'captured';
      order.paidAt = new Date().toISOString();
      const resolvedBank = order.bank || (payload.upiId ? resolveUpiBank(payload.upiId)?.bank : 'UPI App');
      const simulatedStartBalance = balanceCheck.balance || Math.round(Number(amount) * (1.5 + Math.random()));
      const newBalance = simulatedStartBalance - Number(amount);

      order.bank = resolvedBank;
      order.newBalance = newBalance;

      await Booking.findOneAndUpdate(
        { ticketId: bookingId },
        { paymentStatus: 'completed', paymentMethod: method || 'card', paymentId }
      ).catch(err => console.error('Error auto-updating captured booking:', err));

      Promise.allSettled([
        sendConfirmationEmail({ to: email, firstName, lastName: '', amount, bookingId, paymentId, method, bookingType, from, to, airline, paidAt: order.paidAt, newBalance, bank: resolvedBank }),
        dispatchSms(phone, `SkyWay Booking ${bookingId} CONFIRMED! Amount: Rs.${Number(amount).toLocaleString('en-IN')}. Txn: ${paymentId}. Debited from ${resolvedBank}. Have a great trip! -SkyWay`),
      ]).then(results => {
        results.forEach((r, i) => {
          if (r.status === 'rejected') console.log(`Notification ${i === 0 ? 'email' : 'SMS'} error:`, r.reason?.message);
        });
        console.log(`[auto-capture] Payment captured ${paymentId} | booking ${bookingId} | ₹${amount}`);
      });
    }

    if (order.sessionId) {
      otpStore.delete(order.sessionId);
    }
  }

  res.json({
    success: true,
    status: order.status,
    paymentStatus: order.status,
    orderId: req.params.orderId,
    paymentId: order.paymentId,
    bookingId: order.bookingId,
    amount: order.amount,
    method: order.method,
    paidAt: order.paidAt,
    newBalance: order.newBalance,
    bank: order.bank,
    failureReason: order.failureReason,
    failureCode: order.failureCode,
  });
});

// POST /api/payments/create-order
router.post('/create-order', async (req, res) => {
  if (!razorpayInstance) {
    return res.status(400).json({ success: false, error: 'Razorpay is not active' });
  }

  const { amount, currency = 'INR', bookingType, from, to, airline } = req.body;
  if (!amount) {
    return res.status(400).json({ success: false, error: 'Amount required' });
  }

  const amountInPaise = Math.round(Number(amount) * 100);
  const receiptId = 'rcpt_' + Math.random().toString(36).substr(2, 12).toUpperCase();

  try {
    const order = await razorpayInstance.orders.create({
      amount: amountInPaise,
      currency,
      receipt: receiptId,
    });

    const orderId = order.id;
    const paymentId = 'pay_' + Math.random().toString(36).substr(2, 12).toUpperCase();
    const bookingId = req.body.bookingId || ((bookingType === 'hotel' ? 'HTL' : 'SKY') + Math.random().toString(36).substr(2, 8).toUpperCase());

    orderStatusStore.set(orderId, {
      status: 'pending',
      expiresAt: Date.now() + 30 * 60 * 1000,
      amount: Number(amount),
      method: 'razorpay',
      paymentId,
      bookingId,
      payload: { amount, bookingType, from, to, airline }
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    res.status(500).json({ success: false, error: 'Failed to create payment order' });
  }
});

// POST /api/payments/verify-signature
const crypto = require('crypto');
router.post('/verify-signature', async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    email,
    phone,
    firstName,
    lastName,
    amount,
    bookingType,
    from,
    to,
    airline
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, error: 'Missing parameters' });
  }

  const generated_signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + '|' + razorpay_payment_id)
    .digest('hex');

  if (generated_signature !== razorpay_signature) {
    return res.status(400).json({ success: false, error: 'Verification failed' });
  }

  const order = orderStatusStore.get(razorpay_order_id);
  const bookingId = order?.bookingId || ((bookingType === 'hotel' ? 'HTL' : 'SKY') + Math.random().toString(36).substr(2, 8).toUpperCase());

  const processedAt = new Date().toISOString();
  const paidAt = processedAt;
  const resolvedBank = 'Razorpay Gateway';

  if (order) {
    order.status = 'captured';
    order.paidAt = paidAt;
    order.bank = resolvedBank;
    order.paymentId = razorpay_payment_id;
  } else {
    orderStatusStore.set(razorpay_order_id, {
      status: 'captured',
      paidAt,
      bank: resolvedBank,
      amount: Number(amount),
      method: 'razorpay',
      paymentId: razorpay_payment_id,
      bookingId,
    });
  }

  Promise.allSettled([
    sendConfirmationEmail({ to: email, firstName, lastName: lastName || '', amount, bookingId, paymentId: razorpay_payment_id, method: 'razorpay', bookingType, from, to, airline, paidAt, bank: resolvedBank }),
    dispatchSms(phone, `SkyWay Booking ${bookingId} CONFIRMED! Amount: Rs.${Number(amount).toLocaleString('en-IN')}. Txn: ${razorpay_payment_id}. Processed via Razorpay. Have a great trip! -SkyWay`),
  ]).then(results => {
    results.forEach((r, i) => {
      if (r.status === 'rejected') console.log('Notification error:', r.reason?.message);
    });
  });

  await Booking.findOneAndUpdate(
    { ticketId: bookingId },
    { paymentStatus: 'completed', paymentMethod: 'card', paymentId: razorpay_payment_id }
  ).catch(err => console.error('Error updating booking after signature verification:', err));

  res.json({
    success: true,
    paymentStatus: 'captured',
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    bookingId,
    amount,
    currency: 'INR',
    method: 'razorpay',
    status: 'captured',
    paidAt,
    bank: resolvedBank,
  });
});

// POST /api/payments/verify-upi-utr
router.post('/verify-upi-utr', async (req, res) => {
  const { orderId, utr, upiId } = req.body;
  if (!orderId || !utr) {
    return res.status(400).json({ success: false, error: 'orderId and UTR are required' });
  }

  if (!/^\d{12}$/.test(utr)) {
    return res.status(400).json({ success: false, error: 'Invalid UTR format. Must be a 12-digit number.' });
  }

  const order = orderStatusStore.get(orderId);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order session not found or expired' });
  }

  const processedAt = new Date().toISOString();
  const paidAt = processedAt;
  const resolvedBank = upiId ? (resolveUpiBank(upiId)?.bank || 'UPI App') : 'UPI App';

  order.status = 'captured';
  order.paidAt = paidAt;
  order.bank = resolvedBank;
  order.paymentId = 'pay_utr_' + utr;

  const { amount, payload } = order;
  const { email, phone, firstName, bookingType, from, to, airline } = payload || {};
  const bookingId = order.bookingId || ((bookingType === 'hotel' ? 'HTL' : 'SKY') + Math.random().toString(36).substr(2, 8).toUpperCase());

  Promise.allSettled([
    sendConfirmationEmail({
      to: email,
      firstName: firstName || 'Passenger',
      lastName: '',
      amount,
      bookingId,
      paymentId: order.paymentId,
      method: 'upi',
      bookingType,
      from,
      to,
      airline,
      paidAt,
      bank: resolvedBank
    }),
    dispatchSms(phone, `SkyWay Booking ${bookingId} CONFIRMED! Amount: Rs.${Number(amount).toLocaleString('en-IN')}. Txn: ${order.paymentId}. Debited from ${resolvedBank}. Have a great trip! -SkyWay`),
  ]).then(results => {
    results.forEach((r, i) => {
      if (r.status === 'rejected') console.log('Notification error:', r.reason?.message);
    });
    console.log(`UPI-UTR payment captured for order ${orderId} with UTR ${utr}`);
  });

  await Booking.findOneAndUpdate(
    { ticketId: bookingId },
    { paymentStatus: 'completed', paymentMethod: 'upi', paymentId: order.paymentId }
  ).catch(err => console.error('Error updating booking after UPI UTR verification:', err));

  res.json({
    success: true,
    paymentStatus: 'captured',
    orderId,
    paymentId: order.paymentId,
    bookingId,
    amount,
    currency: 'INR',
    method: 'upi',
    status: 'captured',
    paidAt,
    bank: resolvedBank,
  });
});

// POST /api/payments/cancel-order
router.post('/cancel-order', async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ success: false, error: 'orderId required' });

  const order = orderStatusStore.get(orderId);
  if (order) {
    order.status = 'failed';
    order.failureCode = 'user_cancelled';
    order.failureReason = 'Transaction failed. The payment page was refreshed or closed during authorization.';

    if (order.sessionId) {
      otpStore.delete(order.sessionId);
    }
    await Booking.findOneAndUpdate(
      { ticketId: order.bookingId },
      { paymentStatus: 'failed', paymentMethod: order.method || 'card', paymentId: order.paymentId || '' }
    ).catch(err => console.error('Error updating cancelled booking:', err));

    console.log(`Payment cancelled for order ${orderId}`);
    return res.json({ success: true, status: 'failed' });
  }

  res.json({ success: false, error: 'Order not found' });
});

// GET /api/payments/config
router.get('/config', (req, res) => {
  res.json({
    success: true,
    payeeUpiId: process.env.PAYEE_UPI_ID || 'skywaytravels@icici',
    merchantName: 'SkyWay Travels',
    razorpayActive: !!razorpayInstance,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || null,
  });
});

module.exports = router;
