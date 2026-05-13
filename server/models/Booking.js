const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    required: true,
    unique: true,
  },
  userEmail: {
    type: String,
    required: true,
    index: true,
  },
  passenger: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    passport: String,
    nationality: String,
  },
  flight: {
    airline: String,
    code: String,
    from: String,
    to: String,
    dep: String,
    arr: String,
    duration: String,
    stops: String,
  },
  hotel: {
    name: String,
    city: String,
    stars: Number,
    price: Number,
  },
  bookingType: {
    type: String,
    enum: ['flight', 'hotel', 'deal'],
    default: 'flight',
  },
  pricing: {
    baseFare: Number,
    taxes: Number,
    convenienceFee: Number,
    discount: Number,
    total: Number,
  },
  paymentStatus: {
    type: String,
    default: 'completed',
  },
  bookedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Booking', BookingSchema);
