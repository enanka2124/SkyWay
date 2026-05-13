const express = require('express');
const router = express.Router();

const mockHotels = [
  // 
  { id: 1, name: 'The Grand Palace', city: 'Mumbai', stars: 5, price: 8999, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant'], rating: 4.8, reviews: 2340 },
  { id: 2, name: 'Skyline Suites', city: 'Mumbai', stars: 4, price: 5499, image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80', amenities: ['WiFi', 'Gym', 'Restaurant', 'Parking'], rating: 4.5, reviews: 1280 },
  { id: 3, name: 'Marine Drive Inn', city: 'Mumbai', stars: 3, price: 3499, image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&q=80', amenities: ['WiFi', 'Restaurant', 'Parking'], rating: 4.2, reviews: 960 },
  { id: 43, name: 'Taj Colaba Heritage', city: 'Mumbai', stars: 5, price: 15999, image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Sea View', 'Restaurant'], rating: 4.9, reviews: 4100 },
  { id: 44, name: 'Juhu Beach Retreat', city: 'Mumbai', stars: 4, price: 7999, image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&q=80', amenities: ['WiFi', 'Pool', 'Beach Access', 'Bar'], rating: 4.6, reviews: 1850 },
  { id: 45, name: 'Andheri Hub Budget', city: 'Mumbai', stars: 2, price: 1999, image: 'https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?w=400&q=80', amenities: ['WiFi', 'Air Conditioning'], rating: 3.8, reviews: 420 },

  // 
  { id: 4, name: 'Ocean Breeze Resort', city: 'Goa', stars: 5, price: 12999, image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80', amenities: ['WiFi', 'Pool', 'Beach Access', 'Spa', 'Bar'], rating: 4.9, reviews: 3100 },
  { id: 5, name: 'Palm View Inn', city: 'Goa', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400&q=80', amenities: ['WiFi', 'Parking', 'Restaurant'], rating: 4.1, reviews: 890 },
  { id: 6, name: 'Calangute Beach Resort', city: 'Goa', stars: 4, price: 7499, image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&q=80', amenities: ['WiFi', 'Pool', 'Beach Access', 'Bar', 'Restaurant'], rating: 4.6, reviews: 2150 },
  { id: 46, name: 'Vagator Cliff Resort', city: 'Goa', stars: 5, price: 11999, image: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400&q=80', amenities: ['WiFi', 'Infinity Pool', 'Spa', 'Bar'], rating: 4.8, reviews: 2750 },
  { id: 47, name: 'Panjim Boutique Hotel', city: 'Goa', stars: 4, price: 4599, image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&q=80', amenities: ['WiFi', 'Restaurant', 'Heritage Walk'], rating: 4.5, reviews: 1120 },
  { id: 48, name: 'Anjuna Backpacker Hostel', city: 'Goa', stars: 2, price: 999, image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&q=80', amenities: ['WiFi', 'Common Kitchen', 'Café'], rating: 4.2, reviews: 950 },

  // 
  { id: 7, name: 'Royal Heritage Hotel', city: 'Delhi', stars: 5, price: 9499, image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar'], rating: 4.7, reviews: 2780 },
  { id: 8, name: 'Metro Stay', city: 'Delhi', stars: 3, price: 3299, image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&q=80', amenities: ['WiFi', 'Parking', 'Restaurant'], rating: 4.0, reviews: 650 },
  { id: 9, name: 'Imperial Plaza', city: 'Delhi', stars: 4, price: 6899, image: 'https://images.unsplash.com/photo-1455587734955-081b22074882?w=400&q=80', amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Parking'], rating: 4.5, reviews: 1890 },
  { id: 49, name: 'Connaught Place Grand', city: 'Delhi', stars: 5, price: 12499, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Bar', 'Gym'], rating: 4.8, reviews: 3100 },
  { id: 50, name: 'Aerocity Transit Hotel', city: 'Delhi', stars: 4, price: 5999, image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80', amenities: ['WiFi', 'Gym', 'Restaurant', 'Airport Shuttle'], rating: 4.4, reviews: 1450 },
  { id: 51, name: 'Paharganj Backpacker', city: 'Delhi', stars: 2, price: 1299, image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80', amenities: ['WiFi', 'Air Conditioning'], rating: 3.9, reviews: 880 },

  // 
  { id: 10, name: 'Lakeview Retreat', city: 'Bangalore', stars: 4, price: 6499, image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80', amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant'], rating: 4.6, reviews: 1540 },
  { id: 11, name: 'Tech Park Residency', city: 'Bangalore', stars: 3, price: 3999, image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&q=80', amenities: ['WiFi', 'Gym', 'Parking', 'Restaurant'], rating: 4.3, reviews: 920 },
  { id: 12, name: 'Garden City Grand', city: 'Bangalore', stars: 5, price: 10499, image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar'], rating: 4.8, reviews: 2670 },
  { id: 52, name: 'Whitefield Luxury Suites', city: 'Bangalore', stars: 5, price: 8999, image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&q=80', amenities: ['WiFi', 'Pool', 'Gym', 'Spa'], rating: 4.7, reviews: 1980 },
  { id: 53, name: 'Indiranagar Boutique', city: 'Bangalore', stars: 4, price: 5599, image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=400&q=80', amenities: ['WiFi', 'Restaurant', 'Bar', 'Gym'], rating: 4.5, reviews: 1340 },
  { id: 54, name: 'Majestic Budget Inn', city: 'Bangalore', stars: 2, price: 1499, image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&q=80', amenities: ['WiFi', 'Parking'], rating: 4.0, reviews: 670 },

  // 
  { id: 13, name: 'Marina Bay Hotel', city: 'Chennai', stars: 4, price: 5999, image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&q=80', amenities: ['WiFi', 'Pool', 'Restaurant', 'Bar'], rating: 4.4, reviews: 1100 },
  { id: 14, name: 'Temple Town Lodge', city: 'Chennai', stars: 3, price: 2799, image: 'https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?w=400&q=80', amenities: ['WiFi', 'Restaurant', 'Parking'], rating: 4.0, reviews: 720 },
  { id: 15, name: 'Coromandel Suites', city: 'Chennai', stars: 5, price: 8999, image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar'], rating: 4.7, reviews: 1950 },
  { id: 55, name: 'ECR Beach Resort', city: 'Chennai', stars: 5, price: 10999, image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80', amenities: ['WiFi', 'Pool', 'Beach Access', 'Spa'], rating: 4.8, reviews: 2200 },
  { id: 56, name: 'T Nagar Grand', city: 'Chennai', stars: 4, price: 6499, image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&q=80', amenities: ['WiFi', 'Restaurant', 'Gym', 'Shopping Access'], rating: 4.5, reviews: 1450 },
  { id: 57, name: 'Central Station Transit', city: 'Chennai', stars: 2, price: 1899, image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&q=80', amenities: ['WiFi', 'Café'], rating: 3.9, reviews: 810 },

  // 
  { id: 16, name: 'Desert Oasis Resort', city: 'Dubai', stars: 5, price: 22999, image: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Beach Access'], rating: 4.9, reviews: 4200 },
  { id: 17, name: 'Burj Vista Hotel', city: 'Dubai', stars: 5, price: 28999, image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Concierge'], rating: 4.9, reviews: 5100 },
  { id: 18, name: 'Marina Sands Dubai', city: 'Dubai', stars: 4, price: 14999, image: 'https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?w=400&q=80', amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Bar'], rating: 4.6, reviews: 2300 },
  { id: 58, name: 'Palm Jumeirah Luxury', city: 'Dubai', stars: 5, price: 35999, image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80', amenities: ['WiFi', 'Private Beach', 'Spa', 'Pool'], rating: 5.0, reviews: 3200 },
  { id: 59, name: 'Deira Business Hotel', city: 'Dubai', stars: 4, price: 6999, image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80', amenities: ['WiFi', 'Gym', 'Restaurant', 'Conference Room'], rating: 4.4, reviews: 1560 },
  { id: 60, name: 'Downtown Budget Suites', city: 'Dubai', stars: 3, price: 4999, image: 'https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?w=400&q=80', amenities: ['WiFi', 'Kitchenette', 'Gym'], rating: 4.2, reviews: 1100 },

  // 
  { id: 19, name: 'Pink City Palace', city: 'Jaipur', stars: 5, price: 11499, image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Heritage Tour'], rating: 4.8, reviews: 3200 },
  { id: 20, name: 'Hawa Mahal View Inn', city: 'Jaipur', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400&q=80', amenities: ['WiFi', 'Restaurant', 'Parking'], rating: 4.2, reviews: 870 },
  { id: 21, name: 'Royal Rajputana', city: 'Jaipur', stars: 4, price: 7999, image: 'https://images.unsplash.com/photo-1600011689032-8b628b8a8747?w=400&q=80', amenities: ['WiFi', 'Pool', 'Restaurant', 'Spa', 'Cultural Shows'], rating: 4.6, reviews: 1780 },
  { id: 61, name: 'Amber Fort Resort', city: 'Jaipur', stars: 5, price: 14499, image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Heritage Tour'], rating: 4.9, reviews: 2100 },
  { id: 62, name: 'Bapu Bazaar Budget Stay', city: 'Jaipur', stars: 2, price: 1299, image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80', amenities: ['WiFi', 'Air Conditioning'], rating: 4.0, reviews: 540 },

  // 
  { id: 22, name: 'Victoria Memorial Suites', city: 'Kolkata', stars: 4, price: 5499, image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=400&q=80', amenities: ['WiFi', 'Gym', 'Restaurant', 'Bar'], rating: 4.4, reviews: 1120 },
  { id: 23, name: 'Howrah Grand Hotel', city: 'Kolkata', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80', amenities: ['WiFi', 'Restaurant', 'Parking'], rating: 4.1, reviews: 680 },
  { id: 24, name: 'Park Street Residency', city: 'Kolkata', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar'], rating: 4.7, reviews: 2340 },
  { id: 63, name: 'Salt Lake Luxury Inn', city: 'Kolkata', stars: 5, price: 9999, image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80', amenities: ['WiFi', 'Pool', 'Gym', 'Spa'], rating: 4.8, reviews: 1800 },
  { id: 64, name: 'New Market Budget Lodge', city: 'Kolkata', stars: 2, price: 1499, image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&q=80', amenities: ['WiFi'], rating: 3.9, reviews: 760 },

  // 
  { id: 25, name: 'Charminar Grand', city: 'Hyderabad', stars: 4, price: 5999, image: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400&q=80', amenities: ['WiFi', 'Pool', 'Restaurant', 'Gym'], rating: 4.5, reviews: 1650 },
  { id: 26, name: 'Hitech City Suites', city: 'Hyderabad', stars: 3, price: 3499, image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&q=80', amenities: ['WiFi', 'Gym', 'Restaurant', 'Parking'], rating: 4.2, reviews: 890 },
  { id: 27, name: 'Nizam Palace Hotel', city: 'Hyderabad', stars: 5, price: 9999, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Heritage Walk'], rating: 4.8, reviews: 2890 },
  { id: 65, name: 'Banjara Hills Luxury', city: 'Hyderabad', stars: 5, price: 11499, image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Bar'], rating: 4.7, reviews: 2100 },
  { id: 66, name: 'Secunderabad Transit Hotel', city: 'Hyderabad', stars: 2, price: 1799, image: 'https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?w=400&q=80', amenities: ['WiFi', 'Air Conditioning'], rating: 4.0, reviews: 920 },

  // 
  { id: 28, name: 'Lake Pichola Resort', city: 'Udaipur', stars: 5, price: 15999, image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Lake View', 'Restaurant', 'Bar'], rating: 4.9, reviews: 3800 },
  { id: 29, name: 'Mewar Heritage Stay', city: 'Udaipur', stars: 4, price: 7499, image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80', amenities: ['WiFi', 'Pool', 'Restaurant', 'Heritage Tour'], rating: 4.6, reviews: 1560 },
  { id: 30, name: 'Aravalli View Inn', city: 'Udaipur', stars: 3, price: 3999, image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400&q=80', amenities: ['WiFi', 'Restaurant', 'Mountain View', 'Parking'], rating: 4.3, reviews: 940 },
  { id: 67, name: 'City Palace Grand', city: 'Udaipur', stars: 5, price: 18999, image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Lake View'], rating: 5.0, reviews: 2500 },
  { id: 68, name: 'Fateh Sagar Budget Inn', city: 'Udaipur', stars: 2, price: 1599, image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80', amenities: ['WiFi'], rating: 4.1, reviews: 650 },

  // 
  { id: 31, name: 'Backwater Paradise', city: 'Kerala', stars: 5, price: 13999, image: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Houseboat', 'Ayurveda', 'Restaurant'], rating: 4.9, reviews: 3400 },
  { id: 32, name: 'Munnar Tea Garden Resort', city: 'Kerala', stars: 4, price: 6999, image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&q=80', amenities: ['WiFi', 'Restaurant', 'Tea Tour', 'Nature Walk'], rating: 4.6, reviews: 1890 },
  { id: 33, name: 'Cochin Harbor Lodge', city: 'Kerala', stars: 3, price: 3299, image: 'https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?w=400&q=80', amenities: ['WiFi', 'Restaurant', 'Parking'], rating: 4.2, reviews: 780 },

  // 
  { id: 34, name: 'Snow Peak Lodge', city: 'Manali', stars: 4, price: 7999, image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=400&q=80', amenities: ['WiFi', 'Restaurant', 'Mountain View', 'Bonfire', 'Trekking'], rating: 4.7, reviews: 2100 },
  { id: 35, name: 'Solang Valley Resort', city: 'Manali', stars: 5, price: 12499, image: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=400&q=80', amenities: ['WiFi', 'Spa', 'Restaurant', 'Adventure Sports', 'Gym'], rating: 4.8, reviews: 2650 },
  { id: 36, name: 'Old Manali Backpacker', city: 'Manali', stars: 2, price: 1499, image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&q=80', amenities: ['WiFi', 'Café', 'Common Kitchen'], rating: 4.0, reviews: 540 },

  // 
  { id: 37, name: 'Marina Bay Sands View', city: 'Singapore', stars: 5, price: 29999, image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Infinity Pool'], rating: 4.9, reviews: 5800 },
  { id: 38, name: 'Orchard Road Suites', city: 'Singapore', stars: 4, price: 18999, image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&q=80', amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Shopping Access'], rating: 4.6, reviews: 2200 },
  { id: 39, name: 'Little India Budget Stay', city: 'Singapore', stars: 3, price: 9999, image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80', amenities: ['WiFi', 'Restaurant', 'Metro Access'], rating: 4.1, reviews: 920 },

  // 
  { id: 40, name: 'Riverside Grand Bangkok', city: 'Bangkok', stars: 5, price: 15999, image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'River View'], rating: 4.8, reviews: 3900 },
  { id: 41, name: 'Sukhumvit City Hotel', city: 'Bangkok', stars: 4, price: 8999, image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&q=80', amenities: ['WiFi', 'Pool', 'Restaurant', 'Nightlife Access'], rating: 4.5, reviews: 1780 },
  { id: 42, name: 'Khao San Road Hostel', city: 'Bangkok', stars: 2, price: 2499, image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&q=80', amenities: ['WiFi', 'Café', 'Rooftop Bar'], rating: 4.0, reviews: 650 },

  // 
  { id: 69, name: 'Bandra Boutique Hotel', city: 'Mumbai', stars: 4, price: 5999, image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80', amenities: ['WiFi', 'Restaurant', 'Gym'], rating: 4.5, reviews: 1450 },
  { id: 70, name: 'Nariman Point Executive', city: 'Mumbai', stars: 5, price: 12999, image: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=400&q=80', amenities: ['WiFi', 'Sea View', 'Pool', 'Spa'], rating: 4.8, reviews: 2900 },

  // 
  { id: 71, name: 'Morjim Beach Stay', city: 'Goa', stars: 3, price: 3499, image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400&q=80', amenities: ['WiFi', 'Beach Access'], rating: 4.3, reviews: 810 },
  { id: 72, name: 'Baga Luxury Resort', city: 'Goa', stars: 5, price: 9999, image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Bar'], rating: 4.7, reviews: 2150 },

  // 
  { id: 73, name: 'Saket City Inn', city: 'Delhi', stars: 3, price: 4999, image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&q=80', amenities: ['WiFi', 'Restaurant', 'Parking'], rating: 4.2, reviews: 930 },
  { id: 74, name: 'Vasant Kunj Premium', city: 'Delhi', stars: 5, price: 10499, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80', amenities: ['WiFi', 'Pool', 'Gym', 'Spa'], rating: 4.8, reviews: 1840 },

  // 
  { id: 75, name: 'Koramangala Backpacker', city: 'Bangalore', stars: 2, price: 1299, image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&q=80', amenities: ['WiFi', 'Café'], rating: 4.0, reviews: 750 },
  { id: 76, name: 'Malleswaram Heritage', city: 'Bangalore', stars: 4, price: 6999, image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80', amenities: ['WiFi', 'Restaurant', 'Heritage Tour'], rating: 4.6, reviews: 1120 },

  // 
  { id: 77, name: 'Adyar Boutique', city: 'Chennai', stars: 4, price: 4499, image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.4, reviews: 890 },
  { id: 78, name: 'OMR IT Park Suites', city: 'Chennai', stars: 5, price: 7999, image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&q=80', amenities: ['WiFi', 'Pool', 'Gym', 'Conference Room'], rating: 4.7, reviews: 1650 },

  // 
  { id: 79, name: 'Bur Dubai Budget', city: 'Dubai', stars: 3, price: 3999, image: 'https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?w=400&q=80', amenities: ['WiFi', 'Air Conditioning'], rating: 4.1, reviews: 1050 },
  { id: 80, name: 'Jumeirah Beach Resort', city: 'Dubai', stars: 5, price: 18999, image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80', amenities: ['WiFi', 'Private Beach', 'Pool', 'Spa'], rating: 4.9, reviews: 4500 },

  // 
  { id: 81, name: 'Mansarovar Economy', city: 'Jaipur', stars: 2, price: 1999, image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80', amenities: ['WiFi'], rating: 3.9, reviews: 460 },
  { id: 82, name: 'Raja Park Grand', city: 'Jaipur', stars: 4, price: 6499, image: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400&q=80', amenities: ['WiFi', 'Restaurant', 'Gym'], rating: 4.5, reviews: 1200 },

  // 
  { id: 83, name: 'Ballygunge Suites', city: 'Kolkata', stars: 4, price: 5999, image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&q=80', amenities: ['WiFi', 'Restaurant', 'Bar'], rating: 4.4, reviews: 980 },
  { id: 84, name: 'Airport Transit Hotel', city: 'Kolkata', stars: 3, price: 3499, image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&q=80', amenities: ['WiFi', 'Airport Shuttle'], rating: 4.2, reviews: 1100 },

  // 
  { id: 85, name: 'Gachibowli Premium', city: 'Hyderabad', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&q=80', amenities: ['WiFi', 'Pool', 'Gym'], rating: 4.7, reviews: 1750 },
  { id: 86, name: 'Jubilee Hills Boutique', city: 'Hyderabad', stars: 4, price: 7999, image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80', amenities: ['WiFi', 'Restaurant', 'Spa'], rating: 4.6, reviews: 1300 },

  // 
  { id: 87, name: 'Monsoon Palace View', city: 'Udaipur', stars: 4, price: 8999, image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80', amenities: ['WiFi', 'Mountain View', 'Restaurant'], rating: 4.7, reviews: 1600 },
  { id: 88, name: 'Nathdwara Pilgrim Stay', city: 'Udaipur', stars: 2, price: 2499, image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80', amenities: ['WiFi', 'Parking'], rating: 4.0, reviews: 520 },

  // 
  { id: 89, name: 'Alleppey Houseboat Premium', city: 'Kerala', stars: 5, price: 15999, image: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=400&q=80', amenities: ['Meals Included', 'River View', 'Houseboat'], rating: 4.9, reviews: 2100 },
  { id: 90, name: 'Wayanad Forest Resort', city: 'Kerala', stars: 4, price: 8499, image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=400&q=80', amenities: ['WiFi', 'Nature Walk', 'Restaurant'], rating: 4.6, reviews: 1450 },

  // 
  { id: 91, name: 'Rohtang View Inn', city: 'Manali', stars: 3, price: 4999, image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400&q=80', amenities: ['WiFi', 'Mountain View', 'Bonfire'], rating: 4.4, reviews: 1100 },
  { id: 92, name: 'Kasol Riverside Camp', city: 'Manali', stars: 2, price: 2999, image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&q=80', amenities: ['Tents', 'Bonfire', 'River Access'], rating: 4.2, reviews: 850 },

  // 
  { id: 93, name: 'Changi Airport Transit', city: 'Singapore', stars: 4, price: 12999, image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80', amenities: ['WiFi', 'Airport Access', 'Pool'], rating: 4.5, reviews: 2300 },
  { id: 94, name: 'Sentosa Island Resort', city: 'Singapore', stars: 5, price: 25999, image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80', amenities: ['WiFi', 'Beach Access', 'Pool', 'Spa'], rating: 4.8, reviews: 3100 },

  // 
  { id: 95, name: 'Pratunam Market Hotel', city: 'Bangkok', stars: 3, price: 4599, image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&q=80', amenities: ['WiFi', 'Shopping Access', 'Restaurant'], rating: 4.3, reviews: 1400 },
  { id: 96, name: 'Silom Business Suites', city: 'Bangkok', stars: 4, price: 7499, image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&q=80', amenities: ['WiFi', 'Gym', 'Restaurant', 'Metro Access'], rating: 4.6, reviews: 1950 },

  // 
  { id: 97, name: 'Dharavi Backpacker Dorm', city: 'Mumbai', stars: 1, price: 499, image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&q=80', amenities: ['Free WiFi', 'Lockers'], rating: 3.5, reviews: 310 },
  { id: 98, name: 'Arambol Surf Hostel', city: 'Goa', stars: 1, price: 399, image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&q=80', amenities: ['Free WiFi', 'Common Room'], rating: 4.2, reviews: 850 },
  { id: 99, name: 'Majnu Ka Tilla Guest House', city: 'Delhi', stars: 1, price: 450, image: 'https://images.unsplash.com/photo-1522771731475-6e6b528b1e4c?w=400&q=80', amenities: ['Fan', 'Shared Bath'], rating: 3.7, reviews: 290 },
  { id: 100, name: 'Yelahanka Student Stay', city: 'Bangalore', stars: 1, price: 550, image: 'https://images.unsplash.com/photo-1502672260266-1c1f52d5b6e0?w=400&q=80', amenities: ['Free WiFi', 'Reading Room'], rating: 3.8, reviews: 180 },
  { id: 101, name: 'Egmore Budget Lodge', city: 'Chennai', stars: 1, price: 500, image: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=400&q=80', amenities: ['24/7 Desk'], rating: 3.4, reviews: 420 },
  { id: 102, name: 'Deira Shared Dorms', city: 'Dubai', stars: 1, price: 1499, image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80', amenities: ['Air Conditioning', 'Free WiFi'], rating: 3.9, reviews: 630 },
  { id: 103, name: 'Sindhi Camp Hostel', city: 'Jaipur', stars: 1, price: 350, image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&q=80', amenities: ['Fan', 'Lockers'], rating: 3.6, reviews: 340 },
  { id: 104, name: 'Sealdah Dormitory', city: 'Kolkata', stars: 1, price: 400, image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400&q=80', amenities: ['Shared Lounge'], rating: 3.3, reviews: 520 },
  { id: 105, name: 'Nampally Guest House', city: 'Hyderabad', stars: 1, price: 499, image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&q=80', amenities: ['Fan'], rating: 3.5, reviews: 290 },
  { id: 106, name: 'Lake Ghat Hostel', city: 'Udaipur', stars: 1, price: 450, image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&q=80', amenities: ['Free WiFi', 'Rooftop View'], rating: 4.1, reviews: 760 },
  { id: 107, name: 'Varkala Cliff Dorms', city: 'Kerala', stars: 1, price: 550, image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&q=80', amenities: ['Sea Breeze', 'Hammocks'], rating: 4.3, reviews: 890 },
  { id: 108, name: 'Vashisht Backpacker Hub', city: 'Manali', stars: 1, price: 399, image: 'https://images.unsplash.com/photo-1455587734955-081b22074882?w=400&q=80', amenities: ['Free WiFi', 'Hot Spring Access'], rating: 4.0, reviews: 680 },
  { id: 109, name: 'Bugis Capsule Hostel', city: 'Singapore', stars: 1, price: 2999, image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80', amenities: ['Air Conditioning', 'Free WiFi', 'Lockers'], rating: 4.2, reviews: 1150 },
  // 
  { id: 111, name: 'Pune Marriott Suites', city: 'Pune', stars: 5, price: 9499, image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1540 },
  { id: 112, name: 'Deccan Boutique Hotel', city: 'Pune', stars: 4, price: 5499, image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80', amenities: ['WiFi', 'Restaurant', 'Gym'], rating: 4.5, reviews: 1120 },

  // 
  { id: 113, name: 'Sabarmati River View', city: 'Ahmedabad', stars: 5, price: 8999, image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80', amenities: ['WiFi', 'River View', 'Spa'], rating: 4.7, reviews: 1800 },
  { id: 114, name: 'Navrangpura Budget Stay', city: 'Ahmedabad', stars: 3, price: 3499, image: 'https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },

  // 
  { id: 115, name: 'The Thames Grand', city: 'London', stars: 5, price: 35999, image: 'https://images.unsplash.com/photo-1513635269975-5969336cd190?w=400&q=80', amenities: ['WiFi', 'River View', 'Spa', 'Bar'], rating: 4.9, reviews: 3100 },
  { id: 116, name: 'Camden Town Hostel', city: 'London', stars: 2, price: 5999, image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&q=80', amenities: ['WiFi', 'Lockers', 'Bar'], rating: 4.3, reviews: 1450 },

  // 
  { id: 117, name: 'Manhattan Skyline Suites', city: 'New York', stars: 5, price: 42999, image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&q=80', amenities: ['WiFi', 'City View', 'Gym', 'Restaurant'], rating: 4.8, reviews: 4200 },
  { id: 118, name: 'Brooklyn Budget Inn', city: 'New York', stars: 3, price: 12999, image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80', amenities: ['WiFi', 'Café'], rating: 4.2, reviews: 1800 },

  // 
  { id: 119, name: 'Eiffel Tower View Hotel', city: 'Paris', stars: 5, price: 38999, image: 'https://images.unsplash.com/photo-1502602898657-3e907a5ea071?w=400&q=80', amenities: ['WiFi', 'City View', 'Spa', 'Restaurant'], rating: 4.9, reviews: 3500 },
  { id: 120, name: 'Montmartre Boutique', city: 'Paris', stars: 4, price: 18999, image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&q=80', amenities: ['WiFi', 'Bar', 'Walking Tours'], rating: 4.6, reviews: 1650 },

  // 
  { id: 121, name: 'Shibuya City Resort', city: 'Tokyo', stars: 5, price: 31999, image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80', amenities: ['WiFi', 'Onsen', 'Gym', 'Sushi Bar'], rating: 4.8, reviews: 2900 },
  { id: 122, name: 'Akihabara Capsule Hotel', city: 'Tokyo', stars: 2, price: 4999, image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&q=80', amenities: ['WiFi', 'Lockers'], rating: 4.5, reviews: 2200 },

  // 
  { id: 123, name: 'Ubud Jungle Villa', city: 'Bali', stars: 5, price: 21999, image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80', amenities: ['WiFi', 'Private Pool', 'Spa', 'Yoga'], rating: 4.9, reviews: 3200 },
  { id: 124, name: 'Kuta Surf Hostel', city: 'Bali', stars: 2, price: 2499, image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&q=80', amenities: ['WiFi', 'Surf Rental', 'Bar'], rating: 4.4, reviews: 1850 },

  // 
  { id: 200, name: 'Surat Grand Suites', city: 'Surat', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 201, name: 'Surat Budget Stay', city: 'Surat', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 202, name: 'Lucknow Grand Suites', city: 'Lucknow', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 203, name: 'Lucknow Budget Stay', city: 'Lucknow', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 204, name: 'Kanpur Grand Suites', city: 'Kanpur', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 205, name: 'Kanpur Budget Stay', city: 'Kanpur', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 206, name: 'Nagpur Grand Suites', city: 'Nagpur', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 207, name: 'Nagpur Budget Stay', city: 'Nagpur', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 208, name: 'Indore Grand Suites', city: 'Indore', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 209, name: 'Indore Budget Stay', city: 'Indore', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 210, name: 'Bhopal Grand Suites', city: 'Bhopal', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 211, name: 'Bhopal Budget Stay', city: 'Bhopal', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 212, name: 'Visakhapatnam Grand Suites', city: 'Visakhapatnam', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 213, name: 'Visakhapatnam Budget Stay', city: 'Visakhapatnam', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 214, name: 'Patna Grand Suites', city: 'Patna', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 215, name: 'Patna Budget Stay', city: 'Patna', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 216, name: 'Vadodara Grand Suites', city: 'Vadodara', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 217, name: 'Vadodara Budget Stay', city: 'Vadodara', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 218, name: 'Ludhiana Grand Suites', city: 'Ludhiana', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 219, name: 'Ludhiana Budget Stay', city: 'Ludhiana', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 220, name: 'Agra Grand Suites', city: 'Agra', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 221, name: 'Agra Budget Stay', city: 'Agra', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 222, name: 'Nashik Grand Suites', city: 'Nashik', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 223, name: 'Nashik Budget Stay', city: 'Nashik', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1455587734955-081b22074882?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 224, name: 'Rajkot Grand Suites', city: 'Rajkot', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1455587734955-081b22074882?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 225, name: 'Rajkot Budget Stay', city: 'Rajkot', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 226, name: 'Varanasi Grand Suites', city: 'Varanasi', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 227, name: 'Varanasi Budget Stay', city: 'Varanasi', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 228, name: 'Srinagar Grand Suites', city: 'Srinagar', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 229, name: 'Srinagar Budget Stay', city: 'Srinagar', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 230, name: 'Aurangabad Grand Suites', city: 'Aurangabad', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 231, name: 'Aurangabad Budget Stay', city: 'Aurangabad', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 232, name: 'Amritsar Grand Suites', city: 'Amritsar', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 233, name: 'Amritsar Budget Stay', city: 'Amritsar', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 234, name: 'Allahabad Grand Suites', city: 'Allahabad', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 235, name: 'Allahabad Budget Stay', city: 'Allahabad', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 236, name: 'Ranchi Grand Suites', city: 'Ranchi', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 237, name: 'Ranchi Budget Stay', city: 'Ranchi', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 238, name: 'Coimbatore Grand Suites', city: 'Coimbatore', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 239, name: 'Coimbatore Budget Stay', city: 'Coimbatore', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 240, name: 'Jabalpur Grand Suites', city: 'Jabalpur', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 241, name: 'Jabalpur Budget Stay', city: 'Jabalpur', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 242, name: 'Gwalior Grand Suites', city: 'Gwalior', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 243, name: 'Gwalior Budget Stay', city: 'Gwalior', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 244, name: 'Vijayawada Grand Suites', city: 'Vijayawada', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 245, name: 'Vijayawada Budget Stay', city: 'Vijayawada', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 246, name: 'Jodhpur Grand Suites', city: 'Jodhpur', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 247, name: 'Jodhpur Budget Stay', city: 'Jodhpur', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 248, name: 'Madurai Grand Suites', city: 'Madurai', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 249, name: 'Madurai Budget Stay', city: 'Madurai', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1600011689032-8b628b8a8747?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 250, name: 'Raipur Grand Suites', city: 'Raipur', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1600011689032-8b628b8a8747?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 251, name: 'Raipur Budget Stay', city: 'Raipur', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 252, name: 'Kota Grand Suites', city: 'Kota', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 253, name: 'Kota Budget Stay', city: 'Kota', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 254, name: 'Guwahati Grand Suites', city: 'Guwahati', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 255, name: 'Guwahati Budget Stay', city: 'Guwahati', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 256, name: 'Chandigarh Grand Suites', city: 'Chandigarh', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 257, name: 'Chandigarh Budget Stay', city: 'Chandigarh', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 258, name: 'Mysore Grand Suites', city: 'Mysore', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 259, name: 'Mysore Budget Stay', city: 'Mysore', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 260, name: 'Tiruchirappalli Grand Suites', city: 'Tiruchirappalli', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 261, name: 'Tiruchirappalli Budget Stay', city: 'Tiruchirappalli', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 262, name: 'Bhubaneswar Grand Suites', city: 'Bhubaneswar', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 263, name: 'Bhubaneswar Budget Stay', city: 'Bhubaneswar', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 264, name: 'Thiruvananthapuram Grand Suites', city: 'Thiruvananthapuram', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 265, name: 'Thiruvananthapuram Budget Stay', city: 'Thiruvananthapuram', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 266, name: 'Kochi Grand Suites', city: 'Kochi', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 267, name: 'Kochi Budget Stay', city: 'Kochi', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 268, name: 'Dehradun Grand Suites', city: 'Dehradun', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 269, name: 'Dehradun Budget Stay', city: 'Dehradun', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 270, name: 'Mangalore Grand Suites', city: 'Mangalore', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 271, name: 'Mangalore Budget Stay', city: 'Mangalore', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
  // 
  { id: 272, name: 'Tirupati Grand Suites', city: 'Tirupati', stars: 5, price: 8499, image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&q=80', amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], rating: 4.8, reviews: 1450 },
  { id: 273, name: 'Tirupati Budget Stay', city: 'Tirupati', stars: 3, price: 2999, image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&q=80', amenities: ['WiFi', 'Restaurant'], rating: 4.2, reviews: 850 },
];

const hotelBookings = [];

const cityImages = {
  'Mumbai': 'https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?w=400&q=80',
  'Goa': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80',
  'Delhi': 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80',
  'Bangalore': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80',
  'Chennai': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&q=80',
  'Dubai': 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=400&q=80',
  'Jaipur': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80',
  'Kolkata': 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=400&q=80',
  'Hyderabad': 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400&q=80',
  'Udaipur': 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80',
  'Kerala': 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=400&q=80',
  'Manali': 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=400&q=80',
  'Singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80',
  'Bangkok': 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&q=80',
  'Pune': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80',
  'Ahmedabad': 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80',
  'London': 'https://images.unsplash.com/photo-1513635269975-5969336cd190?w=400&q=80',
  'New York': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&q=80',
  'Paris': 'https://images.unsplash.com/photo-1502602898657-3e907a5ea071?w=400&q=80',
  'Tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80',
  'Bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80',
  'Surat': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80',
  'Lucknow': 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80',
  'Kanpur': 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&q=80',
  'Nagpur': 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80',
  'Indore': 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&q=80',
  'Bhopal': 'https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?w=400&q=80',
  'Visakhapatnam': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80',
  'Patna': 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400&q=80',
  'Vadodara': 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400&q=80',
  'Ludhiana': 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&q=80',
  'Agra': 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&q=80',
  'Nashik': 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&q=80',
  'Rajkot': 'https://images.unsplash.com/photo-1455587734955-081b22074882?w=400&q=80',
  'Varanasi': 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80',
  'Srinagar': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80',
  'Aurangabad': 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&q=80',
  'Amritsar': 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&q=80',
  'Allahabad': 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&q=80',
  'Ranchi': 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=400&q=80',
  'Coimbatore': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&q=80',
  'Jabalpur': 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=400&q=80',
  'Gwalior': 'https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?w=400&q=80',
  'Vijayawada': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80',
  'Jodhpur': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80',
  'Madurai': 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400&q=80',
  'Raipur': 'https://images.unsplash.com/photo-1600011689032-8b628b8a8747?w=400&q=80',
  'Kota': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80',
  'Guwahati': 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80',
  'Chandigarh': 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&q=80',
  'Mysore': 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80',
  'Tiruchirappalli': 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&q=80',
  'Bhubaneswar': 'https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?w=400&q=80',
  'Thiruvananthapuram': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80',
  'Kochi': 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400&q=80',
  'Dehradun': 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400&q=80',
  'Mangalore': 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&q=80',
  'Tirupati': 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&q=80'
};

const specificImages = [
  { keywords: ['victoria', 'palace', 'taj', 'colaba', 'amber', 'hawa mahal', 'charminar'], url: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80' },
  { keywords: ['howrah', 'marine drive', 'riverside', 'wat'], url: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&q=80' },
  { keywords: ['park street', 'connaught', 'paharganj'], url: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=400&q=80' },
  { keywords: ['juhu', 'beach', 'vagator', 'anjuna', 'baga', 'marina', 'sentosa', 'palm jumeirah'], url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80' },
  { keywords: ['aerocity', 'airport', 'transit'], url: 'https://images.unsplash.com/photo-1455587734955-081b22074882?w=400&q=80' },
  { keywords: ['hitech', 'gachibowli', 'tech', 'deira'], url: 'https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?w=400&q=80' },
  { keywords: ['munnar', 'tea', 'snow', 'rohtang', 'solang'], url: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=400&q=80' },
  { keywords: ['backwater', 'houseboat'], url: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=400&q=80' },
  { keywords: ['dharavi', 'bazaar'], url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80' },
  { keywords: ['pool', 'resort', 'luxury'], url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80' }
];

const getHotelImage = (hotel) => {
  const lowerName = hotel.name.toLowerCase();
  for (const item of specificImages) {
    if (item.keywords.some(kw => lowerName.includes(kw))) {
      return item.url;
    }
  }
  return hotel.image; // Fall back to the hotel's ORIGINAL unique Unsplash image to guarantee variety!
};

// GET /api/hotels?city=&checkin=&checkout=&guests=
router.get('/', (req, res) => {
  const { city = '', checkin, checkout, guests = 1 } = req.query;
  let results = [...mockHotels];

  if (city) {
    results = results.filter(h => h.city.toLowerCase().includes(city.toLowerCase()));
  }

  // Add random price variation and smartly assign location-specific images
  results = results.map(h => ({
    ...h,
    price: h.price + Math.floor(Math.random() * 500 - 250),
    available: Math.floor(Math.random() * 10) + 1,
    image: getHotelImage(h)
  }));

  setTimeout(() => {
    res.json({ success: true, count: results.length, hotels: results, city, checkin, checkout, guests: Number(guests) });
  }, 600);
});

// GET /api/hotels/cities
router.get('/cities', (req, res) => {
  const cities = [...new Set(mockHotels.map(h => h.city))];
  res.json({ success: true, cities });
});

// POST /api/hotels/book
router.post('/book', (req, res) => {
  const { hotel, checkin, checkout, guests, firstName, lastName, email } = req.body;
  if (!firstName || !lastName || !email || !hotel) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const nights = checkin && checkout ? Math.max(1, Math.ceil((new Date(checkout) - new Date(checkin)) / 86400000)) : 1;
  const bookingId = 'HTL' + Math.random().toString(36).substr(2, 8).toUpperCase();

  const booking = {
    bookingId,
    hotel: { name: hotel.name, city: hotel.city, stars: hotel.stars, image: hotel.image },
    guest: { firstName, lastName, email },
    checkin, checkout, nights, guests,
    totalPrice: hotel.price * nights,
    bookedAt: new Date().toISOString(),
  };

  hotelBookings.push(booking);
  res.status(201).json({ success: true, bookingId, booking });
});

// GET /api/hotels/bookings
router.get('/bookings', (req, res) => {
  res.json({ success: true, bookings: hotelBookings });
});

module.exports = router;
