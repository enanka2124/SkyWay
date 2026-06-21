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
  { id: 1, from: 'Mumbai', fromCode: 'BOM', to: 'Goa', toCode: 'GOI', price: 4199, duration: '1h 10m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&q=80' },
  { id: 2, from: 'Delhi', fromCode: 'DEL', to: 'Bangalore', toCode: 'BLR', price: 6899, duration: '2h 40m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=400&q=80' },
  { id: 3, from: 'Bangalore', fromCode: 'BLR', to: 'Chennai', toCode: 'MAA', price: 4299, duration: '1h 5m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&q=80' },
  { id: 4, from: 'Mumbai', fromCode: 'BOM', to: 'Dubai', toCode: 'DXB', price: 18499, duration: '3h 15m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80' },
  { id: 5, from: 'Delhi', fromCode: 'DEL', to: 'Jaipur', toCode: 'JAI', price: 4199, duration: '1h 5m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400&q=80' },
  { id: 6, from: 'Mumbai', fromCode: 'BOM', to: 'Kolkata', toCode: 'CCU', price: 7499, duration: '2h 35m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1558431382-27e303142255?w=400&q=80' },
  { id: 7, from: 'Hyderabad', fromCode: 'HYD', to: 'Delhi', toCode: 'DEL', price: 5899, duration: '2h 10m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80' },
  { id: 8, from: 'Chennai', fromCode: 'MAA', to: 'Mumbai', toCode: 'BOM', price: 5399, duration: '1h 50m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&q=80' },
  { id: 9, from: 'Delhi', fromCode: 'DEL', to: 'Manali', toCode: 'KUU', price: 6199, duration: '1h 30m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400&q=80' },
  { id: 10, from: 'Bangalore', fromCode: 'BLR', to: 'Goa', toCode: 'GOI', price: 4299, duration: '1h 15m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1614082242765-7c98ca0f3df3?w=400&q=80' },
  { id: 11, from: 'Mumbai', fromCode: 'BOM', to: 'Singapore', toCode: 'SIN', price: 21999, duration: '5h 30m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80' },
  { id: 12, from: 'Delhi', fromCode: 'DEL', to: 'Bangkok', toCode: 'BKK', price: 16999, duration: '4h 20m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&q=80' },
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

/**
 * Real Indian aviation market base prices (lowest available seat — IndiGo/SpiceJet style)
 * These represent the cheapest seats with ADVANCE BOOKING (green dot baseline).
 * Surge multipliers are applied on top for yellow/red dates.
 *
 * Real market references (approx):
 *  - BLR→MAA (1h): ₹1,800–₹4,500
 *  - MUM→DEL (2h): ₹3,500–₹9,000
 *  - DEL→BLR (2.5h): ₹4,200–₹11,000
 *  - MUM→KOL (2.5h): ₹5,500–₹13,000
 *  - MUM→DXB (3h): ₹12,000–₹28,000
 *  - MUM→SIN (5.5h): ₹18,000–₹45,000
 *  - DEL→LHR (9h): ₹40,000–₹90,000
 */
function getBasePrice(from, to) {
  const f = from.toLowerCase().replace(/\s*\(.*?\)/, '').trim();
  const t = to.toLowerCase().replace(/\s*\(.*?\)/, '').trim();

  // Long-haul international (EU/US) — ₹38k–₹75k base (green dot; surge pushes to ₹90k+)
  const longHaul = ['london', 'new york', 'paris', 'tokyo', 'lhr', 'jfk', 'cdg', 'nrt'];
  if (longHaul.some(c => f.includes(c) || t.includes(c)))
    return Math.floor(Math.random() * 37000) + 38000;  // ₹38k–₹75k

  // Regional international (Gulf/SEA) — ₹11k–₹22k base
  const regional = ['dubai', 'singapore', 'bangkok', 'bali', 'colombo', 'kathmandu', 'dxb', 'sin', 'bkk'];
  if (regional.some(c => f.includes(c) || t.includes(c)))
    return Math.floor(Math.random() * 11000) + 11000;  // ₹11k–₹22k

  // Long domestic cross-country (2.5h+): BOM-CCU, DEL-MAA, BLR-DEL, etc. — ₹5,500–₹10,000
  const longPairs = [
    ['mumbai', 'kolkata'], ['delhi', 'chennai'], ['bangalore', 'delhi'],
    ['hyderabad', 'kolkata'], ['mumbai', 'guwahati'], ['delhi', 'kochi'],
    ['mumbai', 'srinagar'], ['chennai', 'amritsar'], ['kolkata', 'delhi'],
    ['bom', 'ccu'], ['del', 'maa'], ['blr', 'del'],
  ];
  if (longPairs.some(([a, b]) => (f.includes(a) && t.includes(b)) || (f.includes(b) && t.includes(a))))
    return Math.floor(Math.random() * 4500) + 5500;   // ₹5,500–₹10,000

  // Medium domestic metro routes (1.5–2.5h): BOM-DEL, DEL-BLR, BOM-MAA, HYD-DEL, etc. — ₹3,500–₹8,000
  const medPairs = [
    ['mumbai', 'delhi'], ['delhi', 'bangalore'], ['mumbai', 'chennai'],
    ['hyderabad', 'delhi'], ['pune', 'delhi'], ['ahmedabad', 'delhi'],
    ['mumbai', 'hyderabad'], ['kolkata', 'bangalore'], ['hyderabad', 'bangalore'],
    ['bom', 'del'], ['del', 'blr'], ['bom', 'maa'], ['hyd', 'del'],
  ];
  if (medPairs.some(([a, b]) => (f.includes(a) && t.includes(b)) || (f.includes(b) && t.includes(a))))
    return Math.floor(Math.random() * 4500) + 3500;   // ₹3,500–₹8,000

  // Short domestic nearby routes (<1.5h): BLR-MAA, BOM-GOI, DEL-JAI, etc. — ₹1,800–₹5,000
  return Math.floor(Math.random() * 3200) + 1800;     // ₹1,800–₹5,000
}

