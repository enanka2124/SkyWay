const axios = require('axios');

async function testPrices() {
  const dates = [
    { label: 'Today (Red Dot)', date: '2026-05-19' },
    { label: 'Tomorrow (Red Dot)', date: '2026-05-20' },
    { label: 'Next Week (Yellow Dot)', date: '2026-05-26' },
    { label: 'Next Month (Green Dot)', date: '2026-06-20' }
  ];

  for (const item of dates) {
    try {
      const res = await axios.get(`http://localhost:5000/api/flights?from=Mumbai&to=Delhi&date=${item.date}`);
      console.log(`=== ${item.label} (${item.date}) ===`);
      console.log(`Source: ${res.data.source}`);
      console.log(`Filter Prices:`, res.data.filterPrices);
      
      const flights = res.data.flights;
      // Sort by price to check the cheapest one
      flights.sort((a,b) => a.price - b.price);
      console.log(`Cheapest Flight: ${flights[0].airline} (${flights[0].stops}) - ₹${flights[0].price}`);
      
      // Sort by duration to check the fastest one
      const getDurMins = d => { const [h,m] = d.match(/\d+/g); return +h*60 + +m; };
      flights.sort((a,b) => getDurMins(a.duration) - getDurMins(b.duration));
      console.log(`Fastest Flight: ${flights[0].airline} (${flights[0].stops}, ${flights[0].duration}) - ₹${flights[0].price}`);
      console.log();
    } catch (err) {
      console.error(`Error for ${item.label}:`, err.message);
    }
  }
}

testPrices();
