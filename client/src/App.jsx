import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Home from './pages/Home'
import Hotels from './pages/Hotels'
import MyTrips from './pages/MyTrips'
import Deals from './pages/Deals'
import InfoPage from './pages/InfoPage'
import SignIn from './pages/SignIn'
import Register from './pages/Register'
import Checkout from './pages/Checkout'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="stars"></div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/my-trips" element={<MyTrips />} />
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
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
