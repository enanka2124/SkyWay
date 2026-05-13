import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function FlightCard({ flight }) {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleBook = (e) => {
    e.stopPropagation()
    if (!user) {
      navigate('/signin', { state: { from: '/checkout', bookingState: { type: 'flight', data: flight } } })
      return
    }
    navigate('/checkout', { state: { type: 'flight', data: flight } })
  }

  return (
    <div className="flight-card" onClick={handleBook}>
      <div className="flight-card-grid">

        {/* Airline Icon */}
        <div
          className="airline-icon"
          style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.11)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', flexShrink: 0,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          {flight.icon}
        </div>

        {/* Flight Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center gap-3 mb-3">
            {/* Departure */}
            <div className="shrink-0">
              <div className="font-syne text-xl font-bold" style={{ letterSpacing: '-0.5px' }}>{flight.dep}</div>
              <div className="text-sm text-text-muted">{flight.from}</div>
            </div>

            {/* Route line */}
            <div className="flex-1 flex flex-col items-center gap-1" style={{ minWidth: 80 }}>
              <div className="flex items-center w-full">
                <div className="w-2 h-2 rounded-full bg-accent shrink-0" style={{ boxShadow: '0 0 6px rgba(245,166,35,0.5)' }}></div>
                <div className="flight-dash-line"></div>
                <div className="text-accent text-sm shrink-0 rotate-90 mx-1.5" style={{ filter: 'drop-shadow(0 0 4px rgba(245,166,35,0.4))' }}>✈</div>
                <div className="flight-dash-line"></div>
                <div className="w-2 h-2 rounded-full bg-accent shrink-0" style={{ boxShadow: '0 0 6px rgba(245,166,35,0.5)' }}></div>
              </div>
              <div className="text-xs text-text-muted" style={{ fontSize: '0.75rem' }}>{flight.duration}</div>
            </div>

            {/* Arrival */}
            <div className="shrink-0 text-right">
              <div className="font-syne text-xl font-bold" style={{ letterSpacing: '-0.5px' }}>{flight.arr}</div>
              <div className="text-sm text-text-muted">{flight.to}</div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex gap-2 flex-wrap items-center" style={{ fontSize: '0.8rem' }}>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${flight.stops === 'Direct' ? 'badge-direct' : 'badge-stop'}`}>
              {flight.stops}
            </span>
            <span className="text-text-muted">🧳 {flight.baggage}</span>
            <span className="text-text-muted">🍽 {flight.meal}</span>
            <span className="text-text-muted" style={{ opacity: 0.7 }}>{flight.airline} · {flight.code}</span>
          </div>
        </div>

        {/* Price col */}
        <div className="price-col" style={{ flexShrink: 0 }}>
          <div className="mb-2">
            <div
              className="font-syne font-bold"
              style={{
                fontSize: '1.6rem',
                background: 'linear-gradient(135deg, #f5a623, #ffbe4d)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.5px',
              }}
            >
              ₹{flight.price.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-text-muted">per person</div>
          </div>
          <button className="book-btn" onClick={handleBook}>Book Now →</button>
        </div>
      </div>
    </div>
  )
}
