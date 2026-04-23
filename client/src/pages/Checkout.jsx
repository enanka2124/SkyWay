import { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PaymentModal from '../components/PaymentModal'

export default function Checkout() {
  const location = useLocation()
  const navigate = useNavigate()
  const booking = location.state // { type: 'flight'|'hotel'|'deal', data: {...}, searchInfo: {...} }

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [passport, setPassport] = useState('')
  const [nationality, setNationality] = useState('')
  const [showPayment, setShowPayment] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [ticketId, setTicketId] = useState('')

  useEffect(() => { window.scrollTo(0, 0) }, [])

  if (!booking) {
    return (
      <>
        <Navbar />
        <section className="relative z-10" style={{ padding: '6rem 0 4rem', minHeight: '70vh' }}>
          <div className="container-main text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h1 className="font-syne text-2xl font-bold mb-3">No booking selected</h1>
            <p className="text-text-muted mb-6">Search for a flight, hotel, or deal first</p>
            <Link to="/" className="btn-accent no-underline px-8 py-3">Browse Flights</Link>
          </div>
        </section>
        <Footer />
      </>
    )
  }

  const type = booking.type
  const item = booking.data

  // ── Price Calculations ──
  const getFlightPricing = () => {
    const base = item.price
    const taxes = Math.round(base * 0.05)
    const fee = 299
    return { base, taxes, fee, total: base + taxes + fee }
  }

  const getHotelPricing = () => {
    const nights = booking.searchInfo?.nights || 1
    const base = item.price * nights
    const taxes = Math.round(base * 0.12)
    return { base, nights, perNight: item.price, taxes, total: base + taxes }
  }

  const getDealPricing = () => {
    const base = item.dealPrice
    const taxes = Math.round(base * 0.05)
    const fee = 299
    return { base, originalPrice: item.originalPrice, discount: item.discount, taxes, fee, total: base + taxes + fee }
  }

  const pricing = type === 'flight' ? getFlightPricing() : type === 'hotel' ? getHotelPricing() : getDealPricing()

  const handleProceed = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      alert('Please fill in your name and email to continue.')
      return
    }
    setShowPayment(true)
  }

  const handlePaymentSuccess = async (paymentData) => {
    setShowPayment(false)
    const id = type === 'hotel'
      ? 'HTL' + Math.random().toString(36).substr(2, 8).toUpperCase()
      : 'SKY' + Math.random().toString(36).substr(2, 8).toUpperCase()

    setTicketId(id)

    // Save to localStorage
    const trips = JSON.parse(localStorage.getItem('skyway_trips') || '[]')
    const tripEntry = {
      type: type === 'deal' ? 'flight' : type,
      ticketId: id,
      flight: type !== 'hotel' ? item : undefined,
      hotel: type === 'hotel' ? item : undefined,
      checkin: booking.searchInfo?.checkin,
      checkout: booking.searchInfo?.checkout,
      pricing: { total: pricing.total },
      passenger: { firstName, lastName, email, phone },
      paymentId: paymentData?.paymentId,
      bookedAt: new Date().toISOString(),
    }
    trips.push(tripEntry)
    localStorage.setItem('skyway_trips', JSON.stringify(trips))

    // Also try server booking
    try {
      if (type === 'flight' || type === 'deal') {
        await fetch('/api/bookings', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ flight: item, firstName, lastName, email, phone, passport, nationality }),
        })
      }
    } catch { /* already saved locally */ }

    setConfirmed(true)
  }

  return (
    <>
      <Navbar />
      <section className="relative z-10" style={{ padding: '5rem 0 4rem', minHeight: '80vh' }}>
        <div className="container-main" style={{ maxWidth: 1000, margin: '0 auto' }}>

          {!confirmed ? (
            <>
              {/* Page Header */}
              <div className="mb-8">
                <button onClick={() => navigate(-1)} className="text-text-muted text-sm flex items-center gap-2 mb-4 bg-transparent border-none cursor-pointer hover:text-white">
                  ← Back to {type === 'hotel' ? 'Hotels' : type === 'deal' ? 'Deals' : 'Search Results'}
                </button>
                <h1 className="font-syne text-[clamp(1.8rem,4vw,2.5rem)] font-[800]">
                  Review & <span className="text-accent">Checkout</span>
                </h1>
              </div>

              <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>

                {/* ── Left Column: Booking Details + Form ── */}
                <div className="flex flex-col gap-5">

                  {/* Booking Summary Card */}
                  <div className="glass-card" style={{ padding: '1.5rem 2rem' }}>
                    <h2 className="font-syne text-lg font-bold mb-4 flex items-center gap-2">
                      {type === 'hotel' ? '🏨' : '✈'} {type === 'deal' ? 'Deal' : type.charAt(0).toUpperCase() + type.slice(1)} Details
                    </h2>

                    {/* Flight / Deal details */}
                    {(type === 'flight' || type === 'deal') && (
                      <div>
                        {type === 'deal' && (
                          <div className="px-3 py-1.5 rounded-lg text-xs font-bold inline-block mb-3" style={{ background: 'rgba(245,166,35,0.15)', color: 'var(--color-accent)' }}>
                            🎉 {item.discount}% OFF — Save ₹{(item.originalPrice - item.dealPrice).toLocaleString('en-IN')}
                          </div>
                        )}
                        <div className="flex items-center gap-4 mb-3">
                          {item.icon && <div className="text-3xl">{item.icon}</div>}
                          <div className="flex items-center gap-3 flex-1 flex-wrap">
                            <div>
                              <div className="font-syne text-xl font-bold">{item.dep || '--'}</div>
                              <div className="text-sm text-text-muted">{item.from || item.title?.split('→')[0]?.trim()}</div>
                            </div>
                            <div className="flex-1 flex flex-col items-center" style={{ minWidth: 60 }}>
                              <div className="flex items-center w-full">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0"></div>
                                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.15)', margin: '0 4px' }}></div>
                                <div className="text-accent text-sm">✈</div>
                                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.15)', margin: '0 4px' }}></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0"></div>
                              </div>
                              <div className="text-xs text-text-muted mt-1">{item.duration || 'N/A'}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-syne text-xl font-bold">{item.arr || '--'}</div>
                              <div className="text-sm text-text-muted">{item.to || item.title?.split('→')[1]?.trim()}</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-text-muted">
                          {item.airline && <span>🛫 {item.airline} · {item.code}</span>}
                          {item.stops && <span className={`text-xs px-2 py-0.5 rounded font-medium ${item.stops === 'Direct' ? 'badge-direct' : 'badge-stop'}`}>{item.stops}</span>}
                          {item.baggage && <span>🧳 {item.baggage}</span>}
                          {item.meal && <span>🍽 {item.meal}</span>}
                          {item.category && <span>📁 {item.category}</span>}
                        </div>
                      </div>
                    )}

                    {/* Hotel details */}
                    {type === 'hotel' && (
                      <div>
                        <div className="flex gap-4 items-start">
                          {item.image && (
                            <div className="rounded-xl bg-cover bg-center shrink-0 overflow-hidden" style={{ width: 100, height: 80, backgroundImage: `url('${item.image}')` }}></div>
                          )}
                          <div>
                            <div className="font-syne text-lg font-bold">{item.name}</div>
                            <div className="text-sm text-text-muted mb-1">{item.city}</div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-0.5 rounded font-medium badge-direct">⭐ {item.rating}</span>
                              <span className="text-xs text-text-muted">{item.stars}★ · {item.reviews?.toLocaleString()} reviews</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-4 mt-4 flex-wrap text-sm">
                          <div className="flex flex-col px-4 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <span className="text-xs text-text-muted">Check-in</span>
                            <span className="font-medium">{booking.searchInfo?.checkin}</span>
                          </div>
                          <div className="flex flex-col px-4 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <span className="text-xs text-text-muted">Check-out</span>
                            <span className="font-medium">{booking.searchInfo?.checkout}</span>
                          </div>
                          <div className="flex flex-col px-4 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <span className="text-xs text-text-muted">Guests</span>
                            <span className="font-medium">{booking.searchInfo?.guests}</span>
                          </div>
                          <div className="flex flex-col px-4 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <span className="text-xs text-text-muted">Nights</span>
                            <span className="font-medium">{booking.searchInfo?.nights}</span>
                          </div>
                        </div>
                        {item.amenities && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {item.amenities.map(a => (
                              <span key={a} className="text-xs px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-muted)' }}>{a}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Traveller Details Form */}
                  <div className="glass-card" style={{ padding: '1.5rem 2rem' }}>
                    <h2 className="font-syne text-lg font-bold mb-4">👤 Traveller Details</h2>
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-text-muted tracking-wider uppercase">First Name *</label>
                          <input type="text" placeholder="John" value={firstName} onChange={e => setFirstName(e.target.value)} className="sky-input" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-text-muted tracking-wider uppercase">Last Name *</label>
                          <input type="text" placeholder="Doe" value={lastName} onChange={e => setLastName(e.target.value)} className="sky-input" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-text-muted tracking-wider uppercase">Email *</label>
                        <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="sky-input" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-text-muted tracking-wider uppercase">Phone</label>
                          <input type="tel" placeholder="+91 9876543210" value={phone} onChange={e => setPhone(e.target.value)} className="sky-input" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-text-muted tracking-wider uppercase">Passport / ID</label>
                          <input type="text" placeholder="Optional" value={passport} onChange={e => setPassport(e.target.value)} className="sky-input" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-text-muted tracking-wider uppercase">Nationality</label>
                        <select value={nationality} onChange={e => setNationality(e.target.value)} className="sky-input">
                          <option value="">Select Nationality</option>
                          <option>Indian</option><option>American</option><option>British</option><option>UAE</option><option>Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Right Column: Price Summary (Sticky) ── */}
                <div className="checkout-price-col" style={{ position: 'sticky', top: '5rem' }}>
                  <div className="glass-card" style={{ padding: '1.5rem 2rem' }}>
                    <h2 className="font-syne text-lg font-bold mb-5">💰 Price Summary</h2>

                    {(type === 'flight' || type === 'deal') && (
                      <div className="flex flex-col gap-2.5">
                        {type === 'deal' && (
                          <div className="price-line">
                            <span className="text-text-muted line-through">Original price</span>
                            <span className="text-text-muted line-through">₹{pricing.originalPrice.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        <div className="price-line"><span>Base fare</span><span>₹{pricing.base.toLocaleString('en-IN')}</span></div>
                        <div className="price-line"><span>Taxes & fees (5%)</span><span>₹{pricing.taxes.toLocaleString('en-IN')}</span></div>
                        <div className="price-line"><span>Convenience fee</span><span>₹{pricing.fee}</span></div>
                        <div className="border-t border-white/[0.08] my-2"></div>
                        <div className="price-line total"><span>Total</span><span>₹{pricing.total.toLocaleString('en-IN')}</span></div>
                      </div>
                    )}

                    {type === 'hotel' && (
                      <div className="flex flex-col gap-2.5">
                        <div className="price-line"><span>₹{pricing.perNight.toLocaleString('en-IN')} × {pricing.nights} night{pricing.nights > 1 ? 's' : ''}</span><span>₹{pricing.base.toLocaleString('en-IN')}</span></div>
                        <div className="price-line"><span>Taxes (12%)</span><span>₹{pricing.taxes.toLocaleString('en-IN')}</span></div>
                        <div className="border-t border-white/[0.08] my-2"></div>
                        <div className="price-line total"><span>Total</span><span>₹{pricing.total.toLocaleString('en-IN')}</span></div>
                      </div>
                    )}

                    <button className="confirm-btn" onClick={handleProceed} style={{ marginTop: '1.5rem' }}>
                      Proceed to Payment →
                    </button>

                    <div className="flex items-center gap-2 mt-4 text-xs text-text-muted justify-center">
                      <span>🔒</span>
                      <span>256-bit SSL encrypted · Secured by Razorpay</span>
                    </div>
                  </div>

                  {/* Trust Badges */}
                  <div className="flex items-center justify-center gap-4 mt-4 text-xs text-text-muted flex-wrap">
                    <span>✅ Free Cancellation</span>
                    <span>✅ Instant Confirmation</span>
                    <span>✅ 24/7 Support</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ── Confirmation Page ── */
            <div style={{ maxWidth: 580, margin: '4rem auto 3rem' }}>
              <div className="glass-card text-center" style={{ padding: '3.5rem 2.5rem 3rem' }}>

                {/* Success Icon */}
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto" style={{ background: 'rgba(34,208,122,0.12)', border: '2px solid #22d07a', marginBottom: '1.75rem' }}>✓</div>
                <h1 className="font-syne text-3xl font-bold" style={{ marginBottom: '0.75rem' }}>Booking Confirmed!</h1>
                <p className="text-text-muted" style={{ fontSize: '1.05rem', marginBottom: '2rem' }}>Your {type === 'hotel' ? 'hotel reservation' : 'flight ticket'} has been confirmed.</p>

                {/* Ticket Badge */}
                <div className="ticket-badge" style={{ fontSize: '1.2rem', padding: '1rem 2.5rem' }}>{ticketId}</div>

                {/* Spacer */}
                <div style={{ height: '2.5rem' }}></div>

                {/* Booking Details Card */}
                <div className="rounded-2xl text-left" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '1.75rem 2rem' }}>
                  <div className="text-xs font-medium text-text-muted tracking-wider uppercase" style={{ marginBottom: '0.5rem' }}>Booked by</div>
                  <div className="font-bold text-lg">{firstName} {lastName}</div>
                  <div className="text-sm text-text-muted" style={{ marginTop: '0.25rem' }}>{email}</div>

                  <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '1.25rem 0' }}></div>

                  <div className="text-xs font-medium text-text-muted tracking-wider uppercase" style={{ marginBottom: '0.5rem' }}>Total Paid</div>
                  <div className="font-syne text-3xl font-bold text-accent">₹{pricing.total.toLocaleString('en-IN')}</div>
                </div>

                {/* Spacer */}
                <div style={{ height: '2.5rem' }}></div>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-center flex-wrap">
                  <Link to="/my-trips" className="btn-accent no-underline px-8 py-3.5 text-base">View My Trips</Link>
                  <Link to="/" className="btn-ghost no-underline px-8 py-3.5 text-base">Book Another</Link>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {showPayment && (
        <PaymentModal
          amount={pricing.total}
          bookingInfo={{
            from: item.from || item.title?.split('→')[0]?.trim() || item.city,
            to: item.to || item.title?.split('→')[1]?.trim() || '',
            airline: item.airline || item.name || 'SkyWay',
          }}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPayment(false)}
        />
      )}

      <Footer />
    </>
  )
}
