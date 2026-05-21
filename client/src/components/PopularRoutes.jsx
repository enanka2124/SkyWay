import { useEffect, useState } from 'react'

// Destination images keyed by city name (destination city)
const cityImages = {
  'Goa':        'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&q=80',
  'Bangalore':  'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=400&q=80',
  'Chennai':    'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&q=80',
  'Dubai':      'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80',
  'Jaipur':     'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400&q=80',
  'Kolkata':    'https://images.unsplash.com/photo-1558431382-27e303142255?w=400&q=80',
  'Delhi':      'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80',
  'Mumbai':     'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&q=80',
  'Manali':     'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400&q=80',
  'Singapore':  'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80',
  'Bangkok':    'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&q=80',
  'Kathmandu':  'https://images.unsplash.com/photo-1581403067825-7bdf9c6e5c9b?w=400&q=80',
  'Udaipur':    'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&q=80',
  'London':     'https://images.unsplash.com/photo-1513635269975-5969336cd190?w=400&q=80',
  'New York':   'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&q=80',
  'Paris':      'https://images.unsplash.com/photo-1502602898657-3e907a5ea071?w=400&q=80',
  'Tokyo':      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80',
  'Bali':       'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80',
  'Colombo':    'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=400&q=80',
  'Hyderabad':  'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?w=400&q=80',
  'Pune':       'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&q=80',
  'Ahmedabad':  'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&q=80',
  'default':    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&q=80',
}

const getRouteImage = (route) =>
  route.image ||
  cityImages[route.to] ||
  cityImages[route.from] ||
  cityImages['default']

// Full fallback list — mirrors server popularRoutes, shown immediately on load
const fallbackRoutes = [
  { id: 1,  from: 'Mumbai',    fromCode: 'BOM', to: 'Goa',       toCode: 'GOI', price: 4199,  duration: '1h 10m', stops: 'Direct' },
  { id: 2,  from: 'Delhi',     fromCode: 'DEL', to: 'Bangalore', toCode: 'BLR', price: 5199,  duration: '2h 40m', stops: 'Direct' },
  { id: 3,  from: 'Bangalore', fromCode: 'BLR', to: 'Chennai',   toCode: 'MAA', price: 4299,  duration: '1h 5m',  stops: 'Direct' },
  { id: 4,  from: 'Mumbai',    fromCode: 'BOM', to: 'Dubai',     toCode: 'DXB', price: 16499, duration: '3h 15m', stops: 'Direct' },
  { id: 5,  from: 'Delhi',     fromCode: 'DEL', to: 'Jaipur',    toCode: 'JAI', price: 4199,  duration: '1h 5m',  stops: 'Direct' },
  { id: 6,  from: 'Mumbai',    fromCode: 'BOM', to: 'Kolkata',   toCode: 'CCU', price: 5299,  duration: '2h 35m', stops: 'Direct' },
  { id: 7,  from: 'Hyderabad', fromCode: 'HYD', to: 'Delhi',     toCode: 'DEL', price: 4599,  duration: '2h 10m', stops: 'Direct' },
  { id: 8,  from: 'Chennai',   fromCode: 'MAA', to: 'Mumbai',    toCode: 'BOM', price: 4399,  duration: '1h 50m', stops: 'Direct' },
  { id: 9,  from: 'Delhi',     fromCode: 'DEL', to: 'Manali',    toCode: 'KUU', price: 4999,  duration: '1h 30m', stops: 'Direct' },
  { id: 10, from: 'Bangalore', fromCode: 'BLR', to: 'Goa',       toCode: 'GOI', price: 4299,  duration: '1h 15m', stops: 'Direct' },
  { id: 11, from: 'Mumbai',    fromCode: 'BOM', to: 'Singapore', toCode: 'SIN', price: 21999, duration: '5h 30m', stops: 'Direct' },
  { id: 12, from: 'Delhi',     fromCode: 'DEL', to: 'Bangkok',   toCode: 'BKK', price: 16999, duration: '4h 20m', stops: 'Direct' },
  { id: 13, from: 'Kolkata',   fromCode: 'CCU', to: 'Bangalore', toCode: 'BLR', price: 5599,  duration: '2h 45m', stops: 'Direct' },
  { id: 14, from: 'Hyderabad', fromCode: 'HYD', to: 'Dubai',     toCode: 'DXB', price: 17999, duration: '3h 45m', stops: 'Direct' },
  { id: 15, from: 'Delhi',     fromCode: 'DEL', to: 'Udaipur',   toCode: 'UDR', price: 4399,  duration: '1h 20m', stops: 'Direct' },
  { id: 16, from: 'Mumbai',    fromCode: 'BOM', to: 'Jaipur',    toCode: 'JAI', price: 4499,  duration: '2h 0m',  stops: 'Direct' },
  { id: 17, from: 'Delhi',     fromCode: 'DEL', to: 'London',    toCode: 'LHR', price: 45999, duration: '9h 30m', stops: 'Direct' },
  { id: 18, from: 'Mumbai',    fromCode: 'BOM', to: 'New York',  toCode: 'JFK', price: 65999, duration: '15h 45m', stops: '1 Stop' },
  { id: 19, from: 'Bangalore', fromCode: 'BLR', to: 'Paris',     toCode: 'CDG', price: 48999, duration: '10h 15m', stops: '1 Stop' },
  { id: 20, from: 'Chennai',   fromCode: 'MAA', to: 'Colombo',   toCode: 'CMB', price: 15999, duration: '1h 25m', stops: 'Direct' },
  { id: 21, from: 'Delhi',     fromCode: 'DEL', to: 'Tokyo',     toCode: 'NRT', price: 52999, duration: '8h 20m', stops: '1 Stop' },
  { id: 22, from: 'Mumbai',    fromCode: 'BOM', to: 'Bali',      toCode: 'DPS', price: 28999, duration: '7h 10m', stops: '1 Stop' },
  { id: 23, from: 'Pune',      fromCode: 'PNQ', to: 'Delhi',     toCode: 'DEL', price: 4499,  duration: '2h 10m', stops: 'Direct' },
  { id: 24, from: 'Ahmedabad', fromCode: 'AMD', to: 'Mumbai',    toCode: 'BOM', price: 4199,  duration: '1h 5m',  stops: 'Direct' },
  { id: 25, from: 'Kolkata',   fromCode: 'CCU', to: 'Kathmandu', toCode: 'KTM', price: 15999, duration: '1h 45m', stops: 'Direct' },
]

