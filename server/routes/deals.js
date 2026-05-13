const express = require('express');
const router = express.Router();

const mockDeals = [
  { id: 1, title: 'Mumbai → Goa Weekend', category: 'Weekend', from: 'Mumbai', to: 'Goa', originalPrice: 4999, dealPrice: 1999, discount: 60, image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&q=80', validUntil: '2026-05-15', description: 'Escape to the beaches this weekend!' },
  { id: 2, title: 'Delhi → Dubai Getaway', category: 'International', from: 'Delhi', to: 'Dubai', originalPrice: 18999, dealPrice: 12499, discount: 34, image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80', validUntil: '2026-05-30', description: 'Luxury Dubai trip at unbeatable prices' },
  { id: 3, title: 'Bangalore → Chennai Express', category: 'Domestic', from: 'Bangalore', to: 'Chennai', originalPrice: 3499, dealPrice: 1499, discount: 57, image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&q=80', validUntil: '2026-05-10', description: 'Quick hop to Chennai marina!' },
  { id: 4, title: 'Mumbai → Singapore', category: 'International', from: 'Mumbai', to: 'Singapore', originalPrice: 24999, dealPrice: 15999, discount: 36, image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80', validUntil: '2026-06-15', description: 'Explore the Lion City' },
  { id: 5, title: 'Delhi → Manali Retreat', category: 'Weekend', from: 'Delhi', to: 'Manali', originalPrice: 5999, dealPrice: 2999, discount: 50, image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400&q=80', validUntil: '2026-05-20', description: 'Mountains calling this weekend' },
  { id: 6, title: 'Hyderabad → Bangkok', category: 'International', from: 'Hyderabad', to: 'Bangkok', originalPrice: 16999, dealPrice: 9999, discount: 41, image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&q=80', validUntil: '2026-06-30', description: 'Thai adventure awaits' },
  { id: 7, title: 'Delhi → Jaipur Heritage', category: 'Weekend', from: 'Delhi', to: 'Jaipur', originalPrice: 3999, dealPrice: 1799, discount: 55, image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400&q=80', validUntil: '2026-05-25', description: 'Explore the Pink City this weekend' },
  { id: 8, title: 'Mumbai → Kolkata Culture Trip', category: 'Domestic', from: 'Mumbai', to: 'Kolkata', originalPrice: 6999, dealPrice: 3499, discount: 50, image: 'https://images.unsplash.com/photo-1558431382-27e303142255?w=400&q=80', validUntil: '2026-06-10', description: 'City of Joy awaits your arrival' },
  { id: 9, title: 'Bangalore → Goa Beach Bash', category: 'Weekend', from: 'Bangalore', to: 'Goa', originalPrice: 4499, dealPrice: 2199, discount: 51, image: 'https://images.unsplash.com/photo-1614082242765-7c98ca0f3df3?w=400&q=80', validUntil: '2026-05-18', description: 'Sun, sand and savings!' },
  { id: 10, title: 'Delhi → Udaipur Romance', category: 'Domestic', from: 'Delhi', to: 'Udaipur', originalPrice: 5499, dealPrice: 2799, discount: 49, image: 'https://images.unsplash.com/photo-1568154270759-c26e6f86c7c8?w=600&q=80', validUntil: '2026-06-05', description: 'City of Lakes at dream prices' },
  { id: 11, title: 'Chennai → Singapore Fly', category: 'International', from: 'Chennai', to: 'Singapore', originalPrice: 22999, dealPrice: 13999, discount: 39, image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80', validUntil: '2026-07-15', description: 'Direct flights to Singapore!' },
  { id: 12, title: 'Kerala Backwater Escape', category: 'Domestic', from: 'Bangalore', to: 'Kochi', originalPrice: 4999, dealPrice: 2499, discount: 50, image: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=400&q=80', validUntil: '2026-06-20', description: 'Houseboats & hill stations await' },
];

// GET /api/deals?category=
router.get('/', (req, res) => {
  const { category } = req.query;
  let results = [...mockDeals];
  if (category && category !== 'All') {
    results = results.filter(d => d.category === category);
  }
  res.json({ success: true, count: results.length, deals: results });
});

module.exports = router;
