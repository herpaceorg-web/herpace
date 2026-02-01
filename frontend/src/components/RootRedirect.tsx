import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useOnboardingCheck } from '@/hooks/useOnboardingCheck'

/**
 * Root redirect component that sends users to the appropriate landing page
 * - Unauthenticated users → /login
 * - Authenticated users without profile → /onboarding
 * - Authenticated users with profile → /dashboard
 */
export function RootRedirect() {
  const { isAuthenticated } = useAuth()
  const { needsOnboarding, isLoading } = useOnboardingCheck()

  // Show loading while checking onboarding status (only if authenticated)
  if (isAuthenticated && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Not authenticated → login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Authenticated but needs onboarding → onboarding
  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />
  }

  // Authenticated with profile → dashboard
  return <Navigate to="/dashboard" replace />
}
