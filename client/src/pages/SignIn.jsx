import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import toast from 'react-hot-toast'

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

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

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
    if (result.success) {
      toast.success(result.message, { icon: '📧' })
      if (result.previewUrl) {
        toast((t) => (
          <span>
            <b>Live Recovery Preview:</b> Reset link generated!
            <button 
              onClick={() => { window.open(result.previewUrl, '_blank'); toast.dismiss(t.id); }}
              style={{ marginLeft: '10px', background: '#f5a623', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              View Reset Email ↗
            </button>
          </span>
        ), { duration: 10000 });
      }
    } else {
      setError(result.error)
    }
  }

  const handleForgotEmail = async (e) => {
    e.preventDefault()
    setError(''); setSuccessMsg('')
    if (!phone.trim()) { setError('Please enter your phone number'); return }
    setLoading(true)
    const result = await forgotEmail(phone)
    setLoading(false)
    if (result.success) {
      toast.success(result.message, { icon: '📱' })
      if (result.previewUrl) {
        toast((t) => (
          <span>
            <b>Live Account Recovery:</b> Details sent to phone & email!
            <button 
              onClick={() => { window.open(result.previewUrl, '_blank'); toast.dismiss(t.id); }}
              style={{ marginLeft: '10px', background: '#f5a623', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              View Recovery Email ↗
            </button>
          </span>
        ), { duration: 10000 });
      }
      if (result.hint) toast(`Email Hint: ${result.hint}`, { duration: 6000 })
    } else {
      setError(result.error)
    }
  }

  const navigateToForgotPassword = () => {
    setMode('forgot-password')
    setError('')
    setSuccessMsg('')
  }

  const navigateToForgotEmail = () => {
    setMode('forgot-email')
    setError('')
    setSuccessMsg('')
  }

  const navigateToLogin = () => {
    setMode('login')
    setError('')
    setSuccessMsg('')
  }

  return (
    <>
      <Navbar />
      <section className="relative z-10" style={{ padding: '2rem 0 3rem', minHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="container-main w-full" style={{ maxWidth: 480, margin: '0 auto' }}>
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="text-text-muted text-sm flex items-center gap-2 mb-4 bg-transparent border-none cursor-pointer hover:text-text-primary transition-colors"
          >
            ← Back
          </button>
          <div className="glass-card" style={{ padding: '2.5rem' }}>

            {/* Logo */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">✈</div>
              <h1 className="font-syne text-2xl font-bold mb-2">
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

            {/* Login Form */}
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
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-text-muted text-sm cursor-pointer hover:text-text-primary transition-colors">
                      {showPassword ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                {/* Forgot links */}
                <div className="flex justify-between text-xs">
                  <button type="button" onClick={navigateToForgotPassword} className="bg-transparent border-none text-accent cursor-pointer hover:underline p-0">
                    Forgot Password?
                  </button>
                  <button type="button" onClick={navigateToForgotEmail} className="bg-transparent border-none text-accent cursor-pointer hover:underline p-0">
                    Forgot Email?
                  </button>
                </div>

                <button type="submit" className="confirm-btn" disabled={loading} style={{ marginTop: '0.5rem' }}>
                  {loading ? 'Signing in...' : 'Sign In →'}
                </button>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--divider-color)' }}></div>
                  <span className="text-text-muted text-xs">New to SkyWay?</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--divider-color)' }}></div>
                </div>

                <Link to="/register" state={{ from: redirectTo }} className="confirm-btn no-underline text-center" style={{ background: 'transparent', border: '1.5px solid var(--color-accent)', color: 'var(--color-accent)' }}>
                  Create Account
                </Link>
              </form>
            )}

            {/* Forgot Password Form */}
            {mode === 'forgot-password' && (
              <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-text-muted tracking-wider uppercase">Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="sky-input" />
                </div>
                <button type="submit" className="confirm-btn" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link →'}
                </button>
                <button type="button" onClick={navigateToLogin} className="bg-transparent border-none text-accent text-sm cursor-pointer hover:underline mt-1">
                  ← Back to Sign In
                </button>
              </form>
            )}

            {/* Forgot Email Form */}
            {mode === 'forgot-email' && (
              <form onSubmit={handleForgotEmail} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-text-muted tracking-wider uppercase">Phone Number</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="Enter 10-digit phone" className="sky-input" maxLength={10} />
                </div>
                <button type="submit" className="confirm-btn" disabled={loading}>
                  {loading ? 'Searching...' : 'Find My Email →'}
                </button>
                <button type="button" onClick={navigateToLogin} className="bg-transparent border-none text-accent text-sm cursor-pointer hover:underline mt-1">
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
