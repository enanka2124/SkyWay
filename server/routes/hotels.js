const express = require('express');
const router = express.Router();

const axios = require('axios');

const popularCities = [
  'Mumbai', 'Goa', 'Delhi', 'Bangalore', 'Chennai', 'Dubai', 'Jaipur', 'Kolkata', 'Hyderabad', 'Udaipur', 'Kerala', 'Manali', 'Singapore', 'Bangkok'
];

// GET /api/hotels?city=&checkin=&checkout=&guests=
router.get('/', async (req, res) => {
  const { city = 'Mumbai', checkin, checkout, guests = 1 } = req.query;

  if (!process.env.SKYSCANNER_RAPIDAPI_KEY) {
    return res.status(500).json({ success: false, error: 'RapidAPI Key is missing. Live hotel pricing is unavailable.' });
  }

  try {
    // 1. Get Location/Destination ID from Booking.com API
    const locOptions = {
      method: 'GET',
      url: 'https://booking-com15.p.rapidapi.com/api/v1/hotels/searchDestination',
      params: { query: city },
      headers: {
        'X-RapidAPI-Key': process.env.SKYSCANNER_RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'booking-com15.p.rapidapi.com'
      }
    };
    
    const locResponse = await axios.request(locOptions);
    const locations = locResponse.data?.data || [];
    
    if (!locations || locations.length === 0) {
      return res.json({ success: true, count: 0, hotels: [], city, checkin, checkout });
    }

    const dest = locations.find(l => l.search_type === 'city') || locations[0];
    const dest_id = dest.dest_id;
    const dest_type = dest.search_type;

    // Use default dates if not provided
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const checkinDate = checkin || today.toISOString().split('T')[0];
    const checkoutDate = checkout || tomorrow.toISOString().split('T')[0];

    // 2. Search Hotels
    const searchOptions = {
      method: 'GET',
      url: 'https://booking-com15.p.rapidapi.com/api/v1/hotels/searchHotels',
      params: {
        dest_id: dest_id,
        search_type: dest_type,
        arrival_date: checkinDate,
        departure_date: checkoutDate,
        adults: guests,
        room_qty: '1',
        page_number: '1'
      },
      headers: {
        'X-RapidAPI-Key': process.env.SKYSCANNER_RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'booking-com15.p.rapidapi.com'
      }
    };

    const searchResponse = await axios.request(searchOptions);
    const apiHotels = searchResponse.data?.data?.hotels || [];

    // 3. Map to frontend format
    const results = apiHotels.slice(0, 15).map((h, i) => {
      const prop = h.property || {};
      const priceUSD = prop.priceBreakdown?.grossPrice?.value || (Math.random() * 50 + 20);
      return {
        id: h.hotel_id || prop.id || i + 1,
        name: prop.name || 'Unknown Hotel',
        city: city,
        stars: prop.propertyClass || Math.floor(Math.random() * 2) + 3, // fallback to 3-5 stars if missing
        price: Math.floor(priceUSD * 83), // Approximate USD to INR
        image: (prop.photoUrls && prop.photoUrls.length > 0) ? prop.photoUrls[0] : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80',
        amenities: ['Free WiFi', 'Air Conditioning', 'Room Service'],
        rating: prop.reviewScore || 4.0,
        reviews: prop.reviewCount || Math.floor(Math.random() * 500 + 50)
      };
    });

    return res.json({ success: true, count: results.length, hotels: results, city, checkin: checkinDate, checkout: checkoutDate, guests: Number(guests) });

  } catch (error) {
    console.error("Booking.com API Error:", error.response?.data?.message || error.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch real-time hotel data. Please check if you are subscribed to the Booking.com API on RapidAPI.' });
  }
});

// GET /api/hotels/cities
router.get('/cities', (req, res) => {
  res.json({ success: true, cities: popularCities });
});

// POST /api/hotels/book
router.post('/book', (req, res) => {
  const { hotel, checkin, checkout, guests, firstName, lastName, email } = req.body;
  if (!firstName || !lastName || !email || !hotel) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const nights = checkin && checkout ? Math.max(1, Math.ceil((new Date(checkout) - new Date(checkin)) / 86400000)) : 1;
  const bookingId = 'HTL' + Math.random().toString(36).substr(2, 8).toUpperCase();

  const booking = {
    bookingId,
    hotel: { name: hotel.name, city: hotel.city, stars: hotel.stars, image: hotel.image },
    guest: { firstName, lastName, email },
    checkin, checkout, nights, guests,
    totalPrice: hotel.price * nights,
    bookedAt: new Date().toISOString(),
  };

  hotelBookings.push(booking);
  res.status(201).json({ success: true, bookingId, booking });
});

// GET /api/hotels/bookings
router.get('/bookings', (req, res) => {
  res.json({ success: true, bookings: hotelBookings });
});

module.exports = router;
