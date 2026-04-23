export default function Hero() {
  return (
    <section className="relative z-10 text-center" style={{ padding: '4rem 0 1.5rem' }}>
      <div className="container-main">
        <div className="anim-1 inline-flex items-center gap-1.5 text-accent text-[0.8rem] font-medium px-3.5 py-1.5 rounded-[20px] mb-5 before:content-['✦'] before:text-[10px]" style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.25)' }}>
          Book smarter, fly better
        </div>
        <h1 className="anim-2 font-syne font-[800] leading-[1.05] tracking-[-2px] mb-3" style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>
          The Sky Is<em className="not-italic text-accent block">Your Runway</em>
        </h1>
        <p className="anim-3 text-text-muted text-center leading-normal mx-auto hero-subtitle" style={{ marginBottom: '2.5rem' }}>
          Find the best fares, compare airlines, and book your next adventure in seconds.
        </p>
      </div>
    </section>
  )
}
