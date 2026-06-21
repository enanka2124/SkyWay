const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

// POST /api/bookings
router.post('/', async (req, res) => {
  try {
    const { flight, hotel, type, firstName, lastName, email, phone, passport, nationality, pricing } = req.body;

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
    if (!flight && !hotel) {
      return res.status(400).json({ success: false, error: 'Flight or hotel details are required' });
    }

    // Generate ticket ID
    const ticketId = (type === 'hotel' ? 'HTL' : 'SKY') + Math.random().toString(36).substr(2, 8).toUpperCase();

    // Default calculations if pricing is not fully provided
    const baseFare = flight ? (flight.price || 0) : (hotel ? hotel.price || 0 : 0);
    const taxes = pricing?.taxes || Math.round(baseFare * 0.05);
    const convenienceFee = pricing?.fee || 299;
    const discount = pricing?.discount || 0;
    const total = pricing?.total || (baseFare + taxes + convenienceFee - discount);

    const bookingData = {
      ticketId,
      userEmail: email.trim(),
      bookingType: type || (hotel ? 'hotel' : 'flight'),
      passenger: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone?.trim() || '',
        passport: passport?.trim() || '',
        nationality: nationality || '',
      },
      pricing: {
        baseFare,
        taxes,
        convenienceFee,
        discount,
        total,
      },
      paymentStatus: 'pending',
      paymentMethod: 'none',
      paymentId: '',
    };

    if (flight) {
      bookingData.flight = {
        airline: flight.airline,
        code: flight.code,
        from: flight.from,
        to: flight.to,
        dep: flight.dep,
        arr: flight.arr,
        duration: flight.duration,
        stops: flight.stops,
        cabin: flight.cabin,
        baggage: flight.baggage || '15 kg',
        meal: flight.meal || 'Standard',
        layover: flight.layover,
        layovers: flight.layovers,
        segmentDurations: flight.segmentDurations,
      };
    }

    if (hotel) {
      bookingData.hotel = {
        name: hotel.name,
        city: hotel.city,
        stars: hotel.stars || hotel.rating,
        price: hotel.price,
      };
    }

    const booking = new Booking(bookingData);
    await booking.save();

    res.status(201).json({
      success: true,
      ticketId,
      booking,
    });
  } catch (err) {
    console.error('Error saving booking:', err);
    res.status(500).json({ success: false, error: 'Failed to save booking to database' });
  }
});

// GET /api/bookings
router.get('/', async (req, res) => {
  try {
    const userEmail = req.query.email;
    let query = { paymentStatus: { $ne: 'pending' } };
    if (userEmail) {
      query.userEmail = userEmail;
    }
    
    const bookings = await Booking.find(query).sort({ bookedAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch bookings from database' });
  }
});

// PATCH /api/bookings/:ticketId/cancel — Cancel a booking
router.patch('/:ticketId/cancel', async (req, res) => {
  try {
    const booking = await Booking.findOne({ ticketId: req.params.ticketId });
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    booking.paymentStatus = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to cancel booking' });
  }
});

// DELETE /api/bookings/:ticketId — Hard delete a booking
router.delete('/:ticketId', async (req, res) => {
  try {
    const result = await Booking.findOneAndDelete({ ticketId: req.params.ticketId });
    if (!result) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    res.json({ success: true, message: 'Booking deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete booking' });
  }
});

// PATCH /api/bookings/:ticketId/passenger — Update passenger details
router.patch('/:ticketId/passenger', async (req, res) => {
  try {
    const { firstName, lastName, passport, nationality } = req.body;
    const booking = await Booking.findOne({ ticketId: req.params.ticketId });
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    
    // Validation
    if (firstName && !firstName.trim()) {
      return res.status(400).json({ success: false, error: 'First name cannot be empty' });
    }
    if (lastName && !lastName.trim()) {
      return res.status(400).json({ success: false, error: 'Last name cannot be empty' });
    }

    if (booking.passenger) {
      if (firstName !== undefined) booking.passenger.firstName = firstName.trim();
      if (lastName !== undefined) booking.passenger.lastName = lastName.trim();
      if (passport !== undefined) booking.passenger.passport = passport.trim();
      if (nationality !== undefined) booking.passenger.nationality = nationality;
    } else {
      booking.passenger = {
        firstName: firstName?.trim() || '',
        lastName: lastName?.trim() || '',
        email: booking.userEmail || '',
        phone: '',
        passport: passport?.trim() || '',
        nationality: nationality || '',
      };
    }

    booking.markModified('passenger');
    await booking.save();
    
    res.json({ success: true, booking });
  } catch (err) {
    console.error('Error updating booking passenger details:', err);
    res.status(500).json({ success: false, error: 'Failed to update passenger details' });
  }
});

module.exports = router;

