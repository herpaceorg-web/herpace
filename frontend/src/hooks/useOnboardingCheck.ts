import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'
import type { ProfileResponse } from '@/types/api'

interface OnboardingCheckResult {
  needsOnboarding: boolean
  isLoading: boolean
  profile: ProfileResponse | null
}

export function useOnboardingCheck(): OnboardingCheckResult {
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<ProfileResponse | null>(null)

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const response = await api.get<ProfileResponse>('/api/profiles/me')
        setProfile(response)
        setNeedsOnboarding(false)
      } catch (error: unknown) {
        // 404 means no profile exists, user needs onboarding
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { status?: number } }
          if (axiosError.response?.status === 404) {
            setNeedsOnboarding(true)
            setProfile(null)
          } else {
            // Other errors (network, 500, etc.) - assume no onboarding needed to avoid redirect loop
            setNeedsOnboarding(false)
          }
        } else {
          setNeedsOnboarding(false)
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkProfile()
  }, [])

  return { needsOnboarding, isLoading, profile }
}
