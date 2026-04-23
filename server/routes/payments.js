const express = require('express');
const router = express.Router();

// POST /api/payments — simulated Razorpay-style payment
router.post('/', (req, res) => {
  const { amount, currency = 'INR', bookingId, method } = req.body;

  if (!amount || !bookingId) {
    return res.status(400).json({ success: false, error: 'Amount and bookingId required' });
  }

  // Simulate Razorpay order creation
  const orderId = 'order_' + Math.random().toString(36).substr(2, 12).toUpperCase();
  const paymentId = 'pay_' + Math.random().toString(36).substr(2, 12).toUpperCase();

  setTimeout(() => {
    res.json({
      success: true,
      orderId,
      paymentId,
      amount,
      currency,
      bookingId,
      method: method || 'card',
      status: 'captured',
      paidAt: new Date().toISOString(),
    });
  }, 1500);
});

// POST /api/payments/verify — verify payment signature
router.post('/verify', (req, res) => {
  const { orderId, paymentId } = req.body;
  if (!orderId || !paymentId) {
    return res.status(400).json({ success: false, error: 'Missing order/payment IDs' });
  }
  res.json({ success: true, verified: true, message: 'Payment verified successfully' });
});

module.exports = router;
