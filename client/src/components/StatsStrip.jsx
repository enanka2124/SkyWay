export default function StatsStrip() {
  const stats = [
    { num: '2M+', label: 'Flights booked monthly' },
    { num: '500+', label: 'Airlines partnered' },
    { num: '150+', label: 'Countries covered' },
    { num: '4.8★', label: 'Average user rating' },
  ]

  return (
    <div className="relative z-10 border-y border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem 0', margin: '2rem 0' }}>
      <div className="container-main">
        <div className="stats-grid">
          {stats.map((s, i) => (
            <div key={i}>
              <div className="font-syne text-[2.2rem] font-[800] text-accent">{s.num}</div>
              <div className="text-sm text-text-muted mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
