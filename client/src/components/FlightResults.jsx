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

  const getStopsCount = (stopsStr) => {
    if (!stopsStr) return 0
    const s = stopsStr.toLowerCase()
    if (s.includes('direct') || s.includes('0')) return 0
    const match = s.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : 1
  }

  const sortFlights = (list, method) => {
    const arr = [...list]
    if (method === 'cheapest') {
      return arr.sort((a, b) => a.price - b.price)
    } else if (method === 'fastest') {
      return arr.sort((a, b) => getDurationMins(a.duration) - getDurationMins(b.duration))
    } else {
      const cheapest = arr.length ? Math.min(...arr.map(f => f.price)) : 0
      const hasDiff = arr.some(f => f.price > cheapest)
      const getScore = (f) => {
        let score = f.price + getDurationMins(f.duration) * 15 + getStopsCount(f.stops) * 2500
        if (hasDiff && f.price === cheapest) {
          score += 10000
        }
        return score
      }
      return arr.sort((a, b) => getScore(a) - getScore(b))
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

  // Derive filter prices dynamically from flights list
  const cheapestPrice = flights?.length ? Math.min(...flights.map(f => f.price)) : null

  const fastestFlights = flights?.length ? [...flights].sort((a, b) => getDurationMins(a.duration) - getDurationMins(b.duration)) : []
  const fastestPrice = fastestFlights.length ? fastestFlights[0].price : null

  const bestFlights = flights?.length ? sortFlights(flights, 'best') : []
  const bestPrice = bestFlights.length ? bestFlights[0].price : null

  const fmt = (p) => p != null ? `₹${p.toLocaleString('en-IN')}` : ''

  const dateStr = date
    ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : ''

  const filterTabs = [
    { id: 'cheapest', label: 'Cheapest',   sub: fmt(cheapestPrice), hint: 'Lowest fare',    color: '#22d07a' },
    { id: 'fastest',  label: 'Fastest',    sub: fmt(fastestPrice),  hint: 'Direct · Quick', color: '#f5a623' },
    { id: 'best',     label: 'Best Value', sub: fmt(bestPrice),     hint: 'Price + Speed',  color: '#60a5fa' },
  ]

  return (
    <section className="relative z-10" id="results-section">
      <div className="container-main" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
        {loading && <div className="loading-bar"></div>}

        <div className="results-header flex items-center justify-between flex-wrap gap-3" style={{ marginBottom: '2.25rem' }}>
          <div>
            <div className="font-syne text-xl font-bold">
              {loading ? 'Searching flights…' : (
                <><span>{sortedFlights.length} flights</span>&nbsp;{from} → {to}&nbsp;
                  <span className="text-text-muted text-sm">{dateStr}</span>
                </>
              )}
            </div>
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
                {tab.hint && (
                  <div style={{
                    fontSize: '0.68rem',
                    color: sortMethod === tab.id ? `${tab.color}cc` : 'rgba(255,255,255,0.3)',
                    marginTop: '2px',
                    letterSpacing: '0.01em',
                  }}>
                    {tab.hint}
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
