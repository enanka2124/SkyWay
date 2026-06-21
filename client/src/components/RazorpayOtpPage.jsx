import { useState, useEffect, useRef } from 'react'

/**
 * RazorpayOtpPage — Real OTP flow with WHITE background (like real bank payment pages):
 *  - On mount: calls /api/payments/send-otp → real OTP sent to user's email + registered SMS
 *  - User enters OTP → calls /api/payments/verify-otp → payment completes
 *  - UPI payments: 5-min countdown timer; Card/NetBanking: 10-min countdown
 *  - OTP is sent to both email AND the user's registered phone number
 */
export default function RazorpayOtpPage({ amount, method, cardNumber, upiId, upiInfo, selectedUpiApp, payeeConfig, bank, deviceId, passengerInfo, onOtpSuccess, onBack, bookingId }) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [sessionId, setSessionId] = useState(null)
  const [orderId, setOrderId] = useState(null)
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
  const [devOtp, setDevOtp] = useState(null)
  const inputRefs = useRef([])

  const [subStep, setSubStep] = useState(
    method === 'upi'
      ? 'upi-waiting'
      : method === 'netbanking'
        ? 'nb-login'
        : 'card-otp'
  )
  const [upiPin, setUpiPin] = useState([])
  const [nbUser, setNbUser] = useState('')
  const [nbPass, setNbPass] = useState('')
  const [showPhoneNotification, setShowPhoneNotification] = useState(false)
  const [utrNumber, setUtrNumber] = useState('')
  const [verifyingUtr, setVerifyingUtr] = useState(false)

  // QR Code Timer (5 minutes)
  const [qrSecondsLeft, setQrSecondsLeft] = useState(300)
  const [qrExpired, setQrExpired] = useState(false)

  const activePayeeUpi = payeeConfig?.payeeUpiId || 'skywaytravels@icici';
  const activeMerchantName = payeeConfig?.merchantName || 'SkyWay Travels';

  const handleVerifyUtr = async () => {
    if (!/^\d{12}$/.test(utrNumber)) {
      setOtpError('Please enter a valid 12-digit UTR/Ref number.');
      return;
    }

    setVerifyingUtr(true);
    setOtpError('');
    try {
      const res = await fetch('/api/payments/verify-upi-utr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          utr: utrNumber,
          upiId: upiId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setVerifyingUtr(false);
        setBankProcessing(true);
        setTimeout(() => {
          setBankProcessing(false);
          onOtpSuccess(data);
        }, 2200);
      } else {
        setOtpError(data.error || 'Failed to verify payment.');
        setVerifyingUtr(false);
      }
    } catch (err) {
      setOtpError('Network error verifying UPI payment UTR.');
      setVerifyingUtr(false);
    }
  };

  useEffect(() => {
    if (subStep === 'upi-waiting') {
      if (qrSecondsLeft <= 0) {
        setQrExpired(true)
        return
      }
      const t = setTimeout(() => setQrSecondsLeft(s => s - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [qrSecondsLeft, subStep])

  // Polling for payment status (UPI QR checkout)
  useEffect(() => {
    if (subStep === 'upi-waiting' && orderId && !qrExpired && !verifying && !bankProcessing) {
      const pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`/api/payments/status/${orderId}`);
          const data = await res.json();
          if (data.success) {
            if (data.status === 'captured') {
              clearInterval(pollInterval);
              setBankProcessing(true);
              setTimeout(() => {
                setBankProcessing(false);
                onOtpSuccess(data);
              }, 2200);
            } else if (data.status === 'failed') {
              clearInterval(pollInterval);
              setOtpError(data.failureReason || 'Payment failed.');
            }
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 2500);

      return () => clearInterval(pollInterval);
    }
  }, [subStep, orderId, qrExpired, verifying, bankProcessing, onOtpSuccess]);

  // Trigger lockscreen notification drawer for Custom UPI ID
  useEffect(() => {
    if (method === 'upi' && !selectedUpiApp && subStep === 'upi-waiting') {
      const timer = setTimeout(() => {
        setShowPhoneNotification(true)
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [method, selectedUpiApp, subStep])

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
    setDevOtp(null)

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
          bookingId,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSessionId(data.sessionId)
        if (data.orderId) {
          setOrderId(data.orderId)
          sessionStorage.setItem('skyway_active_payment', JSON.stringify({
            orderId: data.orderId,
            amount,
            paymentId: 'pay_' + Math.random().toString(36).substr(2, 12).toUpperCase(),
          }));
        }
        setDeliveryInfo({ email: data.emailSent, sms: data.smsSent })
        setSendStatus('sent')
        if (data.alreadySent) setAlreadySent(true)
        const validMins = data.expiresInMinutes || (isUpi ? 5 : 10)
        setExpiresInMins(validMins)
        setSessionSecondsLeft(validMins * 60)
        // Dev mode: auto-fill OTP if server sent it (no Gmail configured)
        if (data.devOtp) {
          setDevOtp(data.devOtp)
          const digits = String(data.devOtp).split('')
          setOtp(digits)
          setTimeout(() => inputRefs.current[5]?.focus(), 150)
        } else {
          setTimeout(() => inputRefs.current[0]?.focus(), 100)
        }
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

  // ── Verify OTP / UPI PIN ───────────────────────────────────────────────────
  const handleVerify = async (customOtp) => {
    const isUpiVal = method === 'upi'
    const otpStr = customOtp || (isUpiVal ? upiPin.join('') : otp.join(''))
    
    if (isUpiVal && otpStr.length < 4) {
      setOtpError('Please enter your 4 or 6 digit UPI PIN.');
      return;
    }
    if (!isUpiVal && otpStr.length < 6) {
      setOtpError('Please enter the complete 6-digit OTP.');
      return;
    }
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
          upiId: isUpiVal ? upiId : undefined,
          cardLast4: cardNumber ? cardNumber.replace(/\s/g, '').slice(-4) : undefined,
          bank: method === 'netbanking' ? bank : (isUpiVal ? upiInfo?.bank : undefined),
        }),
      })
      const data = await res.json()
      if (data.success) {
        setVerifying(false)
        setBankProcessing(true)
        setTimeout(() => {
          setBankProcessing(false)
          onOtpSuccess(data) // data.paymentStatus: 'captured' | 'failed'
        }, 2200)
      } else {
        setOtpError(data.error || 'Incorrect code. Please try again.')
        setVerifying(false)
        if (isUpiVal) {
          setUpiPin([])
        } else {
          setOtp(['', '', '', '', '', ''])
          setTimeout(() => inputRefs.current[0]?.focus(), 50)
        }
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

  // ── Card Brand & Issuer Resolution ─────────────────────────────────────────
  const getCardBranding = (num) => {
    if (!num) return { bankName: 'SBI Card', brand: 'Mastercard Secure', logoIcon: '💳', color: '#113a5d' }
    const firstDigit = num.replace(/\s/g, '')[0]
    if (firstDigit === '4') {
      return { bankName: 'HDFC Bank', brand: 'Visa Secure', logoIcon: '🔵', color: '#004c8f' }
    } else if (firstDigit === '5') {
      return { bankName: 'State Bank of India', brand: 'Mastercard Identity Check', logoIcon: '⚪', color: '#00b4d8' }
    } else if (firstDigit === '3') {
      return { bankName: 'American Express', brand: 'Amex SafeKey', logoIcon: '🟢', color: '#0070d2' }
    }
    return { bankName: 'SBI Card', brand: 'Mastercard Identity Check', logoIcon: '💳', color: '#113a5d' }
  }
  const cardBranding = getCardBranding(cardNumber)

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
        
        /* Simulated lockscreen notification keyframes */
        @keyframes slideDownNotification {
          0% { transform: translate(-50%, -100px); opacity: 0; }
          100% { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>

      {/* ── Simulated Phone Notification Drawer ── */}
      {showPhoneNotification && (
        <div 
          onClick={() => { setShowPhoneNotification(false); setSubStep('upi-app'); }}
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '380px',
            background: 'rgba(28, 28, 30, 0.96)',
            color: '#ffffff',
            borderRadius: '18px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
            padding: '14px 18px',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.08)',
            animation: 'slideDownNotification 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            textAlign: 'left'
          }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: upiInfo?.bankColor || '#5f259f',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}>
            {upiInfo?.bankIcon || '📱'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <span style={{ fontWeight: 800, fontSize: '13px', color: '#fff' }}>{upiInfo?.bank || 'UPI App'}</span>
              <span style={{ fontSize: '10px', color: '#8e8e93' }}>Now</span>
            </div>
            <div style={{ fontSize: '12px', color: '#e5e5ea', fontWeight: 500, lineHeight: '1.35' }}>
              Request of ₹{amount.toLocaleString('en-IN')} from SkyWay Travels. Tap to Pay.
            </div>
          </div>
        </div>
      )}

      {/* ── Bank Processing Overlay (after verification) ── */}
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
              🏦 Debiting Account...
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Contacting bank server for account debitation. Please do not close this window.
            </div>
          </div>
        </div>
      )}

      {/* ── 1. UPI Waiting Scanner / App Approval Request ── */}
      {method === 'upi' && subStep === 'upi-waiting' && (() => {
        const upiUrl = `upi://pay?pa=${activePayeeUpi}&pn=${encodeURIComponent(activeMerchantName)}&am=${amount}&cu=INR&tn=SkyWay%20Booking`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUrl)}`;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const handleUpiAppRedirect = () => {
          window.location.href = upiUrl;
        };

        return (
          <div style={{
            width: '100%', maxWidth: 440, background: '#ffffff', borderRadius: 16, border: '1px solid #e5e7eb',
            boxShadow: '0 10px 40px rgba(0,0,0,0.12)', overflow: 'hidden', textAlign: 'center', animation: 'jp-fade 0.35s'
          }}>
            {/* Header */}
            <div style={{ borderBottom: '2px solid #f3f4f6', padding: '1.1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: 'linear-gradient(135deg, #0b2d63, #3399cc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18, color: '#fff' }}>R</div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ color: '#111827', fontWeight: 700, fontSize: 14 }}>UPI Secure Checkout</div>
                  <div style={{ color: '#9ca3af', fontSize: 11 }}>NPCI Certified · White-Label Payee</div>
                </div>
              </div>
              <div style={{ color: '#7c3aed', fontWeight: 800, fontSize: 16 }}>₹{amount.toLocaleString('en-IN')}</div>
            </div>

            <div style={{ padding: '2rem 1.5rem' }}>
              {otpError && (
                <div style={{
                  background: '#fff5f5', border: '1.5px solid #fecaca', color: '#c53030',
                  borderRadius: 10, padding: '10px', fontSize: 12, marginBottom: 16, textAlign: 'center'
                }}>
                  {otpError}
                </div>
              )}
              {/* Active countdown timer */}
              <div style={{
                background: qrExpired ? '#fef2f2' : '#fff7ed',
                border: `1.5px solid ${qrExpired ? '#fecaca' : '#fed7aa'}`,
                borderRadius: 20, padding: '4px 14px', display: 'inline-flex',
                alignItems: 'center', gap: 6, marginBottom: 16
              }}>
                <span style={{ fontSize: 12 }}>⏱️</span>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: qrExpired ? '#ef4444' : '#ea580c' }}>
                  {qrExpired ? 'Payment Session Expired' : `Pay within: ${String(Math.floor(qrSecondsLeft / 60)).padStart(2, '0')}:${String(qrSecondsLeft % 60).padStart(2, '0')}`}
                </span>
              </div>

              {qrExpired ? (
                <div style={{ padding: '1.5rem 0' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>⏱️</div>
                  <h4 style={{ color: '#e53e3e', margin: '0 0 8px', fontWeight: 700 }}>Transaction Expired</h4>
                  <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 20px' }}>
                    The 5-minute checkout window has elapsed. No funds were debited. Please go back and request a new session.
                  </p>
                  <button onClick={onBack} style={{
                    padding: '10px 20px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 8,
                    color: '#4b5563', fontSize: 13, fontWeight: 600, cursor: 'pointer'
                  }}>Go Back</button>
                </div>
              ) : (
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: '#111827' }}>
                    {selectedUpiApp 
                      ? `Scan to Pay with ${upiInfo?.bank || 'UPI App'}`
                      : 'Scan to Pay via UPI'}
                  </h3>

                  {/* QR Code container */}
                  <div style={{ margin: '0 auto 20px', display: 'inline-block', padding: 8, background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                    <img 
                      src={qrUrl} 
                      alt="UPI QR Code" 
                      style={{ width: 180, height: 180, display: 'block' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', color: '#16a34a', fontSize: 12, fontWeight: 700, marginBottom: 20 }}>
                    <span style={{ animation: 'jp-spin 2s linear infinite', display: 'inline-block' }}>⏳</span>
                    <span>Awaiting payment approval in your mobile app...</span>
                  </div>

                  {/* UTR Input Card */}
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'left',
                    marginBottom: '16px',
                    marginTop: '8px'
                  }}>
                    <label style={{ fontSize: '12px', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      🔗 Enter 12-Digit UPI Ref / UTR No.
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="12-digit UTR number"
                        value={utrNumber}
                        onChange={e => {
                          setOtpError('');
                          setUtrNumber(e.target.value.replace(/\D/g, '').slice(0, 12));
                        }}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '14px',
                          outline: 'none',
                          color: '#1e293b',
                          background: '#ffffff',
                          fontFamily: 'monospace',
                          letterSpacing: '0.5px'
                        }}
                      />
                      <button
                        onClick={handleVerifyUtr}
                        disabled={utrNumber.length !== 12 || verifyingUtr}
                        style={{
                          padding: '10px 16px',
                          background: utrNumber.length === 12 && !verifyingUtr ? '#10b981' : '#cbd5e1',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: utrNumber.length === 12 && !verifyingUtr ? 'pointer' : 'not-allowed',
                          transition: 'background 0.2s',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {verifyingUtr ? 'Verifying...' : 'Verify Pay'}
                      </button>
                    </div>
                    <span style={{ fontSize: '10px', color: '#64748b', marginTop: '6px', display: 'block' }}>
                      Find the 12-digit UTR/Ref No. in your payment confirmation message/receipt.
                    </span>
                  </div>

                  {/* Mobile Direct Intent redirection */}
                  {isMobile && (
                    <button
                      onClick={handleUpiAppRedirect}
                      style={{
                        width: '100%', padding: '14px', background: '#138808', color: '#fff',
                        border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(19,136,8,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        marginBottom: 12
                      }}
                    >
                      🚀 Redirect & Pay in UPI App
                    </button>
                  )}


                </div>
              )}
            </div>
            <div style={{ padding: '1rem 1.5rem', background: '#fafafa', borderTop: '1px solid #f3f4f6' }}>
              <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 12, cursor: 'pointer' }}>← Back to payment methods</button>
            </div>
          </div>
        );
      })()}

      {/* ── 2. UPI Mobile App Mockup Screen ── */}
      {method === 'upi' && subStep === 'upi-app' && (
        <div style={{
          width: '100%', maxWidth: 360, background: '#ffffff', borderRadius: '32px', border: '12px solid #1a1a1a',
          boxShadow: '0 25px 60px rgba(0,0,0,0.25)', overflow: 'hidden', animation: 'jp-fade 0.3s', color: '#1c1c1e', textAlign: 'left'
        }}>
          {/* App Bar */}
          <div style={{ background: upiInfo?.bankColor || '#5f259f', color: '#ffffff', padding: '20px 16px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: 18 }}>{upiInfo?.bankIcon || '📱'}</span>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{upiInfo?.bank || 'UPI Payments'}</span>
          </div>

          <div style={{ padding: '24px 20px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f2f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 12px' }}>✈</div>
            <div style={{ fontSize: 11, color: '#8e8e93', fontWeight: 700, marginBottom: 2 }}>PAYING MERCHANT</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1c1c1e', marginBottom: 12 }}>SkyWay Travels</div>
            
            <div style={{ fontSize: 32, fontWeight: 800, color: '#1c1c1e', letterSpacing: '-0.02em', marginBottom: 20 }}>
              ₹{amount.toLocaleString('en-IN')}
            </div>
            
            <div style={{
              background: '#f8f9fa', borderRadius: 12, padding: '12px 14px',
              fontSize: 13, color: '#3a3a3c', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 28, border: '1px solid #e5e5ea'
            }}>
              <span style={{ fontWeight: 600, color: '#8e8e93' }}>Debit From:</span>
              <span style={{ fontWeight: 700 }}>HDFC Bank (•••• 8943)</span>
            </div>
            
            <button
              onClick={() => setSubStep('upi-pin')}
              style={{
                width: '100%', background: upiInfo?.bankColor || '#5f259f', color: '#ffffff',
                border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                boxShadow: `0 4px 16px ${(upiInfo?.bankColor || '#5f259f')}44`
              }}
            >
              Pay ₹{amount.toLocaleString('en-IN')}
            </button>
          </div>
        </div>
      )}

      {/* ── 3. NPCI UPI PIN Pad ── */}
      {method === 'upi' && subStep === 'upi-pin' && (
        <div style={{
          width: '100%', maxWidth: 360, background: '#0d1b2a', borderRadius: '32px', border: '12px solid #1a1a1a',
          boxShadow: '0 25px 60px rgba(0,0,0,0.25)', overflow: 'hidden', animation: 'jp-fade 0.3s', color: '#ffffff',
          textAlign: 'center', paddingBottom: '20px', fontFamily: 'monospace'
        }}>
          {/* NPCI Header */}
          <div style={{ background: '#1b263b', padding: '12px', fontSize: '11px', color: '#a3b18a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>NATIONAL PAYMENTS CORPORATION</span>
            <span style={{ fontWeight: 900, color: '#fff' }}>NPCI</span>
          </div>

          <div style={{ padding: '20px' }}>
            <div style={{ fontSize: '12px', color: '#e0e0e0', marginBottom: '4px' }}>Paying SkyWay Travels</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#f7931e', marginBottom: '16px' }}>₹{amount.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: '11px', color: '#a3b18a', marginBottom: '8px', letterSpacing: '1px' }}>ENTER UPI PIN</div>
            
            {/* Pin Dots */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
              {[0, 1, 2, 3, 4, 5].map(idx => (
                <div key={idx} style={{
                  width: 14, height: 14, borderRadius: '50%',
                  background: upiPin[idx] !== undefined ? '#fff' : 'transparent',
                  border: '2px solid #fff',
                  transition: 'background 0.15s'
                }} />
              ))}
            </div>

            {otpError && (
              <div style={{ background: 'rgba(229,62,62,0.15)', border: '1px solid #e53e3e', color: '#fc8181', borderRadius: 8, padding: '8px', fontSize: 11, marginBottom: 16 }}>
                {otpError}
              </div>
            )}

            {/* Numpad Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', maxWidth: '240px', margin: '0 auto 10px' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button key={num}
                  onClick={() => {
                    setOtpError('')
                    if (upiPin.length < 6) setUpiPin([...upiPin, String(num)])
                  }}
                  style={{
                    background: '#1b263b', border: 'none', borderRadius: '50%',
                    width: 50, height: 50, color: '#fff', fontSize: 18, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto'
                  }}
                >{num}</button>
              ))}
              {/* Backspace */}
              <button
                onClick={() => { setOtpError(''); setUpiPin(upiPin.slice(0, -1)); }}
                style={{
                  background: '#1b263b', border: 'none', borderRadius: '50%',
                  width: 50, height: 50, color: '#ff6b6b', fontSize: 18, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto'
                }}
              >⌫</button>
              {/* 0 */}
              <button
                onClick={() => {
                  setOtpError('')
                  if (upiPin.length < 6) setUpiPin([...upiPin, '0'])
                }}
                style={{
                  background: '#1b263b', border: 'none', borderRadius: '50%',
                  width: 50, height: 50, color: '#fff', fontSize: 18, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto'
                }}
              >0</button>
              {/* Submit */}
              <button
                onClick={() => handleVerify(upiPin.join(''))}
                disabled={upiPin.length < 4 || verifying}
                style={{
                  background: upiPin.length >= 4 ? '#2a9d8f' : '#3d5a80',
                  border: 'none', borderRadius: '50%',
                  width: 50, height: 50, color: '#fff', fontSize: 18, fontWeight: 700,
                  cursor: upiPin.length >= 4 ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto', transition: 'background 0.2s', opacity: verifying ? 0.6 : 1
                }}
              >✓</button>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', marginTop: '10px' }}>
              🔒 Protected by 256-bit bank-grade encryption
            </div>
          </div>
        </div>
      )}

      {/* ── 4. NetBanking Retail Login Portal ── */}
      {method === 'netbanking' && subStep === 'nb-login' && (
        <div style={{
          width: '100%', maxWidth: 440, background: '#ffffff', borderRadius: '12px', border: '1px solid #d1d5db',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)', overflow: 'hidden', animation: 'jp-fade 0.3s', color: '#1a1a1a', textAlign: 'left'
        }}>
          <div style={{
            background: bank === 'SBI' ? '#00b4d8' : '#004c8f', color: '#ffffff',
            padding: '16px 20px', fontWeight: 700, fontSize: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span>{bank} Secure Retail NetBanking</span>
            <span style={{ fontSize: 12 }}>🔒 Safe & Secure</span>
          </div>

          <div style={{ padding: '24px 20px' }}>
            <h4 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#333' }}>Login to NetBanking Account</h4>
            
            {otpError && (
              <div style={{ background: '#fff5f5', border: '1px solid #fecaca', color: '#c53030', borderRadius: 8, padding: '10px', fontSize: 13, marginBottom: 14 }}>
                {otpError}
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: '#4b5563', display: 'block', marginBottom: 4, fontWeight: 600 }}>Username / Customer ID</label>
              <input
                type="text"
                placeholder="Enter username"
                value={nbUser}
                onChange={e => { setOtpError(''); setNbUser(e.target.value); }}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #d1d5db',
                  fontSize: 14, outline: 'none', background: '#fff', color: '#000'
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: '#4b5563', display: 'block', marginBottom: 4, fontWeight: 600 }}>Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={nbPass}
                onChange={e => { setOtpError(''); setNbPass(e.target.value); }}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #d1d5db',
                  fontSize: 14, outline: 'none', background: '#fff', color: '#000'
                }}
              />
            </div>

            <button
              onClick={() => {
                if (nbUser.trim() && nbPass.trim()) {
                  setSubStep('nb-otp')
                } else {
                  setOtpError('Please enter username and password.')
                }
              }}
              style={{
                width: '100%', background: bank === 'SBI' ? '#00b4d8' : '#004c8f', color: '#ffffff',
                border: 'none', borderRadius: 6, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer'
              }}
            >
              Login Securely
            </button>
            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 12, cursor: 'pointer' }}>Cancel & Go Back</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. Netbanking OTP Page ── */}
      {method === 'netbanking' && subStep === 'nb-otp' && (
        <div style={{
          width: '100%', maxWidth: 440, background: '#ffffff', borderRadius: 12, border: '1px solid #e5e7eb',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)', overflow: 'hidden', animation: 'jp-fade 0.3s', color: '#1a1a1a', textAlign: 'center'
        }}>
          {/* Header */}
          <div style={{
            background: bank === 'SBI' ? '#00b4d8' : '#004c8f', color: '#ffffff',
            padding: '16px 20px', fontWeight: 700, fontSize: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span>{bank} OTP Authorization</span>
            <span style={{ fontSize: 12 }}>🔒 Secure Link</span>
          </div>

          <div style={{ padding: '24px 20px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px', color: '#333' }}>One-Time Password Verification</h3>
            <p style={{ color: '#6b7280', fontSize: 12, lineHeight: 1.5, marginBottom: 20 }}>
              A High Security OTP has been sent to your registered mobile number and email. Input it below to complete the transaction.
            </p>

            {devOtp && (
              <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 8, padding: '8px 16px', fontSize: 13, color: '#15803d', fontWeight: 700, marginBottom: 16, letterSpacing: 2, fontFamily: 'monospace' }}>
                🔓 Dev OTP: {devOtp}
              </div>
            )}

            {/* 6-box input */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: 20 }}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => inputRefs.current[idx] = el}
                  className={`otp-box-white${digit ? ' filled' : ''}${otpError ? ' error' : ''}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={e => {
                    const next = [...otp]
                    next[idx] = e.target.value.replace(/\D/g, '')
                    setOtp(next)
                    setOtpError('')
                    if (e.target.value && idx < 5) inputRefs.current[idx + 1]?.focus()
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Backspace' && !otp[idx] && idx > 0) inputRefs.current[idx - 1]?.focus()
                  }}
                  style={{
                    width: 42, height: 48, borderRadius: 8, border: '1.5px solid #d1d5db', textAlign: 'center', fontSize: 20, fontWeight: 700, outline: 'none'
                  }}
                />
              ))}
            </div>

            {otpError && (
              <div style={{ background: '#fff5f5', border: '1px solid #fecaca', color: '#c53030', borderRadius: 8, padding: '8px', fontSize: 12, marginBottom: 16 }}>
                {otpError}
              </div>
            )}

            <button
              onClick={() => handleVerify()}
              disabled={verifying}
              style={{
                width: '100%', background: bank === 'SBI' ? '#00b4d8' : '#004c8f', color: '#ffffff',
                border: 'none', borderRadius: 6, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: verifying ? 0.6 : 1
              }}
            >
              {verifying ? 'Verifying...' : 'Confirm Payment'}
            </button>
            <div style={{ marginTop: 14 }}>
              <button onClick={() => setSubStep('nb-login')} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 12, cursor: 'pointer' }}>← Back to login</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Card 3D Secure Verification ── */}
      {method === 'card' && subStep === 'card-otp' && (
        <div style={{
          width: '100%', maxWidth: 440, background: '#ffffff', borderRadius: 16, border: '1px solid #e5e7eb',
          boxShadow: '0 10px 40px rgba(0,0,0,0.12)', overflow: 'hidden', animation: 'jp-fade 0.35s'
        }}>
          {/* Bank logo banner */}
          <div style={{
            background: cardBranding.color, color: '#ffffff', padding: '16px 20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16 }}>{cardBranding.logoIcon}</span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{cardBranding.bankName}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.5 }}>{cardBranding.brand}</span>
          </div>

          <div style={{ padding: '24px 20px', textAlign: 'left', color: '#333' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: '#111827', textAlign: 'center' }}>
              Secure Authentication Page
            </h3>

            {/* Details Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 20 }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 0', color: '#6b7280' }}>Merchant</td>
                  <td style={{ padding: '8px 0', fontWeight: 600, textAlign: 'right', color: '#111827' }}>SkyWay Travels</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 0', color: '#6b7280' }}>Amount</td>
                  <td style={{ padding: '8px 0', fontWeight: 700, textAlign: 'right', color: '#ea580c' }}>₹{amount.toLocaleString('en-IN')}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 0', color: '#6b7280' }}>Card Number</td>
                  <td style={{ padding: '8px 0', fontWeight: 600, textAlign: 'right', color: '#111827' }}>
                    **** **** **** {cardNumber.replace(/\s/g, '').slice(-4)}
                  </td>
                </tr>
              </tbody>
            </table>

            {devOtp && (
              <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 8, padding: '8px 16px', fontSize: 13, color: '#15803d', fontWeight: 700, marginBottom: 16, textAlign: 'center', letterSpacing: 2, fontFamily: 'monospace' }}>
                🔓 Dev OTP: {devOtp}
              </div>
            )}

            {/* 6-box input */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: 20 }}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => inputRefs.current[idx] = el}
                  className={`otp-box-white${digit ? ' filled' : ''}${otpError ? ' error' : ''}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={e => {
                    const next = [...otp]
                    next[idx] = e.target.value.replace(/\D/g, '')
                    setOtp(next)
                    setOtpError('')
                    if (e.target.value && idx < 5) inputRefs.current[idx + 1]?.focus()
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Backspace' && !otp[idx] && idx > 0) inputRefs.current[idx - 1]?.focus()
                  }}
                  style={{
                    width: 42, height: 48, borderRadius: 8, border: '1.5px solid #d1d5db', textAlign: 'center', fontSize: 20, fontWeight: 700, outline: 'none'
                  }}
                />
              ))}
            </div>

            {otpError && (
              <div style={{ background: '#fff5f5', border: '1px solid #fecaca', color: '#c53030', borderRadius: 8, padding: '8px', fontSize: 12, marginBottom: 16, textAlign: 'center' }}>
                {otpError}
              </div>
            )}

            <button
              onClick={() => handleVerify()}
              disabled={verifying}
              style={{
                width: '100%', background: cardBranding.color, color: '#ffffff',
                border: 'none', borderRadius: 8, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: verifying ? 0.6 : 1
              }}
            >
              {verifying ? 'Verifying Card Security...' : 'Verify Secure Card Code'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 12, cursor: 'pointer' }}>Cancel & Go Back</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
