import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

// City destination images
const cityImages = {
  'Mumbai': 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80',
  'Goa': 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80',
  'Delhi': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80',
  'Bangalore': 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&q=80',
  'Chennai': 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&q=80',
  'Dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
  'Jaipur': 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&q=80',
  'Kolkata': 'https://images.unsplash.com/photo-1558431382-27e303142255?w=800&q=80',
  'Hyderabad': 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80',
  'Manali': 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80',
  'Singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80',
  'Bangkok': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80',
  'Udaipur': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80',
  'Pune': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
  'Ahmedabad': 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
  'London': 'https://images.unsplash.com/photo-1513635269975-5969336cd190?w=800&q=80',
  'New York': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80',
  'Paris': 'https://images.unsplash.com/photo-1502602898657-3e907a5ea071?w=800&q=80',
  'Tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
  'Bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
  'Colombo': 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=800&q=80',
  'Kathmandu': 'https://images.unsplash.com/photo-1581403067825-7bdf9c6e5c9b?w=800&q=80',
  'Kochi': 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80',
  'Varanasi': 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
  'Srinagar': 'https://images.unsplash.com/photo-1554120540-2f78b7d5e343?w=800&q=80',
  'Agra': 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&q=80',
  'Amritsar': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80',
}

const getDestImage = (trip) => {
  const dest = trip.type === 'hotel' ? trip.hotel?.city : trip.flight?.to
  if (!dest) return null
  for (const [city, url] of Object.entries(cityImages)) {
    if (dest.toLowerCase().includes(city.toLowerCase())) return url
  }
  return null
}

// Convert a server booking document into the client trip format (same as MyTrips)
const serverBookingToTrip = (b) => ({
  ticketId: b.ticketId,
  type: b.bookingType || 'flight',
  flight: b.flight ? {
    airline: b.flight.airline, code: b.flight.code,
    from: b.flight.from, to: b.flight.to,
    dep: b.flight.dep, arr: b.flight.arr,
    duration: b.flight.duration, stops: b.flight.stops,
  } : undefined,
  hotel: b.hotel ? {
    name: b.hotel.name, city: b.hotel.city,
    stars: b.hotel.stars, price: b.hotel.price,
  } : undefined,
  pricing: {
    base: b.pricing?.baseFare,
    taxes: b.pricing?.taxes,
    fee: b.pricing?.convenienceFee,
    discount: b.pricing?.discount,
    total: b.pricing?.total,
  },
  passenger: b.passenger,
  status: b.paymentStatus === 'cancelled' ? 'cancelled' : 'confirmed',
  cancelledAt: b.cancelledAt || null,
  bookedAt: b.bookedAt,
  _source: 'server',
})

