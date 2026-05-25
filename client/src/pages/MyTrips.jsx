import { useState, useEffect } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PageHero from '../components/PageHero'

const cityImages = {
  'Mumbai': 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&q=80',
  'Goa': 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&q=80',
  'Delhi': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80',
  'Bangalore': 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=400&q=80',
  'Chennai': 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&q=80',
  'Dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80',
  'Jaipur': 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400&q=80',
  'Kolkata': 'https://images.unsplash.com/photo-1558431382-27e303142255?w=400&q=80',
  'Hyderabad': 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&q=80',
  'Manali': 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400&q=80',
  'Singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80',
  'Bangkok': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&q=80',
  'Udaipur': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&q=80',
  'Pune': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80',
  'Ahmedabad': 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80',
  'London': 'https://images.unsplash.com/photo-1513635269975-5969336cd190?w=400&q=80',
  'New York': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&q=80',
  'Paris': 'https://images.unsplash.com/photo-1502602898657-3e907a5ea071?w=400&q=80',
  'Tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80',
  'Bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80',
  'Colombo': 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=400&q=80',
  'Kathmandu': 'https://images.unsplash.com/photo-1581403067825-7bdf9c6e5c9b?w=400&q=80',
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

const getTripImage = (trip) => {
  if (trip.type === 'hotel' && trip.hotel?.image) return trip.hotel.image;
  const dest = trip.type === 'hotel' ? trip.hotel?.city : trip.flight?.to;
  if (dest) {
    for (const [city, url] of Object.entries(cityImages)) {
      if (dest.toLowerCase().includes(city.toLowerCase())) return url;
    }
  }
  return null;
};

export default function MyTrips() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [tripsLoading, setTripsLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [cancellingId, setCancellingId] = useState(null)
  const [cancelConfirm, setCancelConfirm] = useState(null) // trip index to confirm cancel

  const tripsKey = `skyway_trips_${user?._id || 'guest'}`

  // Transform a server booking document into the client trip format
  const serverBookingToTrip = (b) => ({
    ticketId: b.ticketId,
    type: b.bookingType || 'flight',
    flight: b.flight ? {
      airline: b.flight.airline,
      code: b.flight.code,
      from: b.flight.from,
      to: b.flight.to,
      dep: b.flight.dep,
      arr: b.flight.arr,
      duration: b.flight.duration,
      stops: b.flight.stops,
    } : undefined,
    hotel: b.hotel ? {
      name: b.hotel.name,
      city: b.hotel.city,
      stars: b.hotel.stars,
      price: b.hotel.price,
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

  useEffect(() => {
    if (!user) return;

    const loadTrips = async () => {
      setTripsLoading(true)
      try {
        // 1. Load from localStorage
        const localTrips = JSON.parse(localStorage.getItem(tripsKey) || '[]')

        // 2. Fetch from server by user email
        let serverTrips = []
        try {
          const res = await fetch(`/api/bookings?email=${encodeURIComponent(user.email)}`)
          const data = await res.json()
          if (data.success && Array.isArray(data.bookings)) {
            serverTrips = data.bookings.map(serverBookingToTrip)
          }
        } catch (err) {
          console.warn('[MyTrips] Server fetch failed, using localStorage only:', err.message)
        }

        // 3. Merge: prefer server data, add localStorage-only entries not in server
        const serverIds = new Set(serverTrips.map(t => t.ticketId))
        const localOnlyTrips = localTrips.filter(t => !serverIds.has(t.ticketId))

        // Also sync cancellations from localStorage back to the merged list
        const cancelledLocalIds = new Set(
          localTrips.filter(t => t.status === 'cancelled').map(t => t.ticketId)
        )
        const merged = [
          ...serverTrips.map(t => ({
            ...t,
            // If local says cancelled but server doesn't yet reflect it, honour local
            status: cancelledLocalIds.has(t.ticketId) ? 'cancelled' : t.status,
            cancelledAt: cancelledLocalIds.has(t.ticketId)
              ? (localTrips.find(l => l.ticketId === t.ticketId)?.cancelledAt || t.cancelledAt)
              : t.cancelledAt,
          })),
          ...localOnlyTrips,
        ]

        // Sort newest first
        merged.sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt))

        setTrips(merged)

        // Update localStorage to reflect merged state (so it stays in sync)
        localStorage.setItem(tripsKey, JSON.stringify(merged))
      } catch (err) {
        console.error('[MyTrips] Failed to load trips:', err)
        const localTrips = JSON.parse(localStorage.getItem(tripsKey) || '[]')
        setTrips(localTrips)
      } finally {
        setTripsLoading(false)
      }
    }

    loadTrips()
  }, [user, tripsKey])

  if (loading) return null;
  if (!user) return <Navigate to="/signin" replace />;
  if (tripsLoading) return (
    <>
      <Navbar />
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: 48, height: 48, border: '3px solid rgba(255,193,7,0.2)', borderTop: '3px solid #ffc107', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>Loading your trips...</p>
      </div>
      <Footer />
    </>
  );

  const clearTrips = () => {
    if (confirm('Clear all trip history?')) {
      localStorage.removeItem(tripsKey)
      setTrips([])
    }
  }

  const handleCancelTrip = (index) => {
    setCancelConfirm(index)
  }

  const confirmCancel = async () => {
    if (cancelConfirm === null) return
    setCancellingId(cancelConfirm)

    const trip = trips[cancelConfirm]
    const cancelledAt = new Date().toISOString()

    // Persist cancellation to server DB
    try {
      if (trip.ticketId) {
        await fetch(`/api/bookings/${trip.ticketId}/cancel`, { method: 'PATCH' })
      }
    } catch (err) {
      console.warn('[MyTrips] Server cancel failed, updating locally only:', err.message)
    }

    const updated = [...trips]
    updated[cancelConfirm] = { ...updated[cancelConfirm], status: 'cancelled', cancelledAt }
    setTrips(updated)
    localStorage.setItem(tripsKey, JSON.stringify(updated))
    setCancellingId(null)
    setCancelConfirm(null)
  }

  const filtered = filter === 'all' ? trips : trips.filter(t => t.type === filter)

  const getStatusBadge = (trip) => {
    if (trip.status === 'cancelled') {
      return <span className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>Cancelled</span>
    }
    if (trip.paymentStatus === 'failed') {
      return <span className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ background: 'rgba(255,70,70,0.12)', color: '#ff4646', border: '1px solid rgba(255,70,70,0.2)' }}>Payment Failed ✕</span>
    }
    return <span className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ background: 'rgba(34,208,122,0.12)', color: '#22d07a', border: '1px solid rgba(34,208,122,0.2)' }}>Confirmed</span>
  }

  return (
    <>
      <Navbar />
      <PageHero
        line1="My"
        line2="Trips"
        badge="Booking History"
        subtitle="View, manage, or cancel your upcoming and past bookings."
        inlineTitle={true}
      />
      <section className="relative z-10" style={{ padding: '0 0 4rem' }}>
        <div className="container-main">

          {trips.length > 0 && (
            <div className="flex items-center justify-between mb-12 flex-wrap gap-3" style={{ maxWidth: 800, margin: '0 auto 3rem' }}>
              <div className="filter-group">
                {['all', 'flight', 'hotel'].map(f => (
                  <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                    {f === 'all' ? 'All' : f === 'flight' ? '✈ Flights' : '🏨 Hotels'}
                  </button>
                ))}
              </div>
              <button className="btn-ghost text-xs" onClick={clearTrips}>Clear All</button>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🧳</div>
              <h3 className="font-syne text-xl font-bold mb-2">No trips yet</h3>
              <p className="text-text-muted mb-6">Start by searching for {filter === 'all' ? 'flights or hotels' : filter === 'flight' ? 'flights' : 'hotels'}</p>
              <div className="flex gap-3 justify-center">
                {(filter === 'all' || filter === 'flight') && (
                  <Link to="/" className="btn-accent no-underline px-6 py-3">Search Flights</Link>
                )}
                {(filter === 'all' || filter === 'hotel') && (
                  <Link to="/hotels" className="btn-ghost no-underline px-6 py-3">Search Hotels</Link>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4" style={{ maxWidth: 800, margin: '0 auto' }}>
              {filtered.map((trip, i) => {
                const isCancelled = trip.status === 'cancelled'
                const isProcessing = cancellingId === i

                return (
                  <div key={i} className="flight-card" style={{ opacity: isCancelled ? 0.6 : 1 }}>
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-4">
                        {(() => {
                          const img = getTripImage(trip);
                          return (
                            <div className="rounded-xl flex items-center justify-center text-xl bg-cover bg-center overflow-hidden shrink-0" style={{ width: 80, height: 60, background: img ? `url('${img}') center/cover` : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                              {!img && (trip.type === 'flight' ? '✈' : '🏨')}
                            </div>
                          );
                        })()}
                        <div>
                          {trip.type === 'flight' ? (
                            <>
                              <div className="font-syne font-bold text-lg">
                                {trip.flight?.title ? trip.flight.title : `${trip.flight?.from} ${trip.flight?.tripType === 'round' ? '⇄' : '→'} ${trip.flight?.to}`}
                              </div>
                              <div className="text-sm text-text-muted mt-1">
                                <div className="mb-0.5">
                                  {trip.flight?.tripType === 'round' && <span className="font-medium text-white/80">Outbound: </span>}
                                  {trip.flight?.description ? trip.flight.description : `${trip.flight?.airline} · ${trip.flight?.dep} - ${trip.flight?.arr}`}
                                  <span className="ml-1">· {new Date(trip.flight?.searchedDate || trip.bookedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                </div>
                                {trip.flight?.tripType === 'round' && trip.flight?.returnDate && (
                                  <div>
                                    <span className="font-medium text-white/80">Return ({trip.flight?.to?.split(',')[0]} → {trip.flight?.from?.split(',')[0]}): </span> 
                                    {trip.flight?.airline} · {trip.flight?.arr} - {trip.flight?.dep}
                                    <span className="ml-1">· {new Date(trip.flight.returnDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                  </div>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="font-syne font-bold text-lg">{trip.hotel?.name}</div>
                              <div className="text-sm text-text-muted mt-1">
                                {trip.hotel?.city}
                                {(trip.checkin || trip.searchInfo?.checkin) && (trip.checkout || trip.search.Info?.checkout) && (
                                  <span> · {new Date(trip.checkin || trip.searchInfo.checkin).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} (2 PM) → {new Date(trip.checkout || trip.searchInfo.checkout).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} (11 AM)</span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="ticket-badge text-sm" style={{ marginTop: 0 }}>{trip.ticketId || trip.bookingId}</div>
                        <div className="font-syne text-xl font-bold text-accent mt-2">
                          ₹{(trip.pricing?.total || trip.totalPrice || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs text-text-muted">{new Date(trip.bookedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      </div>
                    </div>

                    {/* Status + Cancel Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-6 pt-4 gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(trip)}
                        {isCancelled && trip.cancelledAt && (
                          <span className="text-xs text-text-muted">
                            Cancelled on {new Date(trip.cancelledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button 
                          className="text-xs px-5 py-2.5 rounded-lg cursor-pointer font-medium transition-all"
                          style={{
                            background: 'linear-gradient(135deg, rgba(245,166,35,0.12), rgba(245,166,35,0.06))',
                            border: '1px solid rgba(245,166,35,0.3)',
                            color: 'var(--color-accent)',
                          }}
                          onClick={() => navigate(`/my-trips/${trip.ticketId}`, { state: trip })}
                        >
                          View Details →
                        </button>

                        {!isCancelled && trip.paymentStatus !== 'failed' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCancelTrip(i) }}
                            className="text-xs px-5 py-2.5 rounded-lg cursor-pointer font-medium transition-all hover:bg-red-500/20"
                            style={{
                              background: 'rgba(239,68,68,0.08)',
                              border: '1px solid rgba(239,68,68,0.2)',
                              color: '#ef4444',
                            }}
                            disabled={isProcessing}
                          >
                            {isProcessing ? 'Cancelling...' : 'Cancel Booking'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/*  */}
      {cancelConfirm !== null && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setCancelConfirm(null) }}>
          <div className="modal-box" style={{ maxWidth: 440 }}>
            <button className="modal-close" onClick={() => setCancelConfirm(null)}>✕</button>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto" style={{ background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)', marginBottom: '1.5rem' }}>
                ⚠
              </div>
              <h2 className="font-syne text-xl font-bold text-accent" style={{ marginBottom: '1rem' }}>Cancel Booking?</h2>
              <p className="text-text-muted text-sm" style={{ marginBottom: '1.5rem' }}>
                Are you sure you want to cancel this {trips[cancelConfirm]?.type === 'flight' ? 'flight' : 'hotel'} booking?
                {trips[cancelConfirm]?.type === 'flight' ? (
                  <span className="block mt-2 font-medium text-white">
                    {trips[cancelConfirm]?.flight?.title ? trips[cancelConfirm].flight.title : `${trips[cancelConfirm]?.flight?.from} → ${trips[cancelConfirm]?.flight?.to}`}
                  </span>
                ) : (
                  <span className="block mt-2 font-medium text-white">
                    {trips[cancelConfirm]?.hotel?.name}
                  </span>
                )}
              </p>

              {/* Refund Info */}
              <div className="rounded-xl text-left text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
                <div className="flex justify-between mb-2">
                  <span className="text-text-muted">Booking Amount</span>
                  <span className="font-medium">₹{(trips[cancelConfirm]?.pricing?.total || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-text-muted">Cancellation Fee (10%)</span>
                  <span className="font-medium" style={{ color: '#ef4444' }}>
                    -₹{Math.round((trips[cancelConfirm]?.pricing?.total || 0) * 0.1).toLocaleString('en-IN')}
                  </span>
                </div>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0.5rem 0' }}></div>
                <div className="flex justify-between font-bold">
                  <span>Refund Amount</span>
                  <span style={{ color: '#22d07a' }}>
                    ₹{Math.round((trips[cancelConfirm]?.pricing?.total || 0) * 0.9).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <p className="text-xs text-text-muted" style={{ marginBottom: '1.5rem' }}>
                Refund will be processed within 5-7 business days to your original payment method.
              </p>

              <div className="flex gap-3">
                <button
                  className="confirm-btn flex-1"
                  onClick={() => setCancelConfirm(null)}
                  style={{ background: 'transparent', border: '1.5px solid rgba(255,255,255,0.15)', color: 'white' }}
                >
                  Keep Booking
                </button>
                <button
                  className="confirm-btn flex-1"
                  onClick={confirmCancel}
                  disabled={cancellingId !== null}
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1.5px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
                >
                  {cancellingId !== null ? 'Processing...' : 'Confirm Cancel'}
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
