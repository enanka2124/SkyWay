import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load user from sessionStorage on mount and verify with server
  useEffect(() => {
    const checkAuth = async () => {
      const stored = sessionStorage.getItem('skyway_user')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setUser(parsed)

          // Verify with server if user still exists (e.g. if DB was cleared)
          const res = await fetch('/api/auth/me', {
            headers: { 'x-user-id': parsed._id }
          })
          const data = await res.json()
          
          if (!data.success) {
            setUser(null)
            sessionStorage.removeItem('skyway_user')
          } else {
            // Keep state in sync with server data
            setUser(data.user)
            sessionStorage.setItem('skyway_user', JSON.stringify(data.user))
          }
        } catch (err) {
          sessionStorage.removeItem('skyway_user')
          setUser(null)
        }
      }
      setLoading(false)
    }
    
    checkAuth()
  }, [])

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (data.success) {
      setUser(data.user)
      sessionStorage.setItem('skyway_user', JSON.stringify(data.user))
      return { success: true }
    }
    return { success: false, error: data.error}
  }

  const register = async (formData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      body: formData, // FormData for multipart (PDF upload)
    })
    const data = await res.json()
    if (data.success) {
      setUser(data.user)
      sessionStorage.setItem('skyway_user', JSON.stringify(data.user))
    }
    return data;
  }

  const logout = () => {
    setUser(null)
    sessionStorage.removeItem('skyway_user')
  }

  // Automatically log out user after 15 minutes of inactivity
  useEffect(() => {
    if (!user) return

    let timeoutId

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        console.log('User inactive for 15 minutes. Logging out...')
        logout()
      }, 15 * 60 * 1000)
    }

    // Initialize timer
    resetTimer()

    // Activity event listeners
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    const handleActivity = () => resetTimer()

    events.forEach(event => {
      window.addEventListener(event, handleActivity)
    })

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      events.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [user])

  const forgotPassword = async (email) => {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    return res.json()
  }

  const forgotEmail = async (phone) => {
    const res = await fetch('/api/auth/forgot-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    })
    return res.json()
  }

  const resetPassword = async (token, password) => {
    const res = await fetch(`/api/auth/reset-password/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    return res.json()
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, forgotPassword, forgotEmail, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
