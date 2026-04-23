import { useEffect, useState } from 'react'

const fallbackRoutes = [
  { id: 1, from: 'Mumbai', fromCode: 'BOM', to: 'Goa', toCode: 'GOI', price: 2499, duration: '1h 10m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&q=80' },
  { id: 2, from: 'Delhi', fromCode: 'DEL', to: 'Bangalore', toCode: 'BLR', price: 3199, duration: '2h 40m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=400&q=80' },
  { id: 3, from: 'Bangalore', fromCode: 'BLR', to: 'Chennai', toCode: 'MAA', price: 1899, duration: '1h 5m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&q=80' },
  { id: 4, from: 'Mumbai', fromCode: 'BOM', to: 'Dubai', toCode: 'DXB', price: 12499, duration: '3h 15m', stops: 'Direct', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80' },
]

export default function PopularRoutes({ onQuickSearch }) {
  const [routes, setRoutes] = useState([])

  useEffect(() => {
    fetch('/api/flights/popular')
      .then((r) => r.json())
      .then((d) => { if (d.success) setRoutes(d.routes) })
      .catch(() => setRoutes(fallbackRoutes))
  }, [])

  return (
    <section className="relative z-10" id="popular-section" style={{ padding: '3rem 0' }}>
      <div className="container-main">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-syne text-[1.75rem] font-bold tracking-tight">Popular <span className="text-accent">Routes</span></h2>
            <p className="text-text-muted text-sm mt-1">Trending destinations this season</p>
          </div>
          <a href="#" className="text-accent text-sm no-underline font-medium hover:opacity-70 transition-opacity" onClick={(e) => e.preventDefault()}>View all →</a>
        </div>

        <div className="routes-grid">
          {routes.map((route) => (
            <div key={route.id} className="route-card group" onClick={() => onQuickSearch?.(route.from, route.to)}>
              <div className="absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.05) 0%, transparent 60%)' }}></div>
              <div className="w-full rounded-[10px] mb-3 bg-cover bg-center relative overflow-hidden" style={{ height: 100, backgroundImage: `url('${route.image}')` }}>
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(10,22,40,0.7) 100%)' }}></div>
              </div>
              <div className="relative z-10">
                <div className="font-syne text-lg font-bold mb-1 flex items-center gap-2">{route.fromCode} <span className="text-accent">→</span> {route.toCode}</div>
                <div className="text-sm text-text-muted">{route.from} → {route.to}</div>
                <div className="text-xl font-semibold text-accent font-syne">₹{route.price.toLocaleString('en-IN')}</div>
                <div className="text-xs text-text-muted mt-1">{route.duration} · {route.stops}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
