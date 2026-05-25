import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import SearchCard from '../components/SearchCard'
import FlightResults from '../components/FlightResults'
import PopularRoutes from '../components/PopularRoutes'
import StatsStrip from '../components/StatsStrip'
import Footer from '../components/Footer'

export default function Home() {
  const [flights, setFlights] = useState([])
  const [filterPrices, setFilterPrices] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchParams, setSearchParams] = useState({ from: '', to: '', date: '' })
  const resultsRef = useRef(null)
  const searchRef = useRef(null)

  const [searchParamsUrl] = useSearchParams()
  const urlFrom = searchParamsUrl.get('from')
  const urlTo = searchParamsUrl.get('to')
  const urlDate = searchParamsUrl.get('date')
  const dealPrice = searchParamsUrl.get('dealPrice')
  const dealDiscount = searchParamsUrl.get('discount')

  useEffect(() => {
    if (urlFrom && urlTo) {
      setTimeout(() => {
        handleSearch({ from: urlFrom, to: urlTo, depart: urlDate || new Date().toISOString().split('T')[0] })
      }, 500)
    }
  }, [urlFrom, urlTo, urlDate])

  const handleSearch = async ({ from, to, depart, returnDate, tripType = 'one-way' }) => {
    setShowResults(true)
    setLoading(true)
    setSearchParams({ from, to, date: depart, returnDate, tripType })

    try {
      const res = await fetch(`/api/flights?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${depart}`)
      const data = await res.json()
      setTimeout(() => {
        setLoading(false)
        if (data.success) {
          let updatedFlights = [...data.flights]

          // 1. Sort by price
          updatedFlights.sort((a, b) => a.price - b.price);

          // 2. Round-trip total simulation
          // Since the API currently fetches one-way flights, we multiply the price for round-trips
          let tripMultiplier = 1.0;
          if (tripType === 'round') {
            const departD = new Date(depart);
            const returnD = returnDate ? new Date(returnDate) : departD;
            const gapDays = Math.floor((returnD - departD) / (1000 * 60 * 60 * 24));
            
            if (gapDays <= 0) {
              tripMultiplier = 1.5;
            } else if (gapDays === 1) {
              tripMultiplier = 2.0;
            } else if (gapDays === 2) {
              tripMultiplier = 2.5;
            } else {
              tripMultiplier = gapDays > 14 ? 14 : gapDays; // cap at 14x
            }
          }

          // Apply Deal logic if present (promotional override)
          if (dealPrice && updatedFlights.length > 0) {
            const basePrice = parseInt(dealPrice, 10) * tripMultiplier;
            updatedFlights = updatedFlights.map((f, i) => {
              const isDeal = i < 6;
              return {
                ...f,
                price: i === 0 ? Math.floor(basePrice) : Math.floor(basePrice + Math.floor(Math.random() * 2000) + (i * 1200)),
                isDeal: isDeal,
                discount: isDeal ? (parseInt(dealDiscount, 10) || 0) : 0
              }
            })
          } else if (tripMultiplier > 1.0) {
            updatedFlights = updatedFlights.map(f => ({
              ...f,
              price: Math.floor(f.price * tripMultiplier)
            }))
          }
          
          setFlights(updatedFlights)
          setFilterPrices(data.filterPrices || null)
        } else {
          setFlights([]);
          alert(data.error || "Failed to fetch flights");
        }
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
      <div ref={searchRef} style={{ margin: '0.5rem 0 0' }}>
        <SearchCard onSearch={handleSearch} initialFrom={urlFrom} initialTo={urlTo} initialDate={urlDate} />
      </div>

      {showResults && (
        <div ref={resultsRef}>
          {dealPrice && dealDiscount && (
            <div className="container-main pt-8">
              <div className="rounded-xl px-5 py-4 flex items-center justify-between" style={{ background: 'rgba(34,208,122,0.1)', border: '1px solid rgba(34,208,122,0.3)', color: '#22d07a' }}>
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🎉</div>
                  <div>
                    <div className="font-bold text-lg">Special Deal Applied!</div>
                    <div className="text-sm opacity-90">You unlocked up to {dealDiscount}% OFF. Fares starting from ₹{parseInt(dealPrice, 10).toLocaleString('en-IN')}.</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <FlightResults flights={flights} from={searchParams.from} to={searchParams.to} date={searchParams.date} returnDate={searchParams.returnDate} tripType={searchParams.tripType} passengers={searchParams.passengers} loading={loading} filterPrices={filterPrices} />
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
