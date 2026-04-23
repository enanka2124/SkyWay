const express = require('express');
const router = express.Router();

// In-memory bookings store
const bookings = [];

// POST /api/bookings
router.post('/', (req, res) => {
  const { flight, firstName, lastName, email, phone, passport, nationality } = req.body;

  // Validation
  if (!firstName || !firstName.trim()) {
    return res.status(400).json({ success: false, error: 'First name is required' });
  }
  if (!lastName || !lastName.trim()) {
    return res.status(400).json({ success: false, error: 'Last name is required' });
  }
  if (!email || !email.trim()) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }
  if (!flight) {
    return res.status(400).json({ success: false, error: 'Flight details are required' });
  }

  // Generate ticket ID
  const ticketId = 'SKY' + Math.random().toString(36).substr(2, 8).toUpperCase();

  // Calculate pricing
  const baseFare = flight.price || 0;
  const taxes = Math.round(baseFare * 0.05);
  const convenienceFee = 299;
  const total = baseFare + taxes + convenienceFee;

  const booking = {
    ticketId,
    passenger: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone?.trim() || '',
      passport: passport?.trim() || '',
      nationality: nationality || '',
    },
    flight: {
      airline: flight.airline,
      code: flight.code,
      from: flight.from,
      to: flight.to,
      dep: flight.dep,
      arr: flight.arr,
      duration: flight.duration,
      stops: flight.stops,
    },
    pricing: {
      baseFare,
      taxes,
      convenienceFee,
      total,
    },
    bookedAt: new Date().toISOString(),
  };

  bookings.push(booking);

  res.status(201).json({
    success: true,
    ticketId,
    booking,
  });
});

// GET /api/bookings
router.get('/', (req, res) => {
  res.json({
    success: true,
    count: bookings.length,
    bookings,
  });
});

module.exports = router;
