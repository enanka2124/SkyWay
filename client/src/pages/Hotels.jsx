import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PageHero from '../components/PageHero'

// City-based fallback images shown when a hotel image fails to load
const cityFallbackImages = {
  'Mumbai':             'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=600&q=80',
  'Goa':                'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80',
  'Delhi':              'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=600&q=80',
  'Bangalore':          'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600&q=80',
  'Chennai':            'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&q=80',
  'Dubai':              'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=600&q=80',
  'Jaipur':             'https://images.unsplash.com/photo-1477587458883-47145ed31459?w=600&q=80',
  'Kolkata':            'https://images.unsplash.com/photo-1558431382-27e303142255?w=600&q=80',
  'Hyderabad':          'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?w=600&q=80',
  'Udaipur':            'https://images.unsplash.com/photo-1568154270759-c26e6f86c7c8?w=600&q=80',
  'Kerala':             'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&q=80',
  'Manali':             'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80',
  'Singapore':          'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=600&q=80',
  'Bangkok':            'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&q=80',
  'London':             'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=600&q=80',
  'Paris':              'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80',
  'New York':           'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=600&q=80',
  'Tokyo':              'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80',
  'Bali':               'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80',
  'Pune':               'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80',
  'Ahmedabad':          'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=80',
  'Colombo':            'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&q=80',
  'Kathmandu':          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'Surat':              'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
  'Lucknow':            'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&q=80',
  'Varanasi':           'https://images.unsplash.com/photo-1561361058-c24e021e62f0?w=600&q=80',
  'Agra':               'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&q=80',
  'Amritsar':           'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=80',
  'Srinagar':           'https://images.unsplash.com/photo-1554120540-2f78b7d5e343?w=600&q=80',
  'Kochi':              'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&q=80',
  'Mysore':             'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=80',
  'Jodhpur':            'https://images.unsplash.com/photo-1477587458883-47145ed31459?w=600&q=80',
  'Dehradun':           'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80',
  'default':            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80'
}

const getImageFallback = (city) => cityFallbackImages[city] || cityFallbackImages['default']

const knownCities = [
  'Mumbai', 'Goa', 'Delhi', 'Bangalore', 'Chennai', 'Dubai', 'Jaipur', 'Kolkata', 'Hyderabad', 'Manali', 'Singapore', 'Bangkok', 'Udaipur', 'Pune', 'Ahmedabad', 'London', 'New York', 'Paris', 'Tokyo', 'Bali', 'Colombo', 'Kathmandu', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara', 'Ludhiana', 'Agra', 'Nashik', 'Rajkot', 'Varanasi', 'Srinagar', 'Aurangabad', 'Amritsar', 'Allahabad', 'Ranchi', 'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur', 'Kota', 'Guwahati', 'Chandigarh', 'Mysore', 'Tiruchirappalli', 'Bhubaneswar', 'Thiruvananthapuram', 'Kochi', 'Dehradun', 'Mangalore', 'Tirupati'
];

const getLevenshteinDistance = (a, b) => {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
      }
    }
  }
  return matrix[b.length][a.length];
};

const autoCorrectCity = (input) => {
  if (!input || input.length < 3) return input;
  const cleanInput = input.trim();
  const exactMatch = knownCities.find(c => c.toLowerCase() === cleanInput.toLowerCase());
  if (exactMatch) return exactMatch;
  let bestMatch = null;
  let minDistance = Infinity;
  for (const city of knownCities) {
    const cityLower = city.toLowerCase();
    const inputLower = cleanInput.toLowerCase();
    if (cityLower.includes(inputLower) || inputLower.includes(cityLower)) {
      return city;
    }
    const dist = getLevenshteinDistance(inputLower, cityLower);
    if (dist < minDistance && dist <= 3) {
      minDistance = dist;
      bestMatch = city;
    }
  }
  return bestMatch || cleanInput;
};

