import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { auth } from '@/lib/auth'

interface AuthContextType {
  isAuthenticated: boolean
  token: string | null
  login: (token: string, expiresAt?: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize state from localStorage synchronously to prevent flash redirects
  const [token, setToken] = useState<string | null>(() => auth.getToken())
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!auth.getToken())

  const login = (newToken: string, expiresAt?: string) => {
    auth.setToken(newToken, expiresAt)
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
