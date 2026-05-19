// Standalone verification script for the market algorithm
const getDurationMins = (durStr) => {
  const hours = parseInt(durStr?.match(/(\d+)h/)?.[1] || 0)
  const mins = parseInt(durStr?.match(/(\d+)m/)?.[1] || 0)
  return hours * 60 + mins
}

const getStopsCount = (stopsStr) => {
  if (!stopsStr) return 0
  const s = stopsStr.toLowerCase()
  if (s.includes('direct') || s.includes('0')) return 0
  const match = s.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 1
}

const sortFlights = (list, method) => {
  const arr = [...list]
  if (method === 'cheapest') {
    return arr.sort((a, b) => a.price - b.price)
  } else if (method === 'fastest') {
    return arr.sort((a, b) => getDurationMins(a.duration) - getDurationMins(b.duration))
  } else {
    const cheapest = arr.length ? Math.min(...arr.map(f => f.price)) : 0
    const hasDiff = arr.some(f => f.price > cheapest)
    const getScore = (f) => {
      let score = f.price + getDurationMins(f.duration) * 15 + getStopsCount(f.stops) * 2500
      if (hasDiff && f.price === cheapest) {
        score += 10000
      }
      return score
    }
    return arr.sort((a, b) => getScore(a) - getScore(b))
  }
}

// Mock flight data mirroring the screenshot and real output
const flights = [
  { id: 1, airline: 'SpiceJet', price: 4000, duration: '4h 35m', stops: '2 Stops' },
  { id: 2, airline: 'Alliance Air', price: 4898, duration: '4h 0m', stops: '1 Stop' },
  { id: 3, airline: 'Air India', price: 5672, duration: '3h 5m', stops: '1 Stop' },
  { id: 4, airline: 'IndiGo', price: 6343, duration: '2h 10m', stops: 'Direct' },
  { id: 5, airline: 'Vistara', price: 6899, duration: '2h 30m', stops: 'Direct' }
];

console.log("=== ORIGINAL FLIGHTS ===");
flights.forEach(f => console.log(`${f.airline}: Price=₹${f.price}, Duration=${f.duration}, Stops=${f.stops}`));

console.log("\n=== SORTED BY CHEAPEST ===");
const cheapestSorted = sortFlights(flights, 'cheapest');
cheapestSorted.forEach(f => console.log(`${f.airline}: Price=₹${f.price}, Duration=${f.duration}, Stops=${f.stops}`));
console.log("Tab Price for Cheapest:", cheapestSorted[0].price);

console.log("\n=== SORTED BY FASTEST ===");
const fastestSorted = sortFlights(flights, 'fastest');
fastestSorted.forEach(f => console.log(`${f.airline}: Price=₹${f.price}, Duration=${f.duration}, Stops=${f.stops}`));
console.log("Tab Price for Fastest:", fastestSorted[0].price);

console.log("\n=== SORTED BY BEST VALUE ===");
const bestSorted = sortFlights(flights, 'best');
bestSorted.forEach(f => {
  const cheapest = Math.min(...flights.map(fl => fl.price));
  const hasDiff = flights.some(fl => fl.price > cheapest);
  const score = f.price + getDurationMins(f.duration) * 15 + getStopsCount(f.stops) * 2500 + (hasDiff && f.price === cheapest ? 10000 : 0);
  console.log(`${f.airline}: Price=₹${f.price}, Duration=${f.duration}, Stops=${f.stops} (Value Score: ${score})`);
});
console.log("Tab Price for Best Value:", bestSorted[0].price);
