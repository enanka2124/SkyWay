import { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PaymentModal from '../components/PaymentModal'

export default function Checkout() {
  const { user } = useAuth()
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
  const [paymentFailed, setPaymentFailed] = useState(false)
  const [paymentFailureInfo, setPaymentFailureInfo] = useState(null)
  const [ticketId, setTicketId] = useState('')

  const handlePhoneChange = (e) => {
    const onlyNumbers = e.target.value.replace(/\D/g, '').slice(0, 10)
    setPhone(onlyNumbers)
  }

  const handlePassportChange = (e) => {
    const cleanPassport = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20).toUpperCase()
    setPassport(cleanPassport)
  }

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

  // ── Parse passenger count from e.g. "2 Adults, 1 Child" ──────────────────
  const parsePassengers = (str) => {
    if (!str || typeof str !== 'string') return 1
    // Sum all numbers in the string: "2 Adults, 1 Child" → 3
    const nums = str.match(/\d+/g)
    if (!nums) return 1
    return nums.reduce((s, n) => s + parseInt(n, 10), 0)
  }

  // Round-trip date gap surcharge:
  // Each full 7 days of gap beyond the first 3 days → +6% on base
  const getRoundTripSurcharge = (depDate, retDate) => {
    if (!depDate || !retDate) return 0
    const dep = new Date(depDate)
    const ret = new Date(retDate)
    const days = Math.max(0, Math.ceil((ret - dep) / (1000 * 60 * 60 * 24)))
    if (days <= 3) return 0
    const extraWeeks = Math.floor((days - 3) / 7) // each 7-day block beyond first 3 days
    return Math.min(extraWeeks * 0.06, 0.36) // cap at +36% (6 weeks)
  }

  //  Price Calculations 
  const getFlightPricing = () => {
    const passengerCount = parsePassengers(item.passengers || booking.passengers)
    const pricePerPerson = item.price  // base price is always per person

    // Round-trip surcharge on per-person base
    const surchargeRate = item.tripType === 'round'
      ? getRoundTripSurcharge(item.searchedDate, item.returnDate)
      : 0
    const surchargePerPerson = Math.round(pricePerPerson * surchargeRate)
    const effectivePerPerson = pricePerPerson + surchargePerPerson

    const base = effectivePerPerson * passengerCount
    const taxes = Math.round(base * 0.18)
    const fee = 149
    if (item.isDeal && item.discount) {
      const discountVal = Math.round((base + taxes + fee) * (item.discount / 100))
      return {
        base, taxes, fee, discount: discountVal,
        total: (base + taxes + fee) - discountVal,
        passengerCount, pricePerPerson: effectivePerPerson,
        surchargeRate, surchargePerPerson,
        isRoundTrip: item.tripType === 'round',
      }
    }
    return {
      base, taxes, fee, discount: 0, total: base + taxes + fee,
      passengerCount, pricePerPerson: effectivePerPerson,
      surchargeRate, surchargePerPerson,
      isRoundTrip: item.tripType === 'round',
    }
  }

  const getHotelPricing = () => {
    const nights = booking.searchInfo?.nights || 1
    const guests = booking.searchInfo?.guests || 1
    const rooms = booking.searchInfo?.rooms || Math.ceil(guests / 2)
    const base = item.price * nights * rooms
    const taxes = Math.round(base * 0.12)
    const fee = 0
    if (item.isDeal && item.discount) {
      const discountVal = Math.round((base + taxes + fee) * (item.discount / 100))
      return { base, nights, guests, rooms, perNight: item.price, taxes, fee, discount: discountVal, total: (base + taxes + fee) - discountVal }
    }
    return { base, nights, guests, rooms, perNight: item.price, taxes, fee, discount: 0, total: base + taxes + fee }
  }

  const pricing = type === 'flight' || type === 'deal' ? getFlightPricing() : getHotelPricing()

  const handleProceed = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      alert('Please fill in your name and email to continue.')
      return
    }
    setShowPayment(true)
  }

  const handlePaymentSuccess = async (paymentData) => {
    setShowPayment(false)
    const id = paymentData?.bookingId || (
      type === 'hotel'
        ? 'HTL' + Math.random().toString(36).substr(2, 8).toUpperCase()
        : 'SKY' + Math.random().toString(36).substr(2, 8).toUpperCase()
    )

    setTicketId(id)

    // Save to localStorage using user-specific key
    const tripsKey = `skyway_trips_${user?._id || 'guest'}`
    const trips = JSON.parse(localStorage.getItem(tripsKey) || '[]')
    const tripEntry = {
      type: type === 'deal' ? 'flight' : type,
      ticketId: id,
      flight: type !== 'hotel' ? item : undefined,
      hotel: type === 'hotel' ? item : undefined,
      checkin: booking.searchInfo?.checkin,
      checkout: booking.searchInfo?.checkout,
      pricing: { ...pricing },
      passenger: { firstName, lastName, email, phone },
      paymentId: paymentData?.paymentId,
      paymentMethod: paymentData?.method || 'card',
      paymentStatus: 'confirmed',
      bookedAt: new Date().toISOString(),
    }
    trips.push(tripEntry)
    localStorage.setItem(tripsKey, JSON.stringify(trips))

    // Also try server booking
    const accountEmail = user?.email || email
    try {
      await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          flight: type !== 'hotel' ? item : undefined,
          hotel: type === 'hotel' ? item : undefined,
          pricing,
          firstName, lastName,
          email: accountEmail,
          phone, passport, nationality,
          paymentId: paymentData?.paymentId,
          paymentMethod: paymentData?.method || 'card',
        }),
      })
    } catch { /* already saved locally */ }

    setConfirmed(true)
  }

  const handlePaymentFailed = async (paymentData) => {
    setShowPayment(false)
    const failedId = paymentData?.paymentId || 'FAIL_' + Math.random().toString(36).substr(2, 8).toUpperCase()

    // Save failed booking to localStorage for history
    const tripsKey = `skyway_trips_${user?._id || 'guest'}`
    const trips = JSON.parse(localStorage.getItem(tripsKey) || '[]')
    const failedEntry = {
      type: type === 'deal' ? 'flight' : type,
      ticketId: failedId,
      flight: type !== 'hotel' ? item : undefined,
      hotel: type === 'hotel' ? item : undefined,
      checkin: booking.searchInfo?.checkin,
      checkout: booking.searchInfo?.checkout,
      pricing: { ...pricing },
      passenger: { firstName, lastName, email, phone },
      paymentId: failedId,
      paymentMethod: paymentData?.method || 'upi',
      paymentStatus: 'failed',
      failureReason: paymentData?.failureReason,
      failureCode: paymentData?.failureCode,
      bookedAt: new Date().toISOString(),
    }
    trips.push(failedEntry)
    localStorage.setItem(tripsKey, JSON.stringify(trips))

    setPaymentFailureInfo({
      reason: paymentData?.failureReason,
      code: paymentData?.failureCode,
      paymentId: failedId,
    })
    setPaymentFailed(true)
  }

  return (
    <>
      <Navbar />
      <section className="relative z-10" style={{ padding: '5rem 0 4rem', minHeight: '80vh' }}>
        <div className="container-main" style={{ maxWidth: 1000, margin: '0 auto' }}>

          {!confirmed && !paymentFailed ? (
            <>
              {/* Page Header */}
              <div className="mb-8">
                <button onClick={() => navigate(-1)} className="text-text-muted text-sm flex items-center gap-2 mb-4 bg-transparent border-none cursor-pointer hover:text-white">
                  ← Back to {type === 'hotel' ? 'Hotels' : type === 'deal' ? 'Deals' : 'Search Results'}
                </button>
                <h1 className="font-syne text-[clamp(1.8rem,4vw,2.5rem)] font-extrabold">
                  Review & <span className="text-accent">Checkout</span>
                </h1>
              </div>

              {showPayment ? (
                <PaymentModal
                  amount={pricing.total}
                  bookingInfo={{
                    from: item.from || item.title?.split('→')[0]?.trim() || item.city,
                    to: item.to || item.title?.split('→')[1]?.trim() || '',
                    airline: item.airline || item.name || 'SkyWay',
                    type,
                  }}
                  passengerInfo={{ firstName, lastName, email, phone }}
                  onSuccess={handlePaymentSuccess}
                  onPaymentFailed={handlePaymentFailed}
                  onClose={() => setShowPayment(false)}
                />
              ) : (
                <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>

                  {/*  Left Column: Booking Details + Form  */}
                  <div className="flex flex-col gap-5">

                    {/* Booking Summary Card */}
                    <div className="glass-card" style={{ padding: '1.5rem 2rem' }}>
                    <h2 className="font-syne text-lg font-bold mb-4 flex items-center gap-2 text-accent">
                      {type === 'hotel' ? '🏨' : '✈'} {type === 'deal' ? 'Deal' : type.charAt(0).toUpperCase() + type.slice(1)} Details
                    </h2>

                    {/* Flight / Deal details */}
                    {(type === 'flight' || type === 'deal') && (
                      <div>
                        {item.isDeal && item.discount > 0 && (
                          <div className="px-3 py-1.5 rounded-lg text-xs font-bold inline-block mb-3" style={{ background: 'rgba(34,208,122,0.15)', color: '#22d07a' }}>
                            🎉 Coupon Applied: {item.discount}% OFF! You saved ₹{pricing.discount?.toLocaleString('en-IN')}
                          </div>
                        )}
                        <div className="flex items-center gap-4 mb-3">
                          {item.icon && <div className="text-3xl">{item.icon}</div>}
                          <div className="flex items-center gap-3 flex-1 flex-wrap">
                            <div>
                              {item.searchedDate && <div className="text-xs font-bold text-accent mb-0.5">{new Date(item.searchedDate).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</div>}
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
                        {item.tripType === 'round' && item.returnDate && (
                          <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                            <div className="text-xs font-bold text-accent mb-2">RETURN FLIGHT</div>
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <div className="text-xs font-bold text-accent mb-0.5">{new Date(item.returnDate).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                <div className="font-syne text-lg font-bold">{item.arr || '--'}</div>
                                <div className="text-sm text-text-muted">{item.to || item.title?.split('→')[1]?.trim()}</div>
                              </div>
                              <div className="text-accent text-sm" style={{ transform: 'rotate(180deg)' }}>✈</div>
                              <div className="flex-1 text-right">
                                <div className="font-syne text-lg font-bold">{item.dep || '--'}</div>
                                <div className="text-sm text-text-muted">{item.from || item.title?.split('→')[0]?.trim()}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Hotel details */}
                    {type === 'hotel' && (
                      <div>
                        {item.isDeal && item.discount > 0 && (
                          <div className="px-3 py-1.5 rounded-lg text-xs font-bold inline-block mb-4" style={{ background: 'rgba(34,208,122,0.15)', color: '#22d07a' }}>
                            🎉 Coupon Applied: {item.discount}% OFF! You saved ₹{pricing.discount?.toLocaleString('en-IN')}
                          </div>
                        )}
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
                            <span className="font-medium">{(booking.checkin || booking.searchInfo?.checkin) ? `${new Date(booking.checkin || booking.searchInfo.checkin).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} (2:00 PM)` : '--'}</span>
                          </div>
                          <div className="flex flex-col px-4 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <span className="text-xs text-text-muted">Check-out</span>
                            <span className="font-medium">{(booking.checkout || booking.searchInfo?.checkout) ? `${new Date(booking.checkout || booking.searchInfo.checkout).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} (11:00 AM)` : '--'}</span>
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
                    <h2 className="font-syne text-lg font-bold mb-4 text-accent">👤 Traveller Details</h2>
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
                          <input 
                            type="tel" 
                            placeholder="+91 9876543210" 
                            value={phone} 
                            onChange={handlePhoneChange} 
                            className="sky-input" 
                            maxLength={10} 
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-text-muted tracking-wider uppercase">Passport / ID</label>
                          <input 
                            type="text" 
                            placeholder="Optional" 
                            value={passport} 
                            onChange={handlePassportChange} 
                            className="sky-input" 
                            maxLength={20} 
                          />
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

                {/*  Right Column: Price Summary (Sticky)  */}
                <div className="checkout-price-col" style={{ position: 'sticky', top: '5rem' }}>
                  <div className="glass-card" style={{ padding: '1.5rem 2rem' }}>
                    <h2 className="font-syne text-lg font-bold mb-5 text-accent">💰 Price Summary</h2>

                    {(type === 'flight' || type === 'deal') && (
                      <div className="flex flex-col gap-2.5">
                        {/* Per-person breakdown */}
                        <div className="price-line" style={{ fontSize: '0.8rem' }}>
                          <span>₹{pricing.pricePerPerson.toLocaleString('en-IN')} × {pricing.passengerCount} passenger{pricing.passengerCount > 1 ? 's' : ''}</span>
                          <span>₹{(pricing.pricePerPerson * pricing.passengerCount).toLocaleString('en-IN')}</span>
                        </div>
                        {/* Round-trip surcharge if applicable */}
                        {pricing.isRoundTrip && pricing.surchargePerPerson > 0 && (
                          <div className="price-line" style={{ fontSize: '0.8rem', color: 'rgba(245,166,35,0.8)' }}>
                            <span>Round-trip surcharge (incl. above)</span>
                            <span>+₹{(pricing.surchargePerPerson * pricing.passengerCount).toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        <div className="price-line"><span>Base fare</span><span>₹{pricing.base.toLocaleString('en-IN')}</span></div>
                        <div className="price-line"><span>Taxes & fees (18%)</span><span>₹{pricing.taxes.toLocaleString('en-IN')}</span></div>
                        <div className="price-line"><span>Convenience fee</span><span>₹{pricing.fee}</span></div>
                        {pricing.discount > 0 && (
                          <div className="price-line font-bold" style={{ color: '#22d07a' }}>
                            <span>Coupon Savings ({item.discount}%)</span>
                            <span>-₹{pricing.discount.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        <div className="border-t border-white/8 my-2"></div>
                        <div className="price-line total"><span>Total</span><span>₹{pricing.total.toLocaleString('en-IN')}</span></div>
                        {pricing.passengerCount > 1 && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textAlign: 'right' }}>
                            ≈ ₹{Math.round(pricing.total / pricing.passengerCount).toLocaleString('en-IN')} per person
                          </div>
                        )}
                      </div>
                    )}


                    {type === 'hotel' && (
                      <div className="flex flex-col gap-2.5">
                        <div className="price-line"><span>₹{pricing.perNight.toLocaleString('en-IN')} × {pricing.nights} night{pricing.nights > 1 ? 's' : ''} × {pricing.rooms} room{pricing.rooms > 1 ? 's' : ''}</span><span>₹{pricing.base.toLocaleString('en-IN')}</span></div>
                        <div className="price-line"><span>Taxes & fees</span><span>₹{pricing.taxes.toLocaleString('en-IN')}</span></div>
                        {pricing.discount > 0 && (
                          <div className="price-line font-bold" style={{ color: '#22d07a' }}>
                            <span>Coupon Savings ({item.discount}%)</span>
                            <span>-₹{pricing.discount.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        <div className="border-t border-white/8 my-2"></div>
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
              )}
            </>
          ) : (
            /*  Confirmation Page  */
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
                <div className="rounded-2xl text-left flex flex-col items-stretch gap-0" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                  
                  {/* Trip Info Section */}
                  <div style={{ padding: '1.5rem 2.5rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {type === 'flight' || type === 'deal' ? (
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center flex-wrap gap-4">
                          <div>
                            <div className="text-xs font-medium text-text-muted tracking-wider uppercase mb-1">Departure</div>
                            <div className="font-syne text-xl font-bold">{item.dep || '--'}</div>
                            <div className="text-sm">{item.from || item.title?.split('→')[0]?.trim()}</div>
                            {item.searchedDate && <div className="text-xs text-accent mt-1">{new Date(item.searchedDate).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</div>}
                          </div>
                          <div className="text-accent text-2xl opacity-50">✈</div>
                          <div className="text-right">
                            <div className="text-xs font-medium text-text-muted tracking-wider uppercase mb-1">Arrival</div>
                            <div className="font-syne text-xl font-bold">{item.arr || '--'}</div>
                            <div className="text-sm">{item.to || item.title?.split('→')[1]?.trim()}</div>
                          </div>
                        </div>
                        {item.tripType === 'round' && item.returnDate && (
                          <div className="pt-4 mt-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                            <div className="flex justify-between items-center flex-wrap gap-4">
                              <div>
                                <div className="text-xs font-medium text-text-muted tracking-wider uppercase mb-1">Return</div>
                                <div className="font-syne text-xl font-bold">{item.arr || '--'}</div>
                                <div className="text-sm">{item.to || item.title?.split('→')[1]?.trim()}</div>
                                <div className="text-xs text-accent mt-1">{new Date(item.returnDate).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</div>
                              </div>
                              <div className="text-accent text-2xl opacity-50" style={{ transform: 'rotate(180deg)' }}>✈</div>
                              <div className="text-right">
                                <div className="text-xs font-medium text-text-muted tracking-wider uppercase mb-1">Arrival</div>
                                <div className="font-syne text-xl font-bold">{item.dep || '--'}</div>
                                <div className="text-sm">{item.from || item.title?.split('→')[0]?.trim()}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="font-syne text-xl font-bold">{item.name}</div>
                        <div className="text-sm text-text-muted">📍 {item.city}</div>
                        <div className="flex gap-6 mt-2">
                          <div>
                            <div className="text-xs font-medium text-text-muted tracking-wider uppercase mb-0.5">Check-in</div>
                            <div className="text-sm font-bold text-accent">{(booking.checkin || booking.searchInfo?.checkin) ? `${new Date(booking.checkin || booking.searchInfo.checkin).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} (2:00 PM)` : '--'}</div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-text-muted tracking-wider uppercase mb-0.5">Check-out</div>
                            <div className="text-sm font-bold text-accent">{(booking.checkout || booking.searchInfo?.checkout) ? `${new Date(booking.checkout || booking.searchInfo.checkout).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} (11:00 AM)` : '--'}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment Info Section */}
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6" style={{ padding: '1.5rem 2.5rem' }}>
                    <div>
                      <div className="text-xs font-medium text-text-muted tracking-wider uppercase mb-1">Booked by</div>
                      <div className="font-bold text-xl">{firstName} {lastName}</div>
                      <div className="text-sm text-text-muted mt-1">{email}</div>
                    </div>

                    <div className="hidden md:block w-px h-16" style={{ background: 'rgba(255,255,255,0.1)' }}></div>
                    <div className="md:hidden h-px w-full" style={{ background: 'rgba(255,255,255,0.1)' }}></div>

                    <div className="text-left md:text-right w-full md:w-auto">
                      <div className="text-xs font-medium text-text-muted tracking-wider uppercase mb-1">Total Paid</div>
                      <div className="font-syne text-3xl font-bold text-accent">₹{pricing.total.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                </div>

                {/* Spacer */}
                <div style={{ height: '3.5rem' }}></div>

                {/* Action Buttons */}
                <div className="flex gap-5 justify-center flex-wrap">
                  <Link to="/my-trips" className="btn-accent no-underline px-8 py-3.5 text-base font-semibold" style={{ minWidth: '180px' }}>View My Trips</Link>
                  <Link to="/" className="btn-ghost no-underline px-8 py-3.5 text-base font-semibold" style={{ minWidth: '180px' }}>Book Another</Link>
                </div>
              </div>
            </div>
          )}

          {/* ── Payment Failed Screen ──────────────────────────────── */}
          {paymentFailed && paymentFailureInfo && (
            <div className="text-center py-12 max-w-xl mx-auto">
              {/* Failed Icon */}
              <div style={{
                width: 90, height: 90, borderRadius: '50%', margin: '0 auto 1.5rem',
                background: 'rgba(255,70,70,0.1)', border: '2px solid rgba(255,70,70,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem',
              }}>✕</div>

              <h1 className="font-syne text-3xl font-extrabold mb-2" style={{ color: '#ff4646' }}>Payment Failed</h1>
              <p className="text-text-muted mb-6">Your transaction could not be processed by the bank.</p>

              {/* Failure detail card */}
              <div style={{
                background: 'rgba(255,70,70,0.06)', border: '1px solid rgba(255,70,70,0.2)',
                borderRadius: 16, padding: '1.5rem', marginBottom: '1.75rem', textAlign: 'left',
              }}>
                <div style={{ fontWeight: 700, color: '#ff8080', marginBottom: '0.5rem', fontSize: '1rem' }}>
                  {paymentFailureInfo.code === 'insufficient_funds' ? '💳 Insufficient Balance' :
                    paymentFailureInfo.code === 'daily_limit_exceeded' ? '🚫 Daily Limit Exceeded' : '❌ Transaction Declined'}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '0.75rem' }}>
                  {paymentFailureInfo.reason}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
                  <span>Reference ID</span>
                  <span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)' }}>{paymentFailureInfo.paymentId}</span>
                </div>
              </div>

              {/* No deduction notice */}
              <div style={{
                background: 'rgba(34,208,122,0.06)', border: '1px solid rgba(34,208,122,0.2)',
                borderRadius: 12, padding: '0.875rem 1.25rem', marginBottom: '1.75rem',
                display: 'flex', alignItems: 'center', gap: '0.75rem',
              }}>
                <span style={{ fontSize: '1.25rem' }}>✓</span>
                <span style={{ color: '#22d07a', fontSize: '0.875rem', fontWeight: 600 }}>
                  No amount has been deducted from your account.
                </span>
              </div>

              {/* What to do next */}
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginBottom: '2rem' }}>
                💡 Try a different payment method, ensure sufficient balance, or contact your bank.
                <br />A failure notification has been sent to <strong style={{ color: 'rgba(255,255,255,0.6)' }}>{email}</strong>.
              </div>

              <div className="flex gap-4 justify-center flex-wrap">
                <button
                  className="btn-accent px-8 py-3"
                  onClick={() => { setPaymentFailed(false); setPaymentFailureInfo(null); setShowPayment(true) }}
                >
                  Try Again
                </button>
                <Link to="/" className="btn-ghost no-underline px-8 py-3">Go Home</Link>
              </div>
            </div>
          )}

        </div>
      </section>

      <Footer />
    </>
  )
}
