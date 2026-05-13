const fs = require('fs');

const newCities = [
  'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara', 'Ludhiana', 'Agra', 'Nashik', 'Rajkot', 'Varanasi', 'Srinagar', 'Aurangabad', 'Amritsar', 'Allahabad', 'Ranchi', 'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur', 'Kota', 'Guwahati', 'Chandigarh', 'Mysore', 'Tiruchirappalli', 'Bhubaneswar', 'Thiruvananthapuram', 'Kochi', 'Dehradun', 'Mangalore', 'Tirupati'
];

const images = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80',
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&q=80',
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80',
  'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&q=80',
  'https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?w=400&q=80',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80',
  'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400&q=80',
  'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400&q=80',
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&q=80',
  'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&q=80',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&q=80',
  'https://images.unsplash.com/photo-1455587734955-081b22074882?w=400&q=80',
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80',
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&q=80',
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&q=80',
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&q=80',
  'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=400&q=80',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&q=80',
  'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=400&q=80',
  'https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?w=400&q=80',
  'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80',
  'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80',
  'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400&q=80',
  'https://images.unsplash.com/photo-1600011689032-8b628b8a8747?w=400&q=80',
];

// 1. UPDATE HOTELS.JS
let hotelsContent = fs.readFileSync('server/routes/hotels.js', 'utf8');

let newHotels = '';
let hotelId = 200;
let newCityImages = '';

newCities.forEach((city, i) => {
  const img1 = images[i % images.length];
  const img2 = images[(i + 1) % images.length];
  newHotels += `
  // 
  { id: ${hotelId++}, name: '${city} Grand Suites', city: '${city}', stars: 5, price: 8499, image: '${img1}', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: ${hotelId++}, name: '${city} Budget Stay', city: '${city}', stars: 3, price: 2999, image: '${img2}', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },`;
  
  newCityImages += `  '${city}': '${img1}',\n`;
});

hotelsContent = hotelsContent.replace(/\];\s*const hotelBookings = \[\];/, newHotels + '\n];\n\nconst hotelBookings = [];');
hotelsContent = hotelsContent.replace(/  'Bali': '.*?'\n};/, "  'Bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80',\n" + newCityImages.replace(/,\n$/, '\n') + '};');

fs.writeFileSync('server/routes/hotels.js', hotelsContent);

// 2. UPDATE FLIGHTS.JS
let flightsContent = fs.readFileSync('server/routes/flights.js', 'utf8');

let newRoutes = '';
let flightId = 30;

newCities.forEach((city, i) => {
  const img = images[i % images.length];
  const toCity = i % 2 === 0 ? 'Delhi' : 'Mumbai';
  const toCode = i % 2 === 0 ? 'DEL' : 'BOM';
  const code = city.substring(0, 3).toUpperCase();
  newRoutes += `  { id: ${flightId++}, from: '${city}', fromCode: '${code}', to: '${toCity}', toCode: '${toCode}', price: ${2499 + (i * 100)}, duration: '2h 10m', stops: 'Direct', image: '${img}' },\n`;
});

flightsContent = flightsContent.replace(/  { id: 25, from: 'Kolkata'.*\n\];/, "  { id: 25, from: 'Kolkata', fromCode: 'CCU', to: 'Kathmandu', toCode: 'KTM', price: 7999, duration: '1h 45m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1581403067825-7bdf9c6e5c9b?w=400&q=80' },\n" + newRoutes + '];');

fs.writeFileSync('server/routes/flights.js', flightsContent);

// 3. UPDATE MYTRIPS.JSX
let myTripsContent = fs.readFileSync('client/src/pages/MyTrips.jsx', 'utf8');

myTripsContent = myTripsContent.replace(/  'Kathmandu': '.*?'\n};/, "  'Kathmandu': 'https://images.unsplash.com/photo-1581403067825-7bdf9c6e5c9b?w=400&q=80',\n" + newCityImages.replace(/,\n$/, '\n') + '};');

fs.writeFileSync('client/src/pages/MyTrips.jsx', myTripsContent);

console.log('Successfully updated cities');
