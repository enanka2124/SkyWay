const express = require('express');
const router = express.Router();

const mockHotels = [
  // ── Mumbai ──
  { id: 1, name: 'The Grand Palace', city: 'Mumbai', stars: 5, price: 8999, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant'], rating: 4.8, reviews: 2340 },
  { id: 2, name: 'Skyline Suites', city: 'Mumbai', stars: 4, price: 5499, image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80', amenities: ['WiFi', 'Gym', 'Restaurant', 'Parking'], rating: 4.5, reviews: 1280 },
  { id: 3, name: 'Marine Drive Inn', city: 'Mumbai', stars: 3, price: 3499, image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&q=80', amenities: ['WiFi', 'Restaurant', 'Parking'], rating: 4.2, reviews: 960 },

  // ── Goa ──
  { id: 4, name: 'Ocean Breeze Resort', city: 'Goa', stars: 5, price: 12999, image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80', amenities: ['WiFi', 'Pool', 'Beach Access', 'Spa', 'Bar'], rating: 4.9, reviews: 3100 },
  { id: 5, name: 'Palm View Inn', city: 'Goa', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400&q=80', amenities: ['WiFi', 'Parking', 'Restaurant'], rating: 4.1, reviews: 890 },
  { id: 6, name: 'Calangute Beach Resort', city: 'Goa', stars: 4, price: 7499, image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&q=80', amenities: ['WiFi', 'Pool', 'Beach Access', 'Bar', 'Restaurant'], rating: 4.6, reviews: 2150 },

  // ── Delhi ──
  { id: 7, name: 'Royal Heritage Hotel', city: 'Delhi', stars: 5, price: 9499, image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar'], rating: 4.7, reviews: 2780 },
  { id: 8, name: 'Metro Stay', city: 'Delhi', stars: 3, price: 3299, image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&q=80', amenities: ['WiFi', 'Parking', 'Restaurant'], rating: 4.0, reviews: 650 },
  { id: 9, name: 'Imperial Plaza', city: 'Delhi', stars: 4, price: 6899, image: 'https://images.unsplash.com/photo-1455587734955-081b22074882?w=400&q=80', amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Parking'], rating: 4.5, reviews: 1890 },

  // ── Bangalore ──
  { id: 10, name: 'Lakeview Retreat', city: 'Bangalore', stars: 4, price: 6499, image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80', amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant'], rating: 4.6, reviews: 1540 },
  { id: 11, name: 'Tech Park Residency', city: 'Bangalore', stars: 3, price: 3999, image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&q=80', amenities: ['WiFi', 'Gym', 'Parking', 'Restaurant'], rating: 4.3, reviews: 920 },
  { id: 12, name: 'Garden City Grand', city: 'Bangalore', stars: 5, price: 10499, image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar'], rating: 4.8, reviews: 2670 },

  // ── Chennai ──
  { id: 13, name: 'Marina Bay Hotel', city: 'Chennai', stars: 4, price: 5999, image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&q=80', amenities: ['WiFi', 'Pool', 'Restaurant', 'Bar'], rating: 4.4, reviews: 1100 },
  { id: 14, name: 'Temple Town Lodge', city: 'Chennai', stars: 3, price: 2799, image: 'https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?w=400&q=80', amenities: ['WiFi', 'Restaurant', 'Parking'], rating: 4.0, reviews: 720 },
  { id: 15, name: 'Coromandel Suites', city: 'Chennai', stars: 5, price: 8999, image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar'], rating: 4.7, reviews: 1950 },

  // ── Dubai ──
  { id: 16, name: 'Desert Oasis Resort', city: 'Dubai', stars: 5, price: 22999, image: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Beach Access'], rating: 4.9, reviews: 4200 },
  { id: 17, name: 'Burj Vista Hotel', city: 'Dubai', stars: 5, price: 28999, image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Concierge'], rating: 4.9, reviews: 5100 },
  { id: 18, name: 'Marina Sands Dubai', city: 'Dubai', stars: 4, price: 14999, image: 'https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?w=400&q=80', amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Bar'], rating: 4.6, reviews: 2300 },

  // ── Jaipur ──
  { id: 19, name: 'Pink City Palace', city: 'Jaipur', stars: 5, price: 11499, image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Heritage Tour'], rating: 4.8, reviews: 3200 },
  { id: 20, name: 'Hawa Mahal View Inn', city: 'Jaipur', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400&q=80', amenities: ['WiFi', 'Restaurant', 'Parking'], rating: 4.2, reviews: 870 },
  { id: 21, name: 'Royal Rajputana', city: 'Jaipur', stars: 4, price: 7999, image: 'https://images.unsplash.com/photo-1600011689032-8b628b8a8747?w=400&q=80', amenities: ['WiFi', 'Pool', 'Restaurant', 'Spa', 'Cultural Shows'], rating: 4.6, reviews: 1780 },

  // ── Kolkata ──
  { id: 22, name: 'Victoria Memorial Suites', city: 'Kolkata', stars: 4, price: 5499, image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=400&q=80', amenities: ['WiFi', 'Gym', 'Restaurant', 'Bar'], rating: 4.4, reviews: 1120 },
  { id: 23, name: 'Howrah Grand Hotel', city: 'Kolkata', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80', amenities: ['WiFi', 'Restaurant', 'Parking'], rating: 4.1, reviews: 680 },
  { id: 24, name: 'Park Street Residency', city: 'Kolkata', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar'], rating: 4.7, reviews: 2340 },

  // ── Hyderabad ──
  { id: 25, name: 'Charminar Grand', city: 'Hyderabad', stars: 4, price: 5999, image: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400&q=80', amenities: ['WiFi', 'Pool', 'Restaurant', 'Gym'], rating: 4.5, reviews: 1650 },
  { id: 26, name: 'Hitech City Suites', city: 'Hyderabad', stars: 3, price: 3499, image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&q=80', amenities: ['WiFi', 'Gym', 'Restaurant', 'Parking'], rating: 4.2, reviews: 890 },
  { id: 27, name: 'Nizam Palace Hotel', city: 'Hyderabad', stars: 5, price: 9999, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Heritage Walk'], rating: 4.8, reviews: 2890 },

  // ── Udaipur ──
  { id: 28, name: 'Lake Pichola Resort', city: 'Udaipur', stars: 5, price: 15999, image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Lake View', 'Restaurant', 'Bar'], rating: 4.9, reviews: 3800 },
  { id: 29, name: 'Mewar Heritage Stay', city: 'Udaipur', stars: 4, price: 7499, image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80', amenities: ['WiFi', 'Pool', 'Restaurant', 'Heritage Tour'], rating: 4.6, reviews: 1560 },
  { id: 30, name: 'Aravalli View Inn', city: 'Udaipur', stars: 3, price: 3999, image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400&q=80', amenities: ['WiFi', 'Restaurant', 'Mountain View', 'Parking'], rating: 4.3, reviews: 940 },

  // ── Kerala ──
  { id: 31, name: 'Backwater Paradise', city: 'Kerala', stars: 5, price: 13999, image: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Houseboat', 'Ayurveda', 'Restaurant'], rating: 4.9, reviews: 3400 },
  { id: 32, name: 'Munnar Tea Garden Resort', city: 'Kerala', stars: 4, price: 6999, image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&q=80', amenities: ['WiFi', 'Restaurant', 'Tea Tour', 'Nature Walk'], rating: 4.6, reviews: 1890 },
  { id: 33, name: 'Cochin Harbor Lodge', city: 'Kerala', stars: 3, price: 3299, image: 'https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?w=400&q=80', amenities: ['WiFi', 'Restaurant', 'Parking'], rating: 4.2, reviews: 780 },

  // ── Manali ──
  { id: 34, name: 'Snow Peak Lodge', city: 'Manali', stars: 4, price: 7999, image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=400&q=80', amenities: ['WiFi', 'Restaurant', 'Mountain View', 'Bonfire', 'Trekking'], rating: 4.7, reviews: 2100 },
  { id: 35, name: 'Solang Valley Resort', city: 'Manali', stars: 5, price: 12499, image: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=400&q=80', amenities: ['WiFi', 'Spa', 'Restaurant', 'Adventure Sports', 'Gym'], rating: 4.8, reviews: 2650 },
  { id: 36, name: 'Old Manali Backpacker', city: 'Manali', stars: 2, price: 1499, image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&q=80', amenities: ['WiFi', 'Café', 'Common Kitchen'], rating: 4.0, reviews: 540 },

  // ── Singapore ──
  { id: 37, name: 'Marina Bay Sands View', city: 'Singapore', stars: 5, price: 29999, image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Infinity Pool'], rating: 4.9, reviews: 5800 },
  { id: 38, name: 'Orchard Road Suites', city: 'Singapore', stars: 4, price: 18999, image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&q=80', amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Shopping Access'], rating: 4.6, reviews: 2200 },
  { id: 39, name: 'Little India Budget Stay', city: 'Singapore', stars: 3, price: 9999, image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80', amenities: ['WiFi', 'Restaurant', 'Metro Access'], rating: 4.1, reviews: 920 },

  // ── Bangkok ──
  { id: 40, name: 'Riverside Grand Bangkok', city: 'Bangkok', stars: 5, price: 15999, image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'River View'], rating: 4.8, reviews: 3900 },
  { id: 41, name: 'Sukhumvit City Hotel', city: 'Bangkok', stars: 4, price: 8999, image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&q=80', amenities: ['WiFi', 'Pool', 'Restaurant', 'Nightlife Access'], rating: 4.5, reviews: 1780 },
  { id: 42, name: 'Khao San Road Hostel', city: 'Bangkok', stars: 2, price: 2499, image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&q=80', amenities: ['WiFi', 'Café', 'Rooftop Bar'], rating: 4.0, reviews: 650 },
];

const hotelBookings = [];

// GET /api/hotels?city=&checkin=&checkout=&guests=
router.get('/', (req, res) => {
  const { city = '', checkin, checkout, guests = 1 } = req.query;
  let results = [...mockHotels];

  if (city) {
    results = results.filter(h => h.city.toLowerCase().includes(city.toLowerCase()));
  }

  // Add random price variation
  results = results.map(h => ({
    ...h,
    price: h.price + Math.floor(Math.random() * 500 - 250),
    available: Math.floor(Math.random() * 10) + 1,
  }));

  setTimeout(() => {
    res.json({ success: true, count: results.length, hotels: results, city, checkin, checkout, guests: Number(guests) });
  }, 600);
});

// GET /api/hotels/cities
router.get('/cities', (req, res) => {
  const cities = [...new Set(mockHotels.map(h => h.city))];
  res.json({ success: true, cities });
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
