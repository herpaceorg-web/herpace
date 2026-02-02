import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'
import { CyclePhase, CycleRegularity } from '@/types/api'
import type { PlanDetailResponse, ProfileResponse, SessionSummary } from '@/types/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { MonthView } from '@/components/calendar/MonthView'
import { CyclePhaseLegend } from '@/components/calendar/CyclePhaseLegend'
import { generateCyclePhasesForRange } from '@/utils/cyclePhases'

interface MonthInfo {
  key: string // "2026-02"
  label: string // "February 2026"
  year: number
  month: number // 0-11 (JS Date convention)
}

export default function TrainingHistory() {
  const [plan, setPlan] = useState<PlanDetailResponse | null>(null)
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cyclePhases, setCyclePhases] = useState<Map<string, CyclePhase>>(new Map())
  const [sessionsByMonth, setSessionsByMonth] = useState<Map<string, SessionSummary[]>>(new Map())
  const [months, setMonths] = useState<MonthInfo[]>([])

  useEffect(() => {
    loadHistoryData()
  }, [])

  const loadHistoryData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [planData, profileData] = await Promise.all([
        api.get<PlanDetailResponse>('/api/plans/active'),
        api.get<ProfileResponse>('/api/profiles/me')
      ])

      setPlan(planData)
      setProfile(profileData)

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
    } catch (err: unknown) {
      console.error('Failed to load training history:', err)
      setError('Failed to load training history. Please try again.')
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
      <Alert variant="destructive">
        <AlertDescription>No active training plan found.</AlertDescription>
      </Alert>
    )
  }

  const hasCycleTracking =
    profile?.typicalCycleRegularity !== CycleRegularity.DoNotTrack &&
    cyclePhases.size > 0

  const raceDate = new Date(plan.raceDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  const currentDate = new Date()
  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  const defaultMonth = months.some((month) => month.key === currentMonthKey)
    ? currentMonthKey
    : months[months.length - 1]?.key

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-2">Training History</h1>
        <p className="text-lg opacity-90">
          {plan.planName} - {plan.raceName} on {raceDate}
        </p>
      </div>

      {hasCycleTracking && <CyclePhaseLegend />}

      <Card>
        <CardHeader>
          <CardTitle>Training Log</CardTitle>
          <CardDescription>All scheduled sessions for this plan.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible defaultValue={defaultMonth} className="space-y-2">
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
    </div>
  )
}