export default function Hotels() {
  const [searchParams] = useSearchParams()
  const urlCity     = searchParams.get('city')
  const urlCheckin  = searchParams.get('checkin')
  const urlCheckout = searchParams.get('checkout')
  const dealPrice   = searchParams.get('dealPrice')
  const dealDiscount = searchParams.get('discount')

  const [city, setCity]         = useState(urlCity || '')
  const [checkin, setCheckin]   = useState(urlCheckin || '')
  const [checkout, setCheckout] = useState(urlCheckout || '')
  const [guests, setGuests]     = useState(2)
  const [rooms, setRooms]       = useState(1)
  const [hotels, setHotels]     = useState([])
  const [loading, setLoading]   = useState(false)
  const [searched, setSearched] = useState(false)
  const [showMoreDest, setShowMoreDest] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  const allDestinations = [
    { city: 'Mumbai',    country: 'India',        image: cityFallbackImages['Mumbai'] },
    { city: 'Goa',       country: 'India',        image: cityFallbackImages['Goa'] },
    { city: 'Delhi',     country: 'India',        image: cityFallbackImages['Delhi'] },
    { city: 'Bangalore', country: 'India',        image: cityFallbackImages['Bangalore'] },
    { city: 'Dubai',     country: 'UAE',          image: cityFallbackImages['Dubai'] },
    { city: 'Paris',     country: 'France',       image: cityFallbackImages['Paris'] },
    { city: 'London',    country: 'UK',           image: cityFallbackImages['London'] },
    { city: 'Bali',      country: 'Indonesia',    image: cityFallbackImages['Bali'] },
    { city: 'Jaipur',    country: 'India',        image: cityFallbackImages['Jaipur'] },
    { city: 'Singapore', country: 'Singapore',   image: cityFallbackImages['Singapore'] },
    { city: 'Bangkok',   country: 'Thailand',     image: cityFallbackImages['Bangkok'] },
    { city: 'Tokyo',     country: 'Japan',        image: cityFallbackImages['Tokyo'] },
    { city: 'Kolkata',   country: 'India',        image: cityFallbackImages['Kolkata'] },
    { city: 'Hyderabad', country: 'India',        image: cityFallbackImages['Hyderabad'] },
    { city: 'Udaipur',   country: 'India',        image: cityFallbackImages['Udaipur'] },
    { city: 'New York',  country: 'USA',          image: cityFallbackImages['New York'] },
  ]

  useEffect(() => {
    if (urlCheckin && urlCheckout) return // If they came from URL, don't overwrite
    const today = new Date()
    const off = today.getTimezoneOffset() * 60000
    const iso = (d) => new Date(d - off).toISOString().split('T')[0]
    setCheckin(iso(today))
    const next = new Date(); next.setDate(next.getDate() + 2)
    setCheckout(iso(next))
  }, [urlCheckin, urlCheckout])

  const handleSearch = async (searchCity) => {
    let targetCity = typeof searchCity === 'string' ? searchCity : city
    targetCity = autoCorrectCity(targetCity);
    if (targetCity !== city) setCity(targetCity);

    if (!targetCity.trim()) { alert('Please enter a city'); return }
    setLoading(true); setSearched(true)
    try {
      const res = await fetch(`/api/hotels?city=${encodeURIComponent(targetCity)}&checkin=${checkin}&checkout=${checkout}&guests=${guests}`)
      const data = await res.json()
      if (data.success) {
        let updatedHotels = [...data.hotels]
        if (dealPrice && updatedHotels.length > 0) {
          const basePrice = parseInt(dealPrice, 10)
          updatedHotels = updatedHotels.map((h, i) => {
            const isDeal = i < 6;
            return {
              ...h,
              price: i === 0 ? basePrice : basePrice + Math.floor(Math.random() * 1500) + (i * 1000),
              isDeal: isDeal,
              discount: isDeal ? (parseInt(dealDiscount, 10) || 0) : 0
            }
          })
        }
        setHotels(updatedHotels)
      }
    } catch { setHotels([]) }
    setLoading(false)
  }

  useEffect(() => {
    if (urlCity && checkin && checkout) {
      handleSearch(urlCity)
    }
  }, [urlCity, checkin, checkout])

  const nights = checkin && checkout ? Math.max(1, Math.ceil((new Date(checkout) - new Date(checkin)) / 86400000)) : 1

  const handleHotelClick = (hotel) => {
    if (!user) {
      navigate('/signin', { state: { from: '/hotels' } })
      return
    }
    navigate('/checkout', {
      state: {
        type: 'hotel',
        data: hotel,
        searchInfo: { checkin, checkout, guests, rooms, nights },
      }
    })
  }

  return (
    <>
      <Navbar />
      <PageHero
        line1="Find Your"
        line2="Perfect Stay"
        badge="Luxury · Comfort · Value"
        subtitle="Search hotels by city, dates, rooms, and guests to unlock exclusive deals."
      />
      <section className="relative z-10" style={{ padding: '0 0 clamp(2.5rem,5vw,4rem)' }}>
        <div className="container-main">
          {/* Search */}
          <div className="glass-card" style={{ maxWidth: 900, margin: '1.5rem auto 3.5rem' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px,100%), 1fr))',
              gap: '16px',
              alignItems: 'end',
            }}>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted tracking-wider uppercase">City</label>
                <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Mumbai, Goa, Dubai" className="sky-input" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted tracking-wider uppercase">Check-in</label>
                <input type="date" value={checkin} onChange={e => setCheckin(e.target.value)} className="sky-input" style={{ colorScheme: 'dark' }} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted tracking-wider uppercase">Check-out</label>
                <input type="date" value={checkout} onChange={e => setCheckout(e.target.value)} className="sky-input" style={{ colorScheme: 'dark' }} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted tracking-wider uppercase">Rooms</label>
                <select value={rooms} onChange={e => setRooms(Number(e.target.value))} className="sky-input">
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Room{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted tracking-wider uppercase">Guests</label>
                <select value={guests} onChange={e => setGuests(Number(e.target.value))} className="sky-input">
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>
              <button onClick={handleSearch} className="search-cta">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                Search
              </button>
            </div>
          </div>

          {/* Results or Popular Destinations */}
          {loading && <div className="loading-bar" style={{ maxWidth: 900, margin: '0 auto' }}></div>}

          {!searched && !loading && (
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
              <div className="flex items-end justify-between mb-10 flex-wrap gap-3">
                <div>
                  <h2 className="font-syne font-bold tracking-tight" style={{ fontSize: 'clamp(1.4rem,3vw,1.75rem)' }}>
                    Popular <span className="text-accent">Destinations</span>
                  </h2>
                  <p className="text-text-muted text-sm mt-1">Trending hotel locations this season</p>
                </div>
                <button
                  onClick={() => setShowMoreDest(p => !p)}
                  style={{
                    background: 'none', border: 'none',
                    color: 'var(--color-accent)',
                    fontSize: '0.875rem', fontWeight: 600,
                    cursor: 'pointer', padding: '6px 12px',
                    borderRadius: '8px', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,166,35,0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                >
                  {showMoreDest ? '↑ Show less' : 'View all →'}
                </button>
              </div>
              <div className="routes-grid">
                {(showMoreDest ? allDestinations : allDestinations.slice(0, 8)).map((dest, i) => (
                  <div key={i} className="route-card group cursor-pointer" onClick={() => { setCity(dest.city); handleSearch(dest.city); }}>
                    <div className="absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.06) 0%, transparent 60%)' }}></div>
                    <div className="w-full rounded-[12px] mb-3 relative overflow-hidden" style={{ height: 120 }}>
                      <img
                        src={dest.image}
                        alt={dest.city}
                        onError={(e) => { e.target.onerror = null; e.target.src = getImageFallback(dest.city) }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 25%, rgba(6,14,30,0.82) 100%)' }}></div>
                      <div className="absolute top-2 right-2">
                        <span className="text-[0.65rem] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(34,208,122,0.18)', color: '#22d07a', border: '1px solid rgba(34,208,122,0.3)' }}>
                          🏨 Hotels
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-3">
                        <div className="font-syne text-base font-bold text-white" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>{dest.city}</div>
                      </div>
                    </div>
                    <div className="text-xs text-text-muted">{dest.country}</div>
                    <div className="text-xs text-text-muted mt-0.5 opacity-70">Tap to search hotels →</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searched && !loading && (
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
              {dealPrice && dealDiscount && hotels.length > 0 && (
                <div className="mb-6 rounded-xl px-5 py-4 flex items-center justify-between" style={{ background: 'rgba(34,208,122,0.1)', border: '1px solid rgba(34,208,122,0.3)', color: '#22d07a' }}>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">🎉</div>
                    <div>
                      <div className="font-bold text-lg">Special Hotel Deal Applied!</div>
                      <div className="text-sm opacity-90">You unlocked up to {dealDiscount}% OFF. Stays starting from ₹{parseInt(dealPrice, 10).toLocaleString('en-IN')}/night.</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
                <div className="font-syne text-xl font-bold">
                  {hotels.length} hotels found in {city}
                </div>
              </div>

              <div className="routes-grid" style={{ gap: '1.5rem' }}>
                {hotels.length === 0 ? (
                  <div className="text-center text-text-muted py-12" style={{ gridColumn: '1/-1' }}>No hotels found for "{city}". Try Mumbai, Goa, Delhi, Bangalore, Chennai, or Dubai.</div>
                ) : hotels.map(hotel => (
                  <div key={hotel.id} className="route-card group cursor-pointer" onClick={() => handleHotelClick(hotel)}>
                    <div className="w-full rounded-[10px] mb-3 relative overflow-hidden" style={{ height: 120 }}>
                      <img
                        src={hotel.image || getImageFallback(hotel.city)}
                        alt={hotel.name}
                        onError={(e) => { e.target.onerror = null; e.target.src = getImageFallback(hotel.city) }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(10,22,40,0.8) 100%)' }}></div>
                      <div className="absolute bottom-2 left-3 flex gap-1">
                        {Array.from({ length: hotel.stars }, (_, i) => <span key={i} className="text-accent text-xs">★</span>)}
                      </div>
                    </div>
                    <div className="font-syne text-lg font-bold mb-1">{hotel.name}</div>
                    <div className="text-sm text-text-muted mb-1">{hotel.city}</div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded font-medium badge-direct">⭐ {hotel.rating}</span>
                      <span className="text-xs text-text-muted">{hotel.reviews.toLocaleString()} reviews</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {hotel.amenities.slice(0, 3).map(a => (
                        <span key={a} className="text-[0.7rem] px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-muted)' }}>{a}</span>
                      ))}
                      {hotel.amenities.length > 3 && <span className="text-[0.7rem] text-text-muted">+{hotel.amenities.length - 3}</span>}
                    </div>
                    <div className="font-syne text-xl font-bold text-accent">
                      ₹{(hotel.price * nights * rooms).toLocaleString('en-IN')}
                      <span className="text-sm text-text-muted font-normal"> total for {nights} night{nights > 1 ? 's' : ''} ({guests} guest{guests > 1 ? 's' : ''}, {rooms} room{rooms > 1 ? 's' : ''})</span>
                    </div>
                    <div className="text-xs text-text-muted">
                      ₹{hotel.price.toLocaleString('en-IN')} /room /night
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  )
}
