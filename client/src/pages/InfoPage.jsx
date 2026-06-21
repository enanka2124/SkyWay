import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const pages = {
  about: {
    title: 'About Us',
    sections: [
      { heading: 'Our Story', content: 'Founded in 2020, SkyWay started with a simple mission: make flight booking effortless, transparent, and affordable for every traveler. What began as a small startup in Mumbai has grown into India\'s fastest-growing travel platform, serving over 2 million customers monthly.' },
      { heading: 'Our Mission', content: 'We believe everyone deserves to explore the world. Our AI-powered search engine compares thousands of flights across 500+ airlines in real-time, ensuring you always get the best deal. We\'re committed to transparency — no hidden fees, no surprises.' },
      { heading: 'Our Team', content: 'Our team of 200+ travel enthusiasts, engineers, and customer support specialists work around the clock to deliver a seamless booking experience. We\'re backed by leading investors and trusted by travelers across 150+ countries.' },
      { heading: 'Why Choose SkyWay?', list: ['Best price guarantee on all flights', 'Real-time fare tracking & alerts', '24/7 customer support', 'Instant refund processing', 'Secure payment with 256-bit encryption', '500+ airline partners worldwide'] },
    ],
  },
  contact: {
    title: 'Contact Us',
    isContact: true,
    info: [
      { icon: '📧', label: 'Email', value: 'enankanandi083@gmail.com', desc: 'We reply within 2 hours' },
      { icon: '📞', label: 'Phone', value: '+91 8670403446', desc: '24/7 toll-free support' },
      { icon: '📍', label: 'Office', value: 'Kolkata', desc: 'Visit us Mon-Sat, 9am-6pm' },
    ],
  },
  careers: {
    title: 'Careers',
    intro: 'Join us and help millions travel smarter. We\'re always looking for passionate people.',
    jobs: [
      { id: 'SKY-2026-006', title: 'Data Analyst', dept: 'Analytics', location: 'Remote', type: 'Contract', exp: '2+ Years', postedDate: 'May 12, 2026' },
      { id: 'SKY-2026-005', title: 'Marketing Manager', dept: 'Marketing', location: 'Mumbai', type: 'Full-time', exp: '3-5 Years', postedDate: 'May 11, 2026' },
      { id: 'SKY-2026-004', title: 'Customer Support Lead', dept: 'Support', location: 'Delhi', type: 'Full-time', exp: '5+ Years', postedDate: 'May 10, 2026' },
      { id: 'SKY-2026-003', title: 'Product Designer', dept: 'Design', location: 'Mumbai', type: 'Full-time', exp: '2-4 Years', postedDate: 'May 08, 2026' },
      { id: 'SKY-2026-002', title: 'Backend Engineer (Node.js)', dept: 'Engineering', location: 'Mumbai / Remote', type: 'Full-time', exp: '3+ Years', postedDate: 'May 05, 2026' },
      { id: 'SKY-2026-001', title: 'Senior React Developer', dept: 'Engineering', location: 'Mumbai / Remote', type: 'Full-time', exp: '4+ Years', postedDate: 'May 02, 2026' },
    ],
  },
  help: {
    title: 'Help Center',
    faqs: [
      { q: 'How do I book a flight?', a: 'Enter your departure city, destination, dates, and number of passengers. Click "Search" to see available flights, then select your preferred option and complete the booking form.' },
      { q: 'Can I cancel or modify my booking?', a: 'Yes! Go to "My Trips" or "Manage Booking" and enter your ticket ID. Cancellation and modification policies vary by airline.' },
      { q: 'How do I get a refund?', a: 'Refunds are processed automatically for eligible cancellations within 5-7 business days. Check our Refunds page for detailed policies.' },
      { q: 'Is my payment secure?', a: 'Absolutely. We use 256-bit SSL encryption and partner with Razorpay for secure payment processing (PCI DSS Level 1). Your card details are never stored on our servers.' },
      { q: 'Do you charge convenience fees?', a: 'A small convenience fee of ₹299 is added to cover payment processing and customer support. This is clearly shown before you pay.' },
      { q: 'How can I contact support?', a: 'Reach us via email at support@skyway.in, call +91 1800-SKY-0000 (toll-free, 24/7), or use the live chat feature in our app.' },
    ],
  },
  refunds: {
    title: 'Refund Policy',
    sections: [
      { heading: 'Refund Eligibility', content: 'Refunds are available for cancellations made within the airline\'s refund window. Fully refundable tickets are processed within 24 hours; partially refundable tickets within 5-7 business days.' },
      { heading: 'How to Request a Refund', list: ['Go to "Manage Booking" and enter your ticket ID', 'Select "Cancel & Refund" option', 'Choose your refund method (original payment or wallet)', 'Submit your request — you\'ll receive email confirmation'] },
      { heading: 'Refund Timeline', content: 'Credit/Debit Card: 5-7 business days. UPI/Net Banking: 3-5 business days. SkyWay Wallet: Instant.' },
      { heading: 'Non-Refundable Items', content: 'Convenience fees (₹299) are non-refundable. Special promotional fares may have different cancellation policies as stated at the time of booking.' },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    sections: [
      { heading: 'Data We Collect', content: 'We collect information you provide directly (name, email, phone, payment details) and automatically (device info, browsing patterns, IP address) to improve our services.' },
      { heading: 'How We Use Your Data', list: ['Process bookings and payments', 'Send booking confirmations and updates', 'Personalize search results and deals', 'Improve our platform and user experience', 'Comply with legal obligations'] },
      { heading: 'Data Sharing', content: 'We share your information only with airlines (for ticketing), payment processors (Razorpay), and as required by law. We never sell your personal data to third parties.' },
      { heading: 'Data Security', content: 'Your data is protected with 256-bit AES encryption. Payment information is processed through PCI-DSS compliant systems and never stored on our servers.' },
      { heading: 'Your Rights', content: 'You may request access to, correction, or deletion of your personal data at any time by contacting privacy@skyway.in.' },
    ],
  },
  terms: {
    title: 'Terms of Use',
    sections: [
      { heading: 'Acceptance', content: 'By using SkyWay, you agree to these terms. If you do not agree, please do not use our services.' },
      { heading: 'Booking Terms', content: 'All bookings are subject to availability and airline terms. Prices may change until payment is confirmed. SkyWay acts as an intermediary between you and the airline.' },
      { heading: 'User Responsibilities', list: ['Provide accurate personal and travel information', 'Ensure valid travel documents (passport, visa)', 'Comply with airline check-in and boarding policies', 'Not use the platform for fraudulent purposes'] },
      { heading: 'Limitation of Liability', content: 'SkyWay is not liable for flight delays, cancellations by airlines, visa issues, or force majeure events. Maximum liability is limited to the booking amount paid.' },
    ],
  },
  'manage-booking': {
    title: 'Manage Booking',
    isManageBooking: true,
  },
  'cookie-policy': {
    title: 'Cookie Policy',
    sections: [
      { heading: 'What Are Cookies?', content: 'Cookies are small text files stored on your device when you visit our website. They help us remember your preferences and improve your experience.' },
      { heading: 'Cookies We Use', list: ['Essential cookies: Required for site functionality', 'Analytics cookies: Help us understand usage patterns', 'Preference cookies: Remember your settings', 'Marketing cookies: Used to show relevant offers'] },
      { heading: 'Managing Cookies', content: 'You can control cookies through your browser settings. Disabling essential cookies may affect site functionality.' },
    ],
  },
  accessibility: {
    title: 'Accessibility',
    sections: [
      { heading: 'Our Commitment', content: 'SkyWay is committed to ensuring our website is accessible to all users, including those with disabilities. We follow WCAG 2.1 Level AA guidelines.' },
      { heading: 'Features', list: ['Keyboard navigation support', 'Screen reader compatibility', 'High contrast color schemes', 'Resizable text without loss of functionality', 'Alt text for all images', 'Proper heading hierarchy'] },
      { heading: 'Feedback', content: 'If you encounter any accessibility barriers, please contact us at accessibility@skyway.in and we\'ll address the issue promptly.' },
    ],
  },
}

export default function InfoPage({ page }) {
  const data = pages[page]
  const [openFaq, setOpenFaq] = useState(null)
  const [ticketLookup, setTicketLookup] = useState('')
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [contactSent, setContactSent] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [page])

  if (!data) return <div className="container-main py-20 text-center"><h1>Page not found</h1></div>

  const handleContactSubmit = (e) => {
    e.preventDefault()
    if (!contactForm.name || !contactForm.email || !contactForm.message) { alert('Please fill all required fields'); return }
    setContactSent(true)
  }

  const handleTicketLookup = () => {
    const trips = JSON.parse(localStorage.getItem('skyway_trips') || '[]')
    const found = trips.find(t => (t.ticketId || t.bookingId)?.toLowerCase() === ticketLookup.toLowerCase())
    if (found) {
      alert(`Booking Found!\n\nID: ${found.ticketId || found.bookingId}\nType: ${found.type === 'flight' ? 'Flight' : 'Hotel'}\nBooked: ${new Date(found.bookedAt).toLocaleDateString()}\nTotal: ₹${(found.pricing?.total || found.totalPrice || 0).toLocaleString('en-IN')}`)
    } else {
      alert('No booking found with this ID. Please check and try again.')
    }
  }

  return (
    <>
      <Navbar />
      <section className="relative z-10" style={{ padding: '4rem 0 4rem' }}>
        <div className="container-main" style={{ maxWidth: 800 }}>
          <h1 className="font-syne text-[clamp(2rem,5vw,3.2rem)] font-extrabold mb-10 text-accent leading-tight">
            {data.title}
          </h1>

          {/* Standard sections */}
          {data.sections?.map((sec, i) => (
            <div key={i} className="mb-12">
              <h2 className="font-syne text-2xl font-bold mb-4 text-accent">{sec.heading}</h2>
              {sec.content && <p className="text-text-muted leading-relaxed text-lg">{sec.content}</p>}
              {sec.list && (
                <ul className="list-none flex flex-col gap-3.5 mt-4">
                  {sec.list.map((item, j) => (
                    <li key={j} className="text-text-muted flex items-start gap-3">
                      <span className="text-accent text-sm mt-1">✦</span>
                      <span className="text-base">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {/* Contact page */}
          {data.isContact && (
            <>
              <div className="grid grid-cols-2 gap-5 mb-16" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                {data.info.map((info, i) => (
                  <div key={i} className="flight-card flex flex-col items-center text-center p-8">
                    <div className="text-4xl mb-4">{info.icon}</div>
                    <div className="font-syne font-bold text-lg mb-1.5 text-accent">{info.label}</div>
                    <div className="text-base font-medium mb-1">{info.value}</div>
                    <div className="text-xs text-text-muted mt-1">{info.desc}</div>
                  </div>
                ))}
              </div>
              {!contactSent ? (
                <div className="glass-card">
                  <h2 className="font-syne text-xl font-bold mb-6">Send Us a Message</h2>
                  <form onSubmit={handleContactSubmit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3"><input type="text" placeholder="Your Name *" value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })} className="sky-input" /><input type="email" placeholder="Email *" value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })} className="sky-input" /></div>
                    <input type="text" placeholder="Subject" value={contactForm.subject} onChange={e => setContactForm({ ...contactForm, subject: e.target.value })} className="sky-input" />
                    <textarea placeholder="Your message *" rows={5} value={contactForm.message} onChange={e => setContactForm({ ...contactForm, message: e.target.value })} className="sky-input" style={{ resize: 'vertical' }}></textarea>
                    <button type="submit" className="confirm-btn" style={{ marginTop: '1rem' }}>Send Message →</button>
                  </form>
                </div>
              ) : (
                <div className="glass-card text-center py-8">
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className="font-syne text-xl font-bold mb-2">Message Sent!</h3>
                  <p className="text-text-muted">We'll get back to you within 2 hours. Check your email for updates.</p>
                  <button className="confirm-btn" onClick={() => { setContactSent(false); setContactForm({ name: '', email: '', subject: '', message: '' }) }}>Send Another</button>
                </div>
              )}
            </>
          )}

          {/* Careers */}
          {data.jobs && (
            <>
              <p className="text-text-muted leading-relaxed mb-10 text-lg">{data.intro}</p>
              <h2 className="font-syne text-xl font-bold mb-6 text-accent">Open Positions</h2>
              <div className="flex flex-col gap-4">
                {data.jobs.map((job, i) => (
                  <div key={i} className="flight-card flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 text-text-muted border border-black/10 dark:border-white/10">ID: {job.id}</span>
                        <span className="text-xs text-text-muted">Posted: {job.postedDate}</span>
                      </div>
                      <div className="font-syne font-bold text-lg mb-1">{job.title}</div>
                      <div className="text-sm text-text-muted flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <span>🏢 {job.dept}</span>
                        <span>📍 {job.location}</span>
                        <span>💼 {job.exp}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <span className="text-xs px-2 py-1 rounded badge-direct">{job.type}</span>
                      <Link to={`/job-apply/${job.id}`} className="btn-accent text-sm px-5 py-2 no-underline rounded-lg font-medium inline-block text-center shadow-lg transition-transform hover:-translate-y-0.5" style={{ background: 'var(--color-accent)', color: '#0a1628' }}>Apply →</Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* FAQ */}
          {data.faqs && (
            <div className="flex flex-col gap-4">
              {data.faqs.map((faq, i) => (
                <div key={i} className="flight-card" style={{ cursor: 'pointer' }} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <div className="flex items-center justify-between">
                    <div className="font-syne font-bold text-accent text-lg">{faq.q}</div>
                    <span className="text-accent text-2xl shrink-0 ml-4">{openFaq === i ? '−' : '+'}</span>
                  </div>
                  {openFaq === i && <p className="text-text-muted mt-4 leading-relaxed text-base">{faq.a}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Manage Booking */}
          {data.isManageBooking && (
            <div className="glass-card" style={{ maxWidth: 500 }}>
              <h2 className="font-syne text-xl font-bold mb-2">Look Up Your Booking</h2>
              <p className="text-text-muted text-sm mb-4">Enter your ticket or booking ID to view details</p>
              <div className="flex gap-3">
                <input type="text" placeholder="e.g. SKY8F2KL or HTLAB1234" value={ticketLookup} onChange={e => setTicketLookup(e.target.value)} className="sky-input" style={{ flex: 1 }} />
                <button className="btn-accent px-6" onClick={handleTicketLookup}>Look Up</button>
              </div>
              <div className="mt-6 pt-4 border-t border-divider-color">
                <p className="text-sm text-text-muted">Can't find your booking? <Link to="/contact" className="text-accent no-underline">Contact Support</Link></p>
              </div>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  )
}
