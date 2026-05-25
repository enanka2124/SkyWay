import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import Home from './pages/Home'
import Hotels from './pages/Hotels'
import MyTrips from './pages/MyTrips'
import Deals from './pages/Deals'
import InfoPage from './pages/InfoPage'
import SignIn from './pages/SignIn'
import Register from './pages/Register'
import Checkout from './pages/Checkout'
import JobApply from './pages/JobApply'
import ResetPassword from './pages/ResetPassword'
import AccountDetails from './pages/AccountDetails'
import TripDetails from './pages/TripDetails'
import SkyBackground from './components/SkyBackground'
import { Toaster } from 'react-hot-toast'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="stars"></div>
        <SkyBackground />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 5000,
            style: {
              background: '#0d1f3c',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              fontFamily: 'DM Sans, sans-serif'
            },
            success: {
              iconTheme: { primary: '#22d07a', secondary: '#fff' },
            }
          }}
        />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/my-trips" element={<MyTrips />} />
          <Route path="/my-trips/:ticketId" element={<TripDetails />} />
          <Route path="/account-details" element={<AccountDetails />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/register" element={<Register />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/about" element={<InfoPage page="about" />} />
          <Route path="/contact" element={<InfoPage page="contact" />} />
          <Route path="/careers" element={<InfoPage page="careers" />} />
          <Route path="/help" element={<InfoPage page="help" />} />
          <Route path="/refunds" element={<InfoPage page="refunds" />} />
          <Route path="/privacy" element={<InfoPage page="privacy" />} />
          <Route path="/terms" element={<InfoPage page="terms" />} />
          <Route path="/manage-booking" element={<InfoPage page="manage-booking" />} />
          <Route path="/cookie-policy" element={<InfoPage page="cookie-policy" />} />
          <Route path="/accessibility" element={<InfoPage page="accessibility" />} />
          <Route path="/job-apply/:jobId" element={<JobApply />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
