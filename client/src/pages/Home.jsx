import { useState, useRef } from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import SearchCard from '../components/SearchCard'
import FlightResults from '../components/FlightResults'
import PopularRoutes from '../components/PopularRoutes'
import StatsStrip from '../components/StatsStrip'
import Footer from '../components/Footer'

export default function Home() {
  const [flights, setFlights] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchParams, setSearchParams] = useState({ from: '', to: '', date: '' })
  const resultsRef = useRef(null)
  const searchRef = useRef(null)

  const handleSearch = async ({ from, to, depart }) => {
    setShowResults(true)
    setLoading(true)
    setSearchParams({ from, to, date: depart })

    try {
      const res = await fetch(`/api/flights?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${depart}`)
      const data = await res.json()
      setTimeout(() => {
        setLoading(false)
        if (data.success) setFlights(data.flights)
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
      }, 800)
    } catch {
      setTimeout(() => { setLoading(false); setFlights([]) }, 800)
    }
  }

  const handleQuickSearch = (from, to) => {
    searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => handleSearch({ from, to, depart: new Date().toISOString().split('T')[0] }), 300)
  }

  return (
    <>
      <Navbar />
      <Hero />
      <div ref={searchRef}>
        <SearchCard onSearch={handleSearch} />
      </div>

      {showResults && (
        <div ref={resultsRef}>
          <FlightResults flights={flights} from={searchParams.from} to={searchParams.to} date={searchParams.date} loading={loading} />
          <div className="section-divider"></div>
        </div>
      )}

      <PopularRoutes onQuickSearch={handleQuickSearch} />
      <div className="section-divider"></div>
      <StatsStrip />
      <Footer />
    </>
  )
}
