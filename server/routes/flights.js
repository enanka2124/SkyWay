const express = require('express');
const router = express.Router();

// Airlines data
const airlines = [
  { name: 'IndiGo', icon: '🔵', code: '6E' },
  { name: 'Air India', icon: '🔴', code: 'AI' },
  { name: 'SpiceJet', icon: '🟠', code: 'SG' },
  { name: 'Vistara', icon: '🟣', code: 'UK' },
  { name: 'AkasaAir', icon: '🟡', code: 'QP' },
  { name: 'GoFirst', icon: '🟢', code: 'G8' },
  { name: 'Emirates', icon: '🔴', code: 'EK' },
  { name: 'Singapore Air', icon: '🔵', code: 'SQ' },
];

// Popular routes data — expanded with location images
const popularRoutes = [
  { id: 1, from: 'Mumbai', fromCode: 'BOM', to: 'Goa', toCode: 'GOI', price: 2499, duration: '1h 10m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&q=80' },
  { id: 2, from: 'Delhi', fromCode: 'DEL', to: 'Bangalore', toCode: 'BLR', price: 3199, duration: '2h 40m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=400&q=80' },
  { id: 3, from: 'Bangalore', fromCode: 'BLR', to: 'Chennai', toCode: 'MAA', price: 1899, duration: '1h 5m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&q=80' },
  { id: 4, from: 'Mumbai', fromCode: 'BOM', to: 'Dubai', toCode: 'DXB', price: 12499, duration: '3h 15m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80' },
  { id: 5, from: 'Delhi', fromCode: 'DEL', to: 'Jaipur', toCode: 'JAI', price: 2199, duration: '1h 5m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400&q=80' },
  { id: 6, from: 'Mumbai', fromCode: 'BOM', to: 'Kolkata', toCode: 'CCU', price: 4299, duration: '2h 35m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1558431382-27e303142255?w=400&q=80' },
  { id: 7, from: 'Hyderabad', fromCode: 'HYD', to: 'Delhi', toCode: 'DEL', price: 3599, duration: '2h 10m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80' },
  { id: 8, from: 'Chennai', fromCode: 'MAA', to: 'Mumbai', toCode: 'BOM', price: 3399, duration: '1h 50m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&q=80' },
  { id: 9, from: 'Delhi', fromCode: 'DEL', to: 'Manali', toCode: 'KUU', price: 3999, duration: '1h 30m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400&q=80' },
  { id: 10, from: 'Bangalore', fromCode: 'BLR', to: 'Goa', toCode: 'GOI', price: 2699, duration: '1h 15m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1614082242765-7c98ca0f3df3?w=400&q=80' },
  { id: 11, from: 'Mumbai', fromCode: 'BOM', to: 'Singapore', toCode: 'SIN', price: 15999, duration: '5h 30m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80' },
  { id: 12, from: 'Delhi', fromCode: 'DEL', to: 'Bangkok', toCode: 'BKK', price: 11999, duration: '4h 20m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&q=80' },
  { id: 13, from: 'Kolkata', fromCode: 'CCU', to: 'Bangalore', toCode: 'BLR', price: 4599, duration: '2h 45m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=400&q=80' },
  { id: 14, from: 'Hyderabad', fromCode: 'HYD', to: 'Dubai', toCode: 'DXB', price: 14999, duration: '3h 45m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80' },
  { id: 15, from: 'Delhi', fromCode: 'DEL', to: 'Udaipur', toCode: 'UDR', price: 2899, duration: '1h 20m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&q=80' },
  { id: 16, from: 'Mumbai', fromCode: 'BOM', to: 'Jaipur', toCode: 'JAI', price: 3499, duration: '2h 0m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80' },
];

// Generate mock flights
function generateFlights(from, to) {
  const basePrices = [2499, 3199, 4999, 6999, 9999, 2799, 5499, 7499];
  const durations = ['1h 10m', '2h 20m', '1h 50m', '3h 05m', '2h 45m', '1h 30m', '2h 10m', '3h 30m'];
  const stopsOptions = ['Direct', 'Direct', '1 Stop', 'Direct', '1 Stop', 'Direct', '1 Stop', 'Direct'];
  const depTimes = ['06:00', '08:45', '11:30', '15:20', '18:00', '05:30', '13:15', '20:30'];
  const arrTimes = ['07:10', '11:05', '13:20', '18:25', '20:45', '07:00', '15:25', '00:00'];

  const flights = [];
  const numFlights = Math.min(8, airlines.length);
  for (let i = 0; i < numFlights; i++) {
    const airline = airlines[i % airlines.length];
    flights.push({
      id: i + 1,
      airline: airline.name,
      icon: airline.icon,
      code: airline.code,
      from,
      to,
      price: basePrices[i] + Math.floor(Math.random() * 500),
      dep: depTimes[i],
      arr: arrTimes[i],
      duration: durations[i],
      stops: stopsOptions[i],
      baggage: i % 2 === 0 ? '15 kg' : '20 kg',
      meal: i % 3 === 0 ? 'Meal incl.' : 'No meal',
    });
  }
  return flights;
}

// GET /api/flights?from=X&to=Y&date=Z
router.get('/', (req, res) => {
  const { from = 'Mumbai', to = 'Delhi', date } = req.query;

  setTimeout(() => {
    const flights = generateFlights(from, to);
    res.json({
      success: true,
      count: flights.length,
      from,
      to,
      date: date || new Date().toISOString().split('T')[0],
      flights,
    });
  }, 800);
});

// GET /api/flights/popular
router.get('/popular', (req, res) => {
  res.json({
    success: true,
    routes: popularRoutes,
  });
});

// POST /api/flights/multi — multi-city search
router.post('/multi', (req, res) => {
  const { legs } = req.body;
  if (!legs || !Array.isArray(legs) || legs.length < 2) {
    return res.status(400).json({ success: false, error: 'At least 2 legs required' });
  }

  setTimeout(() => {
    const results = legs.map((leg, i) => ({
      leg: i + 1,
      from: leg.from || 'Mumbai',
      to: leg.to || 'Delhi',
      date: leg.date || new Date().toISOString().split('T')[0],
      flights: generateFlights(leg.from || 'Mumbai', leg.to || 'Delhi'),
    }));

    res.json({ success: true, type: 'multi-city', legs: results });
  }, 1000);
});

module.exports = router;
