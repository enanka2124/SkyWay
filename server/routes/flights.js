const express = require('express');
const router = express.Router();

// Airlines data
const airlines = [
  { name: 'IndiGo',       icon: '🔵', code: '6E' },
  { name: 'Air India',    icon: '🔴', code: 'AI' },
  { name: 'SpiceJet',     icon: '🟠', code: 'SG' },
  { name: 'Vistara',      icon: '🟣', code: 'UK' },
  { name: 'AkasaAir',     icon: '🟡', code: 'QP' },
  { name: 'GoFirst',      icon: '🟢', code: 'G8' },
  { name: 'Emirates',     icon: '🔴', code: 'EK' },
  { name: 'Singapore Air',icon: '🔵', code: 'SQ' },
];

// Popular routes data
const popularRoutes = [
  { id: 1,  from: 'Mumbai',    fromCode: 'BOM', to: 'Goa',       toCode: 'GOI', price: 2499,  duration: '1h 10m',  stops: 'Direct', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&q=80' },
  { id: 2,  from: 'Delhi',     fromCode: 'DEL', to: 'Bangalore', toCode: 'BLR', price: 3199,  duration: '2h 40m',  stops: 'Direct', image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=400&q=80' },
  { id: 3,  from: 'Bangalore', fromCode: 'BLR', to: 'Chennai',   toCode: 'MAA', price: 1899,  duration: '1h 5m',   stops: 'Direct', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&q=80' },
  { id: 4,  from: 'Mumbai',    fromCode: 'BOM', to: 'Dubai',     toCode: 'DXB', price: 12499, duration: '3h 15m',  stops: 'Direct', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80' },
  { id: 5,  from: 'Delhi',     fromCode: 'DEL', to: 'Jaipur',    toCode: 'JAI', price: 2199,  duration: '1h 5m',   stops: 'Direct', image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400&q=80' },
  { id: 6,  from: 'Mumbai',    fromCode: 'BOM', to: 'Kolkata',   toCode: 'CCU', price: 4299,  duration: '2h 35m',  stops: 'Direct', image: 'https://images.unsplash.com/photo-1558431382-27e303142255?w=400&q=80' },
  { id: 7,  from: 'Hyderabad', fromCode: 'HYD', to: 'Delhi',     toCode: 'DEL', price: 3599,  duration: '2h 10m',  stops: 'Direct', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80' },
  { id: 8,  from: 'Chennai',   fromCode: 'MAA', to: 'Mumbai',    toCode: 'BOM', price: 3399,  duration: '1h 50m',  stops: 'Direct', image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&q=80' },
  { id: 9,  from: 'Delhi',     fromCode: 'DEL', to: 'Manali',    toCode: 'KUU', price: 3999,  duration: '1h 30m',  stops: 'Direct', image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400&q=80' },
  { id: 10, from: 'Bangalore', fromCode: 'BLR', to: 'Goa',       toCode: 'GOI', price: 2699,  duration: '1h 15m',  stops: 'Direct', image: 'https://images.unsplash.com/photo-1614082242765-7c98ca0f3df3?w=400&q=80' },
  { id: 11, from: 'Mumbai',    fromCode: 'BOM', to: 'Singapore', toCode: 'SIN', price: 15999, duration: '5h 30m',  stops: 'Direct', image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80' },
  { id: 12, from: 'Delhi',     fromCode: 'DEL', to: 'Bangkok',   toCode: 'BKK', price: 11999, duration: '4h 20m',  stops: 'Direct', image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&q=80' },
  { id: 13, from: 'Kolkata',   fromCode: 'CCU', to: 'Bangalore', toCode: 'BLR', price: 4599,  duration: '2h 45m',  stops: 'Direct', image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=400&q=80' },
  { id: 14, from: 'Hyderabad', fromCode: 'HYD', to: 'Dubai',     toCode: 'DXB', price: 14999, duration: '3h 45m',  stops: 'Direct', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80' },
  { id: 15, from: 'Delhi',     fromCode: 'DEL', to: 'Udaipur',   toCode: 'UDR', price: 2899,  duration: '1h 20m',  stops: 'Direct', image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&q=80' },
  { id: 16, from: 'Mumbai',    fromCode: 'BOM', to: 'Jaipur',    toCode: 'JAI', price: 3499,  duration: '2h 0m',   stops: 'Direct', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80' },
  { id: 17, from: 'Delhi',     fromCode: 'DEL', to: 'London',    toCode: 'LHR', price: 45999, duration: '9h 30m',  stops: 'Direct', image: 'https://images.unsplash.com/photo-1513635269975-5969336cd190?w=400&q=80' },
  { id: 18, from: 'Mumbai',    fromCode: 'BOM', to: 'New York',  toCode: 'JFK', price: 65999, duration: '15h 45m', stops: '1 Stop', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&q=80' },
  { id: 19, from: 'Bangalore', fromCode: 'BLR', to: 'Paris',     toCode: 'CDG', price: 48999, duration: '10h 15m', stops: '1 Stop', image: 'https://images.unsplash.com/photo-1502602898657-3e907a5ea071?w=400&q=80' },
  { id: 20, from: 'Chennai',   fromCode: 'MAA', to: 'Colombo',   toCode: 'CMB', price: 8999,  duration: '1h 25m',  stops: 'Direct', image: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=400&q=80' },
  { id: 21, from: 'Delhi',     fromCode: 'DEL', to: 'Tokyo',     toCode: 'NRT', price: 52999, duration: '8h 20m',  stops: '1 Stop', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80' },
  { id: 22, from: 'Mumbai',    fromCode: 'BOM', to: 'Bali',      toCode: 'DPS', price: 28999, duration: '7h 10m',  stops: '1 Stop', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80' },
  { id: 23, from: 'Pune',      fromCode: 'PNQ', to: 'Delhi',     toCode: 'DEL', price: 3499,  duration: '2h 10m',  stops: 'Direct', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80' },
  { id: 24, from: 'Ahmedabad', fromCode: 'AMD', to: 'Mumbai',    toCode: 'BOM', price: 2199,  duration: '1h 5m',   stops: 'Direct', image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&q=80' },
  { id: 25, from: 'Kolkata',   fromCode: 'CCU', to: 'Kathmandu', toCode: 'KTM', price: 7999,  duration: '1h 45m',  stops: 'Direct', image: 'https://images.unsplash.com/photo-1581403067825-7bdf9c6e5c9b?w=400&q=80' },
];

// Helper: parse "2h 05m" → total minutes
function parseMins(dur) {
  const h = parseInt(dur.match(/(\d+)h/)?.[1] || 0);
  const m = parseInt(dur.match(/(\d+)m/)?.[1] || 0);
  return h * 60 + m;
}

// Generate mock flights with smart Stop + Duration pricing
function generateFlights(from, to, dateStr) {
  const basePrices   = [2499, 2799, 3199, 4999, 5499, 6999, 7499, 9999];
  const durations    = ['4h 30m', '3h 45m', '3h 15m', '2h 20m', '2h 05m', '1h 45m', '1h 20m', '1h 05m'];
  const stopsOptions = ['1 Stop', '1 Stop', '1 Stop',  'Direct',  'Direct',  'Direct',  'Direct',  'Direct'];
  const depTimes     = ['05:30',  '08:45',  '11:30',   '13:15',   '15:20',   '18:00',   '20:30',   '06:00'];
  const arrTimes     = ['10:00',  '12:30',  '14:45',   '15:35',   '17:25',   '19:45',   '21:50',   '07:05'];

  //  Date demand multiplier 
  let demandMult = 1.0;
  if (dateStr) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts.map(Number);
      const hash = y + (m - 1) + d;
      if (hash % 5 === 0)      demandMult = 2.0;  // Red   – High Demand
      else if (hash % 3 === 0) demandMult = 1.3;  // Yellow – Medium Demand
    }
  }

  //  International price boost 
  const intlCities = ['dubai','singapore','bangkok','london','new york','paris','tokyo','sydney','colombo','male','kathmandu','kuala lumpur','bali'];
  const isIntl = intlCities.includes(from.toLowerCase()) || intlCities.includes(to.toLowerCase());
  if (isIntl) demandMult *= 5.5;

  //  Pre-compute Direct duration range for time-bonus normalisation 
  const directMins = durations
    .filter((_, i) => stopsOptions[i] === 'Direct')
    .map(parseMins);
  const maxDirectMins = Math.max(...directMins); // longest direct  → timeBonus = 1.0
  const minDirectMins = Math.min(...directMins); // shortest direct → timeBonus = 1.8
  const durRange = maxDirectMins - minDirectMins || 1; // guard division by zero

  const flights = [];
  for (let i = 0; i < Math.min(8, airlines.length); i++) {
    const airline = airlines[i % airlines.length];
    const stops   = stopsOptions[i];
    const durMins = parseMins(durations[i]);
    const baseRaw = basePrices[i] + Math.floor(Math.random() * 500);

    //  Stop + Time Pricing 
    // 1 Stop  : base price (cheapest — has a layover)
    // Direct  : base × 1.5 (premium for no stop)
    // Direct + shorter time → extra time bonus up to ×1.8
    //   timeBonus = 1.0 + ((maxDirect − thisDur) / range) × 0.8
    //   e.g. 2h 20m (longest direct) → timeBonus = 1.0 → stopMult = 1.5
    //        1h 05m (shortest direct) → timeBonus = 1.8 → stopMult = 2.7
    // 
    let stopMult = 1.0;
    if (stops === 'Direct') {
      const timeBonus = 1.0 + ((maxDirectMins - durMins) / durRange) * 0.8;
      stopMult = 1.5 * timeBonus;
    }

    flights.push({
      id:       i + 1,
      airline:  airline.name,
      icon:     airline.icon,
      code:     airline.code,
      from,
      to,
      price:    Math.floor(baseRaw * demandMult * stopMult),
      dep:      depTimes[i],
      arr:      arrTimes[i],
      duration: durations[i],
      stops,
      baggage:  i % 2 === 0 ? '15 kg' : '20 kg',
      meal:     i % 3 === 0 ? 'Meal incl.' : 'No meal',
    });
  }
  return flights;
}

// GET /api/flights?from=X&to=Y&date=Z
router.get('/', (req, res) => {
  const { from = 'Mumbai', to = 'Delhi', date } = req.query;
  setTimeout(() => {
    const flights = generateFlights(from, to, date || new Date().toISOString().split('T')[0]);
    res.json({ success: true, count: flights.length, from, to, date: date || new Date().toISOString().split('T')[0], flights });
  }, 800);
});

// GET /api/flights/popular
router.get('/popular', (req, res) => {
  res.json({ success: true, routes: popularRoutes });
});

// POST /api/flights/multi
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
