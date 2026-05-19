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
    if (mobileOpen) { setMobileOpen(false); document.body.style.overflow = '' }
  }

  const navItems = [
    { label: 'Flights', path: '/' },
    { label: 'Hotels', path: '/hotels' },
    ...(user ? [{ label: 'My Trips', path: '/my-trips' }] : []),
    { label: 'Deals', path: '/deals' },
  ]

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/');
  }

  const handleItemEnter = (e, path) => {
    if (!isActive(path)) {
      e.currentTarget.style.color = '#e8f0ff';
      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
    }
  };

  const handleItemLeave = (e, path) => {
    if (!isActive(path)) {
      e.currentTarget.style.color = 'var(--color-text-muted)';
      e.currentTarget.style.background = 'transparent';
    }
  };

  const handleProfileEnter = (e) => e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
  const handleProfileLeave = (e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)';

  const handleMenuEnter = (e) => {
    e.currentTarget.style.color = '#e8f0ff';
    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
  };

  const handleMenuLeave = (e) => {
    e.currentTarget.style.color = '';
    e.currentTarget.style.background = '';
  };

  const handleSignoutEnter = (e) => e.currentTarget.style.background = 'rgba(239,68,68,0.07)';
  const handleSignoutLeave = (e) => e.currentTarget.style.background = '';

  return (
    <>
      <nav
        className="sticky top-0 z-100"
        style={{
          background: 'rgba(6,14,30,0.72)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
        }}
      >
        <div className="container-main flex items-center justify-between py-4">

          {/* Logo */}
          <Link
            to="/"
            className="font-syne font-extrabold text-2xl tracking-tight flex items-center gap-2.5 no-underline text-white"
            onClick={closeMenu}
            style={{ letterSpacing: '-0.5px' }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
              style={{
                background: 'linear-gradient(135deg, #f5a623 0%, #e8940f 100%)',
                boxShadow: '0 3px 12px rgba(245,166,35,0.35)',
                color: '#060e1e',
                fontWeight: 900,
              }}
            >
              ✈
            </div>
            Sky<span className="text-accent">Way</span>
          </Link>

          {/* Desktop nav links */}
          <ul className="nav-links flex gap-1 list-none">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className="no-underline text-sm font-medium transition-all"
                  style={{
                    color: isActive(item.path) ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    padding: '8px 16px',
                    borderRadius: 10,
                    display: 'block',
                    background: isActive(item.path) ? 'rgba(245,166,35,0.09)' : 'transparent',
                    border: isActive(item.path) ? '1px solid rgba(245,166,35,0.2)' : '1px solid transparent',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => handleItemEnter(e, item.path)}
                  onMouseLeave={(e) => handleItemLeave(e, item.path)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="nav-cta flex gap-2.5 items-center">
            {user ? (
              <div className="relative">
                <button
                  className="flex items-center gap-2.5 bg-transparent border-none cursor-pointer text-white"
                  onClick={() => setProfileOpen(!profileOpen)}
                  style={{
                    padding: '6px 12px 6px 6px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={handleProfileEnter}
                  onMouseLeave={handleProfileLeave}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg, #f5a623, #e8940f)', color: '#060e1e' }}
                  >
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline" style={{ color: '#e8f0ff' }}>{user.firstName}</span>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5 }}>
                    <path d="M3 5l3 3 3-3" />
                  </svg>
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-90" onClick={() => setProfileOpen(false)}></div>
                    <div
                      className="absolute right-0 top-full mt-2 z-100 rounded-2xl overflow-hidden"
                      style={{
                        minWidth: 220,
                        background: 'rgba(11,29,58,0.97)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                        animation: 'slideUp 0.2s ease',
                      }}
                    >
                      <div className="px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="font-semibold text-sm text-white">{user.firstName} {user.lastName}</div>
                        <div className="text-xs text-text-muted mt-0.5">{user.email}</div>
                      </div>
                      <Link
                        to="/my-trips"
                        className="block px-4 py-2.5 text-sm text-text-muted no-underline transition-colors"
                        style={{ transition: 'all 0.15s' }}
                        onClick={() => setProfileOpen(false)}
                        onMouseEnter={handleMenuEnter}
                        onMouseLeave={handleMenuLeave}
                      >
                        ✈ My Trips
                      </Link>
                      <Link
                        to="/account-details"
                        className="block px-4 py-2.5 text-sm text-text-muted no-underline transition-colors"
                        style={{ transition: 'all 0.15s' }}
                        onClick={() => setProfileOpen(false)}
                        onMouseEnter={handleMenuEnter}
                        onMouseLeave={handleMenuLeave}
                      >
                        ⚙️ Account Details
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm bg-transparent border-none cursor-pointer transition-colors"
                        style={{ color: '#ef4444' }}
                        onMouseEnter={handleSignoutEnter}
                        onMouseLeave={handleSignoutLeave}
                      >
                        ↪ Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link to="/signin" className="btn-ghost no-underline" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>Sign In</Link>
                <Link to="/register" className="btn-accent no-underline" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>Register</Link>
              </>
            )}
          </div>

          {/* Hamburger */}
          <button
            className="hamburger flex-col gap-[5px] cursor-pointer bg-transparent border-none p-2"
            onClick={toggleMenu}
            aria-label="Menu"
            style={{ borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <span className="block w-[20px] h-[2px] bg-white rounded-sm" style={{ transition: 'all 0.2s', transform: mobileOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }}></span>
            <span className="block w-[20px] h-[2px] bg-white rounded-sm" style={{ transition: 'all 0.2s', opacity: mobileOpen ? 0 : 1 }}></span>
            <span className="block w-[20px] h-[2px] bg-white rounded-sm" style={{ transition: 'all 0.2s', transform: mobileOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }}></span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="mobile-menu" style={{ animation: 'fadeInDown 0.25s ease' }}>
          <button
            className="absolute top-5 right-6 bg-transparent border-none text-white text-xl cursor-pointer"
            onClick={closeMenu}
            style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </button>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="font-syne text-2xl no-underline font-bold transition-colors"
              style={{ color: isActive(item.path) ? 'var(--color-accent)' : '#e8f0ff' }}
              onClick={closeMenu}
            >
              {item.label}
            </Link>
          ))}
          {user ? (
            <>
              <div className="text-text-muted text-sm">Signed in as {user.firstName}</div>
              <Link to="/account-details" className="btn-ghost text-base px-8 py-3 mt-4 text-center no-underline" onClick={closeMenu}>Account Details</Link>
              <button className="btn-accent text-base px-8 py-3" onClick={() => { closeMenu(); handleLogout() }}>Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/signin" className="btn-accent text-base px-10 py-3 no-underline text-center" onClick={closeMenu}>Sign In</Link>
              <Link to="/register" className="btn-ghost  text-base px-10 py-3 no-underline text-center" onClick={closeMenu}>Register</Link>
            </>
          )}
        </div>
      )}
    </>
  )
}
