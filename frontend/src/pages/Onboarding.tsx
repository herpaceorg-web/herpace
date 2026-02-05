import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { Stepper } from '@/components/onboarding/Stepper'
import { ProfileStep } from '@/components/onboarding/ProfileStep'
import { RaceStep } from '@/components/onboarding/RaceStep'
import { GeneratingPlanStep } from '@/components/onboarding/GeneratingPlanStep'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  FitnessLevel,
  DistanceUnit,
  CycleRegularity,
  DistanceType,
  type CreateProfileRequest,
  type CreateRaceRequest,
  type GeneratePlanRequest,
  type ProfileResponse,
  type RaceResponse
} from '@/types/api'
import type { ProfileFormValues, RaceFormValues } from '@/schemas/onboarding'
import type { OnboardingStep } from '@/types/onboarding'

const STEPS = [
  { number: 1, title: 'Runner Profile', description: 'About you' },
  { number: 2, title: 'Your Cycle', description: 'Sync with training' },
  { number: 3, title: 'Training Plan', description: 'Customize for you' }
]

export function Onboarding() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1)
  const [profileData, setProfileData] = useState<ProfileFormValues | null>(null)
  const [raceData, setRaceData] = useState<RaceFormValues | null>(null)
  const [raceId, setRaceId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('')
  const [nameDisplayState, setNameDisplayState] = useState<'default' | 'fading-out' | 'showing-name'>('default')
  const [profileExists, setProfileExists] = useState(false)
  const navigate = useNavigate()

  // Handle name transition animation
  useEffect(() => {
    if (userName && nameDisplayState === 'default') {
      // Start fade-out of "Runner"
      setNameDisplayState('fading-out')
      // After fade-out completes, show the actual name
      setTimeout(() => {
        setNameDisplayState('showing-name')
      }, 200)
    }
  }, [userName, nameDisplayState])

  // Check if profile exists on mount
  useEffect(() => {
    const checkExistingProfile = async () => {
      try {
        const response = await api.get<ProfileResponse>('/api/profiles/me')
        if (response) {
          setProfileExists(true)
          // Optionally pre-populate form with existing data
        }
      } catch (err) {
        // 404 means no profile exists - expected for new users
        setProfileExists(false)
      }
    }

    checkExistingProfile()
  }, [])

  // Helper function to format time strings to TimeSpan format (HH:MM:SS)
  const formatTimeSpan = (time: string | undefined): string | undefined => {
    if (!time?.trim()) return undefined

    const trimmed = time.trim()
    const parts = trimmed.split(':')

    // Ensure HH:MM:SS format with leading zeros
    if (parts.length === 3) {
      const hours = parts[0].padStart(2, '0')
      const minutes = parts[1].padStart(2, '0')
      const seconds = parts[2].padStart(2, '0')
      return `${hours}:${minutes}:${seconds}`
    }

    return trimmed
  }

  // Handle profile form submission
  const handleProfileComplete = async (data: ProfileFormValues) => {
    setError(null)
    setProfileData(data)

    try {
      // Convert form data to API format
      const request: CreateProfileRequest = {
        name: data.name,
        fitnessLevel: FitnessLevel[data.fitnessLevel],
        distanceUnit: DistanceUnit[data.distanceUnit],
        dateOfBirth: data.dateOfBirth?.toISOString(),
        typicalWeeklyMileage: data.typicalWeeklyMileage,
        // Default cycle values - will be updated in next onboarding step
        cycleRegularity: data.cycleRegularity ? CycleRegularity[data.cycleRegularity] : CycleRegularity.Regular,
        cycleLength: data.cycleLength || 28,
        lastPeriodStart: data.lastPeriodStart?.toISOString(),
        lastPeriodEnd: data.lastPeriodEnd?.toISOString(),
        // Format PR times to TimeSpan format (HH:MM:SS with leading zeros)
        fiveKPR: formatTimeSpan(data.fiveKPR),
        tenKPR: formatTimeSpan(data.tenKPR),
        halfMarathonPR: formatTimeSpan(data.halfMarathonPR),
        marathonPR: formatTimeSpan(data.marathonPR)
      }

      // Use PUT if profile exists, POST if creating new
      if (profileExists) {
        await api.put<CreateProfileRequest, ProfileResponse>('/api/profiles/me', request)
      } else {
        await api.post<CreateProfileRequest, ProfileResponse>('/api/profiles/me', request)
        // After successful creation, update state so subsequent submissions use PUT
        setProfileExists(true)
      }

      // Success - move to next step
      setCurrentStep(2)
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as {
          response?: { status?: number; data?: { message?: string } }
        }

        // Handle edge case: profile created between mount check and submission
        if (axiosError.response?.status === 400 &&
            axiosError.response?.data?.message?.includes('Profile already exists')) {
          // Retry with PUT
          setProfileExists(true)
          handleProfileComplete(data)
          return
        }

        setError(
          axiosError.response?.data?.message ||
          'Failed to save profile. Please try again.'
        )
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    }
  }

  // Handle race form submission
  const handleRaceComplete = async (data: RaceFormValues) => {
    setError(null)
    setRaceData(data)

    try {
      // Convert form data to API format
      const request: CreateRaceRequest = {
        raceName: data.raceName,
        raceDate: data.raceDate.toISOString(),
        trainingStartDate: data.trainingStartDate.toISOString(),
        distance: Number(data.distance),
        distanceType: DistanceType[data.distanceType],
        location: data.location,
        goalTime: data.goalTime,
        raceCompletionGoal: data.raceCompletionGoal,
        isPublic: false
      }

      const response = await api.post<CreateRaceRequest, RaceResponse>('/api/races', request)

      // Store race ID and move to plan generation step
      setRaceId(response.id)
      setCurrentStep(3)

      // Automatically trigger plan generation
      await generatePlan(response.id)
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } }
        setError(axiosError.response?.data?.message || 'Failed to create race. Please try again.')
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    }
  }

  // Generate training plan
  const generatePlan = async (raceIdParam: string) => {
    setError(null)

    try {
      const request: GeneratePlanRequest = {
        raceId: raceIdParam
      }

      // Note: api-client already has 5-minute timeout configured
      await api.post<GeneratePlanRequest, any>('/api/plans', request)

      // Success - redirect to dashboard
      navigate('/dashboard')
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status?: number; data?: { message?: string } } }

        if (axiosError.response?.status === 409) {
          // Plan already exists - skip to dashboard
          navigate('/dashboard')
        } else {
          setError(axiosError.response?.data?.message || 'Failed to generate training plan. Please try again.')
        }
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    }
  }

  // Handle back navigation
  const handleBack = () => {
    setError(null)
    setCurrentStep(1)
  }

  // Retry plan generation
  const handleRetry = () => {
    if (raceId) {
      generatePlan(raceId)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="font-petrona text-[32px] font-normal text-foreground">
            Hello,{' '}
            {nameDisplayState === 'default' && (
              <span className="inline-block">Runner</span>
            )}
            {nameDisplayState === 'fading-out' && (
              <span className="inline-block animate-fade-out">Runner</span>
            )}
            {nameDisplayState === 'showing-name' && (
              <span className="inline-block animate-scale-in">{userName}</span>
            )}
          </CardTitle>
          <CardDescription className="text-sm font-normal text-[#696863]">
            Let's set up your personalized training plan in just a few steps
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Stepper */}
          <Stepper currentStep={currentStep} steps={STEPS} />

          {/* Error Alert */}
          {error && currentStep !== 3 && (
            <Alert variant="error" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step Content */}
          <div className="mt-6">
            {currentStep === 1 && (
              <ProfileStep
                onComplete={handleProfileComplete}
                onNameChange={setUserName}
                defaultValues={profileData || undefined}
              />
            )}

            {currentStep === 2 && (
              <RaceStep
                onComplete={handleRaceComplete}
                onBack={handleBack}
                defaultValues={raceData || undefined}
              />
            )}

            {currentStep === 3 && (
              <div>
                {error ? (
                  <div className="space-y-4">
                    <Alert variant="error">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <button
                      onClick={handleRetry}
                      className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <GeneratingPlanStep />
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
