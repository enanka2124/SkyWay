import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function MyTrips() {
  const [trips, setTrips] = useState([])
  const [filter, setFilter] = useState('all')
  const [cancellingId, setCancellingId] = useState(null)
  const [cancelConfirm, setCancelConfirm] = useState(null) // trip index to confirm cancel

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('skyway_trips') || '[]')
    setTrips(stored)
  }, [])

  const clearTrips = () => {
    if (confirm('Clear all trip history?')) {
      localStorage.removeItem('skyway_trips')
      setTrips([])
    }
  }

  const handleCancelTrip = (index) => {
    setCancelConfirm(index)
  }

  const confirmCancel = () => {
    if (cancelConfirm === null) return
    setCancellingId(cancelConfirm)

    // Simulate cancellation processing
    setTimeout(() => {
      const updated = [...trips]
      updated[cancelConfirm] = { ...updated[cancelConfirm], status: 'cancelled', cancelledAt: new Date().toISOString() }
      setTrips(updated)
      localStorage.setItem('skyway_trips', JSON.stringify(updated))
      setCancellingId(null)
      setCancelConfirm(null)
    }, 1200)
  }

  const filtered = filter === 'all' ? trips : trips.filter(t => t.type === filter)

  const getStatusBadge = (trip) => {
    if (trip.status === 'cancelled') {
      return <span className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>Cancelled</span>
    }
    return <span className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ background: 'rgba(34,208,122,0.12)', color: '#22d07a', border: '1px solid rgba(34,208,122,0.2)' }}>Confirmed</span>
  }

  return (
    <>
      <Navbar />
      <section className="relative z-10" style={{ padding: '4rem 0 4rem' }}>
        <div className="container-main">
          <h1 className="font-syne text-[clamp(2rem,5vw,3.5rem)] font-[800] text-center mb-2">
            My <span className="text-accent">Trips</span>
          </h1>
          <p className="text-text-muted text-center mb-10 text-lg">Your booking history</p>

          {trips.length > 0 && (
            <div className="flex items-center justify-between mb-8 flex-wrap gap-3" style={{ maxWidth: 800, margin: '0 auto 2rem' }}>
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
              <p className="text-text-muted mb-6">Start by searching for flights or hotels</p>
              <div className="flex gap-3 justify-center">
                <Link to="/" className="btn-accent no-underline px-6 py-3">Search Flights</Link>
                <Link to="/hotels" className="btn-ghost no-underline px-6 py-3">Search Hotels</Link>
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
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                          {trip.type === 'flight' ? '✈' : '🏨'}
                        </div>
                        <div>
                          {trip.type === 'flight' ? (
                            <>
                              <div className="font-syne font-bold text-lg">{trip.flight?.from} → {trip.flight?.to}</div>
                              <div className="text-sm text-text-muted">{trip.flight?.airline} · {trip.flight?.dep} - {trip.flight?.arr}</div>
                            </>
                          ) : (
                            <>
                              <div className="font-syne font-bold text-lg">{trip.hotel?.name}</div>
                              <div className="text-sm text-text-muted">{trip.hotel?.city} · {trip.checkin} → {trip.checkout}</div>
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
                    <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(trip)}
                        {isCancelled && trip.cancelledAt && (
                          <span className="text-xs text-text-muted">
                            Cancelled on {new Date(trip.cancelledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      {!isCancelled && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCancelTrip(i) }}
                          className="text-xs px-4 py-2 rounded-lg cursor-pointer font-medium transition-all"
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
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Cancel Confirmation Modal ── */}
      {cancelConfirm !== null && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setCancelConfirm(null) }}>
          <div className="modal-box" style={{ maxWidth: 440 }}>
            <button className="modal-close" onClick={() => setCancelConfirm(null)}>✕</button>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto" style={{ background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)', marginBottom: '1.5rem' }}>
                ⚠
              </div>
              <h2 className="font-syne text-xl font-bold" style={{ marginBottom: '0.75rem' }}>Cancel Booking?</h2>
              <p className="text-text-muted text-sm" style={{ marginBottom: '1.5rem' }}>
                Are you sure you want to cancel this {trips[cancelConfirm]?.type === 'flight' ? 'flight' : 'hotel'} booking?
                {trips[cancelConfirm]?.type === 'flight' ? (
                  <span className="block mt-2 font-medium text-white">
                    {trips[cancelConfirm]?.flight?.from} → {trips[cancelConfirm]?.flight?.to}
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
