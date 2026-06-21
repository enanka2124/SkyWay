import { useState, useEffect, useRef } from 'react'

// Comprehensive list of cities for the smart autocorrect feature
const knownCities = [
  'Mumbai', 'Goa', 'Delhi', 'Bangalore', 'Chennai', 'Dubai', 'Jaipur', 'Kolkata', 'Hyderabad', 'Manali', 'Singapore', 'Bangkok', 'Udaipur', 'Pune', 'Ahmedabad', 'London', 'New York', 'Paris', 'Tokyo', 'Bali', 'Colombo', 'Kathmandu', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara', 'Ludhiana', 'Agra', 'Nashik', 'Rajkot', 'Varanasi', 'Srinagar', 'Aurangabad', 'Amritsar', 'Allahabad', 'Ranchi', 'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur', 'Kota', 'Guwahati', 'Chandigarh', 'Mysore', 'Tiruchirappalli', 'Bhubaneswar', 'Thiruvananthapuram', 'Kochi', 'Dehradun', 'Mangalore', 'Tirupati'
];

/**
 * Standard Levenshtein algorithm to calculate string similarity.
 * Used for the search city suggestion engine.
 */
const getLevenshteinDistance = (s1, s2) => {
  const table = Array.from({ length: s2.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= s1.length; j++) table[0][j] = j;

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      const cost = s1[j - 1] === s2[i - 1] ? 0 : 1;
      table[i][j] = Math.min(
        table[i - 1][j] + 1,      // deletion
        table[i][j - 1] + 1,      // insertion
        table[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return table[s2.length][s1.length];
};

/**
 * Intelligent city name correction. 
 * First checks for substring matches, then falls back to fuzzy matching.
 */
const autoCorrectCity = (input) => {
  if (!input || input.length < 3) return input;

  // Strip out airport codes in parentheses if present
  const query = input.trim().replace(/\s*\(.*?\)/, '').toLowerCase();

  const exact = knownCities.find(c => c.toLowerCase() === query);
  if (exact) return input;

  let bestMatch = null;
  let minDiff = Infinity;

  for (const city of knownCities) {
    const cityLower = city.toLowerCase();

    // Quick substring check for better UX
    if (cityLower.includes(query) || query.includes(cityLower)) {
      return city;
    }

    // Fuzzy matching for typos
    const dist = getLevenshteinDistance(query, cityLower);
    if (dist < minDiff && dist <= 3) {
      minDiff = dist;
      bestMatch = city;
    }
  }

  return bestMatch || input;
};

export default function SearchCard({ onSearch, initialFrom, initialTo, initialDate }) {
  const [activeTab, setActiveTab] = useState('one-way')
  const [from, setFrom] = useState(initialFrom || 'Mumbai (BOM)')
  const [to, setTo] = useState(initialTo || 'Delhi (DEL)')
  const [depart, setDepart] = useState(initialDate || '')
  const [returnDate, setReturnDate] = useState('')
  const [passengers, setPassengers] = useState('1 Adult')
  const [cabin, setCabin] = useState('Economy')

  // Set default dates if not provided by parent
  useEffect(() => {
    if (!initialDate) {
      const today = new Date()
      const timezoneOffset = today.getTimezoneOffset() * 60000
      const toLocalISO = (d) => new Date(d - timezoneOffset).toISOString().split('T')[0]

      setDepart(toLocalISO(today))

      const oneWeekLater = new Date();
      oneWeekLater.setDate(oneWeekLater.getDate() + 7)
      setReturnDate(toLocalISO(oneWeekLater))
    }
  }, [initialDate])

  const [showDepartCal, setShowDepartCal] = useState(false)
  const [showReturnCal, setShowReturnCal] = useState(false)
  const [showComingSoon, setShowComingSoon] = useState(false)
  const departRef = useRef(null)
  const returnRef = useRef(null)

  /**
   * REAL MARKET demand color — perfectly synced with backend surge multiplier.
   *
   *  🔴 Red    today & 1–2 days  → last-minute surge, prices from ₹7k+
   *  🟡 Yellow 3–21 days ahead   → medium demand, prices from ₹5k
   *  🟢 Green  3–21 days (~35%)  → random flash-deal, prices from ₹4,000
   *  🟢 Green  22+ days always   → advance booking, prices from ₹4,000
   *
   * Green dots NEVER appear on today or past dates.
   * Random green/yellow uses a bit-mixing hash so dots look truly random
   * (not sequential — plain LCG on y*10000+mo*100+d gives almost identical
   * outputs for adjacent days, creating a visible pattern).
   */
  const getDemandColorForDate = (dateStr) => {
    if (!dateStr) return '#22c55e'
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const [y, mo, d] = dateStr.split('-').map(Number)
    const travel = new Date(y, mo - 1, d)
    const daysAhead = Math.floor((travel - today) / (1000 * 60 * 60 * 24))

    // Past or today → always red
    if (daysAhead <= 0) return '#ef4444'  // 🔴
    if (daysAhead <= 2) return '#ef4444'  // 🔴 last-minute, starts ₹7k

    // 22+ days → always green (advance booking, from ₹4,000)
    if (daysAhead >= 22) return '#22c55e' // 🟢

    // 3–21 days: bit-mixing hash → visually random green/yellow scatter
    // Same algorithm as backend getDateDotColor for consistency.
    let h = (d * 374761393 + mo * 1073741827 + y * 2654435761) | 0
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b)
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b)
    h = (h ^ (h >>> 16)) >>> 0
    const pseudo = h / 0xffffffff
    if (pseudo < 0.35) return '#22c55e'  // 🟢 ~35% flash-deal green (starts from day 3)
    return '#eab308'                     // 🟡 standard yellow, starts ₹5k
  }

  // Handle clicks outside of custom calendars to close them
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (departRef.current && !departRef.current.contains(e.target)) setShowDepartCal(false)
      if (returnRef.current && !returnRef.current.contains(e.target)) setShowReturnCal(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const swapCities = () => {
    const prevFrom = from;
    setFrom(to);
    setTo(prevFrom);
  }

  const handleSearch = () => {
    const finalFrom = autoCorrectCity(from);
    const finalTo = autoCorrectCity(to);

    // Auto-update UI if corrections were made
    if (finalFrom !== from) setFrom(finalFrom);
    if (finalTo !== to) setTo(finalTo);

    onSearch?.({
      from: finalFrom,
      to: finalTo,
      depart,
      returnDate,
      passengers,
      cabin,
      tripType: activeTab
    })
  }

  // A custom, premium calendar implementation for better UX
  const CustomCalendar = ({ value, onChange, onClose }) => {
    const [viewDate, setViewDate] = useState(new Date(value || new Date()))
    
    // Limits
    const today = new Date();
    today.setHours(0,0,0,0);
    const maxDate = new Date(today);
    maxDate.setMonth(today.getMonth() + 3);

    const yr = viewDate.getFullYear()
    const mo = viewDate.getMonth()
    const daysCount = new Date(yr, mo + 1, 0).getDate()
    const startDay = new Date(yr, mo, 1).getDay()

    const calendarGrid = []
    for (let i = 0; i < startDay; i++) calendarGrid.push(null)
    for (let i = 1; i <= daysCount; i++) calendarGrid.push(i)

    const handlePrev = (e) => {
      e.stopPropagation();
      const prev = new Date(yr, mo - 1, 1);
      if (prev.getFullYear() > today.getFullYear() || (prev.getFullYear() === today.getFullYear() && prev.getMonth() >= today.getMonth())) {
        setViewDate(prev);
      }
    }

    const handleNext = (e) => {
      e.stopPropagation();
      const next = new Date(yr, mo + 1, 1);
      if (next.getFullYear() < maxDate.getFullYear() || (next.getFullYear() === maxDate.getFullYear() && next.getMonth() <= maxDate.getMonth())) {
        setViewDate(next);
      }
    }
    
    const canPrev = yr > today.getFullYear() || (yr === today.getFullYear() && mo > today.getMonth());
    const canNext = yr < maxDate.getFullYear() || (yr === maxDate.getFullYear() && mo < maxDate.getMonth());

    return (
      <div
        className="absolute top-full left-0 mt-2 p-4 rounded-xl z-50"
        style={{
          width: 'min(280px, calc(100vw - 2rem))',
          background: 'var(--modal-bg)',
          border: '1px solid var(--modal-border)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <div className="flex justify-between items-center mb-4 font-bold" style={{ color: 'var(--text-primary)' }}>
          <button
            type="button"
            onClick={handlePrev}
            disabled={!canPrev}
            className={`p-1.5 rounded-md leading-none transition-colors border-none bg-transparent ${!canPrev ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
            style={{ color: 'var(--text-primary)' }}
            onMouseEnter={(e) => { if (canPrev) e.currentTarget.style.background = 'var(--btn-ghost-bg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            &lt;
          </button>
          <span>{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canNext}
            className={`p-1.5 rounded-md leading-none transition-colors border-none bg-transparent ${!canNext ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
            style={{ color: 'var(--text-primary)' }}
            onMouseEnter={(e) => { if (canNext) e.currentTarget.style.background = 'var(--btn-ghost-bg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            &gt;
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => <div key={day}>{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {calendarGrid.map((dayNum, idx) => {
            if (!dayNum) return <div key={idx}></div>
            const dateStr = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
            const demandColor = getDemandColorForDate(dateStr)
            const isSelected = value === dateStr
            const isBlocked = new Date(dateStr) < today || new Date(dateStr) > maxDate

            return (
              <button
                type="button"
                key={idx}
                onClick={(e) => { e.stopPropagation(); if (!isBlocked) { onChange(dateStr); onClose() } }}
                disabled={isBlocked}
                className={`p-2 rounded-lg text-sm border-none transition-all ${isBlocked ? 'opacity-20 cursor-not-allowed' : 'relative cursor-pointer'}`}
                style={{
                  background: isSelected ? 'var(--color-accent)' : 'transparent',
                  color: isSelected ? '#060e1e' : 'var(--text-primary)',
                  fontWeight: isSelected ? '700' : '500',
                  boxShadow: isSelected ? '0 4px 12px rgba(245,166,35,0.3)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected && !isBlocked) e.currentTarget.style.background = 'var(--btn-ghost-bg)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected && !isBlocked) e.currentTarget.style.background = 'transparent';
                }}
              >
                {dayNum}
                {!isBlocked && (
                  <div
                    style={{
                      background: demandColor,
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      margin: '2px auto 0'
                    }}
                    title={
                      demandColor === '#ef4444'
                        ? '🔴 High price — last-minute booking'
                        : demandColor === '#eab308'
                        ? '🟡 Medium price — standard booking'
                        : '🟢 Best price — advance booking'
                    }
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const tabOptions = [
    { id: 'one-way', label: 'One Way' },
    { id: 'round', label: 'Round Trip' },
    { id: 'multi', label: 'Multi-City' },
  ]

  return (
    <div className="relative z-20" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0.5rem 1rem 3rem' }}>

      {showComingSoon && (
        <div className="modal-overlay" style={{ zIndex: 9999, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} onClick={() => setShowComingSoon(false)}>
          <div className="glass-card" style={{ padding: '3rem 2.5rem', textAlign: 'center', maxWidth: '400px', width: '90%', animation: 'float 0.3s ease-out' }} onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4" style={{ background: 'rgba(34,208,122,0.1)', border: '1px solid rgba(34,208,122,0.3)', color: '#22d07a' }}>🚀</div>
            <h3 className="font-syne text-2xl font-bold mb-2">Coming Soon!</h3>
            <p className="text-text-muted mb-6">We're working hard on bringing you an advanced Multi-City flight planner. Stay tuned for updates!</p>
            <button className="btn-accent w-full py-3 rounded-lg font-bold" onClick={() => setShowComingSoon(false)}>Got it!</button>
          </div>
        </div>
      )}

      <div className="anim-4 glass-card">
        {/* Navigation Tabs + Legend */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
          <div className="flex gap-1 rounded-[10px] p-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
            {tabOptions.map((tab) => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''} ${tab.id === 'multi' ? 'opacity-40 cursor-not-allowed' : ''}`}
                onClick={(e) => {
                  if (tab.id === 'multi') { e.preventDefault(); setShowComingSoon(true); return; }
                  setActiveTab(tab.id);
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3" style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
            {[['#22c55e', 'Low'], ['#eab308', 'Med'], ['#ef4444', 'High']].map(([c, l]) => (
              <span key={l} className="flex items-center gap-1">
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: c, display: 'inline-block', boxShadow: `0 0 5px ${c}99` }}></span>{l}
              </span>
            ))}
          </div>
        </div>

        {/* Origin / Destination Search Section */}
        <div className="search-fields-row" style={{ marginBottom: '1rem', gap: '12px' }}>
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

        {/* Search Metadata (Dates, Passengers, Class) */}
        <div className="search-bottom-row" style={{ gap: '12px' }}>
          <div className="flex flex-col gap-1.5 relative" ref={departRef}>
            <label className="text-xs font-medium text-text-muted tracking-wider uppercase">
              Departure
            </label>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={depart}
                onClick={() => setShowDepartCal(!showDepartCal)}
                className="sky-input cursor-pointer w-full pr-10"
                style={{ colorScheme: 'dark' }}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <div
                  style={{
                    background: getDemandColorForDate(depart),
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    boxShadow: '0 0 8px rgba(0,0,0,0.5)'
                  }}
                  title="Selected Demand Level"
                />
              </div>
            </div>
            {showDepartCal && (
              <CustomCalendar value={depart} onChange={setDepart} onClose={() => setShowDepartCal(false)} />
            )}
          </div>
          <div
            className="flex flex-col gap-1.5 relative"
            ref={returnRef}
            style={{
              opacity: activeTab === 'one-way' ? 0.4 : 1,
              pointerEvents: activeTab === 'one-way' ? 'none' : 'auto'
            }}
          >
            <label className="text-xs font-medium text-text-muted tracking-wider uppercase">Return</label>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={returnDate}
                onClick={() => setShowReturnCal(!showReturnCal)}
                className="sky-input cursor-pointer w-full pr-10"
                style={{ colorScheme: 'dark' }}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <div
                  style={{
                    background: getDemandColorForDate(returnDate),
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    boxShadow: '0 0 8px rgba(0,0,0,0.5)'
                  }}
                  title="Selected Demand Level"
                />
              </div>
            </div>
            {showReturnCal && (
              <CustomCalendar value={returnDate} onChange={setReturnDate} onClose={() => setShowReturnCal(false)} />
            )}
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            Search
          </button>
        </div>
      </div>
    </div>
  )
}