export default function PopularRoutes({ onQuickSearch }) {
  // Start with fallbackRoutes so images show immediately — no blank state
  const [routes, setRoutes] = useState(fallbackRoutes)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetch('/api/flights/popular')
      .then((r) => r.json())
      .then((d) => { if (d.success && d.routes?.length) setRoutes(d.routes) })
      .catch(() => {/* keep fallback */})
  }, [])

  const handleToggleShowAll = () => setShowAll(prev => !prev);

  const handleLinkEnter = (e) => {
    e.currentTarget.style.background = 'rgba(245,166,35,0.1)';
    e.currentTarget.style.transform = 'translateY(-1px)';
  };

  const handleLinkLeave = (e) => {
    e.currentTarget.style.background = 'none';
    e.currentTarget.style.transform = 'none';
  };

  const displayRoutes = showAll ? routes : routes.slice(0, 8)

  return (
    <section className="relative z-10" id="popular-section" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem) 0' }}>
      <div className="container-main">
        {/* Header */}
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <h2 className="font-syne font-bold tracking-tight" style={{ fontSize: 'clamp(1.4rem,3vw,1.75rem)' }}>
              Popular <span className="text-accent">Routes</span>
            </h2>
            <p className="text-text-muted text-sm mt-1">Trending destinations this season</p>
          </div>
          <button
            onClick={handleToggleShowAll}
            style={{
              background: 'none', border: 'none',
              color: 'var(--color-accent)',
              fontSize: '0.875rem', fontWeight: 600,
              cursor: 'pointer', padding: '6px 12px',
              borderRadius: '8px', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
            onMouseEnter={handleLinkEnter}
            onMouseLeave={handleLinkLeave}
          >
            {showAll ? '↑ Show less' : 'View all →'}
          </button>
        </div>

        {/* Grid */}
        <div className="routes-grid">
          {displayRoutes.map((route) => {
            const img = getRouteImage(route)
            return (
              <div
                key={route.id}
                className="route-card group cursor-pointer"
                onClick={() => onQuickSearch?.(route.from, route.to)}
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.06) 0%, transparent 60%)' }}
                />

                {/* Image with <img> tag for reliable onerror fallback */}
                <div className="w-full rounded-[12px] mb-3 relative overflow-hidden" style={{ height: 130 }}>
                  <img
                    src={img}
                    alt={`${route.from} to ${route.to}`}
                    onError={(e) => { e.target.onerror = null; e.target.src = cityImages['default'] }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  {/* Gradient overlay */}
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to bottom, transparent 25%, rgba(6,14,30,0.75) 100%)' }}
                  />
                  {/* City name on image */}
                  <div className="absolute bottom-2 left-3">
                    <div className="font-syne text-sm font-bold text-white" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                      {route.to}
                    </div>
                  </div>
                </div>

                {/* Route info */}
                <div className="relative z-10">
                  <div className="font-syne text-base font-bold mb-1 flex items-center gap-1.5">
                    {route.fromCode} <span className="text-accent">→</span> {route.toCode}
                  </div>
                  <div className="text-xs text-text-muted mb-1.5">{route.from} → {route.to}</div>
                  <div
                    className="font-syne font-bold"
                    style={{
                      fontSize: '1.15rem',
                      background: 'linear-gradient(135deg, #f5a623, #ffbe4d)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    ₹{route.price.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">{route.duration}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
