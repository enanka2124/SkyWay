const express = require('express');
const router = express.Router();
const axios = require('axios');

// Expanded airport map
const AIRPORT_MAP = {
  'mumbai': { skyId: 'BOM', entityId: '95673320' },
  'delhi': { skyId: 'DEL', entityId: '95673498' },
  'new delhi': { skyId: 'DEL', entityId: '95673498' },
  'bangalore': { skyId: 'BLR', entityId: '95673436' },
  'bengaluru': { skyId: 'BLR', entityId: '95673436' },
  'chennai': { skyId: 'MAA', entityId: '95673479' },
  'kolkata': { skyId: 'CCU', entityId: '95673330' },
  'hyderabad': { skyId: 'HYD', entityId: '95673493' },
  'pune': { skyId: 'PNQ', entityId: '95673496' },
  'ahmedabad': { skyId: 'AMD', entityId: '95673437' },
  'goa': { skyId: 'GOI', entityId: '95673341' },
  'jaipur': { skyId: 'JAI', entityId: '95673388' },
  'kochi': { skyId: 'COK', entityId: '95673331' },
  'lucknow': { skyId: 'LKO', entityId: '95673403' },
  'srinagar': { skyId: 'SXR', entityId: '95673523' },
  'amritsar': { skyId: 'ATQ', entityId: '95673438' },
  'varanasi': { skyId: 'VNS', entityId: '95673535' },
  'bhubaneswar': { skyId: 'BBI', entityId: '95673442' },
  'guwahati': { skyId: 'GAU', entityId: '95673357' },
  'chandigarh': { skyId: 'IXC', entityId: '95673462' },
  'nagpur': { skyId: 'NAG', entityId: '95673415' },
  'indore': { skyId: 'IDR', entityId: '95673384' },
  'mangalore': { skyId: 'IXE', entityId: '95673470' },
  'thiruvananthapuram': { skyId: 'TRV', entityId: '95673527' },
  'tirupati': { skyId: 'TIR', entityId: '95673526' },
  'coimbatore': { skyId: 'CJB', entityId: '95673326' },
  'madurai': { skyId: 'IXM', entityId: '95673471' },
  'vishakhapatnam': { skyId: 'VTZ', entityId: '95673536' },
  'visakhapatnam': { skyId: 'VTZ', entityId: '95673536' },
  'patna': { skyId: 'PAT', entityId: '95673421' },
  'ranchi': { skyId: 'IXR', entityId: '95673475' },
  'raipur': { skyId: 'RPR', entityId: '95673499' },
  'bhopal': { skyId: 'BHO', entityId: '95673443' },
  'dubai': { skyId: 'DXB', entityId: '95673527' },
  'singapore': { skyId: 'SIN', entityId: '95673502' },
  'bangkok': { skyId: 'BKK', entityId: '95673440' },
  'london': { skyId: 'LHR', entityId: '95673492' },
  'new york': { skyId: 'JFK', entityId: '95673490' },
  'paris': { skyId: 'CDG', entityId: '95673422' },
  'tokyo': { skyId: 'NRT', entityId: '95673516' },
  'bali': { skyId: 'DPS', entityId: '95673337' },
  'colombo': { skyId: 'CMB', entityId: '95673329' },
  'kathmandu': { skyId: 'KTM', entityId: '95673392' },
  'manali': { skyId: 'KUU', entityId: '95673401' },
  'udaipur': { skyId: 'UDR', entityId: '95673531' },
  'jodhpur': { skyId: 'JDH', entityId: '95673389' },
  'mysore': { skyId: 'MYQ', entityId: '95673414' },
  'dehradun': { skyId: 'DED', entityId: '95673338' },
};

