import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'
import type { PlanSummaryDto, SessionDetailDto } from '@/types/api'
import { SessionCard } from '@/components/session/SessionCard'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export function Dashboard() {
  const [planSummary, setPlanSummary] = useState<PlanSummaryDto | null>(null)
  const [upcomingSessions, setUpcomingSessions] = useState<SessionDetailDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Load plan summary and upcoming sessions in parallel
      const [summary, sessions] = await Promise.all([
        api.get<PlanSummaryDto>('/api/sessions/plan-summary'),
        api.get<SessionDetailDto[]>('/api/sessions/upcoming?count=7')
      ])

      setPlanSummary(summary)
      setUpcomingSessions(sessions)

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
      <Alert variant="destructive">
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

      {/* Today's workout */}
      {planSummary.todaysSession && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Today's Workout</h2>
          <SessionCard session={planSummary.todaysSession} />
        </div>
      )}

      {/* Upcoming sessions */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Upcoming Sessions</h2>

        {upcomingSessions.length > 0 ? (
          <div className="space-y-4">
            {upcomingSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
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
    </div>
  )
}
