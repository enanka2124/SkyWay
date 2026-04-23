import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function SignIn() {
  const [mode, setMode] = useState('login') // 'login' | 'forgot-password' | 'forgot-email'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, forgotPassword, forgotEmail } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from || '/'
  const bookingState = location.state?.bookingState || null

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(''); setSuccessMsg('')
    if (!email.trim() || !password.trim()) { setError('Please fill in all fields'); return }
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (result.success) {
      if (bookingState && redirectTo === '/checkout') {
        navigate('/checkout', { state: bookingState, replace: true })
      } else {
        navigate(redirectTo, { replace: true })
      }
    } else {
      setError(result.error)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setError(''); setSuccessMsg('')
    if (!email.trim()) { setError('Please enter your email'); return }
    setLoading(true)
    const result = await forgotPassword(email)
    setLoading(false)
    if (result.success) setSuccessMsg(result.message)
    else setError(result.error)
  }

  const handleForgotEmail = async (e) => {
    e.preventDefault()
    setError(''); setSuccessMsg('')
    if (!phone.trim()) { setError('Please enter your phone number'); return }
    setLoading(true)
    const result = await forgotEmail(phone)
    setLoading(false)
    if (result.success) setSuccessMsg(result.message)
    else setError(result.error)
  }

  return (
    <>
      <Navbar />
      <section className="relative z-10" style={{ padding: '5rem 0 4rem', minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
        <div className="container-main" style={{ maxWidth: 480, margin: '0 auto' }}>
          <div className="glass-card" style={{ padding: '2.5rem' }}>

            {/* Logo */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">✈</div>
              <h1 className="font-syne text-2xl font-bold mb-1">
                {mode === 'login' && 'Welcome Back'}
                {mode === 'forgot-password' && 'Reset Password'}
                {mode === 'forgot-email' && 'Recover Email'}
              </h1>
              <p className="text-text-muted text-sm">
                {mode === 'login' && 'Sign in to your SkyWay account'}
                {mode === 'forgot-password' && 'Enter your email to receive a reset link'}
                {mode === 'forgot-email' && 'Enter your phone to find your email'}
              </p>
            </div>

            {/* Error / Success */}
            {error && (
              <div className="rounded-xl px-4 py-3 mb-4 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
                {error}
              </div>
            )}
            {successMsg && (
              <div className="rounded-xl px-4 py-3 mb-4 text-sm" style={{ background: 'rgba(34,208,122,0.1)', border: '1px solid rgba(34,208,122,0.3)', color: '#22d07a' }}>
                {successMsg}
              </div>
            )}

            {/* ── Login Form ── */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-text-muted tracking-wider uppercase">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="sky-input" autoComplete="email" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-text-muted tracking-wider uppercase">Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="sky-input" style={{ paddingRight: '3rem' }} autoComplete="current-password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-text-muted text-sm cursor-pointer hover:text-white transition-colors">
                      {showPassword ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                {/* Forgot links */}
                <div className="flex justify-between text-xs">
                  <button type="button" onClick={() => { setMode('forgot-password'); setError(''); setSuccessMsg('') }} className="bg-transparent border-none text-accent cursor-pointer hover:underline p-0">
                    Forgot Password?
                  </button>
                  <button type="button" onClick={() => { setMode('forgot-email'); setError(''); setSuccessMsg('') }} className="bg-transparent border-none text-accent cursor-pointer hover:underline p-0">
                    Forgot Email?
                  </button>
                </div>

                <button type="submit" className="confirm-btn" disabled={loading} style={{ marginTop: '0.5rem' }}>
                  {loading ? 'Signing in...' : 'Sign In →'}
                </button>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }}></div>
                  <span className="text-text-muted text-xs">New to SkyWay?</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }}></div>
                </div>

                <Link to="/register" state={{ from: redirectTo }} className="confirm-btn no-underline text-center" style={{ background: 'transparent', border: '1.5px solid var(--color-accent)', color: 'var(--color-accent)' }}>
                  Create Account
                </Link>
              </form>
            )}

            {/* ── Forgot Password Form ── */}
            {mode === 'forgot-password' && (
              <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-text-muted tracking-wider uppercase">Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="sky-input" />
                </div>
                <button type="submit" className="confirm-btn" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link →'}
                </button>
                <button type="button" onClick={() => { setMode('login'); setError(''); setSuccessMsg('') }} className="bg-transparent border-none text-accent text-sm cursor-pointer hover:underline mt-1">
                  ← Back to Sign In
                </button>
              </form>
            )}

            {/* ── Forgot Email Form ── */}
            {mode === 'forgot-email' && (
              <form onSubmit={handleForgotEmail} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-text-muted tracking-wider uppercase">Phone Number</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Enter your registered phone" className="sky-input" />
                </div>
                <button type="submit" className="confirm-btn" disabled={loading}>
                  {loading ? 'Searching...' : 'Find My Email →'}
                </button>
                <button type="button" onClick={() => { setMode('login'); setError(''); setSuccessMsg('') }} className="bg-transparent border-none text-accent text-sm cursor-pointer hover:underline mt-1">
                  ← Back to Sign In
                </button>
              </form>
            )}

          </div>
        </div>
      </section>
      <Footer />
    </>
  )
}
