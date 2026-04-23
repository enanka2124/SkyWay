import { Link } from 'react-router-dom'

export default function Footer() {
  const columns = [
    { title: 'Company', links: [
      { label: 'About Us', path: '/about' },
      { label: 'Careers', path: '/careers' },
      { label: 'Contact Us', path: '/contact' },
    ]},
    { title: 'Support', links: [
      { label: 'Help Center', path: '/help' },
      { label: 'Manage Booking', path: '/manage-booking' },
      { label: 'Refunds', path: '/refunds' },
    ]},
    { title: 'Legal', links: [
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Terms of Use', path: '/terms' },
      { label: 'Cookie Policy', path: '/cookie-policy' },
      { label: 'Accessibility', path: '/accessibility' },
    ]},
  ]

  return (
    <footer className="relative z-10 border-t border-white/[0.06]" style={{ background: 'rgba(0,0,0,0.2)', padding: '3rem 0 2rem' }}>
      <div className="container-main">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="font-syne font-[800] text-2xl tracking-tight flex items-center gap-2 mb-4 no-underline text-white">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-base">✈</div>
              Sky<span className="text-accent">Way</span>
            </Link>
            <p className="text-text-muted text-sm leading-relaxed" style={{ maxWidth: 260 }}>
              Your trusted travel companion for seamless flight booking experiences across the globe.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-syne font-bold mb-4 text-sm tracking-wide">{col.title}</h4>
              <ul className="list-none flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.path}>
                    <Link to={link.path} className="text-text-muted no-underline text-sm hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom border-t border-white/[0.06] flex justify-between items-center text-xs text-text-muted" style={{ marginTop: '3rem', paddingTop: '2rem', paddingBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span>© 2026 SkyWay. All rights reserved.</span>
          <span>Designed for dreamers. Built for travelers.</span>
        </div>
      </div>
    </footer>
  )
}