/**
 * REAL MARKET Date-based surge multiplier — mirrors actual airline dynamic pricing.
 *
 * How real airlines price tickets:
 *  - Book 60+ days early   → cheapest (early-bird fares, green dot)
 *  - Book 22–59 days ahead → normal/standard fares (green dot)
 *  - Book 8–21 days ahead  → moderate increase (yellow dot)
 *  - Book 3–7 days ahead   → significant increase (yellow/red dot)
 *  - Book 0–2 days ahead   → last-minute surge, but NOT always 2x
 *                            (unsold seats sometimes discounted, sometimes surged)
 *
 * Real multiplier examples (IndiGo BOM→DEL ₹3,500 base):
 *  🟢 60+ days:  ₹3,500  (1.00x  — cheapest, early bird)
 *  🟢 22–59 days: ₹3,800–₹4,500 (1.05–1.25x — standard advance)
 *  🟡 8–21 days:  ₹5,000–₹7,000 (1.30–1.80x — normal demand)
 *  🟡 3–7 days:   ₹7,000–₹10,000 (1.90–2.50x — high demand, near-term)
 *  🔴 0–2 days:   ₹9,000–₹14,000 (2.50–3.50x — last-minute surge)
 *
 *  🔴 Red   = most expensive (0–2 days)
 *  🟡 Yellow = moderately expensive (3–21 days)
 *  🟢 Green  = cheapest (22+ days)
 */
function getDateSurgeMultiplier(targetDate) {
  if (!targetDate) return 1.05;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Parse as local date (avoid UTC/IST timezone shift bug)
  const [y, m, d] = targetDate.split('-').map(Number);
  const travel = new Date(y, m - 1, d);
  const daysAhead = Math.floor((travel - today) / (1000 * 60 * 60 * 24));

  // 🔴 RED — Last-minute: +150–250% surge (real airlines charge 2.5–3.5x for last-minute)
  if (daysAhead <= 0) return 3.00 + Math.random() * 0.50; // today: +200–250% (seat scarcity)
  if (daysAhead <= 2) return 2.50 + Math.random() * 0.50; // 1–2 days: +150–200%

  // 🟡 YELLOW — Near-term: +30–150% (rising demand as travel approaches)
  if (daysAhead <= 4) return 1.90 + Math.random() * 0.40; // 3–4 days: +90–130%
  if (daysAhead <= 7) return 1.55 + Math.random() * 0.35; // 5–7 days: +55–90%
  if (daysAhead <= 14) return 1.30 + Math.random() * 0.20; // 1–2 weeks: +30–50%
  if (daysAhead <= 21) return 1.15 + Math.random() * 0.15; // 3 weeks: +15–30%

  // 🟢 GREEN — Advance booking: cheapest fares
  if (daysAhead <= 45) return 1.00 + Math.random() * 0.08; // 3–6 weeks: 0–8% above base
  if (daysAhead <= 60) return 0.95 + Math.random() * 0.07; // 6–8 weeks
  return 0.88 + Math.random() * 0.07;                       // 60+ days: early bird
}

/**
 * Dot color — perfectly aligned with surge tiers above.
 * Used by both the calendar UI and results display.
 *
 * Rules:
 *  🔴 Red    0–2 days ahead  → last-minute surge, starts ₹7k+
 *  🟡 Yellow 3–21 days ahead → medium price, starts ₹5–6k
 *  🟢 Green  22+ days ahead  → cheapest, starts ₹4k (max ₹12k domestic)
 *  🟢 Green  random scatter in 3–21 range → flash-deal days
 *
 * Past dates / today NEVER get a green dot — no flights on past dates.
 */
