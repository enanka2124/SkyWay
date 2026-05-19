require('dotenv').config();
const axios = require('axios');

async function testKolkata() {
  const from = 'Kolkata';
  const to = 'Bangalore';
  const targetDate = '2026-05-18';
  
  async function getAirportDetails(cityName) {
    if (!cityName) return { skyId: 'BOM', entityId: '95673320' }; 
    const cleanName = cityName.split(',')[0].trim().toLowerCase();
    const common = {
      'mumbai': { skyId: 'BOM', entityId: '95673320' },
      'delhi': { skyId: 'DEL', entityId: '95673498' },
      'bangalore': { skyId: 'BLR', entityId: '95673436' },
      'chennai': { skyId: 'MAA', entityId: '95673479' },
      'kolkata': { skyId: 'CCU', entityId: '95673330' }
    };
    if (common[cleanName]) return common[cleanName];

    const res = await axios.request({
      method: 'GET',
      url: 'https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchAirport',
      params: { query: cleanName },
      headers: {
        'X-RapidAPI-Key': process.env.SKYSCANNER_RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'sky-scrapper.p.rapidapi.com'
      }
    });
    const best = res.data.data.find(d => d.navigation.entityType === 'AIRPORT') || res.data.data[0];
    return best.navigation.relevantFlightParams; 
  }

  try {
    const originParams = await getAirportDetails(from);
    const destinationParams = await getAirportDetails(to);

    console.log("Origin:", originParams);
    console.log("Dest:", destinationParams);

    const options = {
      method: 'GET',
      url: 'https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchFlights',
      params: {
        originSkyId: originParams.skyId,
        originEntityId: originParams.entityId,
        destinationSkyId: destinationParams.skyId,
        destinationEntityId: destinationParams.entityId,
        date: targetDate,
        adults: '1',
        currency: 'INR'
      },
      headers: {
        'X-RapidAPI-Key': process.env.SKYSCANNER_RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'sky-scrapper.p.rapidapi.com'
      }
    };

    const response = await axios.request(options);
    console.log("Status:", response.status);
    console.log("Itineraries:", response.data.data?.itineraries?.length);
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
  }
}
testKolkata();
