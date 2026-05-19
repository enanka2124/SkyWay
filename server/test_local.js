const axios = require('axios');

async function testLocal() {
  try {
    const res = await axios.get('http://localhost:5000/api/flights?from=Kolkata&to=Bangalore&date=2026-05-18');
    console.log("Status:", res.status);
    console.log("Flights:", res.data.flights.length);
    if(res.data.flights.length > 0) {
      console.log("First flight from:", res.data.flights[0].from);
      console.log("First flight to:", res.data.flights[0].to);
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}
testLocal();
