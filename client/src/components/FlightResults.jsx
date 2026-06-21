import { useState, useEffect } from 'react'
import FlightCard from './FlightCard'

export default function FlightResults({ flights, from, to, date, returnDate, tripType, passengers, loading, filterPrices, cabin = 'Economy' }) {
  const [sortMethod, setSortMethod] = useState('cheapest')
  const [sortedFlights, setSortedFlights] = useState([])
  const [selectedStops, setSelectedStops] = useState({
    direct: false,
    oneStop: false
  });

  // Parse passenger count from string like "2 Adults, 1 Child" → 3
  const passengerCount = (() => {
    if (!passengers || typeof passengers !== 'string') return 1
    const nums = passengers.match(/\d+/g)
    if (!nums) return 1
    return nums.reduce((s, n) => s + parseInt(n, 10), 0)
  })()

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

  const getFilteredFlights = (list) => {
    if (!list) return [];
    const noFiltersActive = !selectedStops.direct && !selectedStops.oneStop;
    if (noFiltersActive) return list;

    return list.filter(f => {
      const stops = f.stops ? f.stops.toLowerCase() : '';
      if (selectedStops.direct && (stops.includes('direct') || stops === '0' || stops.includes('0'))) return true;
      if (selectedStops.oneStop && (stops.includes('1 stop') || stops.includes('1'))) return true;
      return false;
    });
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
      const filtered = getFilteredFlights(flights);
      setSortedFlights(sortFlights(filtered, 'cheapest'))
      setSortMethod('cheapest')
    } else {
      setSortedFlights([])
    }
  }, [flights, selectedStops])

  const handleSort = (method) => {
    setSortMethod(method)
    const filtered = getFilteredFlights(flights);
    setSortedFlights(sortFlights(filtered, method))
  }

  // Derive filter prices dynamically from filtered flights list
  const filteredList = getFilteredFlights(flights || []);
  const cheapestPrice = filteredList.length ? Math.min(...filteredList.map(f => f.price)) : null

  const fastestFlights = filteredList.length ? [...filteredList].sort((a, b) => getDurationMins(a.duration) - getDurationMins(b.duration)) : []
  const fastestPrice = fastestFlights.length ? fastestFlights[0].price : null

  const bestFlights = filteredList.length ? sortFlights(filteredList, 'best') : []
  const bestPrice = bestFlights.length ? bestFlights[0].price : null

  const fmt = (p) => p != null ? `₹${p.toLocaleString('en-IN')}` : ''

  const dateStr = date
    ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : ''

  const filterTabs = [
    { id: 'cheapest', label: 'Cheapest',   sub: fmt(cheapestPrice ? cheapestPrice * passengerCount : null), perPerson: passengerCount > 1 ? fmt(cheapestPrice) : null, hint: 'Lowest fare',    color: '#22d07a' },
    { id: 'fastest',  label: 'Fastest',    sub: fmt(fastestPrice ? fastestPrice * passengerCount : null),   perPerson: passengerCount > 1 ? fmt(fastestPrice) : null,  hint: 'Direct · Quick', color: '#f5a623' },
    { id: 'best',     label: 'Best Value', sub: fmt(bestPrice ? bestPrice * passengerCount : null),          perPerson: passengerCount > 1 ? fmt(bestPrice) : null,     hint: 'Price + Speed',  color: '#60a5fa' },
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
                    : 'var(--btn-ghost-bg)',
                  border: `1.5px solid ${sortMethod === tab.id ? tab.color : 'var(--divider-color)'}`,
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
                  color: sortMethod === tab.id ? tab.color : 'var(--color-text-muted)',
                  letterSpacing: '0.01em',
                }}>
                  {tab.label}
                </div>
                {tab.sub && (
                  <div style={{
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    marginTop: '1px',
                    fontFamily: 'var(--font-syne, inherit)',
                  }}>
                    {tab.sub}
                  </div>
                )}
                {tab.hint && (
                  <div style={{
                    fontSize: '0.68rem',
                    color: sortMethod === tab.id ? tab.color : 'var(--color-text-muted)',
                    marginTop: '2px',
                    letterSpacing: '0.01em',
                  }}>
                    {tab.hint}
                  </div>
                )}
                {tab.perPerson && (
                  <div style={{
                    fontSize: '0.62rem',
                    color: sortMethod === tab.id ? tab.color : 'var(--color-text-muted)',
                    marginTop: '1px',
                  }}>
                    {tab.perPerson}/person
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Stops Filter Row */}
        {!loading && flights?.length > 0 && (
          <div className="glass-card flex items-center gap-6 p-4 flex-wrap" style={{ 
            background: 'var(--filter-group-bg)', 
            border: '1px solid var(--filter-group-border)',
            borderRadius: '16px',
            marginBottom: '2rem'
          }}>
            <span className="font-syne text-xs font-bold text-accent tracking-wider uppercase flex items-center gap-1.5">
              <span>🎛</span> Filter by Stops:
            </span>
            <div className="flex items-center gap-6 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-text-muted hover:text-text-primary transition-all select-none">
                <input 
                  type="checkbox" 
                  checked={selectedStops.direct} 
                  onChange={(e) => setSelectedStops(prev => ({ ...prev, direct: e.target.checked }))}
                  style={{
                    accentColor: 'var(--color-accent, #f5a623)',
                    cursor: 'pointer',
                    width: '16px',
                    height: '16px'
                  }}
                />
                Direct Flights
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-text-muted hover:text-text-primary transition-all select-none">
                <input 
                  type="checkbox" 
                  checked={selectedStops.oneStop} 
                  onChange={(e) => setSelectedStops(prev => ({ ...prev, oneStop: e.target.checked }))}
                  style={{
                    accentColor: 'var(--color-accent, #f5a623)',
                    cursor: 'pointer',
                    width: '16px',
                    height: '16px'
                  }}
                />
                1 Stop
              </label>
            </div>
          </div>
        )}

        {!loading && (
          <div className="flex flex-col gap-4">
            {sortedFlights.length === 0 ? (
              <div className="glass-card text-center" style={{ padding: '3rem' }}>
                <div style={{ fontSize: '3rem' }}>✈️</div>
                <div className="font-syne text-lg font-bold mt-3">No flights found</div>
                <div className="text-text-muted mt-1">
                  {(!selectedStops.direct && !selectedStops.oneStop) 
                    ? 'Try different dates or destinations' 
                    : 'Try choosing other stop filter options'}
                </div>
              </div>
            ) : (
              sortedFlights.map((flight, i) => (
                <FlightCard key={flight.id || i} flight={{ ...flight, searchedDate: date, returnDate, tripType, cabin }} passengers={passengerCount} />
              ))
            )}
          </div>
        )}
      </div>
    </section>
  )
}
