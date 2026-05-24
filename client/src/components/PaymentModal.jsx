import { useState } from 'react'
import JusPayOtpPage from './JusPayOtpPage'

/**
 * PaymentModal — multi-step payment flow:
 *   Step 1: Enter card / UPI / net-banking details
 *   Step 2: JusPay OTP authentication (bank redirect simulation)
 *   Step 3: Success / failure
 */
export default function PaymentModal({ amount, bookingInfo, passengerInfo, onSuccess, onClose }) {
  const [method, setMethod] = useState('card')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [cardName, setCardName] = useState('')
  const [upiId, setUpiId] = useState('')
  const [bank, setBank] = useState('')
  const [step, setStep] = useState('details') // 'details' | 'otp' | 'processing' | 'success' | 'failed'
  const [error, setError] = useState('')

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
    if (method === 'upi') return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId)
    if (method === 'netbanking') return bank !== ''
    return false
  }

  // Step 1 → 2: Validate form then show JusPay OTP page
  const handleProceedToOtp = () => {
    if (!isFormValid()) {
      if (method === 'card') setError('Invalid input: Please enter a valid 16-digit card number, valid expiry (MM/YY), and CVV.')
      else if (method === 'upi') setError('Invalid input: Please enter a valid UPI ID (e.g., name@okbank).')
      else setError('Invalid input: Please select a bank for Net Banking.')
      return
    }
    setError('')
    setStep('otp')
  }

  // Step 2 → 3: OTP verified — server already processed payment in verify-otp
  const handleOtpSuccess = (paymentData) => {
    setStep('processing')
    // Server already sent confirmation email + SMS in /verify-otp
    // Give a moment for the processing screen, then fire onSuccess
    setTimeout(() => {
      setStep('success')
      setTimeout(() => onSuccess({ ...paymentData, method }), 1800)
    }, 800)
  }

  // ─── OTP Page (full-screen JusPay — real OTP sent + verified) ─────────────────────
  if (step === 'otp') {
    return (
      <JusPayOtpPage
        amount={amount}
        method={method}
        cardNumber={cardNumber}
        upiId={upiId}
        bank={bank}
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

  // ─── Processing / Success / Failed screens ───────────────────────────────
  if (step === 'processing' || step === 'success' || step === 'failed') {
    return (
      <div className="w-full flex justify-center py-4">
        <div className="glass-card w-full" style={{ maxWidth: 540, padding: '2rem 2.5rem' }}>
          <div className="text-center py-8">
            {step === 'processing' && (
              <>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-accent)', animation: 'spin 1s linear infinite' }}>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
                <h3 className="font-syne text-xl font-bold mb-2">Processing Payment...</h3>
                <p className="text-text-muted text-sm">Do not close this window</p>
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
                  {passengerInfo?.phone && <> &amp; +91 {passengerInfo.phone}</>}
                </p>
              </>
            )}
            {step === 'failed' && (
              <>
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
                  style={{ background: 'rgba(255,70,70,0.12)', border: '2px solid #ff4646' }}>✕</div>
                <h3 className="font-syne text-xl font-bold mb-2" style={{ color: '#ff4646' }}>Payment Failed</h3>
                <p className="text-text-muted text-sm mb-4">Please try again</p>
                <button className="confirm-btn" onClick={() => { setStep('details') }}>Retry</button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── Step 1: Payment details form ────────────────────────────────────────
  return (
    <div className="w-full flex justify-center py-4">
      <div className="glass-card w-full" style={{ maxWidth: 540, padding: '2rem 2.5rem' }}>
        <button className="text-text-muted hover:text-white mb-6 text-sm flex items-center gap-2 bg-transparent border-none cursor-pointer" onClick={onClose}>← Back to details</button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
            style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)', color: '#fff', boxShadow: '0 4px 12px rgba(255,107,53,0.35)' }}>J</div>
          <div>
            <div className="font-syne font-bold">JusPay · Secure Checkout</div>
            <div className="text-xs text-text-muted">PCI DSS Level 1 Certified</div>
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
            { id: 'upi', label: '📱 UPI' },
            { id: 'netbanking', label: '🏦 Net Banking' },
          ].map(m => (
            <button key={m.id}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium cursor-pointer border transition-all ${method === m.id ? 'text-accent' : 'text-text-muted'}`}
              style={{
                background: method === m.id ? 'rgba(247,147,30,0.12)' : 'rgba(255,255,255,0.04)',
                borderColor: method === m.id ? 'rgba(247,147,30,0.4)' : 'rgba(255,255,255,0.08)',
              }}
              onClick={() => { setMethod(m.id); setError('') }}>
              {m.label}
            </button>
          ))}
        </div>

        {/* Card Form */}
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

        {/* UPI Form */}
        {method === 'upi' && (
          <div>
            <label className="text-xs text-text-muted mb-1 block">UPI ID</label>
            <input type="text" placeholder="yourname@upi" value={upiId}
              onChange={e => setUpiId(e.target.value.replace(/[^a-zA-Z0-9.\-_@]/g, ''))}
              className="sky-input" maxLength={60} />
          </div>
        )}

        {/* Net Banking */}
        {method === 'netbanking' && (
          <div className="grid grid-cols-2 gap-2">
            {['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'PNB'].map(b => (
              <button key={b}
                className="flight-card text-center py-3 text-sm hover:text-accent transition-all"
                style={{
                  background: bank === b ? 'rgba(247,147,30,0.12)' : '',
                  borderColor: bank === b ? 'rgba(247,147,30,0.3)' : '',
                }}
                onClick={() => setBank(b)}>{b}</button>
            ))}
          </div>
        )}

        {/* Security badge */}
        <div className="flex items-center gap-2 mt-4 text-xs text-text-muted">
          <span>🔒</span>
          <span>256-bit SSL encrypted · Secured by JusPay</span>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg text-sm font-medium"
            style={{ background: 'rgba(255,70,70,0.1)', color: '#ff4646', border: '1px solid rgba(255,70,70,0.3)' }}>
            {error}
          </div>
        )}

        {/* CTA — goes to OTP step */}
        <button className="confirm-btn" onClick={handleProceedToOtp} style={{ marginTop: '1rem' }}>
          Continue to Bank OTP →
        </button>

        <p className="text-center text-xs text-text-muted mt-3">
          You will be redirected to your bank's OTP verification page
        </p>
      </div>
    </div>
  )
}