function getDateDotColor(targetDate) {
  if (!targetDate) return 'green';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [y, m, d] = targetDate.split('-').map(Number);
  const travel = new Date(y, m - 1, d);
  const daysAhead = Math.floor((travel - today) / (1000 * 60 * 60 * 24));

  // Past or today → red (expensive / unavailable)
  if (daysAhead <= 0) return 'red';
  if (daysAhead <= 2) return 'red';    // 🔴 1–2 days: last-minute surge

  // Yellow zone (3–21 days) — scatter random green "flash deal" dots
  if (daysAhead <= 21) {
    // Bit-mixing hash — thoroughly scrambles consecutive dates so dots appear
    // visually random, NOT sequential (plain LCG on y*10000+mo*100+d produces
    // almost identical outputs for adjacent days).
    let h = (d * 374761393 + m * 1073741827 + y * 2654435761) | 0;
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = (h ^ (h >>> 16)) >>> 0;
    const pseudo = h / 0xffffffff; // [0, 1)
    if (pseudo < 0.35) return 'green'; // ~35% random green flash deals (starts from day 3)
    return 'yellow'; // 🟡 standard yellow
  }

  return 'green'; // 🟢 22+ days: advance booking (cheapest)
}

function populateStopDetails(flight) {
  const getDurMins = (d) => {
    if (!d) return 120;
    const m = d.match(/\d+/g);
    return m ? (+m[0] * 60 + +(m[1] || 0)) : 120;
  };
  
  const formatMins = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const totalMins = getDurMins(flight.duration);
  const stopsStr = String(flight.stops || '').toLowerCase();
  const stopsCount = stopsStr.includes('direct') || stopsStr === '0' || stopsStr.includes('0') 
    ? 0 
    : (stopsStr.includes('1') || stopsStr === '1 stop' ? 1 : 2);

  const layoverCities = ['Mumbai (BOM)', 'Delhi (DEL)', 'Bangalore (BLR)', 'Chennai (MAA)', 'Hyderabad (HYD)', 'Pune (PNQ)', 'Kolkata (CCU)'];
  const fromCity = flight.from || '';
  const toCity = flight.to || '';
  const availableCities = layoverCities.filter(c => !c.toLowerCase().includes(fromCity.toLowerCase()) && !c.toLowerCase().includes(toCity.toLowerCase()));

  if (stopsCount === 0) {
    flight.layovers = [];
    flight.segmentDurations = [flight.duration];
  } else if (stopsCount === 1) {
    const layoverCity = availableCities[Math.floor(Math.random() * availableCities.length)] || 'Hyderabad (HYD)';
    const layoverMins = Math.min(Math.floor(totalMins * 0.3), 45 + Math.floor(Math.random() * 8) * 10); 
    const flyingMins = Math.max(60, totalMins - layoverMins);
    const seg1 = Math.floor(flyingMins * (0.45 + Math.random() * 0.1));
    const seg2 = flyingMins - seg1;

    flight.layover = { city: layoverCity, duration: formatMins(layoverMins) };
    flight.layovers = [{ city: layoverCity, duration: formatMins(layoverMins) }];
    flight.segmentDurations = [formatMins(seg1), formatMins(seg2)];
  } else {
    const lay1City = availableCities[Math.floor(Math.random() * availableCities.length)] || 'Hyderabad (HYD)';
    const remainingCities = availableCities.filter(c => c !== lay1City);
    const lay2City = remainingCities[Math.floor(Math.random() * remainingCities.length)] || 'Bangalore (BLR)';

    const lay1Mins = Math.min(Math.floor(totalMins * 0.15), 45 + Math.floor(Math.random() * 6) * 10);
    const lay2Mins = Math.min(Math.floor(totalMins * 0.15), 45 + Math.floor(Math.random() * 6) * 10);
    const flyingMins = Math.max(90, totalMins - lay1Mins - lay2Mins);
    const seg1 = Math.floor(flyingMins * 0.35);
    const seg2 = Math.floor(flyingMins * 0.3);
    const seg3 = flyingMins - seg1 - seg2;

    flight.layover = { city: lay1City, duration: formatMins(lay1Mins) };
    flight.layovers = [
      { city: lay1City, duration: formatMins(lay1Mins) },
      { city: lay2City, duration: formatMins(lay2Mins) }
    ];
    flight.segmentDurations = [formatMins(seg1), formatMins(seg2), formatMins(seg3)];
  }
}

