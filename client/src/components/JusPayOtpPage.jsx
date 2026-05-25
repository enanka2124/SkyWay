import { useState, useEffect, useRef } from 'react'

/**
 * JusPayOtpPage — Real OTP flow with WHITE background (like real bank payment pages):
 *  - On mount: calls /api/payments/send-otp → real OTP sent to user's email + registered SMS
 *  - User enters OTP → calls /api/payments/verify-otp → payment completes
 *  - UPI payments: 5-min countdown timer; Card/NetBanking: 10-min countdown
 *  - OTP is sent to both email AND the user's registered phone number
 */
export default function JusPayOtpPage({ amount, method, cardNumber, upiId, upiInfo, bank, deviceId, passengerInfo, onOtpSuccess, onBack }) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [sessionId, setSessionId] = useState(null)
  const [sendStatus, setSendStatus] = useState('sending')
  const [deliveryInfo, setDeliveryInfo] = useState({ email: false, sms: false })
  const [resendTimer, setResendTimer] = useState(30)
  const [canResend, setCanResend] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [bankProcessing, setBankProcessing] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [sessionExpired, setSessionExpired] = useState(false)
  const [expiresInMins, setExpiresInMins] = useState(null)
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState(null)
  const [alreadySent, setAlreadySent] = useState(false)
  const inputRefs = useRef([])

  const isUpi = (method || '').toLowerCase() === 'upi'

  // ── Send OTP on mount ──────────────────────────────────────────────────────
  const sendOtp = async () => {
    setSendStatus('sending')
    setOtp(['', '', '', '', '', ''])
    setOtpError('')
    setCanResend(false)
    setResendTimer(30)
    setSessionExpired(false)
    setSessionSecondsLeft(null)
    setAlreadySent(false)

    try {
      const res = await fetch('/api/payments/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: passengerInfo?.email,
          // Use registered phone (from auth user) as primary; fallback to form phone
          phone: passengerInfo?.registeredPhone || passengerInfo?.phone,
          firstName: passengerInfo?.firstName,
          amount,
          method,
          bookingType: passengerInfo?.bookingType,
          from: passengerInfo?.from,
          to: passengerInfo?.to,
          airline: passengerInfo?.airline,
          deviceId,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSessionId(data.sessionId)
        setDeliveryInfo({ email: data.emailSent, sms: data.smsSent })
        setSendStatus('sent')
        if (data.alreadySent) setAlreadySent(true)
        const validMins = data.expiresInMinutes || (isUpi ? 5 : 10)
        setExpiresInMins(validMins)
        setSessionSecondsLeft(validMins * 60)
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
      } else {
        setSendStatus('error')
      }
    } catch {
      setSendStatus('error')
    }
  }

  useEffect(() => { sendOtp() }, []) // eslint-disable-line

  // ── Resend countdown (30s) ─────────────────────────────────────────────────
  useEffect(() => {
    if (sendStatus !== 'sent') return
    if (resendTimer <= 0) { setCanResend(true); return }
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [resendTimer, sendStatus])

  // ── Session expiry countdown ───────────────────────────────────────────────
  useEffect(() => {
    if (sendStatus !== 'sent' || sessionSecondsLeft === null) return
    if (sessionSecondsLeft <= 0) {
      setSessionExpired(true)
      setOtpError('Session expired. Please resend the OTP to continue.')
      return
    }
    const t = setTimeout(() => setSessionSecondsLeft(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [sessionSecondsLeft, sendStatus])

  const handleResend = () => {
    if (!canResend) return
    sendOtp()
  }

  // Format seconds as MM:SS
  const formatTimer = (secs) => {
    if (secs === null || secs < 0) return '00:00'
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  // Timer color — red when < 60s
  const timerColor = sessionSecondsLeft !== null && sessionSecondsLeft < 60 ? '#e53e3e' : '#e07c00'

  // ── OTP input handlers ─────────────────────────────────────────────────────
  const handleOtpChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]; next[idx] = val; setOtp(next)
    setOtpError('')
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus()
  }

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) inputRefs.current[idx - 1]?.focus()
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      inputRefs.current[5]?.focus()
    }
  }

  // ── Verify OTP ─────────────────────────────────────────────────────────────
  const handleVerify = async () => {
    const otpStr = otp.join('')
    if (otpStr.length < 6) { setOtpError('Please enter the complete 6-digit OTP.'); return }
    if (!sessionId) { setOtpError('Session expired. Please resend OTP.'); return }
    if (sessionExpired) { setOtpError('Session expired. Please resend OTP.'); return }

    setVerifying(true)
    setOtpError('')
    try {
      const res = await fetch('/api/payments/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          otp: otpStr,
          upiId: upiId || undefined,
          cardLast4: cardNumber ? cardNumber.replace(/\s/g, '').slice(-4) : undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setVerifying(false)
        setBankProcessing(true)
        setTimeout(() => {
          setBankProcessing(false)
          onOtpSuccess(data) // data.paymentStatus: 'captured' | 'failed'
        }, 2000)
      } else {
        setOtpError(data.error || 'Incorrect OTP. Please try again.')
        setVerifying(false)
        setOtp(['', '', '', '', '', ''])
        setTimeout(() => inputRefs.current[0]?.focus(), 50)
      }
    } catch {
      setOtpError('Network error. Please check your connection and try again.')
      setVerifying(false)
    }
  }

  // Masked display
  const maskedCard  = cardNumber ? '**** **** **** ' + cardNumber.replace(/\s/g, '').slice(-4) : null
  const maskedUpi   = upiId ? upiId.slice(0, 3) + '***@' + (upiId.split('@')[1] || 'upi') : null
  const maskedEmail = passengerInfo?.email
    ? passengerInfo.email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + b.replace(/./g, '•') + c)
    : null
  // Use registered phone for masking display
  const displayPhone = passengerInfo?.registeredPhone || passengerInfo?.phone
  const maskedPhone = displayPhone
    ? '+91 ' + String(displayPhone).slice(0, 2) + '••••••' + String(displayPhone).slice(-2)
    : null

  const isVerifyDisabled = verifying || sendStatus !== 'sent' || otp.join('').length < 6 || sessionExpired

  // ── Accent color based on method ─────────────────────────────────────────
  const accentColor = isUpi ? '#7c3aed' : '#e07c00'
  const accentColorLight = isUpi ? '#ede9fe' : '#fff7ed'
  const accentColorBorder = isUpi ? '#ddd6fe' : '#fed7aa'
  const accentColorBtn = isUpi
    ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
    : 'linear-gradient(135deg, #ea580c, #f97316)'
  const accentBtnShadow = isUpi
    ? '0 4px 20px rgba(124,58,237,0.35)'
    : '0 4px 20px rgba(234,88,12,0.3)'

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f6fa',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: '1rem',
      position: 'relative',
    }}>
      <style>{`
        @keyframes jp-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(234,88,12,0.25)} 50%{box-shadow:0 0 0 12px rgba(234,88,12,0)} }
        @keyframes jp-pulse-upi { 0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,0.25)} 50%{box-shadow:0 0 0 12px rgba(124,58,237,0)} }
        @keyframes jp-spin  { to{transform:rotate(360deg)} }
        @keyframes jp-fade  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes jp-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 60%{transform:translateX(5px)} }
        @keyframes jp-redirect { 0%{width:0%} 100%{width:100%} }
        .otp-box-white { outline:none; }
        .otp-box-white:focus { border-color:${accentColor} !important; box-shadow: 0 0 0 3px ${accentColorLight} !important; background:#fff !important; }
        .otp-box-white.filled { border-color:${accentColor} !important; background:#fff !important; color:${accentColor}; }
        .otp-box-white.error { animation:jp-shake 0.35s; border-color:#e53e3e !important; background:#fff5f5 !important; }
        .otp-box-white.expired { opacity:0.4 !important; background:#f9f9f9 !important; }
        .jp-verify-btn { transition: all 0.2s; }
        .jp-verify-btn:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.05); }
        .jp-verify-btn:active:not(:disabled) { transform: translateY(0); }
      `}</style>

      {/* ── Bank Processing Overlay (after OTP verified) ── */}
      {bankProcessing && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: '1.25rem', animation: 'jp-fade 0.3s',
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: '2.5rem 3rem',
            textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
            maxWidth: 340,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              border: `3px solid ${accentColorBorder}`,
              borderTopColor: accentColor,
              animation: 'jp-spin 0.9s linear infinite',
              margin: '0 auto 1.25rem',
            }} />
            <div style={{ color: '#111827', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.4rem' }}>
              🏦 Processing Payment...
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Securely communicating with{' '}
              <span style={{ color: accentColor, fontWeight: 600 }}>
                {isUpi ? 'UPI / NPCI' : bank || 'your bank'}
              </span>
              . Please do not close this window.
            </div>
            <div style={{
              marginTop: '1.25rem', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 6,
              background: '#f9fafb', borderRadius: 8, padding: '6px 12px',
              border: '1px solid #e5e7eb',
            }}>
              <span style={{ fontSize: 10, color: '#9ca3af' }}>🔒 Secured by</span>
              <span style={{ color: accentColor, fontWeight: 900, fontSize: 13 }}>JusPay</span>
              <span style={{ fontSize: 10, color: '#9ca3af' }}>· NPCI · RBI</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Card ── */}
      <div style={{
        width: '100%', maxWidth: 440,
        background: '#ffffff',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 10px 40px rgba(0,0,0,0.12)',
        border: '1px solid #e5e7eb',
      }}>

        {/* ── Header ── */}
        <div style={{
          background: '#fff',
          borderBottom: '2px solid #f3f4f6',
          padding: '1.1rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* JusPay Logo area */}
            <div style={{
              width: 38, height: 38, borderRadius: 9,
              background: isUpi ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'linear-gradient(135deg, #ea580c, #f97316)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 18, color: '#fff',
            }}>J</div>
            <div>
              <div style={{ color: '#111827', fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em' }}>JusPay Secure</div>
              <div style={{ color: '#9ca3af', fontSize: 11 }}>PCI DSS Level 1 · Bank-Grade</div>
            </div>
          </div>
          {/* Timer badge */}
          {sendStatus === 'sent' && sessionSecondsLeft !== null && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: sessionExpired ? '#fef2f2' : (sessionSecondsLeft < 60 ? '#fff7ed' : '#f0fdf4'),
              border: `1px solid ${sessionExpired ? '#fecaca' : (sessionSecondsLeft < 60 ? '#fed7aa' : '#bbf7d0')}`,
              borderRadius: 20, padding: '4px 10px', animation: 'jp-fade 0.3s',
            }}>
              <span style={{ fontSize: 11, color: timerColor }}>⏱</span>
              <span style={{ fontSize: 12, color: timerColor, fontWeight: 700, fontFamily: 'monospace' }}>
                {sessionExpired ? 'Expired' : formatTimer(sessionSecondsLeft)}
              </span>
            </div>
          )}
          {sendStatus !== 'sent' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: 20, padding: '3px 10px',
            }}>
              <span style={{ fontSize: 10, color: '#16a34a' }}>🔒</span>
              <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 600 }}>SSL Secured</span>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '1.75rem 1.75rem 0' }}>

          {/* Payment summary pill */}
          <div style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: 12, padding: '0.85rem 1.1rem', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: isUpi
                ? 'linear-gradient(135deg, #7c3aed22, #a855f722)'
                : 'linear-gradient(135deg, #ea580c22, #f9731622)',
              border: `1.5px solid ${isUpi ? '#ddd6fe' : '#fed7aa'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
            }}>
              {method === 'card' ? '💳' : method === 'upi' ? '📱' : '🏦'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#9ca3af', fontSize: 10, marginBottom: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {method === 'card' ? 'Debit / Credit Card' : method === 'upi' ? 'UPI Payment' : 'Net Banking'}
              </div>
              <div style={{ color: '#111827', fontWeight: 600, fontSize: 13 }}>
                {maskedCard || maskedUpi || bank || 'Account'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#9ca3af', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</div>
              <div style={{ color: accentColor, fontWeight: 800, fontSize: 16 }}>
                ₹{(amount || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* ── OTP Status Section ── */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            {/* Icon */}
            <div style={{
              width: 60, height: 60, borderRadius: '50%', margin: '0 auto 1rem',
              background: sendStatus === 'sent'
                ? accentColorLight
                : sendStatus === 'error'
                  ? '#fff5f5'
                  : '#f3f4f6',
              border: `2px solid ${sendStatus === 'sent' ? accentColorBorder : sendStatus === 'error' ? '#fecaca' : '#e5e7eb'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
              animation: sendStatus === 'sent' ? (isUpi ? 'jp-pulse-upi 2.2s ease-in-out infinite' : 'jp-pulse 2.2s ease-in-out infinite') : 'none',
            }}>
              {sendStatus === 'sending' ? (
                <div style={{ width: 22, height: 22, border: '2.5px solid #e5e7eb', borderTopColor: accentColor, borderRadius: '50%', animation: 'jp-spin 0.7s linear infinite' }} />
              ) : sendStatus === 'sent' ? (isUpi ? '🏦' : '🔐') : '⚠️'}
            </div>

            {sendStatus === 'sending' && (
              <>
                <div style={{ color: '#111827', fontWeight: 700, fontSize: 17, marginBottom: '0.3rem' }}>
                  {isUpi ? 'Connecting to Bank...' : 'Sending OTP...'}
                </div>
                <div style={{ color: '#9ca3af', fontSize: 13 }}>
                  {isUpi ? 'Initiating bank authentication session' : 'Dispatching to your registered contact'}
                </div>
                {isUpi && (
                  <div style={{ marginTop: '0.75rem', height: 3, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: accentColor, borderRadius: 2, animation: 'jp-redirect 1.5s ease-out forwards' }} />
                  </div>
                )}
              </>
            )}

            {sendStatus === 'sent' && (
              <div style={{ animation: 'jp-fade 0.4s' }}>
                <div style={{ color: '#111827', fontWeight: 700, fontSize: 17, marginBottom: '0.4rem' }}>
                  {isUpi ? 'Bank OTP Sent!' : 'OTP Sent Successfully!'}
                </div>
                {alreadySent && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: '#fffbeb', border: '1px solid #fde68a',
                    borderRadius: 8, padding: '4px 12px', fontSize: 11, color: '#92400e', marginBottom: '0.5rem',
                  }}>
                    ℹ OTP already sent — check your email/SMS
                  </div>
                )}
                {isUpi && upiInfo && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: '#f5f3ff', border: '1px solid #ddd6fe',
                    borderRadius: 8, padding: '4px 12px', fontSize: 11, color: '#6d28d9', marginBottom: '0.5rem',
                  }}>
                    {upiInfo.bankIcon} OTP from {upiInfo.bank}
                  </div>
                )}
                {/* Delivery channels */}
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {maskedEmail && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: '#f0fdf4', border: '1px solid #bbf7d0',
                      borderRadius: 20, padding: '4px 12px', fontSize: 12, color: '#166534', fontWeight: 600,
                    }}>✉ {maskedEmail}</span>
                  )}
                  {maskedPhone && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: '#eff6ff', border: '1px solid #bfdbfe',
                      borderRadius: 20, padding: '4px 12px', fontSize: 12, color: '#1e40af', fontWeight: 600,
                    }}>📱 {maskedPhone}</span>
                  )}
                </div>
                <div style={{ color: '#6b7280', fontSize: 12 }}>
                  {isUpi
                    ? `Enter the 6-digit OTP from your bank (valid ${expiresInMins} min)`
                    : 'Check your email & phone for the 6-digit OTP'}
                </div>
              </div>
            )}

            {sendStatus === 'error' && (
              <div style={{ animation: 'jp-fade 0.3s' }}>
                <div style={{ color: '#e53e3e', fontWeight: 700, fontSize: 16, marginBottom: '0.3rem' }}>Could not send OTP</div>
                <div style={{ color: '#9ca3af', fontSize: 12 }}>Check your email/phone and try resending</div>
              </div>
            )}
          </div>

          {/* ── OTP Input Boxes ── */}
          {sendStatus === 'sent' && (
            <>
              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', marginBottom: '0.75rem' }}
                onPaste={handlePaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => inputRefs.current[idx] = el}
                    className={`otp-box-white${digit ? ' filled' : ''}${otpError ? ' error' : ''}${sessionExpired ? ' expired' : ''}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleKeyDown(idx, e)}
                    disabled={verifying || sessionExpired}
                    style={{
                      width: 46, height: 54, borderRadius: 10,
                      border: '1.5px solid #d1d5db',
                      background: '#fff',
                      color: '#111827', textAlign: 'center', fontSize: 22, fontWeight: 700,
                      transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
                      cursor: sessionExpired ? 'not-allowed' : 'text',
                    }}
                  />
                ))}
              </div>

              {/* Error / Expired message */}
              {otpError && (
                <p style={{
                  color: sessionExpired ? '#e07c00' : '#e53e3e',
                  fontSize: 12, textAlign: 'center',
                  marginBottom: '0.5rem', animation: 'jp-fade 0.2s',
                  background: sessionExpired ? '#fff7ed' : '#fff5f5',
                  border: `1px solid ${sessionExpired ? '#fed7aa' : '#fecaca'}`,
                  borderRadius: 8, padding: '6px 12px',
                }}>
                  {otpError}
                </p>
              )}

              {/* Resend timer */}
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                {canResend || sessionExpired ? (
                  <button onClick={handleResend} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: accentColor, fontSize: 13, fontWeight: 600,
                    textDecoration: 'underline', padding: 0,
                  }}>
                    🔄 {sessionExpired ? 'Start New Session' : 'Resend OTP'}
                  </button>
                ) : (
                  <span style={{ color: '#9ca3af', fontSize: 12 }}>
                    Resend in <span style={{ color: accentColor, fontWeight: 600 }}>{resendTimer}s</span>
                  </span>
                )}
              </div>
            </>
          )}

          {/* Resend button when sending failed */}
          {sendStatus === 'error' && (
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <button onClick={handleResend} style={{
                background: accentColorLight, border: `1px solid ${accentColorBorder}`,
                borderRadius: 10, padding: '0.6rem 1.5rem', color: accentColor,
                fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}>Try Again</button>
            </div>
          )}
        </div>

        {/* ── Verify Button + Back ── */}
        <div style={{ padding: '0 1.75rem 1.5rem' }}>
          <button
            className="jp-verify-btn"
            onClick={handleVerify}
            disabled={isVerifyDisabled}
            style={{
              width: '100%', padding: '0.95rem', borderRadius: 12, border: 'none',
              cursor: isVerifyDisabled ? 'not-allowed' : 'pointer',
              background: isVerifyDisabled
                ? '#e5e7eb'
                : accentColorBtn,
              color: isVerifyDisabled ? '#9ca3af' : '#fff',
              fontWeight: 700, fontSize: 15,
              boxShadow: isVerifyDisabled ? 'none' : accentBtnShadow,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}
          >
            {verifying ? (
              <>
                <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'jp-spin 0.8s linear infinite' }} />
                Verifying OTP...
              </>
            ) : sessionExpired ? '⏱ Session Expired — Resend OTP' : '✓ Verify & Pay'}
          </button>

          <button onClick={onBack} style={{
            display: 'block', width: '100%', marginTop: '0.65rem',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#9ca3af', fontSize: 12, textAlign: 'center', padding: '0.4rem',
          }}>← Change payment method</button>
        </div>

        {/* ── Footer ── */}
        <div style={{
          borderTop: '1px solid #f3f4f6', padding: '0.75rem 1.75rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#fafafa',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>Powered by</span>
            <span style={{ fontSize: 12, fontWeight: 900, color: accentColor }}>JusPay</span>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>· PCI DSS Level 1</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>🔒 256-bit SSL</span>
          </div>
        </div>
      </div>
    </div>
  )
}
