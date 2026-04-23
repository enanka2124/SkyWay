import { useState, useEffect } from 'react'

export default function SearchCard({ onSearch }) {
  const [activeTab, setActiveTab] = useState('one-way')
  const [from, setFrom] = useState('Mumbai (BOM)')
  const [to, setTo] = useState('Delhi (DEL)')
  const [depart, setDepart] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [passengers, setPassengers] = useState('1 Adult')
  const [cabin, setCabin] = useState('Economy')

  useEffect(() => {
    const today = new Date()
    const offset = today.getTimezoneOffset() * 60000
    const toLocalISO = (d) => new Date(d - offset).toISOString().split('T')[0]
    setDepart(toLocalISO(today))
    const next = new Date(); next.setDate(next.getDate() + 7)
    setReturnDate(toLocalISO(next))
  }, [])

  const swapCities = () => { setFrom(to); setTo(from) }
  const handleSearch = () => { onSearch?.({ from, to, depart, returnDate, passengers, cabin }) }

  const tabs = [
    { id: 'one-way', label: 'One Way' },
    { id: 'round', label: 'Round Trip' },
    { id: 'multi', label: 'Multi-City' },
  ]

  return (
    <div className="relative z-20" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 2rem 4rem' }}>
      <div className="anim-4 glass-card">
        {/* Tabs */}
        <div className="flex gap-1 rounded-[10px] p-1 mb-6 w-fit" style={{ background: 'rgba(255,255,255,0.06)' }}>
          {tabs.map((tab) => (
            <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* From / Swap / To */}
        <div className="search-fields-row">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted tracking-wider uppercase">From</label>
            <input type="text" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="City or Airport" className="sky-input" />
          </div>
          <button onClick={swapCities} title="Swap cities" className="swap-btn self-end mb-0.5">⇄</button>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted tracking-wider uppercase">To</label>
            <input type="text" value={to} onChange={(e) => setTo(e.target.value)} placeholder="City or Airport" className="sky-input" />
          </div>
        </div>

        {/* Date / Passengers / Class / Search */}
        <div className="search-bottom-row">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted tracking-wider uppercase">Departure</label>
            <input type="date" value={depart} onChange={(e) => setDepart(e.target.value)} className="sky-input" style={{ colorScheme: 'dark' }} />
          </div>
          <div className="flex flex-col gap-1.5" style={{ opacity: activeTab === 'one-way' ? 0.4 : 1, pointerEvents: activeTab === 'one-way' ? 'none' : 'auto' }}>
            <label className="text-xs font-medium text-text-muted tracking-wider uppercase">Return</label>
            <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="sky-input" style={{ colorScheme: 'dark' }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted tracking-wider uppercase">Passengers</label>
            <select value={passengers} onChange={(e) => setPassengers(e.target.value)} className="sky-input">
              <option>1 Adult</option><option>2 Adults</option><option>3 Adults</option>
              <option>4 Adults</option><option>2 Adults, 1 Child</option><option>2 Adults, 2 Children</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted tracking-wider uppercase">Class</label>
            <select value={cabin} onChange={(e) => setCabin(e.target.value)} className="sky-input">
              <option>Economy</option><option>Premium Economy</option><option>Business</option><option>First Class</option>
            </select>
          </div>
          <button onClick={handleSearch} className="search-cta">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Search
          </button>
        </div>
      </div>
    </div>
  )
}
