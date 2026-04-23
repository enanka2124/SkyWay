import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('skyway_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { /* corrupt data */ }
    }
    setLoading(false)
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
      localStorage.setItem('skyway_user', JSON.stringify(data.user))
      return { success: true }
    }
    return { success: false, error: data.error }
  }

  const register = async (formData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      body: formData, // FormData for multipart (PDF upload)
    })
    const data = await res.json()
    if (data.success) {
      setUser(data.user)
      localStorage.setItem('skyway_user', JSON.stringify(data.user))
      return { success: true }
    }
    return { success: false, error: data.error }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('skyway_user')
  }

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

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, forgotPassword, forgotEmail }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
