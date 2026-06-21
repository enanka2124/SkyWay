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
    cabin: String,
    baggage: String,
    meal: String,
    layover: {
      city: String,
      duration: String,
    },
    layovers: [
      {
        city: String,
        duration: String,
      }
    ],
    segmentDurations: [String],
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
    enum: ['completed', 'cancelled', 'pending', 'failed'],
    default: 'completed',
  },
  paymentMethod: {
    type: String,
    default: 'card',
  },
  paymentId: {
    type: String,
    default: '',
  },
  cancelledAt: {
    type: Date,
    default: null,
  },
  bookedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Booking', BookingSchema);

