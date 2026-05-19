require('dotenv').config();
const axios = require('axios');

async function testHotels() {
  const destId = '-2092174';
  const destType = 'city';

  const hotelsRes = await axios.request({
    method: 'GET',
    url: 'https://booking-com15.p.rapidapi.com/api/v1/hotels/searchHotels',
    params: {
      dest_id: destId,
      search_type: destType,
      arrival_date: '2026-05-20',
      departure_date: '2026-05-25',
      adults: '1',
      room_qty: '1',
      page_number: '1'
    },
    headers: {
      'X-RapidAPI-Key': process.env.SKYSCANNER_RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'booking-com15.p.rapidapi.com'
    }
  });
  const hotel = hotelsRes.data.data.hotels[0];
  console.log("Price structure:", JSON.stringify(hotel.property.priceBreakdown, null, 2));
}
testHotels();
