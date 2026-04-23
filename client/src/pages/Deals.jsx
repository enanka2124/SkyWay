import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

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

  const handleDealClick = (deal) => {
    if (!user) {
      navigate('/signin', { state: { from: '/checkout', bookingState: { type: 'deal', data: deal } } })
      return
    }
    navigate('/checkout', { state: { type: 'deal', data: deal } })
  }

  return (
    <>
      <Navbar />
      <section className="relative z-10" style={{ padding: '5rem 0 4rem' }}>
        <div className="container-main">
          <h1 className="font-syne text-[clamp(2rem,5vw,3.5rem)] font-[800] text-center mb-4">
            Hot <span className="text-accent">Deals</span>
          </h1>
          <p className="text-text-muted text-center text-lg" style={{ marginBottom: '2rem' }}>Limited-time flight offers you don't want to miss</p>

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
              <div key={deal.id} className="route-card group cursor-pointer" onClick={() => handleDealClick(deal)}>
                <div className="w-full rounded-[10px] mb-3 bg-cover bg-center relative overflow-hidden" style={{ height: 140, backgroundImage: `url('${deal.image}')` }}>
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(10,22,40,0.85) 100%)' }}></div>
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: 'rgba(245,166,35,0.9)', color: '#0a1628' }}>
                    {deal.discount}% OFF
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="font-syne text-lg font-bold">{deal.title}</div>
                  </div>
                </div>
                <div className="text-sm text-text-muted mb-2">{deal.description}</div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-text-muted line-through text-sm">₹{deal.originalPrice.toLocaleString('en-IN')}</span>
                  <span className="font-syne text-xl font-bold text-accent">₹{deal.dealPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-muted)' }}>{deal.category}</span>
                  <span className="text-xs text-text-muted">Valid till {new Date(deal.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
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
