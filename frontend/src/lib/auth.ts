/**
 * Authentication helper functions for managing JWT tokens in localStorage
 */

const TOKEN_KEY = 'authToken'
const TOKEN_EXPIRY_KEY = 'authTokenExpiry'

export const auth = {
  /**
   * Store JWT token and its expiration time in localStorage
   */
  setToken: (token: string, expiresAt?: string): void => {
    localStorage.setItem(TOKEN_KEY, token)
    if (expiresAt) {
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt)
    }
  },

  /**
   * Retrieve JWT token from localStorage (only if not expired)
   */
  getToken: (): string | null => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      return null
    }

    // Check if token is expired
    if (auth.isTokenExpired()) {
      auth.clearToken()
      return null
    }

    return token
  },

  /**
   * Get token expiration date
   */
  getTokenExpiry: (): Date | null => {
    const expiresAt = localStorage.getItem(TOKEN_EXPIRY_KEY)
    return expiresAt ? new Date(expiresAt) : null
  },

  /**
   * Check if the stored token is expired
   */
  isTokenExpired: (): boolean => {
    const expiresAt = localStorage.getItem(TOKEN_EXPIRY_KEY)
    if (!expiresAt) {
      // If no expiry is stored, assume token is valid
      // (for backwards compatibility or non-expiring tokens)
      return false
    }

    const expiryDate = new Date(expiresAt)
    const now = new Date()
    return now >= expiryDate
  },

  /**
   * Remove JWT token and expiration from localStorage
   */
  clearToken: (): void => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
  },

  /**
   * Check if user is authenticated (has a valid, non-expired token)
   */
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      return false
    }

    // Check if token is expired
    if (auth.isTokenExpired()) {
      auth.clearToken()
      return false
    }

    return true
  }
}
