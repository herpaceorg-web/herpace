import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { auth } from '@/lib/auth'

interface AuthContextType {
  isAuthenticated: boolean
  token: string | null
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = auth.getToken()
    if (savedToken) {
      setToken(savedToken)
      setIsAuthenticated(true)
    }
  }, [])

  const login = (newToken: string) => {
    auth.setToken(newToken)
    setToken(newToken)
    setIsAuthenticated(true)
  }

  const logout = () => {
    auth.clearToken()
    setToken(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
