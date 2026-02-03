import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api-client'
import type { PlanSummaryDto, SessionDetailDto, UpcomingSessionsResponse } from '@/types/api'
import { WorkoutSessionCard } from '@/components/session/WorkoutSessionCard'
import { LogWorkoutModal } from '@/components/session/LogWorkoutModal'
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

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Poll for recalculation status when pending
  useEffect(() => {
    if (!planSummary?.hasPendingRecalculation) return

    const pollInterval = setInterval(() => {
      loadDashboardData()
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(pollInterval)
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
      const clientDate = new Date().toISOString().split('T')[0]

      // Load plan summary and upcoming sessions in parallel
      const [summary, sessionsResponse] = await Promise.all([
        api.get<PlanSummaryDto>(`/api/sessions/plan-summary?clientDate=${clientDate}`),
        api.get<UpcomingSessionsResponse>('/api/sessions/upcoming?count=7')
      ])

      setPlanSummary(summary)
      setUpcomingSessions(sessionsResponse.sessions)

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
      <Alert variant="error">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!planSummary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Welcome to HerPace</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You don't have an active training plan yet. Create a race goal to get started!
          </p>
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

      {/* Today's workout or pre-training message */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Today's Workout</h2>
        {planSummary.todaysSession ? (
          <WorkoutSessionCard
            session={planSummary.todaysSession}
            cyclePhaseTips={planSummary.cyclePhaseTips}
            onSessionUpdated={loadDashboardData}
          />
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
                      {planSummary.cyclePhaseTips.nutritionTips.length > 0 && (
                        <div>
                          <strong>Nutrition:</strong>
                          <ul className="list-disc ml-5">
                            {planSummary.cyclePhaseTips.nutritionTips.map((tip, i) => (
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
          <h2 className="text-2xl font-semibold">Upcoming Sessions</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/calendar')}>
              View Full Calendar
            </Button>
            <Button variant="outline" onClick={() => navigate('/history')}>
              View Training History
            </Button>
          </div>
        </div>

        {upcomingSessions.length > 0 ? (
          <div className="space-y-4">
            {upcomingSessions.map((session) => (
              <WorkoutSessionCard key={session.id} session={session} onSessionUpdated={loadDashboardData} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">
                No upcoming sessions found.
              </p>
            </CardContent>
          </Card>
        )}
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
      />
    </div>
  )
}
