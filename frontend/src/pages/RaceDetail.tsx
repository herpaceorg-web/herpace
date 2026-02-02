import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api-client'
import { CyclePhase, CycleRegularity, RaceCompletionStatus } from '@/types/api'
import type {
  RaceResponse,
  PlanDetailResponse,
  ProfileResponse,
  SessionSummary,
  LogRaceResultRequest
} from '@/types/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { MonthView } from '@/components/calendar/MonthView'
import { CyclePhaseLegend } from '@/components/calendar/CyclePhaseLegend'
import { RaceResultDialog } from '@/components/races/RaceResultDialog'
import { generateCyclePhasesForRange } from '@/utils/cyclePhases'

interface MonthInfo {
  key: string
  label: string
  year: number
  month: number
}

export default function RaceDetail() {
  const { raceId } = useParams<{ raceId: string }>()
  const navigate = useNavigate()

  const [race, setRace] = useState<RaceResponse | null>(null)
  const [plan, setPlan] = useState<PlanDetailResponse | null>(null)
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cyclePhases, setCyclePhases] = useState<Map<string, CyclePhase>>(new Map())
  const [sessionsByMonth, setSessionsByMonth] = useState<Map<string, SessionSummary[]>>(new Map())
  const [months, setMonths] = useState<MonthInfo[]>([])
  const [showResultDialog, setShowResultDialog] = useState(false)

  useEffect(() => {
    if (raceId) {
      loadRaceDetail()
    }
  }, [raceId])

  const loadRaceDetail = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [raceData, profileData] = await Promise.all([
        api.get<RaceResponse>(`/api/races/${raceId}`),
        api.get<ProfileResponse>('/api/profiles/me')
      ])

      setRace(raceData)
      setProfile(profileData)

      // Try to load training plan
      if (raceData.hasTrainingPlan) {
        try {
          const planData = await api.get<PlanDetailResponse>(`/api/plans/race/${raceId}`)
          setPlan(planData)

          // Calculate cycle phases if tracking
          if (
            profileData.typicalCycleRegularity !== CycleRegularity.DoNotTrack &&
            profileData.cycleLength &&
            profileData.lastPeriodStart
          ) {
            const startDate = new Date(planData.startDate)
            const endDate = new Date(planData.raceDate)
            const lastPeriodStart = new Date(profileData.lastPeriodStart)
            const cycleLength = profileData.cycleLength

            const phases = generateCyclePhasesForRange(
              startDate,
              endDate,
              lastPeriodStart,
              cycleLength
            )
            setCyclePhases(phases)
          }

          // Group sessions by month
          const sessionGroups = new Map<string, SessionSummary[]>()
          planData.sessions.forEach((session) => {
            const date = new Date(session.scheduledDate)
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

            if (!sessionGroups.has(monthKey)) {
              sessionGroups.set(monthKey, [])
            }
            sessionGroups.get(monthKey)!.push(session)
          })
          setSessionsByMonth(sessionGroups)

          // Generate month list
          const startDate = new Date(planData.startDate)
          const endDate = new Date(planData.raceDate)
          const monthsList: MonthInfo[] = []
          const monthDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
          const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1)

          while (monthDate <= endMonth) {
            const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`

            monthsList.push({
              key: monthKey,
              label: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
              year: monthDate.getFullYear(),
              month: monthDate.getMonth()
            })

            monthDate.setMonth(monthDate.getMonth() + 1)
          }
          setMonths(monthsList)
        } catch (planErr) {
          console.warn('No training plan found for race:', planErr)
        }
      }
    } catch (err: unknown) {
      console.error('Failed to load race detail:', err)
      setError('Failed to load race details. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogResult = async (status: RaceCompletionStatus, finishTime?: string) => {
    if (!raceId) return

    try {
      const request: LogRaceResultRequest = {
        completionStatus: status,
        finishTime
      }

      await api.put<LogRaceResultRequest, void>(`/api/races/${raceId}/result`, request)

      // Reload race data
      await loadRaceDetail()

      setShowResultDialog(false)
    } catch (err) {
      console.error('Failed to log race result:', err)
      setError('Failed to log race result. Please try again.')
    }
  }

  const canLogResult = race && new Date(race.raceDate).getTime() <= Date.now()
  const hasLoggedResult = race?.completionStatus !== RaceCompletionStatus.NotAttempted

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted animate-pulse rounded-lg"></div>
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

  if (!race) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Race not found.</AlertDescription>
      </Alert>
    )
  }

  const raceDate = new Date(race.raceDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  const hasCycleTracking =
    profile?.typicalCycleRegularity !== CycleRegularity.DoNotTrack &&
    cyclePhases.size > 0

  const getCompletionStatusBadge = () => {
    switch (race.completionStatus) {
      case RaceCompletionStatus.Completed:
        return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>
      case RaceCompletionStatus.DNS:
        return <Badge variant="secondary">DNS</Badge>
      case RaceCompletionStatus.DNF:
        return <Badge variant="secondary">DNF</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-8">
      {/* Race Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <Button
              variant="ghost"
              className="mb-2 text-primary-foreground hover:text-primary-foreground hover:bg-primary/20"
              onClick={() => navigate('/history')}
            >
              ← Back to Races
            </Button>
            <h1 className="text-3xl font-bold mb-2">{race.raceName}</h1>
            <p className="text-lg opacity-90">
              {race.location && `${race.location} • `}
              {raceDate}
              {race.goalTime && ` • Goal: ${race.goalTime}`}
            </p>
          </div>
          {getCompletionStatusBadge()}
        </div>
      </div>

      {/* Race Result Section */}
      {canLogResult && (
        <Card>
          <CardHeader>
            <CardTitle>Race Result</CardTitle>
            <CardDescription>
              {hasLoggedResult
                ? 'You have logged your race result.'
                : 'Log how your race went to complete your training journey.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasLoggedResult ? (
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Status:</span>{' '}
                  {race.completionStatus === RaceCompletionStatus.Completed && 'Completed'}
                  {race.completionStatus === RaceCompletionStatus.DNS && 'Did Not Start'}
                  {race.completionStatus === RaceCompletionStatus.DNF && 'Did Not Finish'}
                </p>
                {race.raceResult && (
                  <p className="text-sm">
                    <span className="font-medium">Finish Time:</span> {race.raceResult}
                  </p>
                )}
                {race.resultLoggedAt && (
                  <p className="text-xs text-muted-foreground">
                    Logged on {new Date(race.resultLoggedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <Button onClick={() => setShowResultDialog(true)}>Log Race Result</Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Training Plan Calendar */}
      {plan ? (
        <>
          {hasCycleTracking && <CyclePhaseLegend />}

          <Card>
            <CardHeader>
              <CardTitle>Training Log</CardTitle>
              <CardDescription>
                {plan.planName} - {plan.sessions.length} sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="space-y-2">
                {months.map((month) => (
                  <AccordionItem key={month.key} value={month.key}>
                    <AccordionTrigger className="text-lg font-medium">
                      {month.label}
                    </AccordionTrigger>
                    <AccordionContent>
                      <MonthView
                        year={month.year}
                        month={month.month}
                        sessions={sessionsByMonth.get(month.key) || []}
                        cyclePhases={cyclePhases}
                      />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </>
      ) : (
        <Alert>
          <AlertDescription>
            No training plan found for this race. Create a training plan to start tracking your progress.
          </AlertDescription>
        </Alert>
      )}

      {/* Race Result Dialog */}
      <RaceResultDialog
        open={showResultDialog}
        onOpenChange={setShowResultDialog}
        onSubmit={handleLogResult}
      />
    </div>
  )
}