function buildMockFlights(from, to, count = 12, targetDate = null, cabin = 'Economy') {
  const airlines = [
    { name: 'IndiGo', code: '6E', multiplier: 1.00 },
    { name: 'Air India', code: 'AI', multiplier: 1.18 },
    { name: 'Vistara', code: 'UK', multiplier: 1.30 },
    { name: 'SpiceJet', code: 'SG', multiplier: 0.92 },
    { name: 'Akasa Air', code: 'QP', multiplier: 0.95 },
    { name: 'Go First', code: 'G8', multiplier: 0.88 },
    { name: 'Alliance Air', code: '9I', multiplier: 1.05 },
    { name: 'Star Air', code: 'S5', multiplier: 0.97 },
  ];

  const basePrice = getBasePrice(from, to);
  const surgeMultiplier = getDateSurgeMultiplier(targetDate);
  const flights = [];

  for (let i = 0; i < count; i++) {
    const airline = airlines[i % airlines.length];
    const depHour = Math.floor(Math.random() * 18) + 4;
    const depMin = Math.floor(Math.random() * 12) * 5;

    /**
     * REAL MARKET: stop type & duration are decided FIRST, then price is derived.
     * Real airlines: direct fast flights cost MORE; slow/stop flights cost LESS.
     *
     * Stop distribution (realistic):
     *   ~65% Direct | ~28% 1 Stop | ~7% 2 Stops
     */
    const stopRoll = Math.random();
    const stopsLabel = stopRoll < 0.65 ? 'Direct' : stopRoll < 0.93 ? '1 Stop' : '2 Stops';

    let layover = null;
    if (stopsLabel === '1 Stop') {
      const layoverCities = ['Mumbai (BOM)', 'Delhi (DEL)', 'Bangalore (BLR)', 'Chennai (MAA)', 'Hyderabad (HYD)', 'Pune (PNQ)'];
      const availableCities = layoverCities.filter(c => !c.toLowerCase().includes(from.toLowerCase()) && !c.toLowerCase().includes(to.toLowerCase()));
      const layoverCity = availableCities[Math.floor(Math.random() * availableCities.length)] || 'Hyderabad (HYD)';
      const layoverHours = Math.floor(Math.random() * 2) + 1;
      const layoverMins = Math.floor(Math.random() * 6) * 10;
      layover = {
        city: layoverCity,
        duration: `${layoverHours}h ${layoverMins}m`
      };
    }

    // Duration is correlated with stops (stops add 1-3 extra hours)
    const baseDurHours = Math.floor(Math.random() * 2) + 1;  // 1-2h for direct
    const extraHours = stopsLabel === '2 Stops' ? 3 : stopsLabel === '1 Stop' ? 2 : 0;
    const durationHours = baseDurHours + extraHours;
    const durationMins = Math.floor(Math.random() * 12) * 5;
    const totalMins = durationHours * 60 + durationMins;

    /**
     * Speed premium — mirrors real airline pricing:
     *   Direct <90 min  → +25-35%  (very fast, premium seat)
     *   Direct 90-150m  → +12-20%  (standard direct)
     *   Direct 150m+    → +5-12%   (long direct)
     *   1 Stop          → -10-18%  (budget, slower)
     *   2 Stops         → -20-30%  (cheapest, very slow)
     */
    let speedMultiplier;
    if (stopsLabel === 'Direct') {
      if (totalMins <= 90) speedMultiplier = 1.28 + Math.random() * 0.10; // 1.28–1.38
      else if (totalMins <= 150) speedMultiplier = 1.12 + Math.random() * 0.08; // 1.12–1.20
      else speedMultiplier = 1.05 + Math.random() * 0.07; // 1.05–1.12
    } else if (stopsLabel === '1 Stop') {
      speedMultiplier = 0.82 + Math.random() * 0.08; // 0.82–0.90
    } else {
      speedMultiplier = 0.70 + Math.random() * 0.08; // 0.70–0.78
    }

    // Small random variance per seat
    const seatVariance = 1 + (Math.random() * 0.12) - 0.04; // -4% to +12%
    const price = Math.floor(basePrice * airline.multiplier * surgeMultiplier * speedMultiplier * seatVariance);

    let arrHour = depHour + durationHours;
    let arrMin = depMin + durationMins;
    if (arrMin >= 60) { arrHour += 1; arrMin -= 60; }
    arrHour = arrHour % 24;

    const fmt = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    const fl = {
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
      stops: stopsLabel,
      baggage: airline.name === 'Air India' || airline.name === 'Vistara' ? '23 kg' : '15 kg',
      meal: airline.name === 'Vistara' || airline.name === 'Air India' ? 'Included' : 'Standard',
      cabin
    };
    populateStopDetails(fl);
    flights.push(fl);
  }
  return flights;
}

