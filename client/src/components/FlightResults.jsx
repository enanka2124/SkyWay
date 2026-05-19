import { useState, useEffect } from 'react'
import FlightCard from './FlightCard'

export default function FlightResults({ flights, from, to, date, returnDate, tripType, loading, filterPrices }) {
  const [sortMethod, setSortMethod] = useState('cheapest')
  const [sortedFlights, setSortedFlights] = useState([])

  const getDurationMins = (durStr) => {
    const hours = parseInt(durStr?.match(/(\d+)h/)?.[1] || 0)
    const mins = parseInt(durStr?.match(/(\d+)m/)?.[1] || 0)
    return hours * 60 + mins
  }

  const sortFlights = (list, method) => {
    const arr = [...list]
    if (method === 'cheapest') {
      return arr.sort((a, b) => a.price - b.price)
    } else if (method === 'fastest') {
      // Fastest = shortest flight time, but shown at a premium price (real market: speed costs more)
      return arr.sort((a, b) => getDurationMins(a.duration) - getDurationMins(b.duration))
    } else {
      // Best Value = best balance of price + time (medium range)
      return arr.sort((a, b) => {
        const scoreA = a.price + getDurationMins(a.duration) * 10
        const scoreB = b.price + getDurationMins(b.duration) * 10
        return scoreA - scoreB
      })
    }
  }

  useEffect(() => {
    if (flights && flights.length > 0) {
      setSortedFlights(sortFlights(flights, 'cheapest'))
      setSortMethod('cheapest')
    } else {
      setSortedFlights([])
    }
  }, [flights])

  const handleSort = (method) => {
    setSortMethod(method)
    setSortedFlights(sortFlights(flights, method))
  }

  // Derive filter prices from flights if not passed from API
  const cheapestPrice = filterPrices?.cheapest ?? (flights?.length ? Math.min(...flights.map(f => f.price)) : null)
  const fastestFlights = flights?.length ? [...flights].sort((a, b) => getDurationMins(a.duration) - getDurationMins(b.duration)) : []
  // Fastest = shortest duration → typically higher price in real market
  const fastestPrice = filterPrices?.fastest ?? (fastestFlights.length ? fastestFlights[0].price : null)
  const bestFlights = flights?.length ? [...flights].sort((a, b) => {
    return (a.price + getDurationMins(a.duration) * 10) - (b.price + getDurationMins(b.duration) * 10)
  }) : []
  const bestPrice = filterPrices?.best ?? (bestFlights.length ? bestFlights[0].price : null)

  const fmt = (p) => p != null ? `₹${p.toLocaleString('en-IN')}` : ''

  const dateStr = date
    ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : ''

  const filterTabs = [
    { id: 'cheapest', label: 'Cheapest',   sub: fmt(cheapestPrice), color: '#22d07a' },
    { id: 'fastest',  label: 'Fastest',    sub: fmt(fastestPrice),  color: '#f5a623' },
    { id: 'best',     label: 'Best Value', sub: fmt(bestPrice),     color: '#60a5fa' },
  ]

  return (
    <section className="relative z-10" id="results-section">
      <div className="container-main" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
        {loading && <div className="loading-bar"></div>}

        <div className="results-header flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <div className="font-syne text-xl font-bold">
              {loading ? 'Searching live prices…' : (
                <><span>{sortedFlights.length} flights</span>&nbsp;{from} → {to}&nbsp;
                  <span className="text-text-muted text-sm">{dateStr}</span>
                </>
              )}
            </div>
            {!loading && sortedFlights.length > 0 && (
              <div className="text-xs mt-1" style={{ color: '#22d07a', opacity: 0.85 }}>
                ✓ Live market prices
              </div>
            )}
          </div>

          {/* Filter tabs with price hints */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {filterTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleSort(tab.id)}
                style={{
                  background: sortMethod === tab.id
                    ? `linear-gradient(135deg, ${tab.color}22, ${tab.color}11)`
                    : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${sortMethod === tab.id ? tab.color : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '12px',
                  padding: '0.5rem 1.1rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  minWidth: '110px',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: sortMethod === tab.id ? tab.color : 'rgba(255,255,255,0.7)',
                  letterSpacing: '0.01em',
                }}>
                  {tab.label}
                </div>
                {tab.sub && (
                  <div style={{
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    color: sortMethod === tab.id ? '#fff' : 'rgba(255,255,255,0.5)',
                    marginTop: '1px',
                    fontFamily: 'var(--font-syne, inherit)',
                  }}>
                    {tab.sub}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {!loading && (
          <div className="flex flex-col gap-4">
            {sortedFlights.length === 0 ? (
              <div className="glass-card text-center" style={{ padding: '3rem' }}>
                <div style={{ fontSize: '3rem' }}>✈️</div>
                <div className="font-syne text-lg font-bold mt-3">No flights found</div>
                <div className="text-text-muted mt-1">Try different dates or destinations</div>
              </div>
            ) : (
              sortedFlights.map((flight, i) => (
                <FlightCard key={flight.id || i} flight={{ ...flight, searchedDate: date, returnDate, tripType }} />
              ))
            )}
          </div>
        )}
      </div>
    </section>
  )
}
