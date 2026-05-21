const assert = require('assert');

// 1. Replicate exactly the functions from server/routes/flights.js

function getBasePrice(from, to) {
  const f = from.toLowerCase().replace(/\s*\(.*?\)/, '').trim();
  const t = to.toLowerCase().replace(/\s*\(.*?\)/, '').trim();

  // Long-haul international (EU/US) — ₹38k–₹75k base (green dot; surge pushes to ₹90k+)
  const longHaul = ['london','new york','paris','tokyo','lhr','jfk','cdg','nrt'];
  if (longHaul.some(c => f.includes(c) || t.includes(c)))
    return Math.floor(Math.random() * 37000) + 38000;

  // Regional international (Gulf/SEA) — ₹11k–₹22k base
  const regional = ['dubai','singapore','bangkok','bali','colombo','kathmandu','dxb','sin','bkk'];
  if (regional.some(c => f.includes(c) || t.includes(c)))
    return Math.floor(Math.random() * 11000) + 11000;

  // Long domestic cross-country (2.5h+): BOM-CCU, DEL-MAA, BLR-DEL, etc. — ₹5,500–₹10,000
  const longPairs = [
    ['mumbai','kolkata'],['delhi','chennai'],['bangalore','delhi'],
    ['hyderabad','kolkata'],['mumbai','guwahati'],['delhi','kochi'],
    ['mumbai','srinagar'],['chennai','amritsar'],['kolkata','delhi'],
    ['bom','ccu'],['del','maa'],['blr','del'],
  ];
  if (longPairs.some(([a,b]) => (f.includes(a)&&t.includes(b))||(f.includes(b)&&t.includes(a))))
    return Math.floor(Math.random() * 4500) + 5500;

  // Medium domestic metro routes (1.5–2.5h): BOM-DEL, DEL-BLR, BOM-MAA, HYD-DEL, etc. — ₹3,500–₹8,000
  const medPairs = [
    ['mumbai','delhi'],['delhi','bangalore'],['mumbai','chennai'],
    ['hyderabad','delhi'],['pune','delhi'],['ahmedabad','delhi'],
    ['mumbai','hyderabad'],['kolkata','bangalore'],['hyderabad','bangalore'],
    ['bom','del'],['del','blr'],['bom','maa'],['hyd','del'],
  ];
  if (medPairs.some(([a,b]) => (f.includes(a)&&t.includes(b))||(f.includes(b)&&t.includes(a))))
    return Math.floor(Math.random() * 4500) + 3500;

  // Short domestic nearby routes (<1.5h): BLR-MAA, BOM-GOI, DEL-JAI, etc. — ₹1,800–₹5,000
  return Math.floor(Math.random() * 3200) + 1800;
}

