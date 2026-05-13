import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const toggleMenu = () => {
    setMobileOpen(!mobileOpen)
    document.body.style.overflow = !mobileOpen ? 'hidden' : ''
  }
  const closeMenu = () => {
    if (mobileOpen) {
      setMobileOpen(false)
      document.body.style.overflow = ''
    }
  }

  const navItems = [
    { label: 'Flights', path: '/' },
    { label: 'Hotels', path: '/hotels' },
    { label: 'My Trips', path: '/my-trips' },
    { label: 'Deals', path: '/deals' },
  ]

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    logout()
    setProfileOpen(false)
    navigate('/')
  }

  return (
    <>
      <nav className="sticky top-0 z-[100] border-b border-white/[0.06] backdrop-blur-[10px]" style={{ background: 'rgba(10,22,40,0.6)' }}>
        <div className="container-main flex items-center justify-between py-4">
          <Link to="/" className="font-syne font-[800] text-2xl tracking-tight flex items-center gap-2 no-underline text-white" onClick={closeMenu}>
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-base">✈</div>
            Sky<span className="text-accent">Way</span>
          </Link>

          <ul className="nav-links flex gap-8 list-none">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`text-sm no-underline transition-colors duration-200 hover:text-white ${isActive(item.path) ? 'text-accent font-semibold' : 'text-text-muted'}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="nav-cta flex gap-3 items-center">
            {user ? (
              /* ── Logged-in state ── */
              <div className="relative">
                <button
                  className="flex items-center gap-2 bg-transparent border-none cursor-pointer text-white"
                  onClick={() => setProfileOpen(!profileOpen)}
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--color-accent)', color: '#0a1628' }}>
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">{user.firstName}</span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 5l3 3 3-3"/></svg>
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-[90]" onClick={() => setProfileOpen(false)}></div>
                    <div className="absolute right-0 top-full mt-2 z-[100] rounded-xl overflow-hidden" style={{ minWidth: 220, background: 'rgba(15,30,55,0.95)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', boxShadow: '0 12px 40px rgba(0,0,0,0.4)' }}>
                      <div className="px-4 py-3 border-b border-white/[0.06]">
                        <div className="font-medium text-sm">{user.firstName} {user.lastName}</div>
                        <div className="text-xs text-text-muted">{user.email}</div>
                      </div>
                      <Link to="/my-trips" className="block px-4 py-2.5 text-sm text-text-muted no-underline hover:text-white hover:bg-white/[0.04] transition-colors" onClick={() => setProfileOpen(false)}>
                        ✈ My Trips
                      </Link>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm bg-transparent border-none cursor-pointer transition-colors hover:bg-white/[0.04]" style={{ color: '#ef4444' }}>
                        ↪ Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* ── Guest state ── */
              <>
                <Link to="/signin" className="btn-ghost no-underline">Sign In</Link>
                <Link to="/register" className="btn-accent no-underline">Register</Link>
              </>
            )}
          </div>

          <button className="hamburger flex-col gap-[5px] cursor-pointer bg-transparent border-none p-1" onClick={toggleMenu} aria-label="Menu">
            <span className="block w-[22px] h-[2px] bg-white rounded-sm"></span>
            <span className="block w-[22px] h-[2px] bg-white rounded-sm"></span>
            <span className="block w-[22px] h-[2px] bg-white rounded-sm"></span>
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="mobile-menu">
          <button className="absolute top-6 right-8 bg-transparent border-none text-white text-2xl cursor-pointer" onClick={closeMenu}>✕</button>
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className={`font-syne text-2xl no-underline font-bold transition-colors ${isActive(item.path) ? 'text-accent' : 'text-white hover:text-accent'}`} onClick={closeMenu}>
              {item.label}
            </Link>
          ))}
          {user ? (
            <>
              <div className="text-text-muted text-sm">Signed in as {user.firstName}</div>
              <button className="btn-accent text-base px-8 py-3" onClick={() => { closeMenu(); handleLogout() }}>Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/signin" className="btn-accent text-base px-8 py-3 no-underline text-center" onClick={closeMenu}>Sign In</Link>
              <Link to="/register" className="btn-ghost text-base px-8 py-3 no-underline text-center" onClick={closeMenu}>Register</Link>
            </>
          )}
        </div>
      )}
    </>
  )
}
