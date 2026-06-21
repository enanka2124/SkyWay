import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import toast from 'react-hot-toast'

const STEPS = [
  { id: 1, label: 'Personal Info', icon: '👤' },
  { id: 2, label: 'Address', icon: '🏠' },
  { id: 3, label: 'ID Proof', icon: '🪪' },
]

export default function Register() {
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef(null)
  const { register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from || '/'

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Step 1: Personal Info
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Step 2: Address Info
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [pincode, setPincode] = useState('')

  // Step 3: ID Proof
  const [aadhaarFile, setAadhaarFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)

  const [countryCode, setCountryCode] = useState('+91')

  const handlePhoneChange = (e) => {
    const onlyNumbers = e.target.value.replace(/\D/g, '').slice(0, 10)
    setPhone(onlyNumbers)
  }

  const handlePincodeChange = (e) => {
    const onlyNumbers = e.target.value.replace(/\D/g, '').slice(0, 6)
    setPincode(onlyNumbers)
  }

  const validateStep1 = () => {
    if (!firstName.trim() || !lastName.trim()) return 'First and Last name are required'
    if (!email.trim() || !email.includes('@')) return 'Valid email is required'
    if (!phone.trim() || phone.trim().length < 10) return 'Valid phone number is required'
    if (!password || password.length < 6) return 'Password must be at least 6 characters'
    if (password !== confirmPassword) return 'Passwords do not match'
    return null
  }

  const validateStep2 = () => {
    if (!address.trim()) return 'Address is required'
    if (!city.trim()) return 'City is required'
    if (!state.trim()) return 'State is required'
    if (!pincode.trim() || pincode.trim().length < 5) return 'Valid pincode is required'
    return null
  }

  const validateStep3 = () => {
    if (!aadhaarFile) return 'ID proof document (PDF) is required'
    return null
  }

  // Automatically clear error when user selects a new file
  useEffect(() => {
    if (aadhaarFile) setError('')
  }, [aadhaarFile])

  const handleNext = () => {
    setError('')
    if (step === 1) {
      const err = validateStep1()
      if (err) { setError(err); return }
      setStep(2)
    } else if (step === 2) {
      const err = validateStep2()
      if (err) { setError(err); return }
      setStep(3)
    }
  }

  const handleBack = () => {
    setError('')
    setStep(s => Math.max(1, s - 1))
  }

  const handleFileDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    setError('')
    const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are allowed'); return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be under 5MB'); return
      }
      const fileName = file.name.toLowerCase()
      const validKeywords = ['aadhar', 'aadhaar', 'voter', 'passport']
      if (!validKeywords.some(kw => fileName.includes(kw))) {
        setError('Invalid PDF'); return
      }
      setAadhaarFile(file)
    }
  }

  const handleFileSelect = (e) => {
    setError('')
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are allowed'); return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be under 5MB'); return
      }
      const fileName = file.name.toLowerCase()
      const validKeywords = ['aadhar', 'aadhaar', 'voter', 'passport']
      if (!validKeywords.some(kw => fileName.includes(kw))) {
        setError('Invalid PDF'); return
      }
      setAadhaarFile(file)
    }
  }

  const handleSubmit = async () => {
    setError('')
    const err = validateStep3()
    if (err) { setError(err); return }

    setLoading(true)
    const formData = new FormData()
    formData.append('firstName', firstName.trim())
    formData.append('lastName', lastName.trim())
    formData.append('email', email.trim())
    formData.append('phone', phone.trim())
    formData.append('password', password)
    formData.append('address', address.trim())
    formData.append('city', city.trim())
    formData.append('state', state.trim())
    formData.append('pincode', pincode.trim())
    formData.append('aadhaarCard', aadhaarFile)

    const result = await register(formData)
    setLoading(false)

    if (result.success) {
      toast.success('Registration successful! Welcome to SkyWay.', { duration: 4000 });
      
      // If in Zero-Config mode, show a preview button
      if (result.previewUrl) {
        toast((t) => (
          <span>
            <b>Live Email Preview:</b> New user email generated!
            <button 
              onClick={() => { window.open(result.previewUrl, '_blank'); toast.dismiss(t.id); }}
              style={{ marginLeft: '10px', background: '#f5a623', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Open Email ↗
            </button>
          </span>
        ), { duration: 10000, icon: '📧' });
      } else if (result.emailSent) {
        toast.success('Congratulations! Confirmation email dispatched.', { icon: '📧', duration: 6000 });
      } else {
        toast.error('Account created! However, the confirmation email failed to send. Please check your SMTP credentials (App Password) in the server settings.', { duration: 8000 });
      }
      
      navigate(redirectTo, { replace: true })
    } else {
      setError(result.error)
    }
  }

  return (
    <>
      <Navbar />
      <section className="relative z-10" style={{ padding: '2rem 0 3rem', minHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="container-main w-full" style={{ maxWidth: 560, margin: '0 auto' }}>

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="text-text-muted text-sm flex items-center gap-2 mb-4 bg-transparent border-none cursor-pointer hover:text-text-primary transition-colors"
          >
            ← Back
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-syne font-extrabold mb-3" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.5rem)', whiteSpace: 'nowrap' }}>
              Create <span className="text-accent">Account</span>
            </h1>
            <p className="text-text-muted text-sm">Join SkyWay for seamless flight & hotel bookings</p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-0 mb-8" style={{ maxWidth: 420, margin: '0 auto 3rem' }}>
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => { if (s.id < step) setStep(s.id) }}
                  style={{ opacity: s.id <= step ? 1 : 0.4 }}
                >
                  <div
                    className="flex items-center justify-center rounded-full text-sm font-bold shrink-0"
                    style={{
                      width: 36, height: 36,
                      background: s.id === step ? 'var(--color-accent)' : s.id < step ? 'rgba(34,208,122,0.2)' : 'var(--btn-ghost-bg)',
                      color: s.id === step ? '#0a1628' : s.id < step ? '#22d07a' : 'var(--color-text-muted)',
                      border: s.id < step ? '2px solid #22d07a' : '2px solid transparent',
                    }}
                  >
                    {s.id < step ? '✓' : s.icon}
                  </div>
                  <span className="text-xs font-medium hidden sm:inline" style={{ color: s.id <= step ? 'var(--text-primary)' : 'var(--color-text-muted)' }}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 2, margin: '0 0.75rem', background: s.id < step ? '#22d07a' : 'var(--divider-color)', borderRadius: 2 }}></div>
                )}
              </div>
            ))}
          </div>

          <div className="glass-card" style={{ padding: '2.5rem' }}>

            {/* Error */}
            {error && (
              <div className="rounded-xl px-4 py-3 mb-5 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
                {error}
              </div>
            )}

            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className="flex flex-col gap-4">
                <h2 className="font-syne text-lg font-bold mb-3">Personal Information</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-text-muted tracking-wider uppercase">First Name *</label>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John" className="sky-input" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-text-muted tracking-wider uppercase">Last Name *</label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" className="sky-input" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-text-muted tracking-wider uppercase">Email *</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="sky-input" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-text-muted tracking-wider uppercase">Phone Number *</label>
                  <div className="flex gap-2">
                    <select 
                      value={countryCode} 
                      onChange={e => setCountryCode(e.target.value)} 
                      className="sky-input" 
                      style={{ width: '90px', padding: '0 10px' }}
                    >
                      <option value="+91">+91 (IN)</option>
                      <option value="+1">+1 (US)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+971">+971 (AE)</option>
                    </select>
                    <input 
                      type="tel" 
                      value={phone} 
                      onChange={handlePhoneChange} 
                      placeholder="9876543210" 
                      className="sky-input" 
                      style={{ flex: 1 }} 
                      maxLength={10} 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-text-muted tracking-wider uppercase">Password *</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 chars" className="sky-input" style={{ paddingRight: '2.5rem' }} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none text-text-muted text-sm cursor-pointer hover:text-text-primary">
                        {showPassword ? '🙈' : '👁'}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-text-muted tracking-wider uppercase">Confirm Password *</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter" className="sky-input" />
                  </div>
                </div>
                <button className="confirm-btn" onClick={handleNext} style={{ marginTop: '0.5rem' }}>
                  Next: Address →
                </button>
              </div>
            )}

            {/* Step 2: Address */}
            {step === 2 && (
              <div className="flex flex-col gap-4">
                <h2 className="font-syne text-lg font-bold mb-3">Address Information</h2>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-text-muted tracking-wider uppercase">Street Address *</label>
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main Street, Apt 4B" className="sky-input" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-text-muted tracking-wider uppercase">City *</label>
                    <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Mumbai" className="sky-input" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-text-muted tracking-wider uppercase">State *</label>
                    <input type="text" value={state} onChange={e => setState(e.target.value)} placeholder="Maharashtra" className="sky-input" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5" style={{ maxWidth: 200 }}>
                  <label className="text-xs font-medium text-text-muted tracking-wider uppercase">Pincode *</label>
                  <input 
                    type="text" 
                    value={pincode} 
                    onChange={handlePincodeChange} 
                    placeholder="400001" 
                    className="sky-input" 
                    maxLength={6} 
                  />
                </div>
                <div className="flex gap-3" style={{ marginTop: '0.5rem' }}>
                  <button className="confirm-btn" onClick={handleBack} style={{ flex: 1, background: 'transparent', border: '1.5px solid var(--color-accent)', color: 'var(--color-accent)' }}>
                    ← Back
                  </button>
                  <button className="confirm-btn" onClick={handleNext} style={{ flex: 2 }}>
                    Next: ID Proof →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: File Upload */}
            {step === 3 && (
              <div className="flex flex-col gap-4">
                <h2 className="font-syne text-lg font-bold mb-1">ID Proof Upload</h2>
                <p className="text-text-muted text-sm" style={{ marginTop: '-0.5rem' }}>Upload a PDF of your Aadhaar, Voter ID, or Passport (max 5MB)</p>
                <p className="text-accent text-xs font-bold" style={{ marginTop: '0.2rem' }}>
                  💡 Tip: For instant verification, ensure your filename contains your **name** or keywords like **"Aadhar"** or **"Voter"**.
                </p>

                {/* Drag & Drop Zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileRef.current?.click()}
                  className="cursor-pointer rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-200"
                  style={{
                    padding: '2.5rem 2rem',
                    border: `2px dashed ${dragActive ? 'var(--color-accent)' : aadhaarFile ? '#22d07a' : 'var(--divider-color)'}`,
                    background: dragActive ? 'rgba(245,166,35,0.05)' : aadhaarFile ? 'rgba(34,208,122,0.05)' : 'var(--filter-group-bg)',
                  }}
                >
                  <input ref={fileRef} type="file" accept=".pdf" onChange={handleFileSelect} style={{ display: 'none' }} />

                  {aadhaarFile ? (
                    <>
                      <div className="text-4xl">📄</div>
                      <div className="text-sm font-medium text-center" style={{ color: '#22d07a' }}>{aadhaarFile.name}</div>
                      <div className="text-xs text-text-muted">{(aadhaarFile.size / 1024).toFixed(1)} KB • Click to change</div>
                    </>
                  ) : (
                    <>
                      <div className="text-4xl">📤</div>
                      <div className="text-sm font-medium">Drag & drop your ID Proof (PDF) here</div>
                      <div className="text-xs text-text-muted">or click to browse files</div>
                    </>
                  )}
                </div>

                <div className="rounded-xl px-4 py-3 text-xs text-text-muted" style={{ background: 'var(--filter-group-bg)', border: '1px solid var(--divider-color)' }}>
                  🔒 Your document is securely uploaded and used only for verification purposes.
                </div>

                <div className="flex gap-3" style={{ marginTop: '0.5rem' }}>
                  <button className="confirm-btn" onClick={handleBack} style={{ flex: 1, background: 'transparent', border: '1.5px solid var(--color-accent)', color: 'var(--color-accent)' }}>
                    ← Back
                  </button>
                  <button className="confirm-btn" onClick={handleSubmit} disabled={loading} style={{ flex: 2 }}>
                    {loading ? 'Verifying ID Proof...' : 'Create Account ✓'}
                  </button>
                </div>
              </div>
            )}

            {/* Sign In link */}
            <div className="text-center mt-6 text-sm text-text-muted">
              Already have an account?{' '}
              <Link to="/signin" state={{ from: redirectTo }} className="text-accent no-underline font-medium hover:underline">
                Sign In
              </Link>
            </div>

          </div>
        </div>
      </section>
      <Footer />
    </>
  )
}
