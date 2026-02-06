import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api-client'
import type { PlanSummaryDto, SessionDetailDto, UpcomingSessionsResponse, ProfileResponse, CyclePositionDto } from '@/types/api'
import { WorkoutSessionCard } from '@/components/session/WorkoutSessionCard'
import { SessionChangeCard } from '@/components/session/SessionChangeCard'
import { LogWorkoutModal } from '@/components/session/LogWorkoutModal'
import { HormoneCycleChart } from '@/components/HormoneCycleChart'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Loader2, Sparkles } from 'lucide-react'

export function Dashboard() {
  const navigate = useNavigate()
  const [planSummary, setPlanSummary] = useState<PlanSummaryDto | null>(null)
  const [upcomingSessions, setUpcomingSessions] = useState<SessionDetailDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [showLogWorkoutModal, setShowLogWorkoutModal] = useState(false)

  const [distanceUnit, setDistanceUnit] = useState<'km' | 'mi'>('mi')
  const [cyclePosition, setCyclePosition] = useState<CyclePositionDto | null>(null)
  const prevRecalculationState = useRef<boolean>(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Poll for recalculation status when pending (optimized - only fetches plan summary)
  useEffect(() => {
    if (!planSummary?.hasPendingRecalculation) {
      prevRecalculationState.current = false
      return
    }

    const pollInterval = setInterval(() => {
      pollPlanSummary()
    }, 8000) // Poll every 8 seconds (less aggressive than 5s)

    return () => clearInterval(pollInterval)
  }, [planSummary?.hasPendingRecalculation])

  // Detect when recalculation completes and refresh all data once
  useEffect(() => {
    const wasRecalculating = prevRecalculationState.current
    const isRecalculating = planSummary?.hasPendingRecalculation ?? false

    // If we were recalculating and now we're done, refresh everything
    if (wasRecalculating && !isRecalculating) {
      loadDashboardData()
    }

    prevRecalculationState.current = isRecalculating
  }, [planSummary?.hasPendingRecalculation])

  // Show summary modal when recalculation completes
  useEffect(() => {
    if (planSummary?.recalculationSummary && !showSummaryModal) {
      setShowSummaryModal(true)
    }
  }, [planSummary?.recalculationSummary])


  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get client's local date in ISO format (YYYY-MM-DD)
      // Note: Don't use toISOString() as it converts to UTC which may be a different day
      const now = new Date()
      const clientDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

      // Load plan summary, upcoming sessions, profile, and cycle position in parallel
      // Cycle position returns 404 for DoNotTrack users — catch and treat as null
      // Profile returns 404 if user hasn't completed onboarding — catch and treat as null
      const [summary, sessionsResponse, profile, cyclePos] = await Promise.all([
        api.get<PlanSummaryDto>(`/api/sessions/plan-summary?clientDate=${clientDate}`),
        api.get<UpcomingSessionsResponse>(`/api/sessions/upcoming?count=7&clientDate=${clientDate}`),
        api.get<ProfileResponse>('/api/profiles/me').catch(() => null),
        api.get<CyclePositionDto>(`/api/cycle/position?clientDate=${clientDate}`).catch(() => null)
      ])

      // Sanity-check: if the backend returned a todaysSession whose date doesn't
      // match the client's local date, discard it rather than showing stale data.
      if (summary.todaysSession) {
        const sessionDateStr = summary.todaysSession.scheduledDate.slice(0, 10)
        if (sessionDateStr !== clientDate) {
          console.warn(
            `plan-summary returned todaysSession dated ${sessionDateStr} but client date is ${clientDate} — discarding`
          )
          summary.todaysSession = undefined
        }
      }

      // Be defensive about response shape so one malformed payload
      // doesn't crash rendering with a white screen.
      const sessionsPayload = sessionsResponse as unknown as {
        sessions?: SessionDetailDto[]
        Sessions?: SessionDetailDto[]
      }
      const normalizedSessions = Array.isArray(sessionsPayload.sessions)
        ? sessionsPayload.sessions
        : Array.isArray(sessionsPayload.Sessions)
          ? sessionsPayload.Sessions
          : []

      if (!Array.isArray(sessionsPayload.sessions) && !Array.isArray(sessionsPayload.Sessions)) {
        console.warn('Unexpected /api/sessions/upcoming response shape', sessionsResponse)
      }

      setPlanSummary(summary)
      setUpcomingSessions(normalizedSessions)
      setDistanceUnit(profile?.distanceUnit === 1 ? 'mi' : 'km')
      setCyclePosition(cyclePos)

    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status?: number, data?: { message?: string } } }
        if (axiosError.response?.status === 404) {
          setError('No active training plan found. Please create a race goal to generate a plan.')
        } else {
          setError(axiosError.response?.data?.message || 'Failed to load dashboard data.')
        }
      } else {
        setError('An unexpected error occurred.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Lightweight polling function - only fetches plan summary to check recalculation status
  // This avoids the jarring "refresh" feeling by not re-fetching all data or showing loading state
  const pollPlanSummary = async () => {
    try {
      const now = new Date()
      const clientDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

      const summary = await api.get<PlanSummaryDto>(`/api/sessions/plan-summary?clientDate=${clientDate}`)

      // Sanity-check for today's session
      if (summary.todaysSession) {
        const sessionDateStr = summary.todaysSession.scheduledDate.slice(0, 10)
        if (sessionDateStr !== clientDate) {
          summary.todaysSession = undefined
        }
      }

      setPlanSummary(summary)
    } catch (err) {
      // Silently fail during polling - don't disrupt the user experience
      // The main loadDashboardData will handle errors on initial load
      console.error('Poll failed:', err)
    }
  }

  const handleDismissSummary = async () => {
    try {
      await api.post('/api/sessions/dismiss-summary', {})
      setShowSummaryModal(false)
      // Refresh to clear the summary from planSummary
      await loadDashboardData()
    } catch (err) {
      console.error('Failed to dismiss summary:', err)
      // Still close the modal even if API call fails
      setShowSummaryModal(false)
    }
  }


  // Memoize handlers to prevent unnecessary re-renders
  const handlePeriodLogged = useCallback((updated: CyclePositionDto) => {
    setCyclePosition(updated)
  }, [])

  // Memoize upcoming sessions rendering to prevent re-renders during polling
  // (upcomingSessions array doesn't change during recalculation polling)
  const upcomingSessionsContent = useMemo(() => {
    const safeUpcomingSessions = Array.isArray(upcomingSessions) ? upcomingSessions : []

    if (safeUpcomingSessions.length === 0) {
      return (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              No upcoming sessions found.
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="w-full lg:w-2/3 mx-auto space-y-12">
        {safeUpcomingSessions.map((session) => (
          <WorkoutSessionCard
            key={session.id}
            session={session}
            onSessionUpdated={loadDashboardData}
            distanceUnit={distanceUnit}
            pendingConfirmation={planSummary?.pendingConfirmation}
          />
        ))}
      </div>
    )
  }, [upcomingSessions, distanceUnit, planSummary?.pendingConfirmation])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted animate-pulse rounded-lg"></div>
        <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
        <div className="h-96 bg-muted animate-pulse rounded-lg"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/onboarding')}>
          Create Training Plan
        </Button>
      </div>
    )
  }

  if (!planSummary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Welcome to HerPace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            You don't have an active training plan yet. Create a race goal to get started!
          </p>
          <Button onClick={() => navigate('/onboarding')}>
            Create Training Plan
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Race header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-2">{planSummary.raceName}</h1>
        <p className="text-lg opacity-90">
          {planSummary.daysUntilRace} days until race day
        </p>
      </div>

      {/* Recalculation status banner */}
      {planSummary.hasPendingRecalculation && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription className="ml-2">
            <div className="font-medium mb-1">Adapting Your Training Plan</div>
            <p className="text-sm text-muted-foreground">
              We've noticed your training has been a bit different than the plan. We're building you a personalized update to better match where you are right now. This usually takes just a minute or two.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Hormone Cycle Chart */}
      <div>
        <h2 className="text-[32px] font-normal text-foreground font-[family-name:'Petrona'] mb-4">Your Hormone Cycle</h2>
        <HormoneCycleChart
          cyclePosition={cyclePosition}
          onPeriodLogged={handlePeriodLogged}
        />
      </div>

      {/* Today's workout or pre-training message */}
      <div>
        <h2 className="text-[32px] font-normal text-foreground font-[family-name:'Petrona'] mb-4">Today's Session</h2>
        {planSummary.todaysSession ? (
          <div className="w-full lg:w-2/3 mx-auto">
            <WorkoutSessionCard
              session={planSummary.todaysSession}
              cyclePhaseTips={planSummary.cyclePhaseTips}
              onSessionUpdated={loadDashboardData}
              distanceUnit={distanceUnit}
              pendingConfirmation={planSummary.pendingConfirmation}
            />
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  No workout scheduled for today. Your training plan starts soon!
                </p>

                {planSummary.cyclePhaseTips && (
                  <div className="mt-4 pt-4 border-t">
                    <h3 className="font-semibold mb-2">Current Cycle Phase Tips</h3>
                    <div className="text-sm space-y-2">
                      <p><strong>Phase:</strong> {planSummary.cyclePhaseTips.phase}</p>
                      {(Array.isArray(planSummary.cyclePhaseTips.nutritionTips) ? planSummary.cyclePhaseTips.nutritionTips : []).length > 0 && (
                        <div>
                          <strong>Nutrition:</strong>
                          <ul className="list-disc ml-5">
                            {(Array.isArray(planSummary.cyclePhaseTips.nutritionTips) ? planSummary.cyclePhaseTips.nutritionTips : []).map((tip, i) => (
                              <li key={i}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  variant="default"
                  onClick={() => setShowLogWorkoutModal(true)}
                >
                  Log a Workout
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upcoming sessions */}
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
          <h2 className="text-[32px] font-normal text-foreground font-[family-name:'Petrona']">Upcoming Sessions</h2>
          {/* Buttons commented out - links available in navigation
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/calendar')}>
              View Full Calendar
            </Button>
            <Button variant="outline" onClick={() => navigate('/history')}>
              View Training History
            </Button>
          </div>
          */}
        </div>

        {upcomingSessionsContent}
      </div>

      {/* Recalculation summary modal */}
      <Dialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Your Training Plan Has Been Updated
            </DialogTitle>
            <DialogDescription>
              Based on your recent training, we've adapted your plan to better support your goals.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm whitespace-pre-line">
              {planSummary?.recalculationSummary}
            </p>

            {/* Before/After comparison */}
            {planSummary?.latestAdaptation?.sessionChanges && planSummary.latestAdaptation.sessionChanges.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <h4 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">What Changed</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {planSummary.latestAdaptation.sessionChanges
                    .filter(change => {
                      // Only show sessions that actually changed
                      return change.oldDistance !== change.newDistance ||
                             change.oldDuration !== change.newDuration ||
                             change.oldWorkoutType !== change.newWorkoutType ||
                             change.oldIntensityLevel !== change.newIntensityLevel
                    })
                    .map(change => (
                      <SessionChangeCard key={change.sessionId} change={change} />
                    ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleDismissSummary}>Got It</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Workout Modal */}
      <LogWorkoutModal
        open={showLogWorkoutModal}
        onOpenChange={setShowLogWorkoutModal}
        onWorkoutLogged={loadDashboardData}
        distanceUnit={distanceUnit}
      />


    </div>
  )
}
