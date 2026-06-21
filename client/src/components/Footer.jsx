import { Link } from 'react-router-dom'

export default function Footer() {
  const columns = [
    { title: 'Company', links: [
      { label: 'About Us',    path: '/about' },
      { label: 'Careers',     path: '/careers' },
      { label: 'Contact Us',  path: '/contact' },
    ]},
    { title: 'Support', links: [
      { label: 'Help Center',     path: '/help' },
      { label: 'Manage Booking',  path: '/manage-booking' },
      { label: 'Refunds',         path: '/refunds' },
    ]},
    { title: 'Legal', links: [
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Terms of Use',   path: '/terms' },
      { label: 'Cookie Policy',  path: '/cookie-policy' },
      { label: 'Accessibility',  path: '/accessibility' },
    ]},
  ]

  return (
    <footer
      className="relative z-10 transition-colors duration-300"
      style={{
        background: 'var(--footer-bg)',
        borderTop: '1px solid var(--footer-border)',
        padding: '4rem 0 0',
      }}
    >
      <div className="container-main">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <Link to="/" className="font-syne font-extrabold text-2xl tracking-tight flex items-center gap-2.5 mb-4 no-underline" style={{ color: 'var(--text-primary)' }}>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                style={{
                  background: 'linear-gradient(135deg, #f5a623 0%, #e8940f 100%)',
                  boxShadow: '0 4px 14px rgba(245,166,35,0.35)',
                  color: '#060e1e',
                }}
              >
                ✈
              </div>
              Sky<span className="text-accent">Way</span>
            </Link>
            <p className="text-text-muted text-sm leading-relaxed" style={{ maxWidth: 240, lineHeight: 1.7 }}>
              Your trusted travel companion for seamless flight &amp; hotel bookings across the globe.
            </p>
            {/* Social icons */}
            <div className="flex gap-3 mt-5">
              {['𝕏', 'in', 'f'].map((icon, i) => (
                <a
                  key={i}
                  href={icon === 'in' ? 'https://www.linkedin.com/in/enankanandi/' : '#'}
                  target={icon === 'in' ? '_blank' : undefined}
                  rel={icon === 'in' ? 'noopener noreferrer' : undefined}
                  className="social-icon"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-syne font-bold mb-4 text-sm tracking-widest uppercase" style={{ letterSpacing: '0.1em', color: 'var(--footer-title)' }}>
                {col.title}
              </h4>
              <ul className="list-none flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="footer-link"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="footer-bottom flex justify-between items-center text-xs text-text-muted"
          style={{
            marginTop: '3rem',
            paddingTop: '1.5rem',
            paddingBottom: '1.5rem',
            borderTop: '1px solid var(--footer-border)',
            flexWrap: 'wrap', gap: '0.5rem',
          }}
        >
          <span>© 2026 SkyWay. All rights reserved.</span>
          <span style={{ opacity: 0.6 }}>Designed for dreamers. Built for travelers. 🚀</span>
        </div>
      </div>
    </footer>
  )
}
