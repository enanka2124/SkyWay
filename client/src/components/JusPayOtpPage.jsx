import { useState, useEffect, useRef } from 'react'

/**
 * JusPayOtpPage — Real OTP flow:
 *  - On mount: calls /api/payments/send-otp → real OTP sent to user's email + SMS
 *  - User enters OTP → calls /api/payments/verify-otp → payment completes
 *  - On success: booking confirmation email + SMS automatically sent by server
 */
export default function JusPayOtpPage({ amount, method, cardNumber, upiId, bank, passengerInfo, onOtpSuccess, onBack }) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [sessionId, setSessionId] = useState(null)
  const [sendStatus, setSendStatus] = useState('sending') // 'sending' | 'sent' | 'error'
  const [deliveryInfo, setDeliveryInfo] = useState({ email: false, sms: false })
  const [resendTimer, setResendTimer] = useState(30)
  const [canResend, setCanResend] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [otpError, setOtpError] = useState('')
  const inputRefs = useRef([])

  // ── Send OTP on mount ──────────────────────────────────────────────────────
  const sendOtp = async () => {
    setSendStatus('sending')
    setOtp(['', '', '', '', '', ''])
    setOtpError('')
    setCanResend(false)
    setResendTimer(30)

    try {
      const res = await fetch('/api/payments/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: passengerInfo?.email,
          phone: passengerInfo?.phone,
          firstName: passengerInfo?.firstName,
          amount,
          method,
          bookingType: passengerInfo?.bookingType,
          from: passengerInfo?.from,
          to: passengerInfo?.to,
          airline: passengerInfo?.airline,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSessionId(data.sessionId)
        setDeliveryInfo({ email: data.emailSent, sms: data.smsSent })
        setSendStatus('sent')
        // Auto-focus first box
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
      } else {
        setSendStatus('error')
      }
    } catch {
      setSendStatus('error')
    }
  }

  useEffect(() => { sendOtp() }, []) // eslint-disable-line

  // ── Countdown timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (sendStatus !== 'sent') return
    if (resendTimer <= 0) { setCanResend(true); return }
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [resendTimer, sendStatus])

  const handleResend = () => {
    if (!canResend) return
    sendOtp()
  }

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

    setVerifying(true)
    setOtpError('')
    try {
      const res = await fetch('/api/payments/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, otp: otpStr }),
      })
      const data = await res.json()
      if (data.success) {
        onOtpSuccess(data) // Pass full payment result to parent
      } else {
        setOtpError(data.error || 'Incorrect OTP. Please try again.')
        setVerifying(false)
        // Clear OTP inputs on wrong attempt
        setOtp(['', '', '', '', '', ''])
        setTimeout(() => inputRefs.current[0]?.focus(), 50)
      }
    } catch {
      setOtpError('Network error. Please check your connection and try again.')
      setVerifying(false)
    }
  }

  // Masked display
  const maskedCard = cardNumber ? '**** **** **** ' + cardNumber.replace(/\s/g, '').slice(-4) : null
  const maskedUpi  = upiId ? upiId.slice(0, 3) + '***@' + (upiId.split('@')[1] || 'upi') : null
  const maskedEmail = passengerInfo?.email
    ? passengerInfo.email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + b.replace(/./g, '•') + c)
    : null
  const maskedPhone = passengerInfo?.phone
    ? '+91 ' + String(passengerInfo.phone).slice(0, 2) + '••••••' + String(passengerInfo.phone).slice(-2)
    : null

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1040 50%, #0f0f1a 100%)',
      fontFamily: "'Inter', sans-serif", padding: '1rem',
    }}>
      <style>{`
        @keyframes jp-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(255,107,53,0.3)} 50%{box-shadow:0 0 0 14px rgba(255,107,53,0)} }
        @keyframes jp-spin  { to{transform:rotate(360deg)} }
        @keyframes jp-fade  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes jp-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 60%{transform:translateX(6px)} }
        .otp-input:focus { border-color:#f7931e !important; background:rgba(247,147,30,0.1) !important; outline:none; }
        .otp-input.filled { border-color:rgba(247,147,30,0.6) !important; background:rgba(247,147,30,0.07) !important; }
        .otp-input.error { animation:jp-shake 0.4s; border-color:#ff4646 !important; background:rgba(255,70,70,0.08) !important; }
      `}</style>

      <div style={{
        width: '100%', maxWidth: 420,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)',
        backdropFilter: 'blur(24px)',
      }}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1a3e 0%, #2d1b69 100%)',
          padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 18, color: '#fff',
              boxShadow: '0 4px 14px rgba(255,107,53,0.45)',
            }}>J</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>JusPay</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>Secure Payment Gateway</div>
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(34,208,122,0.12)', border: '1px solid rgba(34,208,122,0.3)',
            borderRadius: 20, padding: '3px 10px',
          }}>
            <span style={{ fontSize: 10, color: '#22d07a' }}>🔒</span>
            <span style={{ fontSize: 10, color: '#22d07a', fontWeight: 600 }}>SSL Secured</span>
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div style={{ padding: '2rem' }}>

          {/* Payment info row */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: '0.875rem 1.1rem', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', gap: '0.7rem',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: 'linear-gradient(135deg, #2b81d6, #4ba4f9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>
              {method === 'card' ? '💳' : method === 'upi' ? '📱' : '🏦'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 1 }}>
                {method === 'card' ? 'Debit / Credit Card' : method === 'upi' ? 'UPI' : 'Net Banking'}
              </div>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>
                {maskedCard || maskedUpi || bank || 'Account'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>AMOUNT</div>
              <div style={{ color: '#f7931e', fontWeight: 800, fontSize: 15 }}>
                ₹{(amount || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Status: Sending / Sent / Error */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            {/* Lock icon */}
            <div style={{
              width: 58, height: 58, borderRadius: '50%', margin: '0 auto 1rem',
              background: sendStatus === 'sent'
                ? 'linear-gradient(135deg,rgba(255,107,53,0.12),rgba(247,147,30,0.12))'
                : sendStatus === 'error'
                  ? 'rgba(255,70,70,0.1)'
                  : 'rgba(100,100,255,0.1)',
              border: sendStatus === 'sent' ? '2px solid rgba(255,107,53,0.4)' : sendStatus === 'error' ? '2px solid rgba(255,70,70,0.4)' : '2px solid rgba(100,100,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
              animation: sendStatus === 'sent' ? 'jp-pulse 2.2s ease-in-out infinite' : 'none',
            }}>
              {sendStatus === 'sending' ? (
                <div style={{ width: 22, height: 22, border: '2.5px solid rgba(255,255,255,0.15)', borderTopColor: '#f7931e', borderRadius: '50%', animation: 'jp-spin 0.7s linear infinite' }} />
              ) : sendStatus === 'sent' ? '🔐' : '⚠️'}
            </div>

            {sendStatus === 'sending' && (
              <>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 17, marginBottom: '0.3rem' }}>Sending OTP...</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Dispatching to your registered contact</div>
              </>
            )}

            {sendStatus === 'sent' && (
              <div style={{ animation: 'jp-fade 0.4s' }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 17, marginBottom: '0.4rem' }}>OTP Sent!</div>
                {/* Delivery channels */}
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {maskedEmail && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: 'rgba(34,208,122,0.12)', border: '1px solid rgba(34,208,122,0.3)',
                      borderRadius: 20, padding: '4px 12px', fontSize: 12, color: '#22d07a', fontWeight: 600,
                    }}>✉ {maskedEmail}</span>
                  )}
                  {maskedPhone && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: 'rgba(100,149,237,0.1)', border: '1px solid rgba(100,149,237,0.25)',
                      borderRadius: 20, padding: '4px 12px', fontSize: 12, color: '#8ab4f8',
                    }}>📱 {maskedPhone}</span>
                  )}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
                  Check your email for the 6-digit OTP
                </div>
              </div>
            )}

            {sendStatus === 'error' && (
              <div style={{ animation: 'jp-fade 0.3s' }}>
                <div style={{ color: '#ff4646', fontWeight: 700, fontSize: 16, marginBottom: '0.3rem' }}>Could not send OTP</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Check your email/phone and try resending</div>
              </div>
            )}
          </div>

          {/* OTP Input Boxes */}
          {sendStatus === 'sent' && (
            <>
              <div style={{ display: 'flex', gap: '0.55rem', justifyContent: 'center', marginBottom: '0.75rem' }}
                onPaste={handlePaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => inputRefs.current[idx] = el}
                    className={`otp-input${digit ? ' filled' : ''}${otpError ? ' error' : ''}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleKeyDown(idx, e)}
                    disabled={verifying}
                    style={{
                      width: 46, height: 54, borderRadius: 10,
                      border: '2px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.03)',
                      color: '#fff', textAlign: 'center', fontSize: 20, fontWeight: 700,
                      transition: 'border-color 0.18s, background 0.18s',
                      caretColor: '#f7931e',
                    }}
                  />
                ))}
              </div>

              {/* Error message */}
              {otpError && (
                <p style={{ color: '#ff4646', fontSize: 12, textAlign: 'center', marginBottom: '0.5rem', animation: 'jp-fade 0.2s' }}>
                  {otpError}
                </p>
              )}

              {/* Resend timer */}
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                {canResend ? (
                  <button onClick={handleResend} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f7931e', fontSize: 13, fontWeight: 600, textDecoration: 'underline' }}>
                    🔄 Resend OTP
                  </button>
                ) : (
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                    Resend in <span style={{ color: '#f7931e', fontWeight: 600 }}>{resendTimer}s</span>
                  </span>
                )}
              </div>
            </>
          )}

          {/* Resend button when sending failed */}
          {sendStatus === 'error' && (
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <button onClick={handleResend} style={{
                background: 'rgba(247,147,30,0.12)', border: '1px solid rgba(247,147,30,0.3)',
                borderRadius: 10, padding: '0.6rem 1.5rem', color: '#f7931e',
                fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}>Try Again</button>
            </div>
          )}

          {/* Verify button */}
          <button
            onClick={handleVerify}
            disabled={verifying || sendStatus !== 'sent' || otp.join('').length < 6}
            style={{
              width: '100%', padding: '0.95rem', borderRadius: 12, border: 'none',
              cursor: verifying || sendStatus !== 'sent' || otp.join('').length < 6 ? 'not-allowed' : 'pointer',
              background: verifying || sendStatus !== 'sent' || otp.join('').length < 6
                ? 'rgba(247,147,30,0.25)'
                : 'linear-gradient(135deg, #ff6b35, #f7931e)',
              color: '#fff', fontWeight: 700, fontSize: 15,
              boxShadow: verifying || sendStatus !== 'sent' || otp.join('').length < 6
                ? 'none' : '0 4px 20px rgba(247,147,30,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              transition: 'all 0.2s',
            }}
          >
            {verifying ? (
              <>
                <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'jp-spin 0.8s linear infinite' }} />
                Verifying OTP...
              </>
            ) : '✓ Verify & Pay'}
          </button>

          <button onClick={onBack} style={{
            display: 'block', width: '100%', marginTop: '0.65rem',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center',
          }}>← Change payment method</button>
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.05)', padding: '0.75rem 2rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: 'rgba(255,255,255,0.02)',
        }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>Powered by</span>
          <span style={{ fontSize: 12, fontWeight: 900, color: '#f7931e' }}>JusPay</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>· PCI DSS Level 1</span>
        </div>
      </div>
    </div>
  )
}
