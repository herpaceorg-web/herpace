import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Root redirect component that sends users to the appropriate landing page
 * - Authenticated users → /dashboard
 * - Unauthenticated users → /login
 */
export function RootRedirect() {
  const { isAuthenticated } = useAuth()

  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
}