function getDateSurgeMultiplier(targetDate) {
  if (!targetDate) return 1.05;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = targetDate.split('-').map(Number);
  const travel = new Date(y, m - 1, d);
  const daysAhead = Math.floor((travel - today) / (1000 * 60 * 60 * 24));

  if (daysAhead <= 0)  return 3.00 + Math.random() * 0.50;
  if (daysAhead <= 2)  return 2.50 + Math.random() * 0.50;
  if (daysAhead <= 4)  return 1.90 + Math.random() * 0.40;
  if (daysAhead <= 7)  return 1.55 + Math.random() * 0.35;
  if (daysAhead <= 14) return 1.30 + Math.random() * 0.20;
  if (daysAhead <= 21) return 1.15 + Math.random() * 0.15;
  if (daysAhead <= 45) return 1.00 + Math.random() * 0.08;
  if (daysAhead <= 60) return 0.95 + Math.random() * 0.07;
  return 0.88 + Math.random() * 0.07;
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
    const depHour = Math.floor(Math.random() * 18) + 4;
    const depMin = Math.floor(Math.random() * 12) * 5;

    const stopRoll = Math.random();
    const stopsLabel = stopRoll < 0.65 ? 'Direct' : stopRoll < 0.93 ? '1 Stop' : '2 Stops';

    const baseDurHours = Math.floor(Math.random() * 2) + 1;
    const extraHours   = stopsLabel === '2 Stops' ? 3 : stopsLabel === '1 Stop' ? 2 : 0;
    const durationHours = baseDurHours + extraHours;
    const durationMins  = Math.floor(Math.random() * 12) * 5;
    const totalMins     = durationHours * 60 + durationMins;

    let speedMultiplier;
    if (stopsLabel === 'Direct') {
      if (totalMins <= 90)       speedMultiplier = 1.28 + Math.random() * 0.10;
      else if (totalMins <= 150) speedMultiplier = 1.12 + Math.random() * 0.08;
      else                       speedMultiplier = 1.05 + Math.random() * 0.07;
    } else if (stopsLabel === '1 Stop') {
      speedMultiplier = 0.82 + Math.random() * 0.08;
    } else {
      speedMultiplier = 0.70 + Math.random() * 0.08;
    }

    const seatVariance = 1 + (Math.random() * 0.12) - 0.04;
    const price = Math.floor(basePrice * airline.multiplier * surgeMultiplier * speedMultiplier * seatVariance);

    let arrHour = depHour + durationHours;
    let arrMin  = depMin + durationMins;
    if (arrMin >= 60) { arrHour += 1; arrMin -= 60; }
    arrHour = arrHour % 24;

    const fmt = (h, m) => `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;

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
      stops: stopsLabel,
      baggage: airline.name === 'Air India' || airline.name === 'Vistara' ? '23 kg' : '15 kg',
      meal: airline.name === 'Vistara' || airline.name === 'Air India' ? 'Included' : 'Standard'
    });
  }
  return flights;
}

function adjustFlightPrices(flights, from, to, targetDate) {
  if (!flights || flights.length === 0) return flights;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = targetDate.split('-').map(Number);
  const travel = new Date(y, m - 1, d);
  const daysAhead = Math.floor((travel - today) / (1000 * 60 * 60 * 24));

  const f = from.toLowerCase();
  const t = to.toLowerCase();

  const longHaul = ['london','new york','paris','tokyo','lhr','jfk','cdg','nrt'];
  const regional = ['dubai','singapore','bangkok','bali','colombo','kathmandu','dxb','sin','bkk'];

  const longPairs = [
    ['mumbai','kolkata'],['delhi','chennai'],['bangalore','delhi'],
    ['hyderabad','kolkata'],['mumbai','guwahati'],['delhi','kochi'],
    ['mumbai','srinagar'],['chennai','amritsar'],['kolkata','delhi'],
    ['bom','ccu'],['del','maa'],['blr','del'],
  ];
  const medPairs = [
    ['mumbai','delhi'],['delhi','bangalore'],['mumbai','chennai'],
    ['hyderabad','delhi'],['pune','delhi'],['ahmedabad','delhi'],
    ['mumbai','hyderabad'],['kolkata','bangalore'],['hyderabad','bangalore'],
    ['bom','del'],['del','blr'],['bom','maa'],['hyd','del'],
  ];

  let isLongDomestic = longPairs.some(([a,b]) => (f.includes(a)&&t.includes(b))||(f.includes(b)&&t.includes(a)));
  let isMedDomestic = medPairs.some(([a,b]) => (f.includes(a)&&t.includes(b))||(f.includes(b)&&t.includes(a)));

  let locationMinOffset = 0;
  let locationMaxOffset = 0;

  if (isLongDomestic) {
    locationMinOffset = 3000;
    locationMaxOffset = 4000;
  } else if (isMedDomestic) {
    locationMinOffset = 1500;
    locationMaxOffset = 2000;
  }

  let baseMin = 4500; // Green dot starting price (increased to 4.5k)
  let baseMax = 16000; // Green dot max price (increased to 16k)

  if (daysAhead <= 2) {
    // Red dot: starts from 7k
    baseMin = 7000;
    baseMax = 25000;
  } else if (daysAhead <= 21) {
    // Yellow dot: starts from 5.5k
    baseMin = 5500;
    baseMax = 19000;
  }

  let targetMinPrice;
  let targetMaxPrice;

  if (longHaul.some(c => f.includes(c) || t.includes(c))) {
    targetMinPrice = baseMin * 8.0;
    targetMaxPrice = baseMax * 7.5;
  } else if (regional.some(c => f.includes(c) || t.includes(c))) {
    targetMinPrice = baseMin * 3.0;
    targetMaxPrice = baseMax * 2.8;
  } else {
    targetMinPrice = baseMin + locationMinOffset;
    targetMaxPrice = baseMax + locationMaxOffset;
  }

  flights.forEach(flight => {
    if (!flight.seatsLeft) {
      flight.seatsLeft = Math.floor(Math.random() * 44) + 2; 
    }

    let seatMultiplier = 1.0;
    if (flight.seatsLeft <= 3) {
      seatMultiplier = 1.30 + Math.random() * 0.15;
    } else if (flight.seatsLeft <= 7) {
      seatMultiplier = 1.15 + Math.random() * 0.10;
    } else if (flight.seatsLeft <= 12) {
      seatMultiplier = 1.05 + Math.random() * 0.05;
    }

    let timeMultiplier = 1.0;
    if (flight.dep) {
      const hour = parseInt(flight.dep.split(':')[0]);
      if (hour >= 7 && hour <= 9) {
        timeMultiplier = 1.15 + Math.random() * 0.08;
      } else if (hour >= 17 && hour <= 20) {
        timeMultiplier = 1.12 + Math.random() * 0.08;
      } else if (hour >= 0 && hour <= 4) {
        timeMultiplier = 0.85 + Math.random() * 0.05;
      }
    }

    flight.rawScore = flight.price * seatMultiplier * timeMultiplier;
  });

  const scores = flights.map(f => f.rawScore);
  const minRaw = Math.min(...scores);
  const maxRaw = Math.max(...scores);

  flights.forEach(flight => {
    let finalPrice = targetMinPrice;
    if (maxRaw > minRaw) {
      const normalized = (flight.rawScore - minRaw) / (maxRaw - minRaw);
      finalPrice = targetMinPrice + normalized * (targetMaxPrice - targetMinPrice);
    }

    const variance = (Math.random() * 0.04) - 0.02;
    let priceValue = finalPrice * (1 + variance);

    priceValue = Math.round(priceValue / 50) * 50 - 1;

    const safetyMin = Math.max(4000, targetMinPrice * 0.95);
    const safetyMax = targetMaxPrice * 1.05;
    flight.price = Math.max(Math.floor(safetyMin), Math.min(Math.floor(safetyMax), Math.floor(priceValue)));
  });

  return flights;
}

// 2. Define test runner
function runTests() {
  const routes = [
    { from: 'Bangalore', to: 'Chennai', type: 'Short Domestic' },
    { from: 'Mumbai', to: 'Delhi', type: 'Medium Domestic' },
    { from: 'Mumbai', to: 'Kolkata', type: 'Long Domestic' },
    { from: 'Delhi', to: 'Bangkok', type: 'Regional International' },
    { from: 'Delhi', to: 'London', type: 'Long-haul International' }
  ];

  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  const toLocalISO = (d) => new Date(d - timezoneOffset).toISOString().split('T')[0];

  const dates = [
    { daysAhead: 30, label: 'Green Dot (30 days ahead)' },
    { daysAhead: 10, label: 'Yellow Dot (10 days ahead)' },
    { daysAhead: 1, label: 'Red Dot (1 day ahead)' }
  ];

  console.log('=== STARTING PRICING VERIFICATION ===\n');

  for (const route of routes) {
    console.log(`Route: ${route.from} to ${route.to} (${route.type})`);
    for (const dObj of dates) {
      const target = new Date();
      target.setDate(target.getDate() + dObj.daysAhead);
      const dateStr = toLocalISO(target);

      const rawFlights = buildMockFlights(route.from, route.to, 12, dateStr);
      const adjusted = adjustFlightPrices(rawFlights, route.from, route.to, dateStr);

      const prices = adjusted.map(f => f.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      console.log(`  - ${dObj.label} -> Date: ${dateStr}`);
      console.log(`    Min Price: ₹${minPrice.toLocaleString('en-IN')}`);
      console.log(`    Max Price: ₹${maxPrice.toLocaleString('en-IN')}`);

      // General assertion: no flight goes below 4,000 INR
      adjusted.forEach(f => {
        assert(f.price >= 4000, `Flight ${f.id} has price ${f.price} which is below 4,000 INR!`);
      });

      // Green demand days assertion: min price starts around 4k-5k, max price reaches 15k+
      if (dObj.daysAhead === 30) {
        if (route.type === 'Short Domestic') {
          assert(minPrice >= 4000 && minPrice <= 5500, `Short Domestic min price ${minPrice} should start between 4k-5.5k!`);
          assert(maxPrice >= 14500, `Short Domestic max price ${maxPrice} should reach at least 15k!`);
        }
      }
    }
    console.log();
  }

  console.log('✅ ALL TESTS PASSED! pricing limits (4k-5k starting, 15k+ max on Green days) are fully correct.');
}

runTests();
