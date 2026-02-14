import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useToast } from '@/contexts/ToastContext'

/**
 * Handles OAuth redirect callbacks for fitness tracker connections.
 * Reads query params (?connected=strava or ?error=denied&platform=strava)
 * and shows appropriate toast before redirecting to Connected Services.
 */
export function OAuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')
    const platform = searchParams.get('platform')

    if (connected) {
      toast.success(
        `${connected.charAt(0).toUpperCase() + connected.slice(1)} connected`,
        'Your account has been linked and activities are being imported.'
      )
    } else if (error) {
      const platformName = platform
        ? platform.charAt(0).toUpperCase() + platform.slice(1)
        : 'Service'

      if (error === 'denied') {
        toast.warning(
          `${platformName} connection cancelled`,
          'You denied access. You can try connecting again anytime.'
        )
      } else {
        toast.error(
          `${platformName} connection failed`,
          'Something went wrong during authentication. Please try again.'
        )
      }
    }

    // Clear the query params so refreshing doesn't re-trigger the toast
    navigate('/connected-services', { replace: true })
  }, [searchParams, navigate, toast])

  return null
}