function adjustFlightPrices(flights, from, to, targetDate, cabin = 'Economy') {
  if (!flights || flights.length === 0) return flights;

  const cabinMultipliers = {
    'Economy': 1.0,
    'Premium Economy': 1.35,
    'Business': 2.25,
    'First Class': 4.0
  };
  const cabinMultiplier = cabinMultipliers[cabin] || 1.0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = targetDate.split('-').map(Number);
  const travel = new Date(y, m - 1, d);
  const daysAhead = Math.floor((travel - today) / (1000 * 60 * 60 * 24));

  const f = from.toLowerCase();
  const t = to.toLowerCase();

  const longHaul = ['london', 'new york', 'paris', 'tokyo', 'lhr', 'jfk', 'cdg', 'nrt'];
  const regional = ['dubai', 'singapore', 'bangkok', 'bali', 'colombo', 'kathmandu', 'dxb', 'sin', 'bkk'];

  // 1. Categorize route to set location-based price offsets
  const longPairs = [
    ['mumbai', 'kolkata'], ['delhi', 'chennai'], ['bangalore', 'delhi'],
    ['hyderabad', 'kolkata'], ['mumbai', 'guwahati'], ['delhi', 'kochi'],
    ['mumbai', 'srinagar'], ['chennai', 'amritsar'], ['kolkata', 'delhi'],
    ['bom', 'ccu'], ['del', 'maa'], ['blr', 'del'],
  ];
  const medPairs = [
    ['mumbai', 'delhi'], ['delhi', 'bangalore'], ['mumbai', 'chennai'],
    ['hyderabad', 'delhi'], ['pune', 'delhi'], ['ahmedabad', 'delhi'],
    ['mumbai', 'hyderabad'], ['kolkata', 'bangalore'], ['hyderabad', 'bangalore'],
    ['bom', 'del'], ['del', 'blr'], ['bom', 'maa'], ['hyd', 'del'],
  ];

  let isLongDomestic = longPairs.some(([a, b]) => (f.includes(a) && t.includes(b)) || (f.includes(b) && t.includes(a)));
  let isMedDomestic = medPairs.some(([a, b]) => (f.includes(a) && t.includes(b)) || (f.includes(b) && t.includes(a)));

  // Location-based offsets — ONLY applied to the MAX (upper range widens for longer routes).
  // The MIN (floor) stays at baseMin for all domestic routes so green dates always start from ₹4,000.
  let locationMaxOffset = 0;

  if (isLongDomestic) {
    locationMaxOffset = 4000;
  } else if (isMedDomestic) {
    locationMaxOffset = 2000;
  }

  // 2. Determine base limits based on date dot color.
  // NOTE: baseMin is the hard floor — locationMaxOffset never touches it.
  let baseMin = 3000; // 🟢 Green dot starting price: ₹3,000 (ALL locations)
  let baseMax = 11000; // 🟢 Green dot max price: ₹11,000 domestic (wider for longer routes)

  if (daysAhead <= 0) {
    // Red dot: today/past — starts from ₹7k
    baseMin = 7000;
    baseMax = 25000;
  } else if (daysAhead <= 2) {
    // Red dot: last-minute 1–2 days — starts from ₹7k
    baseMin = 7000;
    baseMax = 22000;
  } else if (daysAhead <= 21) {
    // Yellow zone (3–21 days) — use same bit-mixing hash as getDateDotColor
    const dateY = Number(targetDate.split('-')[0]);
    const dateM = Number(targetDate.split('-')[1]);
    const dateD = Number(targetDate.split('-')[2]);
    let h = (dateD * 374761393 + dateM * 1073741827 + dateY * 2654435761) | 0;
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = (h ^ (h >>> 16)) >>> 0;
    const pseudo = h / 0xffffffff;
    if (pseudo < 0.35) {
      // Flash-deal green day: price same as advance green (₹3,000 floor)
      baseMin = 3000;
      baseMax = 11000;
    } else {
      // Standard yellow day: starts from ₹5,000
      baseMin = 5000;
      baseMax = 18000;
    }
  }

  // 3. Adjust bounds for international flights vs domestic locations
  let targetMinPrice;
  let targetMaxPrice;

  if (longHaul.some(c => f.includes(c) || t.includes(c))) {
    targetMinPrice = baseMin * 8.0;
    targetMaxPrice = baseMax * 7.5;
  } else if (regional.some(c => f.includes(c) || t.includes(c))) {
    targetMinPrice = baseMin * 3.0;
    targetMaxPrice = baseMax * 2.8;
  } else {
    // Domestic — min is always baseMin (no location offset on floor!)
    targetMinPrice = baseMin;
    targetMaxPrice = baseMax + locationMaxOffset; // only max gets wider for longer routes
  }

  targetMinPrice = targetMinPrice * cabinMultiplier;
  targetMaxPrice = targetMaxPrice * cabinMultiplier;

  // 3. For each flight, generate a raw price score incorporating seat availability and peak hours
  flights.forEach(flight => {
    // Set seatsLeft if not present (between 2 and 45)
    if (!flight.seatsLeft) {
      flight.seatsLeft = Math.floor(Math.random() * 44) + 2;
    }

    // Calculate seat availability surge (fewer seats = higher price)
    let seatMultiplier = 1.0;
    if (flight.seatsLeft <= 3) {
      seatMultiplier = 1.30 + Math.random() * 0.15; // 30% - 45% surge
    } else if (flight.seatsLeft <= 7) {
      seatMultiplier = 1.15 + Math.random() * 0.10; // 15% - 25% surge
    } else if (flight.seatsLeft <= 12) {
      seatMultiplier = 1.05 + Math.random() * 0.05; // 5% - 10% surge
    }

    // Calculate peak hour surge
    let timeMultiplier = 1.0;
    if (flight.dep) {
      const hour = parseInt(flight.dep.split(':')[0]);
      if (hour >= 7 && hour <= 9) {
        timeMultiplier = 1.15 + Math.random() * 0.08; // Morning rush hour
      } else if (hour >= 17 && hour <= 20) {
        timeMultiplier = 1.12 + Math.random() * 0.08; // Evening rush hour
      } else if (hour >= 0 && hour <= 4) {
        timeMultiplier = 0.85 + Math.random() * 0.05; // Late night discount
      }
    }

    // Combine factors
    flight.rawScore = flight.price * seatMultiplier * timeMultiplier;
  });

  // 4. Map the rawScore of flights to the target [targetMinPrice, targetMaxPrice] range
  const scores = flights.map(f => f.rawScore);
  const minRaw = Math.min(...scores);
  const maxRaw = Math.max(...scores);

  flights.forEach(flight => {
    let finalPrice = targetMinPrice;
    if (maxRaw > minRaw) {
      const normalized = (flight.rawScore - minRaw) / (maxRaw - minRaw);
      finalPrice = targetMinPrice + normalized * (targetMaxPrice - targetMinPrice);
    }

    // Apply a small random perturbation (+- 2%) for realism
    const variance = (Math.random() * 0.04) - 0.02; // -2% to +2%
    let priceValue = finalPrice * (1 + variance);

    // Round to nearest 50 and make it end in 99 for Skyscanner style
    priceValue = Math.round(priceValue / 50) * 50 - 1;

    // Safety checks — enforce hard minimums per dot color
    let hardMin = 3000; // green dot hard floor: ₹3,000 (ALL locations)
    if (daysAhead <= 2) hardMin = 7000;      // red dot floor ₹7k
    else if (daysAhead <= 21) {
      // Re-check if this is a flash-deal green day in the yellow zone
      const dateY = Number(targetDate.split('-')[0]);
      const dateM = Number(targetDate.split('-')[1]);
      const dateD = Number(targetDate.split('-')[2]);
      let hh = (dateD * 374761393 + dateM * 1073741827 + dateY * 2654435761) | 0;
      hh = Math.imul(hh ^ (hh >>> 16), 0x45d9f3b);
      hh = Math.imul(hh ^ (hh >>> 16), 0x45d9f3b);
      hh = (hh ^ (hh >>> 16)) >>> 0;
      hardMin = (hh / 0xffffffff) < 0.35 ? 3000 : 5000; // green flash=₹3k, yellow=₹5k
    }
    // Scale up hard minimums for international routes
    if (longHaul.some(c => f.includes(c) || t.includes(c))) hardMin = hardMin * 8;
    else if (regional.some(c => f.includes(c) || t.includes(c))) hardMin = hardMin * 3;
    
    hardMin = hardMin * cabinMultiplier;
    
    const safetyMin = Math.max(hardMin, targetMinPrice * 0.95);
    const safetyMax = targetMaxPrice * 1.05;
    flight.price = Math.max(Math.floor(safetyMin), Math.min(Math.floor(safetyMax), Math.floor(priceValue)));
  });

  return flights;
}

