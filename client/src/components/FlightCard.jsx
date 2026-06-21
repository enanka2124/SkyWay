import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function FlightCard({ flight, passengers = 1 }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showDetails, setShowDetails] = useState(false)

  const handleBook = (e) => {
    e.stopPropagation()
    if (!user) {
      navigate('/signin', { state: { from: '/checkout', bookingState: { type: 'flight', data: { ...flight, passengers } } } })
      return
    }
    navigate('/checkout', { state: { type: 'flight', data: { ...flight, passengers } } })
  }

  function renderTimeline() {
    if (!flight.layovers || flight.layovers.length === 0) return null;
    
    const times = [];
    
    if (flight.layovers.length === 1) {
      const dep1 = flight.dep;
      const arr1 = addTimeToStr(dep1, flight.segmentDurations?.[0] || '1h 30m');
      times.push({ type: 'flight', from: flight.from, to: flight.layovers[0].city, dep: dep1, arr: arr1, dur: flight.segmentDurations?.[0] || '1h 30m' });
      
      times.push({ type: 'layover', city: flight.layovers[0].city, dur: flight.layovers[0].duration });
      
      const dep2 = addTimeToStr(arr1, flight.layovers[0].duration);
      const arr2 = flight.arr;
      times.push({ type: 'flight', from: flight.layovers[0].city, to: flight.to, dep: dep2, arr: arr2, dur: flight.segmentDurations?.[1] || '1h 30m' });
    } else if (flight.layovers.length > 1) {
      const d1 = flight.dep;
      const a1 = addTimeToStr(d1, flight.segmentDurations?.[0] || '1h 10m');
      times.push({ type: 'flight', from: flight.from, to: flight.layovers[0].city, dep: d1, arr: a1, dur: flight.segmentDurations?.[0] || '1h 10m' });
      
      times.push({ type: 'layover', city: flight.layovers[0].city, dur: flight.layovers[0].duration });
      
      const d2 = addTimeToStr(a1, flight.layovers[0].duration);
      const a2 = addTimeToStr(d2, flight.segmentDurations?.[1] || '1h 15m');
      times.push({ type: 'flight', from: flight.layovers[0].city, to: flight.layovers[1].city, dep: d2, arr: a2, dur: flight.segmentDurations?.[1] || '1h 15m' });
      
      times.push({ type: 'layover', city: flight.layovers[1].city, dur: flight.layovers[1].duration });
      
      const d3 = addTimeToStr(a2, flight.layovers[1].duration);
      const a3 = flight.arr;
      times.push({ type: 'flight', from: flight.layovers[1].city, to: flight.to, dep: d3, arr: a3, dur: flight.segmentDurations?.[2] || '1h 10m' });
    }
    
    return (
      <div 
        onClick={(e) => e.stopPropagation()} 
        style={{
          marginTop: '1.25rem',
          padding: '1.25rem',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '16px',
          border: '1px solid var(--card-border)',
          animation: 'fadeInUp 0.3s ease',
        }}
      >
        <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-accent)', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>
          ✈ Journey Timeline
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', paddingLeft: '1.25rem' }}>
          <div style={{ position: 'absolute', left: '4px', top: '8px', bottom: '8px', width: '2px', background: 'var(--divider-color)' }}></div>
          
          {times.map((item, idx) => {
            if (item.type === 'flight') {
              return (
                <div key={idx} style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-23px', top: '5px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-accent)', boxShadow: '0 0 6px var(--color-accent)' }}></div>
                  
                  <div className="flex justify-between items-center flex-wrap gap-2 text-sm">
                    <span className="font-semibold">{item.from} → {item.to}</span>
                    <span className="text-xs text-text-muted">{item.dep} - {item.arr} ({item.dur})</span>
                  </div>
                </div>
              );
            } else {
              return (
                <div key={idx} style={{ 
                  position: 'relative',
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(245, 166, 35, 0.06)',
                  border: '1px solid rgba(245, 166, 35, 0.15)',
                  borderRadius: '10px',
                  color: 'var(--color-accent)',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  margin: '0.25rem 0'
                }}>
                  <div style={{ position: 'absolute', left: '-22px', top: '10px', width: '6px', height: '6px', borderRadius: '50%', background: '#ffbe4d' }}></div>
                  
                  <span>⏳ <strong>Layover:</strong> {item.dur} in {item.city}</span>
                </div>
              );
            }
          })}
        </div>
      </div>
    );
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
            {flight.seatsLeft && flight.seatsLeft <= 10 && (
              <span className="px-2.5 py-0.5 rounded-full font-semibold text-xs" style={{ 
                background: flight.seatsLeft <= 5 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 166, 35, 0.12)',
                color: flight.seatsLeft <= 5 ? '#ff5252' : '#ffb300',
                border: `1px solid ${flight.seatsLeft <= 5 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 166, 35, 0.25)'}`
              }}>
                {flight.seatsLeft <= 5 ? `🔥 Only ${flight.seatsLeft} seats left!` : `⚠️ ${flight.seatsLeft} seats left`}
              </span>
            )}
            {flight.stops !== 'Direct' && flight.layovers && flight.layovers.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(!showDetails);
                }}
                className="text-xs px-3 py-1 rounded-lg cursor-pointer font-semibold transition-all hover:brightness-110"
                style={{
                  background: 'rgba(245, 166, 35, 0.12)',
                  border: '1px solid rgba(245, 166, 35, 0.25)',
                  color: 'var(--color-accent)',
                }}
              >
                {showDetails ? 'Hide Stop Details ▴' : 'View Stop Details ▾'}
              </button>
            )}
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
              ₹{(passengers > 1 ? flight.price * passengers : flight.price).toLocaleString('en-IN')}
            </div>
            {passengers > 1 ? (
              <div className="text-xs text-text-muted">
                total · ₹{flight.price.toLocaleString('en-IN')}/person
              </div>
            ) : (
              <div className="text-xs text-text-muted">per person</div>
            )}
          </div>
          <button className="book-btn" onClick={handleBook}>Book Now →</button>
        </div>
      </div>
      {showDetails && renderTimeline()}
    </div>
  )
}

function addTimeToStr(timeStr, durationStr) {
  if (!timeStr || !durationStr) return timeStr;
  try {
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const durH = parseInt(durationStr.match(/(\d+)h/)?.[1] || 0, 10);
    const durM = parseInt(durationStr.match(/(\d+)m/)?.[1] || 0, 10);
    
    let totalMins = (h * 60 + m) + (durH * 60 + durM);
    let finalH = Math.floor(totalMins / 60) % 24;
    let finalM = totalMins % 60;
    return `${String(finalH).padStart(2, '0')}:${String(finalM).padStart(2, '0')}`;
  } catch (e) {
    return timeStr;
  }
}