export default function TripDetails() {
  const { ticketId } = useParams()
  const { state: locationState } = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [trip, setTrip] = useState(locationState || null)
  const [loading, setLoading] = useState(!locationState)
  const [notFound, setNotFound] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelDone, setCancelDone] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  // If no state passed (e.g. direct URL access), fetch from server
  useEffect(() => {
    if (trip) return
    if (!user) return
    const fetchTrip = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/bookings?email=${encodeURIComponent(user.email)}`)
        const data = await res.json()
        if (data.success && Array.isArray(data.bookings)) {
          const found = data.bookings.find(b => b.ticketId === ticketId)
          if (found) {
            setTrip(serverBookingToTrip(found))
          } else {
            // Fall back to localStorage
            const tripsKey = `skyway_trips_${user._id}`
            const local = JSON.parse(localStorage.getItem(tripsKey) || '[]')
            const localFound = local.find(t => t.ticketId === ticketId)
            if (localFound) setTrip(localFound)
            else setNotFound(true)
          }
        } else {
          setNotFound(true)
        }
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetchTrip()
  }, [ticketId, user])

  const handleCancel = async () => {
    setCancelling(true)
    const cancelledAt = new Date().toISOString()
    try {
      await fetch(`/api/bookings/${ticketId}/cancel`, { method: 'PATCH' })
    } catch { /* update locally anyway */ }
    // Update localStorage
    if (user) {
      const tripsKey = `skyway_trips_${user._id}`
      const local = JSON.parse(localStorage.getItem(tripsKey) || '[]')
      const updated = local.map(t => t.ticketId === ticketId ? { ...t, status: 'cancelled', cancelledAt } : t)
      localStorage.setItem(tripsKey, JSON.stringify(updated))
    }
    setTrip(t => ({ ...t, status: 'cancelled', cancelledAt }))
    setCancelling(false)
    setCancelDone(true)
    setShowCancelConfirm(false)
  }

  if (!user) return null
  if (loading) return (
    <>
      <Navbar />
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: 48, height: 48, border: '3px solid rgba(255,193,7,0.2)', borderTop: '3px solid #ffc107', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--color-text-muted)' }}>Loading trip details...</p>
      </div>
      <Footer />
    </>
  )

  if (notFound) return (
    <>
      <Navbar />
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem' }}>🔍</div>
        <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: '1.5rem', fontWeight: 700 }}>Trip not found</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>We couldn't find booking <strong>{ticketId}</strong></p>
        <Link to="/my-trips" className="btn-accent no-underline px-6 py-3" style={{ marginTop: '0.5rem' }}>← Back to My Trips</Link>
      </div>
      <Footer />
    </>
  )

  if (!trip) return null

  const isCancelled  = trip.status === 'cancelled'
  const isPayFailed   = trip.paymentStatus === 'failed'
  const destImage     = getDestImage(trip)
  const type = trip.type || 'flight'
  const isHotel = type === 'hotel'

  const nights = (trip.checkin && trip.checkout)
    ? Math.max(1, Math.ceil((new Date(trip.checkout) - new Date(trip.checkin)) / 86400000))
    : trip.searchInfo?.nights || 1

  const fmtDate = (d, opts = { day: '2-digit', month: 'short', year: 'numeric' }) =>
    d ? new Date(d).toLocaleDateString('en-IN', opts) : '--'
  const fmtDateTime = (d) =>
    d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '--'

  return (
    <>
      <Navbar />

      {/* ── Hero Banner ───────────────────────────────────────────────── */}
      <div style={{
        position: 'relative', height: 220, overflow: 'hidden',
        background: destImage ? 'transparent' : 'linear-gradient(135deg, #0b1d3a 0%, #152d5c 100%)',
      }}>
        {destImage && (
          <img src={destImage} alt="destination"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.35)' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(6,14,30,0.4) 0%, rgba(6,14,30,0.85) 100%)' }} />
        <div className="container-main" style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '2rem' }}>
          <button onClick={() => navigate('/my-trips')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.75rem', padding: 0 }}>
            ← Back to My Trips
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: isHotel ? 'rgba(34,208,122,0.15)' : 'rgba(245,166,35,0.15)',
              border: `1.5px solid ${isHotel ? 'rgba(34,208,122,0.4)' : 'rgba(245,166,35,0.4)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0,
            }}>
              {isHotel ? '🏨' : '✈'}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 'clamp(1.3rem,4vw,1.9rem)', color: '#fff' }}>
                {isHotel ? trip.hotel?.name : `${trip.flight?.from} → ${trip.flight?.to}`}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem', marginTop: 2 }}>
                {isHotel ? `📍 ${trip.hotel?.city}` : `${trip.flight?.airline} · ${trip.flight?.code}`}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{
                display: 'inline-block', fontFamily: 'var(--font-syne)', fontWeight: 700, letterSpacing: 2,
                background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.35)',
                color: 'var(--color-accent)', padding: '6px 18px', borderRadius: 10, fontSize: '0.95rem',
              }}>{trip.ticketId}</div>
              <div style={{ marginTop: 6 }}>
                {isPayFailed
                  ? <span style={{ fontSize: 12, background: 'rgba(255,70,70,0.12)', color: '#ff4646', border: '1px solid rgba(255,70,70,0.3)', borderRadius: 20, padding: '3px 12px', fontWeight: 600 }}>Payment Failed ✕</span>
                  : isCancelled
                  ? <span style={{ fontSize: 12, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, padding: '3px 12px', fontWeight: 600 }}>Cancelled</span>
                  : <span style={{ fontSize: 12, background: 'rgba(34,208,122,0.12)', color: '#22d07a', border: '1px solid rgba(34,208,122,0.3)', borderRadius: 20, padding: '3px 12px', fontWeight: 600 }}>Confirmed ✓</span>
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <section className="relative z-10" style={{ padding: '2rem 0 4rem' }}>
        <div className="container-main" style={{ maxWidth: 860 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>

            {/* ── Flight Details ──────────────────────────────────────── */}
            {!isHotel && trip.flight && (
              <div className="glass-card">
                <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-accent)' }}>
                  ✈ Flight Information
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                  {/* Route */}
                  <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 2 }}>Departure</div>
                      <div style={{ fontFamily: 'var(--font-syne)', fontSize: '2rem', fontWeight: 800 }}>{trip.flight.dep}</div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{trip.flight.from}</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>{trip.flight.duration}</div>
                      <div style={{ height: 1, background: 'linear-gradient(to right, rgba(245,166,35,0.3), rgba(245,166,35,0.8), rgba(245,166,35,0.3))' }} />
                      <div style={{ marginTop: 4, fontSize: '1.1rem', color: 'var(--color-accent)' }}>✈</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 2 }}>Arrival</div>
                      <div style={{ fontFamily: 'var(--font-syne)', fontSize: '2rem', fontWeight: 800 }}>{trip.flight.arr}</div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{trip.flight.to}</div>
                    </div>
                  </div>
                  {/* Details grid */}
                  {[
                    ['Airline', trip.flight.airline],
                    ['Flight Code', trip.flight.code],
                    ['Stops', trip.flight.stops || 'Direct'],
                    ['Duration', trip.flight.duration],
                    ['Travel Date', fmtDate(trip.flight.searchedDate || trip.bookedAt, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })],
                    trip.flight.tripType === 'round' && trip.flight.returnDate
                      ? ['Return Date', fmtDate(trip.flight.returnDate, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })]
                      : null,
                  ].filter(Boolean).map(([label, value]) => (
                    <div key={label} style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.025)', borderRadius: 10 }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 3 }}>{label}</div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{value || '--'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Hotel Details ───────────────────────────────────────── */}
            {isHotel && trip.hotel && (
              <div className="glass-card">
                <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-accent)' }}>
                  🏨 Hotel Details
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div style={{ gridColumn: '1 / -1', padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '1.25rem', marginBottom: 4 }}>{trip.hotel.name}</div>
                    <div style={{ color: 'var(--color-text-muted)', marginBottom: 6 }}>📍 {trip.hotel.city}</div>
                    {trip.hotel.stars && (
                      <div>{'★'.repeat(trip.hotel.stars)}<span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}> {trip.hotel.stars}-Star Hotel</span></div>
                    )}
                  </div>
                  {[
                    ['Check-in', (trip.checkin || trip.searchInfo?.checkin) ? `${fmtDate(trip.checkin || trip.searchInfo?.checkin)} · 2:00 PM` : '--'],
                    ['Check-out', (trip.checkout || trip.searchInfo?.checkout) ? `${fmtDate(trip.checkout || trip.searchInfo?.checkout)} · 11:00 AM` : '--'],
                    ['Duration', `${nights} Night${nights !== 1 ? 's' : ''}`],
                    ['Guests', trip.searchInfo?.guests ? `${trip.searchInfo.guests} Guest${trip.searchInfo.guests > 1 ? 's' : ''}` : '--'],
                    ['Rooms', trip.searchInfo?.rooms ? `${trip.searchInfo.rooms} Room${trip.searchInfo.rooms > 1 ? 's' : ''}` : '--'],
                    ['Per Night', trip.hotel.price ? `₹${trip.hotel.price.toLocaleString('en-IN')}` : '--'],
                  ].map(([label, value]) => (
                    <div key={label} style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.025)', borderRadius: 10 }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 3 }}>{label}</div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: label === 'Check-in' || label === 'Check-out' ? 'var(--color-accent)' : 'inherit' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Passenger Details ───────────────────────────────────── */}
            <div className="glass-card">
              <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-accent)' }}>
                👤 Passenger Details
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {[
                  ['Full Name', `${trip.passenger?.firstName || ''} ${trip.passenger?.lastName || ''}`.trim() || '--'],
                  ['Email', trip.passenger?.email || '--'],
                  ['Phone', trip.passenger?.phone ? `+91 ${trip.passenger.phone}` : '--'],
                  ['Passport / ID', trip.passenger?.passport || 'Not provided'],
                  ['Nationality', trip.passenger?.nationality || '--'],
                ].map(([label, value]) => (
                  <div key={label} style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.025)', borderRadius: 10 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 3 }}>{label}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', wordBreak: 'break-all' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Payment Summary ─────────────────────────────────────── */}
            <div className="glass-card">
              <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-accent)' }}>
                💳 Payment Summary
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {[
                  ['Base Fare / Rate', trip.pricing?.base != null ? `₹${trip.pricing.base.toLocaleString('en-IN')}` : null],
                  ['Taxes', trip.pricing?.taxes != null ? `₹${trip.pricing.taxes.toLocaleString('en-IN')}` : null],
                  ['Convenience Fee', trip.pricing?.fee != null ? `₹${trip.pricing.fee.toLocaleString('en-IN')}` : null],
                  ['Discount', trip.pricing?.discount > 0 ? `-₹${trip.pricing.discount.toLocaleString('en-IN')}` : null],
                ].filter(([, v]) => v !== null).map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--color-text-muted)', padding: '2px 0' }}>
                    <span>{label}</span>
                    <span style={{ color: label === 'Discount' ? '#22d07a' : 'inherit' }}>{value}</span>
                  </div>
                ))}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0.5rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.15rem' }}>
                  <span>Total Paid</span>
                  <span style={{ color: 'var(--color-accent)' }}>
                    ₹{(trip.pricing?.total || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0.5rem 0' }} />
                {[
                  ['Payment Method', trip.paymentMethod === 'upi' ? 'UPI' : trip.paymentMethod === 'netbanking' ? 'Net Banking' : 'Credit / Debit Card'],
                  ['Payment ID', trip.paymentId || '--'],
                  ['Booked On', fmtDateTime(trip.bookedAt)],
                  isCancelled && trip.cancelledAt ? ['Cancelled On', fmtDateTime(trip.cancelledAt)] : null,
                ].filter(Boolean).map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted)', padding: '2px 0' }}>
                    <span>{label}</span>
                    <span style={{ color: label === 'Cancelled On' ? '#ef4444' : '#e8f0ff', fontWeight: 500, fontFamily: label === 'Payment ID' ? 'monospace' : 'inherit', fontSize: label === 'Payment ID' ? '0.75rem' : 'inherit' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Payment Failed Card (if payment failed) ─────────────────── */}
            {isPayFailed && (
              <div style={{ borderRadius: 16, padding: '1.25rem 1.5rem', background: 'rgba(255,70,70,0.06)', border: '1px solid rgba(255,70,70,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>✕</span>
                  <span style={{ fontWeight: 700, color: '#ff4646', fontSize: '1rem' }}>Payment Failed — No Amount Deducted</span>
                </div>
                {trip.failureCode && (
                  <div style={{ fontWeight: 600, color: '#ff8080', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                    {trip.failureCode === 'insufficient_funds' ? '💳 Reason: Insufficient Balance'
                      : trip.failureCode === 'daily_limit_exceeded' ? '🚫 Reason: Daily Limit Exceeded'
                      : '❌ Reason: Declined by Bank'}
                  </div>
                )}
                {trip.failureReason && (
                  <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '0.5rem' }}>
                    {trip.failureReason}
                  </div>
                )}
                <div style={{
                  background: 'rgba(34,208,122,0.06)', border: '1px solid rgba(34,208,122,0.15)',
                  borderRadius: 10, padding: '0.6rem 1rem', marginTop: '0.75rem',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ color: '#22d07a' }}>✓</span>
                  <span style={{ color: '#22d07a', fontSize: '0.85rem', fontWeight: 600 }}>No amount has been deducted from your account.</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                  Ref: {trip.paymentId} · {fmtDateTime(trip.bookedAt)}
                </div>
              </div>
            )}

            {/* ── Cancellation Info (if cancelled) ───────────────────── */}
            {isCancelled && (
              <div style={{ borderRadius: 16, padding: '1.25rem 1.5rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>⚠</span>
                  <span style={{ fontWeight: 700, color: '#ef4444' }}>Booking Cancelled</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 4, color: 'var(--color-text-muted)' }}>
                  <span>Cancellation Fee (10%)</span>
                  <span style={{ color: '#ef4444' }}>-₹{Math.round((trip.pricing?.total || 0) * 0.1).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>Refund Amount</span>
                  <span style={{ color: '#22d07a' }}>₹{Math.round((trip.pricing?.total || 0) * 0.9).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                  Refund will be processed within 5–7 business days to your original payment method.
                </div>
              </div>
            )}

            {/* ── Action Buttons ──────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link to="/my-trips" className="btn-ghost no-underline px-6 py-3">← My Trips</Link>
              {!isCancelled && !isPayFailed && (

                <button
                  className="text-xs px-6 py-3 rounded-lg cursor-pointer font-medium transition-all"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 10 }}
                  onClick={() => setShowCancelConfirm(true)}
                >
                  Cancel Booking
                </button>
              )}
              {cancelDone && (
                <div style={{ fontSize: '0.875rem', color: '#22d07a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  ✓ Booking cancelled. Refund initiated.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Cancel Confirm Modal ──────────────────────────────────────── */}
      {showCancelConfirm && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowCancelConfirm(false) }}>
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <button className="modal-close" onClick={() => setShowCancelConfirm(false)}>✕</button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', margin: '0 auto 1.25rem' }}>⚠</div>
              <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-accent)' }}>Cancel Booking?</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                This will cancel your {isHotel ? 'hotel reservation' : 'flight'} for <strong style={{ color: '#fff' }}>{isHotel ? trip.hotel?.name : `${trip.flight?.from} → ${trip.flight?.to}`}</strong>.
              </p>
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '1rem', marginBottom: '1.25rem', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 6 }}>
                  <span>Booking Amount</span><span>₹{(trip.pricing?.total || 0).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#ef4444', marginBottom: 6 }}>
                  <span>Cancellation Fee (10%)</span><span>-₹{Math.round((trip.pricing?.total || 0) * 0.1).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0.5rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>Refund Amount</span><span style={{ color: '#22d07a' }}>₹{Math.round((trip.pricing?.total || 0) * 0.9).toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="confirm-btn" onClick={() => setShowCancelConfirm(false)}
                  style={{ background: 'transparent', border: '1.5px solid rgba(255,255,255,0.15)', color: '#fff' }}>
                  Keep Booking
                </button>
                <button className="confirm-btn" onClick={handleCancel} disabled={cancelling}
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1.5px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
                  {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}
