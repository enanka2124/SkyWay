import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import toast from 'react-hot-toast'

export default function AccountDetails() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  if (!user) {
    // If somehow accessed without being logged in, render nothing while redirect handles it
    setTimeout(() => navigate('/signin'), 0)
    return null
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: { 'x-user-id': user._id }
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'Account deleted successfully.')
        logout()
        navigate('/')
      } else {
        toast.error(data.error || 'Failed to delete account')
      }
    } catch (err) {
      toast.error('Server error')
    }
    setLoading(false)
  }

  return (
    <>
      <Navbar />
      <div className="container-main py-12 min-h-[70vh] flex justify-center">
        <div className="w-full max-w-2xl">
          <h1 className="font-syne text-3xl font-bold mb-6 text-white">Account Details</h1>
          
          <div className="flex flex-col gap-8">
            <div className="glass-card p-8 rounded-2xl">
            <div className="flex items-center gap-6 mb-8 pb-8" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold"
                style={{ background: 'linear-gradient(135deg, #f5a623, #e8940f)', color: '#060e1e', flexShrink: 0 }}
              >
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white m-0">{user.firstName} {user.lastName}</h2>
                <p className="text-text-muted mt-1">{user.email}</p>
                <div className="mt-3 inline-block px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(34,208,122,0.1)', color: '#22d07a', border: '1px solid rgba(34,208,122,0.2)' }}>
                  Active Member
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-text-muted mb-2 font-bold">First Name</label>
                <div className="text-white font-medium bg-black/20 p-3.5 rounded-xl border border-white/10">{user.firstName}</div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-text-muted mb-2 font-bold">Last Name</label>
                <div className="text-white font-medium bg-black/20 p-3.5 rounded-xl border border-white/10">{user.lastName}</div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-text-muted mb-2 font-bold">Email Address</label>
                <div className="text-white font-medium bg-black/20 p-3.5 rounded-xl border border-white/10">{user.email}</div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-text-muted mb-2 font-bold">Phone Number</label>
                <div className="text-white font-medium bg-black/20 p-3.5 rounded-xl border border-white/10">{user.phone}</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-red-500/20 bg-red-500/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor" className="text-red-500">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/>
              </svg>
            </div>
            
            <h3 className="text-xl font-bold text-red-400 mb-2 relative z-10">Account Management</h3>
            <p className="text-sm text-text-muted mb-6 max-w-md relative z-10">
              Deleting your account will remove your access and clear active sessions. You can re-register with the same email after a 7-day cooldown period.
            </p>
            
            {!showConfirm ? (
              <button 
                onClick={() => setShowConfirm(true)}
                className="relative z-10 px-6 py-3 rounded-xl font-bold text-sm bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
              >
                Delete Account
              </button>
            ) : (
              <div className="relative z-10 flex flex-wrap items-center gap-4 bg-red-500/10 p-4 rounded-xl border border-red-500/30">
                <span className="text-sm text-red-200 font-medium">Are you absolutely sure?</span>
                <button 
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-lg font-bold text-sm bg-red-500 text-white border-none cursor-pointer hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button 
                  onClick={() => setShowConfirm(false)}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-lg font-bold text-sm bg-transparent text-white border border-white/20 cursor-pointer hover:bg-white/10 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
