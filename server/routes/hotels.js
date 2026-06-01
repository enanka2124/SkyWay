const express = require('express');
const router = express.Router();
const axios = require('axios');

const popularCities = [
  'Mumbai', 'Goa', 'Delhi', 'Bangalore', 'Chennai', 'Dubai', 'Jaipur', 'Kolkata', 'Hyderabad', 'Udaipur', 'Kerala', 'Manali', 'Singapore', 'Bangkok'
];

// In-memory bookings store
const hotelBookings = [];

// ---------------------------------------------------------------------------
// Mock hotel generator — realistic Indian + international hotel data
// Returns a full set of hotels for any city when the external API is down.
// ---------------------------------------------------------------------------
// City-specific hotel name banks — each city gets its OWN unique names
const CITY_HOTEL_BANKS = {
  mumbai:    ['Sea View Grand', 'Bandra Boutique', 'Marine Drive Suites', 'Juhu Beach Resort', 'Gateway Towers', 'Colaba Heritage Inn', 'Nariman Residency', 'Andheri Business Hotel', 'Powai Lake Retreat', 'Worli Skyline Hotel', 'Taj Mahal Heights', 'Lower Parel Loft', 'Versova Sands', 'Kurla Connect Inn', 'Chembur Royal'],
  goa:       ['Calangute Palms', 'Baga Beach Resort', 'Anjuna Cove Inn', 'Panjim Heritage', 'Dona Paula Suites', 'Vagator Cliffs Hotel', 'Arambol Sunrise', 'Candolim Retreat', 'Colva Sands Hotel', 'Majorda Shores', 'Morjim Nest', 'Chapora Fort Inn', 'Mandrem Pearl', 'Siolim Riverside', 'Old Goa Villas'],
  delhi:     ['Connaught Place Suites', 'Hauz Khas Village Inn', 'Lodi Garden Retreat', 'Karol Bagh Hotel', 'Aerocity Gateway', 'CP Heritage Residency', 'South Ex Towers', 'Janpath Grand', 'Paharganj Budget Palace', 'Chanakyapuri Diplomat', 'Safdarjung Boutique', 'Vasant Vihar Suites', 'Mehrauli Heritage Stay', 'Saket Premium Inn', 'Dilli Haat Hotel'],
  bangalore: ['Indiranagar Loft', 'Koramangala Suites', 'MG Road Grand', 'Whitefield Tech Hotel', 'Electronic City Inn', 'Cubbon Park Retreat', 'UB City Towers', 'Jayanagar Heritage', 'JP Nagar Residency', 'Sarjapur Boutique', 'Marathahalli Express', 'HSR Layout Hotel', 'Bannerghatta Resort', 'Rajajinagar Classic', 'Malleswaram Plaza'],
  chennai:   ['Marina Sands', 'Adyar Residency', 'T Nagar Grand', 'Besant Nagar Retreat', 'ECR Beach Resort', 'Anna Salai Suites', 'Nungambakkam Towers', 'Mylapore Heritage Inn', 'OMR Tech Hotel', 'Velachery Comforts', 'Guindy Express', 'Porur Boutique', 'Tambaram Inn', 'Alwarpet Elite', 'Perungudi Stay'],
  dubai:     ['Burj View Suites', 'JBR Beach Hotel', 'Downtown Dubai Grand', 'Dubai Marina Towers', 'Deira Heritage Inn', 'Palm Atlantis Retreat', 'DIFC Business Hotel', 'Gold Souk Residency', 'Dubai Creek Resort', 'Jumeirah Sands', 'Business Bay Elite', 'Al Barsha Boutique', 'Karama Budget Inn', 'Silicon Oasis Hotel', 'Satwa Classic'],
  jaipur:    ['Pink City Palace', 'Amer Fort Inn', 'Hawa Mahal Suites', 'Nahargarh Retreat', 'C-Scheme Grand', 'Johari Bazaar Hotel', 'Bani Park Heritage', 'Malviya Nagar Boutique', 'Vaishali Nagar Residency', 'Civil Lines Towers', 'MI Road Classic', 'Sodala Comforts', 'Sanganer Resort', 'Gandhinagar Inn', 'Raja Park Stay'],
  kolkata:   ['Park Street Suites', 'Howrah Bridge Inn', 'Esplanade Grand', 'Salt Lake Towers', 'New Town Boutique', 'Ballygunge Residency', 'Gariahat Heritage', 'Tollygunge Retreat', 'Alipore Elite Hotel', 'Jadavpur Classic', 'Dum Dum Airport Inn', 'Rajarhat Tech Hotel', 'Behala Budget Stay', 'Golpark Comforts', 'Rashbehari Express'],
  hyderabad: ['HITEC City Suites', 'Banjara Hills Grand', 'Jubilee Hills Retreat', 'Charminar Heritage Inn', 'Gachibowli Tech Hotel', 'Secunderabad Residency', 'Begumpet Boutique', 'Kondapur Towers', 'Madhapur Classic', 'Dilsukhnagar Express', 'Kukatpally Business Inn', 'Ameerpet Comforts', 'SR Nagar Stay', 'Uppal Budget Hotel', 'Mehdipatnam Heritage'],
  udaipur:   ['Lake Pichola Suites', 'City Palace Inn', 'Fateh Sagar Resort', 'Sajjangarh Retreat', 'Ambrai Ghat Heritage', 'Bagore Ki Haveli Hotel', 'Shilpgram Boutique', 'Chetak Circle Grand', 'Sukhadia Circle Inn', 'Bhuwana Countryside', 'Badi Lake Villas', 'Hiran Magri Residency', 'Saheliyon Ki Bari Stay', 'Jagmandir Island Hotel', 'Gangaur Ghat Retreat'],
  kerala:    ['Backwaters Houseboat', 'Munnar Tea Estate', 'Alleppey Palms Resort', 'Kovalam Beach Inn', 'Thekkady Spice Hotel', 'Kumarakom Lake Retreat', 'Wayanad Forest Lodge', 'Varkala Cliff Suites', 'Fort Kochi Heritage', 'Thrissur Grand Hotel', 'Calicut Beachfront', 'Trivandrum Residency', 'Kozhikode Classic', 'Alappuzha Boathouse', 'Palakkad Nature Inn'],
  manali:    ['Snow Peak Cottages', 'Beas River Resort', 'Mall Road Inn', 'Vashisht Hot Springs', 'Solang Valley Lodge', 'Rohtang View Hotel', 'Old Manali Boutique', 'Hadimba Forest Retreat', 'Kullu Riverside Inn', 'Club House Suites', 'Prini Hillside Hotel', 'Nehru Kund Comforts', 'Aleo Village Stay', 'Dhungri Eco Lodge', 'Jagatsukh Heritage'],
  singapore: ['Marina Bay Suites', 'Orchard Road Grand', 'Sentosa Island Resort', 'Chinatown Heritage Inn', 'Clarke Quay Hotel', 'Little India Boutique', 'Bugis Street Towers', 'Jurong Lake Retreat', 'Changi Airport Inn', 'Raffles Place Elite', 'Tanjong Pagar Hotel', 'Queenstown Residency', 'Tampines Classic', 'Woodlands Express', 'Ang Mo Kio Inn'],
  bangkok:   ['Sukhumvit Suites', 'Silom Grand Hotel', 'Khao San Retreat', 'Riverside Bangkok', 'Asok Business Inn', 'Chatuchak Boutique', 'Pratunam Towers', 'Siam Square Hotel', 'Lumpini Park Suites', 'On Nut Classic', 'Nana Heritage Inn', 'Thonglor Elite', 'Ekkamai Residency', 'Victory Monument Hotel', 'Mo Chit Express'],
  london:    ['Mayfair Classic', 'Covent Garden Inn', 'Kensington Suites', 'Shoreditch Boutique', 'Canary Wharf Towers', 'Hyde Park Retreat', 'Camden Heritage Hotel', 'Soho Grand', 'Westminster Residency', 'Notting Hill Inn', 'Greenwich Riverside', 'Brixton Boutique', 'Angel Classic Stay', 'Fitzrovia Suites', 'Bloomsbury Heritage'],
  paris:     ['Montmartre Boutique', 'Marais Heritage Inn', 'Eiffel View Suites', 'Champs-Elysées Grand', 'Saint-Germain Hotel', 'Opera Quarter Inn', 'Bastille Retreat', 'Pigalle Classic', 'Louvre Side Suites', 'République Towers', 'Belleville Boutique', 'Nation Residency', 'Oberkampf Express', 'Vincennes Forest Inn', 'Bercy Village Hotel'],
  'new york': ['Times Square Inn', 'Brooklyn Heights Hotel', 'Midtown Grand Suites', 'SoHo Boutique', 'Upper East Side Classic', 'Harlem Heritage Inn', 'Financial District Towers', 'Chelsea Art Hotel', 'Greenwich Village Retreat', 'Queens Express Inn', 'Bronx Residency', 'Staten Island Suites', 'Hell\'s Kitchen Hotel', 'Tribeca Loft', 'Williamsburg Boutique'],
  tokyo:     ['Shinjuku Suites', 'Shibuya Boutique', 'Asakusa Heritage Inn', 'Akihabara Tech Hotel', 'Ginza Grand', 'Harajuku Style Inn', 'Ueno Park Retreat', 'Roppongi Towers', 'Ikebukuro Express', 'Odaiba Bay Hotel', 'Kabukicho Classic', 'Yanaka Heritage', 'Nakameguro Suites', 'Koenji Boutique', 'Shimokitazawa Inn'],
  bali:      ['Seminyak Villas', 'Ubud Jungle Retreat', 'Kuta Beach Resort', 'Nusa Dua Grand', 'Canggu Boutique', 'Uluwatu Cliff Hotel', 'Sanur Heritage Inn', 'Denpasar Classic', 'Legian Beachfront', 'Jimbaran Bay Suites', 'Lovina Beach Resort', 'Munduk Mountain Lodge', 'Amed Dive Inn', 'Pemuteran Eco Resort', 'Gianyar Rice Field Hotel'],
};

