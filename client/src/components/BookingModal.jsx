import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PaymentModal from './PaymentModal'

export default function BookingModal({ flight, isOpen, onClose }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // If user is not logged in and modal tries to open, redirect to sign in
  useEffect(() => {
    if (isOpen && !user) {
      onClose()
      navigate('/signin', { state: { from: location.pathname } })
    }
  }, [isOpen, user])

  // Don't render if not logged in
  if (!user) return null

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [passport, setPassport] = useState('')
  const [nationality, setNationality] = useState('')
  const [ticketId, setTicketId] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    if (flight) {
      setFirstName(''); setLastName(''); setEmail(''); setPhone('')
      setPassport(''); setNationality(''); setTicketId('')
      setShowSuccess(false); setShowPayment(false)
    }
  }, [flight])

  if (!isOpen || !flight) return null

  const taxes = Math.round(flight.price * 0.05)
  const convenienceFee = 299
  const total = flight.price + taxes + convenienceFee

  const handleProceedToPayment = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      alert('Please fill in your name and email to continue.'); return
    }
    setShowPayment(true)
  }

  const handlePaymentSuccess = async (paymentData) => {
    setShowPayment(false)
    setSubmitting(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flight, firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phone: phone.trim(), passport: passport.trim(), nationality }),
      })
      const data = await res.json()
      if (data.success) {
        setTicketId(data.ticketId)
        // Save to localStorage
        const trips = JSON.parse(localStorage.getItem('skyway_trips') || '[]')
        trips.push({ type: 'flight', ...data.booking, paymentId: paymentData?.paymentId })
        localStorage.setItem('skyway_trips', JSON.stringify(trips))
        setShowSuccess(true)
      }
    } catch {
      const id = 'SKY' + Math.random().toString(36).substr(2, 8).toUpperCase()
      setTicketId(id)
      const trips = JSON.parse(localStorage.getItem('skyway_trips') || '[]')
      trips.push({ type: 'flight', ticketId: id, flight, pricing: { total }, bookedAt: new Date().toISOString() })
      localStorage.setItem('skyway_trips', JSON.stringify(trips))
      setShowSuccess(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        <div className="modal-box">
          <button className="modal-close" onClick={onClose}>✕</button>

          {!showSuccess ? (
            <>
              <h2 className="font-syne text-[1.4rem] font-bold mb-6">Complete Booking</h2>
              <div className="rounded-xl px-5 py-4 mb-6 flex items-center justify-between flex-wrap gap-2" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div>
                  <div className="font-syne font-bold">{flight.from} → {flight.to}</div>
                  <div className="text-text-muted text-[0.8rem]">{flight.airline} · {flight.dep} – {flight.arr} · {flight.stops}</div>
                </div>
                <div className="font-syne text-xl font-bold text-accent">₹{flight.price.toLocaleString('en-IN')}</div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="First Name *" value={firstName} onChange={e => setFirstName(e.target.value)} className="sky-input" />
                  <input type="text" placeholder="Last Name *" value={lastName} onChange={e => setLastName(e.target.value)} className="sky-input" />
                </div>
                <input type="email" placeholder="Email Address *" value={email} onChange={e => setEmail(e.target.value)} className="sky-input" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="tel" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} className="sky-input" />
                  <input type="text" placeholder="Passport / ID No." value={passport} onChange={e => setPassport(e.target.value)} className="sky-input" />
                </div>
                <select value={nationality} onChange={e => setNationality(e.target.value)} className="sky-input">
                  <option value="">Select Nationality</option>
                  <option>Indian</option><option>American</option><option>British</option><option>UAE</option><option>Other</option>
                </select>
                <div className="border-t border-white/8 pt-4 mt-2 flex flex-col gap-2">
                  <div className="price-line"><span>Base fare</span><span>₹{flight.price.toLocaleString('en-IN')}</span></div>
                  <div className="price-line"><span>Taxes & fees (5%)</span><span>₹{taxes.toLocaleString('en-IN')}</span></div>
                  <div className="price-line"><span>Convenience fee</span><span>₹{convenienceFee}</span></div>
                  <div className="price-line total"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
                </div>
              </div>
              <button className="confirm-btn" onClick={handleProceedToPayment} disabled={submitting}>
                {submitting ? 'Processing...' : 'Proceed to Payment →'}
              </button>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4" style={{ background: 'rgba(34,208,122,0.12)', border: '2px solid #22d07a' }}>✓</div>
              <h3 className="font-syne text-2xl font-bold mb-2">Booking Confirmed!</h3>
              <p className="text-text-muted text-sm">Your tickets are on the way.<br />Check your email for details.</p>
              <div className="ticket-badge">{ticketId}</div>
              <button className="confirm-btn" onClick={onClose}>Done</button>
            </div>
          )}
        </div>
      </div>

      {showPayment && (
        <PaymentModal amount={total} bookingInfo={{ from: flight.from, to: flight.to, airline: flight.airline }} onSuccess={handlePaymentSuccess} onClose={() => setShowPayment(false)} />
      )}
    </>
  )
}
