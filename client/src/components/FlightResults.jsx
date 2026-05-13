import { useState, useEffect } from 'react'
import FlightCard from './FlightCard'

export default function FlightResults({ flights, from, to, date, returnDate, tripType, loading }) {
  const [sortMethod, setSortMethod] = useState('cheapest')
  const [sortedFlights, setSortedFlights] = useState([])

  useEffect(() => {
    if (flights && flights.length > 0) {
      setSortedFlights([...flights].sort((a, b) => a.price - b.price))
      setSortMethod('cheapest')
    } else {
      setSortedFlights([])
    }
  }, [flights])

  const getDurationMins = (durStr) => {
    const hours = parseInt(durStr.match(/(\d+)h/)?.[1] || 0)
    const mins = parseInt(durStr.match(/(\d+)m/)?.[1] || 0)
    return (hours * 60) + mins
  }

  const handleSort = (method) => {
    setSortMethod(method)
    let sorted = [...flights]
    if (method === 'cheapest') {
      sorted.sort((a, b) => a.price - b.price)
    } else if (method === 'fastest') {
      sorted.sort((a, b) => getDurationMins(a.duration) - getDurationMins(b.duration))
    } else {
      // Best Value algorithm: Combines price with a monetary penalty for long layovers/flight time
      sorted.sort((a, b) => {
        const scoreA = a.price + (getDurationMins(a.duration) * 15)
        const scoreB = b.price + (getDurationMins(b.duration) * 15)
        return scoreA - scoreB
      })
    }
    setSortedFlights(sorted)
  }

  const dateStr = date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

  return (
    <section className="relative z-10" id="results-section">
      <div className="container-main" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
        {loading && <div className="loading-bar"></div>}

        <div className="results-header flex items-center justify-between mb-10 flex-wrap gap-3">
          <div className="font-syne text-xl font-bold">
            {loading ? 'Searching...' : (<><span>{sortedFlights.length} flights</span> &nbsp;{from} → {to}&nbsp; <span className="text-text-muted text-sm">{dateStr}</span></>)}
          </div>
          <div className="filter-group">
            {['cheapest', 'fastest', 'best'].map((id) => (
              <button key={id} className={`filter-btn ${sortMethod === id ? 'active' : ''}`} onClick={() => handleSort(id)}>
                {id === 'cheapest' ? 'Cheapest' : id === 'fastest' ? 'Fastest' : 'Best Value'}
              </button>
            ))}
          </div>
        </div>

        {!loading && (
          <div className="flex flex-col gap-4">
            {sortedFlights.map((flight, i) => (
              <FlightCard key={flight.id || i} flight={{...flight, searchedDate: date, returnDate, tripType}} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
