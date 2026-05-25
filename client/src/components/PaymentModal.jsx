import { useState, useEffect, useRef } from 'react'
import JusPayOtpPage from './JusPayOtpPage'

// ── Device ID (one OTP per device) ────────────────────────────────────────────
function getDeviceId() {
  let id = localStorage.getItem('skyway_device_id')
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substr(2, 20) + '_' + Date.now()
    localStorage.setItem('skyway_device_id', id)
  }
  return id
}

/**
 * PaymentModal — complete bank-grade payment flow:
 *   Step 1 : Enter payment details (Card / UPI / Net Banking)
 *   Step 1b: UPI Validation — "Checking UPI ID with NPCI..." (UPI only)
 *   Step 2 : JusPay OTP page (5-min countdown for UPI)
 *   Step 3 : Bank processing animation (real debit simulation)
 *   Step 4 : Success | Failed (with reason + refund note)
 */
export default function PaymentModal({ amount, bookingInfo, passengerInfo, onSuccess, onPaymentFailed, onClose }) {
  const [method, setMethod]         = useState('card')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry]         = useState('')
  const [cvv, setCvv]               = useState('')
  const [cardName, setCardName]     = useState('')
  const [upiId, setUpiId]           = useState('')
  const [bank, setBank]             = useState('')

  // UPI validation state
  const [upiValidating, setUpiValidating] = useState(false)
  const [upiInfo, setUpiInfo]             = useState(null)   // { bank, bankIcon, bankColor }
  const [upiValidErr, setUpiValidErr]     = useState('')

  // Steps: 'details' | 'upi-validating' | 'otp' | 'bank-processing' | 'balance-checking' | 'success' | 'failed'
  const [step, setStep]             = useState('details')
  const [error, setError]           = useState('')
  const [failureInfo, setFailureInfo] = useState(null) // { reason, code, paymentId, orderId }
  const [bankStep, setBankStep]     = useState(0) // 0→3 for bank processing animation

  const upiDebounceRef = useRef(null)

  // ── UPI ID format validation (client-side, instant) ─────────────────────
  const isUpiFormatValid = (id) => /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(id)

  // ── Auto-validate UPI ID as user types (debounced 800ms) ─────────────────
  useEffect(() => {
    if (method !== 'upi') return
    setUpiInfo(null)
    setUpiValidErr('')
    if (!upiId || !isUpiFormatValid(upiId)) return
    clearTimeout(upiDebounceRef.current)
    upiDebounceRef.current = setTimeout(async () => {
      setUpiValidating(true)
      try {
        const res = await fetch('/api/payments/validate-upi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ upiId }),
        })
        const data = await res.json()
        if (data.success && data.valid) {
          setUpiInfo(data)
          setUpiValidErr('')
        } else {
          setUpiValidErr(data.error || 'UPI ID not found')
          setUpiInfo(null)
        }
      } catch {
        setUpiValidErr('Could not verify UPI ID. Check your connection.')
      } finally {
        setUpiValidating(false)
      }
    }, 800)
  }, [upiId, method]) // eslint-disable-line

  const formatCardNumber = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(.{4})/g, '$1 ').trim()
  }
  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4)
    if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2)
    return digits
  }

  const isFormValid = () => {
    if (method === 'card') {
      const isExpValid = /^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)
      return cardNumber.replace(/\s/g, '').length === 16 && isExpValid && cvv.length >= 3 && cardName.trim().length >= 3
    }
    if (method === 'upi') return isUpiFormatValid(upiId) && !!upiInfo && !upiValidating
    if (method === 'netbanking') return bank !== ''
    return false
  }

  // ── Step 1 → OTP: validate then go to OTP ────────────────────────────────
  const handleProceedToOtp = () => {
    if (!isFormValid()) {
      if (method === 'card') setError('Please enter a valid 16-digit card number, valid expiry (MM/YY) and CVV.')
      else if (method === 'upi') setError(upiValidErr || 'Please enter a valid, verified UPI ID (e.g. name@okaxis).')
      else setError('Please select a bank for Net Banking.')
      return
    }
    setError('')
    setStep('otp')
  }

  // ── Step 2 → OTP success → bank processing animation ─────────────────────
  const handleOtpSuccess = (paymentData) => {
    if (paymentData?.paymentStatus === 'failed') {
      // Payment failed (wrong balance / bank declined)
      setFailureInfo({
        reason:    paymentData.failureReason,
        code:      paymentData.failureCode,
        paymentId: paymentData.paymentId,
        orderId:   paymentData.orderId,
        amount:    paymentData.amount,
      })
      setStep('failed')
      if (onPaymentFailed) onPaymentFailed(paymentData)
      return
    }
    // Payment captured — show success
    setStep('success')
    setTimeout(() => onSuccess({ ...paymentData, method }), 1800)
  }

  // ── Bank processing stages ────────────────────────────────────────────────
  useEffect(() => {
    if (step === 'bank-processing') {
      setBankStep(0)
      const timings = [600, 1400, 2200]
      const timers = timings.map((t, i) => setTimeout(() => setBankStep(i + 1), t))
      return () => timers.forEach(clearTimeout)
    }
  }, [step])

  // ── OTP page (full-screen JusPay) ─────────────────────────────────────────
  if (step === 'otp') {
    return (
      <JusPayOtpPage
        amount={amount}
        method={method}
        cardNumber={cardNumber}
        upiId={upiId}
        upiInfo={upiInfo}
        bank={bank}
        deviceId={getDeviceId()}
        passengerInfo={{
          ...passengerInfo,
          bookingType: bookingInfo?.type,
          from: bookingInfo?.from,
          to: bookingInfo?.to,
          airline: bookingInfo?.airline,
        }}
        onOtpSuccess={handleOtpSuccess}
        onBack={() => setStep('details')}
      />
    )
  }

  // ── Processing / Success / Failed ─────────────────────────────────────────
  if (step === 'bank-processing' || step === 'success' || step === 'failed') {
    return (
      <div className="w-full flex justify-center py-4">
        <div className="glass-card w-full" style={{ maxWidth: 540, padding: '2rem 2.5rem' }}>
          <div className="text-center py-8">
            {step === 'bank-processing' && (
              <>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }`}</style>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ border: '3px solid rgba(255,255,255,0.08)', borderTopColor: 'var(--color-accent)', animation: 'spin 1s linear infinite' }}
                />
                <h3 className="font-syne text-xl font-bold mb-3">Contacting Your Bank...</h3>
                <div className="flex flex-col gap-2 text-sm text-left max-w-xs mx-auto">
                  {[
                    { label: 'Sending authentication request', done: bankStep >= 1 },
                    { label: 'Verifying transaction with bank', done: bankStep >= 2 },
                    { label: 'Confirming payment & debiting account', done: bankStep >= 3 },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-3" style={{ animation: 'fadeUp 0.3s', opacity: bankStep >= i ? 1 : 0.3 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0, fontSize: 12, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: s.done ? 'rgba(34,208,122,0.15)' : 'rgba(255,255,255,0.06)',
                        border: `1.5px solid ${s.done ? '#22d07a' : 'rgba(255,255,255,0.15)'}`,
                        color: s.done ? '#22d07a' : 'rgba(255,255,255,0.3)',
                        transition: 'all 0.4s',
                      }}>{s.done ? '✓' : (i + 1)}</div>
                      <span style={{ color: s.done ? '#e0e0f0' : 'var(--color-text-muted)', transition: 'color 0.4s' }}>{s.label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-text-muted mt-5">Do not close or refresh this window</p>
              </>
            )}

            {step === 'success' && (
              <>
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
                  style={{ background: 'rgba(34,208,122,0.12)', border: '2px solid #22d07a' }}>✓</div>
                <h3 className="font-syne text-xl font-bold mb-2 text-success">Payment Successful!</h3>
                <p className="text-text-muted text-sm">
                  Confirming your booking
                  {passengerInfo?.email && <> · Confirmation sent to <strong>{passengerInfo.email}</strong></>}
                  {passengerInfo?.phone && <> & +91 {passengerInfo.phone}</>}
                </p>
              </>
            )}

            {step === 'failed' && failureInfo && (
              <>
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
                  style={{ background: 'rgba(255,70,70,0.12)', border: '2px solid #ff4646' }}>✕</div>
                <h3 className="font-syne text-xl font-bold mb-2" style={{ color: '#ff4646' }}>Payment Failed</h3>
                <div style={{
                  background: 'rgba(255,70,70,0.07)', border: '1px solid rgba(255,70,70,0.2)',
                  borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.25rem', textAlign: 'left', fontSize: '0.875rem',
                }}>
                  <div style={{ color: '#ff8080', marginBottom: '0.4rem', fontWeight: 600 }}>
                    {failureInfo.code === 'insufficient_funds' ? '💳 Insufficient Balance' :
                      failureInfo.code === 'daily_limit_exceeded' ? '🚫 Daily Limit Exceeded' : '❌ Declined by Bank'}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{failureInfo.reason}</div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                    Ref: {failureInfo.paymentId}
                  </div>
                </div>
                <p className="text-text-muted text-xs mb-4">No amount has been deducted from your account.</p>
                <div className="flex gap-3 justify-center">
                  <button className="confirm-btn" onClick={() => { setStep('details'); setFailureInfo(null); setUpiId(''); setUpiInfo(null) }}
                    style={{ background: 'rgba(247,147,30,0.15)', border: '1px solid rgba(247,147,30,0.4)', color: 'var(--color-accent)' }}>
                    Try Another Method
                  </button>
                  <button className="confirm-btn" onClick={onClose}
                    style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── Step 1: Payment details form ─────────────────────────────────────────
  return (
    <div className="w-full flex justify-center py-4">
      <div className="glass-card w-full" style={{ maxWidth: 540, padding: '2rem 2.5rem' }}>
        <button className="text-text-muted hover:text-white mb-6 text-sm flex items-center gap-2 bg-transparent border-none cursor-pointer" onClick={onClose}>← Back to details</button>

        {/* JusPay Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
            style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)', color: '#fff', boxShadow: '0 4px 12px rgba(255,107,53,0.35)' }}>J</div>
          <div>
            <div className="font-syne font-bold">JusPay · Secure Checkout</div>
            <div className="text-xs text-text-muted">PCI DSS Level 1 · Bank-Grade Encryption</div>
          </div>
          <div className="ml-auto font-syne text-xl font-bold text-accent">₹{amount.toLocaleString('en-IN')}</div>
        </div>

        {bookingInfo && (
          <div className="text-sm text-text-muted mb-4 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {bookingInfo.from} → {bookingInfo.to} · {bookingInfo.airline}
          </div>
        )}

        {/* Payment Method Tabs */}
        <div className="flex gap-2 mb-5">
          {[
            { id: 'card', label: '💳 Card' },
            { id: 'upi',  label: '📱 UPI' },
            { id: 'netbanking', label: '🏦 Net Banking' },
          ].map(m => (
            <button key={m.id}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium cursor-pointer border transition-all ${method === m.id ? 'text-accent' : 'text-text-muted'}`}
              style={{
                background:   method === m.id ? 'rgba(247,147,30,0.12)' : 'rgba(255,255,255,0.04)',
                borderColor:  method === m.id ? 'rgba(247,147,30,0.4)' : 'rgba(255,255,255,0.08)',
              }}
              onClick={() => { setMethod(m.id); setError(''); setUpiInfo(null); setUpiValidErr('') }}>
              {m.label}
            </button>
          ))}
        </div>

        {/* ── Card Form ──────────────────────────────────────────────────── */}
        {method === 'card' && (
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Card Number</label>
              <input type="text" placeholder="1234 5678 9012 3456" value={cardNumber}
                onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                className="sky-input" maxLength={19} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-muted mb-1 block">Expiry</label>
                <input type="text" placeholder="MM/YY" value={expiry}
                  onChange={e => setExpiry(formatExpiry(e.target.value))}
                  className="sky-input" maxLength={5} />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">CVV</label>
                <input type="password" placeholder="•••" value={cvv}
                  onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="sky-input" maxLength={4} />
              </div>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Cardholder Name</label>
              <input type="text" placeholder="Name on card" value={cardName}
                onChange={e => setCardName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                className="sky-input" maxLength={50} />
            </div>
          </div>
        )}

        {/* ── UPI Form with live validation ─────────────────────────────── */}
        {method === 'upi' && (
          <div>
            <label className="text-xs text-text-muted mb-1 block">UPI ID</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="yourname@okaxis"
                value={upiId}
                onChange={e => { setUpiId(e.target.value.replace(/[^a-zA-Z0-9.\-_@]/g, '')); setUpiInfo(null); setUpiValidErr('') }}
                className="sky-input"
                maxLength={60}
                style={{
                  borderColor: upiInfo ? 'rgba(34,208,122,0.5)' : upiValidErr ? 'rgba(255,70,70,0.5)' : undefined,
                  paddingRight: '2.5rem',
                }}
              />
              {/* Status indicator */}
              <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}>
                {upiValidating && (
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#f7931e', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                )}
                {upiInfo && !upiValidating && <span style={{ color: '#22d07a', fontSize: 16 }}>✓</span>}
                {upiValidErr && !upiValidating && <span style={{ color: '#ff4646', fontSize: 16 }}>✕</span>}
              </div>
            </div>

            {/* Live UPI bank resolution */}
            {upiInfo && !upiValidating && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.5rem',
                background: 'rgba(34,208,122,0.06)', border: '1px solid rgba(34,208,122,0.2)',
                borderRadius: 10, padding: '0.6rem 0.9rem',
                animation: 'fadeUp 0.25s',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, background: upiInfo.bankColor + '22',
                  border: `1.5px solid ${upiInfo.bankColor}55`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
                }}>{upiInfo.bankIcon}</div>
                <div>
                  <div style={{ color: '#22d07a', fontWeight: 700, fontSize: '0.8rem' }}>✓ UPI ID Verified</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>{upiInfo.bank} · {upiInfo.maskedVpa}</div>
                </div>
              </div>
            )}

            {upiValidating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>
                <div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#f7931e', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Verifying UPI ID with NPCI...
              </div>
            )}

            {upiValidErr && (
              <div style={{ color: '#ff6060', fontSize: '0.78rem', marginTop: '0.4rem' }}>⚠ {upiValidErr}</div>
            )}

            {!upiId && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)' }}>
                Supported: @okaxis, @okicici, @oksbi, @okhdfcbank, @ybl, @paytm, @upi, and more
              </div>
            )}
          </div>
        )}

        {/* ── Net Banking Grid ──────────────────────────────────────────── */}
        {method === 'netbanking' && (
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>Select your bank</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'SBI',   label: 'SBI',   icon: '🏦' },
                { id: 'HDFC',  label: 'HDFC',  icon: '🏦' },
                { id: 'ICICI', label: 'ICICI', icon: '🏦' },
                { id: 'Axis',  label: 'Axis',  icon: '🏦' },
                { id: 'Kotak', label: 'Kotak', icon: '🏦' },
                { id: 'PNB',   label: 'PNB',   icon: '🏦' },
              ].map(b => (
                <button key={b.id}
                  className="flight-card text-center py-3 text-sm hover:text-accent transition-all flex flex-col items-center gap-1"
                  style={{
                    background:  bank === b.id ? 'rgba(247,147,30,0.12)' : '',
                    borderColor: bank === b.id ? 'rgba(247,147,30,0.4)' : '',
                    color:       bank === b.id ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  }}
                  onClick={() => setBank(b.id)}>
                  <span>{b.icon}</span>
                  <span className="font-semibold">{b.label}</span>
                  {bank === b.id && <span style={{ fontSize: '0.6rem', color: '#22d07a' }}>✓ Selected</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Security badge */}
        <div className="flex items-center gap-2 mt-4 text-xs text-text-muted">
          <span>🔒</span>
          <span>256-bit SSL encrypted · Secured by JusPay · RBI Compliant</span>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg text-sm font-medium"
            style={{ background: 'rgba(255,70,70,0.1)', color: '#ff4646', border: '1px solid rgba(255,70,70,0.3)' }}>
            {error}
          </div>
        )}

        <button
          className="confirm-btn"
          onClick={handleProceedToOtp}
          disabled={method === 'upi' && (upiValidating || (!upiInfo && isUpiFormatValid(upiId)))}
          style={{ marginTop: '1rem', opacity: (method === 'upi' && upiValidating) ? 0.6 : 1 }}>
          {method === 'upi' && upiValidating ? 'Verifying UPI...' : 'Continue to Bank OTP →'}
        </button>

        <p className="text-center text-xs text-text-muted mt-3">
          You will be redirected to your bank's secure OTP verification page
        </p>
      </div>
    </div>
  )
}
