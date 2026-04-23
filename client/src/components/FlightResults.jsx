import { useState, useEffect } from 'react'
import FlightCard from './FlightCard'

export default function FlightResults({ flights, from, to, date, loading }) {
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

  const handleSort = (method) => {
    setSortMethod(method)
    let sorted = [...flights]
    if (method === 'cheapest') sorted.sort((a, b) => a.price - b.price)
    else if (method === 'fastest') sorted.sort((a, b) => a.duration.localeCompare(b.duration))
    else sorted.sort((a, b) => (a.price - b.price) + (a.stops === 'Direct' ? -500 : 0))
    setSortedFlights(sorted)
  }

  const dateStr = date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

  return (
    <section className="relative z-10" id="results-section">
      <div className="container-main" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
        {loading && <div className="loading-bar"></div>}

        <div className="results-header flex items-center justify-between mb-8 flex-wrap gap-3">
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
              <FlightCard key={flight.id || i} flight={flight} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
