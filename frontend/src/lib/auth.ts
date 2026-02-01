/**
 * Authentication helper functions for managing JWT tokens in localStorage
 */

const TOKEN_KEY = 'authToken'

export const auth = {
  /**
   * Store JWT token in localStorage
   */
  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token)
  },

  /**
   * Retrieve JWT token from localStorage
   */
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY)
  },

  /**
   * Remove JWT token from localStorage
   */
  clearToken: (): void => {
    localStorage.removeItem(TOKEN_KEY)
  },

  /**
   * Check if user is authenticated (has a token)
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(TOKEN_KEY)
  }
}
