import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api-client'
import { CyclePhase, CycleRegularity } from '@/types/api'
import type { PlanDetailResponse, ProfileResponse, SessionSummary } from '@/types/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { MonthView } from '@/components/calendar/MonthView'
import { CyclePhaseLegend } from '@/components/calendar/CyclePhaseLegend'
import { generateCyclePhasesForRange } from '@/utils/cyclePhases'

interface MonthInfo {
  key: string // "2026-02"
  label: string // "February 2026"
  year: number
  month: number // 0-11 (JS Date convention)
  isCurrent: boolean
}

export default function Calendar() {
  const navigate = useNavigate()
  const [plan, setPlan] = useState<PlanDetailResponse | null>(null)
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cyclePhases, setCyclePhases] = useState<Map<string, CyclePhase>>(new Map())
  const [sessionsByMonth, setSessionsByMonth] = useState<Map<string, SessionSummary[]>>(new Map())
  const [months, setMonths] = useState<MonthInfo[]>([])

  useEffect(() => {
    loadCalendarData()
  }, [])

  const loadCalendarData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch plan and profile in parallel
      const [planData, profileData] = await Promise.all([
        api.get<PlanDetailResponse>('/api/plans/active'),
        api.get<ProfileResponse>('/api/profiles/me')
      ])

      setPlan(planData)
      setProfile(profileData)

      // Calculate cycle phases if cycle tracking is enabled
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
      const currentDate = new Date()
      const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

      const monthDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
      const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1)

      while (monthDate <= endMonth) {
        const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`
        const isCurrent = monthKey === currentMonthKey

        monthsList.push({
          key: monthKey,
          label: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          year: monthDate.getFullYear(),
          month: monthDate.getMonth(),
          isCurrent
        })

        monthDate.setMonth(monthDate.getMonth() + 1)
      }

      setMonths(monthsList)
    } catch (err: unknown) {
      console.error('Failed to load calendar data:', err)
      setError('Failed to load training calendar. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

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

  if (!plan) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">
            No active training plan found.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    )
  }

  const hasCycleTracking =
    profile?.typicalCycleRegularity !== CycleRegularity.DoNotTrack &&
    cyclePhases.size > 0

  // Split months into current and future
  const currentMonth = months.find(m => m.isCurrent)
  const futureMonths = months.filter(m => !m.isCurrent)

  // Format race date
  const raceDate = new Date(plan.raceDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-2">Training Calendar</h1>
        <p className="text-lg opacity-90">
          {plan.planName} • {plan.raceName} on {raceDate}
        </p>
      </div>

      {/* Cycle Phase Legend */}
      {hasCycleTracking && <CyclePhaseLegend />}

      {/* Current Month */}
      {currentMonth && (
        <Card>
          <CardHeader>
            <CardTitle>{currentMonth.label}</CardTitle>
            <CardDescription>Current training month</CardDescription>
          </CardHeader>
          <CardContent>
            <MonthView
              year={currentMonth.year}
              month={currentMonth.month}
              sessions={sessionsByMonth.get(currentMonth.key) || []}
              cyclePhases={cyclePhases}
            />
          </CardContent>
        </Card>
      )}

      {/* Future Months (Accordion) */}
      {futureMonths.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Future Months</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {futureMonths.map(month => (
              <AccordionItem key={month.key} value={month.key}>
                <AccordionTrigger className="text-lg font-medium">
                  {month.label}
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardContent className="pt-6">
                      <MonthView
                        year={month.year}
                        month={month.month}
                        sessions={sessionsByMonth.get(month.key) || []}
                        cyclePhases={cyclePhases}
                      />
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  )
}
