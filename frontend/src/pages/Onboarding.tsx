import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api-client'
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
  { number: 1, title: 'Athlete Profile', description: 'Your info' },
  { number: 2, title: 'Race Goal', description: 'Target race' },
  { number: 3, title: 'Generate Plan', description: 'AI training' }
]

export function Onboarding() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1)
  const [profileData, setProfileData] = useState<ProfileFormValues | null>(null)
  const [raceData, setRaceData] = useState<RaceFormValues | null>(null)
  const [raceId, setRaceId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

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
        cycleRegularity: CycleRegularity[data.cycleRegularity],
        cycleLength: data.cycleLength,
        lastPeriodStart: data.lastPeriodStart?.toISOString(),
        lastPeriodEnd: data.lastPeriodEnd?.toISOString(),
        // Format PR times to TimeSpan format (HH:MM:SS with leading zeros)
        fiveKPR: formatTimeSpan(data.fiveKPR),
        tenKPR: formatTimeSpan(data.tenKPR),
        halfMarathonPR: formatTimeSpan(data.halfMarathonPR),
        marathonPR: formatTimeSpan(data.marathonPR)
      }

      await api.post<CreateProfileRequest, ProfileResponse>('/api/profiles/me', request)

      // Success - move to next step
      setCurrentStep(2)
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status?: number; data?: { message?: string } } }

        if (axiosError.response?.status === 409) {
          // Profile already exists - skip to dashboard
          setError('You already have a profile. Redirecting to dashboard...')
          setTimeout(() => navigate('/dashboard'), 2000)
        } else {
          setError(axiosError.response?.data?.message || 'Failed to create profile. Please try again.')
        }
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
        <CardHeader>
          <CardTitle className="text-3xl">Welcome to HerPace</CardTitle>
          <CardDescription>
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
