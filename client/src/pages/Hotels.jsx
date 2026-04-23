import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function Hotels() {
  const [city, setCity] = useState('')
  const [checkin, setCheckin] = useState('')
  const [checkout, setCheckout] = useState('')
  const [guests, setGuests] = useState(2)
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    const today = new Date()
    const off = today.getTimezoneOffset() * 60000
    const iso = (d) => new Date(d - off).toISOString().split('T')[0]
    setCheckin(iso(today))
    const next = new Date(); next.setDate(next.getDate() + 2)
    setCheckout(iso(next))
  }, [])

  const handleSearch = async () => {
    if (!city.trim()) { alert('Please enter a city'); return }
    setLoading(true); setSearched(true)
    try {
      const res = await fetch(`/api/hotels?city=${encodeURIComponent(city)}&checkin=${checkin}&checkout=${checkout}&guests=${guests}`)
      const data = await res.json()
      if (data.success) setHotels(data.hotels)
    } catch { setHotels([]) }
    setLoading(false)
  }

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
        searchInfo: { checkin, checkout, guests, nights },
      }
    })
  }

  return (
    <>
      <Navbar />
      <section className="relative z-10" style={{ padding: '4rem 0 4rem' }}>
        <div className="container-main">
          <h1 className="font-syne text-[clamp(2rem,5vw,3.5rem)] font-[800] text-center mb-2">
            Find Your <span className="text-accent">Perfect Stay</span>
          </h1>
          <p className="text-text-muted text-center mb-10 text-lg">Search hotels by city, dates, and guests</p>

          {/* Search */}
          <div className="glass-card" style={{ maxWidth: 900, margin: '0 auto 3.5rem' }}>
            <div className="search-bottom-row">
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
                <label className="text-xs font-medium text-text-muted tracking-wider uppercase">Guests</label>
                <select value={guests} onChange={e => setGuests(Number(e.target.value))} className="sky-input">
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>
              <button onClick={handleSearch} className="search-cta">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                Search
              </button>
            </div>
          </div>

          {/* Results */}
          {loading && <div className="loading-bar" style={{ maxWidth: 900, margin: '0 auto' }}></div>}

          {searched && !loading && (
            <div className="routes-grid" style={{ maxWidth: 1100, margin: '0 auto', gap: '1.5rem' }}>
              {hotels.length === 0 ? (
                <div className="text-center text-text-muted py-12" style={{ gridColumn: '1/-1' }}>No hotels found for "{city}". Try Mumbai, Goa, Delhi, Bangalore, Chennai, or Dubai.</div>
              ) : hotels.map(hotel => (
                <div key={hotel.id} className="route-card group" onClick={() => handleHotelClick(hotel)}>
                  <div className="w-full rounded-[10px] mb-3 bg-cover bg-center relative overflow-hidden" style={{ height: 120, backgroundImage: `url('${hotel.image}')` }}>
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
                  <div className="font-syne text-xl font-bold text-accent">₹{hotel.price.toLocaleString('en-IN')}<span className="text-sm text-text-muted font-normal"> /night</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  )
}
