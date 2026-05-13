export default function StatsStrip() {
  const stats = [
    { num: '2M+',  label: 'Flights booked monthly', icon: '✈' },
    { num: '500+', label: 'Airlines partnered',      icon: '🤝' },
    { num: '150+', label: 'Countries covered',       icon: '🌍' },
    { num: '4.8★', label: 'Average user rating',     icon: '⭐' },
  ]

  return (
    <div
      className="relative z-10"
      style={{
        background: 'rgba(255,255,255,0.025)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '2.25rem 0',
        margin: '2rem 0',
      }}
    >
      <div className="container-main">
        <div className="stats-grid">
          {stats.map((s, i) => (
            <div key={i} className="stat-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', marginBottom: '0.4rem', opacity: 0.8 }}>{s.icon}</div>
              <div
                className="font-syne font-extrabold"
                style={{
                  fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                  background: 'linear-gradient(135deg, #f5a623 0%, #ffbe4d 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: 1.1,
                }}
              >
                {s.num}
              </div>
              <div className="text-sm text-text-muted mt-1" style={{ fontSize: '0.82rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
