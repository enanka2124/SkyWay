import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PageHero from '../components/PageHero'

export default function Deals() {
  const [deals, setDeals] = useState([])
  const [filter, setFilter] = useState('All')
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    fetch('/api/deals')
      .then(r => r.json())
      .then(d => { if (d.success) setDeals(d.deals) })
      .catch(() => {})
  }, [])

  const filtered = filter === 'All' ? deals : deals.filter(d => d.category === filter)

  const getDealDates = (deal) => {
    let depart = new Date()
    let returnDate = new Date()
    if (deal.category === 'Weekend' || deal.title?.toLowerCase().includes('weekend')) {
      // Find next Saturday
      depart.setDate(depart.getDate() + ((6 - depart.getDay() + 7) % 7 || 7))
      returnDate = new Date(depart)
      returnDate.setDate(returnDate.getDate() + 1) // Sunday
    } else {
      depart.setDate(depart.getDate() + 1) // Tomorrow
      returnDate.setDate(depart.getDate() + 3) // 3 days trip
    }
    return {
      checkin: depart.toISOString().split('T')[0],
      checkout: returnDate.toISOString().split('T')[0]
    }
  }

  const navigateToFlight = (deal) => {
    const from = deal.from || 'Mumbai'
    const to = deal.to || 'Dubai'
    const dates = getDealDates(deal)
    navigate(`/?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&dealPrice=${deal.dealPrice}&discount=${deal.discount}&date=${dates.checkin}`)
  }

  const navigateToHotel = (deal) => {
    const city = deal.to || 'Dubai'
    const dates = getDealDates(deal)
    navigate(`/hotels?city=${encodeURIComponent(city)}&dealPrice=${deal.dealPrice}&discount=${deal.discount}&checkin=${dates.checkin}&checkout=${dates.checkout}`)
  }

  return (
    <>
      <Navbar />
      <PageHero
        line1="Upto 60% OFF"
        line2="Top Deals"
        badge="Flash Sale · Limited Time"
        subtitle="Book Flights and Hotels now and save big across top destinations!"
      />
      <section className="relative z-10" style={{ padding: '0 0 4rem' }}>
        <div className="container-main">

          {/* Decorative divider */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
            <div style={{ flex: 1, maxWidth: 120, height: 1, background: 'linear-gradient(to right, transparent, rgba(245,166,35,0.3))' }}></div>
            <span style={{ color: 'var(--color-accent)', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>✦ Browse by Category ✦</span>
            <div style={{ flex: 1, maxWidth: 120, height: 1, background: 'linear-gradient(to left, transparent, rgba(245,166,35,0.3))' }}></div>
          </div>

          <div className="flex justify-center" style={{ marginBottom: '3rem' }}>
            <div className="filter-group">
              {['All', 'Domestic', 'International', 'Weekend'].map(cat => (
                <button key={cat} className={`filter-btn ${filter === cat ? 'active' : ''}`} onClick={() => setFilter(cat)}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Subtle separator before deals grid */}
          <div style={{ width: '100%', height: 1, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.06), transparent)', marginBottom: '2.5rem' }}></div>

          <div className="routes-grid" style={{ maxWidth: 1100, margin: '0 auto', gap: '1.5rem' }}>
            {filtered.map(deal => (
              <div key={deal.id} className="route-card group">
                <div className="w-full rounded-[10px] mb-3 relative overflow-hidden" style={{ height: 140 }}>
                  <img
                    src={deal.image}
                    alt={deal.title}
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80' }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(10,22,40,0.85) 100%)' }}></div>
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: 'rgba(245,166,35,0.9)', color: '#0a1628' }}>
                    Upto {deal.discount}% OFF
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="font-syne text-lg font-bold">{deal.title}</div>
                  </div>
                </div>
                <div className="text-sm text-text-muted mb-2">{deal.description}</div>
                <div className="flex items-center gap-3 mb-2 mt-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-text-muted" style={{ lineHeight: 1, marginBottom: '2px' }}>Starts from</span>
                    <div className="flex items-center gap-2">
                      <span className="text-text-muted line-through text-sm">₹{deal.originalPrice.toLocaleString('en-IN')}</span>
                      <span className="font-syne text-xl font-bold text-accent">₹{deal.dealPrice.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-muted)' }}>{deal.category}</span>
                  <span className="text-xs text-text-muted">Valid till {new Date(deal.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </div>
                <div className="flex gap-2 border-t border-white/8 pt-3">
                  <button onClick={() => navigateToFlight(deal)} className="btn-accent flex-1 text-xs py-2">Find Flights</button>
                  <button onClick={() => navigateToHotel(deal)} className="btn-ghost flex-1 text-xs py-2">Find Hotels</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </>
  )
}