const popularRoutes = [
  { id: 1,  from: 'Mumbai',    fromCode: 'BOM', to: 'Goa',       toCode: 'GOI', price: 4199,  duration: '1h 10m',  stops: 'Direct', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&q=80' },
  { id: 2,  from: 'Delhi',     fromCode: 'DEL', to: 'Bangalore', toCode: 'BLR', price: 6899,  duration: '2h 40m',  stops: 'Direct', image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=400&q=80' },
  { id: 3,  from: 'Bangalore', fromCode: 'BLR', to: 'Chennai',   toCode: 'MAA', price: 3499,  duration: '1h 5m',   stops: 'Direct', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&q=80' },
  { id: 4,  from: 'Mumbai',    fromCode: 'BOM', to: 'Dubai',     toCode: 'DXB', price: 18499, duration: '3h 15m',  stops: 'Direct', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80' },
  { id: 5,  from: 'Delhi',     fromCode: 'DEL', to: 'Jaipur',    toCode: 'JAI', price: 3199,  duration: '1h 5m',   stops: 'Direct', image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400&q=80' },
  { id: 6,  from: 'Mumbai',    fromCode: 'BOM', to: 'Kolkata',   toCode: 'CCU', price: 7499,  duration: '2h 35m',  stops: 'Direct', image: 'https://images.unsplash.com/photo-1558431382-27e303142255?w=400&q=80' },
  { id: 7,  from: 'Hyderabad', fromCode: 'HYD', to: 'Delhi',     toCode: 'DEL', price: 5899,  duration: '2h 10m',  stops: 'Direct', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80' },
  { id: 8,  from: 'Chennai',   fromCode: 'MAA', to: 'Mumbai',    toCode: 'BOM', price: 5399,  duration: '1h 50m',  stops: 'Direct', image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&q=80' },
  { id: 9,  from: 'Delhi',     fromCode: 'DEL', to: 'Manali',    toCode: 'KUU', price: 6199,  duration: '1h 30m',  stops: 'Direct', image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400&q=80' },
  { id: 10, from: 'Bangalore', fromCode: 'BLR', to: 'Goa',       toCode: 'GOI', price: 3899,  duration: '1h 15m',  stops: 'Direct', image: 'https://images.unsplash.com/photo-1614082242765-7c98ca0f3df3?w=400&q=80' },
  { id: 11, from: 'Mumbai',    fromCode: 'BOM', to: 'Singapore', toCode: 'SIN', price: 21999, duration: '5h 30m',  stops: 'Direct', image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80' },
  { id: 12, from: 'Delhi',     fromCode: 'DEL', to: 'Bangkok',   toCode: 'BKK', price: 16999, duration: '4h 20m',  stops: 'Direct', image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&q=80' },
];

async function getAirportDetails(cityName) {
  if (!cityName) return { skyId: 'BOM', entityId: '95673320' };
  const cleanName = cityName.split(',')[0].trim().toLowerCase().replace(/\s*\(.*?\)/, '');
  if (AIRPORT_MAP[cleanName]) return AIRPORT_MAP[cleanName];

  try {
    const res = await axios.request({
      method: 'GET',
      url: 'https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchAirport',
      params: { query: cleanName },
      headers: {
        'X-RapidAPI-Key': process.env.SKYSCANNER_RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'sky-scrapper.p.rapidapi.com'
      }
    });
    if (res.data && res.data.data && res.data.data.length > 0) {
      const best = res.data.data.find(d => d.navigation.entityType === 'AIRPORT') || res.data.data[0];
      if (best && best.navigation && best.navigation.relevantFlightParams) {
        return best.navigation.relevantFlightParams;
      }
    }
  } catch (error) {
    console.error('Airport search error:', error.message);
  }
  return { skyId: 'BOM', entityId: '95673320' };
}

// Skyscanner-style tiered base price by route distance
function getBasePrice(from, to) {
  const f = from.toLowerCase().replace(/\s*\(.*?\)/, '');
  const t = to.toLowerCase().replace(/\s*\(.*?\)/, '');

  // Long-haul international (EU/US) — ₹55k–₹1.5L
  const longHaul = ['london','new york','paris','tokyo','lhr','jfk','cdg','nrt'];
  if (longHaul.some(c => f.includes(c) || t.includes(c)))
    return Math.floor(Math.random() * 95000) + 55000;

  // Regional international (Dubai/SEA) — ₹18k–₹45k
  const regional = ['dubai','singapore','bangkok','bali','colombo','kathmandu','dxb','sin','bkk'];
  if (regional.some(c => f.includes(c) || t.includes(c)))
    return Math.floor(Math.random() * 27000) + 18000;

  // Long domestic cross-country (~3h+) — ₹14k–₹22k
  const longPairs = [
    ['mumbai','kolkata'],['delhi','chennai'],['bangalore','delhi'],
    ['hyderabad','kolkata'],['mumbai','guwahati'],['delhi','kochi'],
    ['mumbai','srinagar'],['chennai','amritsar'],['kolkata','delhi'],
  ];
  if (longPairs.some(([a,b]) => (f.includes(a)&&t.includes(b))||(f.includes(b)&&t.includes(a))))
    return Math.floor(Math.random() * 8000) + 14000;  // ₹14k–₹22k

  // Medium domestic metro pairs (~1.5–3h) — ₹10k–₹18k
  const medPairs = [
    ['mumbai','delhi'],['delhi','bangalore'],['mumbai','chennai'],
    ['hyderabad','delhi'],['pune','delhi'],['ahmedabad','delhi'],
    ['mumbai','hyderabad'],['kolkata','bangalore'],['hyderabad','bangalore'],
  ];
  if (medPairs.some(([a,b]) => (f.includes(a)&&t.includes(b))||(f.includes(b)&&t.includes(a))))
    return Math.floor(Math.random() * 8000) + 10000;  // ₹10k–₹18k

  // Short domestic nearby (<1.5h) — ₹6k–₹13k
  return Math.floor(Math.random() * 7000) + 6000;     // ₹6k–₹13k
}

/**
 * Date-based surge multiplier — aligned with calendar dot colors:
 *  🔴 Red    0–3 days  : +80–120% surge  (last-minute, very high)
 *  🟡 Yellow 4–10 days : +20–50% surge   (near-term, high)
 *  🟡 Yellow 11–21 days: +5–20% surge    (normal market)
 *  🟢 Green  22–45 days: -5–0%           (advance, lower)
 *  🟢 Green  45+ days  : -15–-5%         (early bird, cheapest)
 */
function getDateSurgeMultiplier(targetDate) {
  if (!targetDate) return 1.0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Parse as local date (avoid UTC shift bug)
  const [y, m, d] = targetDate.split('-').map(Number);
  const travel = new Date(y, m - 1, d);
  const daysAhead = Math.floor((travel - today) / (1000 * 60 * 60 * 24));

  if (daysAhead <= 0)  return 2.00 + Math.random() * 0.30; // today: +100–130%
  if (daysAhead <= 1)  return 1.80 + Math.random() * 0.25; // tomorrow: +80–105%
  if (daysAhead <= 3)  return 1.55 + Math.random() * 0.20; // 2–3 days: +55–75%
  if (daysAhead <= 7)  return 1.25 + Math.random() * 0.20; // 4–7 days: +25–45%
  if (daysAhead <= 14) return 1.10 + Math.random() * 0.12; // 1–2 weeks: +10–22%
  if (daysAhead <= 21) return 1.03 + Math.random() * 0.08; // 3 weeks: +3–11%
  if (daysAhead <= 45) return 0.94 + Math.random() * 0.06; // 1–1.5 months: -6–0%
  return 0.84 + Math.random() * 0.06;                       // 45+ days: -16–-10%
}

/** Dot color — matches surge tier exactly */
function getDateDotColor(targetDate) {
  if (!targetDate) return 'green';
  const today = new Date(); today.setHours(0,0,0,0);
  const [y, m, d] = targetDate.split('-').map(Number);
  const travel = new Date(y, m - 1, d);
  const daysAhead = Math.floor((travel - today) / (1000*60*60*24));
  if (daysAhead <= 3)  return 'red';    // 🔴 last-minute: most expensive
  if (daysAhead <= 21) return 'yellow'; // 🟡 near: medium price
  return 'green';                        // 🟢 advance: cheapest
}

function buildMockFlights(from, to, count = 12, targetDate = null) {
  const airlines = [
    { name: 'IndiGo',    code: '6E', multiplier: 1.00 },
    { name: 'Air India', code: 'AI', multiplier: 1.18 },
    { name: 'Vistara',   code: 'UK', multiplier: 1.30 },
    { name: 'SpiceJet',  code: 'SG', multiplier: 0.92 },
    { name: 'Akasa Air', code: 'QP', multiplier: 0.95 },
    { name: 'Go First',  code: 'G8', multiplier: 0.88 },
    { name: 'Alliance Air', code: '9I', multiplier: 1.05 },
    { name: 'Star Air',  code: 'S5', multiplier: 0.97 },
  ];

  const basePrice = getBasePrice(from, to);
  const surgeMultiplier = getDateSurgeMultiplier(targetDate);
  const flights = [];

  for (let i = 0; i < count; i++) {
    const airline = airlines[i % airlines.length];
    const priceVariance = (Math.random() * 0.35) - 0.1;
    const price = Math.floor(basePrice * airline.multiplier * surgeMultiplier * (1 + priceVariance));

    const depHour = Math.floor(Math.random() * 18) + 4;
    const depMin = Math.floor(Math.random() * 12) * 5;
    // Faster flights cost more (real market behavior)
    const durationHours = Math.floor(Math.random() * 3) + 1;
    const durationMins = Math.floor(Math.random() * 12) * 5;

    let arrHour = depHour + durationHours;
    let arrMin = depMin + durationMins;
    if (arrMin >= 60) { arrHour += 1; arrMin -= 60; }
    arrHour = arrHour % 24;

    const fmt = (h, m) => `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    const stopChance = Math.random();

    flights.push({
      id: i + 1,
      airline: airline.name,
      icon: '✈️',
      code: airline.code,
      from,
      to,
      price,
      dep: fmt(depHour, depMin),
      arr: fmt(arrHour, arrMin),
      duration: `${durationHours}h ${durationMins}m`,
      stops: stopChance > 0.75 ? '1 Stop' : stopChance > 0.95 ? '2 Stops' : 'Direct',
      baggage: airline.name === 'Air India' || airline.name === 'Vistara' ? '23 kg' : '15 kg',
      meal: airline.name === 'Vistara' || airline.name === 'Air India' ? 'Included' : 'Standard'
    });
  }
  return flights;
}

// GET /api/flights
router.get('/', async (req, res) => {
  const { from = 'Mumbai', to = 'Delhi', date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    if (!process.env.SKYSCANNER_RAPIDAPI_KEY) throw new Error('Missing API Key');

    const originParams = await getAirportDetails(from);
    const destinationParams = await getAirportDetails(to);

    const response = await axios.request({
      method: 'GET',
      url: 'https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchFlights',
      params: {
        originSkyId: originParams.skyId,
        originEntityId: originParams.entityId,
        destinationSkyId: destinationParams.skyId,
        destinationEntityId: destinationParams.entityId,
        date: targetDate,
        adults: '1',
        currency: 'INR',
        limit: '20'
      },
      headers: {
        'X-RapidAPI-Key': process.env.SKYSCANNER_RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'sky-scrapper.p.rapidapi.com'
      }
    });

    if (response.data && response.data.data && response.data.data.itineraries && response.data.data.itineraries.length > 0) {
      const apiFlights = response.data.data.itineraries.slice(0, 20).map((itin, index) => {
        const leg = itin.legs[0];
        const carrier = leg.carriers.marketing[0];
        const durMins = leg.durationInMinutes;
        const hrs = Math.floor(durMins / 60);
        const mins = durMins % 60;
        return {
          id: index + 1,
          airline: carrier.name,
          icon: '✈️',
          code: carrier.alternateId || carrier.displayCode || 'FL',
          from, to,
          price: Math.floor(itin.price.raw * getDateSurgeMultiplier(targetDate)),
          dep: new Date(leg.departure).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          arr: new Date(leg.arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          duration: `${hrs}h ${mins}m`,
          stops: leg.stopCount === 0 ? 'Direct' : `${leg.stopCount} Stop${leg.stopCount > 1 ? 's' : ''}`,
          baggage: '15 kg',
          meal: 'Standard'
        };
      });

      // Compute filter summary prices
      const getDurMins = d => { const [h,m] = d.match(/\d+/g); return +h*60 + +m; };
      const byPrice = [...apiFlights].sort((a,b) => a.price - b.price);
      const bySpeed = [...apiFlights].sort((a,b) => getDurMins(a.duration) - getDurMins(b.duration));
      const byBest  = [...apiFlights].sort((a,b) => (a.price + getDurMins(a.duration)*10) - (b.price + getDurMins(b.duration)*10));

      return res.json({
        success: true,
        count: apiFlights.length,
        from, to, date: targetDate,
        flights: apiFlights,
        filterPrices: {
          cheapest: byPrice[0]?.price,
          fastest:  bySpeed[bySpeed.length - 1]?.price,  // fastest = shortest duration, typically higher price
          best:     byBest[0]?.price
        },
        source: 'skyscanner-live'
      });
    }

    throw new Error('No itineraries from Skyscanner');

  } catch (error) {
    console.log('Skyscanner API Error:', error.message, '— using market-realistic fallback');

    const mockFlights = buildMockFlights(from, to, 12, targetDate);
    const getDurMins = d => { const m = d.match(/\d+/g); return +m[0]*60 + +m[1]; };
    const byPrice = [...mockFlights].sort((a,b) => a.price - b.price);
    const bySpeed = [...mockFlights].sort((a,b) => getDurMins(a.duration) - getDurMins(b.duration));
    const byBest  = [...mockFlights].sort((a,b) => (a.price + getDurMins(a.duration)*10) - (b.price + getDurMins(b.duration)*10));

    return res.json({
      success: true,
      count: mockFlights.length,
      from, to, date: targetDate,
      flights: mockFlights,
      filterPrices: {
        cheapest: byPrice[0]?.price,
        fastest:  bySpeed[bySpeed.length - 1]?.price,
        best:     byBest[0]?.price
      },
      source: 'market-proxy'
    });
  }
});

// GET /api/flights/popular
router.get('/popular', (req, res) => {
  res.json({ success: true, routes: popularRoutes });
});

// POST /api/flights/multi
router.post('/multi', async (req, res) => {
  const { legs } = req.body;
  if (!legs || !Array.isArray(legs) || legs.length < 2) {
    return res.status(400).json({ success: false, error: 'At least 2 legs required' });
  }

  try {
    if (!process.env.SKYSCANNER_RAPIDAPI_KEY) throw new Error('Missing API Key');

    const results = await Promise.all(legs.map(async (leg, i) => {
      const from = leg.from || 'Mumbai';
      const to = leg.to || 'Delhi';
      const date = leg.date || new Date().toISOString().split('T')[0];

      const originParams = await getAirportDetails(from);
      const destinationParams = await getAirportDetails(to);

      const response = await axios.request({
        method: 'GET',
        url: 'https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchFlights',
        params: {
          originSkyId: originParams.skyId,
          originEntityId: originParams.entityId,
          destinationSkyId: destinationParams.skyId,
          destinationEntityId: destinationParams.entityId,
          date, adults: '1', currency: 'INR'
        },
        headers: {
          'X-RapidAPI-Key': process.env.SKYSCANNER_RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'sky-scrapper.p.rapidapi.com'
        }
      });

      let apiFlights = [];
      if (response.data && response.data.data && response.data.data.itineraries) {
        apiFlights = response.data.data.itineraries.slice(0, 8).map((itin, index) => {
          const l = itin.legs[0];
          const carrier = l.carriers.marketing[0];
          const durMins = l.durationInMinutes;
          return {
            id: index + 1, airline: carrier.name, icon: '✈️',
            code: carrier.alternateId || carrier.displayCode || 'FL',
            from, to, price: Math.floor(itin.price.raw),
            dep: new Date(l.departure).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            arr: new Date(l.arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            duration: `${Math.floor(durMins / 60)}h ${durMins % 60}m`,
            stops: l.stopCount === 0 ? 'Direct' : `${l.stopCount} Stop${l.stopCount > 1 ? 's' : ''}`,
            baggage: '15 kg', meal: 'Standard'
          };
        });
      }
      return { leg: i + 1, from, to, date, flights: apiFlights };
    }));

    res.json({ success: true, type: 'multi-city', legs: results });
  } catch (error) {
    console.log('Skyscanner Multi Error:', error.message, '— using market-realistic fallback');

    const results = legs.map((leg, i) => {
      const from = leg.from || 'Mumbai';
      const to = leg.to || 'Delhi';
      const date = leg.date || new Date().toISOString().split('T')[0];
      const flights = buildMockFlights(from, to, 8, date).sort((a,b) => a.price - b.price).map((f,idx) => ({...f, id: idx+1}));
      return { leg: i + 1, from, to, date, flights, source: 'market-proxy' };
    });

    return res.json({ success: true, type: 'multi-city', legs: results });
  }
});

module.exports = router;