// Seeded pseudo-random number generator (Mulberry32)
// Returns consistent values for the same city — so hotels don't change on every refresh
function seedRandom(seed) {
  let s = seed;
  return function () {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function cityToSeed(city) {
  // Convert city name to a numeric seed so the same city always produces the same hotels
  return city.toLowerCase().split('').reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 0) >>> 0;
}

const AMENITIES_POOL = [
  'Free WiFi', 'Air Conditioning', 'Room Service', 'Swimming Pool', 'Spa & Wellness',
  'Gym / Fitness Center', 'Restaurant', 'Bar & Lounge', 'Parking', 'Airport Shuttle',
  'Breakfast Included', 'Rooftop Terrace', 'Business Center', 'Kids Play Area', 'Concierge'
];

// City-to-image map for realistic hotel images
const CITY_IMAGES = {
  mumbai:      ['https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=600&q=80', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80', 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=80'],
  goa:         ['https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80', 'https://images.unsplash.com/photo-1614082242765-7c98ca0f3df3?w=600&q=80', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80'],
  delhi:       ['https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=600&q=80', 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=80', 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&q=80'],
  bangalore:   ['https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600&q=80', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80'],
  chennai:     ['https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&q=80', 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&q=80', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80'],
  dubai:       ['https://images.unsplash.com/photo-1518684079-3c830dcef090?w=600&q=80', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80', 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=80'],
  jaipur:      ['https://images.unsplash.com/photo-1477587458883-47145ed31459?w=600&q=80', 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&q=80', 'https://images.unsplash.com/photo-1568154270759-c26e6f86c7c8?w=600&q=80'],
  kolkata:     ['https://images.unsplash.com/photo-1558431382-27e303142255?w=600&q=80', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80'],
  hyderabad:   ['https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?w=600&q=80', 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=80', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80'],
  udaipur:     ['https://images.unsplash.com/photo-1568154270759-c26e6f86c7c8?w=600&q=80', 'https://images.unsplash.com/photo-1477587458883-47145ed31459?w=600&q=80', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80'],
  kerala:      ['https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&q=80', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80'],
  kochi:       ['https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&q=80', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80', 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=80'],
  manali:      ['https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80'],
  singapore:   ['https://images.unsplash.com/photo-1565967511849-76a60a516170?w=600&q=80', 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&q=80', 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=80'],
  bangkok:     ['https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&q=80', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80', 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=80'],
  london:      ['https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=600&q=80', 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=80', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80'],
  paris:       ['https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80', 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=80'],
  'new york':  ['https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=600&q=80', 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=80', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80'],
  tokyo:       ['https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80', 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=80', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80'],
  bali:        ['https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80', 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=80', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80'],
  default:     ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80', 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=80', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80'],
};

// Price ranges per city tier (INR per room per night)
function getBasePriceRange(city) {
  const c = city.toLowerCase();
  // International premium cities
  if (['london', 'new york', 'paris', 'tokyo', 'singapore'].some(x => c.includes(x)))
    return { min: 9000, max: 32000 };
  // Gulf / SEA
  if (['dubai', 'bangkok', 'bali', 'colombo', 'kathmandu'].some(x => c.includes(x)))
    return { min: 4500, max: 18000 };
  // Tier-1 Indian metros
  if (['mumbai', 'delhi', 'bangalore', 'hyderabad', 'chennai'].some(x => c.includes(x)))
    return { min: 1800, max: 10000 };
  // Tier-2 Indian cities
  if (['goa', 'jaipur', 'kolkata', 'kochi', 'kerala', 'udaipur', 'manali'].some(x => c.includes(x)))
    return { min: 1200, max: 7000 };
  // Tier-3 / everything else
  return { min: 800, max: 5000 };
}

function getRandomAmenities(count = 6) {
  const shuffled = [...AMENITIES_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function buildMockHotels(city, count = 15) {
  const cityKey = city.toLowerCase();
  const images   = CITY_IMAGES[cityKey] || CITY_IMAGES['default'];
  const { min, max } = getBasePriceRange(city);

  // Use seeded RNG — same city always returns the SAME hotels, different cities differ
  const rand  = seedRandom(cityToSeed(city));
  const names = CITY_HOTEL_BANKS[cityKey] || [];
  const hotels = [];

  for (let i = 0; i < count; i++) {
    const stars = Math.floor(rand() * 3) + 3; // 3–5 stars, consistent per city

    // Use city-specific name if available, otherwise build a unique generic one
    const name = names[i]
      ? names[i]
      : `Hotel ${city} ${String.fromCharCode(65 + i)}`; // e.g. "Hotel Pune A"

    // 5-star hotels cost more — prices are stable per city
    const starMultiplier = stars === 5 ? 1.6 : stars === 4 ? 1.2 : 1.0;
    const price = Math.floor((min + rand() * (max - min)) * starMultiplier);

    const rating  = parseFloat((3.5 + rand() * 1.5).toFixed(1)); // 3.5–5.0
    const reviews = Math.floor(rand() * 2000) + 100;
    const image   = images[i % images.length];

    hotels.push({
      id:        `${cityKey}-${i + 1}`,  // unique ID per city
      name,
      city,
      stars,
      price,
      image,
      amenities: getRandomAmenities(Math.floor(rand() * 4) + 4), // 4–7 amenities
      rating,
      reviews,
    });
  }

  // Sort by price ASCENDING — cheapest first as the user expects
  return hotels.sort((a, b) => a.price - b.price);
}

// GET /api/hotels?city=&checkin=&checkout=&guests=
router.get('/', async (req, res) => {
  const { city = 'Mumbai', checkin, checkout, guests = 1 } = req.query;

  // Default dates
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const checkinDate  = checkin  || today.toISOString().split('T')[0];
  const checkoutDate = checkout || tomorrow.toISOString().split('T')[0];

  // Try live Booking.com API first
  if (process.env.SKYSCANNER_RAPIDAPI_KEY) {
    try {
      // 1. Get destination ID
      const locRes = await axios.request({
        method: 'GET',
        url: 'https://booking-com15.p.rapidapi.com/api/v1/hotels/searchDestination',
        params: { query: city },
        headers: {
          'X-RapidAPI-Key': process.env.SKYSCANNER_RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'booking-com15.p.rapidapi.com'
        }
      });

      const locations = locRes.data?.data || [];
      if (locations.length > 0) {
        const dest = locations.find(l => l.search_type === 'city') || locations[0];
        const dest_id   = dest.dest_id;
        const dest_type = dest.search_type;

        // 2. Search Hotels
        const searchRes = await axios.request({
          method: 'GET',
          url: 'https://booking-com15.p.rapidapi.com/api/v1/hotels/searchHotels',
          params: {
            dest_id,
            search_type: dest_type,
            arrival_date:   checkinDate,
            departure_date: checkoutDate,
            adults:   guests,
            room_qty: '1',
            page_number: '1'
          },
          headers: {
            'X-RapidAPI-Key': process.env.SKYSCANNER_RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'booking-com15.p.rapidapi.com'
          }
        });

        const apiHotels = searchRes.data?.data?.hotels || [];
        if (apiHotels.length > 0) {
          const results = apiHotels.slice(0, 15).map((h, i) => {
            const prop = h.property || {};
            const priceUSD = prop.priceBreakdown?.grossPrice?.value || (Math.random() * 60 + 20);
            return {
              id: h.hotel_id || prop.id || i + 1,
              name:      prop.name || 'Unknown Hotel',
              city,
              stars:     prop.propertyClass || Math.floor(Math.random() * 2) + 3,
              price:     Math.floor(priceUSD * 62),
              image:     (prop.photoUrls && prop.photoUrls.length > 0)
                           ? prop.photoUrls[0]
                           : (CITY_IMAGES[city.toLowerCase()] || CITY_IMAGES['default'])[0],
              amenities: ['Free WiFi', 'Air Conditioning', 'Room Service'],
              rating:    prop.reviewScore   || parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
              reviews:   prop.reviewCount   || Math.floor(Math.random() * 500 + 50),
            };
          });
          return res.json({ success: true, count: results.length, hotels: results, city, checkin: checkinDate, checkout: checkoutDate, guests: Number(guests), source: 'booking-live' });
        }
      }
      // Fall through to mock if API returned 0 results
      console.log('Booking.com returned 0 hotels — using mock fallback for:', city);
    } catch (err) {
      console.log('Booking.com API error:', err.response?.data?.message || err.message, '— using mock fallback');
    }
  } else {
    console.log('No RapidAPI key — using mock hotel fallback');
  }

  // -------------------------------------------------------------------------
  // Mock fallback — always returns realistic hotels for any city
  // -------------------------------------------------------------------------
  const mockHotels = buildMockHotels(city, 15);
  return res.json({
    success: true,
    count: mockHotels.length,
    hotels: mockHotels,
    city,
    checkin: checkinDate,
    checkout: checkoutDate,
    guests: Number(guests),
    source: 'market-proxy'
  });
});

// GET /api/hotels/cities
router.get('/cities', (req, res) => {
  res.json({ success: true, cities: popularCities });
});

// POST /api/hotels/book
router.post('/book', (req, res) => {
  const { hotel, checkin, checkout, guests, firstName, lastName, email } = req.body;
  if (!firstName || !lastName || !email || !hotel) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const nights    = checkin && checkout
    ? Math.max(1, Math.ceil((new Date(checkout) - new Date(checkin)) / 86400000))
    : 1;
  const bookingId = 'HTL' + Math.random().toString(36).substr(2, 8).toUpperCase();

  const booking = {
    bookingId,
    hotel:  { name: hotel.name, city: hotel.city, stars: hotel.stars, image: hotel.image },
    guest:  { firstName, lastName, email },
    checkin, checkout, nights, guests,
    totalPrice: hotel.price * nights,
    bookedAt:   new Date().toISOString(),
  };

  hotelBookings.push(booking);
  res.status(201).json({ success: true, bookingId, booking });
});

// GET /api/hotels/bookings
router.get('/bookings', (req, res) => {
  res.json({ success: true, bookings: hotelBookings });
});

module.exports = router;
