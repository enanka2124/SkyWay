import { useState, useEffect, useRef } from 'react'
import RazorpayOtpPage from './RazorpayOtpPage'

// stable device fingerprint for OTP deduplication
const DEVICE_ID = 'dev_' + (localStorage.getItem('skyway_device_id') || (() => {
  const id = Math.random().toString(36).substr(2, 16);
  localStorage.setItem('skyway_device_id', id);
  return id;
})());

/**
 * PaymentModal — complete bank-grade payment flow.
 * When Razorpay is active: auto-opens Razorpay checkout immediately on mount.
 * When Razorpay is inactive: shows UPI QR / simulated OTP flow.
 */
export default function PaymentModal({ amount, bookingInfo, passengerInfo, onSuccess, onPaymentFailed, onClose, bookingId }) {
  const [method, setMethod] = useState('upi')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [cardName, setCardName] = useState('')
  const [upiId, setUpiId] = useState('')
  const [bank, setBank] = useState('')
  const [selectedUpiApp, setSelectedUpiApp] = useState(null)
  const [capturedPaymentInfo, setCapturedPaymentInfo] = useState(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [step, setStep] = useState('details')
  const [error, setError] = useState('')
  const [failureInfo, setFailureInfo] = useState(null)
  const [bankStep, setBankStep] = useState(0)
  const [upiValidating, setUpiValidating] = useState(false)
  const [upiInfo, setUpiInfo] = useState(null)
  const [upiValidErr, setUpiValidErr] = useState('')
  const [payeeConfig, setPayeeConfig] = useState({
    payeeUpiId: 'skywaytravels@icici',
    merchantName: 'SkyWay Travels',
    razorpayActive: false,
    razorpayKeyId: null,
  })

  const autoTriggerRef = useRef(false)
  const upiDebounceRef = useRef(null)

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handleOtpSuccess = (paymentData) => {
    sessionStorage.removeItem('skyway_active_payment')
    if (paymentData?.paymentStatus === 'failed') {
      setFailureInfo({
        reason: paymentData.failureReason,
        code: paymentData.failureCode,
        paymentId: paymentData.paymentId,
        orderId: paymentData.orderId,
        amount: paymentData.amount,
      })
      setStep('failed')
      if (onPaymentFailed) onPaymentFailed(paymentData)
      return
    }
    setCapturedPaymentInfo(paymentData)
    setStep('success')
    setTimeout(() => onSuccess({ ...paymentData, method }), 3000)
  }

  const handleRazorpayDirect = async (currentConfig) => {
    const cfg = currentConfig || payeeConfig
    setError('')
    setIsInitializing(true)

    const scriptLoaded = await loadRazorpayScript()
    if (!scriptLoaded) {
      setError('Failed to load Razorpay payment SDK. Please try again.')
      setIsInitializing(false)
      return
    }

    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: 'INR',
          bookingType: bookingInfo?.type,
          from: bookingInfo?.from,
          to: bookingInfo?.to,
          airline: bookingInfo?.airline,
          bookingId,
        }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Failed to create transaction order')
        setIsInitializing(false)
        return
      }

      sessionStorage.setItem('skyway_active_payment', JSON.stringify({
        orderId: data.orderId,
        amount,
        paymentId: 'pay_' + Math.random().toString(36).substr(2, 12).toUpperCase(),
      }))

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: cfg.merchantName || 'SkyWay Travels',
        description: bookingInfo?.type === 'hotel'
          ? 'Hotel Booking'
          : `${bookingInfo?.from} to ${bookingInfo?.to} Flight`,
        order_id: data.orderId,
        handler: async function (response) {
          setStep('bank-processing')
          setBankStep(2)
          try {
            const verifyRes = await fetch('/api/payments/verify-signature', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                email: passengerInfo?.email,
                phone: passengerInfo?.phone,
                firstName: passengerInfo?.firstName,
                lastName: passengerInfo?.lastName || '',
                amount: amount,
                bookingType: bookingInfo?.type,
                from: bookingInfo?.from,
                to: bookingInfo?.to,
                airline: bookingInfo?.airline,
              }),
            })
            const verifyData = await verifyRes.json()
            if (verifyData.success) {
              setBankStep(3)
              setTimeout(() => handleOtpSuccess(verifyData), 1000)
            } else {
              setError('Payment verification failed.')
              setIsInitializing(false)
            }
          } catch (err) {
            console.error('Verify error:', err)
            setError('Network error verifying payment.')
            setIsInitializing(false)
          }
        },
        prefill: {
          name: `${passengerInfo?.firstName || ''} ${passengerInfo?.lastName || ''}`.trim(),
          email: passengerInfo?.email || '',
          contact: passengerInfo?.phone || '',
        },
        theme: { color: '#7c3aed' },
        modal: {
          ondismiss: function () {
            sessionStorage.removeItem('skyway_active_payment')
            setIsInitializing(false)
            onClose()
          }
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      console.error('Create order error:', err)
      setError('Failed to initiate secure checkout order.')
      setIsInitializing(false)
    }
  }

  useEffect(() => {
    fetch('/api/payments/config')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const config = {
            payeeUpiId: data.payeeUpiId,
            merchantName: data.merchantName,
            razorpayActive: data.razorpayActive,
            razorpayKeyId: data.razorpayKeyId,
          }
          setPayeeConfig(config)
          if (data.razorpayActive && !autoTriggerRef.current) {
            autoTriggerRef.current = true
            handleRazorpayDirect(config)
          }
        }
      })
      .catch(err => console.log('Error fetching payment config:', err))
  }, []) // eslint-disable-line

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

  useEffect(() => {
    if (step === 'bank-processing') {
      setBankStep(0)
      const timings = [600, 1400, 2200]
      const timers = timings.map((t, i) => setTimeout(() => setBankStep(i + 1), t))
      return () => timers.forEach(clearTimeout)
    }
  }, [step])

  const isUpiFormatValid = (id) => /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(id)

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
    if (method === 'upi') {
      if (selectedUpiApp) return true
      return isUpiFormatValid(upiId) && !!upiInfo && !upiValidating
    }
    if (method === 'netbanking') return bank !== ''
    return false
  }

  const handleProceedToOtp = async () => {
    if (payeeConfig.razorpayActive) {
      handleRazorpayDirect(payeeConfig)
      return
    }
    // Otherwise validate form (UPI / simulated card flow)
    if (!isFormValid()) {
      if (method === 'card') setError('Please enter a valid 16-digit card number, valid expiry (MM/YY) and CVV.')
      else if (method === 'upi') setError(upiValidErr || 'Please enter a valid, verified UPI ID (e.g. name@okaxis).')
      else setError('Please select a bank for Net Banking.')
      return
    }
    setError('')
    setStep('otp')
  }

  const handleUpiAppSelect = async (appName) => {
    setSelectedUpiApp(appName)
    setError('')
    setStep('otp')
  }

  // full-screen OTP step
  if (step === 'otp') {
    const finalUpiId = selectedUpiApp ? (selectedUpiApp === 'gpay' ? 'gpay@okaxis' : 'phonepe@ybl') : upiId
    const finalUpiInfo = selectedUpiApp ? {
      bank: selectedUpiApp === 'gpay' ? 'Google Pay' : 'PhonePe',
      bankIcon: selectedUpiApp === 'gpay' ? '📱' : '💜',
      bankColor: selectedUpiApp === 'gpay' ? '#3c4043' : '#5f259f',
    } : upiInfo

    return (
      <RazorpayOtpPage
        amount={amount}
        method={method}
        cardNumber={cardNumber}
        upiId={finalUpiId}
        upiInfo={finalUpiInfo}
        selectedUpiApp={selectedUpiApp}
        payeeConfig={payeeConfig}
        bank={bank}
        deviceId={DEVICE_ID}
        bookingId={bookingId}
        passengerInfo={{
          ...passengerInfo,
          registeredPhone: passengerInfo?.registeredPhone || passengerInfo?.phone,
          bookingType: bookingInfo?.type,
          from: bookingInfo?.from,
          to: bookingInfo?.to,
          airline: bookingInfo?.airline,
        }}
        onOtpSuccess={handleOtpSuccess}
        onBack={() => {
          sessionStorage.removeItem('skyway_active_payment')
          setStep('details')
          setSelectedUpiApp(null)
        }}
      />
    )
  }

  // bank processing / success / failure result pages
  if (step === 'bank-processing' || step === 'success' || step === 'failed') {
    return (
      <div className="modal-overlay" style={{ zIndex: 1100 }}>
        <div className="glass-card w-full" style={{ maxWidth: 540, padding: '2rem 2.5rem' }}>
          <div className="text-center py-8">
            {step === 'bank-processing' && (
              <>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }`}</style>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ border: '3px solid var(--divider-color)', borderTopColor: 'var(--color-accent)', animation: 'spin 1s linear infinite' }}
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
                        background: s.done ? 'rgba(34,208,122,0.15)' : 'var(--btn-ghost-bg)',
                        border: `1.5px solid ${s.done ? '#22d07a' : 'var(--divider-color)'}`,
                        color: s.done ? '#22d07a' : 'var(--color-text-muted)',
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
                </p>

                {/* Floating SMS Debit Notification */}
                {capturedPaymentInfo && (
                  <div style={{
                    position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
                    width: '95%', maxWidth: '420px', background: 'rgba(255,255,255,0.96)', color: '#1a1a1a',
                    borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', padding: '14px 18px',
                    zIndex: 9999, display: 'flex', alignItems: 'start', gap: '12px', textAlign: 'left',
                    animation: 'slideDown 0.4s cubic-bezier(0.16,1,0.3,1) forwards', border: '1px solid rgba(0,0,0,0.08)',
                  }}>
                    <div style={{ fontSize: '24px', lineHeight: 1 }}>💬</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: '#1a1a1a' }}>Messages · Now</span>
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>skyway.in</span>
                      </div>
                      <div style={{ fontSize: '12.5px', lineHeight: '1.45', color: '#2d3748', fontWeight: 500 }}>
                        Alert: ₹{capturedPaymentInfo.amount?.toLocaleString('en-IN')} debited from A/c XX{method === 'card' ? cardNumber.replace(/\s/g, '').slice(-4) : '8943'}. Avl Bal: ₹{capturedPaymentInfo.newBalance?.toLocaleString('en-IN')}. Txn: {capturedPaymentInfo.paymentId}. -{capturedPaymentInfo.bank || 'Bank'}
                      </div>
                    </div>
                  </div>
                )}
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
                  <div style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{failureInfo.reason}</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.8 }}>
                    Ref: {failureInfo.paymentId}
                  </div>
                </div>
                <p className="text-text-muted text-xs mb-4">No amount has been deducted from your account.</p>
                <div className="flex gap-3 justify-center">
                  <button className="confirm-btn"
                    onClick={() => { setStep('details'); setFailureInfo(null); setUpiId(''); setUpiInfo(null) }}
                    style={{ background: 'rgba(247,147,30,0.15)', border: '1px solid rgba(247,147,30,0.4)', color: 'var(--color-accent)' }}>
                    Try Another Method
                  </button>
                  <button className="confirm-btn" onClick={onClose}
                    style={{ background: 'transparent', border: '1px solid var(--divider-color)', color: 'var(--text-primary)' }}>
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

  // loading screen while Razorpay checkout initializes
  if (isInitializing) {
    return (
      <div className="modal-overlay" style={{ zIndex: 1100 }}>
        <div className="glass-card w-full text-center flex flex-col items-center justify-center"
          style={{ maxWidth: 540, padding: '3.5rem 2.5rem' }}>
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
            @keyframes pulseGlow {
              0%, 100% { opacity: 0.6; transform: scale(0.98); }
              50%       { opacity: 1;   transform: scale(1.02); }
            }
          `}</style>
          <div className="relative mb-6 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full"
              style={{ border: '3.5px solid rgba(255,255,255,0.06)', borderTopColor: '#3399cc', animation: 'spin 1.1s linear infinite' }}
            />
            <div className="absolute text-2xl" style={{ animation: 'pulseGlow 2s infinite ease-in-out' }}>🔒</div>
          </div>
          <h3 className="font-syne text-xl font-bold mb-2">Connecting to Secure Gateway...</h3>
          <p className="text-text-muted text-sm max-w-xs mx-auto mb-4">
            Please complete your transaction in the secure Razorpay payment window.
          </p>

          {error ? (
            <div className="mt-2 p-4 rounded-xl text-sm font-medium w-full text-left"
              style={{ background: 'rgba(255,70,70,0.1)', color: '#ff4646', border: '1px solid rgba(255,70,70,0.25)' }}>
              <div className="font-bold mb-1">Payment Initialization Failed</div>
              <div className="opacity-90 mb-3">{error}</div>
              <div className="flex gap-2">
                <button onClick={() => handleRazorpayDirect(payeeConfig)}
                  className="confirm-btn flex-1" style={{ fontSize: '0.8rem', padding: '0.5rem' }}>
                  Retry
                </button>
                <button onClick={onClose}
                  className="btn-ghost flex-1" style={{ fontSize: '0.8rem', padding: '0.5rem' }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-text-muted px-4 py-1.5 rounded-full border border-divider-color bg-filter-group-bg">
              🔒 PCI-DSS Compliant &middot; 256-bit SSL Encryption
            </div>
          )}
        </div>
      </div>
    )
  }

  // payment details form — only shown when Razorpay is not active
  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="glass-card w-full" style={{ maxWidth: 540, padding: '2rem 2.5rem' }} onClick={e => e.stopPropagation()}>
        <button className="text-text-muted hover:text-text-primary mb-6 text-sm flex items-center gap-2 bg-transparent border-none cursor-pointer" onClick={onClose}>← Back to details</button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
            style={{ background: 'linear-gradient(135deg,#0b2d63,#3399cc)', color: '#fff', boxShadow: '0 4px 12px rgba(51,153,204,0.35)' }}>R</div>
          <div>
            <div className="font-syne font-bold">Razorpay · Secure Checkout</div>
            <div className="text-xs text-text-muted">PCI DSS Level 1 · Bank-Grade Encryption</div>
          </div>
          <div className="ml-auto font-syne text-xl font-bold text-accent">₹{amount.toLocaleString('en-IN')}</div>
        </div>

        {bookingInfo && (
          <div className="text-sm text-text-muted mb-4 px-3 py-2 rounded-lg" style={{ background: 'var(--filter-group-bg)', border: '1px solid var(--divider-color)' }}>
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
                background: method === m.id ? 'rgba(247,147,30,0.12)' : 'var(--btn-ghost-bg)',
                borderColor: method === m.id ? 'rgba(247,147,30,0.4)' : 'var(--divider-color)',
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

        {/* ── UPI Form ───────────────────────────────────────────────────── */}
        {method === 'upi' && (
          <div>
            <div className="mb-5">
              <label className="text-xs text-text-muted mb-2 block">Express Checkout UPI Apps</label>
              <div className="flex gap-3">
                <button type="button" onClick={() => handleUpiAppSelect('gpay')}
                  className="flex-1 py-3 px-4 rounded-xl text-sm font-bold cursor-pointer border transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: '#ffffff', borderColor: '#dadce0', color: '#3c4043', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google-Pay-Logo.svg" alt="Google Pay" style={{ height: 18 }} />
                </button>
                <button type="button" onClick={() => handleUpiAppSelect('phonepe')}
                  className="flex-1 py-3 px-4 rounded-xl text-sm font-bold cursor-pointer border transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: '#5f259f', borderColor: '#5f259f', color: '#ffffff', boxShadow: '0 4px 12px rgba(95,37,159,0.2)' }}>
                  <img src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/phonepe-logo-icon.png" alt="PhonePe" style={{ height: 20, filter: 'brightness(0) invert(1)', marginRight: '6px' }} />
                  <span style={{ fontSize: 14, fontWeight: 800 }}>PhonePe</span>
                </button>
              </div>
            </div>

            <div className="relative flex py-4 items-center">
              <div className="grow border-t" style={{ borderColor: 'var(--divider-color)' }} />
              <span className="shrink mx-4 text-[10px] text-text-muted uppercase tracking-wider font-bold">Or Pay Using Custom UPI ID</span>
              <div className="grow border-t" style={{ borderColor: 'var(--divider-color)' }} />
            </div>

            <label className="text-xs text-text-muted mb-1 block">UPI ID</label>
            <div style={{ position: 'relative' }}>
              <input type="text" placeholder="yourname@okaxis"
                value={selectedUpiApp ? '' : upiId}
                onChange={e => { setSelectedUpiApp(null); setUpiId(e.target.value.replace(/[^a-zA-Z0-9.\-_@]/g, '')); setUpiInfo(null); setUpiValidErr('') }}
                className="sky-input" maxLength={60}
                style={{ borderColor: upiInfo ? 'rgba(34,208,122,0.5)' : upiValidErr ? 'rgba(255,70,70,0.5)' : undefined, paddingRight: '2.5rem' }}
              />
              <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}>
                {upiValidating && <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#f7931e', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
                {upiInfo && !upiValidating && <span style={{ color: '#22d07a', fontSize: 16 }}>✓</span>}
                {upiValidErr && !upiValidating && <span style={{ color: '#ff4646', fontSize: 16 }}>✕</span>}
              </div>
            </div>

            {upiInfo && !upiValidating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.5rem', background: 'rgba(34,208,122,0.06)', border: '1px solid rgba(34,208,122,0.2)', borderRadius: 10, padding: '0.6rem 0.9rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: upiInfo.bankColor + '22', border: `1.5px solid ${upiInfo.bankColor}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{upiInfo.bankIcon}</div>
                <div>
                  <div style={{ color: '#22d07a', fontWeight: 700, fontSize: '0.8rem' }}>✓ UPI ID Verified</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{upiInfo.bank} · {upiInfo.maskedVpa}</div>
                </div>
              </div>
            )}
            {upiValidating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
                <div style={{ width: 12, height: 12, border: '2px solid var(--divider-color)', borderTopColor: '#f7931e', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Verifying UPI ID with NPCI...
              </div>
            )}
            {upiValidErr && <div style={{ color: '#ff6060', fontSize: '0.78rem', marginTop: '0.4rem' }}>⚠ {upiValidErr}</div>}
            {!upiId && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--color-text-muted)', opacity: 0.6 }}>
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
                { id: 'SBI', label: 'SBI', icon: '🏦' },
                { id: 'HDFC', label: 'HDFC', icon: '🏦' },
                { id: 'ICICI', label: 'ICICI', icon: '🏦' },
                { id: 'Axis', label: 'Axis', icon: '🏦' },
                { id: 'Kotak', label: 'Kotak', icon: '🏦' },
                { id: 'PNB', label: 'PNB', icon: '🏦' },
              ].map(b => (
                <button key={b.id}
                  className="flight-card text-center py-3 text-sm hover:text-accent transition-all flex flex-col items-center gap-1"
                  style={{ background: bank === b.id ? 'rgba(247,147,30,0.12)' : '', borderColor: bank === b.id ? 'rgba(247,147,30,0.4)' : '', color: bank === b.id ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
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
        <div style={{ marginTop: '1rem' }}>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span>🔒</span>
            <span>256-bit SSL encrypted · Secured by Razorpay · RBI Compliant</span>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg text-sm font-medium"
            style={{ background: 'rgba(255,70,70,0.1)', color: '#ff4646', border: '1px solid rgba(255,70,70,0.3)' }}>
            {error}
          </div>
        )}

        <button className="confirm-btn"
          onClick={handleProceedToOtp}
          disabled={method === 'upi' && !selectedUpiApp && (upiValidating || (!upiInfo && isUpiFormatValid(upiId)))}
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