// GET /api/flights
router.get('/', async (req, res) => {
  const { from = 'Mumbai', to = 'Delhi', date, cabin = 'Economy' } = req.query;
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
        limit: '40'
      },
      headers: {
        'X-RapidAPI-Key': process.env.SKYSCANNER_RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'sky-scrapper.p.rapidapi.com'
      }
    });

    if (response.data && response.data.data && response.data.data.itineraries && response.data.data.itineraries.length > 0) {
      const apiFlights = response.data.data.itineraries.slice(0, 30).map((itin, index) => {
        const leg = itin.legs[0];
        const carrier = leg.carriers.marketing[0];
        const durMins = leg.durationInMinutes;
        const hrs = Math.floor(durMins / 60);
        const mins = durMins % 60;
        const flightItem = {
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
          meal: 'Standard',
          cabin
        };
        populateStopDetails(flightItem);
        return flightItem;
      });

      // Scale/adjust prices to match dot colors and the 4k minimum rule
      adjustFlightPrices(apiFlights, from, to, targetDate, cabin);

      // Compute filter summary prices
      const getDurMins = d => {
        if (!d) return 0;
        const m = d.match(/\d+/g);
        return m ? (+m[0] * 60 + +(m[1] || 0)) : 0;
      };
      const getStopsCount = stopsStr => {
        if (!stopsStr) return 0;
        const s = stopsStr.toLowerCase();
        if (s.includes('direct') || s.includes('0')) return 0;
        const match = s.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 1;
      };

      const byPrice = [...apiFlights].sort((a, b) => a.price - b.price);
      const bySpeed = [...apiFlights].sort((a, b) => getDurMins(a.duration) - getDurMins(b.duration));

      const cheapestPrice = byPrice[0]?.price;
      const hasDifferentPrices = apiFlights.some(f => f.price > cheapestPrice);

      const byBest = [...apiFlights].sort((a, b) => {
        const scoreA = a.price + getDurMins(a.duration) * 15 + getStopsCount(a.stops) * 2500 + (hasDifferentPrices && a.price === cheapestPrice ? 10000 : 0);
        const scoreB = b.price + getDurMins(b.duration) * 15 + getStopsCount(b.stops) * 2500 + (hasDifferentPrices && b.price === cheapestPrice ? 10000 : 0);
        return scoreA - scoreB;
      });

      // --- Date-distance discount for ALL filter tabs ---
      // More days ahead = lower prices (green < yellow < red)
      // Factor is applied to cheapest, fastest, and best prices shown in the filter tabs.
      const [fty, ftm, ftd] = targetDate.split('-').map(Number);
      const ftTravel = new Date(fty, ftm - 1, ftd);
      const ftToday = new Date(); ftToday.setHours(0, 0, 0, 0);
      const ftDaysAhead = Math.floor((ftTravel - ftToday) / (1000 * 60 * 60 * 24));

      // Discount factor: further date = bigger discount (prices decrease)
      let filterFactor;
      if (ftDaysAhead >= 60)      filterFactor = 0.72; // 🟢 60+ days: -28%
      else if (ftDaysAhead >= 45) filterFactor = 0.78; // 🟢 45-60 days: -22%
      else if (ftDaysAhead >= 22) filterFactor = 0.84; // 🟢 22-45 days: -16%
      else if (ftDaysAhead >= 14) filterFactor = 0.89; // 🟡 2 weeks: -11%
      else if (ftDaysAhead >= 7)  filterFactor = 0.93; // 🟡 1 week: -7%
      else if (ftDaysAhead >= 3)  filterFactor = 0.97; // 🟡 3-6 days: -3%
      else                        filterFactor = 1.00; // 🔴 0-2 days: no discount (full surge price)

      const applyFF = p => p != null ? Math.round(p * filterFactor) : p;

      // Apply the date-distance discount to the actual price of the fastest flights
      // so flight cards shown under "Fastest" filter reflect cheaper prices for further dates
      const fastestDurMins = getDurMins(bySpeed[0]?.duration);
      apiFlights.forEach(flight => {
        const durMins = getDurMins(flight.duration);
        // Apply discount to flights within 20 mins of the shortest duration (the "fastest" group)
        if (durMins <= fastestDurMins + 20) {
          flight.price = applyFF(flight.price);
        }
      });

      return res.json({
        success: true,
        count: apiFlights.length,
        from, to, date: targetDate,
        flights: apiFlights,
        filterPrices: {
          cheapest: applyFF(byPrice[0]?.price),
          fastest:  applyFF(bySpeed[0]?.price),
          best:     applyFF(byBest[0]?.price)
        },
        source: 'skyscanner-live'
      });
    }

    throw new Error('No itineraries from Skyscanner');

  } catch (error) {
    console.log('Skyscanner API Error:', error.message, '— using market-realistic fallback');

    const mockFlights = buildMockFlights(from, to, 30, targetDate, cabin);

    // Scale/adjust prices to match dot colors and the 4k minimum rule
    adjustFlightPrices(mockFlights, from, to, targetDate, cabin);

    const getDurMins = d => {
      if (!d) return 0;
      const m = d.match(/\d+/g);
      return m ? (+m[0] * 60 + +(m[1] || 0)) : 0;
    };
    const getStopsCount = stopsStr => {
      if (!stopsStr) return 0;
      const s = stopsStr.toLowerCase();
      if (s.includes('direct') || s.includes('0')) return 0;
      const match = s.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 1;
    };

    const byPrice = [...mockFlights].sort((a, b) => a.price - b.price);
    const bySpeed = [...mockFlights].sort((a, b) => getDurMins(a.duration) - getDurMins(b.duration));

    const cheapestPrice = byPrice[0]?.price;
    const hasDifferentPrices = mockFlights.some(f => f.price > cheapestPrice);

    const byBest = [...mockFlights].sort((a, b) => {
      const scoreA = a.price + getDurMins(a.duration) * 15 + getStopsCount(a.stops) * 2500 + (hasDifferentPrices && a.price === cheapestPrice ? 10000 : 0);
      const scoreB = b.price + getDurMins(b.duration) * 15 + getStopsCount(b.stops) * 2500 + (hasDifferentPrices && b.price === cheapestPrice ? 10000 : 0);
      return scoreA - scoreB;
    });

    // --- Date-distance discount for ALL filter tabs ---
    // More days ahead = lower prices (green < yellow < red)
    const [mty, mtm, mtd] = targetDate.split('-').map(Number);
    const mtTravel = new Date(mty, mtm - 1, mtd);
    const mtToday = new Date(); mtToday.setHours(0, 0, 0, 0);
    const mtDaysAhead = Math.floor((mtTravel - mtToday) / (1000 * 60 * 60 * 24));

    // Discount factor: further date = bigger discount (prices decrease)
    let filterFactor;
    if (mtDaysAhead >= 60)      filterFactor = 0.72; // 🟢 60+ days: -28%
    else if (mtDaysAhead >= 45) filterFactor = 0.78; // 🟢 45-60 days: -22%
    else if (mtDaysAhead >= 22) filterFactor = 0.84; // 🟢 22-45 days: -16%
    else if (mtDaysAhead >= 14) filterFactor = 0.89; // 🟡 2 weeks: -11%
    else if (mtDaysAhead >= 7)  filterFactor = 0.93; // 🟡 1 week: -7%
    else if (mtDaysAhead >= 3)  filterFactor = 0.97; // 🟡 3-6 days: -3%
    else                        filterFactor = 1.00; // 🔴 0-2 days: no discount (full surge price)

    const applyFF = p => p != null ? Math.round(p * filterFactor) : p;

    // Apply the date-distance discount to the actual price of the fastest flights
    // so flight cards shown under "Fastest" filter reflect cheaper prices for further dates
    const fastestDurMins = getDurMins(bySpeed[0]?.duration);
    mockFlights.forEach(flight => {
      const durMins = getDurMins(flight.duration);
      // Apply discount to flights within 20 mins of the shortest duration (the "fastest" group)
      if (durMins <= fastestDurMins + 20) {
        flight.price = applyFF(flight.price);
      }
    });

    return res.json({
      success: true,
      count: mockFlights.length,
      from, to, date: targetDate,
      flights: mockFlights,
      filterPrices: {
        cheapest: applyFF(byPrice[0]?.price),
        fastest:  applyFF(bySpeed[0]?.price),
        best:     applyFF(byBest[0]?.price)
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
      const cabin = leg.cabin || 'Economy';

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
          let layover = null;
          if (l.stopCount === 1) {
            layover = {
              city: 'Hyderabad (HYD)',
              duration: '1h 35m'
            };
          }
          const flightItem = {
            id: index + 1, airline: carrier.name, icon: '✈️',
            code: carrier.alternateId || carrier.displayCode || 'FL',
            from, to, price: Math.floor(itin.price.raw),
            dep: new Date(l.departure).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            arr: new Date(l.arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            duration: `${Math.floor(durMins / 60)}h ${durMins % 60}m`,
            stops: l.stopCount === 0 ? 'Direct' : `${l.stopCount} Stop${l.stopCount > 1 ? 's' : ''}`,
            baggage: '15 kg', meal: 'Standard',
            cabin
          };
          populateStopDetails(flightItem);
          return flightItem;
        });
        // Scale/adjust prices to match dot colors and the 4k minimum rule
        adjustFlightPrices(apiFlights, from, to, date, cabin);
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
      const cabin = leg.cabin || 'Economy';
      const flights = buildMockFlights(from, to, 20, date, cabin);
      adjustFlightPrices(flights, from, to, date, cabin);
      flights.sort((a, b) => a.price - b.price);
      const formattedFlights = flights.map((f, idx) => ({ ...f, id: idx + 1 }));
      return { leg: i + 1, from, to, date, flights: formattedFlights, source: 'market-proxy' };
    });

    return res.json({ success: true, type: 'multi-city', legs: results });
  }
});

module.exports = router;
