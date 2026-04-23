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
        {/* Airline Logo */}
        <div className="airline-icon" style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
          {flight.icon}
        </div>

        {/* Flight Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="shrink-0">
              <div className="font-syne text-xl font-bold">{flight.dep}</div>
              <div className="text-sm text-text-muted">{flight.from}</div>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1" style={{ minWidth: 80 }}>
              <div className="flex items-center w-full">
                <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0"></div>
                <div className="flight-dash-line"></div>
                <div className="text-accent text-sm shrink-0 rotate-90 mx-1">✈</div>
                <div className="flight-dash-line"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0"></div>
              </div>
              <div className="text-xs text-text-muted">{flight.duration}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-syne text-xl font-bold">{flight.arr}</div>
              <div className="text-sm text-text-muted">{flight.to}</div>
            </div>
          </div>
          <div className="text-[0.8rem] text-text-muted flex gap-3 flex-wrap items-center">
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${flight.stops === 'Direct' ? 'badge-direct' : 'badge-stop'}`}>{flight.stops}</span>
            <span>🧳 {flight.baggage}</span>
            <span>🍽 {flight.meal}</span>
            <span>{flight.airline} · {flight.code}</span>
          </div>
        </div>

        {/* Price */}
        <div className="price-col" style={{ flexShrink: 0 }}>
          <div>
            <div className="font-syne text-2xl font-bold text-accent">₹{flight.price.toLocaleString('en-IN')}</div>
            <div className="text-xs text-text-muted mb-2">per person</div>
          </div>
          <button className="book-btn" onClick={handleBook}>Book Now</button>
        </div>
      </div>
    </div>
  )
}
