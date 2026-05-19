import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import toast from 'react-hot-toast'

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { resetPassword, logout, user } = useAuth()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    if (user) {
      logout() // Force logout so UI doesn't show them as logged in while resetting
    }
    if (!token) {
      navigate('/signin')
    }
  }, [token, navigate, user, logout])

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    if (!password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setLoading(true)
    const result = await resetPassword(token, password)
    setLoading(false)

    if (result.success) {
      toast.success(result.message);
      setTimeout(() => {
        navigate('/signin')
      }, 3000)
    } else {
      setError(result.error)
    }
  }

  return (
    <>
      <Navbar />
      <section className="relative z-10" style={{ padding: '2rem 0 3rem', minHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="container-main w-full" style={{ maxWidth: 480, margin: '0 auto' }}>
          <div className="glass-card" style={{ padding: '2.5rem' }}>
            
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">🔒</div>
              <h1 className="font-syne text-2xl font-bold mb-2">Create New Password</h1>
              <p className="text-text-muted text-sm">Please enter your new password below.</p>
            </div>

            {/* Notifications */}
            {error && (
              <div className="rounded-xl px-4 py-3 mb-4 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleReset} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted tracking-wider uppercase">New Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="••••••••" 
                    className="sky-input" 
                    style={{ paddingRight: '3rem' }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-text-muted text-sm cursor-pointer hover:text-white transition-colors">
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted tracking-wider uppercase">Confirm Password</label>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className="sky-input" 
                />
              </div>

              <button type="submit" className="confirm-btn" disabled={loading || successMsg}>
                {loading ? 'Updating...' : 'Reset Password →'}
              </button>
            </form>
          </div>
        </div>
      </section>
      <Footer />
    </>
  )
}
